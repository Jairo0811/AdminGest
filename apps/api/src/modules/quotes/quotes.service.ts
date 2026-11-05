import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { TRANSACTION_OPTIONS } from '../../common/tenant/app-lock';
import {
  nextCompanySequence,
  yearInTimeZone,
} from '../../common/tenant/company-sequence';
import {
  assertTenantCatalogItems,
  assertTenantCustomer,
  assertTenantOpportunity,
} from '../../common/tenant/tenant-references';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { calculateQuote, DEFAULT_ITBIS_RATE } from './quote-calculator';

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

export const quoteNumberPrefix = (year: number) => `COT-${year}-`;
export const formatQuoteNumber = (year: number, sequence: number) =>
  `${quoteNumberPrefix(year)}${String(sequence).padStart(5, '0')}`;

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
    return quote;
  }

  async findPublicVerification(publicCode: string) {
    if (!/^[0-9a-fA-F-]{36}$/.test(publicCode)) {
      throw new NotFoundException('No existe una cotización asociada a este código.');
    }
    const [quote] = await this.prisma.$queryRaw<PublicQuoteVerificationRow[]>(
      Prisma.sql`
        SELECT
          q.[publicCode], q.[number], q.[status], q.[issueDate], q.[validUntil],
          q.[subtotal], q.[discount], q.[tax], q.[total],
          c.[name] AS [companyName], customer.[name] AS [customerName]
        FROM [Quote] q
        INNER JOIN [Company] c ON c.[id] = q.[companyId]
        INNER JOIN [Customer] customer ON customer.[id] = q.[customerId]
          AND customer.[companyId] = q.[companyId]
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
    await assertTenantCustomer(this.prisma, companyId, dto.customerId);
    await assertTenantOpportunity(this.prisma, companyId, dto.opportunityId, dto.customerId);
    await assertTenantCatalogItems(
      this.prisma,
      companyId,
      dto.items.map((item) => item.catalogItemId),
    );
    const totals = calculateQuote(dto.items, dto.discount);
    const company = await this.prisma.company.findUniqueOrThrow({
      where: { id: companyId },
      select: { timezone: true },
    });
    const year = yearInTimeZone(new Date(), company.timezone);

    const quote = await this.prisma.$transaction(async (tx) => {
      const sequence = await nextCompanySequence(tx, companyId, `QUOTE-${year}`, () =>
        this.highestExistingSequence(tx, companyId, year),
      );

      return tx.quote.create({
        data: {
          companyId,
          customerId: dto.customerId,
          opportunityId: dto.opportunityId,
          number: formatQuoteNumber(year, sequence),
          validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
          notes: dto.notes,
          subtotal: totals.subtotal,
          discount: totals.discount,
          tax: totals.tax,
          total: totals.total,
          items: {
            create: dto.items.map((item, index) => ({
              catalogItemId: item.catalogItemId,
              description: item.description.trim(),
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              taxRate: item.taxRate ?? DEFAULT_ITBIS_RATE,
              lineTotal: totals.lines[index].lineTotal,
              discountAmount: totals.lines[index].discount,
              taxAmount: totals.lines[index].tax,
            })),
          },
        },
        select: { id: true },
      });
    }, TRANSACTION_OPTIONS);

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

  /** Continues numbering created before v1.2.0 (count + 1 strategy). */
  private async highestExistingSequence(
    tx: Prisma.TransactionClient,
    companyId: string,
    year: number,
  ): Promise<number> {
    const prefix = quoteNumberPrefix(year);
    const [row] = await tx.$queryRaw<Array<{ maxValue: number | null }>>`
      SELECT MAX(TRY_CAST(SUBSTRING([number], ${prefix.length + 1}, 20) AS INT)) AS [maxValue]
      FROM [Quote]
      WHERE [companyId] = ${companyId} AND [number] LIKE ${prefix + '%'}
    `;
    return Number(row?.maxValue ?? 0);
  }
}
