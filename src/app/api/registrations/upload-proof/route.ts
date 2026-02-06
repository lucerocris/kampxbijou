import { NextRequest, NextResponse } from 'next/server';
import { uploadToS3 } from '@/lib/s3'; // Ensure this path matches your project structure

export const runtime = 'nodejs';

// Helper to check if debug mode is on
const isDebug = process.env.S3_DEBUG === 'true' || process.env.S3_DEBUG === '1';

export async function POST(req: NextRequest) {
  const reqId = crypto.randomUUID();

  try {
    if (isDebug) console.log(`[${reqId}] Upload request started`);

    const form = await req.formData();
    const file = form.get('file');

    // 1. Validate File Existence
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    // 2. Validate File Size (Max 10MB)
    const maxBytes = 10 * 1024 * 1024;
    if (file.size > maxBytes) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 413 });
    }

    // 3. Validate File Type
    const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
    if (!allowedTypes.has(file.type)) {
      return NextResponse.json(
          { error: 'Unsupported file type. Use JPG, PNG, WEBP, or PDF.' },
          { status: 400 }
      );
    }

    // 4. Prepare File
    const bytes = new Uint8Array(await file.arrayBuffer());

    // Sanitize filename to prevent issues with special characters in URLs
    const safeName = file.name.replace(/[^\w.\-]+/g, '_');
    const dateFolder = new Date().toISOString().slice(0, 10);
    const key = `registrations/${dateFolder}/${crypto.randomUUID()}_${safeName}`;

    if (isDebug) console.log(`[${reqId}] Uploading ${file.size} bytes to ${key}`);

    // 5. Upload
    const { key: objectKey, url } = await uploadToS3({
      key,
      body: bytes,
      contentType: file.type || 'application/octet-stream',
    });

    if (isDebug) console.log(`[${reqId}] Upload successful: ${url}`);

    return NextResponse.json({ ok: true, key: objectKey, url }, { status: 201 });

  } catch (err) {
    const error = err as Error;
    console.error(`[${reqId}] Upload failed:`, error.message);

    return NextResponse.json(
        { error: 'Failed to upload proof. Please try again.' },
        { status: 500 }
    );
  }
}