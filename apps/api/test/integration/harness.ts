import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/bootstrap';
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service';

/**
 * Integration harness: boots the real AppModule (guards, validation, filters, Prisma)
 * against the SQL Server database in DATABASE_URL. No service is mocked.
 */
export interface Harness {
  app: NestExpressApplication;
  prisma: PrismaService;
  http: () => ReturnType<typeof request>;
  close(): Promise<void>;
}

export const RUN_ID = randomUUID().slice(0, 8);
export const ORIGIN = (process.env.CORS_ORIGIN ?? 'http://localhost:5173').split(',')[0].trim();
export const PASSWORD = 'Integracion-2026!';

export async function createHarness(): Promise<Harness> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication<NestExpressApplication>({ logger: ['error'] });
  configureApp(app);
  await app.init();
  const prisma = app.get(PrismaService);
  return {
    app,
    prisma,
    http: () => request(app.getHttpServer()),
    close: () => app.close(),
  };
}

export interface Tenant {
  label: string;
  companyId: string;
  userId: string;
  email: string;
  token: string;
  refreshCookie: string;
  auth: { Authorization: string };
}

export const refreshCookieOf = (setCookie: string[] | string | undefined): string => {
  const cookies = Array.isArray(setCookie) ? setCookie : setCookie ? [setCookie] : [];
  const cookie = cookies.find((value) => value.startsWith('admingest_refresh='));
  if (!cookie) throw new Error('La respuesta no estableció la cookie de sesión.');
  return cookie.split(';')[0];
};

/** Registers an independent company through the public API (trial STARTER plan). */
export async function registerTenant(harness: Harness, label: string): Promise<Tenant> {
  const email = `${label.toLowerCase()}-${RUN_ID}@integracion.test`;
  const response = await harness
    .http()
    .post('/api/auth/register')
    .send({
      companyName: `Empresa ${label} ${RUN_ID}`,
      firstName: 'Admin',
      lastName: label,
      email,
      password: PASSWORD,
    })
    .expect(201);
  const body = response.body as { accessToken: string; user: { id: string; companyId: string } };
  return {
    label,
    companyId: body.user.companyId,
    userId: body.user.id,
    email,
    token: body.accessToken,
    refreshCookie: refreshCookieOf(response.headers['set-cookie']),
    auth: { Authorization: `Bearer ${body.accessToken}` },
  };
}

/** Creates an additional user in a tenant and logs in as that user. */
export async function addUser(
  harness: Harness,
  admin: Tenant,
  role: string,
  label: string,
): Promise<Tenant> {
  const email = `${label.toLowerCase()}-${RUN_ID}@integracion.test`;
  const created = await harness
    .http()
    .post('/api/users')
    .set(admin.auth)
    .send({ email, password: PASSWORD, firstName: 'Usuario', lastName: label, role })
    .expect(201);
  return login(harness, email, created.body.companyId as string, created.body.id as string, label);
}

export async function login(
  harness: Harness,
  email: string,
  companyId: string,
  userId: string,
  label = email,
  password = PASSWORD,
): Promise<Tenant> {
  const response = await harness
    .http()
    .post('/api/auth/login')
    .send({ email, password })
    .expect(200);
  return {
    label,
    companyId,
    userId,
    email,
    token: response.body.accessToken,
    refreshCookie: refreshCookieOf(response.headers['set-cookie']),
    auth: { Authorization: `Bearer ${response.body.accessToken}` },
  };
}

/** Creates the basic commercial chain of a tenant: customer → opportunity → project. */
export async function seedTenantData(harness: Harness, tenant: Tenant) {
  const http = harness.http;
  const stages = await http().get('/api/opportunities/stages').set(tenant.auth).expect(200);
  const stageId = stages.body[0].id as string;
  const customer = await http()
    .post('/api/customers')
    .set(tenant.auth)
    .send({ name: `Cliente ${tenant.label}` })
    .expect(201);
  const otherCustomer = await http()
    .post('/api/customers')
    .set(tenant.auth)
    .send({ name: `Otro cliente ${tenant.label}` })
    .expect(201);
  const opportunity = await http()
    .post('/api/opportunities')
    .set(tenant.auth)
    .send({
      customerId: customer.body.id,
      pipelineStageId: stageId,
      name: `Oportunidad ${tenant.label}`,
      estimatedValue: 1000,
    })
    .expect(201);
  const project = await http()
    .post('/api/projects')
    .set(tenant.auth)
    .send({ customerId: customer.body.id, name: `Proyecto ${tenant.label}` })
    .expect(201);
  const task = await http()
    .post(`/api/projects/${project.body.id}/tasks`)
    .set(tenant.auth)
    .send({ title: `Tarea ${tenant.label}` })
    .expect(201);
  const catalogItem = await http()
    .post('/api/catalog')
    .set(tenant.auth)
    .send({ name: `Servicio ${tenant.label}`, type: 'SERVICE', unitPrice: 500 })
    .expect(201);
  return {
    stageId,
    customerId: customer.body.id as string,
    otherCustomerId: otherCustomer.body.id as string,
    opportunityId: opportunity.body.id as string,
    projectId: project.body.id as string,
    taskId: task.body.id as string,
    catalogItemId: catalogItem.body.id as string,
  };
}
