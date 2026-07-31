import { createHash, randomBytes } from 'node:crypto';

export const PASSWORD_RESET_TTL_MINUTES = 30;

export function createPasswordResetToken(now = new Date()) {
  const token = randomBytes(64).toString('base64url');
  return {
    token,
    tokenHash: hashPasswordResetToken(token),
    expiresAt: new Date(now.getTime() + PASSWORD_RESET_TTL_MINUTES * 60_000),
  };
}

export function hashPasswordResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function isPasswordResetTokenUsable(token: {
  expiresAt: Date;
  usedAt: Date | null;
}, now = new Date()): boolean {
  return token.usedAt === null && token.expiresAt > now;
}
