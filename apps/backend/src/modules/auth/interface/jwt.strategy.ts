import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { UserRole } from '@repo/shared';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { AuthUserPrincipal } from './current-user.decorator';

interface JwtPayload {
  sub: string;
  role: UserRole;
  tenantId: string | null;
}

/** Valida o access token (Bearer) e monta o principal. Ver PRD 2.2. */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

  validate(payload: JwtPayload): AuthUserPrincipal {
    return {
      userId: payload.sub,
      role: payload.role,
      tenantId: payload.tenantId ?? null,
    };
  }
}
