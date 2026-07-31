import {
  getDominicanTaxIdType,
  isValidDominicanCedula,
  isValidDominicanRnc,
  isValidDominicanTaxId,
  normalizeDominicanTaxId,
} from './dominican-tax-id';

describe('DominicanTaxId', () => {
  it('normalizes formatted values', () => {
    expect(normalizeDominicanTaxId('001-1391820-5')).toBe('00113918205');
    expect(normalizeDominicanTaxId('130-54677-2')).toBe('130546772');
  });

  it('validates Dominican cedulas with Luhn', () => {
    expect(isValidDominicanCedula('001-1391820-5')).toBe(true);
    expect(isValidDominicanCedula('001-1391820-6')).toBe(false);
  });

  it('validates Dominican RNC check digits', () => {
    expect(isValidDominicanRnc('130-54677-2')).toBe(true);
    expect(isValidDominicanRnc('130-54677-3')).toBe(false);
  });

  it('rejects unsupported lengths and repeated digits', () => {
    expect(isValidDominicanTaxId('12345678')).toBe(false);
    expect(isValidDominicanTaxId('11111111111')).toBe(false);
    expect(getDominicanTaxIdType('123')).toBe('UNKNOWN');
  });
});
