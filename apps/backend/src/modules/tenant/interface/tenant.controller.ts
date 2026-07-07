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
  updateMyTenantSchema,
  updateTenantStatusSchema,
  UserRole,
  type CreateTenantDto,
  type MyTenantResponseDto,
  type TenantResponseDto,
  type UpdateMyTenantDto,
  type UpdateTenantStatusDto,
} from '@repo/shared';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../../auth/interface/jwt-auth.guard';
import { Roles } from '../../auth/interface/roles.decorator';
import { RolesGuard } from '../../auth/interface/roles.guard';
import { TenantId } from '../../auth/interface/tenant-id.decorator';
import type { Tenant } from '../domain/tenant.entity';
import type { TenantSettings } from '../domain/tenant.repository';
import { CreateTenantUseCase } from '../application/create-tenant.usecase';
import { GetMyTenantUseCase } from '../application/get-my-tenant.usecase';
import { GetMyTenantSettingsUseCase } from '../application/get-my-tenant-settings.usecase';
import { ListTenantsUseCase } from '../application/list-tenants.usecase';
import { UpdateMyTenantUseCase } from '../application/update-my-tenant.usecase';
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
    private readonly getMyTenant: GetMyTenantUseCase,
    private readonly getMyTenantSettings: GetMyTenantSettingsUseCase,
    private readonly updateMyTenant: UpdateMyTenantUseCase,
  ) {}

  /** Estabelecimento do dono logado (para a navegação do painel). */
  @Get('me')
  @Roles(UserRole.TENANT_ADMIN)
  async me(@TenantId() tenantId: string): Promise<TenantResponseDto> {
    return this.toResponse(await this.getMyTenant.execute(tenantId));
  }

  /** Configurações completas do estabelecimento (dono). */
  @Get('me/settings')
  @Roles(UserRole.TENANT_ADMIN)
  async mySettings(
    @TenantId() tenantId: string,
  ): Promise<MyTenantResponseDto> {
    return this.toMySettings(await this.getMyTenantSettings.execute(tenantId));
  }

  @Patch('me/settings')
  @Roles(UserRole.TENANT_ADMIN)
  async updateMySettings(
    @TenantId() tenantId: string,
    @Body(new ZodValidationPipe(updateMyTenantSchema)) dto: UpdateMyTenantDto,
  ): Promise<MyTenantResponseDto> {
    return this.toMySettings(await this.updateMyTenant.execute(tenantId, dto));
  }

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

  private toMySettings(s: TenantSettings): MyTenantResponseDto {
    return {
      id: s.id,
      name: s.name,
      slug: s.slug,
      establishmentType: s.establishmentType,
      status: s.status,
      documentId: s.documentId,
      phone: s.phone,
      timezone: s.timezone,
      addressLine: s.addressLine,
      city: s.city,
      state: s.state,
      postalCode: s.postalCode,
      minAdvanceMinutes: s.minAdvanceMinutes,
      maxAdvanceDays: s.maxAdvanceDays,
      slotIntervalMinutes: s.slotIntervalMinutes,
    };
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
