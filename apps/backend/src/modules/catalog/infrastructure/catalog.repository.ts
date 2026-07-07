import { BadRequestException, Injectable } from '@nestjs/common';
import type {
  CreateProfessionalDto,
  CreateServiceDto,
  ProfessionalResponseDto,
  ServiceResponseDto,
  SetWorkingHoursDto,
  UpdateProfessionalDto,
  UpdateServiceDto,
} from '@repo/shared';
import type { Professional, Service } from '@prisma/client';
import {
  PrismaService,
  type PrismaTransaction,
} from '../../../infra/prisma/prisma.service';

/**
 * Acesso a dados do Catálogo (serviços, profissionais, jornadas), sempre no
 * contexto do tenant (RLS via runWithTenant). Ver ADR 0002.
 */
@Injectable()
export class CatalogRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ---- Serviços -----------------------------------------------------------

  createService(
    tenantId: string,
    dto: CreateServiceDto,
  ): Promise<ServiceResponseDto> {
    return this.prisma.runWithTenant(tenantId, async (tx) => {
      await this.assertProfessionalsBelong(tx, dto.professionalIds);
      const service = await tx.service.create({
        data: {
          tenantId,
          name: dto.name,
          description: dto.description ?? null,
          categoryId: dto.categoryId ?? null,
          durationMinutes: dto.durationMinutes,
          priceCents: dto.priceCents,
          pricingType: dto.pricingType,
        },
      });
      await this.linkProfessionals(tx, tenantId, service.id, dto.professionalIds);
      return this.mapService(service, dto.professionalIds);
    });
  }

  listServices(tenantId: string): Promise<ServiceResponseDto[]> {
    return this.prisma.runWithTenant(tenantId, async (tx) => {
      const rows = await tx.service.findMany({
        orderBy: { createdAt: 'desc' },
        include: { professionals: { select: { professionalId: true } } },
      });
      return rows.map((r) =>
        this.mapService(
          r,
          r.professionals.map((p) => p.professionalId),
        ),
      );
    });
  }

  updateService(
    tenantId: string,
    id: string,
    dto: UpdateServiceDto,
  ): Promise<ServiceResponseDto | null> {
    return this.prisma.runWithTenant(tenantId, async (tx) => {
      const existing = await tx.service.findUnique({ where: { id } });
      if (!existing) return null;
      if (dto.professionalIds) {
        await this.assertProfessionalsBelong(tx, dto.professionalIds);
      }
      const service = await tx.service.update({
        where: { id },
        data: {
          name: dto.name,
          description: dto.description,
          categoryId: dto.categoryId,
          durationMinutes: dto.durationMinutes,
          priceCents: dto.priceCents,
          pricingType: dto.pricingType,
          active: dto.active,
        },
      });
      if (dto.professionalIds) {
        await tx.serviceProfessional.deleteMany({ where: { serviceId: id } });
        await this.linkProfessionals(tx, tenantId, id, dto.professionalIds);
      }
      const links = await tx.serviceProfessional.findMany({
        where: { serviceId: id },
        select: { professionalId: true },
      });
      return this.mapService(
        service,
        links.map((l) => l.professionalId),
      );
    });
  }

  deleteService(tenantId: string, id: string): Promise<boolean> {
    return this.prisma.runWithTenant(tenantId, async (tx) => {
      const res = await tx.service
        .delete({ where: { id } })
        .then(() => true)
        .catch(() => false);
      return res;
    });
  }

  // ---- Profissionais ------------------------------------------------------

  createProfessional(
    tenantId: string,
    dto: CreateProfessionalDto,
  ): Promise<ProfessionalResponseDto> {
    return this.prisma.runWithTenant(tenantId, async (tx) => {
      const pro = await tx.professional.create({
        data: { tenantId, name: dto.name, bio: dto.bio ?? null },
      });
      return this.mapProfessional(pro, []);
    });
  }

  listProfessionals(tenantId: string): Promise<ProfessionalResponseDto[]> {
    return this.prisma.runWithTenant(tenantId, async (tx) => {
      const rows = await tx.professional.findMany({
        orderBy: { createdAt: 'asc' },
        include: { workingHours: true },
      });
      return rows.map((r) => this.mapProfessional(r, r.workingHours));
    });
  }

  updateProfessional(
    tenantId: string,
    id: string,
    dto: UpdateProfessionalDto,
  ): Promise<ProfessionalResponseDto | null> {
    return this.prisma.runWithTenant(tenantId, async (tx) => {
      const existing = await tx.professional.findUnique({ where: { id } });
      if (!existing) return null;
      const pro = await tx.professional.update({
        where: { id },
        data: { name: dto.name, bio: dto.bio, active: dto.active },
      });
      const hours = await tx.workingHours.findMany({
        where: { professionalId: id },
      });
      return this.mapProfessional(pro, hours);
    });
  }

  setWorkingHours(
    tenantId: string,
    professionalId: string,
    dto: SetWorkingHoursDto,
  ): Promise<ProfessionalResponseDto | null> {
    return this.prisma.runWithTenant(tenantId, async (tx) => {
      const pro = await tx.professional.findUnique({
        where: { id: professionalId },
      });
      if (!pro) return null;
      await tx.workingHours.deleteMany({ where: { professionalId } });
      if (dto.items.length) {
        await tx.workingHours.createMany({
          data: dto.items.map((i) => ({
            tenantId,
            professionalId,
            weekday: i.weekday,
            startMinute: i.startMinute,
            endMinute: i.endMinute,
          })),
        });
      }
      return this.mapProfessional(pro, dto.items);
    });
  }

  // ---- Helpers ------------------------------------------------------------

  private async assertProfessionalsBelong(
    tx: PrismaTransaction,
    professionalIds: string[],
  ): Promise<void> {
    if (professionalIds.length === 0) return;
    const found = await tx.professional.findMany({
      where: { id: { in: professionalIds } },
      select: { id: true },
    });
    if (found.length !== professionalIds.length) {
      throw new BadRequestException(
        'Um ou mais profissionais não pertencem ao estabelecimento.',
      );
    }
  }

  private async linkProfessionals(
    tx: PrismaTransaction,
    tenantId: string,
    serviceId: string,
    professionalIds: string[],
  ): Promise<void> {
    if (professionalIds.length === 0) return;
    await tx.serviceProfessional.createMany({
      data: professionalIds.map((professionalId) => ({
        serviceId,
        professionalId,
        tenantId,
      })),
      skipDuplicates: true,
    });
  }

  private mapService(
    row: Service,
    professionalIds: string[],
  ): ServiceResponseDto {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      categoryId: row.categoryId,
      durationMinutes: row.durationMinutes,
      priceCents: row.priceCents,
      pricingType: row.pricingType,
      active: row.active,
      professionalIds,
    };
  }

  private mapProfessional(
    row: Professional,
    hours: { weekday: number; startMinute: number; endMinute: number }[],
  ): ProfessionalResponseDto {
    return {
      id: row.id,
      name: row.name,
      bio: row.bio,
      active: row.active,
      workingHours: hours.map((h) => ({
        weekday: h.weekday,
        startMinute: h.startMinute,
        endMinute: h.endMinute,
      })),
    };
  }
}
