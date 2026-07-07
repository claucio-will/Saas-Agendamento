import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  TENANT_REPOSITORY,
  type TenantRepository,
  type TenantSettings,
} from '../domain/tenant.repository';

/** Configurações completas do estabelecimento do dono logado. */
@Injectable()
export class GetMyTenantSettingsUseCase {
  constructor(
    @Inject(TENANT_REPOSITORY) private readonly repo: TenantRepository,
  ) {}

  async execute(tenantId: string): Promise<TenantSettings> {
    const settings = await this.repo.findSettingsById(tenantId);
    if (!settings)
      throw new NotFoundException('Estabelecimento não encontrado.');
    return settings;
  }
}
