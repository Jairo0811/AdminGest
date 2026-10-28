import {
  hasReachedLimit,
  isSubscriptionUsable,
  remainingCapacity,
} from './subscription-limits';

describe('subscription limits', () => {
  it('detecta cuando un recurso alcanza su límite', () => {
    expect(hasReachedLimit(3, 2)).toBe(false);
    expect(hasReachedLimit(3, 3)).toBe(true);
    expect(hasReachedLimit(3, 4)).toBe(true);
  });

  it('calcula capacidad restante sin valores negativos', () => {
    expect(remainingCapacity(10, 4)).toBe(6);
    expect(remainingCapacity(10, 15)).toBe(0);
  });

  it('solo considera utilizables suscripciones activas o trials vigentes', () => {
    const now = new Date('2026-10-27T12:00:00.000Z');

    expect(isSubscriptionUsable('ACTIVE', null, now)).toBe(true);
    expect(
      isSubscriptionUsable('TRIAL', new Date('2026-10-28T12:00:00.000Z'), now),
    ).toBe(true);
    expect(
      isSubscriptionUsable('TRIAL', new Date('2026-10-26T12:00:00.000Z'), now),
    ).toBe(false);
    expect(isSubscriptionUsable('CANCELED', null, now)).toBe(false);
  });
});
