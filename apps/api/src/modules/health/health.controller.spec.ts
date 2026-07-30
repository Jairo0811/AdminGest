import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('reports a healthy API', () => {
    const result = new HealthController().getHealth();

    expect(result.status).toBe('ok');
    expect(result.service).toBe('AdminGest API');
    expect(new Date(result.timestamp).toString()).not.toBe('Invalid Date');
  });
});

