import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AuthUser } from '../../common/types/auth-user';
import { ResourceQueryDto } from '../../common/types/resource-query.dto';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';

@Injectable()
export class ActivitiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findAll(user: AuthUser, query: ResourceQueryDto) {
    const where = {
      companyId: user.companyId,
      ...(query.status ? { status: query.status } : {}),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.activity.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true } },
          opportunity: { select: { id: true, name: true } },
          owner: { select: { firstName: true, lastName: true } },
        },
        orderBy: { scheduledAt: 'asc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.activity.count({ where }),
    ]);
    return {
      data,
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        pages: Math.ceil(total / query.pageSize),
      },
    };
  }

  async create(user: AuthUser, dto: CreateActivityDto) {
    await this.validateRelations(user.companyId, dto.customerId, dto.opportunityId);
    const activity = await this.prisma.activity.create({
      data: { companyId: user.companyId, ownerId: user.id, ...dto },
    });
    await this.audit.log({
      companyId: user.companyId,
      userId: user.id,
      action: 'CREATE',
      entity: 'Activity',
      entityId: activity.id,
      newValues: activity,
    });
    return activity;
  }

  async update(user: AuthUser, id: string, dto: UpdateActivityDto) {
    await this.requireActivity(user.companyId, id);
    await this.validateRelations(user.companyId, dto.customerId, dto.opportunityId);
    const data = {
      ...dto,
      completedAt:
        dto.status === 'COMPLETED' && !dto.completedAt ? new Date() : dto.completedAt,
    };
    return this.prisma.activity.update({ where: { id }, data });
  }

  async remove(user: AuthUser, id: string) {
    const activity = await this.requireActivity(user.companyId, id);
    await this.prisma.activity.delete({ where: { id } });
    await this.audit.log({
      companyId: user.companyId,
      userId: user.id,
      action: 'DELETE',
      entity: 'Activity',
      entityId: id,
      oldValues: activity,
    });
    return { success: true };
  }

  private async validateRelations(
    companyId: string,
    customerId?: string,
    opportunityId?: string,
  ) {
    if (customerId) {
      const customer = await this.prisma.customer.findFirst({
        where: { id: customerId, companyId },
      });
      if (!customer) throw new BadRequestException('El cliente indicado no es válido.');
    }
    if (opportunityId) {
      const opportunity = await this.prisma.opportunity.findFirst({
        where: { id: opportunityId, companyId },
      });
      if (!opportunity) throw new BadRequestException('La oportunidad indicada no es válida.');
    }
  }

  private async requireActivity(companyId: string, id: string) {
    const activity = await this.prisma.activity.findFirst({ where: { id, companyId } });
    if (!activity) throw new NotFoundException('Actividad no encontrada.');
    return activity;
  }
}
