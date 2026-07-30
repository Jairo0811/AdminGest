import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@admingest.local';
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!password || password.length < 10) {
    throw new Error('SEED_ADMIN_PASSWORD debe contener al menos 10 caracteres.');
  }
  const passwordHash = await bcrypt.hash(password, 12);

  const company = await prisma.company.upsert({
    where: { taxId: 'DEMO-ADMIN-GEST' },
    update: {},
    create: {
      name: 'AdminGest Demo',
      taxId: 'DEMO-ADMIN-GEST',
      email,
      phone: '809-555-0101',
      address: 'Santo Domingo, República Dominicana',
    },
  });

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, status: 'ACTIVE' },
    create: {
      companyId: company.id,
      email,
      passwordHash,
      firstName: 'Jairo',
      lastName: 'Matías',
      role: 'ADMIN',
    },
  });

  const stageDefinitions = [
    { name: 'Prospección', position: 1, probability: 10 },
    { name: 'Calificación', position: 2, probability: 30 },
    { name: 'Propuesta', position: 3, probability: 60 },
    { name: 'Negociación', position: 4, probability: 80 },
    { name: 'Ganada', position: 5, probability: 100, isWon: true },
    { name: 'Perdida', position: 6, probability: 0, isLost: true },
  ];

  for (const stage of stageDefinitions) {
    await prisma.pipelineStage.upsert({
      where: {
        companyId_position: { companyId: company.id, position: stage.position },
      },
      update: stage,
      create: { companyId: company.id, ...stage },
    });
  }

  const existingCustomer = await prisma.customer.findFirst({
    where: { companyId: company.id, name: 'Grupo Horizonte' },
  });
  const customer =
    existingCustomer ??
    (await prisma.customer.create({
      data: {
        companyId: company.id,
        name: 'Grupo Horizonte',
        email: 'contacto@horizonte.demo',
        phone: '809-555-0110',
      },
    }));

  const leadCount = await prisma.lead.count({ where: { companyId: company.id } });
  if (leadCount === 0) {
    await prisma.lead.createMany({
      data: [
        {
          companyId: company.id,
          ownerId: user.id,
          firstName: 'María',
          lastName: 'Rodríguez',
          companyName: 'Caribe Servicios',
          email: 'maria@caribe.demo',
          source: 'Referido',
          status: 'QUALIFIED',
          priority: 3,
        },
        {
          companyId: company.id,
          ownerId: user.id,
          firstName: 'Carlos',
          lastName: 'Gómez',
          companyName: 'Nova Solutions',
          email: 'carlos@nova.demo',
          source: 'Sitio web',
          status: 'NEW',
          priority: 2,
        },
      ],
    });
  }

  const proposalStage = await prisma.pipelineStage.findFirstOrThrow({
    where: { companyId: company.id, position: 3 },
  });
  const existingOpportunity = await prisma.opportunity.findFirst({
    where: { companyId: company.id, name: 'Portal corporativo' },
  });
  const opportunity =
    existingOpportunity ??
    (await prisma.opportunity.create({
      data: {
        companyId: company.id,
        customerId: customer.id,
        ownerId: user.id,
        pipelineStageId: proposalStage.id,
        name: 'Portal corporativo',
        estimatedValue: 280000,
        probability: 60,
      },
    }));

  const projectCount = await prisma.project.count({ where: { companyId: company.id } });
  if (projectCount === 0) {
    await prisma.project.create({
      data: {
        companyId: company.id,
        customerId: customer.id,
        opportunityId: opportunity.id,
        managerId: user.id,
        name: 'Implementación del portal',
        status: 'ACTIVE',
        progress: 35,
        budget: 280000,
        tasks: {
          create: [
            { title: 'Levantamiento de requerimientos', status: 'COMPLETED', progress: 100 },
            { title: 'Diseño de interfaz', status: 'IN_PROGRESS', progress: 60 },
            { title: 'Desarrollo e integración', status: 'PENDING', progress: 0 },
          ],
        },
      },
    });
  }

  const activityCount = await prisma.activity.count({ where: { companyId: company.id } });
  if (activityCount === 0) {
    await prisma.activity.create({
      data: {
        companyId: company.id,
        customerId: customer.id,
        opportunityId: opportunity.id,
        ownerId: user.id,
        type: 'MEETING',
        subject: 'Revisión de propuesta',
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
  }

  console.info(`AdminGest listo. Usuario inicial: ${email}`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
