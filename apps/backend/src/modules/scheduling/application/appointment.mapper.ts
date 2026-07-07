import type { AppointmentResponseDto } from '@repo/shared';

/** Linha de agendamento com nomes de serviço/profissional inclusos. */
export interface AppointmentRow {
  id: string;
  serviceId: string;
  professionalId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  startsAt: Date;
  endsAt: Date;
  status: AppointmentResponseDto['status'];
  priceCents: number;
  notes: string | null;
  service: { name: string };
  professional: { name: string };
}

export function toAppointmentDto(row: AppointmentRow): AppointmentResponseDto {
  return {
    id: row.id,
    serviceId: row.serviceId,
    serviceName: row.service.name,
    professionalId: row.professionalId,
    professionalName: row.professional.name,
    customerName: row.customerName,
    customerEmail: row.customerEmail,
    customerPhone: row.customerPhone,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt.toISOString(),
    status: row.status,
    priceCents: row.priceCents,
    notes: row.notes,
  };
}
