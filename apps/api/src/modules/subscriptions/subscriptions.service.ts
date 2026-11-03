import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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

  async getCurrent(companyId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { companyId },
      include: { plan: true },
    });

    if (!subscription) {
      throw new NotFoundException(
        'La empresa no tiene una suscripción configurada.',
      );
    }

    const [users, customers, projects] = await this.prisma.$transaction([
      this.prisma.user.count({ where: { companyId, status: 'ACTIVE' } }),
      this.prisma.customer.count({ where: { companyId, isActive: true } }),
      this.prisma.project.count({ where: { companyId } }),
    ]);

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
      ),
      usage,
      remaining: {
        users: remainingCapacity(limits.users, usage.users),
        customers: remainingCapacity(limits.customers, usage.customers),
        projects: remainingCapacity(limits.projects, usage.projects),
      },
    };
  }

  async assertCanCreate(
    companyId: string,
    resource: LimitedResource,
  ): Promise<void> {
    const current = await this.getCurrent(companyId);

    if (!current.isUsable) {
      throw new ForbiddenException(
        'La suscripción de la empresa no está activa. Actualiza el plan para continuar.',
      );
    }

    const limits: Record<LimitedResource, number> = {
      users: current.plan.maxUsers,
      customers: current.plan.maxCustomers,
      projects: current.plan.maxProjects,
    };

    if (hasReachedLimit(limits[resource], current.usage[resource])) {
      throw new ForbiddenException(
        `Has alcanzado el límite de ${RESOURCE_LABELS[resource]} de tu plan ${current.plan.name}.`,
      );
    }
  }
}
