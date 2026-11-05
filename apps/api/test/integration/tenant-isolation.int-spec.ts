import { Prisma } from '@prisma/client';
import { addUser, createHarness, Harness, registerTenant, seedTenantData, Tenant } from './harness';

type TenantData = Awaited<ReturnType<typeof seedTenantData>>;

/**
 * Empresa A and Empresa B are two independent tenants created through the public API.
 * Every request below is made by Empresa A against identifiers that belong to Empresa B.
 */
describe('Aislamiento multiempresa (SQL Server real)', () => {
  let harness: Harness;
  let a: Tenant;
  let b: Tenant;
  let bUser: Tenant;
  let dataA: TenantData;
  let dataB: TenantData;
  let bNotificationId: string;
  let bDocumentId: string;
  let bTemplateId: string;
  let aTemplateId: string;
  let bQuoteId: string;

  const http = () => harness.http();

  beforeAll(async () => {
    harness = await createHarness();
    a = await registerTenant(harness, 'A');
    b = await registerTenant(harness, 'B');
    bUser = await addUser(harness, b, 'SALES_REP', 'B-Rep');
    dataA = await seedTenantData(harness, a);
    dataB = await seedTenantData(harness, b);

    // Empresa B creates resources of every module.
    await http()
      .post('/api/activities')
      .set(b.auth)
      .send({ type: 'CALL', subject: 'Llamada B', scheduledAt: new Date(Date.now() + 3_600_000).toISOString(), ownerId: bUser.userId })
      .expect(201);
    const notifications = await http().get('/api/notifications').set(bUser.auth).expect(200);
    bNotificationId = notifications.body[0].id;
    bDocumentId = (
      await http()
        .post('/api/documents')
        .set(b.auth)
        .send({ title: 'Contrato B', category: 'CONTRACT', url: 'https://docs.example.com/b.pdf', projectId: dataB.projectId })
        .expect(201)
    ).body.id;
    bTemplateId = (
      await http().post('/api/workflows/templates').set(b.auth).send({ name: 'Plantilla B', steps: ['Paso B'] }).expect(201)
    ).body.id;
    aTemplateId = (
      await http().post('/api/workflows/templates').set(a.auth).send({ name: 'Plantilla A', steps: ['Paso A'] }).expect(201)
    ).body.id;
    bQuoteId = (
      await http()
        .post('/api/quotes')
        .set(b.auth)
        .send({ customerId: dataB.customerId, items: [{ description: 'Servicio B', quantity: 1, unitPrice: 100 }] })
        .expect(201)
    ).body.id;
  });

  afterAll(async () => harness?.close());

  it('no lista registros de la otra empresa', async () => {
    for (const path of ['/api/customers', '/api/opportunities', '/api/projects', '/api/quotes', '/api/activities', '/api/documents', '/api/workflows/templates', '/api/users']) {
      const response = await http().get(path).set(a.auth).expect(200);
      const serialized = JSON.stringify(response.body);
      for (const foreignId of [b.companyId, bUser.userId, dataB.customerId, dataB.projectId, dataB.opportunityId, bQuoteId, bDocumentId, bTemplateId]) {
        expect(serialized).not.toContain(foreignId);
      }
    }
    const search = await http().get('/api/navigation/search?q=Cliente').set(a.auth).expect(200);
    expect(JSON.stringify(search.body)).not.toContain(dataB.customerId);
  });

  it('no consulta, modifica ni elimina recursos de la otra empresa', async () => {
    const reads = [
      `/api/customers/${dataB.customerId}`,
      `/api/opportunities/${dataB.opportunityId}`,
      `/api/projects/${dataB.projectId}`,
      `/api/quotes/${bQuoteId}`,
    ];
    for (const path of reads) await http().get(path).set(a.auth).expect(404);

    await http().patch(`/api/customers/${dataB.customerId}`).set(a.auth).send({ name: 'Hackeado' }).expect(404);
    await http().patch(`/api/opportunities/${dataB.opportunityId}`).set(a.auth).send({ name: 'Hackeado' }).expect(404);
    await http().patch(`/api/projects/${dataB.projectId}`).set(a.auth).send({ name: 'Hackeado' }).expect(404);
    await http().patch(`/api/projects/tasks/${dataB.taskId}`).set(a.auth).send({ title: 'Hackeado' }).expect(404);
    await http().patch(`/api/quotes/${bQuoteId}/status`).set(a.auth).send({ status: 'ACCEPTED' }).expect(404);
    await http().patch(`/api/catalog/${dataB.catalogItemId}`).set(a.auth).send({ name: 'Hackeado' }).expect(404);
    await http().patch(`/api/users/${bUser.userId}`).set(a.auth).send({ role: 'VIEWER' }).expect(404);
    await http().post(`/api/users/${bUser.userId}/reset-password`).set(a.auth).send({ password: 'Otra-clave-2026' }).expect(404);
    await http().post(`/api/customers/${dataB.customerId}/contacts`).set(a.auth).send({ firstName: 'Intruso' }).expect(404);

    await http().delete(`/api/customers/${dataB.customerId}`).set(a.auth).expect(404);
    await http().delete(`/api/opportunities/${dataB.opportunityId}`).set(a.auth).expect(404);
    await http().delete(`/api/projects/${dataB.projectId}`).set(a.auth).expect(404);
    await http().delete(`/api/quotes/${bQuoteId}`).set(a.auth).expect(404);

    const customerB = await harness.prisma.customer.findUniqueOrThrow({ where: { id: dataB.customerId } });
    expect(customerB).toMatchObject({ name: 'Cliente B', isActive: true });
    const quoteB = await harness.prisma.quote.findUniqueOrThrow({ where: { id: bQuoteId } });
    expect(quoteB.status).toBe('DRAFT');
    const userB = await harness.prisma.user.findUniqueOrThrow({ where: { id: bUser.userId } });
    expect(userB.role).toBe('SALES_REP');
  });

  it('rechaza asociar recursos de la otra empresa al crear y al actualizar', async () => {
    const quotesBefore = await harness.prisma.quote.count({ where: { companyId: a.companyId } });

    // Oportunidades: cliente, etapa y responsable ajenos.
    const base = { name: 'Cruzada', estimatedValue: 1, pipelineStageId: dataA.stageId, customerId: dataA.customerId };
    await http().post('/api/opportunities').set(a.auth).send({ ...base, customerId: dataB.customerId }).expect(404);
    await http().post('/api/opportunities').set(a.auth).send({ ...base, pipelineStageId: dataB.stageId }).expect(404);
    await http().post('/api/opportunities').set(a.auth).send({ ...base, ownerId: bUser.userId }).expect(400);
    await http().patch(`/api/opportunities/${dataA.opportunityId}`).set(a.auth).send({ ownerId: bUser.userId }).expect(400);
    await http().patch(`/api/opportunities/${dataA.opportunityId}`).set(a.auth).send({ pipelineStageId: dataB.stageId }).expect(404);

    // Proyectos: gerente ajeno y oportunidad de otro cliente.
    await http().post('/api/projects').set(a.auth).send({ customerId: dataA.customerId, name: 'Cruzado', managerId: bUser.userId }).expect(400);
    await http().post('/api/projects').set(a.auth).send({ customerId: dataB.customerId, name: 'Cruzado' }).expect(404);
    await http().post('/api/projects').set(a.auth).send({ customerId: dataA.otherCustomerId, opportunityId: dataA.opportunityId, name: 'Incoherente' }).expect(400);
    await http().patch(`/api/projects/${dataA.projectId}`).set(a.auth).send({ managerId: bUser.userId }).expect(400);

    // Tareas: responsable ajeno y tarea padre de otro proyecto.
    await http().post(`/api/projects/${dataA.projectId}/tasks`).set(a.auth).send({ title: 'X', assigneeId: bUser.userId }).expect(400);
    await http().post(`/api/projects/${dataA.projectId}/tasks`).set(a.auth).send({ title: 'X', parentId: dataB.taskId }).expect(400);
    await http().patch(`/api/projects/tasks/${dataA.taskId}`).set(a.auth).send({ assigneeId: bUser.userId }).expect(400);
    await http().patch(`/api/projects/tasks/${dataA.taskId}`).set(a.auth).send({ parentId: dataA.taskId }).expect(400);

    // Actividades y prospectos: responsable, cliente y oportunidad ajenos.
    const when = new Date(Date.now() + 86_400_000).toISOString();
    await http().post('/api/activities').set(a.auth).send({ type: 'CALL', subject: 'X1', scheduledAt: when, ownerId: bUser.userId }).expect(400);
    await http().post('/api/activities').set(a.auth).send({ type: 'CALL', subject: 'X2', scheduledAt: when, customerId: dataB.customerId }).expect(404);
    await http().post('/api/activities').set(a.auth).send({ type: 'CALL', subject: 'X3', scheduledAt: when, opportunityId: dataB.opportunityId }).expect(404);
    await http().post('/api/activities').set(a.auth).send({ type: 'CALL', subject: 'X4', scheduledAt: when, customerId: dataA.otherCustomerId, opportunityId: dataA.opportunityId }).expect(400);
    await http().post('/api/leads').set(a.auth).send({ firstName: 'Lead', ownerId: bUser.userId }).expect(400);

    // Cotizaciones: catálogo, cliente y oportunidad ajenos o incoherentes.
    const item = { description: 'Línea', quantity: 1, unitPrice: 10 };
    await http().post('/api/quotes').set(a.auth).send({ customerId: dataA.customerId, items: [{ ...item, catalogItemId: dataB.catalogItemId }] }).expect(400);
    await http().post('/api/quotes').set(a.auth).send({ customerId: dataB.customerId, items: [item] }).expect(404);
    await http().post('/api/quotes').set(a.auth).send({ customerId: dataA.otherCustomerId, opportunityId: dataA.opportunityId, items: [item] }).expect(400);

    // Documentos: proyecto y cliente ajenos.
    await http().post('/api/documents').set(a.auth).send({ title: 'X', category: 'OTHER', url: 'https://docs.example.com/x', projectId: dataB.projectId }).expect(404);
    await http().post('/api/documents').set(a.auth).send({ title: 'X', category: 'OTHER', url: 'https://docs.example.com/x', customerId: dataB.customerId }).expect(404);

    // Sin cambios parciales: ninguna cotización creada ni secuencia consumida.
    expect(await harness.prisma.quote.count({ where: { companyId: a.companyId } })).toBe(quotesBefore);
    expect(await harness.prisma.project.count({ where: { companyId: a.companyId, name: { in: ['Cruzado', 'Incoherente'] } } })).toBe(0);
    expect(await harness.prisma.activity.count({ where: { companyId: a.companyId, subject: { in: ['X1', 'X2', 'X3', 'X4'] } } })).toBe(0);
    const task = await harness.prisma.projectTask.findUniqueOrThrow({ where: { id: dataA.taskId } });
    expect(task.assigneeId).toBeNull();
    expect(task.parentId).toBeNull();
  });

  it('no manipula documentos, notificaciones ni plantillas de la otra empresa', async () => {
    await http().delete(`/api/documents/${bDocumentId}`).set(a.auth).expect(404);
    await http().patch(`/api/notifications/${bNotificationId}/read`).set(a.auth).expect(404);
    await http().delete(`/api/workflows/templates/${bTemplateId}`).set(a.auth).expect(404);
    await http().post(`/api/workflows/templates/${bTemplateId}/apply/${dataA.projectId}`).set(a.auth).expect(404);
    await http().post(`/api/workflows/templates/${aTemplateId}/apply/${dataB.projectId}`).set(a.auth).expect(404);
    await http().patch('/api/notifications/read-all').set(a.auth).expect(200);

    expect(await harness.prisma.documentRecord.count({ where: { id: bDocumentId } })).toBe(1);
    expect(await harness.prisma.projectTemplate.count({ where: { id: bTemplateId } })).toBe(1);
    const notification = await harness.prisma.notification.findUniqueOrThrow({ where: { id: bNotificationId } });
    expect(notification.readAt).toBeNull();
    expect(await harness.prisma.projectTask.count({ where: { projectId: dataB.projectId, title: 'Paso A' } })).toBe(0);
  });

  it('no expone datos de la otra empresa a través de relaciones Prisma', async () => {
    const customer = await http().get(`/api/customers/${dataA.customerId}`).set(a.auth).expect(200);
    const opportunity = await http().get(`/api/opportunities/${dataA.opportunityId}`).set(a.auth).expect(200);
    const project = await http().get(`/api/projects/${dataA.projectId}`).set(a.auth).expect(200);
    for (const body of [customer.body, opportunity.body, project.body]) {
      expect(JSON.stringify(body)).not.toContain(b.companyId);
    }
  });

  it('la base de datos rechaza referencias cruzadas aunque se omita la API', async () => {
    const attempt = harness.prisma.opportunity.create({
      data: {
        companyId: a.companyId,
        customerId: dataB.customerId,
        pipelineStageId: dataA.stageId,
        name: 'Inserción directa',
        estimatedValue: 1,
      },
    });
    await expect(attempt).rejects.toBeInstanceOf(Prisma.PrismaClientKnownRequestError);
    await expect(
      harness.prisma.project.create({
        data: { companyId: a.companyId, customerId: dataA.customerId, managerId: bUser.userId, name: 'Directo' },
      }),
    ).rejects.toMatchObject({ code: 'P2003' });
    await expect(
      harness.prisma.notification.create({
        data: { companyId: a.companyId, userId: bUser.userId, eventType: 'PROJECT_ASSIGNED', title: 'x', message: 'x', path: '/', dedupeKey: 'cross' },
      }),
    ).rejects.toMatchObject({ code: 'P2003' });
  });
});
