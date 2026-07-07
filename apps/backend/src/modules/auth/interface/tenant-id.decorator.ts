import {
  createParamDecorator,
  ForbiddenException,
  type ExecutionContext,
} from '@nestjs/common';
import type { AuthUserPrincipal } from './current-user.decorator';

/**
 * Injeta o `tenantId` do usuário autenticado (staff). Lança se ausente — o
 * tenant vem SEMPRE do JWT, nunca do cliente. Ver PRD 2.3.
 */
export const TenantId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ user?: AuthUserPrincipal }>();
    const tenantId = request.user?.tenantId;
    if (!tenantId) {
      throw new ForbiddenException('Ação exige um estabelecimento vinculado.');
    }
    return tenantId;
  },
);
