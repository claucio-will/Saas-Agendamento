import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { UserRole } from '@repo/shared';
import type { AuthUserPrincipal } from './current-user.decorator';
import { ROLES_KEY } from './roles.decorator';

/** Aplica o RBAC declarado por `@Roles(...)`. Usar após o JwtAuthGuard. */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<UserRole[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required || required.length === 0) return true;

    const request = context
      .switchToHttp()
      .getRequest<{ user?: AuthUserPrincipal }>();
    const user = request.user;
    if (!user || !required.includes(user.role)) {
      throw new ForbiddenException('Acesso negado para o seu perfil.');
    }
    return true;
  }
}
