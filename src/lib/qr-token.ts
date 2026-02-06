import crypto from 'crypto';

// NOTE: During the Firebase -> Supabase migration we allow the app to build
// even when QR_SECRET_KEY isn't configured.
// In production you should set QR_SECRET_KEY to a strong secret.
const SECRET = process.env.QR_SECRET_KEY || 'dev-insecure-qr-secret';

/**
 * Create a signed token: registrationId|exp|signature
 */
export function createQRToken(registrationId: string, expiryDays = 7): string {
  const exp = Math.floor(Date.now() / 1000) + expiryDays * 24 * 60 * 60;
  const payload = `${registrationId}|${exp}`;

  const signature = crypto
    .createHmac('sha256', SECRET)
    .update(payload)
    .digest('hex')
    .substring(0, 16);

  return `${payload}|${signature}`;
}

/**
 * Verify and decode QR token
 * Returns registrationId or null if invalid/expired
 */
export function verifyQRToken(token: string): string | null {
  try {
    const [registrationId, expStr, signature] = token.split('|');

    if (!registrationId || !expStr || !signature) return null;

    const exp = parseInt(expStr);

    // Check expiry
    if (Date.now() / 1000 > exp) return null;

    // Verify signature
    const payload = `${registrationId}|${exp}`;
    const expectedSig = crypto
      .createHmac('sha256', SECRET)
      .update(payload)
      .digest('hex')
      .substring(0, 16);

    if (signature !== expectedSig) return null;

    return registrationId;
  } catch {
    return null;
  }
}
