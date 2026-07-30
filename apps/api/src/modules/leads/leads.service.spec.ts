import { NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { AuthUser } from '../../common/types/auth-user';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { LeadsService } from './leads.service';

const user: AuthUser = {
  id: 'user-1',
  companyId: 'company-1',
  email: 'user@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'ADMIN',
};

describe('LeadsService', () => {
  it('always scopes status changes to the authenticated company', async () => {
    const findFirst = vi.fn().mockResolvedValue({ id: 'lead-1' });
    const update = vi.fn().mockResolvedValue({ id: 'lead-1', status: 'QUALIFIED' });
    const prisma = { lead: { findFirst, update } } as unknown as PrismaService;
    const audit = { log: vi.fn() } as unknown as AuditService;
    const service = new LeadsService(prisma, audit);

    await service.updateStatus(user, 'lead-1', 'QUALIFIED');

    expect(findFirst).toHaveBeenCalledWith({
      where: { id: 'lead-1', companyId: 'company-1' },
    });
    expect(update).toHaveBeenCalledWith({
      where: { id: 'lead-1' },
      data: { status: 'QUALIFIED' },
    });
  });

  it('rejects access to a lead outside the company', async () => {
    const prisma = {
      lead: { findFirst: vi.fn().mockResolvedValue(null) },
    } as unknown as PrismaService;
    const audit = { log: vi.fn() } as unknown as AuditService;
    const service = new LeadsService(prisma, audit);

    await expect(service.findOne(user, 'other-lead')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
