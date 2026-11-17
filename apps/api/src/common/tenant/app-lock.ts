import { Prisma } from '@prisma/client';

/**
 * Serialises a critical section across every API replica using SQL Server
 * application locks (sp_getapplock). The lock is owned by the current transaction and
 * released automatically on COMMIT or ROLLBACK, so it cannot leak.
 *
 * Used for quota checks and per-company sequences, where "count then insert" would
 * otherwise allow two concurrent requests to pass the same check.
 */
export async function acquireTransactionLock(
  tx: Prisma.TransactionClient,
  resource: string,
  timeoutMs = 10_000,
): Promise<void> {
  if (resource.length > 255) throw new Error('El recurso de bloqueo es demasiado largo.');
  await tx.$executeRaw`
    DECLARE @lockResult INT;
    EXEC @lockResult = sp_getapplock
      @Resource = ${resource},
      @LockMode = 'Exclusive',
      @LockOwner = 'Transaction',
      @LockTimeout = ${timeoutMs};
    IF @lockResult < 0
    BEGIN
      THROW 51001, 'No fue posible reservar el recurso solicitado. Inténtalo nuevamente.', 1;
    END;
  `;
}

export const TRANSACTION_OPTIONS = {
  maxWait: 10_000,
  timeout: 20_000,
} as const;
