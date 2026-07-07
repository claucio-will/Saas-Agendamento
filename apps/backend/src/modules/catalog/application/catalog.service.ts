import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  CreateProfessionalDto,
  CreateServiceDto,
  ProfessionalResponseDto,
  ServiceResponseDto,
  SetWorkingHoursDto,
  UpdateProfessionalDto,
  UpdateServiceDto,
} from '@repo/shared';
import { CatalogRepository } from '../infrastructure/catalog.repository';

/** Casos de uso do Catálogo (serviços, profissionais, jornadas). Ver PRD 2.5. */
@Injectable()
export class CatalogService {
  constructor(private readonly repo: CatalogRepository) {}

  createService(tenantId: string, dto: CreateServiceDto) {
    return this.repo.createService(tenantId, dto);
  }

  listServices(tenantId: string): Promise<ServiceResponseDto[]> {
    return this.repo.listServices(tenantId);
  }

  async updateService(tenantId: string, id: string, dto: UpdateServiceDto) {
    const updated = await this.repo.updateService(tenantId, id, dto);
    if (!updated) throw new NotFoundException('Serviço não encontrado.');
    return updated;
  }

  async deleteService(tenantId: string, id: string): Promise<void> {
    const ok = await this.repo.deleteService(tenantId, id);
    if (!ok) throw new NotFoundException('Serviço não encontrado.');
  }

  createProfessional(tenantId: string, dto: CreateProfessionalDto) {
    return this.repo.createProfessional(tenantId, dto);
  }

  listProfessionals(tenantId: string): Promise<ProfessionalResponseDto[]> {
    return this.repo.listProfessionals(tenantId);
  }

  async updateProfessional(
    tenantId: string,
    id: string,
    dto: UpdateProfessionalDto,
  ) {
    const updated = await this.repo.updateProfessional(tenantId, id, dto);
    if (!updated) throw new NotFoundException('Profissional não encontrado.');
    return updated;
  }

  async setWorkingHours(
    tenantId: string,
    professionalId: string,
    dto: SetWorkingHoursDto,
  ) {
    const updated = await this.repo.setWorkingHours(
      tenantId,
      professionalId,
      dto,
    );
    if (!updated) throw new NotFoundException('Profissional não encontrado.');
    return updated;
  }
}
