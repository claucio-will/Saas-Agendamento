import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  createTenantSchema,
  updateTenantStatusSchema,
  UserRole,
  type CreateTenantDto,
  type TenantResponseDto,
  type UpdateTenantStatusDto,
} from '@repo/shared';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../../auth/interface/jwt-auth.guard';
import { Roles } from '../../auth/interface/roles.decorator';
import { RolesGuard } from '../../auth/interface/roles.guard';
import type { Tenant } from '../domain/tenant.entity';
import { CreateTenantUseCase } from '../application/create-tenant.usecase';
import { ListTenantsUseCase } from '../application/list-tenants.usecase';
import { UpdateTenantStatusUseCase } from '../application/update-tenant-status.usecase';

/**
 * Área do Super Admin (plataforma). Todas as rotas exigem papel SUPER_ADMIN.
 * O onboarding self-service do dono fica no OnboardingController. Ver PRD 2.4.
 */
@Controller('tenants')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class TenantController {
  constructor(
    private readonly createTenant: CreateTenantUseCase,
    private readonly listTenants: ListTenantsUseCase,
    private readonly updateTenantStatus: UpdateTenantStatusUseCase,
  ) {}

  @Post()
  @HttpCode(201)
  async create(
    @Body(new ZodValidationPipe(createTenantSchema)) dto: CreateTenantDto,
  ): Promise<TenantResponseDto> {
    return this.toResponse(await this.createTenant.execute(dto));
  }

  @Get()
  async list(): Promise<TenantResponseDto[]> {
    const tenants = await this.listTenants.execute();
    return tenants.map((t) => this.toResponse(t));
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(updateTenantStatusSchema))
    dto: UpdateTenantStatusDto,
  ): Promise<TenantResponseDto> {
    return this.toResponse(await this.updateTenantStatus.execute(id, dto.status));
  }

  private toResponse(tenant: Tenant): TenantResponseDto {
    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      establishmentType: tenant.establishmentType,
      status: tenant.status,
      createdAt: tenant.createdAt.toISOString(),
    };
  }
}
