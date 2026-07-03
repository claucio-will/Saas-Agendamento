export interface StoreRefreshTokenData {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

export interface StoredRefreshToken {
  id: string;
  userId: string;
  expiresAt: Date;
  revokedAt: Date | null;
}

/** Porta do repositório de refresh tokens (rotação/revogação). Ver PRD 3.4. */
export interface RefreshTokenRepository {
  store(data: StoreRefreshTokenData): Promise<void>;
  findByHash(tokenHash: string): Promise<StoredRefreshToken | null>;
  revoke(id: string): Promise<void>;
  revokeAllForUser(userId: string): Promise<void>;
}

export const REFRESH_TOKEN_REPOSITORY = Symbol('REFRESH_TOKEN_REPOSITORY');
