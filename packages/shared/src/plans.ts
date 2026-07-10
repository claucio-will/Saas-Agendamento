import { PlanTier } from './enums.js';

/** Dias de teste grátis ao criar o estabelecimento. */
export const TRIAL_DAYS = 14;

export interface PlanInfo {
  tier: PlanTier;
  name: string;
  /** Preço mensal em centavos. */
  priceCents: number;
  tagline: string;
  features: string[];
  /** Plano em destaque na comparação. */
  highlight?: boolean;
}

/**
 * Catálogo de planos da plataforma — fonte única usada pelo onboarding, pela
 * tela de assinatura do dono e pela visão do admin. Recursos são descritivos
 * (ainda não há enforcement por plano).
 */
export const PLANS: PlanInfo[] = [
  {
    tier: PlanTier.ESSENCIAL,
    name: 'Essencial',
    priceCents: 4900,
    tagline: 'Para começar a receber agendamentos online.',
    features: [
      '1 profissional',
      'Agenda e página pública',
      'Agendamentos ilimitados',
    ],
  },
  {
    tier: PlanTier.PROFISSIONAL,
    name: 'Profissional',
    priceCents: 9900,
    tagline: 'Para equipes que querem crescer.',
    highlight: true,
    features: [
      'Até 5 profissionais',
      'Avaliações e folgas/bloqueios',
      'Clientes e faturamento',
      'Agendamento manual (encaixe)',
    ],
  },
  {
    tier: PlanTier.STUDIO,
    name: 'Studio',
    priceCents: 19900,
    tagline: 'Para estúdios e salões grandes.',
    features: [
      'Profissionais ilimitados',
      'Tudo do Profissional',
      'Relatórios avançados',
      'Suporte prioritário',
    ],
  },
];

/** Busca as infos de um plano pelo tier. */
export function planInfo(tier: PlanTier): PlanInfo {
  return PLANS.find((p) => p.tier === tier) ?? PLANS[0]!;
}
