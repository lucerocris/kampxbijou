import { NextRequest, NextResponse } from 'next/server';
import { uploadToS3 } from '@/lib/s3';

export const runtime = 'nodejs';

function isDebugEnabled(): boolean {
  return process.env.S3_DEBUG === '1' || process.env.S3_DEBUG === 'true';
}

export async function POST(req: NextRequest) {
  const reqId = crypto.randomUUID();

  try {
    if (isDebugEnabled()) {
      console.log('[upload-proof] request start', {
        reqId,
        contentType: req.headers.get('content-type'),
        contentLength: req.headers.get('content-length'),
      });
    }

    const form = await req.formData();
    const file = form.get('file');

    if (!(file instanceof File)) {
      if (isDebugEnabled()) {
        console.log('[upload-proof] missing file', { reqId, keys: Array.from(form.keys()) });
      }
      return NextResponse.json({ error: 'file is required' }, { status: 400 });
    }

    // Basic guardrails
    const maxBytes = 10 * 1024 * 1024; // 10MB
    if (file.size > maxBytes) {
      if (isDebugEnabled()) {
        console.log('[upload-proof] file too large', { reqId, size: file.size, maxBytes });
      }
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 413 });
    }

    const allowed = new Set([
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
    ]);

    if (file.type && !allowed.has(file.type)) {
      if (isDebugEnabled()) {
        console.log('[upload-proof] unsupported type', { reqId, type: file.type });
      }
      return NextResponse.json(
        { error: 'Unsupported file type. Use JPG, PNG, WEBP, or PDF.' },
        { status: 400 }
      );
    }

    if (isDebugEnabled()) {
      console.log('[upload-proof] file received', {
        reqId,
        name: file.name,
        type: file.type,
        size: file.size,
      });
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const safeName = file.name.replace(/[^\w.\-]+/g, '_');
    const key = `registrations/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}_${safeName}`;

    if (isDebugEnabled()) {
      console.log('[upload-proof] uploading', {
        reqId,
        key,
        byteLength: bytes.byteLength,
      });
    }

    const { key: objectKey, url } = await uploadToS3({
      key,
      body: bytes,
      contentType: file.type || 'application/octet-stream',
    });

    if (isDebugEnabled()) {
      console.log('[upload-proof] upload ok', { reqId, objectKey, url });
    }

    return NextResponse.json({ ok: true, key: objectKey, url }, { status: 201 });
  } catch (err) {
    const e = err as { message?: string; name?: string };
    console.error('[upload-proof] failed', { reqId, name: e?.name, message: e?.message });

    // Return the message to help debugging (no secrets included).
    return NextResponse.json(
      { error: e?.message || 'Failed to upload proof', reqId },
      { status: 500 }
    );
  }
}
