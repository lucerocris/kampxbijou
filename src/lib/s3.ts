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

export async function uploadToS3(
    params: UploadParams,
    config?: S3Config
): Promise<{ key: string; url: string }> {
  // Load config from params or environment variables
  const bucket = config?.bucket || process.env.S3_BUCKET;
  const publicBaseUrl = config?.publicBaseUrl || process.env.S3_PUBLIC_BASE_URL;
  const region = process.env.S3_REGION || 'sgp1';

  if (!bucket) throw new Error('S3_BUCKET is not configured');
  if (!publicBaseUrl) throw new Error('S3_PUBLIC_BASE_URL is not configured');

  // Initialize S3 client (Works for AWS and DigitalOcean Spaces)
  const s3Client = config?.s3 || new S3Client({
    region,
    endpoint: process.env.S3_ENDPOINT, // e.g., https://sgp1.digitaloceanspaces.com
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
    // DigitalOcean requires path style (bucket is in the path, not subdomain) for some regions,
    // though SDK v3 handles this smarter. Safe to keep true or auto.
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
  });

  try {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: params.key,
      Body: params.body,
      ContentType: params.contentType,
      ACL: 'public-read', // <--- Forced Public Access
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