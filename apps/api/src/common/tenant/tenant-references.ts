import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

/**
 * Prisma client or interactive transaction. All helpers in this file only read data,
 * so they can run inside the same transaction that performs the write.
 */
export type TenantDb = Prisma.TransactionClient | PrismaClient;

/**
 * Ensures that a user referenced by id (owner, manager, assignee…) belongs to the tenant.
 * New assignments require an ACTIVE user; keeping an existing assignment does not.
 */
export async function assertTenantUser(
  db: TenantDb,
  companyId: string,
  userId: string | null | undefined,
  label = 'responsable',
): Promise<void> {
  if (!userId) return;
  const user = await db.user.findFirst({
    where: { id: userId, companyId, status: 'ACTIVE' },
    select: { id: true },
  });
  if (!user) {
    throw new BadRequestException(`El ${label} indicado no existe o no está activo en tu empresa.`);
  }
}

export async function assertTenantCustomer(
  db: TenantDb,
  companyId: string,
  customerId: string | null | undefined,
): Promise<void> {
  if (!customerId) return;
  const customer = await db.customer.findFirst({
    where: { id: customerId, companyId },
    select: { id: true },
  });
  if (!customer) throw new NotFoundException('Cliente no válido.');
}

/**
 * Validates an opportunity of the tenant and, when a customer is given, that the
 * opportunity belongs to that customer.
 */
export async function assertTenantOpportunity(
  db: TenantDb,
  companyId: string,
  opportunityId: string | null | undefined,
  customerId?: string | null,
): Promise<{ id: string; customerId: string } | null> {
  if (!opportunityId) return null;
  const opportunity = await db.opportunity.findFirst({
    where: { id: opportunityId, companyId },
    select: { id: true, customerId: true },
  });
  if (!opportunity) throw new NotFoundException('Oportunidad no válida.');
  if (customerId && opportunity.customerId !== customerId) {
    throw new BadRequestException(
      'La oportunidad seleccionada no corresponde al cliente indicado.',
    );
  }
  return opportunity;
}

export async function assertTenantPipelineStage(
  db: TenantDb,
  companyId: string,
  pipelineStageId: string | null | undefined,
): Promise<void> {
  if (!pipelineStageId) return;
  const stage = await db.pipelineStage.findFirst({
    where: { id: pipelineStageId, companyId },
    select: { id: true },
  });
  if (!stage) throw new NotFoundException('Etapa del pipeline no válida.');
}

/** Every catalog item used in a quote must belong to the tenant and be active. */
export async function assertTenantCatalogItems(
  db: TenantDb,
  companyId: string,
  catalogItemIds: Array<string | null | undefined>,
): Promise<void> {
  const ids = [...new Set(catalogItemIds.filter((id): id is string => Boolean(id)))];
  if (!ids.length) return;
  const found = await db.catalogItem.findMany({
    where: { id: { in: ids }, companyId, isActive: true },
    select: { id: true },
  });
  if (found.length !== ids.length) {
    throw new BadRequestException(
      'Uno o más artículos del catálogo no existen o no están activos en tu empresa.',
    );
  }
}

/**
 * A parent task must exist in the same project and must not create a cycle.
 * The walk is bounded to protect against corrupted hierarchies.
 */
export async function assertTaskParent(
  db: TenantDb,
  projectId: string,
  parentId: string | null | undefined,
  taskId?: string,
): Promise<void> {
  if (!parentId) return;
  if (taskId && parentId === taskId) {
    throw new BadRequestException('Una tarea no puede ser su propia tarea padre.');
  }

  let currentId: string | null = parentId;
  for (let depth = 0; currentId && depth < 50; depth += 1) {
    const current: { id: string; parentId: string | null } | null = await db.projectTask.findFirst({
      where: { id: currentId, projectId },
      select: { id: true, parentId: true },
    });
    if (!current) {
      throw new BadRequestException(
        depth === 0
          ? 'La tarea padre no pertenece a este proyecto.'
          : 'La jerarquía de tareas no es válida.',
      );
    }
    if (taskId && current.parentId === taskId) {
      throw new BadRequestException('La jerarquía de tareas no puede contener ciclos.');
    }
    currentId = current.parentId;
  }
}
