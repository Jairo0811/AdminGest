import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TRANSACTION_OPTIONS } from '../../common/tenant/app-lock';
import {
  assertTaskParent,
  assertTenantCustomer,
  assertTenantOpportunity,
  assertTenantUser,
  TenantDb,
} from '../../common/tenant/tenant-references';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

function assertDateRange(start?: string | Date | null, end?: string | Date | null, label = 'La fecha de finalización') {
  if (start && end && new Date(end).getTime() < new Date(start).getTime()) {
    throw new BadRequestException(`${label} no puede ser anterior a la fecha de inicio.`);
  }
}

/** Average of task progress, rounded; a project without tasks keeps 0 %. */
export async function recalculateProjectProgress(db: TenantDb, projectId: string) {
  const aggregate = await db.projectTask.aggregate({
    where: { projectId },
    _avg: { progress: true },
  });
  await db.project.update({
    where: { id: projectId },
    data: { progress: Math.round(aggregate._avg.progress ?? 0) },
  });
}

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly subscriptions: SubscriptionsService,
    private readonly notifications: NotificationsService,
  ) {}

  findAll(companyId: string, status?: string) {
    return this.prisma.project.findMany({
      where: { companyId, ...(status ? { status } : {}) },
      include: {
        customer: { select: { id: true, name: true } },
        manager: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { tasks: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(companyId: string, id: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, companyId },
      include: {
        customer: true,
        opportunity: true,
        manager: { select: { id: true, firstName: true, lastName: true } },
        tasks: {
          include: {
            assignee: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
        },
      },
    });
    if (!project) throw new NotFoundException('Proyecto no encontrado.');
    return project;
  }

  async create(companyId: string, userId: string, dto: CreateProjectDto) {
    assertDateRange(dto.startDate, dto.endDate);
    await assertTenantCustomer(this.prisma, companyId, dto.customerId);
    await assertTenantOpportunity(this.prisma, companyId, dto.opportunityId, dto.customerId);
    const managerId = dto.managerId ?? userId;
    if (managerId !== userId) {
      await assertTenantUser(this.prisma, companyId, managerId, 'gerente del proyecto');
    }

    const project = await this.subscriptions.runWithinQuota(
      companyId,
      'projects',
      (tx) =>
        tx.project.create({
          data: {
            companyId,
            ...dto,
            managerId,
            startDate: dto.startDate ? new Date(dto.startDate) : undefined,
            endDate: dto.endDate ? new Date(dto.endDate) : undefined,
          },
          include: { customer: true, manager: { select: { id: true, firstName: true, lastName: true } } },
        }),
    );
    await this.audit.record({
      companyId,
      userId,
      action: 'CREATE',
      entity: 'Project',
      entityId: project.id,
      newValues: dto,
    });
    await this.notifications.emit({
      companyId,
      userId: project.managerId ?? userId,
      eventType: 'PROJECT_ASSIGNED',
      title: 'Proyecto asignado',
      message: project.name,
      path: '/projects',
      dedupeKey: 'project-created:' + project.id,
    });
    return project;
  }

  async update(
    companyId: string,
    userId: string,
    id: string,
    dto: UpdateProjectDto,
  ) {
    const existing = await this.findOne(companyId, id);
    const customerId = dto.customerId ?? existing.customerId;
    const opportunityId =
      dto.opportunityId !== undefined ? dto.opportunityId : existing.opportunityId;

    assertDateRange(dto.startDate ?? existing.startDate, dto.endDate ?? existing.endDate);
    if (dto.customerId && dto.customerId !== existing.customerId) {
      await assertTenantCustomer(this.prisma, companyId, dto.customerId);
    }
    if (dto.customerId !== undefined || dto.opportunityId !== undefined) {
      await assertTenantOpportunity(this.prisma, companyId, opportunityId, customerId);
    }
    if (dto.managerId && dto.managerId !== existing.managerId) {
      await assertTenantUser(this.prisma, companyId, dto.managerId, 'gerente del proyecto');
    }

    const project = await this.prisma.project.update({
      where: { id },
      data: {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
    await this.audit.record({
      companyId,
      userId,
      action: 'UPDATE',
      entity: 'Project',
      entityId: id,
      oldValues: existing,
      newValues: dto,
    });
    if (dto.managerId && dto.managerId !== existing.managerId) {
      await this.notifications.emit({
        companyId,
        userId: dto.managerId,
        eventType: 'PROJECT_ASSIGNED',
        title: 'Proyecto asignado',
        message: project.name,
        path: '/projects',
        dedupeKey: `project-manager:${project.id}:${dto.managerId}`,
      });
    }
    return project;
  }

  async addTask(
    companyId: string,
    userId: string,
    projectId: string,
    dto: CreateTaskDto,
  ) {
    await this.findOne(companyId, projectId);
    assertDateRange(dto.startDate, dto.dueDate, 'La fecha de vencimiento');
    await assertTenantUser(this.prisma, companyId, dto.assigneeId, 'responsable de la tarea');
    await assertTaskParent(this.prisma, projectId, dto.parentId);

    const task = await this.prisma.$transaction(async (tx) => {
      const created = await tx.projectTask.create({
        data: {
          projectId,
          ...dto,
          startDate: dto.startDate ? new Date(dto.startDate) : undefined,
          dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        },
      });
      await recalculateProjectProgress(tx, projectId);
      return created;
    }, TRANSACTION_OPTIONS);

    await this.audit.record({
      companyId,
      userId,
      action: 'CREATE',
      entity: 'ProjectTask',
      entityId: task.id,
      newValues: dto,
    });
    return task;
  }

  async updateTask(
    companyId: string,
    userId: string,
    taskId: string,
    dto: UpdateTaskDto,
  ) {
    const existing = await this.prisma.projectTask.findFirst({
      where: { id: taskId, project: { companyId } },
    });
    if (!existing) throw new NotFoundException('Tarea no encontrada.');
    assertDateRange(dto.startDate ?? existing.startDate, dto.dueDate ?? existing.dueDate, 'La fecha de vencimiento');
    if (dto.assigneeId && dto.assigneeId !== existing.assigneeId) {
      await assertTenantUser(this.prisma, companyId, dto.assigneeId, 'responsable de la tarea');
    }
    if (dto.parentId && dto.parentId !== existing.parentId) {
      await assertTaskParent(this.prisma, existing.projectId, dto.parentId, taskId);
    }

    const progress =
      dto.status === 'COMPLETED'
        ? 100
        : dto.progress === 100 && !dto.status
          ? 100
          : dto.progress;
    const status =
      dto.status ?? (dto.progress === 100 && existing.status !== 'COMPLETED' ? 'COMPLETED' : undefined);

    const task = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.projectTask.update({
        where: { id: taskId },
        data: {
          ...dto,
          status,
          progress,
          startDate: dto.startDate ? new Date(dto.startDate) : undefined,
          dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        },
      });
      await recalculateProjectProgress(tx, updated.projectId);
      return updated;
    }, TRANSACTION_OPTIONS);

    await this.audit.record({
      companyId,
      userId,
      action: 'UPDATE',
      entity: 'ProjectTask',
      entityId: taskId,
      oldValues: existing,
      newValues: dto,
    });
    return task;
  }

  async remove(companyId: string, userId: string, id: string) {
    const existing = await this.findOne(companyId, id);
    await this.prisma.$transaction(async (tx) => {
      await tx.documentRecord.updateMany({
        where: { companyId, projectId: id },
        data: { projectId: null },
      });
      // Children first: the self-referencing hierarchy uses NO ACTION.
      await tx.projectTask.updateMany({ where: { projectId: id }, data: { parentId: null } });
      await tx.projectTask.deleteMany({ where: { projectId: id } });
      await tx.project.delete({ where: { id } });
    }, TRANSACTION_OPTIONS);
    await this.audit.record({
      companyId,
      userId,
      action: 'DELETE',
      entity: 'Project',
      entityId: id,
      oldValues: existing,
    });
    return { deleted: true };
  }
}
