import { BadRequestException } from '@nestjs/common';

export function assertCanChangeUserStatus(
  actorId: string,
  targetId: string,
  nextStatus?: string,
): void {
  if (actorId === targetId && nextStatus && nextStatus !== 'ACTIVE') {
    throw new BadRequestException('No puedes desactivar o bloquear tu propia cuenta.');
  }
}
