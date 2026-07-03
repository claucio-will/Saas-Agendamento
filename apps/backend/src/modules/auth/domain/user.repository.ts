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

/** Porta do repositório de usuários (identidade de plataforma). */
export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(data: CreateUserData): Promise<User>;
}

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
