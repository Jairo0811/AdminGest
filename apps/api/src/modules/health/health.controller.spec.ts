import { HealthController } from './health.controller';
import { describe, expect, it } from 'vitest';

describe('HealthController', () => {
  it('reports the service as healthy', () => {
    const result = new HealthController().getHealth();

    expect(result.status).toBe('ok');
    expect(result.service).toBe('AdminGest API');
    expect(result.version).toBe('1.0.0');
    expect(new Date(result.timestamp).toString()).not.toBe('Invalid Date');
  });
});
