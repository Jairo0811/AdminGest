import { BadRequestException } from '@nestjs/common';
import { assertCanChangeUserStatus } from './user-policy';

describe('UserPolicy', () => {
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
});
