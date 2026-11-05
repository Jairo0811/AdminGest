import { HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { mapPrismaError } from './global-exception.filter';

const prismaError = (code: string, message = 'db error') =>
  new Prisma.PrismaClientKnownRequestError(message, { code, clientVersion: 'test' });

describe('mapPrismaError', () => {
  it('convierte violaciones de unicidad en 409 sin exponer nombres internos', () => {
    const mapped = mapPrismaError(prismaError('P2002', 'Unique constraint Customer_companyId_taxId_key'));
    expect(mapped?.statusCode).toBe(HttpStatus.CONFLICT);
    expect(String(mapped?.message)).not.toContain('Customer_');
  });

  it('convierte violaciones de clave foránea en 409 y registros inexistentes en 404', () => {
    expect(mapPrismaError(prismaError('P2003'))?.statusCode).toBe(HttpStatus.CONFLICT);
    expect(mapPrismaError(prismaError('P2025'))?.statusCode).toBe(HttpStatus.NOT_FOUND);
  });

  it('informa un bloqueo de aplicación no obtenido como 503', () => {
    expect(mapPrismaError(prismaError('P2010', 'Error 51001: lock'))?.statusCode).toBe(
      HttpStatus.SERVICE_UNAVAILABLE,
    );
    expect(mapPrismaError(prismaError('P2010', 'syntax'))).toBeNull();
  });

  it('ignora errores que no provienen de Prisma', () => {
    expect(mapPrismaError(new Error('x'))).toBeNull();
  });
});
