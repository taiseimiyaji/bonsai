import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

const SEPARATOR = '.';

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error('AUTH_SECRET environment variable is required');
  }
  return secret;
}

function hmac(data: string): string {
  return createHmac('sha256', getSecret()).update(data).digest('base64url');
}

function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

const TOKEN_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Why: one-time token store to prevent replay attacks
// Limitation: in-memory storage — not shared across multiple server instances or serverless environments.
// For production multi-instance deployments, migrate to Redis or similar shared store.
const consumedTokens = new Map<string, number>();

function evictExpiredTokens(): void {
  const now = Date.now();
  for (const [token, expiry] of consumedTokens) {
    if (now > expiry) {
      consumedTokens.delete(token);
    }
  }
}

export function createAuthToken(userId: string): string {
  const nonce = randomBytes(16).toString('base64url');
  const iat = Date.now();
  const payload = `${userId}${SEPARATOR}${nonce}${SEPARATOR}${iat}`;
  const signature = hmac(payload);
  return `${payload}${SEPARATOR}${signature}`;
}

export function verifyAndConsumeAuthToken(token: string): string | null {
  if (!token) return null;

  const parts = token.split(SEPARATOR);
  if (parts.length !== 4) return null;

  const [userId, nonce, iatStr, signature] = parts;
  const payload = `${userId}${SEPARATOR}${nonce}${SEPARATOR}${iatStr}`;
  const expected = hmac(payload);

  if (!safeCompare(signature, expected)) return null;

  const iat = Number(iatStr);
  if (!Number.isFinite(iat) || Date.now() - iat > TOKEN_TTL_MS) return null;

  evictExpiredTokens();

  if (consumedTokens.has(token)) return null;

  consumedTokens.set(token, Date.now() + TOKEN_TTL_MS);
  return userId;
}

export function signCookie(value: string): string {
  const iat = Date.now();
  const dataWithIat = `${value}${SEPARATOR}${iat}`;
  const signature = hmac(dataWithIat);
  return `${dataWithIat}${SEPARATOR}${signature}`;
}

export function verifyCookie(signed: string): string | null {
  if (!signed) return null;

  const lastDotIndex = signed.lastIndexOf(SEPARATOR);
  if (lastDotIndex === -1) return null;

  const dataWithIat = signed.substring(0, lastDotIndex);
  const signature = signed.substring(lastDotIndex + 1);

  if (!dataWithIat || !signature) return null;

  const expected = hmac(dataWithIat);
  if (!safeCompare(signature, expected)) return null;

  // Extract iat from dataWithIat (format: value.iat)
  const iatDotIndex = dataWithIat.lastIndexOf(SEPARATOR);
  if (iatDotIndex === -1) return null;

  const value = dataWithIat.substring(0, iatDotIndex);
  const iatStr = dataWithIat.substring(iatDotIndex + 1);
  const iat = Number(iatStr);

  if (!Number.isFinite(iat) || Date.now() - iat > TOKEN_TTL_MS) return null;

  return value;
}
