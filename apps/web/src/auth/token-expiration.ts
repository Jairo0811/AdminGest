interface JwtPayload {
  exp?: number;
}

export function getTokenExpiration(token: string): number | null {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(atob(normalized)) as JwtPayload;

    return typeof decoded.exp === 'number' ? decoded.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string, now = Date.now()): boolean {
  const expiration = getTokenExpiration(token);
  return expiration === null || expiration <= now;
}
