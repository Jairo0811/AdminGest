import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../functions/api/[[path]].js', import.meta.url), 'utf8');
const { onRequest } = await import(
  'data:text/javascript;base64,' + Buffer.from(source).toString('base64')
);

function context(path = '/api/health', origin = 'https://backend.example.test', init = {}) {
  return {
    request: new Request('https://admingest.pages.dev' + path, init),
    env: origin === null ? {} : { API_ORIGIN: origin },
  };
}

test('responds 503 without an API backend (no fake success or SPA HTML)', async () => {
  const response = await onRequest(context('/api/auth/refresh', null));
  assert.equal(response.status, 503);
  assert.equal(response.headers.get('cache-control'), 'private, no-store, max-age=0');
  assert.match((await response.json()).message, /todavía no está configurada/);
});

test('fails closed on unsafe upstream configuration', async () => {
  for (const origin of [
    'http://backend.example.test',
    'https://user:pass@backend.example.test',
    'https://backend.example.test/path',
    'https://admingest.pages.dev',
  ]) {
    const response = await onRequest(context('/api/health', origin));
    assert.equal(response.status, 503);
  }
});

test('proxies API requests with same-origin cookies and never caches responses', async () => {
  const originalFetch = globalThis.fetch;
  let sent;
  globalThis.fetch = async (request, options) => {
    sent = { request, options };
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        'content-type': 'application/json',
        'set-cookie': 'admingest_refresh=opaque; HttpOnly; Secure; SameSite=Strict; Path=/api/auth',
      },
    });
  };

  try {
    const response = await onRequest(
      context('/api/auth/refresh?test=1', 'https://backend.example.test', {
        method: 'POST',
        headers: {
          cookie: 'admingest_refresh=old',
          origin: 'https://admingest.pages.dev',
          'cf-connecting-ip': '203.0.113.15',
          'x-forwarded-for': '1.1.1.1',
          'x-forwarded-host': 'attacker.test',
        },
      }),
    );

    assert.equal(sent.request.url, 'https://backend.example.test/api/auth/refresh?test=1');
    assert.equal(sent.request.method, 'POST');
    assert.equal(sent.request.headers.get('cookie'), 'admingest_refresh=old');
    assert.equal(sent.request.headers.get('origin'), 'https://admingest.pages.dev');
    assert.equal(sent.request.headers.get('x-forwarded-host'), 'admingest.pages.dev');
    assert.equal(sent.request.headers.get('x-forwarded-for'), '203.0.113.15');
    assert.equal(sent.options.redirect, 'manual');
    assert.equal(response.status, 200);
    assert.match(response.headers.get('set-cookie'), /HttpOnly/);
    assert.equal(response.headers.get('cache-control'), 'private, no-store, max-age=0');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('does not follow redirects and returns 502 for unreachable API', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new Error('Sensitive backend connection details');
  };
  try {
    const response = await onRequest(context('/api/health/ready'));
    assert.equal(response.status, 502);
    assert.doesNotMatch(await response.text(), /Sensitive backend/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('rejects requests outside the /api namespace', async () => {
  const response = await onRequest(context('/admin'));
  assert.equal(response.status, 404);
});
