import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '@repo/shared';

export const ROLES_KEY = 'roles';

/** Restringe a rota aos papéis informados: `@Roles('SUPER_ADMIN')`. Ver PRD 2.2. */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
