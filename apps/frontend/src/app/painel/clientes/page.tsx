'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { UserRole, type CustomerSummaryDto } from '@repo/shared';
import { useAuth } from '../../../lib/auth-context';
import { Card } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import {
  IconCheck,
  IconUsers,
  IconWallet,
  IconCalendar,
} from '../../../components/icons';

function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function ClientesPage() {
  const { user, loading, authFetch } = useAuth();
  const router = useRouter();
  const [customers, setCustomers] = useState<CustomerSummaryDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    try {
      setCustomers(await authFetch<CustomerSummaryDto[]>('/customers'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar.');
    }
  }, [authFetch]);

  useEffect(() => {
    if (loading) return;
    if (!user) return router.replace('/login');
    if (user.role !== UserRole.TENANT_ADMIN) return router.replace('/');
    void load();
  }, [loading, user, router, load]);

  const stats = useMemo(() => {
    const list = customers ?? [];
    const revenue = list.reduce((s, c) => s + c.totalSpentCents, 0);
    const completed = list.reduce((s, c) => s + c.completedAppointments, 0);
    const returning = list.filter((c) => c.totalAppointments >= 2).length;
    return {
      total: list.length,
      returning,
      revenue,
      avgTicket: completed > 0 ? Math.round(revenue / completed) : 0,
    };
  }, [customers]);

  const filtered = useMemo(() => {
    const list = customers ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q),
    );
  }, [customers, query]);

  if (loading || !user || user.role !== UserRole.TENANT_ADMIN) {
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <span
          aria-label="Carregando"
          className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-transparent"
        />
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6">
      <header className="flex flex-col gap-1">
        <p className="text-sm font-medium text-accent">Painel do dono</p>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          Histórico de clientes
        </h1>
        <p className="text-sm text-muted">
          Quem já passou pelo seu estabelecimento, com os atendimentos e o gasto
          aqui. Um mesmo cliente pode atender em vários lugares — esta é a parte
          que passou por você.
        </p>
      </header>

      {error && <p className="text-sm text-danger">{error}</p>}

      {/* Resumo */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi
          icon={<IconUsers />}
          tone="primary"
          label="Clientes"
          value={customers ? stats.total : undefined}
          hint="já passaram aqui"
        />
        <Kpi
          icon={<IconCheck />}
          tone="emerald"
          label="Recorrentes"
          value={customers ? stats.returning : undefined}
          hint="voltaram 2+ vezes"
        />
        <Kpi
          icon={<IconWallet />}
          tone="accent"
          label="Faturamento"
          value={customers ? formatBRL(stats.revenue) : undefined}
          hint="atendimentos concluídos"
        />
        <Kpi
          icon={<IconCalendar />}
          tone="sky"
          label="Ticket médio"
          value={customers ? formatBRL(stats.avgTicket) : undefined}
          hint="por atendimento"
        />
      </div>

      {/* Busca */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Input
          placeholder="Buscar por nome ou e-mail…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-sm"
        />
        {customers && (
          <p className="text-sm text-muted">
            <span className="font-semibold tabular-nums text-foreground">
              {filtered.length}
            </span>{' '}
            de {stats.total}
          </p>
        )}
      </div>

      {/* Tabela */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <Th>Cliente</Th>
                <Th align="right">Agend.</Th>
                <Th align="right">Concluídos</Th>
                <Th align="right">Gasto</Th>
                <Th align="right">Última visita</Th>
              </tr>
            </thead>
            <tbody>
              {customers === null &&
                [0, 1, 2, 3].map((i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="px-4 py-3" colSpan={5}>
                      <div className="h-5 w-full animate-pulse rounded bg-surface-2" />
                    </td>
                  </tr>
                ))}
              {filtered.map((c) => (
                <tr
                  key={c.email}
                  className="border-b border-border transition-colors last:border-0 hover:bg-surface-2/60"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-emerald-600 text-xs font-bold text-primary-foreground">
                        {c.name.charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">
                          {c.name}
                        </p>
                        <p className="truncate text-xs text-muted">
                          {c.email}
                          {c.phone ? ` · ${c.phone}` : ''}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-foreground">
                    {c.totalAppointments}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-foreground">
                    {c.completedAppointments}
                  </td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums text-foreground">
                    {formatBRL(c.totalSpentCents)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted">
                    {formatDate(c.lastVisit)}
                  </td>
                </tr>
              ))}
              {customers && filtered.length === 0 && (
                <tr>
                  <td
                    className="px-4 py-8 text-center text-sm text-muted"
                    colSpan={5}
                  >
                    {stats.total === 0
                      ? 'Ninguém passou pelo seu estabelecimento ainda. Os clientes aparecem aqui após o primeiro agendamento.'
                      : 'Nenhum cliente encontrado.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </main>
  );
}

const TONE_CLASS: Record<string, string> = {
  primary: 'bg-primary/10 text-primary',
  emerald: 'bg-emerald-400/10 text-emerald-500',
  accent: 'bg-accent/15 text-accent',
  sky: 'bg-sky-400/10 text-sky-500',
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
