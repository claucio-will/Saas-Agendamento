import { z } from 'zod';
import { EstablishmentType, planTierSchema } from '../enums.js';
import { authResponseSchema } from './auth.dto.js';
import { tenantResponseSchema } from './tenant.dto.js';

/** Versão vigente dos Termos de Uso / contrato aceitos no onboarding. Ver PRD 3.4. */
export const CURRENT_TERMS_VERSION = '2026-07-01';

const addressSchema = z.object({
  addressLine: z.string().min(3).max(160),
  city: z.string().min(2).max(80),
  state: z.string().min(2).max(40),
  postalCode: z.string().min(5).max(12),
});

const ownerSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

const slugSchema = z
  .string()
  .min(2)
  .max(60)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Use apenas letras minúsculas, números e hífens.',
  });

const acceptTermsSchema = z.literal(true, {
  errorMap: () => ({ message: 'É necessário aceitar os termos.' }),
});

// Campos comuns a todos os verticais (PRD 2.1).
const baseFields = {
  tenantName: z.string().min(2).max(120),
  slug: slugSchema,
  documentId: z.string().min(11).max(18), // CNPJ/CPF
  phone: z.string().min(8).max(20),
  address: addressSchema,
  owner: ownerSchema,
  // Plano escolhido no onboarding — inicia em trial (sem cobrança). Ver PRD 2.13.
  plan: planTierSchema,
  acceptTerms: acceptTermsSchema,
};

/**
 * Formulário dinâmico com campos por tipo de estabelecimento (união
 * discriminada por `establishmentType`). Ver PRD 2.1 — modelo extensível:
 * novos verticais entram como mais um membro da união.
 */
export const onboardingSchema = z.discriminatedUnion('establishmentType', [
  z.object({
    establishmentType: z.literal(EstablishmentType.BARBERSHOP),
    ...baseFields,
  }),
  z.object({
    establishmentType: z.literal(EstablishmentType.HAIR_SALON),
    // Salão: ficha de coloração/química.
    offersChemicalServices: z.boolean().default(false),
    ...baseFields,
  }),
  z.object({
    establishmentType: z.literal(EstablishmentType.TATTOO_STUDIO),
    // Estúdio: termo de consentimento e sinal/depósito.
    consentFormRequired: z.boolean().default(true),
    requiresDeposit: z.boolean().default(false),
    ...baseFields,
  }),
]);
export type OnboardingDto = z.infer<typeof onboardingSchema>;

/** Resposta do onboarding: estabelecimento criado + auto-login do dono. */
export const onboardingResponseSchema = authResponseSchema.extend({
  tenant: tenantResponseSchema,
});
export type OnboardingResponseDto = z.infer<typeof onboardingResponseSchema>;
