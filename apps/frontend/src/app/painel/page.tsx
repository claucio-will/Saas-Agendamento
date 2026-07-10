'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AppointmentStatus,
  planInfo,
  TenantStatus,
  UserRole,
  type AppointmentResponseDto,
  type AppointmentStatus as AppointmentStatusT,
  type CustomerSummaryDto,
  type MyTenantResponseDto,
  type ProfessionalResponseDto,
  type ServiceResponseDto,
} from '@repo/shared';
import { useAuth } from '../../lib/auth-context';
import { Card, CardDescription, CardTitle } from '../../components/ui/card';
import { AppointmentBadge } from '../../components/ui/badge';
import {
  IconArrowRight,
  IconCalendar,
  IconClock,
  IconGlobe,
  IconScissors,
  IconUser,
  IconUsers,
} from '../../components/icons';

const DONE: AppointmentStatusT[] = [
  AppointmentStatus.CANCELLED,
  AppointmentStatus.NO_SHOW,
  AppointmentStatus.COMPLETED,
];

function hhmm(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function trialDaysLeft(iso: string | null): number {
  if (!iso) return 0;
  return Math.max(
    0,
    Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000),
  );
}

export default function PainelHomePage() {
  const { user, loading, authFetch } = useAuth();
  const router = useRouter();

  const [appointments, setAppointments] = useState<
    AppointmentResponseDto[] | null
  >(null);
  const [customers, setCustomers] = useState<CustomerSummaryDto[]>([]);
  const [services, setServices] = useState<ServiceResponseDto[]>([]);
  const [professionals, setProfessionals] = useState<ProfessionalResponseDto[]>(
    [],
  );
  const [tenant, setTenant] = useState<MyTenantResponseDto | null>(null);

  const load = useCallback(async () => {
    const [appts, cust, svc, pros, me] = await Promise.all([
      authFetch<AppointmentResponseDto[]>(`/appointments?date=${today()}`),
      authFetch<CustomerSummaryDto[]>('/customers'),
      authFetch<ServiceResponseDto[]>('/services'),
      authFetch<ProfessionalResponseDto[]>('/professionals'),
      authFetch<MyTenantResponseDto>('/tenants/me/settings'),
    ]);
    setAppointments(appts);
    setCustomers(cust);
    setServices(svc);
    setProfessionals(pros);
    setTenant(me);
  }, [authFetch]);

  useEffect(() => {
    if (loading) return;
    if (!user) return router.replace('/login');
    if (user.role !== UserRole.TENANT_ADMIN) return router.replace('/');
    void load().catch(() => undefined);
  }, [loading, user, router, load]);

  const pending = useMemo(
    () =>
      appointments?.filter((a) => a.status === AppointmentStatus.PENDING)
        .length ?? 0,
    [appointments],
  );

  const next = useMemo(() => {
    if (!appointments) return null;
    const now = Date.now();
    return (
      appointments
        .filter(
          (a) =>
            !DONE.includes(a.status) &&
            new Date(a.startsAt).getTime() >= now,
        )
        .sort(
          (a, b) =>
            new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
        )[0] ?? null
    );
  }, [appointments]);

  const needsSetup = services.length === 0 || professionals.length === 0;

  if (loading || !user || user.role !== UserRole.TENANT_ADMIN) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <span
          aria-label="Carregando"
          className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-transparent"
        />
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-8">
      <header className="flex flex-col gap-1">
        <p className="text-sm font-medium text-accent">Painel do dono</p>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          Olá, {user.name.split(' ')[0]} 👋
        </h1>
        <p className="text-sm capitalize text-muted">
          {new Date().toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
          })}
        </p>
      </header>

      {/* Banner de assinatura em teste */}
      {tenant?.status === TenantStatus.TRIAL && (
        <Link href="/painel/assinatura" className="group">
          <Card className="flex flex-wrap items-center justify-between gap-3 border-amber-400/30 bg-amber-400/5">
            <div>
              <p className="font-semibold text-foreground">
                Teste grátis do plano {planInfo(tenant.plan).name}
              </p>
              <p className="text-sm text-muted">
                {trialDaysLeft(tenant.trialEndsAt) > 0
                  ? `Faltam ${trialDaysLeft(tenant.trialEndsAt)} dia(s) — ative a assinatura para não parar de receber agendamentos.`
                  : 'Seu teste terminou — ative a assinatura para continuar.'}
              </p>
            </div>
            <span className="whitespace-nowrap text-sm font-semibold text-accent group-hover:underline">
              Ativar assinatura →
            </span>
          </Card>
        </Link>
      )}

      {/* Nudge de configuração inicial */}
      {needsSetup && (
        <Card className="border-accent/40 bg-accent/5">
          <CardTitle className="text-base">Falta pouco para começar</CardTitle>
          <CardDescription>
            Cadastre {services.length === 0 && 'serviços'}
            {services.length === 0 && professionals.length === 0 && ' e '}
            {professionals.length === 0 && 'profissionais com jornada'} para o
            estabelecimento aparecer disponível para agendamento.
          </CardDescription>
          <div className="mt-3 flex flex-wrap gap-2 text-sm font-medium">
            {services.length === 0 && (
              <Link href="/painel/servicos" className="text-accent hover:underline">
                Cadastrar serviços →
              </Link>
            )}
            {professionals.length === 0 && (
              <Link
                href="/painel/profissionais"
                className="text-accent hover:underline"
              >
                Cadastrar profissionais →
              </Link>
            )}
          </div>
        </Card>
      )}

      {/* Números — clicáveis */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat
          icon={<IconCalendar />}
          tone="primary"
          label="Hoje"
          value={appointments?.length}
          hint="agendamentos"
          href="/painel/agenda"
        />
        <Stat
          icon={<IconClock />}
          tone="amber"
          label="A confirmar"
          value={pending}
          hint="pendentes hoje"
          href="/painel/agenda"
        />
        <Stat
          icon={<IconUser />}
          tone="sky"
          label="Clientes"
          value={customers.length}
          hint="no histórico"
          href="/painel/clientes"
        />
        <Stat
          icon={<IconScissors />}
          tone="accent"
          label="Serviços"
          value={services.length}
          hint="ativos"
          href="/painel/servicos"
        />
      </div>

      {/* Próximo + Agenda de hoje — clicáveis (levam à Agenda) */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Link href="/painel/agenda" className="group">
          <Card className="relative flex h-full flex-col gap-2 overflow-hidden bg-gradient-to-br from-primary/10 via-surface to-accent/5 transition-[transform,border-color,box-shadow] duration-200 ease-[var(--ease-fluid)] group-hover:-translate-y-0.5 group-hover:border-ring/40 group-hover:shadow-lg">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/20 blur-3xl"
            />
            <p className="relative text-sm text-muted">Próximo agendamento</p>
            {next ? (
              <div className="relative flex flex-col gap-1">
                <div className="flex items-center gap-2.5">
                  <p className="text-3xl font-extrabold tabular-nums text-foreground">
                    {hhmm(next.startsAt)}
                  </p>
                  <AppointmentBadge status={next.status} />
                </div>
                <p className="text-sm font-medium text-foreground">
                  {next.customerName}
                </p>
                <p className="text-xs text-muted">
                  {next.serviceName} · {next.professionalName}
                </p>
              </div>
            ) : (
              <p className="relative text-sm text-muted">
                Nada mais para hoje. Aproveite! ☕
              </p>
            )}
          </Card>
        </Link>

        <Link href="/painel/agenda" className="group">
          <Card className="flex h-full flex-col gap-3 transition-[transform,border-color,box-shadow] duration-200 ease-[var(--ease-fluid)] group-hover:-translate-y-0.5 group-hover:border-ring/40 group-hover:shadow-lg">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Agenda de hoje</CardTitle>
              <span className="text-sm font-medium text-accent group-hover:underline">
                Ver tudo →
              </span>
            </div>
            {appointments?.length === 0 && (
              <p className="text-sm text-muted">Nenhum agendamento hoje.</p>
            )}
            <div className="flex flex-col divide-y divide-border">
              {appointments?.slice(0, 5).map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between gap-2 py-2 text-sm first:pt-0"
                >
                  <span className="flex items-center gap-2 text-foreground">
                    <span className="font-semibold tabular-nums">
                      {hhmm(a.startsAt)}
                    </span>
                    <span className="truncate text-muted">
                      {a.customerName}
                    </span>
                  </span>
                  <AppointmentBadge status={a.status} />
                </div>
              ))}
              {appointments && appointments.length > 5 && (
                <p className="pt-2 text-xs text-muted">
                  + {appointments.length - 5} agendamento(s)
                </p>
              )}
            </div>
          </Card>
        </Link>
      </div>

      {/* Ações rápidas */}
      <section className="flex flex-col gap-3">
        <h2 className="text-base font-bold text-foreground">Ações rápidas</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ActionCard
            href="/painel/agenda"
            icon={<IconCalendar />}
            title="Novo agendamento"
            desc="Encaixe um cliente na agenda"
          />
          <ActionCard
            href="/painel/servicos"
            icon={<IconScissors />}
            title="Serviços"
            desc="Preços, duração e equipe"
          />
          <ActionCard
            href="/painel/profissionais"
            icon={<IconUsers />}
            title="Profissionais"
            desc="Equipe, jornadas e folgas"
          />
          <ActionCard
            href={tenant ? `/b/${tenant.slug}` : '/painel/configuracoes'}
            external={!!tenant}
            icon={<IconGlobe />}
            title="Página pública"
            desc="Veja como o cliente agenda"
          />
        </div>
      </section>
    </main>
  );
}

