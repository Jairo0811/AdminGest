import { describe, expect, it } from 'vitest';
import { ApiError, errorFromResponse, networkError, shouldRetry } from './errors';

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

describe('errorFromResponse', () => {
  it('distinguishes an unconfigured API from wrong credentials', async () => {
    const notConfigured = await errorFromResponse(
      json(503, {
        message: 'La API de AdminGest todavía no está configurada.',
        code: 'API_NOT_CONFIGURED',
      }),
    );
    expect(notConfigured.kind).toBe('not-configured');
    expect(notConfigured.isServiceProblem).toBe(true);
    expect(notConfigured.message).not.toMatch(/credenciales/i);

    const credentials = await errorFromResponse(json(401, { message: 'Credenciales inválidas.' }));
    expect(credentials.kind).toBe('auth');
    expect(credentials.isServiceProblem).toBe(false);
    expect(credentials.message).toBe('Credenciales inválidas.');
  });

  it('reports a sleeping or unreachable server without showing the provider HTML page', async () => {
    const html = new Response('<html><body>502 Bad Gateway - render.com</body></html>', {
      status: 502,
      headers: { 'content-type': 'text/html' },
    });
    const error = await errorFromResponse(html);
    expect(error.kind).toBe('unavailable');
    expect(error.message).not.toMatch(/render|<html/i);

    expect((await errorFromResponse(json(502, { code: 'API_UNREACHABLE' }))).kind).toBe(
      'unavailable',
    );
  });

  it('reports a database outage, validation, permission and rate-limit errors distinctly', async () => {
    expect((await errorFromResponse(json(503, { code: 'DATABASE_UNAVAILABLE' }))).kind).toBe(
      'database',
    );
    const validation = await errorFromResponse(
      json(400, { message: ['nombre es obligatorio', 'correo inválido'] }),
    );
    expect(validation).toMatchObject({
      kind: 'validation',
      message: 'nombre es obligatorio, correo inválido',
    });
    expect((await errorFromResponse(json(403, { message: 'Sin permiso' }))).kind).toBe('forbidden');
    expect(
      (await errorFromResponse(json(403, { code: 'REGISTRATION_DISABLED', message: 'Cerrado' })))
        .kind,
    ).toBe('registration-disabled');
    expect((await errorFromResponse(json(429, {}))).message).toMatch(/Demasiadas solicitudes/);
  });

  it('describes network failures in Spanish instead of "Failed to fetch"', () => {
    const error = networkError();
    expect(error.kind).toBe('network');
    expect(error.message).toMatch(/conexión/);
  });
});

describe('shouldRetry', () => {
  it('never retries rejected requests or an unconfigured API, and retries a down server once', () => {
    expect(shouldRetry(0, new ApiError('x', 400))).toBe(false);
    expect(shouldRetry(0, new ApiError('x', 401))).toBe(false);
    expect(shouldRetry(0, new ApiError('x', 503, 'not-configured'))).toBe(false);
    expect(shouldRetry(0, new ApiError('x', 503, 'database'))).toBe(false);
    expect(shouldRetry(0, new ApiError('x', 502))).toBe(true);
    expect(shouldRetry(1, new ApiError('x', 502))).toBe(false);
    expect(shouldRetry(0, networkError())).toBe(true);
  });
});
