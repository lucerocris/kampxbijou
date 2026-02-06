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

export async function uploadToS3(
  params: UploadParams,
  config?: S3Config
): Promise<{ key: string; url: string }> {
  // Load config from params or environment variables
  const bucket = config?.bucket || process.env.S3_BUCKET;
  const publicBaseUrl = config?.publicBaseUrl || process.env.S3_PUBLIC_BASE_URL;
  const region = process.env.S3_REGION || 'sgp1';
  const endpoint = normalizeEndpoint(process.env.S3_ENDPOINT);

  if (!bucket) throw new Error('S3_BUCKET is not configured');
  if (!publicBaseUrl) throw new Error('S3_PUBLIC_BASE_URL is not configured');

  // If the region isn't an AWS-looking region, enforce an explicit endpoint.
  // Otherwise, the SDK may construct an invalid hostname like: s3.sgp1.amazonaws.com
  if (!isLikelyAwsRegion(region) && !endpoint) {
    throw new Error(
      `S3_ENDPOINT is required when using non-AWS region \`${region}\`. ` +
        `Set S3_ENDPOINT (e.g., https://sgp1.digitaloceanspaces.com).`
    );
  }

  // Initialize S3 client (Works for AWS and DigitalOcean Spaces)
  const s3Client =
    config?.s3 ||
    new S3Client({
      region,
      endpoint,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
      },
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
    });

  try {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: params.key,
      Body: params.body,
      ContentType: params.contentType,
      ACL: 'public-read',
    });

    await s3Client.send(command);

    // Construct the public URL
    // Removes trailing slash from base and ensures single slash before key
    const normalizedBase = publicBaseUrl.replace(/\/$/, '');
    const url = `${normalizedBase}/${params.key}`;

    return { key: params.key, url };
  } catch (err) {
    console.error('[s3] Upload failed:', err);
    // Re-throw to let the API handler manage the error response
    throw err;
  }
}