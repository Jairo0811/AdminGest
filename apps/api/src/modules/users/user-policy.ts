import { BadRequestException, ForbiddenException } from '@nestjs/common';

export const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN'] as const;

export interface PolicySubject {
  id: string;
  role: string;
  status?: string;
}

export const isAdministrator = (role: string) => (ADMIN_ROLES as readonly string[]).includes(role);

export function assertCanChangeUserStatus(
  actorId: string,
  targetId: string,
  nextStatus?: string,
): void {
  if (actorId === targetId && nextStatus && nextStatus !== 'ACTIVE') {
    throw new BadRequestException('No puedes desactivar o bloquear tu propia cuenta.');
  }
}

/**
 * Rules applied to every administrative change of another account:
 * - only a SUPER_ADMIN can modify (or reset the password of) a SUPER_ADMIN;
 * - nobody can change their own role (prevents accidental self-demotion);
 * - an account cannot deactivate or block itself.
 */
export function assertCanManageUser(
  actor: PolicySubject,
  target: PolicySubject,
  change: { role?: string; status?: string } = {},
): void {
  if (target.role === 'SUPER_ADMIN' && actor.role !== 'SUPER_ADMIN') {
    throw new ForbiddenException('Solo un superadministrador puede modificar esta cuenta.');
  }
  if (actor.id === target.id && change.role && change.role !== target.role) {
    throw new BadRequestException('No puedes cambiar tu propio rol.');
  }
  assertCanChangeUserStatus(actor.id, target.id, change.status);
}

/**
 * Returns true when the change removes administrative access from an active
 * administrator (role downgrade or deactivation).
 */
export function removesAdministrativeAccess(
  target: PolicySubject,
  change: { role?: string; status?: string },
): boolean {
  if (!isAdministrator(target.role) || target.status !== 'ACTIVE') return false;
  const nextRole = change.role ?? target.role;
  const nextStatus = change.status ?? target.status;
  return !isAdministrator(nextRole) || nextStatus !== 'ACTIVE';
}

/** Changes after which existing sessions must be revoked. */
export function requiresSessionRevocation(
  target: PolicySubject,
  change: { role?: string; status?: string; email?: string },
  currentEmail?: string,
): boolean {
  return (
    (change.status !== undefined && change.status !== 'ACTIVE') ||
    (change.role !== undefined && change.role !== target.role) ||
    (change.email !== undefined && currentEmail !== undefined && change.email !== currentEmail)
  );
}
