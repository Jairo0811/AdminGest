import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthUser } from '../auth-user.interface';
import { ROLES_KEY } from '../decorators/roles.decorator';
import {
  resolveAction,
  resolveResource,
  roleHasPermission,
} from '../authorization/role-permissions';

interface AuthorizedRequest {
  user?: AuthUser;
  method: string;
  originalUrl?: string;
  url?: string;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const explicitRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest<AuthorizedRequest>();

    // Las rutas públicas son responsabilidad del guard de autenticación.
    if (!request.user) return true;

    if (explicitRoles?.length && !explicitRoles.includes(request.user.role)) {
      return false;
    }

    const resource = resolveResource(request.originalUrl ?? request.url ?? '');
    if (!resource) return true;

    return roleHasPermission(
      request.user.role,
      resource,
      resolveAction(request.method),
    );
  }
}
