import type { EstablishmentType, PlanTier, UserRole } from '@repo/shared';
import type { Tenant } from './tenant.entity';

export interface ProvisionTenantData {
  tenant: {
    name: string;
    slug: string;
    establishmentType: EstablishmentType;
    plan: PlanTier;
    documentId: string;
    phone: string;
    addressLine: string;
    city: string;
    state: string;
    postalCode: string;
    settings: Record<string, unknown> | null;
  };
  owner: {
    name: string;
    email: string;
    passwordHash: string;
  };
  termsVersion: string;
  ipAddress: string | null;
}

export interface ProvisionedUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId: string;
}

export interface ProvisionResult {
  tenant: Tenant;
  user: ProvisionedUser;
}

/**
 * Porta de provisionamento atômico: cria tenant + usuário dono (TENANT_ADMIN) +
 * registro de aceite de termos numa única transação. Ver PRD 2.1 / 3.4.
 */
export interface TenantProvisioner {
  provision(data: ProvisionTenantData): Promise<ProvisionResult>;
}

export const TENANT_PROVISIONER = Symbol('TENANT_PROVISIONER');
