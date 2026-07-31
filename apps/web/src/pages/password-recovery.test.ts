import { describe, expect, it } from 'vitest';

function isStrongPassword(password: string) {
  return password.length >= 10 && /[a-z]/.test(password) && /[A-Z]/.test(password) && /[0-9]/.test(password);
}

describe('password recovery validation', () => {
  it('acepta una contraseña que cumple la política', () => {
    expect(isStrongPassword('AdminGest2026')).toBe(true);
  });

  it('rechaza contraseñas débiles', () => {
    expect(isStrongPassword('corta')).toBe(false);
    expect(isStrongPassword('sinmayuscula2026')).toBe(false);
    expect(isStrongPassword('SinNumerosAdmin')).toBe(false);
  });
});
