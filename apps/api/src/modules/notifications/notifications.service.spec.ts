import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { NotificationsService } from './notifications.service';

describe('Notification privacy and idempotency', () => {
  it('scopes marking a notification as read to tenant and user', async () => {
    const prisma = {
      notification: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
    } as unknown as PrismaService;
    const service = new NotificationsService(prisma);
    await expect(service.markRead('company-a', 'user-a', 'foreign-id'))
      .resolves.toEqual({ updated: false });
    expect(prisma.notification.updateMany).toHaveBeenCalledWith({
      where: { id: 'foreign-id', companyId: 'company-a', userId: 'user-a' },
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
});
