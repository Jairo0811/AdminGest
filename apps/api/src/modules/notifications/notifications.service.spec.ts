import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { NotificationsService } from './notifications.service';

describe('Notification privacy and idempotency', () => {
  it('scopes marking a notification as read to tenant and user', async () => {
    const prisma = {
      notification: {
        findFirst: jest.fn().mockResolvedValue(null),
        updateMany: jest.fn(),
      },
    } as unknown as PrismaService;
    const service = new NotificationsService(prisma);
    await expect(service.markRead('company-a', 'user-a', 'foreign-id')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.notification.findFirst).toHaveBeenCalledWith({
      where: { id: 'foreign-id', companyId: 'company-a', userId: 'user-a' },
      select: { id: true, readAt: true },
    });
    expect(prisma.notification.updateMany).not.toHaveBeenCalled();
  });

  it('keeps the original read time when marked twice', async () => {
    const prisma = {
      notification: {
        findFirst: jest.fn().mockResolvedValue({ id: 'n1', readAt: new Date('2026-01-01') }),
        updateMany: jest.fn(),
      },
    } as unknown as PrismaService;
    const service = new NotificationsService(prisma);
    await expect(service.markRead('company-a', 'user-a', 'n1')).resolves.toEqual({ updated: false });
    expect(prisma.notification.updateMany).not.toHaveBeenCalled();
  });

  it('marks all unread notifications of the current user only', async () => {
    const prisma = {
      notification: { updateMany: jest.fn().mockResolvedValue({ count: 3 }) },
    } as unknown as PrismaService;
    const service = new NotificationsService(prisma);
    await expect(service.markAllRead('company-a', 'user-a')).resolves.toEqual({ updated: 3 });
    expect(prisma.notification.updateMany).toHaveBeenCalledWith({
      where: { companyId: 'company-a', userId: 'user-a', readAt: null },
      data: { readAt: expect.any(Date) },
    });
  });

  it('does not emit notifications to users outside the company', async () => {
    const prisma = {
      user: { findFirst: jest.fn().mockResolvedValue(null) },
      workflowRule: { findUnique: jest.fn().mockResolvedValue(null) },
      notification: { create: jest.fn() },
    } as unknown as PrismaService;
    const service = new NotificationsService(prisma);
    await service.emit({
      companyId: 'company-a', userId: 'user-b',
      eventType: 'PROJECT_ASSIGNED', title: 'Proyecto', message: 'Asignado',
      path: '/projects', dedupeKey: 'assigned-1',
    });
    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: { id: 'user-b', companyId: 'company-a', status: 'ACTIVE' },
      select: { id: true },
    });
    expect(prisma.notification.create).not.toHaveBeenCalled();
  });

  it('respects disabled workflow rules', async () => {
    const prisma = {
      user: { findFirst: jest.fn().mockResolvedValue({ id: 'user-a' }) },
      workflowRule: { findUnique: jest.fn().mockResolvedValue({ enabled: false }) },
      notification: { create: jest.fn() },
    } as unknown as PrismaService;
    await new NotificationsService(prisma).emit({
      companyId: 'company-a', userId: 'user-a',
      eventType: 'ACTIVITY_ASSIGNED', title: 'A', message: 'B', path: '/activities', dedupeKey: 'k',
    });
    expect(prisma.notification.create).not.toHaveBeenCalled();
  });

  it('pages through every due reminder instead of stopping at a fixed limit', async () => {
    const due = Array.from({ length: 250 }, (_, index) => ({
      id: `a${index}`, companyId: 'company-a', ownerId: 'user-a',
      subject: 'Llamada', scheduledAt: new Date('2026-11-04T10:00:00Z'),
    }));
    const activityFindMany = jest.fn(({ skip, take }: { skip: number; take: number }) =>
      Promise.resolve(due.slice(skip, skip + take)));
    const prisma = {
      activity: { findMany: activityFindMany },
      quote: { findMany: jest.fn().mockResolvedValue([]) },
      user: { findFirst: jest.fn().mockResolvedValue(null), findMany: jest.fn() },
      workflowRule: { findUnique: jest.fn().mockResolvedValue(null) },
      notification: { create: jest.fn() },
    } as unknown as PrismaService;
    const result = await new NotificationsService(prisma).scanReminders(new Date('2026-11-04T00:00:00Z'));
    expect(result.activities).toBe(250);
    expect(activityFindMany).toHaveBeenCalledTimes(2);
  });
});
