import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';
import { randomBytes } from 'node:crypto';

const prisma = new PrismaClient();

const ADMIN_EMAIL = 'admin@admingest.com.do';
const LEGACY_ADMIN_EMAIL = 'admin@example.test';
const DEMO_COMPANY_NAME = 'Empresa Demo SRL';

async function main(): Promise<void> {
  const password =
    process.env.SEED_ADMIN_PASSWORD ??
    randomBytes(18).toString('base64url');

  const passwordHash = await hash(password, 12);

  const existingAdmin = await prisma.user.findFirst({
    where: {
      email: {
        in: [ADMIN_EMAIL, LEGACY_ADMIN_EMAIL],
      },
    },
  });

  if (existingAdmin) {
    await prisma.$transaction([
      prisma.user.update({
        where: {
          id: existingAdmin.id,
        },
        data: {
          email: ADMIN_EMAIL,
          passwordHash,
          firstName: 'Usuario',
          lastName: 'Administrador',
          role: 'ADMIN',
        },
      }),
      prisma.company.update({
        where: {
          id: existingAdmin.companyId,
        },
        data: {
          email: ADMIN_EMAIL,
        },
      }),
    ]);

    printCredentials(
      'El usuario administrador existente fue actualizado correctamente.',
      password,
    );

    return;
  }

  const existingCompany = await prisma.company.findFirst({
    where: {
      OR: [
        { name: DEMO_COMPANY_NAME },
        { email: ADMIN_EMAIL },
        { email: LEGACY_ADMIN_EMAIL },
      ],
    },
  });

  if (existingCompany) {
    await prisma.$transaction([
      prisma.user.create({
        data: {
          companyId: existingCompany.id,
          email: ADMIN_EMAIL,
          passwordHash,
          firstName: 'Usuario',
          lastName: 'Administrador',
          role: 'ADMIN',
        },
      }),
      prisma.company.update({
        where: {
          id: existingCompany.id,
        },
        data: {
          email: ADMIN_EMAIL,
        },
      }),
    ]);

    printCredentials(
      'El usuario administrador fue agregado a la empresa existente.',
      password,
    );

    return;
  }

  await prisma.$transaction(async (transaction) => {
    const company = await transaction.company.create({
      data: {
        name: DEMO_COMPANY_NAME,
        email: ADMIN_EMAIL,
        address: 'Dirección de demostración',
      },
    });

    const admin = await transaction.user.create({
      data: {
        companyId: company.id,
        email: ADMIN_EMAIL,
        passwordHash,
        firstName: 'Usuario',
        lastName: 'Administrador',
        role: 'ADMIN',
      },
    });

    const stages = await Promise.all([
      transaction.pipelineStage.create({
        data: {
          companyId: company.id,
          name: 'Prospección',
          position: 1,
          probability: 10,
        },
      }),
      transaction.pipelineStage.create({
        data: {
          companyId: company.id,
          name: 'Calificación',
          position: 2,
          probability: 30,
        },
      }),
      transaction.pipelineStage.create({
        data: {
          companyId: company.id,
          name: 'Propuesta',
          position: 3,
          probability: 60,
        },
      }),
      transaction.pipelineStage.create({
        data: {
          companyId: company.id,
          name: 'Negociación',
          position: 4,
          probability: 80,
        },
      }),
      transaction.pipelineStage.create({
        data: {
          companyId: company.id,
          name: 'Ganada',
          position: 5,
          probability: 100,
          isWon: true,
        },
      }),
      transaction.pipelineStage.create({
        data: {
          companyId: company.id,
          name: 'Perdida',
          position: 6,
          probability: 0,
          isLost: true,
        },
      }),
    ]);

    const customer = await transaction.customer.create({
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

    await transaction.lead.createMany({
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

    const opportunity = await transaction.opportunity.create({
      data: {
        companyId: company.id,
        customerId: customer.id,
        ownerId: admin.id,
        pipelineStageId: stages[2].id,
        name: 'Implementación CRM',
        estimatedValue: 450000,
        probability: 60,
        expectedCloseDate: addDays(new Date(), 21),
      },
    });

    await transaction.activity.create({
      data: {
        companyId: company.id,
        customerId: customer.id,
        opportunityId: opportunity.id,
        ownerId: admin.id,
        type: 'MEETING',
        subject: 'Presentación de propuesta',
        scheduledAt: addDays(new Date(), 2),
      },
    });

    await transaction.catalogItem.createMany({
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
  });

  printCredentials(
    'AdminGest fue inicializado correctamente.',
    password,
  );
}

function addDays(date: Date, days: number): Date {
  return new Date(
    date.getTime() + days * 24 * 60 * 60 * 1000,
  );
}

function printCredentials(
  message: string,
  password: string,
): void {
  console.log(message);
  console.log(`Usuario: ${ADMIN_EMAIL}`);
  console.log(`Contraseña inicial: ${password}`);
}

void main()
  .catch((error: unknown) => {
    console.error('No fue posible inicializar AdminGest.');
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });