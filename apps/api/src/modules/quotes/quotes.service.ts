import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AuthUser } from '../../common/types/auth-user';
import { ResourceQueryDto } from '../../common/types/resource-query.dto';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateQuoteDto } from './dto/create-quote.dto';

@Injectable()
export class QuotesService {
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
      this.prisma.quote.findMany({
        where,
        include: { customer: { select: { id: true, name: true } }, items: true },
        orderBy: { issueDate: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.quote.count({ where }),
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

  async create(user: AuthUser, dto: CreateQuoteDto) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: dto.customerId, companyId: user.companyId, isActive: true },
    });
    if (!customer) throw new BadRequestException('El cliente indicado no es válido.');

    if (dto.opportunityId) {
      const opportunity = await this.prisma.opportunity.findFirst({
        where: { id: dto.opportunityId, companyId: user.companyId },
      });
      if (!opportunity) throw new BadRequestException('La oportunidad indicada no es válida.');
    }

    const itemValues = dto.items.map((item) => {
      const subtotal = item.quantity * item.unitPrice;
      const taxRate = item.taxRate ?? 18;
      return { ...item, taxRate, lineTotal: subtotal + subtotal * (taxRate / 100) };
    });
    const subtotal = dto.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const tax = itemValues.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice * (item.taxRate / 100),
      0,
    );
    const discount = dto.discount ?? 0;
    const total = Math.max(0, subtotal + tax - discount);
    const number = `COT-${new Date().getFullYear()}-${Date.now().toString().slice(-8)}`;

    const quote = await this.prisma.quote.create({
      data: {
        companyId: user.companyId,
        customerId: dto.customerId,
        opportunityId: dto.opportunityId,
        number,
        validUntil: dto.validUntil,
        notes: dto.notes,
        subtotal,
        discount,
        tax,
        total,
        items: { create: itemValues },
      },
      include: { customer: true, items: true },
    });
    await this.audit.log({
      companyId: user.companyId,
      userId: user.id,
      action: 'CREATE',
      entity: 'Quote',
      entityId: quote.id,
      newValues: quote,
    });
    return quote;
  }

  async updateStatus(user: AuthUser, id: string, status: string) {
    const quote = await this.prisma.quote.findFirst({
      where: { id, companyId: user.companyId },
    });
    if (!quote) throw new NotFoundException('Cotización no encontrada.');
    return this.prisma.quote.update({ where: { id }, data: { status } });
  }
}
