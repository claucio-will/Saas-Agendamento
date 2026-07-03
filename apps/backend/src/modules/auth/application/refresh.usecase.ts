import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import {
  REFRESH_TOKEN_REPOSITORY,
  type RefreshTokenRepository,
} from '../domain/refresh-token.repository';
import { TOKEN_SERVICE, type TokenService } from '../domain/token.service';
import { USER_REPOSITORY, type UserRepository } from '../domain/user.repository';
import type { AuthResult } from './auth-result';
import { TokenIssuer } from './token-issuer';

/**
 * Troca um refresh token válido por um novo par, revogando o antigo (rotação).
 * Ver PRD 3.4.
 */
@Injectable()
export class RefreshUseCase {
  constructor(
    @Inject(TOKEN_SERVICE) private readonly tokens: TokenService,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokens: RefreshTokenRepository,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    private readonly tokenIssuer: TokenIssuer,
  ) {}

  async execute(refreshToken: string): Promise<AuthResult> {
    const tokenHash = this.tokens.hashRefreshToken(refreshToken);
    const stored = await this.refreshTokens.findByHash(tokenHash);
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token inválido ou expirado.');
    }

    // Rotação: o token usado é revogado e um novo par é emitido.
    await this.refreshTokens.revoke(stored.id);

    const user = await this.users.findById(stored.userId);
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado.');
    }
    return this.tokenIssuer.issueFor(user);
  }
}
