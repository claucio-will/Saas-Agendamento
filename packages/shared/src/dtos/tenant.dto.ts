import { z } from 'zod';
import {
  establishmentTypeSchema,
  planTierSchema,
  tenantStatusSchema,
} from '../enums.js';

/**
 * DTO de criação de tenant (onboarding self-service). Ver PRD 2.1.
 * `slug` é usado na página pública (/b/<slug>). Campos por tipo entram na Etapa 1.1.
 */
export const createTenantSchema = z.object({
  name: z.string().min(2).max(120),
  slug: z
    .string()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
      message: 'slug deve conter apenas letras minúsculas, números e hífens',
    }),
  establishmentType: establishmentTypeSchema,
  documentId: z.string().min(11).max(18).optional(), // CNPJ/CPF
  phone: z.string().min(8).max(20).optional(),
});
export type CreateTenantDto = z.infer<typeof createTenantSchema>;

/** Atualização de status do tenant pelo Super Admin (ativar/suspender/cancelar). */
export const updateTenantStatusSchema = z.object({
  status: tenantStatusSchema,
});
export type UpdateTenantStatusDto = z.infer<typeof updateTenantStatusSchema>;

/** Representação de tenant retornada pela API. */
export const tenantResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  establishmentType: establishmentTypeSchema,
  status: tenantStatusSchema,
  createdAt: z.string().datetime(),
});
export type TenantResponseDto = z.infer<typeof tenantResponseSchema>;

/** Estabelecimento do dono logado, com dados editáveis (tela de configurações). */
export const myTenantResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  establishmentType: establishmentTypeSchema,
  status: tenantStatusSchema,
  // Assinatura (PRD 2.13).
  plan: planTierSchema,
  trialEndsAt: z.string().nullable(),
  subscribedAt: z.string().nullable(),
  documentId: z.string().nullable(),
  phone: z.string().nullable(),
  timezone: z.string(),
  addressLine: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  postalCode: z.string().nullable(),
  // Regras de agendamento (PRD 2.5).
  minAdvanceMinutes: z.number().int(),
  maxAdvanceDays: z.number().int(),
  slotIntervalMinutes: z.number().int(),
});
export type MyTenantResponseDto = z.infer<typeof myTenantResponseSchema>;

/** Campos que o dono pode alterar do próprio estabelecimento. */
export const updateMyTenantSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  phone: z.string().min(8).max(20).nullable().optional(),
  addressLine: z.string().max(160).nullable().optional(),
  city: z.string().max(80).nullable().optional(),
  state: z.string().max(40).nullable().optional(),
  postalCode: z.string().max(12).nullable().optional(),
  timezone: z.string().min(1).max(60).optional(),
  minAdvanceMinutes: z.number().int().min(0).max(10080).optional(),
  maxAdvanceDays: z.number().int().min(1).max(365).optional(),
  slotIntervalMinutes: z.number().int().min(5).max(120).optional(),
});
export type UpdateMyTenantDto = z.infer<typeof updateMyTenantSchema>;

/** Ativação simulada da assinatura (checkout fake — sem gateway). */
export const activateSubscriptionSchema = z.object({
  plan: planTierSchema.optional(),
});
export type ActivateSubscriptionDto = z.infer<
  typeof activateSubscriptionSchema
>;

/** Troca de plano (upgrade/downgrade) pelo dono. */
export const changePlanSchema = z.object({ plan: planTierSchema });
export type ChangePlanDto = z.infer<typeof changePlanSchema>;

// ---------------------------------------------------------------------------
// Dashboard do Super Admin — controle das ASSINATURAS da plataforma. O admin
// gerencia os assinantes (donos/estabelecimentos), não os clientes finais de
// cada dono. Ver PRD 2.4.
// ---------------------------------------------------------------------------

/** Um assinante (estabelecimento + dono) na visão consolidada do admin. */
export const platformSubscriberSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  establishmentType: establishmentTypeSchema,
  status: tenantStatusSchema,
  plan: planTierSchema,
  trialEndsAt: z.string().nullable(),
  ownerName: z.string().nullable(),
  ownerEmail: z.string().nullable(),
  createdAt: z.string(), // assinou em
  appointments: z.number().int(), // atividade/engajamento
  lastActivityAt: z.string().nullable(), // último agendamento
});
export type PlatformSubscriberDto = z.infer<typeof platformSubscriberSchema>;

/** Visão geral da plataforma: assinaturas + engajamento. */
export const platformOverviewSchema = z.object({
  subscribers: z.object({
    total: z.number().int(),
    active: z.number().int(),
    trial: z.number().int(),
    suspended: z.number().int(),
    cancelled: z.number().int(),
    newThisMonth: z.number().int(),
  }),
  appointmentsTotal: z.number().int(),
  establishments: z.array(platformSubscriberSchema),
});
export type PlatformOverviewDto = z.infer<typeof platformOverviewSchema>;

/**
 * Dono de estabelecimento na visão do Super Admin — o "cliente" da plataforma,
 * com o estabelecimento que ele administra. Ver PRD 2.4.
 */
export const platformOwnerResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  createdAt: z.string(),
  tenant: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
      slug: z.string(),
      status: tenantStatusSchema,
      establishmentType: establishmentTypeSchema,
    })
    .nullable(),
});
export type PlatformOwnerDto = z.infer<typeof platformOwnerResponseSchema>;
