import { z } from 'zod';
import {
  appointmentStatusSchema,
  establishmentTypeSchema,
  pricingTypeSchema,
} from '../enums.js';

// ---------------------------------------------------------------------------
// Descoberta pública de estabelecimentos (home) — PRD 2.7
// ---------------------------------------------------------------------------
export const publicEstablishmentResponseSchema = z.object({
  name: z.string(),
  slug: z.string(),
  establishmentType: establishmentTypeSchema,
  city: z.string().nullable(),
});
export type PublicEstablishmentDto = z.infer<
  typeof publicEstablishmentResponseSchema
>;

// ---------------------------------------------------------------------------
// Perfil público do estabelecimento (por slug) — PRD 2.7/2.8
// ---------------------------------------------------------------------------
export const publicProfileResponseSchema = z.object({
  name: z.string(),
  slug: z.string(),
  establishmentType: establishmentTypeSchema,
  phone: z.string().nullable(),
  addressLine: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  ratingAverage: z.number(),
  ratingCount: z.number().int(),
  professionals: z.array(
    z.object({
      id: z.string().uuid(),
      name: z.string(),
      bio: z.string().nullable(),
    }),
  ),
  services: z.array(
    z.object({
      id: z.string().uuid(),
      name: z.string(),
      description: z.string().nullable(),
      durationMinutes: z.number().int(),
      priceCents: z.number().int(),
      pricingType: pricingTypeSchema,
      professionals: z.array(
        z.object({ id: z.string().uuid(), name: z.string() }),
      ),
    }),
  ),
});
export type PublicProfileResponseDto = z.infer<
  typeof publicProfileResponseSchema
>;

// ---------------------------------------------------------------------------
// Disponibilidade (PRD 2.9) — cálculo de slots livres
// ---------------------------------------------------------------------------
export const availabilityResponseSchema = z.object({
  serviceId: z.string().uuid(),
  date: z.string(), // YYYY-MM-DD
  professionals: z.array(
    z.object({
      professionalId: z.string().uuid(),
      professionalName: z.string(),
      slots: z.array(z.string()), // ISO datetimes
    }),
  ),
});
export type AvailabilityResponseDto = z.infer<
  typeof availabilityResponseSchema
>;

// ---------------------------------------------------------------------------
// Agendamento (PRD 2.8/2.9)
// ---------------------------------------------------------------------------
export const createAppointmentSchema = z.object({
  serviceId: z.string().uuid(),
  professionalId: z.string().uuid(),
  startsAt: z.string().datetime(), // ISO
  notes: z.string().max(500).optional(),
  // Usados quando o cliente não está logado (contato de contato mínimo).
  customerName: z.string().min(2).max(120).optional(),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().min(8).max(20).optional(),
});
export type CreateAppointmentDto = z.infer<typeof createAppointmentSchema>;

export const appointmentResponseSchema = z.object({
  id: z.string().uuid(),
  serviceId: z.string().uuid(),
  serviceName: z.string(),
  professionalId: z.string().uuid(),
  professionalName: z.string(),
  customerName: z.string(),
  customerEmail: z.string(),
  customerPhone: z.string().nullable(),
  startsAt: z.string(),
  endsAt: z.string(),
  status: appointmentStatusSchema,
  priceCents: z.number().int(),
  notes: z.string().nullable(),
});
export type AppointmentResponseDto = z.infer<typeof appointmentResponseSchema>;

/** Item do histórico do cliente (agendamentos entre estabelecimentos). */
export const customerAppointmentResponseSchema = z.object({
  id: z.string().uuid(),
  establishmentName: z.string(),
  establishmentSlug: z.string(),
  serviceId: z.string().uuid(),
  serviceName: z.string(),
  professionalId: z.string().uuid(),
  professionalName: z.string(),
  startsAt: z.string(),
  endsAt: z.string(),
  status: appointmentStatusSchema,
  priceCents: z.number().int(),
});
export type CustomerAppointmentDto = z.infer<
  typeof customerAppointmentResponseSchema
>;

/**
 * Agendamento criado manualmente pelo dono (encaixe/walk-in/telefone). Ao
 * contrário do fluxo público, o horário pode ser fora da grade de slots — o
 * banco (constraint `appointments_no_overlap`) é quem garante o não-overbooking.
 */
export const createManualAppointmentSchema = z.object({
  serviceId: z.string().uuid(),
  professionalId: z.string().uuid(),
  startsAt: z.string().datetime(), // ISO
  customerName: z.string().min(2).max(120),
  customerPhone: z.string().min(8).max(20).optional(),
  customerEmail: z.string().email().optional(),
  notes: z.string().max(500).optional(),
  // Dono normalmente já lança confirmado; aceita PENDING/CONFIRMED.
  status: z
    .enum([appointmentStatusSchema.enum.PENDING, appointmentStatusSchema.enum.CONFIRMED])
    .default('CONFIRMED'),
});
export type CreateManualAppointmentDto = z.infer<
  typeof createManualAppointmentSchema
>;

export const updateAppointmentStatusSchema = z.object({
  status: appointmentStatusSchema,
});
export type UpdateAppointmentStatusDto = z.infer<
  typeof updateAppointmentStatusSchema
>;

export const rescheduleAppointmentSchema = z.object({
  startsAt: z.string().datetime(),
  professionalId: z.string().uuid().optional(),
  reason: z.string().max(300).optional(),
});
export type RescheduleAppointmentDto = z.infer<
  typeof rescheduleAppointmentSchema
>;

export const cancelAppointmentSchema = z.object({
  reason: z.string().max(300).optional(),
});
export type CancelAppointmentDto = z.infer<typeof cancelAppointmentSchema>;

// ---------------------------------------------------------------------------
// Avaliações do estabelecimento (PRD 2.11) — cliente que já foi atendido
// ---------------------------------------------------------------------------
export const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});
export type CreateReviewDto = z.infer<typeof createReviewSchema>;

export const reviewResponseSchema = z.object({
  id: z.string().uuid(),
  customerName: z.string(),
  rating: z.number().int(),
  comment: z.string().nullable(),
  createdAt: z.string(),
});
export type ReviewResponseDto = z.infer<typeof reviewResponseSchema>;

export const reviewsResponseSchema = z.object({
  average: z.number(),
  count: z.number().int(),
  items: z.array(reviewResponseSchema),
});
export type ReviewsResponseDto = z.infer<typeof reviewsResponseSchema>;

// ---------------------------------------------------------------------------
// Clientes do estabelecimento (agregados dos agendamentos) — visão do dono
// ---------------------------------------------------------------------------
export const customerSummaryResponseSchema = z.object({
  name: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  totalAppointments: z.number().int(),
  completedAppointments: z.number().int(),
  totalSpentCents: z.number().int(),
  lastVisit: z.string(), // ISO do último agendamento
});
export type CustomerSummaryDto = z.infer<typeof customerSummaryResponseSchema>;
