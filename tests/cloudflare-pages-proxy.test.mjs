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
  const body = await response.json();
  assert.match(body.message, /todavía no está configurada/);
  assert.equal(body.code, 'API_NOT_CONFIGURED');
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
    const text = await response.text();
    assert.doesNotMatch(text, /Sensitive backend/);
    assert.equal(JSON.parse(text).code, 'API_UNREACHABLE');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('rejects requests outside the /api namespace', async () => {
  const response = await onRequest(context('/admin'));
  assert.equal(response.status, 404);
});

/** Captures the upstream request and answers with the given response. */
async function withUpstream(response, run) {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (request, options) => {
    calls.push({ request, options, body: request.body ? await request.text() : null });
    return typeof response === 'function' ? response() : response.clone();
  };
  try {
    return await run(calls);
  } finally {
    globalThis.fetch = originalFetch;
  }
}

test('forwards every method with its JSON body, query string and Authorization header', async () => {
  for (const method of ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']) {
    await withUpstream(new Response('{"ok":true}', { status: 200 }), async (calls) => {
      const hasBody = !['GET', 'DELETE'].includes(method);
      const response = await onRequest(
        context('/api/customers/1?page=2&q=caf%C3%A9', 'https://backend.example.test', {
          method,
          headers: { authorization: 'Bearer token-123', 'content-type': 'application/json' },
          body: hasBody ? JSON.stringify({ name: 'Cliente ñ' }) : undefined,
        }),
      );
      assert.equal(response.status, 200, method);
      assert.equal(calls[0].request.method, method);
      assert.equal(
        calls[0].request.url,
        'https://backend.example.test/api/customers/1?page=2&q=caf%C3%A9',
      );
      assert.equal(calls[0].request.headers.get('authorization'), 'Bearer token-123');
      if (hasBody) assert.deepEqual(JSON.parse(calls[0].body), { name: 'Cliente ñ' });
    });
  }
});

test('passes empty 204 responses, every Set-Cookie and redirects without following them', async () => {
  await withUpstream(new Response(null, { status: 204 }), async () => {
    const response = await onRequest(
      context('/api/notifications/read-all', undefined, { method: 'PATCH' }),
    );
    assert.equal(response.status, 204);
    assert.equal(await response.text(), '');
  });

  const cookies = new Headers();
  cookies.append('set-cookie', 'a=1; HttpOnly; SameSite=Strict; Path=/api/auth');
  cookies.append('set-cookie', 'b=2; HttpOnly; SameSite=Strict; Path=/api/auth');
  await withUpstream(new Response('{}', { status: 200, headers: cookies }), async () => {
    const response = await onRequest(context('/api/auth/login', undefined, { method: 'POST' }));
    assert.deepEqual(response.headers.getSetCookie(), [
      'a=1; HttpOnly; SameSite=Strict; Path=/api/auth',
      'b=2; HttpOnly; SameSite=Strict; Path=/api/auth',
    ]);
  });

  await withUpstream(
    new Response(null, { status: 302, headers: { location: '/api/health' } }),
    async (calls) => {
      const response = await onRequest(context('/api/legacy'));
      assert.equal(response.status, 302);
      assert.equal(calls[0].options.redirect, 'manual');
    },
  );
});

test('never leaves the configured upstream (no open proxy)', async () => {
  for (const path of [
    '/api//evil.example/x',
    '/api/../../etc',
    '/api/%2e%2e/admin',
    '/api/@evil.example',
  ]) {
    await withUpstream(new Response('{}', { status: 200 }), async (calls) => {
      await onRequest(context(path));
      if (calls.length)
        assert.equal(new URL(calls[0].request.url).origin, 'https://backend.example.test');
    });
  }
});
