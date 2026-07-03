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
