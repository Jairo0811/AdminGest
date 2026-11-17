import { createHarness, Harness, registerTenant, RUN_ID, seedTenantData, Tenant } from './harness';

/**
 * Concurrency is exercised with real parallel HTTP requests against SQL Server, so
 * application locks, transactions and unique indexes are what is being verified.
 */
describe('Cotizaciones y cuotas SaaS (SQL Server real)', () => {
  let harness: Harness;
  let tenant: Tenant;
  let data: Awaited<ReturnType<typeof seedTenantData>>;
  const http = () => harness.http();

  beforeAll(async () => {
    harness = await createHarness();
    tenant = await registerTenant(harness, 'Cuotas');
    data = await seedTenantData(harness, tenant);
  });

  afterAll(async () => harness?.close());

  const useTinyPlan = async (
    status = 'ACTIVE',
    limits = { maxUsers: 2, maxCustomers: 4, maxProjects: 2 },
  ) => {
    const plan = await harness.prisma.plan.upsert({
      where: { code: `TEST-${RUN_ID}` },
      create: { code: `TEST-${RUN_ID}`, name: 'Plan de prueba', ...limits },
      update: limits,
    });
    await harness.prisma.subscription.update({
      where: { companyId: tenant.companyId },
      data: { planId: plan.id, status, trialEndsAt: null, currentPeriodEnd: null },
    });
  };

  it('numera cotizaciones simultáneas sin duplicados ni huecos, incluso tras eliminar', async () => {
    const create = () =>
      http()
        .post('/api/quotes')
        .set(tenant.auth)
        .send({
          customerId: data.customerId,
          items: [{ description: 'Servicio', quantity: 1, unitPrice: 100 }],
        });

    const first = await create().expect(201);
    await http().delete(`/api/quotes/${first.body.id}`).set(tenant.auth).expect(200);

    const responses = await Promise.all(Array.from({ length: 12 }, create));
    expect(responses.map((response) => response.status)).toEqual(Array(12).fill(201));

    const numbers = responses.map((response) => response.body.number as string);
    expect(new Set(numbers).size).toBe(12);
    const sequence = numbers.map((value) => Number(value.split('-').pop())).sort((x, y) => x - y);
    // The deleted quote keeps its number: the next ones continue from 2 without reuse.
    expect(sequence).toEqual(Array.from({ length: 12 }, (_, index) => index + 2));
    const year = new Date().getFullYear();
    expect(
      numbers.every((value) =>
        new RegExp(`^COT-(${year}|${year + 1}|${year - 1})-\\d{5}$`).test(value),
      ),
    ).toBe(true);
  });

  it('persiste ITBIS por línea, líneas exentas y descuento proporcional', async () => {
    const response = await http()
      .post('/api/quotes')
      .set(tenant.auth)
      .send({
        customerId: data.customerId,
        opportunityId: data.opportunityId,
        discount: 25,
        items: [
          {
            description: 'Gravado 18 %',
            quantity: 2,
            unitPrice: 100,
            taxRate: 18,
            catalogItemId: data.catalogItemId,
          },
          { description: 'Exento', quantity: 1, unitPrice: 50, taxRate: 0 },
        ],
      })
      .expect(201);

    expect(Number(response.body.subtotal)).toBe(250);
    expect(Number(response.body.discount)).toBe(25);
    expect(Number(response.body.tax)).toBe(32.4);
    expect(Number(response.body.total)).toBe(257.4);
    const lines = (response.body.items as Array<Record<string, string>>).sort(
      (x, y) => Number(y.lineTotal) - Number(x.lineTotal),
    );
    expect(
      lines.map((line) => [
        Number(line.lineTotal),
        Number(line.discountAmount),
        Number(line.taxAmount),
        Number(line.taxRate),
      ]),
    ).toEqual([
      [200, 20, 32.4, 18],
      [50, 5, 0, 0],
    ]);

    const verification = await http()
      .get(`/api/quotes/verify/${response.body.publicCode}`)
      .expect(200);
    expect(Number(verification.body.total)).toBe(257.4);
    expect(JSON.stringify(verification.body)).not.toContain(tenant.companyId);

    await http()
      .post('/api/quotes')
      .set(tenant.auth)
      .send({
        customerId: data.customerId,
        discount: 500,
        items: [{ description: 'X', quantity: 1, unitPrice: 10 }],
      })
      .expect(400);
  });

  it('no supera la cuota de clientes con solicitudes simultáneas', async () => {
    // The tenant already has 2 active customers; the plan allows 4.
    await useTinyPlan();
    const responses = await Promise.all(
      Array.from({ length: 8 }, (_, index) =>
        http()
          .post('/api/customers')
          .set(tenant.auth)
          .send({ name: `Concurrente ${index}` }),
      ),
    );
    const created = responses.filter((response) => response.status === 201).length;
    expect(created).toBe(2);
    expect(responses.filter((response) => response.status === 403)).toHaveLength(6);
    expect(
      await harness.prisma.customer.count({
        where: { companyId: tenant.companyId, isActive: true },
      }),
    ).toBe(4);
  });

  it('no supera la cuota de proyectos ni de usuarios con solicitudes simultáneas', async () => {
    await useTinyPlan('ACTIVE', { maxUsers: 3, maxCustomers: 100, maxProjects: 3 });
    const projects = await Promise.all(
      Array.from({ length: 6 }, (_, index) =>
        http()
          .post('/api/projects')
          .set(tenant.auth)
          .send({ customerId: data.customerId, name: `Proyecto concurrente ${index}` }),
      ),
    );
    expect(projects.filter((response) => response.status === 201)).toHaveLength(2);
    expect(await harness.prisma.project.count({ where: { companyId: tenant.companyId } })).toBe(3);

    const users = await Promise.all(
      Array.from({ length: 6 }, (_, index) =>
        http()
          .post('/api/users')
          .set(tenant.auth)
          .send({
            email: `cuota-${index}-${RUN_ID}@integracion.test`,
            password: 'Integracion-2026!',
            firstName: 'Cuota',
            lastName: `N${index}`,
            role: 'VIEWER',
          }),
      ),
    );
    expect(users.filter((response) => response.status === 201)).toHaveLength(2);
    expect(
      await harness.prisma.user.count({ where: { companyId: tenant.companyId, status: 'ACTIVE' } }),
    ).toBe(3);
  });

  it('reactivar un usuario respeta la cuota y desactivarlo libera capacidad', async () => {
    const viewer = await harness.prisma.user.findFirstOrThrow({
      where: { companyId: tenant.companyId, role: 'VIEWER', status: 'ACTIVE' },
    });
    await http()
      .patch(`/api/users/${viewer.id}`)
      .set(tenant.auth)
      .send({ status: 'INACTIVE' })
      .expect(200);
    await http()
      .post('/api/users')
      .set(tenant.auth)
      .send({
        email: `reemplazo-${RUN_ID}@integracion.test`,
        password: 'Integracion-2026!',
        firstName: 'Nuevo',
        lastName: 'Usuario',
        role: 'VIEWER',
      })
      .expect(201);
    await http()
      .patch(`/api/users/${viewer.id}`)
      .set(tenant.auth)
      .send({ status: 'ACTIVE' })
      .expect(403);
  });

  it('bloquea nuevas altas con suscripción suspendida o prueba vencida', async () => {
    await useTinyPlan('SUSPENDED', { maxUsers: 50, maxCustomers: 500, maxProjects: 500 });
    await http().post('/api/customers').set(tenant.auth).send({ name: 'Suspendida' }).expect(403);

    await harness.prisma.subscription.update({
      where: { companyId: tenant.companyId },
      data: { status: 'TRIAL', trialEndsAt: new Date(Date.now() - 60_000) },
    });
    await http()
      .post('/api/projects')
      .set(tenant.auth)
      .send({ customerId: data.customerId, name: 'Vencida' })
      .expect(403);

    const current = await http().get('/api/subscriptions/current').set(tenant.auth).expect(200);
    expect(current.body).toMatchObject({ isUsable: false, billing: { integrated: false } });
    expect(current.body.usage.customers).toBe(
      await harness.prisma.customer.count({
        where: { companyId: tenant.companyId, isActive: true },
      }),
    );
  });

  it('aplica una plantilla una sola vez aunque se envíe en paralelo', async () => {
    const template = await http()
      .post('/api/workflows/templates')
      .set(tenant.auth)
      .send({ name: 'Implementación', steps: ['Análisis', 'Diseño', 'Pruebas'] })
      .expect(201);
    const results = await Promise.all(
      Array.from({ length: 4 }, () =>
        http()
          .post(`/api/workflows/templates/${template.body.id}/apply/${data.projectId}`)
          .set(tenant.auth),
      ),
    );
    expect(results.every((response) => response.status === 201)).toBe(true);
    expect(results.reduce((sum, response) => sum + Number(response.body.created), 0)).toBe(3);
    expect(
      await harness.prisma.projectTask.count({
        where: { projectId: data.projectId, title: { in: ['Análisis', 'Diseño', 'Pruebas'] } },
      }),
    ).toBe(3);
    const project = await http()
      .get(`/api/projects/${data.projectId}`)
      .set(tenant.auth)
      .expect(200);
    expect(project.body.progress).toBe(0);
  });
});
