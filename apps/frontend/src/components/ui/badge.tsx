import {
  AppointmentStatus,
  TenantStatus,
  type AppointmentStatus as AppointmentStatusT,
  type TenantStatus as TenantStatusT,
} from '@repo/shared';

/** Aparência de cada status de agendamento (rótulo + dot + chip). */
export const STATUS_META: Record<
  AppointmentStatusT,
  { label: string; dot: string; pill: string }
> = {
  [AppointmentStatus.PENDING]: {
    label: 'Pendente',
    dot: 'bg-amber-400',
    pill: 'bg-amber-400/10 text-amber-500 ring-1 ring-amber-400/20',
  },
  [AppointmentStatus.CONFIRMED]: {
    label: 'Confirmado',
    dot: 'bg-emerald-400',
    pill: 'bg-emerald-400/10 text-emerald-500 ring-1 ring-emerald-400/20',
  },
  [AppointmentStatus.COMPLETED]: {
    label: 'Concluído',
    dot: 'bg-sky-400',
    pill: 'bg-sky-400/10 text-sky-500 ring-1 ring-sky-400/20',
  },
  [AppointmentStatus.CANCELLED]: {
    label: 'Cancelado',
    dot: 'bg-rose-400',
    pill: 'bg-rose-400/10 text-rose-500 ring-1 ring-rose-400/20',
  },
  [AppointmentStatus.NO_SHOW]: {
    label: 'Não compareceu',
    dot: 'bg-slate-400',
    pill: 'bg-slate-400/10 text-slate-400 ring-1 ring-slate-400/20',
  },
};

/** Chip de status de agendamento com "dot" colorido. */
export function AppointmentBadge({ status }: { status: AppointmentStatusT }) {
  const s = STATUS_META[status];
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${s.pill}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

/** Aparência do status da assinatura do estabelecimento (visão do admin). */
const TENANT_STATUS_META: Record<
  TenantStatusT,
  { label: string; dot: string; pill: string }
> = {
  [TenantStatus.TRIAL]: {
    label: 'Trial',
    dot: 'bg-amber-400',
    pill: 'bg-amber-400/10 text-amber-500 ring-1 ring-amber-400/20',
  },
  [TenantStatus.ACTIVE]: {
    label: 'Ativo',
    dot: 'bg-emerald-400',
    pill: 'bg-emerald-400/10 text-emerald-500 ring-1 ring-emerald-400/20',
  },
  [TenantStatus.SUSPENDED]: {
    label: 'Suspenso',
    dot: 'bg-rose-400',
    pill: 'bg-rose-400/10 text-rose-500 ring-1 ring-rose-400/20',
  },
  [TenantStatus.CANCELLED]: {
    label: 'Cancelado',
    dot: 'bg-slate-400',
    pill: 'bg-slate-400/10 text-slate-400 ring-1 ring-slate-400/20',
  },
};

/** Chip de status da assinatura do estabelecimento. */
export function TenantBadge({ status }: { status: TenantStatusT }) {
  const s = TENANT_STATUS_META[status];
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${s.pill}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

/** Chip de ativo/inativo (usado em serviços e profissionais). */
export function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${
        active
          ? 'bg-emerald-400/10 text-emerald-500 ring-1 ring-emerald-400/20'
          : 'bg-slate-400/10 text-slate-400 ring-1 ring-slate-400/20'
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-emerald-400' : 'bg-slate-400'}`}
      />
      {active ? 'Ativo' : 'Inativo'}
    </span>
  );
}
