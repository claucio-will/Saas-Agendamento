import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import {
  createTenantSchema,
  type CreateTenantDto,
  type TenantResponseDto,
} from '@repo/shared';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import type { Tenant } from '../domain/tenant.entity';
import { CreateTenantUseCase } from '../application/create-tenant.usecase';
import { ListTenantsUseCase } from '../application/list-tenants.usecase';

/**
 * Camada de interface (REST) do contexto Tenant Management.
 * Fase 0: rotas abertas para provar o fluxo ponta a ponta (DTO compartilhado).
 * A proteção por RBAC (SUPER_ADMIN) entra na Etapa 1.1.
 */
@Controller('tenants')
export class TenantController {
  constructor(
    private readonly createTenant: CreateTenantUseCase,
    private readonly listTenants: ListTenantsUseCase,
  ) {}

  @Post()
  @HttpCode(201)
  async create(
    @Body(new ZodValidationPipe(createTenantSchema)) dto: CreateTenantDto,
  ): Promise<TenantResponseDto> {
    const tenant = await this.createTenant.execute(dto);
    return this.toResponse(tenant);
  }

  @Get()
  async list(): Promise<TenantResponseDto[]> {
    const tenants = await this.listTenants.execute();
    return tenants.map((t) => this.toResponse(t));
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
