import { UserRole, type UserRole as UserRoleT } from '@repo/shared';

/**
 * Página inicial de cada perfil após o login. O Super Admin vai para a gestão
 * da plataforma; o dono, para o painel do estabelecimento; demais, para a conta.
 */
export function homePathForRole(role: UserRoleT): string {
  switch (role) {
    case UserRole.SUPER_ADMIN:
      return '/admin';
    case UserRole.TENANT_ADMIN:
      return '/painel';
    default:
      return '/conta';
  }
}
