import { Injectable } from '@nestjs/common';
import { UserRole } from '@repo/shared';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import { Tenant } from '../domain/tenant.entity';
import type {
  ProvisionResult,
  ProvisionTenantData,
  TenantProvisioner,
} from '../domain/tenant-provisioning';

/**
 * Cria tenant + dono (TENANT_ADMIN) + aceite de termos numa única transação.
 * Todas são tabelas sem RLS (tenant / identidade), então a transação simples
 * do Prisma basta. Ver PRD 2.1.
 */
@Injectable()
export class PrismaTenantProvisioningService implements TenantProvisioner {
  constructor(private readonly prisma: PrismaService) {}

  async provision(data: ProvisionTenantData): Promise<ProvisionResult> {
    return this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: data.tenant.name,
          slug: data.tenant.slug,
          establishmentType: data.tenant.establishmentType,
          documentId: data.tenant.documentId,
          phone: data.tenant.phone,
          addressLine: data.tenant.addressLine,
          city: data.tenant.city,
          state: data.tenant.state,
          postalCode: data.tenant.postalCode,
          settings: (data.tenant.settings ?? undefined) as
            | Prisma.InputJsonValue
            | undefined,
        },
      });

      const user = await tx.user.create({
        data: {
          email: data.owner.email,
          name: data.owner.name,
          role: UserRole.TENANT_ADMIN,
          tenantId: tenant.id,
          passwordHash: data.owner.passwordHash,
        },
      });

      await tx.termsAcceptance.create({
        data: {
          userId: user.id,
          tenantId: tenant.id,
          termsVersion: data.termsVersion,
          ipAddress: data.ipAddress,
        },
      });

      return {
        tenant: new Tenant(
          tenant.id,
          tenant.name,
          tenant.slug,
          tenant.establishmentType,
          tenant.status,
          tenant.documentId,
          tenant.phone,
          tenant.timezone,
          tenant.createdAt,
        ),
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenantId: tenant.id,
        },
      };
    });
  }
}
