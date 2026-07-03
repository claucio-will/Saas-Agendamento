import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  loginSchema,
  refreshTokenSchema,
  registerSchema,
  type AuthResponseDto,
  type AuthUserDto,
  type LoginDto,
  type RefreshTokenDto,
  type RegisterDto,
} from '@repo/shared';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import type { AuthResult } from '../application/auth-result';
import { GetMeUseCase } from '../application/get-me.usecase';
import { LoginUseCase } from '../application/login.usecase';
import { LogoutUseCase } from '../application/logout.usecase';
import { RefreshUseCase } from '../application/refresh.usecase';
import { RegisterUseCase } from '../application/register.usecase';
import type { User } from '../domain/user.entity';
import {
  CurrentUser,
  type AuthUserPrincipal,
} from './current-user.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';

/** Camada de interface (REST) do contexto Identity & Access. */
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshUseCase: RefreshUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly getMeUseCase: GetMeUseCase,
  ) {}

  @Post('register')
  @HttpCode(201)
  async register(
    @Body(new ZodValidationPipe(registerSchema)) dto: RegisterDto,
  ): Promise<AuthResponseDto> {
    return this.toResponse(await this.registerUseCase.execute(dto));
  }

  @Post('login')
  @HttpCode(200)
  async login(
    @Body(new ZodValidationPipe(loginSchema)) dto: LoginDto,
  ): Promise<AuthResponseDto> {
    return this.toResponse(await this.loginUseCase.execute(dto));
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(
    @Body(new ZodValidationPipe(refreshTokenSchema)) dto: RefreshTokenDto,
  ): Promise<AuthResponseDto> {
    return this.toResponse(await this.refreshUseCase.execute(dto.refreshToken));
  }

  @Post('logout')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard)
  async logout(
    @Body(new ZodValidationPipe(refreshTokenSchema)) dto: RefreshTokenDto,
  ): Promise<void> {
    await this.logoutUseCase.execute(dto.refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(
    @CurrentUser() principal: AuthUserPrincipal,
  ): Promise<AuthUserDto> {
    const user = await this.getMeUseCase.execute(principal.userId);
    return this.toAuthUser(user);
  }

  private toResponse(result: AuthResult): AuthResponseDto {
    return {
      user: this.toAuthUser(result.user),
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    };
  }

  private toAuthUser(user: User): AuthUserDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    };
  }
}
