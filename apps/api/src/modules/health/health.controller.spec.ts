import { ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('reports a healthy API', () => {
    const prisma = { $queryRawUnsafe: jest.fn() } as unknown as PrismaService;
    const result = new HealthController(prisma).getHealth();
    expect(result.status).toBe('ok');
    expect(result.service).toBe('AdminGest API');
    expect(new Date(result.timestamp).toString()).not.toBe('Invalid Date');
  });

  it('returns ready when SQL is available', async () => {
    const prisma = { $queryRawUnsafe: jest.fn().mockResolvedValue([1]) } as unknown as PrismaService;
    await expect(new HealthController(prisma).readiness()).resolves.toEqual(
      expect.objectContaining({ status: 'ready' }),
    );
  });

  it('returns 503 when SQL is unavailable', async () => {
    const prisma = { $queryRawUnsafe: jest.fn().mockRejectedValue(new Error('connection down')) } as unknown as PrismaService;
    await expect(new HealthController(prisma).readiness()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
