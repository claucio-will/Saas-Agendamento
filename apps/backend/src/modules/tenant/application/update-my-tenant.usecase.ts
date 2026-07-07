import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { UpdateMyTenantDto } from '@repo/shared';
import {
  TENANT_REPOSITORY,
  type TenantRepository,
  type TenantSettings,
} from '../domain/tenant.repository';

/** Atualiza os dados/regras do estabelecimento do dono logado. */
@Injectable()
export class UpdateMyTenantUseCase {
  constructor(
    @Inject(TENANT_REPOSITORY) private readonly repo: TenantRepository,
  ) {}

  async execute(
    tenantId: string,
    dto: UpdateMyTenantDto,
  ): Promise<TenantSettings> {
    const updated = await this.repo.updateSettings(tenantId, dto);
    if (!updated)
      throw new NotFoundException('Estabelecimento não encontrado.');
    return updated;
  }
}
