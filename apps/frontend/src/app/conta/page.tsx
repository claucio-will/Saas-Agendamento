'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AppointmentStatus,
  UserRole,
  type AppointmentStatus as AppointmentStatusT,
  type AuthUserDto,
  type AvailabilityResponseDto,
  type CustomerAppointmentDto,
} from '@repo/shared';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { homePathForRole } from '../../lib/routes';
import { Button } from '../../components/ui/button';
import { Card, CardDescription, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import {
  IconArrowLeft,
  IconArrowRight,
  IconCalendar,
  IconClock,
  IconMapPin,
  IconScissors,
} from '../../components/icons';

type AuthFetch = <T>(
  path: string,
  opts?: { method?: string; body?: unknown },
) => Promise<T>;

const ACTIVE: AppointmentStatusT[] = [
  AppointmentStatus.PENDING,
  AppointmentStatus.CONFIRMED,
];

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}
function hhmm(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}
function longDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  });
}

const ROLE_LABELS: Record<AuthUserDto['role'], string> = {
  [UserRole.SUPER_ADMIN]: 'Administrador da plataforma',
  [UserRole.TENANT_ADMIN]: 'Dono de estabelecimento',
  [UserRole.PROFESSIONAL]: 'Profissional',
  [UserRole.CUSTOMER]: 'Cliente',
};

/** Aparência de cada status: rótulo + cor do "dot" + estilo do chip. */
const STATUS: Record<
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

function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export default function ContaPage() {
  const { user, loading, logout, authFetch } = useAuth();
  const router = useRouter();
  const [appointments, setAppointments] = useState<
    CustomerAppointmentDto[] | null
  >(null);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  const loadAppointments = useCallback(async () => {
    try {
      setAppointments(
        await authFetch<CustomerAppointmentDto[]>('/me/appointments'),
      );
    } catch {
      setAppointments([]);
    }
  }, [authFetch]);

  useEffect(() => {
    if (user?.role === UserRole.CUSTOMER) void loadAppointments();
  }, [user, loadAppointments]);

  // Separa próximos (ativos e futuros) de histórico.
  const { upcoming, history } = useMemo(() => {
    const up: CustomerAppointmentDto[] = [];
    const hist: CustomerAppointmentDto[] = [];
    const now = Date.now();
    for (const a of appointments ?? []) {
      if (ACTIVE.includes(a.status) && new Date(a.startsAt).getTime() > now)
        up.push(a);
      else hist.push(a);
    }
    up.sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt));
    return { upcoming: up, history: hist };
  }, [appointments]);

  if (loading || !user) {
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <span
          aria-label="Carregando"
          className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-transparent"
        />
      </main>
    );
  }

  const firstName = user.name.split(' ')[0];
  const isCustomer = user.role === UserRole.CUSTOMER;
  const totalDone =
    appointments?.filter((a) => a.status === AppointmentStatus.COMPLETED)
      .length ?? 0;
  const totalUpcoming = upcoming.length;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <Link
        href="/"
        className="flex w-fit items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
      >
        <IconArrowLeft className="h-4 w-4" />
        Início
      </Link>

      {/* Cabeçalho de perfil — largura total */}
      <header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-emerald-600 text-xl font-bold text-primary-foreground shadow-glow">
            {firstName?.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-extrabold tracking-tight text-foreground">
              Olá, {firstName} 👋
            </h1>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm text-muted">
              <span className="truncate">{user.email}</span>
              <span className="inline-flex items-center rounded-full bg-surface-2 px-2 py-0.5 text-xs font-medium text-muted">
                {ROLE_LABELS[user.role]}
              </span>
            </p>
          </div>
        </div>
        {isCustomer && (
          <div className="flex gap-3">
            <MiniStat value={totalUpcoming} label="Próximos" />
            <MiniStat value={totalDone} label="Concluídos" />
          </div>
        )}
      </header>

      {isCustomer ? (
        <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
          {/* Coluna principal — agendamentos */}
          <section className="order-2 flex flex-col gap-5 lg:order-1 lg:col-span-2">
            <h2 className="text-lg font-bold text-foreground">
              Meus agendamentos
            </h2>

            {appointments === null ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {[0, 1].map((i) => (
                  <div
                    key={i}
                    className="h-32 animate-pulse rounded-[var(--radius-card)] bg-surface-2"
                  />
                ))}
              </div>
            ) : appointments.length === 0 ? (
              <Card className="flex flex-col items-center gap-3 py-12 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-2 text-muted">
                  <IconCalendar className="h-6 w-6" />
                </span>
                <p className="text-sm font-medium text-foreground">
                  Você ainda não tem agendamentos
                </p>
                <p className="max-w-xs text-sm text-muted">
                  Explore os estabelecimentos e marque seu primeiro horário.
                </p>
                <Link href="/#estabelecimentos" className="mt-1">
                  <Button size="sm">Explorar estabelecimentos</Button>
                </Link>
              </Card>
            ) : (
              <div className="flex flex-col gap-8">
                {/* Próximos — cards ricos e acionáveis (o foco) */}
                <div className="flex flex-col gap-3">
                  <SectionHeader
                    tone="primary"
                    label="Próximos"
                    count={upcoming.length}
                    hint="remarque ou cancele quando precisar"
                  />
                  {upcoming.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {upcoming.map((a) => (
                        <AppointmentItem
                          key={a.id}
                          appointment={a}
                          authFetch={authFetch}
                          onChanged={loadAppointments}
                        />
                      ))}
                    </div>
                  ) : (
                    <Card className="flex items-center gap-3 border-dashed py-5 text-sm text-muted">
                      <IconCalendar className="h-5 w-5 shrink-0" />
                      Nenhum agendamento futuro.{' '}
                      <Link
                        href="/#estabelecimentos"
                        className="font-medium text-accent hover:underline"
                      >
                        Marcar um horário
                      </Link>
                    </Card>
                  )}
                </div>

                {/* Histórico — lista compacta e discreta (só leitura) */}
                {history.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <SectionHeader
                      tone="muted"
                      label="Histórico"
                      count={history.length}
                      hint="atendimentos passados"
                    />
                    <Card className="divide-y divide-border p-0">
                      {history.map((a) => (
                        <HistoryRow key={a.id} appointment={a} />
                      ))}
                    </Card>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Sidebar — CTA + dados da conta (sticky no desktop) */}
          <aside className="order-1 flex flex-col gap-5 lg:order-2 lg:sticky lg:top-8">
            <CtaCard isCustomer role={user.role} />
            <AccountCard
              user={user}
              onLogout={async () => {
                await logout();
                router.push('/');
              }}
            />
          </aside>
        </div>
      ) : (
        // Staff: layout simples e centrado (sem agendamentos de cliente).
        <div className="grid gap-6 sm:grid-cols-2 sm:items-start">
          <CtaCard isCustomer={false} role={user.role} />
          <AccountCard
            user={user}
            onLogout={async () => {
              await logout();
              router.push('/');
            }}
          />
        </div>
      )}
    </main>
  );
}

function MiniStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface px-4 py-2 text-center shadow-sm">
      <p className="text-xl font-bold tabular-nums text-foreground">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}

/** Cabeçalho de seção com marcador colorido, contagem e dica. */
function SectionHeader({
  tone,
  label,
  count,
  hint,
}: {
  tone: 'primary' | 'muted';
  label: string;
  count: number;
  hint?: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={`h-2.5 w-2.5 rounded-full ${tone === 'primary' ? 'bg-emerald-400' : 'bg-slate-500'}`}
      />
      <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">
        {label}
      </h3>
      <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs font-semibold tabular-nums text-muted">
        {count}
      </span>
      {hint && (
        <span className="ml-auto hidden text-xs text-muted sm:block">
          {hint}
        </span>
      )}
    </div>
  );
}

/** Linha compacta e discreta do histórico (só leitura). */
function HistoryRow({ appointment: a }: { appointment: CustomerAppointmentDto }) {
  const st = STATUS[a.status];
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-foreground/90">
            {a.serviceName}
          </p>
          <span
            className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${st.pill}`}
          >
            <span className={`h-1 w-1 rounded-full ${st.dot}`} />
            {st.label}
          </span>
        </div>
        <p className="mt-0.5 truncate text-xs text-muted">
          <span className="capitalize">{longDate(a.startsAt)}</span> ·{' '}
          <span className="tabular-nums">{hhmm(a.startsAt)}</span> ·{' '}
          {a.establishmentName}
        </p>
      </div>
      <span className="shrink-0 text-sm tabular-nums text-muted">
        {formatBRL(a.priceCents)}
      </span>
    </div>
  );
}

/** Faixa de chamada para ação, adaptada ao perfil. */
function CtaCard({
  isCustomer,
  role,
}: {
  isCustomer: boolean;
  role: AuthUserDto['role'];
}) {
  return (
    <section className="relative overflow-hidden rounded-[var(--radius-card)] border border-border bg-gradient-to-br from-primary/15 via-surface to-accent/10 p-6 shadow-card">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/20 blur-3xl"
      />
      <div className="relative flex flex-col gap-3">
        <CardTitle>{isCustomer ? 'Pronto para agendar?' : 'Seu painel'}</CardTitle>
        <CardDescription className="mt-0 max-w-sm">
          {isCustomer
            ? 'Escolha um estabelecimento e marque seu horário em segundos.'
            : 'Acesse a área do seu perfil para gerenciar tudo.'}
        </CardDescription>
        <div>
          <Link href={isCustomer ? '/#estabelecimentos' : homePathForRole(role)}>
            <Button className="group">
              {isCustomer ? 'Explorar estabelecimentos' : 'Ir para o painel'}
              <IconArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

/** Dados da conta + sair. */
function AccountCard({
  user,
  onLogout,
}: {
  user: AuthUserDto;
  onLogout: () => Promise<void>;
}) {
  return (
    <Card>
      <CardTitle className="text-base">Dados da conta</CardTitle>
      <dl className="mt-4 flex flex-col divide-y divide-border text-sm">
        <Row label="Nome" value={user.name} />
        <Row label="E-mail" value={user.email} />
        <Row label="Perfil" value={ROLE_LABELS[user.role]} />
      </dl>
      <div className="mt-5">
        <Button variant="outline" onClick={onLogout}>
          Sair da conta
        </Button>
      </div>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className="text-muted">{label}</dt>
      <dd className="truncate text-right font-medium text-foreground">
        {value}
      </dd>
    </div>
  );
}

/** Item do histórico do cliente com ações de cancelar e remarcar. */
function AppointmentItem({
  appointment: a,
  authFetch,
  onChanged,
}: {
  appointment: CustomerAppointmentDto;
  authFetch: AuthFetch;
  onChanged: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(a.startsAt.slice(0, 10));
  const [avail, setAvail] = useState<AvailabilityResponseDto | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const active =
    ACTIVE.includes(a.status) && new Date(a.startsAt).getTime() > Date.now();
  const st = STATUS[a.status];

  const loadSlots = useCallback(
    async (d: string) => {
      setLoadingSlots(true);
      setAvail(null);
      try {
        const q = new URLSearchParams({
          serviceId: a.serviceId,
          date: d,
          professionalId: a.professionalId,
        });
        setAvail(
          await apiFetch<AvailabilityResponseDto>(
            `/public/${a.establishmentSlug}/availability?${q.toString()}`,
          ),
        );
      } catch {
        /* ignora */
      } finally {
        setLoadingSlots(false);
      }
    },
    [a.serviceId, a.professionalId, a.establishmentSlug],
  );

  function openReschedule() {
    setError(null);
    setOpen(true);
    const d = a.startsAt.slice(0, 10);
    setDate(d);
    void loadSlots(d);
  }

  async function cancel() {
    if (!window.confirm('Cancelar este agendamento?')) return;
    setBusy(true);
    setError(null);
    try {
      await authFetch(`/me/appointments/${a.id}/cancel`, { method: 'POST' });
      await onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao cancelar.');
    } finally {
      setBusy(false);
    }
  }

  async function pick(startsAt: string) {
    setBusy(true);
    setError(null);
    try {
      await authFetch(`/me/appointments/${a.id}/reschedule`, {
        method: 'POST',
        body: { startsAt },
      });
      setOpen(false);
      await onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao remarcar.');
    } finally {
      setBusy(false);
    }
  }

  const proSlots = avail?.professionals.find(
    (p) => p.professionalId === a.professionalId,
  );

  return (
    <Card
      className={`flex flex-col gap-3 ${active ? '' : 'opacity-95'} hover:border-ring/40 hover:shadow-lg`}
    >
      {/* Cabeçalho: serviço + status */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-foreground">
            {a.serviceName}
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            <span className="inline-flex items-center gap-1.5">
              <IconMapPin className="h-3.5 w-3.5 shrink-0" />
              <Link
                href={`/b/${a.establishmentSlug}`}
                className="transition-colors hover:text-foreground"
              >
                {a.establishmentName}
              </Link>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <IconScissors className="h-3.5 w-3.5 shrink-0" />
              {a.professionalName}
            </span>
          </p>
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${st.pill}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
          {st.label}
        </span>
      </div>

      {/* Data / hora / preço */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-xl bg-surface-2 px-3 py-2 text-sm">
        <span className="inline-flex items-center gap-1.5 text-foreground">
          <IconCalendar className="h-4 w-4 text-muted" />
          <span className="capitalize">{longDate(a.startsAt)}</span>
        </span>
        <span className="inline-flex items-center gap-1.5 text-foreground">
          <IconClock className="h-4 w-4 text-muted" />
          <span className="tabular-nums">{hhmm(a.startsAt)}</span>
        </span>
        <span className="ml-auto font-semibold tabular-nums text-foreground">
          {formatBRL(a.priceCents)}
        </span>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      {active && (
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={openReschedule}
            disabled={busy}
          >
            {open ? 'Fechar' : 'Remarcar'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-danger hover:bg-danger/10"
            onClick={cancel}
            loading={busy}
          >
            Cancelar
          </Button>
        </div>
      )}

      {open && active && (
        <div className="flex flex-col gap-2 border-t border-border pt-3">
          <Input
            label="Nova data"
            type="date"
            min={todayStr()}
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              void loadSlots(e.target.value);
            }}
            className="max-w-[12rem]"
          />
          {loadingSlots && (
            <p className="text-sm text-muted">Buscando horários…</p>
          )}
          {!loadingSlots && proSlots && proSlots.slots.length === 0 && (
            <p className="text-sm text-muted">
              Nenhum horário livre nesta data.
            </p>
          )}
          {!loadingSlots && proSlots && proSlots.slots.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {proSlots.slots.map((iso) => (
                <button
                  key={iso}
                  type="button"
                  disabled={busy}
                  onClick={() => pick(iso)}
                  className="rounded-[var(--radius-btn)] border border-border px-3 py-1.5 text-sm tabular-nums text-foreground transition-colors hover:border-ring hover:bg-surface-2 disabled:opacity-50"
                >
                  {hhmm(iso)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
