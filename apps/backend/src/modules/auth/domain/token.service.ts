import type { UserRole } from '@repo/shared';

/** Claims do access token (JWT). O `tenantId` vem daqui, nunca do cliente. */
export interface AccessTokenPayload {
  sub: string;
  role: UserRole;
  tenantId: string | null;
}

export interface GeneratedRefreshToken {
  /** Token opaco entregue ao cliente. */
  token: string;
  /** Hash guardado no banco (o token puro nunca é persistido). */
  tokenHash: string;
  expiresAt: Date;
}

/** Porta de emissão de tokens. Access = JWT curto; refresh = opaco + rotativo. */
export interface TokenService {
  signAccessToken(payload: AccessTokenPayload): string;
  generateRefreshToken(): GeneratedRefreshToken;
  hashRefreshToken(token: string): string;
}

export const TOKEN_SERVICE = Symbol('TOKEN_SERVICE');
