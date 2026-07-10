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

/** Rótulos amigáveis por tipo de estabelecimento (vertical). */
export const ESTABLISHMENT_LABEL: Record<EstablishmentTypeT, string> = {
  [EstablishmentType.BARBERSHOP]: 'Barbearia',
  [EstablishmentType.HAIR_SALON]: 'Salão de cabeleireiro',
  [EstablishmentType.TATTOO_STUDIO]: 'Estúdio de tatuagem',
};
