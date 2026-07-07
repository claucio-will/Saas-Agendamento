import type { UserRole } from '@repo/shared';
import type { User } from './user.entity';

export interface CreateUserData {
  email: string;
  name: string;
  role: UserRole;
  tenantId?: string | null;
  passwordHash?: string | null;
  phone?: string | null;
}

/** Leitura de plataforma: dono (TENANT_ADMIN) com o estabelecimento vinculado. */
export interface PlatformOwner {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  createdAt: Date;
  tenant: {
    id: string;
    name: string;
    slug: string;
    status: string;
    establishmentType: string;
  } | null;
}

/** Porta do repositório de usuários (identidade de plataforma). */
export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(data: CreateUserData): Promise<User>;
  /** Donos de estabelecimento (para a visão do Super Admin). */
  findOwners(): Promise<PlatformOwner[]>;
}

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
