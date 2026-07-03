import { Body, Controller, Ip, Post } from '@nestjs/common';
import {
  onboardingSchema,
  type OnboardingDto,
  type OnboardingResponseDto,
} from '@repo/shared';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { OnboardTenantUseCase } from '../application/onboard-tenant.usecase';

/** Onboarding self-service do estabelecimento (público). Ver PRD 2.1. */
@Controller('tenants/onboarding')
export class OnboardingController {
  constructor(private readonly onboard: OnboardTenantUseCase) {}

  @Post()
  async create(
    @Body(new ZodValidationPipe(onboardingSchema)) dto: OnboardingDto,
    @Ip() ip: string,
  ): Promise<OnboardingResponseDto> {
    const result = await this.onboard.execute(dto, ip ?? null);
    return {
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name,
        slug: result.tenant.slug,
        establishmentType: result.tenant.establishmentType,
        status: result.tenant.status,
        createdAt: result.tenant.createdAt.toISOString(),
      },
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
        tenantId: result.user.tenantId,
      },
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    };
  }
}
