import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';
import { randomBytes } from 'node:crypto';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const email = 'admin@example.test';
  const password =
    process.env.SEED_ADMIN_PASSWORD || randomBytes(18).toString('base64url');
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    console.log('Los datos iniciales ya existen.');
    return;
  }

  const company = await prisma.company.create({
    data: {
      name: 'Empresa Demo SRL',
      email,
      address: 'Dirección de demostración',
    },
  });

  const admin = await prisma.user.create({
    data: {
      companyId: company.id,
      email,
      passwordHash: await hash(password, 12),
      firstName: 'Usuario',
      lastName: 'Administrador',
      role: 'ADMIN',
    },
  });

  const stages = await Promise.all([
    prisma.pipelineStage.create({
      data: { companyId: company.id, name: 'Prospección', position: 1, probability: 10 },
    }),
    prisma.pipelineStage.create({
      data: { companyId: company.id, name: 'Calificación', position: 2, probability: 30 },
    }),
    prisma.pipelineStage.create({
      data: { companyId: company.id, name: 'Propuesta', position: 3, probability: 60 },
    }),
    prisma.pipelineStage.create({
      data: { companyId: company.id, name: 'Negociación', position: 4, probability: 80 },
    }),
    prisma.pipelineStage.create({
      data: {
        companyId: company.id,
        name: 'Ganada',
        position: 5,
        probability: 100,
        isWon: true,
      },
    }),
    prisma.pipelineStage.create({
      data: {
        companyId: company.id,
        name: 'Perdida',
        position: 6,
        probability: 0,
        isLost: true,
      },
    }),
  ]);

  const customer = await prisma.customer.create({
    data: {
      companyId: company.id,
      name: 'Cliente de Demostración',
      email: 'cliente@example.test',
      contacts: {
        create: {
          firstName: 'Contacto',
          lastName: 'Demo',
          jobTitle: 'Gerente General',
          email: 'contacto@example.test',
          isPrimary: true,
        },
      },
    },
  });

  await prisma.lead.createMany({
    data: [
      {
        companyId: company.id,
        ownerId: admin.id,
        firstName: 'Prospecto',
        lastName: 'Demo A',
        companyName: 'Empresa Prospecto A',
        email: 'prospecto-a@example.test',
        source: 'Referido',
        status: 'QUALIFIED',
        priority: 3,
      },
      {
        companyId: company.id,
        ownerId: admin.id,
        firstName: 'Prospecto',
        lastName: 'Demo B',
        companyName: 'Empresa Prospecto B',
        email: 'prospecto-b@example.test',
        source: 'Sitio web',
      },
    ],
  });

  const opportunity = await prisma.opportunity.create({
    data: {
      companyId: company.id,
      customerId: customer.id,
      ownerId: admin.id,
      pipelineStageId: stages[2].id,
      name: 'Implementación CRM',
      estimatedValue: 450000,
      probability: 60,
      expectedCloseDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.activity.create({
    data: {
      companyId: company.id,
      customerId: customer.id,
      opportunityId: opportunity.id,
      ownerId: admin.id,
      type: 'MEETING',
      subject: 'Presentación de propuesta',
      scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.catalogItem.createMany({
    data: [
      {
        companyId: company.id,
        name: 'Consultoría de procesos',
        type: 'SERVICE',
        unitPrice: 35000,
      },
      {
        companyId: company.id,
        name: 'Implementación de CRM',
        type: 'SERVICE',
        unitPrice: 180000,
      },
    ],
  });

  console.log('AdminGest inicializado.');
  console.log('Usuario: admin@example.test');
  console.log(`Contraseña inicial: ${password}`);
}

void main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
