import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import {
  assertTenantCustomer,
  assertTenantPipelineStage,
  assertTenantUser,
} from '../../common/tenant/tenant-references';
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
        activities: { where: { companyId }, orderBy: { scheduledAt: 'desc' } },
        quotes: { where: { companyId } },
      },
    });
    if (!opportunity) throw new NotFoundException('Oportunidad no encontrada.');
    return opportunity;
  }

  async create(companyId: string, userId: string, dto: CreateOpportunityDto) {
    await assertTenantCustomer(this.prisma, companyId, dto.customerId);
    await assertTenantPipelineStage(this.prisma, companyId, dto.pipelineStageId);
    await assertTenantUser(this.prisma, companyId, dto.ownerId, 'responsable');
    const opportunity = await this.prisma.opportunity.create({
      data: {
        companyId,
        ...dto,
        expectedCloseDate: dto.expectedCloseDate ? new Date(dto.expectedCloseDate) : undefined,
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

  async update(companyId: string, userId: string, id: string, dto: UpdateOpportunityDto) {
    const existing = await this.findOne(companyId, id);
    if (dto.customerId && dto.customerId !== existing.customerId) {
      await assertTenantCustomer(this.prisma, companyId, dto.customerId);
      // Quotes and projects keep the original customer; moving the opportunity would
      // break the commercial chain customer → opportunity → quote/project.
      const linked = await this.prisma.opportunity.findFirst({
        where: { id, companyId },
        select: { _count: { select: { quotes: true } }, project: { select: { id: true } } },
      });
      if (linked && (linked._count.quotes > 0 || linked.project)) {
        throw new ConflictException(
          'No es posible cambiar el cliente de una oportunidad con cotizaciones o proyecto asociados.',
        );
      }
    }
    if (dto.pipelineStageId && dto.pipelineStageId !== existing.pipelineStageId) {
      await assertTenantPipelineStage(this.prisma, companyId, dto.pipelineStageId);
    }
    if (dto.ownerId && dto.ownerId !== existing.ownerId) {
      await assertTenantUser(this.prisma, companyId, dto.ownerId, 'responsable');
    }
    const opportunity = await this.prisma.opportunity.update({
      where: { id },
      data: {
        ...dto,
        expectedCloseDate: dto.expectedCloseDate ? new Date(dto.expectedCloseDate) : undefined,
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
    const linked = await this.prisma.opportunity.findFirst({
      where: { id, companyId },
      select: {
        _count: { select: { quotes: true, activities: true } },
        project: { select: { id: true } },
      },
    });
    if (linked && (linked._count.quotes > 0 || linked._count.activities > 0 || linked.project)) {
      throw new ConflictException(
        'La oportunidad tiene actividades, cotizaciones o un proyecto asociados. Márcala como perdida en lugar de eliminarla.',
      );
    }
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
}
