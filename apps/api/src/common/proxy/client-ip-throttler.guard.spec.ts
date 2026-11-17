import { ClientIpThrottlerGuard } from './client-ip-throttler.guard';

class Probe extends ClientIpThrottlerGuard {
  tracker(request: Record<string, unknown>) {
    return this.getTracker(request);
  }
}

describe('ClientIpThrottlerGuard', () => {
  const guard = Object.create(Probe.prototype) as Probe;

  it('limits per visitor address sent by the trusted proxy', async () => {
    await expect(guard.tracker({ ip: '104.16.0.1', clientIp: '203.0.113.9' })).resolves.toBe(
      '203.0.113.9',
    );
  });

  it('falls back to request.ip without the proxy', async () => {
    await expect(guard.tracker({ ip: '127.0.0.1' })).resolves.toBe('127.0.0.1');
  });
});
