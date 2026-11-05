import {
  addUser,
  createHarness,
  Harness,
  login,
  ORIGIN,
  PASSWORD,
  refreshCookieOf,
  registerTenant,
  Tenant,
} from './harness';

describe('Autenticación, sesiones y permisos (SQL Server real)', () => {
  let harness: Harness;
  let admin: Tenant;
  const http = () => harness.http();

  beforeAll(async () => {
    harness = await createHarness();
    admin = await registerTenant(harness, 'Sesiones');
    // This suite creates several users; quotas are covered in quotas-and-quotes.
    const business = await harness.prisma.plan.findUniqueOrThrow({ where: { code: 'BUSINESS' } });
    await harness.prisma.subscription.update({
      where: { companyId: admin.companyId },
      data: { planId: business.id },
    });
  });

  afterAll(async () => harness?.close());

  const refresh = (cookie: string, origin = ORIGIN) =>
    http().post('/api/auth/refresh').set('Cookie', cookie).set('Origin', origin);

  it('emite una cookie de refresco HttpOnly, SameSite=Strict y limitada a /api/auth', async () => {
    const response = await http()
      .post('/api/auth/login')
      .send({ email: admin.email, password: PASSWORD })
      .expect(200);
    const cookie = ([] as string[])
      .concat(response.headers['set-cookie'] ?? [])
      .find((value) => value.startsWith('admingest_refresh='))!;
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Strict/i);
    expect(cookie).toMatch(/Path=\/api\/auth/i);
    expect(response.body.accessToken).toEqual(expect.any(String));
    expect(JSON.stringify(response.body)).not.toContain('passwordHash');
  });

  it('rechaza credenciales incorrectas con el mismo mensaje exista o no la cuenta', async () => {
    const wrong = await http()
      .post('/api/auth/login')
      .send({ email: admin.email, password: 'incorrecta-123' })
      .expect(401);
    const unknown = await http()
      .post('/api/auth/login')
      .send({ email: 'nadie@integracion.test', password: 'incorrecta-123' })
      .expect(401);
    expect(wrong.body.message).toBe(unknown.body.message);
  });

  it('rota el refresh token y revoca la sesión si se reutiliza un token antiguo', async () => {
    const session = await login(harness, admin.email, admin.companyId, admin.userId);
    const first = await refresh(session.refreshCookie).expect(200);
    const rotated = refreshCookieOf(first.headers['set-cookie']);
    expect(rotated).not.toBe(session.refreshCookie);

    // Within the grace window a stale token is rejected without revoking the session.
    await refresh(session.refreshCookie).expect(401);
    await refresh(rotated)
      .expect(200)
      .then((response) => {
        session.refreshCookie = refreshCookieOf(response.headers['set-cookie']);
      });

    // After the grace window, reusing a stale token revokes the whole session.
    const sessionId = session.refreshCookie.split('=')[1].split('.')[0];
    await harness.prisma.authSession.update({
      where: { id: sessionId },
      data: { lastUsedAt: new Date(Date.now() - 60_000) },
    });
    await refresh(rotated).expect(401);
    await refresh(session.refreshCookie).expect(401);
    await http()
      .get('/api/auth/me')
      .set({ Authorization: `Bearer ${first.body.accessToken}` })
      .expect(401);
  });

  it('rechaza el refresco desde un origen no autorizado', async () => {
    const session = await login(harness, admin.email, admin.companyId, admin.userId);
    await refresh(session.refreshCookie, 'https://atacante.example').expect(403);
    await refresh(session.refreshCookie).expect(200);
  });

  it('revoca por dispositivo, cierra sesión y cierra todas las sesiones', async () => {
    // A dedicated user: logout-all must not revoke the admin session used by other tests.
    const owner = await addUser(harness, admin, 'SALES_REP', 'Dispositivos');
    const laptop = await login(harness, owner.email, owner.companyId, owner.userId);
    const phone = await login(harness, owner.email, owner.companyId, owner.userId);
    const sessions = await http().get('/api/auth/sessions').set(laptop.auth).expect(200);
    const phoneSessionId = phone.refreshCookie.split('=')[1].split('.')[0];
    expect(sessions.body.map((item: { id: string }) => item.id)).toContain(phoneSessionId);

    await http().delete(`/api/auth/sessions/${phoneSessionId}`).set(laptop.auth).expect(200);
    await http().get('/api/auth/me').set(phone.auth).expect(401);
    await refresh(phone.refreshCookie).expect(401);
    await http().get('/api/auth/me').set(laptop.auth).expect(200);

    await http()
      .post('/api/auth/logout')
      .set('Cookie', laptop.refreshCookie)
      .set('Origin', ORIGIN)
      .expect(200);
    await refresh(laptop.refreshCookie).expect(401);

    const one = await login(harness, owner.email, owner.companyId, owner.userId);
    const two = await login(harness, owner.email, owner.companyId, owner.userId);
    await http().post('/api/auth/logout-all').set(one.auth).expect(200);
    await http().get('/api/auth/me').set(two.auth).expect(401);
    await refresh(two.refreshCookie).expect(401);
  });

  it('cambiar la contraseña revoca todas las sesiones y exige la nueva clave', async () => {
    const user = await addUser(harness, admin, 'SALES_REP', 'Clave');
    const other = await login(harness, user.email, user.companyId, user.userId);
    await http()
      .post('/api/users/me/change-password')
      .set(user.auth)
      .send({ currentPassword: PASSWORD, newPassword: 'Nueva-Clave-2026!' })
      .expect(201);
    await http().get('/api/auth/me').set(user.auth).expect(401);
    await refresh(other.refreshCookie).expect(401);
    await http()
      .post('/api/auth/login')
      .send({ email: user.email, password: PASSWORD })
      .expect(401);
    await login(harness, user.email, user.companyId, user.userId, 'Clave', 'Nueva-Clave-2026!');
  });

  it('un usuario desactivado pierde el acceso inmediatamente', async () => {
    const user = await addUser(harness, admin, 'SALES_REP', 'Inactivo');
    await http()
      .patch(`/api/users/${user.userId}`)
      .set(admin.auth)
      .send({ status: 'INACTIVE' })
      .expect(200);
    await http().get('/api/auth/me').set(user.auth).expect(401);
    await refresh(user.refreshCookie).expect(401);
    await http()
      .post('/api/auth/login')
      .send({ email: user.email, password: PASSWORD })
      .expect(401);
  });

  it('la empresa conserva al menos un administrador activo', async () => {
    await http()
      .patch(`/api/users/${admin.userId}`)
      .set(admin.auth)
      .send({ role: 'VIEWER' })
      .expect(400);
    await http()
      .patch(`/api/users/${admin.userId}`)
      .set(admin.auth)
      .send({ status: 'INACTIVE' })
      .expect(400);
  });

  it('aplica los permisos por rol en la API', async () => {
    const viewer = await addUser(harness, admin, 'VIEWER', 'Lector');
    // Every role manages its own profile.
    await http().get('/api/users/me').set(viewer.auth).expect(200);
    await http()
      .patch('/api/users/me')
      .set(viewer.auth)
      .send({ firstName: 'Lectora', lastName: 'Perfil', email: viewer.email })
      .expect(200);
    await http().get('/api/customers').set(viewer.auth).expect(200);
    await http().post('/api/customers').set(viewer.auth).send({ name: 'No permitido' }).expect(403);
    await http().get('/api/users').set(viewer.auth).expect(403);
    await http().patch('/api/company').set(viewer.auth).send({ name: 'No permitido' }).expect(403);
    await http().get('/api/subscriptions/current').set(viewer.auth).expect(403);
    await http()
      .patch('/api/workflows/rules/PROJECT_ASSIGNED')
      .set(viewer.auth)
      .send({ enabled: false })
      .expect(403);

    const rep = await addUser(harness, admin, 'SALES_REP', 'Vendedor');
    await http()
      .post('/api/users')
      .set(rep.auth)
      .send({
        email: 'x@integracion.test',
        password: PASSWORD,
        firstName: 'No',
        lastName: 'Permitido',
        role: 'ADMIN',
      })
      .expect(403);
    await http()
      .post('/api/projects')
      .set(rep.auth)
      .send({ name: 'No permitido', customerId: admin.companyId })
      .expect(403);
  });

  it('limpia campos opcionales de la empresa y rechaza vaciar campos obligatorios', async () => {
    await http()
      .patch('/api/company')
      .set(admin.auth)
      .send({ phone: '809-555-0101', address: 'Santo Domingo' })
      .expect(200);
    const cleared = await http()
      .patch('/api/company')
      .set(admin.auth)
      .send({ phone: '', address: null })
      .expect(200);
    expect(cleared.body.phone).toBeNull();
    expect(cleared.body.address).toBeNull();
    await http().patch('/api/company').set(admin.auth).send({ name: '' }).expect(400);
    await http()
      .patch('/api/company')
      .set(admin.auth)
      .send({ timezone: 'Marte/Olympus' })
      .expect(400);
  });

  it('expone salud y disponibilidad de la base de datos', async () => {
    const health = await http().get('/api/health').expect(200);
    expect(health.body).toMatchObject({ status: 'ok', version: '1.2.0' });
    await http().get('/api/health/ready').expect(200);
    expect(health.headers['x-request-id']).toEqual(expect.any(String));
  });
});
