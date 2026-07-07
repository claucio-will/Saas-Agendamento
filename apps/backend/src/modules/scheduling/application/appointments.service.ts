import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  AppointmentResponseDto,
  AppointmentStatus,
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
