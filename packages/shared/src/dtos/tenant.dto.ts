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
