import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuthUser } from '../../common/types/auth-user';
import { ResourceQueryDto } from '../../common/types/resource-query.dto';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateOpportunityDto } from './dto/create-opportunity.dto';
import { UpdateOpportunityDto } from './dto/update-opportunity.dto';

@Injectable()
export class OpportunitiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  stages(companyId: string) {
    return this.prisma.pipelineStage.findMany({
      where: { companyId },
      orderBy: { position: 'asc' },
    });
  }

  async findAll(user: AuthUser, query: ResourceQueryDto) {
    const search = query.search?.trim();
    const where: Prisma.OpportunityWhereInput = {
      companyId: user.companyId,
      ...(query.status ? { status: query.status } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { customer: { name: { contains: search } } },
            ],
          }
        : {}),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.opportunity.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true } },
          pipelineStage: true,
          owner: { select: { firstName: true, lastName: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.opportunity.count({ where }),
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

  async create(user: AuthUser, dto: CreateOpportunityDto) {
    await this.validateRelations(user.companyId, dto.customerId, dto.pipelineStageId);
    const opportunity = await this.prisma.opportunity.create({
      data: {
        companyId: user.companyId,
        ownerId: user.id,
        ...dto,
      },
      include: { customer: true, pipelineStage: true },
    });
    await this.audit.log({
      companyId: user.companyId,
      userId: user.id,
      action: 'CREATE',
      entity: 'Opportunity',
      entityId: opportunity.id,
      newValues: opportunity,
    });
    return opportunity;
  }

  async update(user: AuthUser, id: string, dto: UpdateOpportunityDto) {
    const before = await this.requireOpportunity(user.companyId, id);
    await this.validateRelations(
      user.companyId,
      dto.customerId ?? before.customerId,
      dto.pipelineStageId ?? before.pipelineStageId,
    );
    if (dto.status === 'LOST' && !dto.lostReason) {
      throw new BadRequestException('Debes indicar el motivo de pérdida.');
    }
    const opportunity = await this.prisma.opportunity.update({
      where: { id },
      data: dto,
      include: { customer: true, pipelineStage: true },
    });
    await this.audit.log({
      companyId: user.companyId,
      userId: user.id,
      action: 'UPDATE',
      entity: 'Opportunity',
      entityId: id,
      oldValues: before,
      newValues: opportunity,
    });
    return opportunity;
  }

  async remove(user: AuthUser, id: string) {
    const opportunity = await this.requireOpportunity(user.companyId, id);
    await this.prisma.opportunity.delete({ where: { id } });
    await this.audit.log({
      companyId: user.companyId,
      userId: user.id,
      action: 'DELETE',
      entity: 'Opportunity',
      entityId: id,
      oldValues: opportunity,
    });
    return { success: true };
  }

  private async validateRelations(companyId: string, customerId: string, stageId: string) {
    const [customer, stage] = await Promise.all([
      this.prisma.customer.findFirst({ where: { id: customerId, companyId, isActive: true } }),
      this.prisma.pipelineStage.findFirst({ where: { id: stageId, companyId } }),
    ]);
    if (!customer || !stage) {
      throw new BadRequestException('Cliente o etapa comercial no válidos.');
    }
  }

  private async requireOpportunity(companyId: string, id: string) {
    const opportunity = await this.prisma.opportunity.findFirst({
      where: { id, companyId },
    });
    if (!opportunity) {
      throw new NotFoundException('Oportunidad no encontrada.');
    }
    return opportunity;
  }
}
