import type { User } from '../domain/user.entity';

/** Resultado de um fluxo de autenticação: usuário + par de tokens. */
export interface AuthResult {
  user: User;
  accessToken: string;
  refreshToken: string;
}
