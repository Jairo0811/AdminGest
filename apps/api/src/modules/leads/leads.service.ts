import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';

@Injectable()
export class LeadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findAll(companyId: string, search?: string, status?: string) {
    const where: Prisma.LeadWhereInput = {
      companyId,
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { firstName: { contains: search } },
              { lastName: { contains: search } },
              { companyName: { contains: search } },
              { email: { contains: search } },
            ],
          }
        : {}),
    };

    return this.prisma.lead.findMany({
      where,
      include: {
        owner: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findOne(companyId: string, id: string) {
    const lead = await this.prisma.lead.findFirst({
      where: { id, companyId },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    if (!lead) throw new NotFoundException('Prospecto no encontrado.');
    return lead;
  }

  async create(companyId: string, userId: string, dto: CreateLeadDto) {
    const lead = await this.prisma.lead.create({
      data: { companyId, ...dto },
    });
    await this.audit.record({
      companyId,
      userId,
      action: 'CREATE',
      entity: 'Lead',
      entityId: lead.id,
      newValues: dto,
    });
    return lead;
  }

  async update(companyId: string, userId: string, id: string, dto: UpdateLeadDto) {
    const existing = await this.findOne(companyId, id);
    const lead = await this.prisma.lead.update({
      where: { id },
      data: {
        ...dto,
        convertedAt:
          dto.status === 'CONVERTED'
            ? existing.convertedAt ?? new Date()
            : dto.status
              ? null
              : undefined,
      },
    });
    await this.audit.record({
      companyId,
      userId,
      action: 'UPDATE',
      entity: 'Lead',
      entityId: id,
      oldValues: existing,
      newValues: dto,
    });
    return lead;
  }

  async remove(companyId: string, userId: string, id: string) {
    const existing = await this.findOne(companyId, id);
    await this.prisma.lead.delete({ where: { id } });
    await this.audit.record({
      companyId,
      userId,
      action: 'DELETE',
      entity: 'Lead',
      entityId: id,
      oldValues: existing,
    });
    return { deleted: true };
  }
}

