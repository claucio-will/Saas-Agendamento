import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  UserRole,
  type AppointmentResponseDto,
  type CreateAppointmentDto,
} from '@repo/shared';
import { DateTime } from 'luxon';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '../../auth/domain/user.repository';
import type { AuthUserPrincipal } from '../../auth/interface/current-user.decorator';
import { SchedulingRepository } from '../infrastructure/scheduling.repository';
import { AvailabilityService } from './availability.service';
import { toAppointmentDto, type AppointmentRow } from './appointment.mapper';

/** Fluxo de agendamento do cliente (público, login opcional). Ver PRD 2.8/2.9. */
@Injectable()
export class BookingService {
  constructor(
    private readonly repo: SchedulingRepository,
    private readonly availability: AvailabilityService,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  async book(
    slug: string,
    dto: CreateAppointmentDto,
    principal: AuthUserPrincipal | null,
  ): Promise<AppointmentResponseDto> {
    const tenant = await this.repo.getTenantBySlug(slug);
    if (!tenant || tenant.status === 'CANCELLED') {
      throw new NotFoundException('Estabelecimento não encontrado.');
    }
    if (tenant.status === 'SUSPENDED') {
      throw new ForbiddenException(
        'Estabelecimento temporariamente indisponível.',
      );
    }

    const service = await this.repo.getService(tenant.id, dto.serviceId);
    if (!service) throw new NotFoundException('Serviço não encontrado.');

    const pros = await this.repo.getProfessionalsForService(
      tenant.id,
      dto.serviceId,
    );
    if (!pros.some((p) => p.id === dto.professionalId)) {
      throw new BadRequestException(
        'Profissional não realiza este serviço.',
      );
    }

    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(startsAt.getTime() + service.durationMinutes * 60_000);

    // Defesa: o horário escolhido precisa estar entre os slots ofertados.
    const dateStr =
      DateTime.fromJSDate(startsAt).setZone(tenant.timezone).toISODate() ?? '';
    const avail = await this.availability.compute(
      tenant,
      dto.serviceId,
      dateStr,
      dto.professionalId,
    );
    const offered = avail.professionals
      .find((p) => p.professionalId === dto.professionalId)
      ?.slots.includes(startsAt.toISOString());
    if (!offered) {
      throw new ConflictOrGone();
    }

    const customer = await this.resolveCustomer(principal, dto);

    const { id } = await this.repo.createAppointment(tenant.id, {
      serviceId: dto.serviceId,
      professionalId: dto.professionalId,
      customerId: customer.id,
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      startsAt,
      endsAt,
      priceCents: service.priceCents,
      notes: dto.notes ?? null,
    });

    const created = await this.repo.getAppointment(tenant.id, id);
    return toAppointmentDto(created as unknown as AppointmentRow);
  }

  private async resolveCustomer(
    principal: AuthUserPrincipal | null,
    dto: CreateAppointmentDto,
  ): Promise<{
    id: string | null;
    name: string;
    email: string;
    phone: string | null;
  }> {
    if (principal && principal.role === UserRole.CUSTOMER) {
      const user = await this.users.findById(principal.userId);
      if (user) {
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
        };
      }
    }
    if (!dto.customerName || !dto.customerEmail) {
      throw new BadRequestException(
        'Informe nome e e-mail para concluir o agendamento.',
      );
    }
    return {
      id: null,
      name: dto.customerName,
      email: dto.customerEmail,
      phone: dto.customerPhone ?? null,
    };
  }
}

/** Slot deixou de estar disponível entre a listagem e a confirmação. */
class ConflictOrGone extends BadRequestException {
  constructor() {
    super('Horário indisponível. Escolha outro.');
  }
}
