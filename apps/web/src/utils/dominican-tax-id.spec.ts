import { describe, expect, it } from 'vitest';
import {
  formatDominicanTaxId,
  isValidDominicanTaxId,
  normalizeDominicanTaxId,
  validateDominicanTaxId,
} from './dominican-tax-id';

describe('dominican-tax-id', () => {
  it('normalizes and formats cedulas and RNCs', () => {
    expect(normalizeDominicanTaxId('001-1391820-5')).toBe('00113918205');
    expect(formatDominicanTaxId('00113918205')).toBe('001-1391820-5');
    expect(formatDominicanTaxId('130546772')).toBe('130-54677-2');
  });

  it('validates known checksums', () => {
    expect(isValidDominicanTaxId('001-1391820-5')).toBe(true);
    expect(isValidDominicanTaxId('130-54677-2')).toBe(true);
    expect(isValidDominicanTaxId('130-54677-3')).toBe(false);
  });

  it('keeps the field optional but reports invalid values', () => {
    expect(validateDominicanTaxId('')).toBeUndefined();
    expect(validateDominicanTaxId('123')).toContain('cédula');
  });
});
