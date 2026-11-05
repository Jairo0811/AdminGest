import {
  hasReachedLimit,
  isSubscriptionUsable,
  remainingCapacity,
} from './subscription-limits';

describe('subscription limits', () => {
  const now = new Date('2026-10-27T12:00:00.000Z');
  const tomorrow = new Date('2026-10-28T12:00:00.000Z');
  const yesterday = new Date('2026-10-26T12:00:00.000Z');

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
    expect(isSubscriptionUsable('ACTIVE', null, now)).toBe(true);
    expect(isSubscriptionUsable('TRIAL', tomorrow, now)).toBe(true);
    expect(isSubscriptionUsable('TRIAL', yesterday, now)).toBe(false);
    expect(isSubscriptionUsable('TRIAL', null, now)).toBe(false);
    expect(isSubscriptionUsable('CANCELED', null, now)).toBe(false);
    expect(isSubscriptionUsable('SUSPENDED', null, now)).toBe(false);
    expect(isSubscriptionUsable('UNKNOWN', tomorrow, now)).toBe(false);
  });

  it('respeta la vigencia del período contratado de una suscripción activa', () => {
    expect(isSubscriptionUsable('ACTIVE', null, now, tomorrow)).toBe(true);
    expect(isSubscriptionUsable('ACTIVE', null, now, yesterday)).toBe(false);
    expect(isSubscriptionUsable('ACTIVE', null, now, now)).toBe(false);
  });
});
