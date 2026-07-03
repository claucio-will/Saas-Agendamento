import { Injectable } from '@nestjs/common';
import type { Tenant as PrismaTenant } from '@prisma/client';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import { Tenant } from '../domain/tenant.entity';
import type {
  CreateTenantData,
  TenantRepository,
} from '../domain/tenant.repository';

/** Adapter Prisma da porta TenantRepository. */
@Injectable()
export class PrismaTenantRepository implements TenantRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateTenantData): Promise<Tenant> {
    const row = await this.prisma.tenant.create({
      data: {
        name: data.name,
        slug: data.slug,
        establishmentType: data.establishmentType,
        documentId: data.documentId ?? null,
        phone: data.phone ?? null,
      },
    });
    return this.toDomain(row);
  }

  async findAll(): Promise<Tenant[]> {
    const rows = await this.prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => this.toDomain(row));
  }

  async findBySlug(slug: string): Promise<Tenant | null> {
    const row = await this.prisma.tenant.findUnique({ where: { slug } });
    return row ? this.toDomain(row) : null;
  }

  private toDomain(row: PrismaTenant): Tenant {
    return new Tenant(
      row.id,
      row.name,
      row.slug,
      row.establishmentType,
      row.status,
      row.documentId,
      row.phone,
      row.timezone,
      row.createdAt,
    );
  }
}
