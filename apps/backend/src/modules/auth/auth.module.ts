import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { GetMeUseCase } from './application/get-me.usecase';
import { LoginUseCase } from './application/login.usecase';
import { LogoutUseCase } from './application/logout.usecase';
import { RefreshUseCase } from './application/refresh.usecase';
import { RegisterUseCase } from './application/register.usecase';
import { TokenIssuer } from './application/token-issuer';
import { PASSWORD_HASHER } from './domain/password-hasher';
import { REFRESH_TOKEN_REPOSITORY } from './domain/refresh-token.repository';
import { TOKEN_SERVICE } from './domain/token.service';
import { USER_REPOSITORY } from './domain/user.repository';
import { ArgonPasswordHasher } from './infrastructure/argon-password-hasher';
import { JwtTokenService } from './infrastructure/jwt-token.service';
import { PrismaRefreshTokenRepository } from './infrastructure/prisma-refresh-token.repository';
import { PrismaUserRepository } from './infrastructure/prisma-user.repository';
import { AuthController } from './interface/auth.controller';
import { JwtStrategy } from './interface/jwt.strategy';
import { RolesGuard } from './interface/roles.guard';

/** Bounded context Identity & Access. */
@Module({
  imports: [PassportModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    RegisterUseCase,
    LoginUseCase,
    RefreshUseCase,
    LogoutUseCase,
    GetMeUseCase,
    TokenIssuer,
    JwtStrategy,
    RolesGuard,
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    { provide: REFRESH_TOKEN_REPOSITORY, useClass: PrismaRefreshTokenRepository },
    { provide: PASSWORD_HASHER, useClass: ArgonPasswordHasher },
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },
  ],
  // Reutilizados por outros contextos: onboarding cria dono + tokens; o RBAC
  // (RolesGuard) protege rotas de Super Admin/dono.
  exports: [USER_REPOSITORY, PASSWORD_HASHER, TokenIssuer, RolesGuard],
})
export class AuthModule {}
