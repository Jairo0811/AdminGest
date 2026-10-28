import {
  generateRefreshToken,
  hashesMatch,
  parseRefreshToken,
  refreshCookieValue,
} from './session-tokens';

describe('refresh token handling', () => {
  it('genera un token opaco no reutilizable como JWT', () => {
    const issued = generateRefreshToken();
    expect(parseRefreshToken(issued.token)).toEqual({ id: issued.id, hash: issued.hash });
    expect(hashesMatch(issued.hash, issued.hash)).toBe(true);
    expect(hashesMatch(issued.hash, '0'.repeat(64))).toBe(false);
  });

  it('rechaza tokens malformados y cookies inválidas', () => {
    expect(parseRefreshToken(undefined)).toBeNull();
    expect(parseRefreshToken('abc')).toBeNull();
    expect(refreshCookieValue('foo=bar')).toBeUndefined();
    const token = generateRefreshToken().token;
    expect(refreshCookieValue('lang=es; admingest_refresh=' + token)).toBe(token);
  });
});
