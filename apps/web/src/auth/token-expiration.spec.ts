import { describe, expect, it } from 'vitest';
import { getTokenExpiration, isTokenExpired } from './token-expiration';

function createToken(payload: object): string {
  const encoded = btoa(JSON.stringify(payload))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
  return `header.${encoded}.signature`;
}

describe('token expiration', () => {
  it('obtiene la expiración en milisegundos', () => {
    const token = createToken({ exp: 2_000_000_000 });
    expect(getTokenExpiration(token)).toBe(2_000_000_000_000);
  });

  it('detecta tokens vencidos y vigentes', () => {
    const expired = createToken({ exp: 100 });
    const active = createToken({ exp: 2_000_000_000 });

    expect(isTokenExpired(expired, 101_000)).toBe(true);
    expect(isTokenExpired(active, 1_900_000_000_000)).toBe(false);
  });

  it('considera inválido un token sin exp', () => {
    expect(isTokenExpired(createToken({ sub: 'user' }))).toBe(true);
  });
});
