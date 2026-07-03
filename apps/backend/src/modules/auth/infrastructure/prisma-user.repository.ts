import { Injectable } from '@nestjs/common';
import type { User as PrismaUser } from '@prisma/client';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import { User } from '../domain/user.entity';
import type {
  CreateUserData,
  UserRepository,
} from '../domain/user.repository';

/** Adapter Prisma do UserRepository. */
@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { email } });
    return row ? this.toDomain(row) : null;
  }

  async findById(id: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async create(data: CreateUserData): Promise<User> {
    const row = await this.prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        role: data.role,
        tenantId: data.tenantId ?? null,
        passwordHash: data.passwordHash ?? null,
        phone: data.phone ?? null,
      },
    });
    return this.toDomain(row);
  }

  private toDomain(row: PrismaUser): User {
    return new User(
      row.id,
      row.email,
      row.name,
      row.role,
      row.tenantId,
      row.passwordHash,
      row.phone,
      row.emailVerified,
      row.createdAt,
    );
  }
}