function ActionCard({
  href,
  external,
  icon,
  title,
  desc,
}: {
  href: string;
  external?: boolean;
  icon: ReactNode;
  title: string;
  desc: string;
}) {
  const inner = (
    <Card className="flex h-full items-start gap-3 transition-[transform,border-color,box-shadow] duration-200 ease-[var(--ease-fluid)] group-hover:-translate-y-0.5 group-hover:border-ring/40 group-hover:shadow-lg">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-foreground [&>svg]:h-5 [&>svg]:w-5">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="flex items-center gap-1 font-semibold text-foreground">
          {title}
          <IconArrowRight className="h-3.5 w-3.5 text-muted transition-transform group-hover:translate-x-0.5" />
        </p>
        <p className="text-xs text-muted">{desc}</p>
      </div>
    </Card>
  );
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="group"
      >
        {inner}
      </a>
    );
  }
  return (
    <Link href={href} className="group">
      {inner}
    </Link>
  );
}

type Tone = 'primary' | 'amber' | 'sky' | 'accent';

const TONE_CLASS: Record<Tone, string> = {
  primary: 'bg-primary/10 text-primary',
  amber: 'bg-amber-400/10 text-amber-500',
  sky: 'bg-sky-400/10 text-sky-500',
  accent: 'bg-accent/15 text-accent',
};

function Stat({
  icon,
  tone,
  label,
  value,
  hint,
  href,
}: {
  icon: ReactNode;
  tone: Tone;
  label: string;
  value: number | undefined;
  hint: string;
  href: string;
}) {
  return (
    <Link href={href} className="group">
      <Card className="flex h-full flex-col gap-2 transition-[transform,border-color,box-shadow] duration-200 ease-[var(--ease-fluid)] group-hover:-translate-y-0.5 group-hover:border-ring/40 group-hover:shadow-lg">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted">{label}</p>
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-lg [&>svg]:h-4 [&>svg]:w-4 ${TONE_CLASS[tone]}`}
          >
            {icon}
          </span>
        </div>
        <p className="text-2xl font-bold tabular-nums text-foreground">
          {value ?? '—'}
        </p>
        <p className="flex items-center gap-1 text-xs text-muted">
          {hint}
          <IconArrowRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
        </p>
      </Card>
    </Link>
  );
}
