import { createHmac, randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import type {
  AccessTokenPayload,
  GeneratedRefreshToken,
  TokenService,
} from '../domain/token.service';

/**
 * Emissão de tokens:
 * - access = JWT curto assinado com JWT_ACCESS_SECRET (carrega sub/role/tenantId);
 * - refresh = token opaco aleatório; no banco guardamos apenas o HMAC-SHA256.
 */
@Injectable()
export class JwtTokenService implements TokenService {
  private readonly accessSecret: string;
  private readonly accessTtl: string;
  private readonly refreshSecret: string;
  private readonly refreshTtlDays: number;

  constructor(
    private readonly jwt: JwtService,
    config: ConfigService,
  ) {
    this.accessSecret = config.getOrThrow<string>('JWT_ACCESS_SECRET');
    this.accessTtl = config.getOrThrow<string>('JWT_ACCESS_TTL');
    this.refreshSecret = config.getOrThrow<string>('JWT_REFRESH_SECRET');
    this.refreshTtlDays = Number(config.getOrThrow('JWT_REFRESH_TTL_DAYS'));
  }

  signAccessToken(payload: AccessTokenPayload): string {
    // expiresIn aceita string tipo '15m' em runtime; o tipo é estreito (ms).
    const options: JwtSignOptions = {
      secret: this.accessSecret,
      expiresIn: this.accessTtl as JwtSignOptions['expiresIn'],
    };
    return this.jwt.sign(payload, options);
  }

  generateRefreshToken(): GeneratedRefreshToken {
    const token = randomBytes(48).toString('base64url');
    const expiresAt = new Date(
      Date.now() + this.refreshTtlDays * 24 * 60 * 60 * 1000,
    );
    return { token, tokenHash: this.hashRefreshToken(token), expiresAt };
  }

  hashRefreshToken(token: string): string {
    return createHmac('sha256', this.refreshSecret).update(token).digest('hex');
  }
}
