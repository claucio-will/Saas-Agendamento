import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { PlanTier } from '@repo/shared';
import {
  TENANT_REPOSITORY,
  type TenantRepository,
  type TenantSettings,
} from '../domain/tenant.repository';

/**
 * Ativa a assinatura do estabelecimento (pagamento SIMULADO — sem gateway).
 * O checkout no frontend coleta dados de cartão apenas visualmente; aqui só
 * marcamos a assinatura como ativa. Ver PRD 2.13.
 */
@Injectable()
export class ActivateSubscriptionUseCase {
  constructor(
    @Inject(TENANT_REPOSITORY) private readonly repo: TenantRepository,
  ) {}

  async execute(tenantId: string, plan?: PlanTier): Promise<TenantSettings> {
    const updated = await this.repo.activateSubscription(tenantId, plan);
    if (!updated)
      throw new NotFoundException('Estabelecimento não encontrado.');
    return updated;
  }
}
