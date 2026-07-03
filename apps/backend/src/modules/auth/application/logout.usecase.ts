import { Inject, Injectable } from '@nestjs/common';
import {
  REFRESH_TOKEN_REPOSITORY,
  type RefreshTokenRepository,
} from '../domain/refresh-token.repository';
import { TOKEN_SERVICE, type TokenService } from '../domain/token.service';

/** Logout: revoga o refresh token apresentado (idempotente). */
@Injectable()
export class LogoutUseCase {
  constructor(
    @Inject(TOKEN_SERVICE) private readonly tokens: TokenService,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokens: RefreshTokenRepository,
  ) {}

  async execute(refreshToken: string): Promise<void> {
    const tokenHash = this.tokens.hashRefreshToken(refreshToken);
    const stored = await this.refreshTokens.findByHash(tokenHash);
    if (stored && !stored.revokedAt) {
      await this.refreshTokens.revoke(stored.id);
    }
  }
}
