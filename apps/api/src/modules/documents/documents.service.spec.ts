import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { DocumentsService } from './documents.service';

describe('Document tenant and host boundaries', () => {
  const config = {
    get: (name: string, fallback?: string) => ({
      NODE_ENV: 'production',
      DOCUMENT_ALLOWED_HOSTS: 'files.example.com',
    })[name] ?? fallback,
  } as unknown as ConfigService;

  it('rejects untrusted domains and insecure URLs', async () => {
    const prisma = {
      project: { findFirst: jest.fn() },
      customer: { findFirst: jest.fn() },
      documentRecord: { create: jest.fn() },
    } as unknown as PrismaService;
    const service = new DocumentsService(prisma, config);
    await expect(service.create('a', 'u', {
      title: 'Contrato', category: 'CONTRACT', url: 'http://files.example.com/a',
    })).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.create('a', 'u', {
      title: 'Contrato', category: 'CONTRACT', url: 'https://attacker.example.org/a',
    })).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.documentRecord.create).not.toHaveBeenCalled();
  });

  it('does not register documents against another tenant project', async () => {
    const prisma = {
      project: { findFirst: jest.fn().mockResolvedValue(null) },
      customer: { findFirst: jest.fn() },
      documentRecord: { create: jest.fn() },
    } as unknown as PrismaService;
    const service = new DocumentsService(prisma, config);
    await expect(service.create('company-a', 'user-a', {
      title: 'Contrato', category: 'CONTRACT', url: 'https://files.example.com/a', projectId: 'project-b',
    })).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.project.findFirst).toHaveBeenCalledWith({
      where: { companyId: 'company-a', id: 'project-b' },
    });
    expect(prisma.documentRecord.create).not.toHaveBeenCalled();
  });
});
