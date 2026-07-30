import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Paginated } from '../../common/types/paginated';
import { ResourceQueryDto } from '../../common/types/resource-query.dto';
import { AuthUser } from '../../common/types/auth-user';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { LeadStatus } from './dto/update-lead-status.dto';

@Injectable()
export class LeadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findAll(user: AuthUser, query: ResourceQueryDto): Promise<Paginated<unknown>> {
    const search = query.search?.trim();
    const where: Prisma.LeadWhereInput = {
      companyId: user.companyId,
      ...(query.status ? { status: query.status } : {}),
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
    const [data, total] = await this.prisma.$transaction([
      this.prisma.lead.findMany({
        where,
        include: { owner: { select: { firstName: true, lastName: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.lead.count({ where }),
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

  async findOne(user: AuthUser, id: string) {
    return this.requireLead(user.companyId, id);
  }

  async create(user: AuthUser, dto: CreateLeadDto) {
    const lead = await this.prisma.lead.create({
      data: {
        companyId: user.companyId,
        ownerId: user.id,
        ...dto,
        email: dto.email?.toLowerCase(),
      },
    });
    await this.audit.log({
      companyId: user.companyId,
      userId: user.id,
      action: 'CREATE',
      entity: 'Lead',
      entityId: lead.id,
      newValues: lead,
    });
    return lead;
  }

  async update(user: AuthUser, id: string, dto: UpdateLeadDto) {
    const before = await this.requireLead(user.companyId, id);
    const lead = await this.prisma.lead.update({
      where: { id },
      data: { ...dto, email: dto.email?.toLowerCase() },
    });
    await this.audit.log({
      companyId: user.companyId,
      userId: user.id,
      action: 'UPDATE',
      entity: 'Lead',
      entityId: id,
      oldValues: before,
      newValues: lead,
    });
    return lead;
  }

  async updateStatus(user: AuthUser, id: string, status: LeadStatus) {
    await this.requireLead(user.companyId, id);
    return this.prisma.lead.update({
      where: { id },
      data: { status },
    });
  }

  async convert(user: AuthUser, id: string) {
    const lead = await this.requireLead(user.companyId, id);
    if (lead.status === 'CONVERTED') {
      throw new BadRequestException('Este prospecto ya fue convertido.');
    }

    const customer = await this.prisma.$transaction(async (transaction) => {
      const created = await transaction.customer.create({
        data: {
          companyId: user.companyId,
          name: lead.companyName || [lead.firstName, lead.lastName].filter(Boolean).join(' '),
          email: lead.email,
          phone: lead.phone,
          contacts: lead.companyName
            ? {
                create: {
                  firstName: lead.firstName,
                  lastName: lead.lastName,
                  jobTitle: lead.jobTitle,
                  email: lead.email,
                  phone: lead.phone,
                  isPrimary: true,
                },
              }
            : undefined,
        },
      });
      await transaction.lead.update({
        where: { id },
        data: { status: 'CONVERTED', convertedAt: new Date() },
      });
      return created;
    });

    await this.audit.log({
      companyId: user.companyId,
      userId: user.id,
      action: 'CONVERT',
      entity: 'Lead',
      entityId: id,
      newValues: { customerId: customer.id },
    });
    return customer;
  }

  async remove(user: AuthUser, id: string) {
    const lead = await this.requireLead(user.companyId, id);
    await this.prisma.lead.delete({ where: { id } });
    await this.audit.log({
      companyId: user.companyId,
      userId: user.id,
      action: 'DELETE',
      entity: 'Lead',
      entityId: id,
      oldValues: lead,
    });
    return { success: true };
  }

  private async requireLead(companyId: string, id: string) {
    const lead = await this.prisma.lead.findFirst({ where: { id, companyId } });
    if (!lead) {
      throw new NotFoundException('Prospecto no encontrado.');
    }
    return lead;
  }
}
