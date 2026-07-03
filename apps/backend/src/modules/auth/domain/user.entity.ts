import type { UserRole } from '@repo/shared';

/** Entidade de domínio User — TypeScript puro. Ver ADR 0001. */
export class User {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly name: string,
    public readonly role: UserRole,
    public readonly tenantId: string | null,
    public readonly passwordHash: string | null,
    public readonly phone: string | null,
    public readonly emailVerified: boolean,
    public readonly createdAt: Date,
  ) {}
}
