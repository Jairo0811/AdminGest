import { Injectable, NotFoundException } from '@nestjs/common';
import {
  assertTenantCustomer,
  assertTenantOpportunity,
  assertTenantUser,
} from '../../common/tenant/tenant-references';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';

@Injectable()
export class ActivitiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
  ) {}

  findAll(companyId: string, status?: string) {
    return this.prisma.activity.findMany({
      where: { companyId, ...(status ? { status } : {}) },
      include: {
        customer: { select: { id: true, name: true } },
        opportunity: { select: { id: true, name: true } },
        owner: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async findOne(companyId: string, id: string) {
    const activity = await this.prisma.activity.findFirst({
      where: { id, companyId },
      include: { customer: true, opportunity: true },
    });
    if (!activity) throw new NotFoundException('Actividad no encontrada.');
    return activity;
  }

  async create(companyId: string, userId: string, dto: CreateActivityDto) {
    await this.validateRelations(companyId, dto.customerId, dto.opportunityId);
    if (dto.ownerId && dto.ownerId !== userId) {
      await assertTenantUser(this.prisma, companyId, dto.ownerId, 'responsable');
    }
    const activity = await this.prisma.activity.create({
      data: {
        companyId,
        ...dto,
        ownerId: dto.ownerId ?? userId,
        scheduledAt: new Date(dto.scheduledAt),
      },
    });
    await this.audit.record({
      companyId,
      userId,
      action: 'CREATE',
      entity: 'Activity',
      entityId: activity.id,
      newValues: dto,
    });
    await this.notifications.emit({
      companyId,
      userId: activity.ownerId ?? userId,
      eventType: 'ACTIVITY_ASSIGNED',
      title: 'Nueva actividad asignada',
      message: activity.subject,
      path: '/activities',
      dedupeKey: 'activity-created:' + activity.id,
    });
    return activity;
  }

  async update(companyId: string, userId: string, id: string, dto: UpdateActivityDto) {
    const existing = await this.findOne(companyId, id);
    if (dto.customerId !== undefined || dto.opportunityId !== undefined) {
      await this.validateRelations(
        companyId,
        dto.customerId ?? existing.customerId,
        dto.opportunityId ?? existing.opportunityId,
      );
    }
    if (dto.ownerId && dto.ownerId !== existing.ownerId) {
      await assertTenantUser(this.prisma, companyId, dto.ownerId, 'responsable');
    }
    const activity = await this.prisma.activity.update({
      where: { id },
      data: {
        ...dto,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
        completedAt:
          dto.status === 'COMPLETED'
            ? (existing.completedAt ?? new Date())
            : dto.status
              ? null
              : undefined,
      },
    });
    await this.audit.record({
      companyId,
      userId,
      action: 'UPDATE',
      entity: 'Activity',
      entityId: id,
      oldValues: existing,
      newValues: dto,
    });
    if (activity.ownerId && activity.ownerId !== existing.ownerId) {
      await this.notifications.emit({
        companyId,
        userId: activity.ownerId,
        eventType: 'ACTIVITY_ASSIGNED',
        title: 'Actividad reasignada',
        message: activity.subject,
        path: '/activities',
        dedupeKey: `activity-owner:${activity.id}:${activity.ownerId}`,
      });
    }
    return activity;
  }

  async remove(companyId: string, userId: string, id: string) {
    const existing = await this.findOne(companyId, id);
    await this.prisma.activity.delete({ where: { id } });
    await this.audit.record({
      companyId,
      userId,
      action: 'DELETE',
      entity: 'Activity',
      entityId: id,
      oldValues: existing,
    });
    return { deleted: true };
  }

  private async validateRelations(
    companyId: string,
    customerId?: string | null,
    opportunityId?: string | null,
  ) {
    await assertTenantCustomer(this.prisma, companyId, customerId);
    await assertTenantOpportunity(this.prisma, companyId, opportunityId, customerId);
  }
}
