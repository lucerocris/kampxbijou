import { NextRequest, NextResponse } from 'next/server';
import { uploadToS3 } from '@/lib/s3'; // Ensure this path matches your project structure

export const runtime = 'nodejs';

// Helper to check if debug mode is on
const isDebug = process.env.S3_DEBUG === 'true' || process.env.S3_DEBUG === '1';

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
  };
  cause?: unknown;
};

function log(level: 'log' | 'warn' | 'error', payload: Record<string, unknown>) {
  const line = JSON.stringify({ ts: new Date().toISOString(), ...payload });
  // eslint-disable-next-line no-console
  console[level](line);
}

export async function POST(req: NextRequest) {
  const reqId = req.headers.get('x-request-id') ?? crypto.randomUUID();
  const started = Date.now();

  try {
    log('log', {
      event: 'uploadProof.start',
      reqId,
      method: req.method,
      contentType: req.headers.get('content-type'),
      userAgent: req.headers.get('user-agent'),
      debug: isDebug,
    });

    const form = await req.formData();
    const file = form.get('file');

    // 1. Validate File Existence
    if (!(file instanceof File)) {
      log('warn', { event: 'uploadProof.validation.noFile', reqId });
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    // 2. Validate File Size (Max 10MB)
    const maxBytes = 10 * 1024 * 1024;
    if (file.size > maxBytes) {
      log('warn', {
        event: 'uploadProof.validation.fileTooLarge',
        reqId,
        sizeBytes: file.size,
        maxBytes,
        fileName: file.name,
        fileType: file.type,
      });
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 413 });
    }

    // 3. Validate File Type
    const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
    if (!allowedTypes.has(file.type)) {
      log('warn', {
        event: 'uploadProof.validation.unsupportedType',
        reqId,
        fileName: file.name,
        fileType: file.type,
      });
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

    log('log', {
      event: 'uploadProof.prepared',
      reqId,
      key,
      sizeBytes: bytes.byteLength,
      fileName: file.name,
      safeName,
      fileType: file.type,
    });

    // 5. Upload
    const { key: objectKey, url } = await uploadToS3(
      {
        key,
        body: bytes,
        contentType: file.type || 'application/octet-stream',
      },
      { reqId, debug: isDebug }
    );

    log('log', {
      event: 'uploadProof.ok',
      reqId,
      key: objectKey,
      url,
      durationMs: Date.now() - started,
    });

    return NextResponse.json({ ok: true, key: objectKey, url }, { status: 201 });
  } catch (err) {
    const e = (err && typeof err === 'object' ? (err as AwsSdkErrorLike) : undefined) as AwsSdkErrorLike | undefined;

    log('error', {
      event: 'uploadProof.error',
      reqId,
      durationMs: Date.now() - started,
      error: {
        name: e?.name,
        message: e?.message,
        code: e?.code ?? e?.Code,
        httpStatusCode: e?.$metadata?.httpStatusCode,
        requestId: e?.$metadata?.requestId,
        extendedRequestId: e?.$metadata?.extendedRequestId,
        // Stack only in debug to reduce noisy/possibly sensitive output
        stack: isDebug ? e?.stack : undefined,
        cause: isDebug ? e?.cause : undefined,
      },
    });

    return NextResponse.json(
      { error: 'Failed to upload proof. Please try again.' },
      { status: 500 }
    );
  }
}