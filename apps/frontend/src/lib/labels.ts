import {
  EstablishmentType,
  TenantStatus,
  type EstablishmentType as EstablishmentTypeT,
  type TenantStatus as TenantStatusT,
} from '@repo/shared';

/** Rótulos e cores de status do estabelecimento (assinatura). */
export const STATUS_LABEL: Record<TenantStatusT, string> = {
  [TenantStatus.TRIAL]: 'Trial',
  [TenantStatus.ACTIVE]: 'Ativo',
  [TenantStatus.SUSPENDED]: 'Suspenso',
  [TenantStatus.CANCELLED]: 'Cancelado',
};

export const STATUS_COLOR: Record<TenantStatusT, string> = {
  [TenantStatus.TRIAL]: 'bg-accent/20 text-accent',
  [TenantStatus.ACTIVE]: 'bg-green-500/15 text-green-600',
  [TenantStatus.SUSPENDED]: 'bg-red-500/15 text-red-500',
  [TenantStatus.CANCELLED]: 'bg-muted/20 text-muted',
};

/** Rótulos amigáveis por tipo de estabelecimento (vertical). */
export const ESTABLISHMENT_LABEL: Record<EstablishmentTypeT, string> = {
  [EstablishmentType.BARBERSHOP]: 'Barbearia',
  [EstablishmentType.HAIR_SALON]: 'Salão de cabeleireiro',
  [EstablishmentType.TATTOO_STUDIO]: 'Estúdio de tatuagem',
};
