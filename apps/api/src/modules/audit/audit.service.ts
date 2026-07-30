import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

export interface AuditEntry {
  companyId: string;
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  oldValues?: unknown;
  newValues?: unknown;
  ipAddress?: string;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  log(entry: AuditEntry) {
    return this.prisma.auditLog.create({
      data: {
        companyId: entry.companyId,
        userId: entry.userId,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId,
        oldValues: this.serialize(entry.oldValues),
        newValues: this.serialize(entry.newValues),
        ipAddress: entry.ipAddress,
      },
    });
  }

  findRecent(companyId: string) {
    return this.prisma.auditLog.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });
  }

  private serialize(value: unknown): string | undefined {
    return value === undefined ? undefined : JSON.stringify(value);
  }
}
