import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  EstablishmentType,
  PricingType,
  PublicEstablishmentDto,
  PublicProfileResponseDto,
} from '@repo/shared';
import { SchedulingRepository } from '../infrastructure/scheduling.repository';

/** Monta o perfil público (por slug): dados do estabelecimento + serviços. */
@Injectable()
export class PublicProfileService {
  constructor(private readonly repo: SchedulingRepository) {}

  /** Lista de estabelecimentos para a descoberta pública (home). */
  async listEstablishments(): Promise<PublicEstablishmentDto[]> {
    const rows = await this.repo.listPublicEstablishments();
    return rows.map((r) => ({
      name: r.name,
      slug: r.slug,
      establishmentType: r.establishmentType as EstablishmentType,
      city: r.city,
    }));
  }

  async getBySlug(slug: string): Promise<PublicProfileResponseDto> {
    const tenant = await this.repo.getTenantBySlug(slug);
    // Só estabelecimentos operacionais aparecem publicamente (PRD 2.13).
    if (!tenant || tenant.status === 'CANCELLED' || tenant.status === 'SUSPENDED') {
      throw new NotFoundException('Estabelecimento não encontrado.');
    }

    const [services, professionals, rating] = await Promise.all([
      this.repo.listPublicServices(tenant.id),
      this.repo.listPublicProfessionals(tenant.id),
      this.repo.getRatingSummary(tenant.id),
    ]);
    return {
      name: tenant.name,
      slug: tenant.slug,
      establishmentType: tenant.establishmentType as EstablishmentType,
      phone: tenant.phone,
      addressLine: tenant.addressLine,
      city: tenant.city,
      state: tenant.state,
      ratingAverage: Math.round(rating.average * 10) / 10,
      ratingCount: rating.count,
      professionals,
      services: services.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        durationMinutes: s.durationMinutes,
        priceCents: s.priceCents,
        pricingType: s.pricingType as PricingType,
        professionals: s.professionals,
      })),
    };
  }
}
