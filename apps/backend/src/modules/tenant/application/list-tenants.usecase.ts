import { Inject, Injectable } from '@nestjs/common';
import type { Tenant } from '../domain/tenant.entity';
import {
  TENANT_REPOSITORY,
  type TenantRepository,
} from '../domain/tenant.repository';

/** Caso de uso: listagem de tenants (área do Super Admin). Ver PRD 2.4. */
@Injectable()
export class ListTenantsUseCase {
  constructor(
    @Inject(TENANT_REPOSITORY)
    private readonly tenants: TenantRepository,
  ) {}

  execute(): Promise<Tenant[]> {
    return this.tenants.findAll();
  }
}
