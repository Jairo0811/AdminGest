import { Prisma } from '@prisma/client';
import { acquireTransactionLock } from './app-lock';

/**
 * Returns the next value of a per-company counter. Must run inside an interactive
 * transaction: the application lock serialises concurrent callers (also across API
 * replicas) and the increment is committed or rolled back together with the record
 * that consumes it, so numbers are never reused after deletions or retries.
 *
 * `initialValue` is only evaluated the first time a scope is used, to continue an
 * existing numbering (for example quotes created before sequences existed).
 */
export async function nextCompanySequence(
  tx: Prisma.TransactionClient,
  companyId: string,
  scope: string,
  initialValue: () => Promise<number>,
): Promise<number> {
  await acquireTransactionLock(tx, `sequence:${scope}:${companyId}`);
  const current = await tx.companySequence.findUnique({
    where: { companyId_scope: { companyId, scope } },
  });

  if (!current) {
    const start = Math.max(0, Math.trunc(await initialValue()));
    const created = await tx.companySequence.create({
      data: { companyId, scope, value: start + 1 },
    });
    return created.value;
  }

  const updated = await tx.companySequence.update({
    where: { companyId_scope: { companyId, scope } },
    data: { value: { increment: 1 } },
  });
  return updated.value;
}

/** Calendar year of `date` in the company time zone (falls back to UTC). */
export function yearInTimeZone(date: Date, timeZone?: string | null): number {
  try {
    return Number(
      new Intl.DateTimeFormat('en-US', { timeZone: timeZone || 'UTC', year: 'numeric' }).format(
        date,
      ),
    );
  } catch {
    return date.getUTCFullYear();
  }
}
