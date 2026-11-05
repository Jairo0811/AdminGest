import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';
import { randomBytes } from 'node:crypto';
import { resolveSeedOptions } from './seed-options';

const prisma = new PrismaClient();

const ADMIN_EMAIL = 'admin@admingest.com.do';
const LEGACY_ADMIN_EMAIL = 'admin@example.test';
const DEMO_COMPANY_NAME = 'Empresa Demo SRL';

async function main(): Promise<void> {
  const options = resolveSeedOptions(process.env);
  await ensurePlans(options.syncPlans);

  if (!options.demoData) {
    console.log('Catálogo de planes verificado. No se crearon datos de demostración.');
    return;
  }

  const existingAdmin = await prisma.user.findFirst({
    where: { email: { in: [ADMIN_EMAIL, LEGACY_ADMIN_EMAIL] } },
    select: { id: true, email: true, companyId: true },
  });

  if (existingAdmin) {
    // Existing accounts are never modified implicitly: no password, profile or role
    // changes, and the subscription is only created when it is missing.
    await ensureSubscription(existingAdmin.companyId);
    if (options.resetAdminPassword && options.adminPassword) {
      await prisma.$transaction([
        prisma.user.update({
          where: { id: existingAdmin.id },
          data: { passwordHash: await hash(options.adminPassword, 12) },
        }),
        prisma.authSession.updateMany({
          where: { userId: existingAdmin.id, revokedAt: null },
          data: { revokedAt: new Date() },
        }),
      ]);
      console.log(`Contraseña restablecida por solicitud explícita para ${existingAdmin.email}.`);
      return;
    }
    console.log(
      `El administrador ${existingAdmin.email} ya existe. Sus credenciales y datos no fueron modificados.`,
    );
    return;
  }

  const generatedPassword = options.adminPassword ? undefined : randomBytes(18).toString('base64url');
  const password = options.adminPassword ?? generatedPassword!;
  const passwordHash = await hash(password, 12);

  // Only the demo company is reused; companies of real customers are never touched.
  const demoCompany = await prisma.company.findFirst({
    where: { name: DEMO_COMPANY_NAME },
    select: { id: true },
  });

  if (demoCompany) {
    await prisma.user.create({
      data: {
        companyId: demoCompany.id,
        email: ADMIN_EMAIL,
        passwordHash,
        firstName: 'Usuario',
        lastName: 'Administrador',
        role: 'ADMIN',
      },
    });
    await ensureSubscription(demoCompany.id);
    printCredentials('Se agregó el administrador a la empresa de demostración.', generatedPassword);
    return;
  }

  const starterPlan = await prisma.plan.findUniqueOrThrow({ where: { code: 'STARTER' } });
  await prisma.$transaction(async (transaction) => {
    const company = await transaction.company.create({
      data: {
        name: DEMO_COMPANY_NAME,
        email: ADMIN_EMAIL,
        address: 'Dirección de demostración',
      },
    });

    await transaction.subscription.create({
      data: {
        companyId: company.id,
        planId: starterPlan.id,
        status: 'TRIAL',
        trialEndsAt: addDays(new Date(), 14),
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

  printCredentials('AdminGest fue inicializado con datos de demostración.', generatedPassword);
}

async function ensurePlans(syncPlans: boolean) {
  const plans = [
    {
      code: 'STARTER',
      name: 'Starter',
      description: 'Operación esencial para equipos pequeños.',
      monthlyPrice: 0,
      currency: 'DOP',
      maxUsers: 3,
      maxCustomers: 100,
      maxProjects: 10,
      storageMb: 1024,
      advancedReports: false,
      apiAccess: false,
      isActive: true,
    },
    {
      code: 'PRO',
      name: 'Pro',
      description: 'Mayor capacidad y reportes avanzados.',
      monthlyPrice: 0,
      currency: 'DOP',
      maxUsers: 10,
      maxCustomers: 1000,
      maxProjects: 100,
      storageMb: 10240,
      advancedReports: true,
      apiAccess: false,
      isActive: true,
    },
    {
      code: 'BUSINESS',
      name: 'Business',
      description: 'Capacidad ampliada y acceso de integración.',
      monthlyPrice: 0,
      currency: 'DOP',
      maxUsers: 50,
      maxCustomers: 10000,
      maxProjects: 1000,
      storageMb: 51200,
      advancedReports: true,
      apiAccess: true,
      isActive: true,
    },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { code: plan.code },
      create: plan,
      // Limits edited by an operator are preserved unless a sync is requested.
      update: syncPlans ? plan : {},
    });
  }
}

async function ensureSubscription(companyId: string) {
  const existing = await prisma.subscription.findUnique({ where: { companyId } });
  if (existing) return existing;

  const starterPlan = await prisma.plan.findUniqueOrThrow({ where: { code: 'STARTER' } });
  return prisma.subscription.create({
    data: {
      companyId,
      planId: starterPlan.id,
      status: 'TRIAL',
      trialEndsAt: addDays(new Date(), 14),
    },
  });
}

function addDays(date: Date, days: number): Date {
  return new Date(
    date.getTime() + days * 24 * 60 * 60 * 1000,
  );
}

function printCredentials(message: string, generatedPassword?: string): void {
  console.log(message);
  console.log(`Usuario: ${ADMIN_EMAIL}`);
  console.log(
    generatedPassword
      ? `Contraseña inicial generada (cámbiala al iniciar sesión): ${generatedPassword}`
      : 'Contraseña: la definida en SEED_ADMIN_PASSWORD.',
  );
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