import { ConflictException, Inject, Injectable } from '@nestjs/common';
import type { CreateTenantDto } from '@repo/shared';
import { Tenant } from '../domain/tenant.entity';
import {
  TENANT_REPOSITORY,
  type TenantRepository,
} from '../domain/tenant.repository';

/** Caso de uso: onboarding self-service de um novo tenant. Ver PRD 2.1. */
@Injectable()
export class CreateTenantUseCase {
  constructor(
    @Inject(TENANT_REPOSITORY)
    private readonly tenants: TenantRepository,
  ) {}

  async execute(input: CreateTenantDto): Promise<Tenant> {
    const existing = await this.tenants.findBySlug(input.slug);
    if (existing) {
      throw new ConflictException(`O slug "${input.slug}" já está em uso.`);
    }
    return this.tenants.create(input);
  }
}
