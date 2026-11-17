import { createHash, timingSafeEqual } from 'node:crypto';
import { isIP } from 'node:net';
import type { NextFunction, Request, Response } from 'express';

/**
 * Same-origin deployment: Browser → Cloudflare Pages Function (/api/*) → NestJS.
 *
 * Every request reaches the API from Cloudflare's egress addresses, so request.ip is not
 * the visitor and rate limits would be shared by all users. The Pages Function therefore
 * sends a shared secret (API_PROXY_SECRET) and the visitor's address. When the secret is
 * configured, the API:
 *   - rejects requests that do not come through the Function (direct calls to the backend
 *     URL), except the health checks used by the hosting platform;
 *   - uses the address sent by the Function for throttling, sessions and audit.
 * Without the secret (local development, CI) the API behaves as before.
 */
export const PROXY_SECRET_HEADER = 'x-admingest-proxy-secret';
export const CLIENT_IP_HEADER = 'x-admingest-client-ip';
export const MIN_PROXY_SECRET_LENGTH = 32;

const PUBLIC_PATHS = new Set(['/api/health', '/api/health/ready']);

type ProxiedRequest = Request & { clientIp?: string };

const digest = (value: string) => createHash('sha256').update(value).digest();

const sameSecret = (provided: string, expected: string) =>
  timingSafeEqual(digest(provided), digest(expected));

const singleHeader = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export function trustedProxyMiddleware(secret: string | undefined) {
  const expected = secret?.trim() || undefined;
  return (request: ProxiedRequest, response: Response, next: NextFunction) => {
    const provided = singleHeader(request.headers[PROXY_SECRET_HEADER]);
    const forwardedIp = singleHeader(request.headers[CLIENT_IP_HEADER])?.trim();
    // Never let these headers reach the application or the logs.
    delete request.headers[PROXY_SECRET_HEADER];
    delete request.headers[CLIENT_IP_HEADER];

    if (!expected) {
      request.clientIp = request.ip;
      return next();
    }

    const path = (request.originalUrl ?? request.url).split('?')[0].replace(/\/+$/, '');
    const fromProxy = typeof provided === 'string' && sameSecret(provided, expected);

    if (!fromProxy) {
      if (PUBLIC_PATHS.has(path)) {
        request.clientIp = request.ip;
        return next();
      }
      response.status(403).json({
        statusCode: 403,
        message: 'Acceso directo no permitido. Usa la dirección pública de AdminGest.',
        error: 'Forbidden',
        code: 'DIRECT_ACCESS_FORBIDDEN',
      });
      return;
    }

    request.clientIp = forwardedIp && isIP(forwardedIp) ? forwardedIp : request.ip;
    next();
  };
}

/** Visitor address for throttling, sessions and audit. */
export const clientIpOf = (request: Request): string | undefined =>
  (request as ProxiedRequest).clientIp ?? request.ip;
