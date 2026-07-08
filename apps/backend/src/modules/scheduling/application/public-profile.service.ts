import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  EstablishmentType,
  PricingType,
  PublicProfileResponseDto,
} from '@repo/shared';
import { SchedulingRepository } from '../infrastructure/scheduling.repository';

/** Monta o perfil público (por slug): dados do estabelecimento + serviços. */
@Injectable()
export class PublicProfileService {
  constructor(private readonly repo: SchedulingRepository) {}

  async getBySlug(slug: string): Promise<PublicProfileResponseDto> {
    const tenant = await this.repo.getTenantBySlug(slug);
    // Só estabelecimentos operacionais aparecem publicamente (PRD 2.13).
    if (!tenant || tenant.status === 'CANCELLED' || tenant.status === 'SUSPENDED') {
      throw new NotFoundException('Estabelecimento não encontrado.');
    }

    const services = await this.repo.listPublicServices(tenant.id);
    return {
      name: tenant.name,
      slug: tenant.slug,
      establishmentType: tenant.establishmentType as EstablishmentType,
      phone: tenant.phone,
      addressLine: tenant.addressLine,
      city: tenant.city,
      state: tenant.state,
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
