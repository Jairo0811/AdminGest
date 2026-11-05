import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

export const EVENT_TYPES = [
  'ACTIVITY_ASSIGNED', 'PROJECT_ASSIGNED', 'ACTIVITY_DUE', 'QUOTE_EXPIRING',
] as const;
export type BusinessEvent = (typeof EVENT_TYPES)[number];

const REMINDER_INTERVAL_MS = 15 * 60_000;
const SCAN_PAGE_SIZE = 200;
const SCAN_MAX_ROWS = 10_000;

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
  private startup?: ReturnType<typeof setTimeout>;
  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    if (process.env.NODE_ENV === 'test' || process.env.REMINDERS_DISABLED === 'true') return;
    // The persistent unique key makes this safe even if several API replicas run.
    // This in-process timer is best effort: reminders are not generated while the API
    // is down (see docs/BUSINESS-AUTOMATION.md).
    const run = () => void this.scanReminders().catch(
      (error: unknown) => this.logger.error('No fue posible generar recordatorios.', error),
    );
    this.startup = setTimeout(run, 30_000);
    this.startup.unref();
    this.timer = setInterval(run, REMINDER_INTERVAL_MS);
    this.timer.unref();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
    if (this.startup) clearTimeout(this.startup);
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
    const notification = await this.prisma.notification.findFirst({
      where: { id, companyId, userId },
      select: { id: true, readAt: true },
    });
    if (!notification) throw new NotFoundException('Notificación no encontrada.');
    if (notification.readAt) return { updated: false };
    // Keeps the first read time when the request is repeated.
    const result = await this.prisma.notification.updateMany({
      where: { id, companyId, userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { updated: result.count === 1 };
  }

  async markAllRead(companyId: string, userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { companyId, userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { updated: result.count };
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
    const activities = await this.collect((skip) =>
      this.prisma.activity.findMany({
        where: { status: 'PENDING', ownerId: { not: null }, scheduledAt: { gte: now, lte: soon } },
        select: { id: true, companyId: true, ownerId: true, subject: true, scheduledAt: true },
        orderBy: { id: 'asc' },
        skip,
        take: SCAN_PAGE_SIZE,
      }),
    );
    const quotes = await this.collect((skip) =>
      this.prisma.quote.findMany({
        where: { status: { in: ['DRAFT', 'SENT'] }, validUntil: { gte: now, lte: soon } },
        select: { id: true, companyId: true, number: true, validUntil: true },
        orderBy: { id: 'asc' },
        skip,
        take: SCAN_PAGE_SIZE,
      }),
    );
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
        where: { companyId: quote.companyId, role: { in: ['ADMIN', 'SUPER_ADMIN'] }, status: 'ACTIVE' },
        select: { id: true }, orderBy: { createdAt: 'asc' }, take: 5,
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

  /** Reads every page (bounded) so large tenants do not lose reminders. */
  private async collect<T>(page: (skip: number) => Promise<T[]>): Promise<T[]> {
    const rows: T[] = [];
    for (let skip = 0; skip < SCAN_MAX_ROWS; skip += SCAN_PAGE_SIZE) {
      const batch = await page(skip);
      rows.push(...batch);
      if (batch.length < SCAN_PAGE_SIZE) break;
    }
    return rows;
  }
}
