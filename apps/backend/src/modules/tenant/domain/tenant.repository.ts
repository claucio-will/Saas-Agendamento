import type { EstablishmentType, TenantStatus } from '@repo/shared';
import type { Tenant } from './tenant.entity';

export interface CreateTenantData {
  name: string;
  slug: string;
  establishmentType: EstablishmentType;
  documentId?: string;
  phone?: string;
}

/**
 * Porta (interface) do repositório de tenants. A implementação concreta vive na
 * camada de infraestrutura. Padrão port/adapter do DDD. Ver PRD 8.2 §3.
 */
export interface TenantRepository {
  create(data: CreateTenantData): Promise<Tenant>;
  findAll(): Promise<Tenant[]>;
  findById(id: string): Promise<Tenant | null>;
  findBySlug(slug: string): Promise<Tenant | null>;
  updateStatus(id: string, status: TenantStatus): Promise<Tenant | null>;
}

/** Token de injeção do NestJS para a porta acima. */
export const TENANT_REPOSITORY = Symbol('TENANT_REPOSITORY');
