import {
  createPasswordResetToken,
  hashPasswordResetToken,
  isPasswordResetTokenUsable,
  PASSWORD_RESET_TTL_MINUTES,
} from './password-reset-token';

describe('password reset token policy', () => {
  const now = new Date('2026-07-31T16:00:00.000Z');

  it('genera un token opaco y almacenable únicamente como SHA-256', () => {
    const result = createPasswordResetToken(now);

    expect(result.token).not.toBe(result.tokenHash);
    expect(result.tokenHash).toHaveLength(64);
    expect(result.tokenHash).toBe(hashPasswordResetToken(result.token));
  });

  it('vence exactamente después del TTL configurado', () => {
    const result = createPasswordResetToken(now);

    expect(result.expiresAt.getTime() - now.getTime()).toBe(
      PASSWORD_RESET_TTL_MINUTES * 60_000,
    );
  });

  it('rechaza tokens usados o expirados', () => {
    expect(
      isPasswordResetTokenUsable(
        { expiresAt: new Date(now.getTime() + 1_000), usedAt: null },
        now,
      ),
    ).toBe(true);
    expect(
      isPasswordResetTokenUsable(
        { expiresAt: now, usedAt: null },
        now,
      ),
    ).toBe(false);
    expect(
      isPasswordResetTokenUsable(
        { expiresAt: new Date(now.getTime() + 1_000), usedAt: now },
        now,
      ),
    ).toBe(false);
  });
});
