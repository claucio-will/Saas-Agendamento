import type { EstablishmentType, PlanTier, TenantStatus } from '@repo/shared';
import type { Tenant } from './tenant.entity';

export interface CreateTenantData {
  name: string;
  slug: string;
  establishmentType: EstablishmentType;
  documentId?: string;
  phone?: string;
}

/** Leitura completa do estabelecimento para a tela de configurações do dono. */
export interface TenantSettings {
  id: string;
  name: string;
  slug: string;
  establishmentType: EstablishmentType;
  status: TenantStatus;
  plan: PlanTier;
  trialEndsAt: Date | null;
  subscribedAt: Date | null;
  documentId: string | null;
  phone: string | null;
  timezone: string;
  addressLine: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  minAdvanceMinutes: number;
  maxAdvanceDays: number;
  slotIntervalMinutes: number;
}

/** Campos alteráveis pelo dono (todos opcionais). */
export interface UpdateTenantSettingsData {
  name?: string;
  phone?: string | null;
  addressLine?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  timezone?: string;
  minAdvanceMinutes?: number;
  maxAdvanceDays?: number;
  slotIntervalMinutes?: number;
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
  /** Configurações completas do estabelecimento (dono). */
  findSettingsById(id: string): Promise<TenantSettings | null>;
  updateSettings(
    id: string,
    data: UpdateTenantSettingsData,
  ): Promise<TenantSettings | null>;
  /** Ativa a assinatura (pagamento simulado): status ACTIVE + subscribedAt. */
  activateSubscription(
    id: string,
    plan?: PlanTier,
  ): Promise<TenantSettings | null>;
  /** Troca o plano (upgrade/downgrade). */
  changePlan(id: string, plan: PlanTier): Promise<TenantSettings | null>;
}

/** Token de injeção do NestJS para a porta acima. */
export const TENANT_REPOSITORY = Symbol('TENANT_REPOSITORY');
