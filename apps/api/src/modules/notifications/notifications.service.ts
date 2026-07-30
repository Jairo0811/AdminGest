import { Injectable, NotFoundException } from '@nestjs/common';
import { AuthUser } from '../../common/types/auth-user';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(user: AuthUser) {
    return this.prisma.notification.findMany({
      where: {
        companyId: user.companyId,
        OR: [{ userId: user.id }, { userId: null }],
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markRead(user: AuthUser, id: string) {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id,
        companyId: user.companyId,
        OR: [{ userId: user.id }, { userId: null }],
      },
    });
    if (!notification) throw new NotFoundException('Notificación no encontrada.');
    return this.prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
  }
}
