import { describe, expect, it } from 'vitest';
import { formatCurrency } from './api';

describe('formatCurrency', () => {
  it('formats Dominican pesos consistently', () => {
    expect(formatCurrency(1250, 'DOP')).toContain('1,250');
  });
});
