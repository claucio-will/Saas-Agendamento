import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DateTime } from 'luxon';
import { SchedulingRepository } from '../infrastructure/scheduling.repository';
import { AvailabilityService } from './availability.service';

const TERMINAL = ['CANCELLED', 'COMPLETED', 'NO_SHOW'];

/** Ações do cliente sobre os PRÓPRIOS agendamentos (cancelar/remarcar). */
@Injectable()
export class CustomerAppointmentsService {
  constructor(
    private readonly repo: SchedulingRepository,
    private readonly availability: AvailabilityService,
  ) {}

  async cancel(customerId: string, appointmentId: string): Promise<void> {
    const appt = await this.repo.getCustomerAppointment(
      customerId,
      appointmentId,
    );
    if (!appt) throw new NotFoundException('Agendamento não encontrado.');
    if (TERMINAL.includes(appt.status)) {
      throw new BadRequestException('Este agendamento não pode ser cancelado.');
    }
    if (appt.startsAt.getTime() <= Date.now()) {
      throw new BadRequestException(
        'Não é possível cancelar um horário que já passou.',
      );
    }
    await this.repo.cancel(appt.tenantId, appointmentId, 'Cancelado pelo cliente');
  }

  async reschedule(
    customerId: string,
    appointmentId: string,
    startsAtIso: string,
  ): Promise<void> {
    const appt = await this.repo.getCustomerAppointment(
      customerId,
      appointmentId,
    );
    if (!appt) throw new NotFoundException('Agendamento não encontrado.');
    if (TERMINAL.includes(appt.status)) {
      throw new BadRequestException('Este agendamento não pode ser remarcado.');
    }

    const tenant = await this.repo.getTenantById(appt.tenantId);
    if (!tenant || tenant.status === 'CANCELLED' || tenant.status === 'SUSPENDED') {
      throw new NotFoundException('Estabelecimento não encontrado.');
    }
    const service = await this.repo.getService(tenant.id, appt.serviceId);
    if (!service) throw new NotFoundException('Serviço não encontrado.');

    const startsAt = new Date(startsAtIso);
    const dateStr =
      DateTime.fromJSDate(startsAt).setZone(tenant.timezone).toISODate() ?? '';
    const avail = await this.availability.compute(
      tenant,
      appt.serviceId,
      dateStr,
      appt.professionalId,
      appointmentId, // não conta o próprio agendamento como ocupado
    );
    const offered = avail.professionals
      .find((p) => p.professionalId === appt.professionalId)
      ?.slots.includes(startsAt.toISOString());
    if (!offered) {
      throw new BadRequestException('Horário indisponível. Escolha outro.');
    }

    const endsAt = new Date(
      startsAt.getTime() + service.durationMinutes * 60_000,
    );
    const updated = await this.repo.reschedule(
      tenant.id,
      appointmentId,
      startsAt,
      endsAt,
      undefined,
    );
    if (!updated) throw new NotFoundException('Agendamento não encontrado.');
  }
}
