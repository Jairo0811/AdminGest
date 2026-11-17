/**
 * Cloudflare Pages Function: proxy /api/* to the existing NestJS origin.
 *
 * Keep the browser on the Pages origin so that HttpOnly + SameSite=Strict
 * refresh cookies work without exposing the database or JWT secrets.
 *
 * Configure API_ORIGIN in Pages > Settings > Variables and Secrets.
 */
const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'private, no-store, max-age=0',
};

function errorResponse(status, message) {
  return new Response(JSON.stringify({ message }), {
    status,
    headers: JSON_HEADERS,
  });
}

export async function onRequest(context) {
  const incoming = new URL(context.request.url);

  if (incoming.pathname !== '/api' && !incoming.pathname.startsWith('/api/')) {
    return errorResponse(404, 'Ruta no encontrada.');
  }

  const configuredOrigin = context.env.API_ORIGIN;
  if (typeof configuredOrigin !== 'string' || !configuredOrigin.trim()) {
    return errorResponse(503, 'La API de AdminGest todavía no está configurada.');
  }

  let upstream;
  try {
    upstream = new URL(configuredOrigin.trim());
    if (
      upstream.protocol !== 'https:' ||
      upstream.username ||
      upstream.password ||
      upstream.search ||
      upstream.hash ||
      (upstream.pathname !== '/' && upstream.pathname !== '') ||
      upstream.origin === incoming.origin
    ) {
      throw new Error('Invalid upstream origin');
    }
  } catch {
    return errorResponse(503, 'La dirección de la API no es válida.');
  }

  // The destination is fixed by the server-side API_ORIGIN binding.
  // Incoming requests may only select an /api path and its query parameters.
  const destination = new URL(incoming.pathname + incoming.search, upstream);
  const headers = new Headers(context.request.headers);

  // Do not trust user-controlled forwarding headers sent by browsers.
  for (const name of [
    'host',
    'connection',
    'forwarded',
    'x-forwarded-for',
    'x-forwarded-host',
    'x-forwarded-proto',
    'x-real-ip',
  ]) {
    headers.delete(name);
  }

  headers.set('x-forwarded-host', incoming.host);
  headers.set('x-forwarded-proto', 'https');

  const clientIp = context.request.headers.get('cf-connecting-ip');
  if (clientIp) headers.set('x-forwarded-for', clientIp);

  try {
    // Forward incoming cookies (including refresh) and preserve upstream
    // Set-Cookie headers on the response. Never use follow redirects here.
    const upstreamRequest = new Request(destination, context.request);
    for (const key of [...upstreamRequest.headers.keys()]) {
      upstreamRequest.headers.delete(key);
    }
    for (const [key, value] of headers) {
      upstreamRequest.headers.set(key, value);
    }

    const response = await fetch(upstreamRequest, { redirect: 'manual' });
    const responseHeaders = new Headers(response.headers);
    responseHeaders.set('cache-control', 'private, no-store, max-age=0');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch {
    // Avoid leaking backend hostnames, credentials, or exception messages.
    return errorResponse(502, 'La API de AdminGest no está disponible.');
  }
}
