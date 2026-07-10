'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { planInfo, UserRole, type PlatformOverviewDto } from '@repo/shared';
import { useAuth } from '../../lib/auth-context';
import { ESTABLISHMENT_LABEL } from '../../lib/labels';
import { Card } from '../../components/ui/card';
import { TenantBadge } from '../../components/ui/badge';
import {
  IconArrowRight,
  IconBuilding,
  IconCalendar,
  IconCheck,
  IconClock,
  IconUser,
} from '../../components/icons';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
function relDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  });
}

export default function AdminOverviewPage() {
  const { user, loading, authFetch } = useAuth();
  const router = useRouter();
  const [overview, setOverview] = useState<PlatformOverviewDto | null>(null);

  const load = useCallback(async () => {
    setOverview(await authFetch<PlatformOverviewDto>('/platform/overview'));
  }, [authFetch]);

  useEffect(() => {
    if (loading) return;
    if (!user) return router.replace('/login');
    if (user.role !== UserRole.SUPER_ADMIN) return router.replace('/');
    void load().catch(() => undefined);
  }, [loading, user, router, load]);

  if (loading || !user || user.role !== UserRole.SUPER_ADMIN) {
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-transparent" />
      </main>
    );
  }

  const s = overview?.subscribers;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6">
      <header className="flex flex-col gap-1">
        <p className="text-sm font-medium text-accent">Plataforma</p>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          Visão geral
        </h1>
        <p className="text-sm text-muted">
          Controle das assinaturas — os estabelecimentos que aderiram à
          plataforma e como estão usando.
        </p>
      </header>

      {/* KPIs de assinatura */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Kpi
          icon={<IconBuilding />}
          tone="primary"
          label="Assinantes"
          value={s?.total}
          hint="estabelecimentos"
        />
        <Kpi
          icon={<IconCheck />}
          tone="emerald"
          label="Ativos"
          value={s?.active}
          hint="assinaturas pagas"
        />
        <Kpi
          icon={<IconClock />}
          tone="amber"
          label="Em trial"
          value={s?.trial}
          hint="a converter"
        />
        <Kpi
          icon={<IconUser />}
          tone="sky"
          label="Novos no mês"
          value={s?.newThisMonth}
          hint="entraram agora"
        />
        <Kpi
          icon={<IconCalendar />}
          tone="violet"
          label="Atividade"
          value={overview?.appointmentsTotal}
          hint="agendamentos na plataforma"
        />
      </div>

      {(s?.suspended || s?.cancelled) ? (
        <p className="-mt-4 text-xs text-muted">
          {s.suspended} suspenso(s) · {s.cancelled} cancelado(s)
        </p>
      ) : null}

      {/* Assinantes */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Assinantes</h2>
          <Link
            href="/admin/estabelecimentos"
            className="flex items-center gap-1 text-sm font-medium text-accent hover:underline"
          >
            Gerenciar assinaturas
            <IconArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                  <Th>Estabelecimento</Th>
                  <Th>Dono</Th>
                  <Th>Assinatura</Th>
                  <Th>Plano</Th>
                  <Th>Assinou em</Th>
                  <Th align="right">Atividade</Th>
                  <Th align="right">Última</Th>
                </tr>
              </thead>
              <tbody>
                {overview === null &&
                  [0, 1, 2].map((i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="px-4 py-3" colSpan={7}>
                        <div className="h-5 w-full animate-pulse rounded bg-surface-2" />
                      </td>
                    </tr>
                  ))}
                {overview?.establishments.map((e) => (
                  <tr
                    key={e.id}
                    className="border-b border-border transition-colors last:border-0 hover:bg-surface-2/60"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-emerald-600 text-xs font-bold text-primary-foreground">
                          {e.name.charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">
                            {e.name}
                          </p>
                          <p className="truncate text-xs text-muted">
                            {ESTABLISHMENT_LABEL[e.establishmentType]}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="truncate text-foreground">
                        {e.ownerName ?? '—'}
                      </p>
                      {e.ownerEmail && (
                        <p className="truncate text-xs text-muted">
                          {e.ownerEmail}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <TenantBadge status={e.status} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-surface-2 px-2 py-0.5 text-xs font-medium text-foreground">
                        {planInfo(e.plan).name}
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-muted">
                      {formatDate(e.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-foreground">
                      {e.appointments}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted">
                      {relDate(e.lastActivityAt)}
                    </td>
                  </tr>
                ))}
                {overview?.establishments.length === 0 && (
                  <tr>
                    <td
                      className="px-4 py-6 text-center text-sm text-muted"
                      colSpan={7}
                    >
                      Nenhum assinante ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
        <p className="text-xs text-muted">
          O admin acompanha as assinaturas e o engajamento. Os clientes de cada
          estabelecimento são geridos pelo próprio dono, no painel dele.
        </p>
      </section>
    </main>
  );
}

const TONE_CLASS: Record<string, string> = {
  primary: 'bg-primary/10 text-primary',
  accent: 'bg-accent/15 text-accent',
  sky: 'bg-sky-400/10 text-sky-500',
  violet: 'bg-violet-400/10 text-violet-500',
  emerald: 'bg-emerald-400/10 text-emerald-500',
  amber: 'bg-amber-400/10 text-amber-500',
};

function Kpi({
  icon,
  tone,
  label,
  value,
  hint,
}: {
  icon: ReactNode;
  tone: keyof typeof TONE_CLASS;
  label: string;
  value: number | string | undefined;
  hint?: string;
}) {
  return (
    <Card className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted">{label}</p>
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-lg [&>svg]:h-4 [&>svg]:w-4 ${TONE_CLASS[tone]}`}
        >
          {icon}
        </span>
      </div>
      <p className="text-2xl font-bold tabular-nums text-foreground">
        {value ?? '—'}
      </p>
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </Card>
  );
}

function Th({
  children,
  align = 'left',
}: {
  children: ReactNode;
  align?: 'left' | 'right';
}) {
  return (
    <th
      className={`px-4 py-3 font-medium ${align === 'right' ? 'text-right' : 'text-left'}`}
    >
      {children}
    </th>
  );
}
