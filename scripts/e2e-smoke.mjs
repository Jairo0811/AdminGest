import assert from 'node:assert/strict';

const apiUrl = process.env.E2E_API_URL ?? 'http://127.0.0.1:3000/api';
const email = process.env.E2E_EMAIL ?? 'admin@example.test';
const password = process.env.E2E_PASSWORD;

if (!password) {
  throw new Error('E2E_PASSWORD es obligatorio para ejecutar las pruebas E2E.');
}

async function request(path, init = {}) {
  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init.headers ?? {}),
    },
  });

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(`${init.method ?? 'GET'} ${path} -> ${response.status}: ${JSON.stringify(body)}`);
  }
  return body;
}

async function waitForApi() {
  for (let attempt = 1; attempt <= 40; attempt += 1) {
    try {
      const health = await request('/health');
      assert.equal(health.status, 'ok');
      return;
    } catch (error) {
      if (attempt === 40) throw error;
      await new Promise((resolve) => setTimeout(resolve, 2_000));
    }
  }
}

await waitForApi();

const session = await request('/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email, password }),
});
assert.equal(typeof session.accessToken, 'string');
assert.equal(session.user.email, email);

const authorization = { authorization: `Bearer ${session.accessToken}` };
const me = await request('/auth/me', { headers: authorization });
assert.equal(me.email, email);

const dashboard = await request('/dashboard', { headers: authorization });
assert.ok(dashboard.metrics);
assert.ok(Array.isArray(dashboard.upcomingActivities));

const notifications = await request('/navigation/notifications', {
  headers: authorization,
});
assert.ok(Array.isArray(notifications));

const search = await request('/navigation/search?q=Admin', {
  headers: authorization,
});
assert.ok(Array.isArray(search));

console.log('E2E smoke test completado correctamente.');
