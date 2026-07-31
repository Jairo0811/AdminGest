const CEDULA_LENGTH = 11;
const RNC_LENGTH = 9;
const RNC_WEIGHTS = [7, 9, 8, 6, 5, 4, 3, 2] as const;

export type DominicanTaxIdType = 'CEDULA' | 'RNC' | 'UNKNOWN';

export function normalizeDominicanTaxId(value: string): string {
  return value.replace(/\D/g, '');
}

export function getDominicanTaxIdType(value: string): DominicanTaxIdType {
  const normalized = normalizeDominicanTaxId(value);
  if (normalized.length === CEDULA_LENGTH) return 'CEDULA';
  if (normalized.length === RNC_LENGTH) return 'RNC';
  return 'UNKNOWN';
}

export function isValidDominicanCedula(value: string): boolean {
  const cedula = normalizeDominicanTaxId(value);
  if (!/^\d{11}$/.test(cedula) || /^(\d)\1+$/.test(cedula)) return false;

  const digits = [...cedula].map(Number);
  const checkDigit = digits.pop();
  if (checkDigit === undefined) return false;

  const sum = digits
    .reverse()
    .reduce((total, digit, index) => {
      if (index % 2 !== 0) return total + digit;
      const doubled = digit * 2;
      return total + (doubled > 9 ? doubled - 9 : doubled);
    }, checkDigit);

  return sum % 10 === 0;
}

export function isValidDominicanRnc(value: string): boolean {
  const rnc = normalizeDominicanTaxId(value);
  if (!/^\d{9}$/.test(rnc) || /^(\d)\1+$/.test(rnc)) return false;

  const sum = RNC_WEIGHTS.reduce(
    (total, weight, index) => total + Number(rnc[index]) * weight,
    0,
  );
  const remainder = sum % 11;
  let expectedDigit = 11 - remainder;

  if (expectedDigit === 10) expectedDigit = 1;
  if (expectedDigit === 11) expectedDigit = 2;

  return expectedDigit === Number(rnc[8]);
}

export function isValidDominicanTaxId(value: string): boolean {
  const type = getDominicanTaxIdType(value);
  if (type === 'CEDULA') return isValidDominicanCedula(value);
  if (type === 'RNC') return isValidDominicanRnc(value);
  return false;
}
