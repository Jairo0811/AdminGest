import type { NextFunction, Request, Response } from 'express';
import {
  CLIENT_IP_HEADER,
  clientIpOf,
  PROXY_SECRET_HEADER,
  trustedProxyMiddleware,
} from './trusted-proxy';

const SECRET = 'a'.repeat(40);

function run(secret: string | undefined, path: string, headers: Record<string, string> = {}) {
  const request = {
    originalUrl: path,
    url: path,
    ip: '104.16.0.1',
    headers: { ...headers },
  } as unknown as Request;
  const response = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  const next = jest.fn() as NextFunction;
  trustedProxyMiddleware(secret)(request, response as unknown as Response, next);
  return { request, response, next };
}

describe('trustedProxyMiddleware', () => {
  it('keeps the previous behaviour when no secret is configured', () => {
    const { request, next } = run(undefined, '/api/customers', {
      [CLIENT_IP_HEADER]: '203.0.113.9',
    });
    expect(next).toHaveBeenCalled();
    expect(clientIpOf(request)).toBe('104.16.0.1');
    expect(request.headers[CLIENT_IP_HEADER]).toBeUndefined();
  });

  it('rejects direct calls to the backend but allows health checks', () => {
    const direct = run(SECRET, '/api/auth/login');
    expect(direct.next).not.toHaveBeenCalled();
    expect(direct.response.status).toHaveBeenCalledWith(403);
    expect(direct.response.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'DIRECT_ACCESS_FORBIDDEN' }),
    );

    const wrong = run(SECRET, '/api/customers', { [PROXY_SECRET_HEADER]: 'b'.repeat(40) });
    expect(wrong.next).not.toHaveBeenCalled();

    for (const path of ['/api/health', '/api/health/ready', '/api/health?x=1']) {
      expect(run(SECRET, path).next).toHaveBeenCalled();
    }
  });

  it('uses the visitor address sent by the proxy and removes the secret from the request', () => {
    const { request, next } = run(SECRET, '/api/auth/login', {
      [PROXY_SECRET_HEADER]: SECRET,
      [CLIENT_IP_HEADER]: '203.0.113.9',
    });
    expect(next).toHaveBeenCalled();
    expect(clientIpOf(request)).toBe('203.0.113.9');
    expect(request.headers[PROXY_SECRET_HEADER]).toBeUndefined();
  });

  it('ignores an invalid forwarded address', () => {
    const { request } = run(SECRET, '/api/customers', {
      [PROXY_SECRET_HEADER]: SECRET,
      [CLIENT_IP_HEADER]: 'not-an-ip; DROP TABLE',
    });
    expect(clientIpOf(request)).toBe('104.16.0.1');
  });
});
