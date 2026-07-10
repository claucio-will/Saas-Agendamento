import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  AppointmentResponseDto,
  AppointmentStatus,
  CreateManualAppointmentDto,
  CustomerAppointmentDto,
  CustomerSummaryDto,
  RescheduleAppointmentDto,
} from '@repo/shared';
import { DateTime } from 'luxon';
import { SchedulingRepository } from '../infrastructure/scheduling.repository';
import { toAppointmentDto, type AppointmentRow } from './appointment.mapper';

/** Gestão da agenda pelo dono/profissional. Ver PRD 2.5/2.6/2.9. */
@Injectable()
export class AppointmentsService {
  constructor(private readonly repo: SchedulingRepository) {}

  async listByDay(
    tenantId: string,
    date: string,
    professionalId?: string,
  ): Promise<AppointmentResponseDto[]> {
    const tenant = await this.repo.getTenantById(tenantId);
    const tz = tenant?.timezone ?? 'America/Sao_Paulo';
    const day = DateTime.fromISO(date, { zone: tz }).startOf('day');
    const from = day.toUTC().toJSDate();
    const to = day.plus({ days: 1 }).toUTC().toJSDate();
    const rows = await this.repo.listAppointments(
      tenantId,
      from,
      to,
      professionalId,
    );
    return rows.map((r) => toAppointmentDto(r as AppointmentRow));
  }

  /** Histórico de agendamentos do cliente (entre estabelecimentos). */
  async listForCustomer(customerId: string): Promise<CustomerAppointmentDto[]> {
    const rows = await this.repo.listCustomerAppointments(customerId);
    return rows.map((r) => ({
      id: r.id,
      establishmentName: r.establishmentName,
      establishmentSlug: r.establishmentSlug,
      serviceId: r.serviceId,
      serviceName: r.serviceName,
      professionalId: r.professionalId,
      professionalName: r.professionalName,
      startsAt: r.startsAt.toISOString(),
      endsAt: r.endsAt.toISOString(),
      status: r.status,
      priceCents: r.priceCents,
    }));
  }

  async listCustomers(tenantId: string): Promise<CustomerSummaryDto[]> {
    const rows = await this.repo.listCustomers(tenantId);
    return rows.map((c) => ({
      name: c.name,
      email: c.email,
      phone: c.phone,
      totalAppointments: c.totalAppointments,
      completedAppointments: c.completedAppointments,
      totalSpentCents: c.totalSpentCents,
      lastVisit: c.lastVisit.toISOString(),
    }));
  }

  /**
   * Cria um agendamento manual (encaixe/walk-in/telefone) pelo dono. Diferente
   * do fluxo público, o horário não precisa estar na grade de slots ofertados —
   * a constraint `appointments_no_overlap` do banco impede o overbooking.
   */
  async createManual(
    tenantId: string,
    dto: CreateManualAppointmentDto,
  ): Promise<AppointmentResponseDto> {
    const service = await this.repo.getService(tenantId, dto.serviceId);
    if (!service) throw new NotFoundException('Serviço não encontrado.');

    const pros = await this.repo.getProfessionalsForService(
      tenantId,
      dto.serviceId,
    );
    if (!pros.some((p) => p.id === dto.professionalId)) {
      throw new BadRequestException('Profissional não realiza este serviço.');
    }

    const startsAt = new Date(dto.startsAt);
    if (Number.isNaN(startsAt.getTime())) {
      throw new BadRequestException('Horário inválido.');
    }
    const endsAt = new Date(
      startsAt.getTime() + service.durationMinutes * 60_000,
    );

    const { id } = await this.repo.createAppointment(tenantId, {
      serviceId: dto.serviceId,
      professionalId: dto.professionalId,
      customerId: null,
      customerName: dto.customerName,
      // Dono nem sempre tem e-mail do cliente de encaixe; usa placeholder.
      customerEmail: dto.customerEmail ?? 'sem-email@local',
      customerPhone: dto.customerPhone ?? null,
      startsAt,
      endsAt,
      priceCents: service.priceCents,
      notes: dto.notes ?? null,
      status: dto.status,
    });

    return this.load(tenantId, id);
  }

  async updateStatus(
    tenantId: string,
    id: string,
    status: AppointmentStatus,
  ): Promise<AppointmentResponseDto> {
    const updated = await this.repo.updateStatus(tenantId, id, status);
    if (!updated) throw new NotFoundException('Agendamento não encontrado.');
    return this.load(tenantId, id);
  }

  async cancel(
    tenantId: string,
    id: string,
    reason: string | null,
  ): Promise<AppointmentResponseDto> {
    const updated = await this.repo.cancel(tenantId, id, reason);
    if (!updated) throw new NotFoundException('Agendamento não encontrado.');
    return this.load(tenantId, id);
  }

  async reschedule(
    tenantId: string,
    id: string,
    dto: RescheduleAppointmentDto,
  ): Promise<AppointmentResponseDto> {
    const current = await this.repo.getAppointment(tenantId, id);
    if (!current) throw new NotFoundException('Agendamento não encontrado.');
    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(
      startsAt.getTime() + current.service.durationMinutes * 60_000,
    );
    const updated = await this.repo.reschedule(
      tenantId,
      id,
      startsAt,
      endsAt,
      dto.professionalId,
    );
    if (!updated) throw new NotFoundException('Agendamento não encontrado.');
    return this.load(tenantId, id);
  }

  private async load(
    tenantId: string,
    id: string,
  ): Promise<AppointmentResponseDto> {
    const row = await this.repo.getAppointment(tenantId, id);
    if (!row) throw new NotFoundException('Agendamento não encontrado.');
    return toAppointmentDto(row as AppointmentRow);
  }
}
