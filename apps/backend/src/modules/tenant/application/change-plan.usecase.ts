import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { PlanTier } from '@repo/shared';
import {
  TENANT_REPOSITORY,
  type TenantRepository,
  type TenantSettings,
} from '../domain/tenant.repository';

/** Troca o plano do estabelecimento (upgrade/downgrade), feita pelo dono. */
@Injectable()
export class ChangePlanUseCase {
  constructor(
    @Inject(TENANT_REPOSITORY) private readonly repo: TenantRepository,
  ) {}

  async execute(tenantId: string, plan: PlanTier): Promise<TenantSettings> {
    const updated = await this.repo.changePlan(tenantId, plan);
    if (!updated)
      throw new NotFoundException('Estabelecimento não encontrado.');
    return updated;
  }
}
