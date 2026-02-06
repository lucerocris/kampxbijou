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

function truthyEnv(value: string | undefined): boolean {
  return value === '1' || value === 'true' || value === 'TRUE' || value === 'yes' || value === 'YES';
}

function shouldSendPublicReadACL(): boolean {
  // Back-compat / explicit overrides:
  // - If ACLs are disabled, never send.
  // - If S3_ENABLE_ACL is set, respect it.
  // - Otherwise default to sending ACL to make the object public.
  if (truthyEnv(process.env.S3_DISABLE_ACL)) return false;
  if (process.env.S3_ENABLE_ACL != null) return truthyEnv(process.env.S3_ENABLE_ACL);
  return true;
}

export async function uploadToS3(
    params: UploadParams,
    config?: S3Config
): Promise<{ key: string; url: string }> {
  const bucket = config?.bucket || process.env.S3_BUCKET;
  const publicBaseUrl = config?.publicBaseUrl || process.env.S3_PUBLIC_BASE_URL;

  if (!bucket) {
    throw new Error('S3_BUCKET is not configured');
  }

  if (!publicBaseUrl) {
    throw new Error('S3_PUBLIC_BASE_URL is not configured');
  }

  // Initialize S3 client with DigitalOcean Spaces settings
  const s3Client = config?.s3 || new S3Client({
    region: process.env.S3_REGION || 'sgp1',
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
  });

  const wantAcl = shouldSendPublicReadACL();

  const basePutParams = {
    Bucket: bucket,
    Key: params.key,
    Body: params.body,
    ContentType: params.contentType,
  };

  const sendWithOptionalAcl = async (includeAcl: boolean) => {
    const command = new PutObjectCommand({
      ...basePutParams,
      ...(includeAcl ? { ACL: 'public-read' } : {}),
    });
    return s3Client.send(command);
  };

  try {
    await sendWithOptionalAcl(wantAcl);
  } catch (err) {
    const error = err as Error & { Code?: string; name?: string; $metadata?: any };

    // Common cases when ACLs are disabled: AccessDenied / InvalidRequest
    // If we attempted ACL and it failed, retry once without ACL.
    if (wantAcl) {
      const code = (error as any).Code || (error as any).code || error.name;
      const retryableAclFailure =
        code === 'AccessDenied' ||
        code === 'InvalidRequest' ||
        code === 'InvalidArgument' ||
        code === 'NotImplemented';

      if (retryableAclFailure) {
        console.warn('[s3] Upload with ACL failed; retrying without ACL', {
          message: error.message,
          code,
          metadata: error.$metadata,
        });

        await sendWithOptionalAcl(false);
      } else {
        console.error('[s3] Upload failed:', {
          message: error.message,
          code,
          metadata: error.$metadata,
        });
        throw error;
      }
    } else {
      console.error('[s3] Upload failed:', {
        message: error.message,
        code: error.Code,
        metadata: error.$metadata,
      });
      throw error;
    }
  }

  // Build URL, avoiding double slashes
  const baseUrl = publicBaseUrl.replace(/\/$/, '');
  const url = `${baseUrl}/${params.key}`;

  return { key: params.key, url };
}