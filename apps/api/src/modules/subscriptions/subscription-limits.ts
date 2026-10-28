export type LimitedResource = 'users' | 'customers' | 'projects';

export function hasReachedLimit(limit: number, used: number): boolean {
  return used >= limit;
}

export function remainingCapacity(limit: number, used: number): number {
  return Math.max(limit - used, 0);
}

export function isSubscriptionUsable(
  status: string,
  trialEndsAt: Date | null,
  now = new Date(),
): boolean {
  if (status === 'ACTIVE') return true;
  if (status !== 'TRIAL' || !trialEndsAt) return false;
  return trialEndsAt.getTime() > now.getTime();
}
