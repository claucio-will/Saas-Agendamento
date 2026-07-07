import { z } from 'zod';
import { establishmentTypeSchema, tenantStatusSchema } from '../enums.js';

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
