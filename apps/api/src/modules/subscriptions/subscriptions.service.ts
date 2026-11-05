import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  acquireTransactionLock,
  TRANSACTION_OPTIONS,
} from '../../common/tenant/app-lock';
import { TenantDb } from '../../common/tenant/tenant-references';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import {
  hasReachedLimit,
  isSubscriptionUsable,
  LimitedResource,
  remainingCapacity,
} from './subscription-limits';

const RESOURCE_LABELS: Record<LimitedResource, string> = {
  users: 'usuarios',
  customers: 'clientes',
  projects: 'proyectos',
};

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  async getCurrent(companyId: string, db: TenantDb = this.prisma) {
    const subscription = await db.subscription.findUnique({
      where: { companyId },
      include: { plan: true },
    });

    if (!subscription) {
      throw new NotFoundException(
        'La empresa no tiene una suscripción configurada.',
      );
    }

    // Sequential reads keep this usable inside an interactive transaction.
    const users = await db.user.count({ where: { companyId, status: 'ACTIVE' } });
    const customers = await db.customer.count({
      where: { companyId, isActive: true },
    });
    const projects = await db.project.count({ where: { companyId } });

    const usage = { users, customers, projects };
    const limits = {
      users: subscription.plan.maxUsers,
      customers: subscription.plan.maxCustomers,
      projects: subscription.plan.maxProjects,
    };

    return {
      ...subscription,
      isUsable: isSubscriptionUsable(
        subscription.status,
        subscription.trialEndsAt,
        new Date(),
        subscription.currentPeriodEnd,
      ),
      usage,
      limits,
      remaining: {
        users: remainingCapacity(limits.users, usage.users),
        customers: remainingCapacity(limits.customers, usage.customers),
        projects: remainingCapacity(limits.projects, usage.projects),
      },
      // Only these quotas are enforced in v1.2.0. storageMb, advancedReports and
      // apiAccess are informative plan attributes without technical enforcement yet.
      enforcedLimits: ['users', 'customers', 'projects'] as LimitedResource[],
      informativeFeatures: ['storageMb', 'advancedReports', 'apiAccess'] as const,
      // No payment provider is integrated: plans are assigned by an operator.
      billing: { integrated: false, automaticRenewal: false },
    };
  }

  /**
   * Checks the quota. When called outside {@link runWithinQuota} the check is only
   * advisory, because a concurrent request could consume the last slot.
   */
  async assertCanCreate(
    companyId: string,
    resource: LimitedResource,
    db: TenantDb = this.prisma,
  ): Promise<void> {
    const current = await this.getCurrent(companyId, db);

    if (!current.isUsable) {
      throw new ForbiddenException(
        'La suscripción de la empresa no está activa. Actualiza el plan para continuar.',
      );
    }

    if (hasReachedLimit(current.limits[resource], current.usage[resource])) {
      throw new ForbiddenException(
        `Has alcanzado el límite de ${RESOURCE_LABELS[resource]} de tu plan ${current.plan.name}.`,
      );
    }
  }

  /**
   * Runs `operation` inside a transaction that holds an exclusive application lock
   * for (company, resource). The quota is checked and the resource created atomically,
   * so concurrent requests cannot exceed the plan limit.
   */
  async runWithinQuota<T>(
    companyId: string,
    resource: LimitedResource,
    operation: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      await acquireTransactionLock(tx, `quota:${resource}:${companyId}`);
      await this.assertCanCreate(companyId, resource, tx);
      return operation(tx);
    }, TRANSACTION_OPTIONS);
  }
}
