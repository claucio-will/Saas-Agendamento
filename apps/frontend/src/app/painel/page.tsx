'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AppointmentStatus,
  UserRole,
  type AppointmentResponseDto,
  type AppointmentStatus as AppointmentStatusT,
  type CustomerSummaryDto,
  type ProfessionalResponseDto,
  type ServiceResponseDto,
} from '@repo/shared';
import { useAuth } from '../../lib/auth-context';
import { Card, CardDescription, CardTitle } from '../../components/ui/card';

const STATUS_LABEL: Record<AppointmentStatusT, string> = {
  [AppointmentStatus.PENDING]: 'Pendente',
  [AppointmentStatus.CONFIRMED]: 'Confirmado',
  [AppointmentStatus.COMPLETED]: 'Concluído',
  [AppointmentStatus.CANCELLED]: 'Cancelado',
  [AppointmentStatus.NO_SHOW]: 'Não compareceu',
};

const STATUS_COLOR: Record<AppointmentStatusT, string> = {
  [AppointmentStatus.PENDING]: 'bg-accent/20 text-accent',
  [AppointmentStatus.CONFIRMED]: 'bg-green-500/15 text-green-600',
  [AppointmentStatus.COMPLETED]: 'bg-primary/15 text-primary',
  [AppointmentStatus.CANCELLED]: 'bg-red-500/15 text-red-500',
  [AppointmentStatus.NO_SHOW]: 'bg-muted/20 text-muted',
};

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

  const load = useCallback(async () => {
    const [appts, cust, svc, pros] = await Promise.all([
      authFetch<AppointmentResponseDto[]>(`/appointments?date=${today()}`),
      authFetch<CustomerSummaryDto[]>('/customers'),
      authFetch<ServiceResponseDto[]>('/services'),
      authFetch<ProfessionalResponseDto[]>('/professionals'),
    ]);
    setAppointments(appts);
    setCustomers(cust);
    setServices(svc);
    setProfessionals(pros);
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
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-4 py-8">
      <header>
        <p className="text-sm font-medium text-accent">Painel do dono</p>
        <h1 className="text-2xl font-bold text-foreground">
          Olá, {user.name.split(' ')[0]} 👋
        </h1>
        <p className="mt-1 text-sm text-muted">
          {new Date().toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
          })}
        </p>
      </header>

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

      {/* Números */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Hoje" value={appointments?.length} hint="agendamentos" />
        <Stat label="A confirmar" value={pending} hint="pendentes hoje" />
        <Stat label="Clientes" value={customers.length} hint="no total" />
        <Stat label="Serviços" value={services.length} hint="ativos" />
      </div>

      {/* Próximo + Agenda de hoje */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="flex flex-col gap-2">
          <p className="text-sm text-muted">Próximo agendamento</p>
          {next ? (
            <>
              <p className="text-2xl font-bold text-foreground">
                {hhmm(next.startsAt)}
              </p>
              <p className="text-sm text-foreground">{next.customerName}</p>
              <p className="text-xs text-muted">
                {next.serviceName} · {next.professionalName}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted">
              Nada mais para hoje. Aproveite! ☕
            </p>
          )}
        </Card>

        <Card className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Agenda de hoje</CardTitle>
            <Link
              href="/painel/agenda"
              className="text-sm text-accent hover:underline"
            >
              Ver tudo →
            </Link>
          </div>
          {appointments?.length === 0 && (
            <p className="text-sm text-muted">Nenhum agendamento hoje.</p>
          )}
          <div className="flex flex-col gap-2">
            {appointments?.slice(0, 5).map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <span className="text-foreground">
                  <span className="font-medium">{hhmm(a.startsAt)}</span>{' '}
                  <span className="text-muted">·</span> {a.customerName}
                </span>
                <span
                  className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[a.status]}`}
                >
                  {STATUS_LABEL[a.status]}
                </span>
              </div>
            ))}
            {appointments && appointments.length > 5 && (
              <p className="text-xs text-muted">
                + {appointments.length - 5} agendamento(s)
              </p>
            )}
          </div>
        </Card>
      </div>
    </main>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: number | undefined;
  hint: string;
}) {
  return (
    <Card className="gap-0">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold text-foreground">{value ?? '—'}</p>
      <p className="text-xs text-muted">{hint}</p>
    </Card>
  );
}
