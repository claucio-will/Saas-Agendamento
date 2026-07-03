import type { EstablishmentType, TenantStatus } from '@repo/shared';

/**
 * Entidade de domínio Tenant — classe TypeScript pura, sem dependência de
 * NestJS ou Prisma. O domínio nunca importa infraestrutura. Ver PRD 8.2 §3.
 */
export class Tenant {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly slug: string,
    public readonly establishmentType: EstablishmentType,
    public readonly status: TenantStatus,
    public readonly documentId: string | null,
    public readonly phone: string | null,
    public readonly timezone: string,
    public readonly createdAt: Date,
  ) {}
}
