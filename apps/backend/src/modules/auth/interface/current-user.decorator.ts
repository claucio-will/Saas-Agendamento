import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { UserRole } from '@repo/shared';

/** Principal autenticado, montado pela JwtStrategy a partir das claims do JWT. */
export interface AuthUserPrincipal {
  userId: string;
  role: UserRole;
  tenantId: string | null;
}

/** Injeta o principal autenticado no handler: `@CurrentUser() user`. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUserPrincipal => {
    const request = ctx.switchToHttp().getRequest<{ user: AuthUserPrincipal }>();
    return request.user;
  },
);
