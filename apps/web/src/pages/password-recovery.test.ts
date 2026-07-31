import { describe, expect, it } from 'vitest';
import { isStrongPassword } from '../utils/password-policy';

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
