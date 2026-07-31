import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { calculateQuote } from './quote-calculator';

interface PublicCodeRow {
  publicCode: string;
}

interface PublicQuoteVerificationRow {
  publicCode: string;
  number: string;
  status: string;
  issueDate: Date;
  validUntil: Date | null;
  subtotal: Prisma.Decimal;
  discount: Prisma.Decimal;
  tax: Prisma.Decimal;
  total: Prisma.Decimal;
  companyName: string;
  customerName: string;
}

@Injectable()
export class QuotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  findAll(companyId: string, status?: string) {
    return this.prisma.quote.findMany({
      where: { companyId, ...(status ? { status } : {}) },
      include: {
        customer: { select: { id: true, name: true } },
        opportunity: { select: { id: true, name: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(companyId: string, id: string) {
    const quote = await this.prisma.quote.findFirst({
      where: { id, companyId },
      include: { customer: true, opportunity: true, items: true },
    });
    if (!quote) throw new NotFoundException('Cotización no encontrada.');

    const [verification] = await this.prisma.$queryRaw<PublicCodeRow[]>(
      Prisma.sql`SELECT [publicCode] FROM [Quote] WHERE [id] = ${id}`,
    );

    return { ...quote, publicCode: verification?.publicCode };
  }

  async findPublicVerification(publicCode: string) {
    const [quote] = await this.prisma.$queryRaw<PublicQuoteVerificationRow[]>(
      Prisma.sql`
        SELECT
          q.[publicCode], q.[number], q.[status], q.[issueDate], q.[validUntil],
          q.[subtotal], q.[discount], q.[tax], q.[total],
          c.[name] AS [companyName], customer.[name] AS [customerName]
        FROM [Quote] q
        INNER JOIN [Company] c ON c.[id] = q.[companyId]
        INNER JOIN [Customer] customer ON customer.[id] = q.[customerId]
        WHERE q.[publicCode] = ${publicCode}
      `,
    );

    if (!quote) {
      throw new NotFoundException('No existe una cotización asociada a este código.');
    }

    const expiredByDate =
      quote.validUntil !== null && quote.validUntil.getTime() < Date.now();
    const effectiveStatus =
      expiredByDate && !['ACCEPTED', 'REJECTED'].includes(quote.status)
        ? 'EXPIRED'
        : quote.status;

    return {
      valid: !['REJECTED'].includes(effectiveStatus),
      publicCode: quote.publicCode,
      number: quote.number,
      status: effectiveStatus,
      issueDate: quote.issueDate,
      validUntil: quote.validUntil,
      subtotal: quote.subtotal,
      discount: quote.discount,
      tax: quote.tax,
      total: quote.total,
      company: { name: quote.companyName },
      customer: { name: quote.customerName },
    };
  }

  async create(companyId: string, userId: string, dto: CreateQuoteDto) {
    await this.validateReferences(companyId, dto.customerId, dto.opportunityId);
    const totals = calculateQuote(dto.items, dto.discount);
    const count = await this.prisma.quote.count({ where: { companyId } });
    const number = `COT-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    const quote = await this.prisma.quote.create({
      data: {
        companyId,
        customerId: dto.customerId,
        opportunityId: dto.opportunityId,
        number,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
        notes: dto.notes,
        subtotal: totals.subtotal,
        discount: totals.discount,
        tax: totals.tax,
        total: totals.total,
        items: {
          create: dto.items.map((item, index) => ({
            ...item,
            taxRate: item.taxRate ?? 18,
            lineTotal: totals.lines[index].lineTotal,
          })),
        },
      },
      include: { customer: true, items: true },
    });
    await this.audit.record({
      companyId,
      userId,
      action: 'CREATE',
      entity: 'Quote',
      entityId: quote.id,
      newValues: dto,
    });
    return this.findOne(companyId, quote.id);
  }

  async updateStatus(
    companyId: string,
    userId: string,
    id: string,
    status: string,
  ) {
    const existing = await this.findOne(companyId, id);
    const quote = await this.prisma.quote.update({
      where: { id },
      data: { status },
      include: { customer: true, items: true },
    });
    await this.audit.record({
      companyId,
      userId,
      action: 'STATUS_CHANGE',
      entity: 'Quote',
      entityId: id,
      oldValues: { status: existing.status },
      newValues: { status },
    });
    return quote;
  }

  async remove(companyId: string, userId: string, id: string) {
    const existing = await this.findOne(companyId, id);
    await this.prisma.$transaction([
      this.prisma.quoteItem.deleteMany({ where: { quoteId: id } }),
      this.prisma.quote.delete({ where: { id } }),
    ]);
    await this.audit.record({
      companyId,
      userId,
      action: 'DELETE',
      entity: 'Quote',
      entityId: id,
      oldValues: existing,
    });
    return { deleted: true };
  }

  private async validateReferences(
    companyId: string,
    customerId: string,
    opportunityId?: string,
  ) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, companyId },
    });
    const opportunity = opportunityId
      ? await this.prisma.opportunity.findFirst({
          where: { id: opportunityId, companyId },
        })
      : true;
    if (!customer || !opportunity) {
      throw new NotFoundException('Cliente u oportunidad no válidos.');
    }
  }
}
