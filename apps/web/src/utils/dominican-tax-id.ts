const RNC_WEIGHTS = [7, 9, 8, 6, 5, 4, 3, 2] as const;

export function normalizeDominicanTaxId(value: string): string {
  return value.replace(/\D/g, '');
}

export function formatDominicanTaxId(value: string): string {
  const digits = normalizeDominicanTaxId(value).slice(0, 11);

  if (digits.length <= 9) {
    return digits
      .replace(/^(\d{3})(\d)/, '$1-$2')
      .replace(/^(\d{3})-(\d{5})(\d)/, '$1-$2-$3');
  }

  return digits
    .replace(/^(\d{3})(\d)/, '$1-$2')
    .replace(/^(\d{3})-(\d{7})(\d)/, '$1-$2-$3');
}

export function isValidDominicanCedula(value: string): boolean {
  const cedula = normalizeDominicanTaxId(value);
  if (!/^\d{11}$/.test(cedula) || /^(\d)\1+$/.test(cedula)) return false;

  const digits = [...cedula].map(Number);
  const checkDigit = digits.pop();
  if (checkDigit === undefined) return false;

  const sum = digits.reverse().reduce((total, digit, index) => {
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
  let expectedDigit = 11 - (sum % 11);
  if (expectedDigit === 10) expectedDigit = 1;
  if (expectedDigit === 11) expectedDigit = 2;

  return expectedDigit === Number(rnc[8]);
}

export function isValidDominicanTaxId(value: string): boolean {
  const digits = normalizeDominicanTaxId(value);
  if (digits.length === 11) return isValidDominicanCedula(digits);
  if (digits.length === 9) return isValidDominicanRnc(digits);
  return false;
}

export function validateDominicanTaxId(value: string): string | undefined {
  if (!value.trim()) return undefined;
  return isValidDominicanTaxId(value)
    ? undefined
    : 'Introduce una cédula de 11 dígitos o un RNC de 9 dígitos válido.';
}
