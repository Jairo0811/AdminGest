import type { Harness } from './harness';

/**
 * Deployment behind Cloudflare Pages (functions/api/[[path]].js) with API_PROXY_SECRET:
 * direct calls are rejected and rate limits, sessions and audit use the visitor address.
 */
describe('Acceso a través del proxy de Cloudflare (SQL Server real)', () => {
  const SECRET = 'proxy-secret-de-integracion-'.padEnd(48, 'x');
  const previous = {
    secret: process.env.API_PROXY_SECRET,
    throttle: process.env.THROTTLE_DISABLED,
  };
  let harness: Harness;
  let PASSWORD: string;
  let RUN_ID: string;

  const viaProxy = (ip: string) => ({
    'x-admingest-proxy-secret': SECRET,
    'x-admingest-client-ip': ip,
  });

  const restore = (key: string, value: string | undefined) => {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  };

  beforeAll(async () => {
    // Set before AppModule is loaded so that environment validation also covers it.
    process.env.API_PROXY_SECRET = SECRET;
    const module = await import('./harness');
    ({ PASSWORD, RUN_ID } = module);
    harness = await module.createHarness();
  });

  afterAll(async () => {
    await harness?.close();
    restore('API_PROXY_SECRET', previous.secret);
    restore('THROTTLE_DISABLED', previous.throttle);
  });

  it('rechaza el acceso directo salvo los health checks', async () => {
    const direct = await harness.http().get('/api/auth/registration').expect(403);
    expect(direct.body.code).toBe('DIRECT_ACCESS_FORBIDDEN');
    await harness
      .http()
      .get('/api/auth/registration')
      .set({ 'x-admingest-proxy-secret': 'secreto-incorrecto'.padEnd(48, 'y') })
      .expect(403);
    await harness.http().get('/api/health').expect(200);
    await harness.http().get('/api/health/ready').expect(200);
    await harness.http().get('/api/auth/registration').set(viaProxy('203.0.113.1')).expect(200);
  });

  it('registra la IP real del visitante en la sesión', async () => {
    const email = `proxy-${RUN_ID}@integracion.test`;
    const response = await harness
      .http()
      .post('/api/auth/register')
      .set(viaProxy('203.0.113.50'))
      .send({
        companyName: `Empresa Proxy ${RUN_ID}`,
        firstName: 'Admin',
        lastName: 'Proxy',
        email,
        password: PASSWORD,
      })
      .expect(201);
    const session = await harness.prisma.authSession.findFirstOrThrow({
      where: { userId: response.body.user.id },
    });
    expect(session.ipAddress).toBe('203.0.113.50');
  });

  it('aplica el límite de inicio de sesión por visitante y no por IP de Cloudflare', async () => {
    process.env.THROTTLE_DISABLED = 'false';
    const attempt = (ip: string) =>
      harness
        .http()
        .post('/api/auth/login')
        .set(viaProxy(ip))
        .send({ email: `nadie-${RUN_ID}@integracion.test`, password: 'incorrecta-123' });

    for (let index = 0; index < 10; index += 1) {
      await attempt('198.51.100.7').expect(401);
    }
    await attempt('198.51.100.7').expect(429);
    // Another visitor behind the same Cloudflare egress address is not blocked.
    await attempt('198.51.100.8').expect(401);
  });
});
