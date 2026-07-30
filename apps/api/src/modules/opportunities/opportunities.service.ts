import { Injectable, NotFoundException } from '@nestjs/common';
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

  findStages(companyId: string) {
    return this.prisma.pipelineStage.findMany({
      where: { companyId },
      orderBy: { position: 'asc' },
    });
  }

  findAll(companyId: string, status?: string) {
    return this.prisma.opportunity.findMany({
      where: { companyId, ...(status ? { status } : {}) },
      include: {
        customer: { select: { id: true, name: true } },
        pipelineStage: true,
        owner: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(companyId: string, id: string) {
    const opportunity = await this.prisma.opportunity.findFirst({
      where: { id, companyId },
      include: {
        customer: true,
        pipelineStage: true,
        owner: { select: { id: true, firstName: true, lastName: true } },
        activities: { orderBy: { scheduledAt: 'desc' } },
        quotes: true,
      },
    });
    if (!opportunity) throw new NotFoundException('Oportunidad no encontrada.');
    return opportunity;
  }

  async create(companyId: string, userId: string, dto: CreateOpportunityDto) {
    await this.ensureReferences(companyId, dto.customerId, dto.pipelineStageId);
    const opportunity = await this.prisma.opportunity.create({
      data: {
        companyId,
        ...dto,
        expectedCloseDate: dto.expectedCloseDate
          ? new Date(dto.expectedCloseDate)
          : undefined,
      },
      include: { customer: true, pipelineStage: true },
    });
    await this.audit.record({
      companyId,
      userId,
      action: 'CREATE',
      entity: 'Opportunity',
      entityId: opportunity.id,
      newValues: dto,
    });
    return opportunity;
  }

  async update(
    companyId: string,
    userId: string,
    id: string,
    dto: UpdateOpportunityDto,
  ) {
    const existing = await this.findOne(companyId, id);
    if (dto.customerId || dto.pipelineStageId) {
      await this.ensureReferences(
        companyId,
        dto.customerId ?? existing.customerId,
        dto.pipelineStageId ?? existing.pipelineStageId,
      );
    }
    const opportunity = await this.prisma.opportunity.update({
      where: { id },
      data: {
        ...dto,
        expectedCloseDate: dto.expectedCloseDate
          ? new Date(dto.expectedCloseDate)
          : undefined,
      },
      include: { customer: true, pipelineStage: true },
    });
    await this.audit.record({
      companyId,
      userId,
      action: 'UPDATE',
      entity: 'Opportunity',
      entityId: id,
      oldValues: existing,
      newValues: dto,
    });
    return opportunity;
  }

  async remove(companyId: string, userId: string, id: string) {
    const existing = await this.findOne(companyId, id);
    await this.prisma.opportunity.delete({ where: { id } });
    await this.audit.record({
      companyId,
      userId,
      action: 'DELETE',
      entity: 'Opportunity',
      entityId: id,
      oldValues: existing,
    });
    return { deleted: true };
  }

  private async ensureReferences(
    companyId: string,
    customerId: string,
    pipelineStageId: string,
  ) {
    const [customer, stage] = await Promise.all([
      this.prisma.customer.findFirst({ where: { id: customerId, companyId } }),
      this.prisma.pipelineStage.findFirst({
        where: { id: pipelineStageId, companyId },
      }),
    ]);
    if (!customer || !stage) {
      throw new NotFoundException('Cliente o etapa del pipeline no válidos.');
    }
  }
}

