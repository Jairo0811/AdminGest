import { BadRequestException, ForbiddenException } from '@nestjs/common';
import {
  assertCanChangeUserStatus,
  assertCanManageUser,
  removesAdministrativeAccess,
  requiresSessionRevocation,
} from './user-policy';

describe('UserPolicy', () => {
  const admin = { id: 'admin', role: 'ADMIN', status: 'ACTIVE' };
  const superAdmin = { id: 'root', role: 'SUPER_ADMIN', status: 'ACTIVE' };
  const rep = { id: 'rep', role: 'SALES_REP', status: 'ACTIVE' };

  it('permite que un administrador cambie el estado de otro usuario', () => {
    expect(() => assertCanChangeUserStatus('admin', 'user', 'INACTIVE')).not.toThrow();
  });

  it('impide desactivar la cuenta propia', () => {
    expect(() => assertCanChangeUserStatus('admin', 'admin', 'INACTIVE')).toThrow(
      BadRequestException,
    );
  });

  it('permite conservar activa la cuenta propia', () => {
    expect(() => assertCanChangeUserStatus('admin', 'admin', 'ACTIVE')).not.toThrow();
  });

  it('impide que un ADMIN modifique a un SUPER_ADMIN', () => {
    expect(() => assertCanManageUser(admin, superAdmin, { role: 'VIEWER' })).toThrow(
      ForbiddenException,
    );
    expect(() => assertCanManageUser(admin, superAdmin)).toThrow(ForbiddenException);
    expect(() => assertCanManageUser(superAdmin, superAdmin)).not.toThrow();
  });

  it('impide cambiar el rol propio y permite gestionar a otros', () => {
    expect(() => assertCanManageUser(admin, admin, { role: 'VIEWER' })).toThrow(
      BadRequestException,
    );
    expect(() => assertCanManageUser(admin, admin, { role: 'ADMIN' })).not.toThrow();
    expect(() => assertCanManageUser(admin, rep, { role: 'SALES_MANAGER' })).not.toThrow();
  });

  it('detecta cuándo un cambio retira el acceso administrativo', () => {
    expect(removesAdministrativeAccess(admin, { role: 'VIEWER' })).toBe(true);
    expect(removesAdministrativeAccess(admin, { status: 'BLOCKED' })).toBe(true);
    expect(removesAdministrativeAccess(admin, { role: 'ADMIN' })).toBe(false);
    expect(removesAdministrativeAccess(rep, { status: 'INACTIVE' })).toBe(false);
    expect(removesAdministrativeAccess({ ...admin, status: 'INACTIVE' }, { role: 'VIEWER' })).toBe(
      false,
    );
  });

  it('revoca sesiones al desactivar, cambiar rol o correo', () => {
    expect(requiresSessionRevocation(rep, { status: 'INACTIVE' })).toBe(true);
    expect(requiresSessionRevocation(rep, { role: 'VIEWER' })).toBe(true);
    expect(requiresSessionRevocation(rep, { email: 'b@x.do' }, 'a@x.do')).toBe(true);
    expect(requiresSessionRevocation(rep, { role: 'SALES_REP', status: 'ACTIVE' })).toBe(false);
  });
});
