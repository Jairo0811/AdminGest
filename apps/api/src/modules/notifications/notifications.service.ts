import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

export const EVENT_TYPES = [
  'ACTIVITY_ASSIGNED', 'PROJECT_ASSIGNED', 'ACTIVITY_DUE', 'QUOTE_EXPIRING',
] as const;
export type BusinessEvent = (typeof EVENT_TYPES)[number];

interface EmitInput {
  companyId: string;
  userId: string;
  eventType: BusinessEvent;
  title: string;
  message: string;
  path: string;
  dedupeKey: string;
}

@Injectable()
export class NotificationsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationsService.name);
  private timer?: ReturnType<typeof setInterval>;
  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    // The persistent unique key makes this safe even if several API replicas run.
    this.timer = setInterval(() => void this.scanReminders().catch(
      (error: unknown) => this.logger.error('No fue posible generar recordatorios.', error),
    ), 15 * 60_000);
    this.timer.unref();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  list(companyId: string, userId: string) {
    return this.prisma.notification.findMany({
      where: { companyId, userId },
      select: { id: true, title: true, message: true, path: true, eventType: true, readAt: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async markRead(companyId: string, userId: string, id: string) {
    const result = await this.prisma.notification.updateMany({
      where: { id, companyId, userId },
      data: { readAt: new Date() },
    });
    return { updated: result.count === 1 };
  }

  async emit(input: EmitInput) {
    try {
      const [recipient, rule] = await Promise.all([
        this.prisma.user.findFirst({
          where: { id: input.userId, companyId: input.companyId, status: 'ACTIVE' },
          select: { id: true },
        }),
        this.prisma.workflowRule.findUnique({
          where: { companyId_eventType: { companyId: input.companyId, eventType: input.eventType } },
        }),
      ]);
      if (!recipient || rule?.enabled === false) return;
      await this.prisma.notification.create({ data: input });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return;
      this.logger.error('No fue posible registrar notificación.', error);
    }
  }

  async scanReminders(now = new Date()) {
    const soon = new Date(now.getTime() + 24 * 3600_000);
    const [activities, quotes] = await Promise.all([
      this.prisma.activity.findMany({
        where: { status: 'PENDING', ownerId: { not: null }, scheduledAt: { gte: now, lte: soon } },
        select: { id: true, companyId: true, ownerId: true, subject: true, scheduledAt: true },
        take: 100,
      }),
      this.prisma.quote.findMany({
        where: { status: { in: ['DRAFT', 'SENT'] }, validUntil: { gte: now, lte: soon } },
        select: { id: true, companyId: true, number: true, validUntil: true },
        take: 50,
      }),
    ]);
    for (const activity of activities) {
      if (!activity.ownerId) continue;
      await this.emit({
        companyId: activity.companyId, userId: activity.ownerId,
        eventType: 'ACTIVITY_DUE', title: 'Actividad próxima',
        message: activity.subject, path: '/activities',
        dedupeKey: 'activity-due:' + activity.id + ':' + activity.scheduledAt.toISOString(),
      });
    }
    for (const quote of quotes) {
      const admins = await this.prisma.user.findMany({
        where: { companyId: quote.companyId, role: 'ADMIN', status: 'ACTIVE' },
        select: { id: true }, take: 5,
      });
      for (const admin of admins) {
        await this.emit({
          companyId: quote.companyId, userId: admin.id,
          eventType: 'QUOTE_EXPIRING', title: 'Cotización próxima a vencer',
          message: quote.number, path: '/quotes',
          dedupeKey: 'quote-expiring:' + quote.id + ':' + quote.validUntil?.toISOString(),
        });
      }
    }
    return { activities: activities.length, quotes: quotes.length };
  }
}
