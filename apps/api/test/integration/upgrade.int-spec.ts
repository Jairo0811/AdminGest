import { createHarness, Harness, registerTenant } from './harness';

/**
 * Runs only in the CI "migration upgrade" job: the database was migrated to v1.1.0,
 * loaded with test/migrations/legacy-v1.1-fixture.sql and then upgraded to v1.2.0.
 */
const describeIfUpgrade = process.env.UPGRADE_FIXTURE === 'true' ? describe : describe.skip;
const LEGACY_COMPANY = '10000000-0000-4000-8000-000000000001';

describeIfUpgrade('Actualización desde el esquema v1.1.0 (SQL Server real)', () => {
  let harness: Harness;
  beforeAll(async () => {
    harness = await createHarness();
  });
  afterAll(async () => harness?.close());

  it('conserva los datos y limpia solo referencias documentales huérfanas', async () => {
    expect(await harness.prisma.company.count({ where: { name: { startsWith: 'Legado' } } })).toBe(
      2,
    );
    expect(await harness.prisma.quote.count({ where: { companyId: LEGACY_COMPANY } })).toBe(2);
    const orphan = await harness.prisma.documentRecord.findUniqueOrThrow({
      where: { id: '10000000-0000-4000-8000-000000000061' },
    });
    const valid = await harness.prisma.documentRecord.findUniqueOrThrow({
      where: { id: '10000000-0000-4000-8000-000000000062' },
    });
    expect(orphan.projectId).toBeNull();
    expect(valid.projectId).toBe('10000000-0000-4000-8000-000000000031');
    const legacyItem = await harness.prisma.quoteItem.findUniqueOrThrow({
      where: { id: '10000000-0000-4000-8000-000000000051' },
    });
    expect(legacyItem.taxAmount).toBeNull();
    expect(legacyItem.discountAmount).toBeNull();
  });

  it('continúa la numeración existente sin repetir números (count+1 habría repetido 00003)', async () => {
    const login = await harness
      .http()
      .post('/api/auth/login')
      .send({ email: 'legado@integracion.test', password: 'Legado-Clave-2026!' })
      .expect(200);
    const auth = { Authorization: `Bearer ${login.body.accessToken}` };
    const quote = await harness
      .http()
      .post('/api/quotes')
      .set(auth)
      .send({
        customerId: '10000000-0000-4000-8000-000000000021',
        items: [{ description: 'Primera cotización v1.2.0', quantity: 1, unitPrice: 100 }],
      })
      .expect(201);
    expect(quote.body.number).toMatch(/^COT-\d{4}-00004$/);
  });

  it('admite varias empresas y proyectos sin RNC ni oportunidad tras la migración', async () => {
    const first = await registerTenant(harness, 'SinRncUno');
    const second = await registerTenant(harness, 'SinRncDos');
    expect(first.companyId).not.toBe(second.companyId);
    for (const tenant of [first, second]) {
      const customer = await harness
        .http()
        .post('/api/customers')
        .set(tenant.auth)
        .send({ name: 'Sin RNC' })
        .expect(201);
      await harness
        .http()
        .post('/api/customers')
        .set(tenant.auth)
        .send({ name: 'Sin RNC 2' })
        .expect(201);
      await harness
        .http()
        .post('/api/projects')
        .set(tenant.auth)
        .send({ customerId: customer.body.id, name: 'Sin oportunidad' })
        .expect(201);
    }
  });
});
