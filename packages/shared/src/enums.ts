import { z } from 'zod';

/**
 * Papéis de acesso (RBAC). Todo JWT carrega o papel; todos exceto SUPER_ADMIN
 * carregam também o `tenantId`. Ver PRD 2.2.
 */
export const UserRole = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  TENANT_ADMIN: 'TENANT_ADMIN',
  PROFESSIONAL: 'PROFESSIONAL',
  CUSTOMER: 'CUSTOMER',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];
export const userRoleSchema = z.enum([
  UserRole.SUPER_ADMIN,
  UserRole.TENANT_ADMIN,
  UserRole.PROFESSIONAL,
  UserRole.CUSTOMER,
]);

/**
 * Tipo de estabelecimento (vertical). Modelado como enum extensível — novos
 * verticais (estética, podologia) entram aqui sem mudança estrutural. Ver PRD 2.1.
 */
export const EstablishmentType = {
  BARBERSHOP: 'BARBERSHOP',
  HAIR_SALON: 'HAIR_SALON',
  TATTOO_STUDIO: 'TATTOO_STUDIO',
} as const;
export type EstablishmentType =
  (typeof EstablishmentType)[keyof typeof EstablishmentType];
export const establishmentTypeSchema = z.enum([
  EstablishmentType.BARBERSHOP,
  EstablishmentType.HAIR_SALON,
  EstablishmentType.TATTOO_STUDIO,
]);

/** Plano de assinatura do estabelecimento. Preços/recursos em `plans.ts`. */
export const PlanTier = {
  ESSENCIAL: 'ESSENCIAL',
  PROFISSIONAL: 'PROFISSIONAL',
  STUDIO: 'STUDIO',
} as const;
export type PlanTier = (typeof PlanTier)[keyof typeof PlanTier];
export const planTierSchema = z.enum([
  PlanTier.ESSENCIAL,
  PlanTier.PROFISSIONAL,
  PlanTier.STUDIO,
]);

/** Modelo de precificação do serviço. Ver PRD 2.1. */
export const PricingType = {
  FIXED: 'FIXED',
  STARTING_AT: 'STARTING_AT',
  QUOTE: 'QUOTE',
} as const;
export type PricingType = (typeof PricingType)[keyof typeof PricingType];
export const pricingTypeSchema = z.enum([
  PricingType.FIXED,
  PricingType.STARTING_AT,
  PricingType.QUOTE,
]);

/** Ciclo de vida da assinatura do tenant. Ver PRD 2.13. */
export const TenantStatus = {
  TRIAL: 'TRIAL',
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  CANCELLED: 'CANCELLED',
} as const;
export type TenantStatus = (typeof TenantStatus)[keyof typeof TenantStatus];
export const tenantStatusSchema = z.enum([
  TenantStatus.TRIAL,
  TenantStatus.ACTIVE,
  TenantStatus.SUSPENDED,
  TenantStatus.CANCELLED,
]);

/** Estados do agendamento. Ver PRD 2.9. */
export const AppointmentStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  NO_SHOW: 'NO_SHOW',
} as const;
export type AppointmentStatus =
  (typeof AppointmentStatus)[keyof typeof AppointmentStatus];
export const appointmentStatusSchema = z.enum([
  AppointmentStatus.PENDING,
  AppointmentStatus.CONFIRMED,
  AppointmentStatus.COMPLETED,
  AppointmentStatus.CANCELLED,
  AppointmentStatus.NO_SHOW,
]);
