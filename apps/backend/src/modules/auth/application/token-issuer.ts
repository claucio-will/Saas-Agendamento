import { Inject, Injectable } from '@nestjs/common';
import {
  REFRESH_TOKEN_REPOSITORY,
  type RefreshTokenRepository,
} from '../domain/refresh-token.repository';
import { TOKEN_SERVICE, type TokenService } from '../domain/token.service';
import type { User } from '../domain/user.entity';
import type { AuthResult } from './auth-result';

/** Emite o par (access + refresh) para um usuário e persiste o hash do refresh. */
@Injectable()
export class TokenIssuer {
  constructor(
    @Inject(TOKEN_SERVICE) private readonly tokens: TokenService,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokens: RefreshTokenRepository,
  ) {}

  async issueFor(user: User): Promise<AuthResult> {
    const accessToken = this.tokens.signAccessToken({
      sub: user.id,
      role: user.role,
      tenantId: user.tenantId,
    });
    const refresh = this.tokens.generateRefreshToken();
    await this.refreshTokens.store({
      userId: user.id,
      tokenHash: refresh.tokenHash,
      expiresAt: refresh.expiresAt,
    });
    return { user, accessToken, refreshToken: refresh.token };
  }
}
