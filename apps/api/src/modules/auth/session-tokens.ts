import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';

export const REFRESH_TTL_DAYS = 7;
export const REFRESH_COOKIE_NAME = 'admingest_refresh';

export function generateRefreshToken() {
  const id = randomUUID();
  const secret = randomBytes(48).toString('base64url');
  return {
    id,
    token: id + '.' + secret,
    hash: hashRefreshSecret(secret),
  };
}

export function hashRefreshSecret(secret: string): string {
  return createHash('sha256').update(secret).digest('hex');
}

export function parseRefreshToken(token: string | undefined) {
  if (!token || token.length > 200) return null;
  const match = /^([a-f0-9-]{36})\.([A-Za-z0-9_-]{64})$/.exec(token);
  return match ? { id: match[1], hash: hashRefreshSecret(match[2]) } : null;
}

export function hashesMatch(expected: string, received: string): boolean {
  if (expected.length !== 64 || received.length !== 64) return false;
  return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(received, 'hex'));
}

export function refreshCookieValue(header: string | undefined): string | undefined {
  const cookie = header?.split(';').map((part) => part.trim())
    .find((part) => part.startsWith(REFRESH_COOKIE_NAME + '='));
  if (!cookie) return undefined;
  try { return decodeURIComponent(cookie.slice(REFRESH_COOKIE_NAME.length + 1)); }
  catch { return undefined; }
}
