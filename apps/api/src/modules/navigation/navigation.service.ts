import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Injectable()
export class NavigationService {
  constructor(private readonly prisma: PrismaService) {}

  async search(companyId: string, query: string) {
    const term = query.trim();
    if (term.length < 2) return [];

    const [leads, customers, opportunities, projects, quotes] =
      await Promise.all([
        this.prisma.lead.findMany({
          where: {
            companyId,
            OR: [
              { firstName: { contains: term } },
              { lastName: { contains: term } },
              { companyName: { contains: term } },
              { email: { contains: term } },
            ],
          },
          select: { id: true, firstName: true, lastName: true, companyName: true },
          take: 5,
        }),
        this.prisma.customer.findMany({
          where: {
            companyId,
            OR: [
              { name: { contains: term } },
              { email: { contains: term } },
              { taxId: { contains: term } },
            ],
          },
          select: { id: true, name: true, email: true },
          take: 5,
        }),
        this.prisma.opportunity.findMany({
          where: {
            companyId,
            OR: [
              { name: { contains: term } },
              { customer: { name: { contains: term } } },
            ],
          },
          select: {
            id: true,
            name: true,
            customer: { select: { name: true } },
          },
          take: 5,
        }),
        this.prisma.project.findMany({
          where: {
            companyId,
            OR: [
              { name: { contains: term } },
              { customer: { name: { contains: term } } },
            ],
          },
          select: {
            id: true,
            name: true,
            customer: { select: { name: true } },
          },
          take: 5,
        }),
        this.prisma.quote.findMany({
          where: {
            companyId,
            OR: [
              { number: { contains: term } },
              { customer: { name: { contains: term } } },
            ],
          },
          select: {
            id: true,
            number: true,
            customer: { select: { name: true } },
          },
          take: 5,
        }),
      ]);

    return [
      ...leads.map((item) => ({
        id: item.id,
        type: 'lead',
        title: [item.firstName, item.lastName].filter(Boolean).join(' '),
        subtitle: item.companyName ?? 'Prospecto',
        path: '/leads',
      })),
      ...customers.map((item) => ({
        id: item.id,
        type: 'customer',
        title: item.name,
        subtitle: item.email ?? 'Cliente',
        path: '/customers',
      })),
      ...opportunities.map((item) => ({
        id: item.id,
        type: 'opportunity',
        title: item.name,
        subtitle: item.customer.name,
        path: '/opportunities',
      })),
      ...projects.map((item) => ({
        id: item.id,
        type: 'project',
        title: item.name,
        subtitle: item.customer.name,
        path: '/projects',
      })),
      ...quotes.map((item) => ({
        id: item.id,
        type: 'quote',
        title: item.number,
        subtitle: item.customer.name,
        path: '/quotes',
      })),
    ].slice(0, 15);
  }

  async notifications(companyId: string) {
    const now = new Date();
    const inSevenDays = new Date(now);
    inSevenDays.setDate(now.getDate() + 7);

    const [activities, quotes, projects] = await Promise.all([
      this.prisma.activity.findMany({
        where: {
          companyId,
          status: 'PENDING',
          scheduledAt: { gte: now, lte: inSevenDays },
        },
        select: { id: true, subject: true, scheduledAt: true, type: true },
        orderBy: { scheduledAt: 'asc' },
        take: 5,
      }),
      this.prisma.quote.findMany({
        where: {
          companyId,
          status: { in: ['DRAFT', 'SENT'] },
          validUntil: { gte: now, lte: inSevenDays },
        },
        select: { id: true, number: true, validUntil: true },
        orderBy: { validUntil: 'asc' },
        take: 5,
      }),
      this.prisma.project.findMany({
        where: {
          companyId,
          status: 'ACTIVE',
          endDate: { gte: now, lte: inSevenDays },
        },
        select: { id: true, name: true, endDate: true },
        orderBy: { endDate: 'asc' },
        take: 5,
      }),
    ]);

    return [
      ...activities.map((item) => ({
        id: `activity-${item.id}`,
        type: 'activity',
        title: item.subject,
        description: `${item.type.replaceAll('_', ' ')} programada`,
        occurredAt: item.scheduledAt,
        path: '/activities',
      })),
      ...quotes.map((item) => ({
        id: `quote-${item.id}`,
        type: 'quote',
        title: `Cotización ${item.number}`,
        description: 'Su vigencia termina pronto',
        occurredAt: item.validUntil,
        path: '/quotes',
      })),
      ...projects.map((item) => ({
        id: `project-${item.id}`,
        type: 'project',
        title: item.name,
        description: 'Fecha de cierre próxima',
        occurredAt: item.endDate,
        path: '/projects',
      })),
    ]
      .sort(
        (left, right) =>
          new Date(left.occurredAt ?? 0).getTime() -
          new Date(right.occurredAt ?? 0).getTime(),
      )
      .slice(0, 10);
  }
}
