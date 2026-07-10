import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  UserRole,
  type EstablishmentType,
  type PlatformOverviewDto,
  type PlatformOwnerDto,
  type TenantStatus,
} from '@repo/shared';
import { JwtAuthGuard } from '../../auth/interface/jwt-auth.guard';
import { Roles } from '../../auth/interface/roles.decorator';
import { RolesGuard } from '../../auth/interface/roles.guard';
import { ListPlatformOwnersUseCase } from '../application/list-platform-owners.usecase';
import { PlatformStatsService } from '../application/platform-stats.service';

/**
 * Gestão da plataforma pelo Super Admin (dono do sistema). Ele NÃO cria
 * estabelecimentos — apenas observa e gerencia os que existem e seus donos.
 * Ver PRD 2.4.
 */
@Controller('platform')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class PlatformController {
  constructor(
    private readonly listOwners: ListPlatformOwnersUseCase,
    private readonly stats: PlatformStatsService,
  ) {}

  /** Métricas consolidadas da plataforma — assinaturas (dashboard do admin). */
  @Get('overview')
  overview(): Promise<PlatformOverviewDto> {
    return this.stats.getOverview();
  }

  /** Todos os donos de estabelecimento (os "clientes" da plataforma). */
  @Get('owners')
  async owners(): Promise<PlatformOwnerDto[]> {
    const owners = await this.listOwners.execute();
    return owners.map((o) => ({
      id: o.id,
      name: o.name,
      email: o.email,
      phone: o.phone,
      createdAt: o.createdAt.toISOString(),
      tenant: o.tenant
        ? {
            id: o.tenant.id,
            name: o.tenant.name,
            slug: o.tenant.slug,
            status: o.tenant.status as TenantStatus,
            establishmentType: o.tenant.establishmentType as EstablishmentType,
          }
        : null,
    }));
  }
}
