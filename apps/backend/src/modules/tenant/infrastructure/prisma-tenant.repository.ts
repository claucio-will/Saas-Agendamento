import { Injectable } from '@nestjs/common';
import type { TenantStatus } from '@repo/shared';
import type { Tenant as PrismaTenant } from '@prisma/client';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import { Tenant } from '../domain/tenant.entity';
import type {
  CreateTenantData,
  TenantRepository,
  TenantSettings,
  UpdateTenantSettingsData,
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

  async findById(id: string): Promise<Tenant | null> {
    const row = await this.prisma.tenant.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findBySlug(slug: string): Promise<Tenant | null> {
    const row = await this.prisma.tenant.findUnique({ where: { slug } });
    return row ? this.toDomain(row) : null;
  }

  async updateStatus(id: string, status: TenantStatus): Promise<Tenant | null> {
    const row = await this.prisma.tenant
      .update({ where: { id }, data: { status } })
      .catch(() => null);
    return row ? this.toDomain(row) : null;
  }

  async findSettingsById(id: string): Promise<TenantSettings | null> {
    const row = await this.prisma.tenant.findUnique({ where: { id } });
    return row ? this.toSettings(row) : null;
  }

  async updateSettings(
    id: string,
    data: UpdateTenantSettingsData,
  ): Promise<TenantSettings | null> {
    const row = await this.prisma.tenant
      .update({ where: { id }, data })
      .catch(() => null);
    return row ? this.toSettings(row) : null;
  }

  private toSettings(row: PrismaTenant): TenantSettings {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      establishmentType: row.establishmentType,
      status: row.status,
      documentId: row.documentId,
      phone: row.phone,
      timezone: row.timezone,
      addressLine: row.addressLine,
      city: row.city,
      state: row.state,
      postalCode: row.postalCode,
      minAdvanceMinutes: row.minAdvanceMinutes,
      maxAdvanceDays: row.maxAdvanceDays,
      slotIntervalMinutes: row.slotIntervalMinutes,
    };
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
