import { z } from 'zod';
import { pricingTypeSchema } from '../enums.js';

// ---------------------------------------------------------------------------
// Serviços (PRD 2.5)
// ---------------------------------------------------------------------------
export const createServiceSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(500).optional(),
  categoryId: z.string().uuid().optional(),
  durationMinutes: z.number().int().min(5).max(600),
  priceCents: z.number().int().min(0),
  pricingType: pricingTypeSchema.default('FIXED'),
  professionalIds: z.array(z.string().uuid()).default([]),
});
export type CreateServiceDto = z.infer<typeof createServiceSchema>;

export const updateServiceSchema = createServiceSchema.partial().extend({
  active: z.boolean().optional(),
});
export type UpdateServiceDto = z.infer<typeof updateServiceSchema>;

export const serviceResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  categoryId: z.string().uuid().nullable(),
  durationMinutes: z.number().int(),
  priceCents: z.number().int(),
  pricingType: pricingTypeSchema,
  active: z.boolean(),
  professionalIds: z.array(z.string().uuid()),
});
export type ServiceResponseDto = z.infer<typeof serviceResponseSchema>;

// ---------------------------------------------------------------------------
// Profissionais (PRD 2.5/2.6)
// ---------------------------------------------------------------------------
export const createProfessionalSchema = z.object({
  name: z.string().min(2).max(120),
  bio: z.string().max(500).optional(),
});
export type CreateProfessionalDto = z.infer<typeof createProfessionalSchema>;

export const updateProfessionalSchema = createProfessionalSchema
  .partial()
  .extend({ active: z.boolean().optional() });
export type UpdateProfessionalDto = z.infer<typeof updateProfessionalSchema>;

/** Um intervalo de jornada num dia (minutos desde 00:00, fuso do tenant). */
export const workingHoursItemSchema = z
  .object({
    weekday: z.number().int().min(0).max(6),
    startMinute: z.number().int().min(0).max(1439),
    endMinute: z.number().int().min(1).max(1440),
  })
  .refine((v) => v.endMinute > v.startMinute, {
    message: 'endMinute deve ser maior que startMinute',
    path: ['endMinute'],
  });

export const setWorkingHoursSchema = z.object({
  items: z.array(workingHoursItemSchema).max(50),
});
export type SetWorkingHoursDto = z.infer<typeof setWorkingHoursSchema>;

export const professionalResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  bio: z.string().nullable(),
  active: z.boolean(),
  workingHours: z.array(
    z.object({
      weekday: z.number().int(),
      startMinute: z.number().int(),
      endMinute: z.number().int(),
    }),
  ),
});
export type ProfessionalResponseDto = z.infer<
  typeof professionalResponseSchema
>;

// ---------------------------------------------------------------------------
// Categorias de serviço (globais, plataforma). PRD 2.7
// ---------------------------------------------------------------------------
export const serviceCategoryResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  icon: z.string().nullable(),
});
export type ServiceCategoryResponseDto = z.infer<
  typeof serviceCategoryResponseSchema
>;
