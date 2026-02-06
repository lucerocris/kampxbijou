import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

interface UploadParams {
  key: string;
  body: Uint8Array;
  contentType: string;
}

interface S3Config {
  bucket?: string;
  publicBaseUrl?: string;
  s3?: S3Client;
  /** Correlate logs across route + S3 helper. */
  reqId?: string;
  /** Enables verbose logs (still safe, no secrets). Defaults to S3_DEBUG env. */
  debug?: boolean;
}

type AwsSdkErrorLike = {
  name?: string;
  message?: string;
  stack?: string;
  Code?: string;
  code?: string;
  $metadata?: {
    httpStatusCode?: number;
    requestId?: string;
    extendedRequestId?: string;
    attempts?: number;
    totalRetryDelay?: number;
  };
  cause?: unknown;
};

type PutObjectResultLike = {
  ETag?: string;
  $metadata?: Record<string, unknown>;
};

function log(level: 'log' | 'warn' | 'error', payload: Record<string, unknown>) {
  // Always log as JSON for easier filtering in production.
  const line = JSON.stringify({ ts: new Date().toISOString(), ...payload });
  // eslint-disable-next-line no-console
  console[level](line);
}

function isLikelyAwsRegion(region: string): boolean {
  // Minimal heuristic: AWS regions are like us-east-1, ap-southeast-1, etc.
  return /^[a-z]{2}-[a-z]+-\d$/.test(region);
}

function normalizeEndpoint(endpoint?: string): string | undefined {
  if (!endpoint) return undefined;
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) return endpoint;
  return `https://${endpoint}`;
}

function serializeAwsError(err: unknown): Record<string, unknown> {
  if (!err || typeof err !== 'object') return { raw: err };
  const e = err as AwsSdkErrorLike;
  const meta = e.$metadata;

  return {
    name: e.name,
    message: e.message,
    code: e.code ?? e.Code,
    httpStatusCode: meta?.httpStatusCode,
    requestId: meta?.requestId,
    extendedRequestId: meta?.extendedRequestId,
    attempts: meta?.attempts,
    totalRetryDelay: meta?.totalRetryDelay,
    // Keep stack only in debug mode (route controls whether to print it)
    stack: e.stack,
    cause: e.cause,
  };
}

export async function uploadToS3(
  params: UploadParams,
  config?: S3Config
): Promise<{ key: string; url: string }> {
  const debug = config?.debug ?? (process.env.S3_DEBUG === 'true' || process.env.S3_DEBUG === '1');
  const reqId = config?.reqId;

  // Load config from params or environment variables
  const bucket = config?.bucket || process.env.S3_BUCKET;
  const publicBaseUrl = config?.publicBaseUrl || process.env.S3_PUBLIC_BASE_URL;
  const region = process.env.S3_REGION || 'sgp1';
  const endpointRaw = process.env.S3_ENDPOINT;
  const endpoint = normalizeEndpoint(endpointRaw);
  const forcePathStyle = process.env.S3_FORCE_PATH_STYLE === 'true';

  if (!bucket) throw new Error('S3_BUCKET is not configured');
  if (!publicBaseUrl) throw new Error('S3_PUBLIC_BASE_URL is not configured');

  // If the region isn't an AWS-looking region, enforce an explicit endpoint.
  // Otherwise, the SDK may construct an invalid hostname like: s3.sgp1.amazonaws.com
  if (!isLikelyAwsRegion(region) && !endpoint) {
    const msg =
      `S3_ENDPOINT is required when using non-AWS region \`${region}\`. ` +
      `Set S3_ENDPOINT (e.g., https://sgp1.digitaloceanspaces.com).`;

    log('error', {
      event: 's3.config.error',
      reqId,
      region,
      endpoint: null,
      message: msg,
    });

    throw new Error(msg);
  }

  // Initialize S3 client (Works for AWS and DigitalOcean Spaces)
  const s3Client = config?.s3 || new S3Client({
    region,
    endpoint,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
    forcePathStyle,
  });

  // Endpoint is critical; log a safe config line even when debug is off.
  log(debug ? 'log' : 'warn', {
    event: 's3.config',
    reqId,
    bucket,
    publicBaseUrl,
    region,
    endpoint: endpoint ?? null,
    endpointFromEnv: Boolean(endpointRaw),
    forcePathStyle,
    hasAccessKeyId: Boolean(process.env.S3_ACCESS_KEY_ID),
    hasSecretAccessKey: Boolean(process.env.S3_SECRET_ACCESS_KEY),
  });

  const started = Date.now();

  try {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: params.key,
      Body: params.body,
      ContentType: params.contentType,
      ACL: 'public-read', // NOTE: may fail if bucket has ObjectOwnership=BucketOwnerEnforced
    });

    if (debug) {
      log('log', {
        event: 's3.putObject.start',
        reqId,
        bucket,
        key: params.key,
        contentType: params.contentType,
        sizeBytes: params.body?.byteLength,
        acl: 'public-read',
      });
    }

    const res = (await s3Client.send(command)) as PutObjectResultLike;

    if (debug) {
      log('log', {
        event: 's3.putObject.ok',
        reqId,
        bucket,
        key: params.key,
        eTag: res.ETag ?? null,
        durationMs: Date.now() - started,
        metadata: res.$metadata ?? null,
      });
    }

    // Construct the public URL
    // Removes trailing slash from base and ensures single slash before key
    const normalizedBase = publicBaseUrl.replace(/\/$/, '');
    const url = `${normalizedBase}/${params.key}`;

    return { key: params.key, url };
  } catch (err) {
    const serialized = serializeAwsError(err);
    const code = (serialized as { code?: unknown }).code;
    const httpStatusCode = (serialized as { httpStatusCode?: unknown }).httpStatusCode;
    const message = (serialized as { message?: unknown }).message;

    // Always log the core error details (safe), even when not in debug.
    log('error', {
      event: 's3.putObject.error',
      reqId,
      bucket,
      key: params.key,
      durationMs: Date.now() - started,
      error: {
        ...serialized,
        // Drop stack unless debug
        stack: debug ? (serialized as { stack?: unknown }).stack : undefined,
      },
      hint:
        code === 'ENOTFOUND' || (typeof message === 'string' && message.includes('getaddrinfo ENOTFOUND'))
          ? 'DNS/endpoint issue. Verify S3_ENDPOINT and outbound DNS from the runtime.'
          : code === 'AccessDenied' || httpStatusCode === 403
            ? 'AccessDenied/403. Check credentials, bucket policy, and (if using ACL) whether bucket ownership disables ACLs.'
            : code === 'InvalidAccessKeyId'
              ? 'Invalid access key id.'
              : code === 'SignatureDoesNotMatch'
                ? 'Signature mismatch. Check secret, region, endpoint, and system clock.'
                : undefined,
    });

    // Re-throw to let the API handler manage the error response
    throw err;
  }
}