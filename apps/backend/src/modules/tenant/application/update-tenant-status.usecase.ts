import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { TenantStatus } from '@repo/shared';
import type { Tenant } from '../domain/tenant.entity';
import {
  TENANT_REPOSITORY,
  type TenantRepository,
} from '../domain/tenant.repository';

/** Super Admin ativa/suspende/cancela um tenant. Ver PRD 2.4. */
@Injectable()
export class UpdateTenantStatusUseCase {
  constructor(
    @Inject(TENANT_REPOSITORY) private readonly tenants: TenantRepository,
  ) {}

  async execute(id: string, status: TenantStatus): Promise<Tenant> {
    const tenant = await this.tenants.updateStatus(id, status);
    if (!tenant) {
      throw new NotFoundException('Estabelecimento não encontrado.');
    }
    return tenant;
  }
}
