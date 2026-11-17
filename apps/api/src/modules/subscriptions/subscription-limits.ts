export type LimitedResource = 'users' | 'customers' | 'projects';

export const LIMITED_RESOURCES: readonly LimitedResource[] = ['users', 'customers', 'projects'];

export function hasReachedLimit(limit: number, used: number): boolean {
  return used >= limit;
}

export function remainingCapacity(limit: number, used: number): number {
  return Math.max(limit - used, 0);
}

/**
 * A subscription is usable when it is ACTIVE within its contracted period (an open
 * period has no end date) or when it is a TRIAL that has not expired. SUSPENDED,
 * CANCELED or any unknown status is never usable.
 */
export function isSubscriptionUsable(
  status: string,
  trialEndsAt: Date | null,
  now = new Date(),
  currentPeriodEnd: Date | null = null,
): boolean {
  if (status === 'ACTIVE') {
    return !currentPeriodEnd || currentPeriodEnd.getTime() > now.getTime();
  }
  if (status !== 'TRIAL' || !trialEndsAt) return false;
  return trialEndsAt.getTime() > now.getTime();
}
