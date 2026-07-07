import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Tenant } from '../domain/tenant.entity';
import {
  TENANT_REPOSITORY,
  type TenantRepository,
} from '../domain/tenant.repository';

/** Retorna o estabelecimento do dono autenticado (a partir do tenantId do JWT). */
@Injectable()
export class GetMyTenantUseCase {
  constructor(
    @Inject(TENANT_REPOSITORY) private readonly repo: TenantRepository,
  ) {}

  async execute(tenantId: string): Promise<Tenant> {
    const tenant = await this.repo.findById(tenantId);
    if (!tenant) throw new NotFoundException('Estabelecimento não encontrado.');
    return tenant;
  }
}
