'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AppointmentStatus,
  UserRole,
  type AppointmentStatus as AppointmentStatusT,
  type AuthUserDto,
  type CustomerAppointmentDto,
} from '@repo/shared';
import { useAuth } from '../lib/auth-context';
import { homePathForRole } from '../lib/routes';
import { AuthNav } from '../components/auth-nav';
import { SettingsMenu } from '../components/settings-menu';
import { EstablishmentDiscovery } from '../components/establishment-discovery';
import { Button } from '../components/ui/button';
import { Card, CardTitle } from '../components/ui/card';
import { AppointmentBadge } from '../components/ui/badge';
import {
  IconArrowRight,
  IconCalendar,
  IconCheck,
  IconClock,
  IconMapPin,
  IconScissors,
  IconStar,
} from '../components/icons';

/**
 * Home ciente do papel:
 * - visitante (deslogado) → landing pública de marketing;
 * - Super Admin / Dono → redireciona para o painel deles (a landing não faz
 *   sentido para quem administra);
 * - Cliente → home personalizada (saudação + próximo agendamento + descoberta).
 */
export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const isStaff =
    !!user &&
    (user.role === UserRole.SUPER_ADMIN ||
      user.role === UserRole.TENANT_ADMIN);

  useEffect(() => {
    if (!loading && isStaff && user) {
      router.replace(homePathForRole(user.role));
    }
  }, [loading, isStaff, user, router]);

  // Enquanto resolve a sessão (ou redireciona o staff), evita o flash da landing.
  if (loading || isStaff) {
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <span
          aria-label="Carregando"
          className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-transparent"
        />
      </main>
    );
  }

  if (user && user.role === UserRole.CUSTOMER) {
    return <ClientHome user={user} />;
  }

  return <PublicLanding />;
}

// ---------------------------------------------------------------------------
// Cabeçalho comum
// ---------------------------------------------------------------------------
function TopBar() {
  return (
    <header className="flex items-center justify-between gap-4">
      <Link href="/" className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-emerald-600 text-sm font-bold text-primary-foreground shadow-glow">
          A
        </span>
        <span className="text-lg font-bold tracking-tight text-foreground">
          Agendamento
        </span>
      </Link>
      <div className="flex items-center gap-3">
        <AuthNav />
        <SettingsMenu />
      </div>
    </header>
  );
}

// ---------------------------------------------------------------------------
// Home do cliente logado — personalizada
// ---------------------------------------------------------------------------
const ACTIVE: AppointmentStatusT[] = [
  AppointmentStatus.PENDING,
  AppointmentStatus.CONFIRMED,
];

function longDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });
}
function hhmm(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function ClientHome({ user }: { user: AuthUserDto }) {
  const { authFetch } = useAuth();
  const [appointments, setAppointments] = useState<
    CustomerAppointmentDto[] | null
  >(null);

  const load = useCallback(async () => {
    try {
      setAppointments(
        await authFetch<CustomerAppointmentDto[]>('/me/appointments'),
      );
    } catch {
      setAppointments([]);
    }
  }, [authFetch]);

  useEffect(() => {
    void load();
  }, [load]);

  const next = useMemo(() => {
    const now = Date.now();
    return (
      (appointments ?? [])
        .filter(
          (a) =>
            ACTIVE.includes(a.status) &&
            new Date(a.startsAt).getTime() > now,
        )
        .sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt))[0] ?? null
    );
  }, [appointments]);

  const firstName = user.name.split(' ')[0];

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col gap-12 px-4 py-6 sm:px-6 sm:py-8">
      <TopBar />

      {/* Saudação + próximo agendamento */}
      <section className="grid items-stretch gap-6 lg:grid-cols-[1fr_0.9fr]">
        <div className="flex flex-col justify-center gap-4">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-surface/70 px-3 py-1 text-xs font-medium text-accent shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Bem-vindo de volta
          </span>
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl">
            Olá, {firstName} 👋
          </h1>
          <p className="max-w-md text-base text-muted">
            Pronto para agendar de novo? Escolha um estabelecimento e marque seu
            horário em segundos.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="#estabelecimentos">
              <Button size="lg">Explorar estabelecimentos</Button>
            </Link>
            <Link href="/conta">
              <Button size="lg" variant="outline">
                Meus agendamentos
              </Button>
            </Link>
          </div>
        </div>

        <NextAppointmentCard appointment={next} loading={appointments === null} />
      </section>

      {/* Descoberta */}
      <EstablishmentDiscovery />

      <footer className="mt-auto border-t border-border pt-6 text-center text-xs text-muted">
        Agendamento — barbearias, salões e estúdios.
      </footer>
    </div>
  );
}

/** Card do próximo agendamento do cliente (ou vazio convidando a agendar). */
function NextAppointmentCard({
  appointment: a,
  loading,
}: {
  appointment: CustomerAppointmentDto | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="h-full min-h-44 animate-pulse rounded-[var(--radius-card)] bg-surface-2" />
    );
  }

  if (!a) {
    return (
      <Card className="flex flex-col items-center justify-center gap-3 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-2 text-muted">
          <IconCalendar className="h-6 w-6" />
        </span>
        <p className="text-sm font-medium text-foreground">
          Nenhum agendamento marcado
        </p>
        <p className="max-w-xs text-sm text-muted">
          Escolha um estabelecimento abaixo e marque seu próximo horário.
        </p>
      </Card>
    );
  }

  return (
    <Card className="relative flex flex-col gap-4 overflow-hidden bg-gradient-to-br from-primary/10 via-surface to-accent/5">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-primary/20 blur-3xl"
      />
      <div className="relative flex items-center justify-between gap-2">
        <p className="text-sm text-muted">Seu próximo agendamento</p>
        <AppointmentBadge status={a.status} />
      </div>
      <div className="relative flex flex-col gap-1">
        <p className="text-lg font-bold text-foreground">{a.serviceName}</p>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5">
            <IconMapPin className="h-3.5 w-3.5" />
            {a.establishmentName}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <IconScissors className="h-3.5 w-3.5" />
            {a.professionalName}
          </span>
        </p>
      </div>
      <div className="relative flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-xl bg-surface-2 px-3 py-2 text-sm">
        <span className="inline-flex items-center gap-1.5 text-foreground">
          <IconCalendar className="h-4 w-4 text-muted" />
          <span className="capitalize">{longDate(a.startsAt)}</span>
        </span>
        <span className="inline-flex items-center gap-1.5 text-foreground">
          <IconClock className="h-4 w-4 text-muted" />
          <span className="tabular-nums">{hhmm(a.startsAt)}</span>
        </span>
      </div>
      <Link href="/conta" className="relative">
        <Button variant="outline" className="w-full">
          Gerenciar agendamento
        </Button>
      </Link>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Landing pública — visitante deslogado
// ---------------------------------------------------------------------------
function PublicLanding() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col gap-16 px-4 py-6 sm:px-6 sm:py-8">
      <TopBar />

      {/* Hero — duas colunas: mensagem + preview do produto */}
      <section className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8">
        <div className="flex flex-col items-start gap-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-3 py-1 text-xs font-medium text-accent shadow-sm backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Agende online, 24h — sem instalar nada
          </span>
          <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Marque seu horário em{' '}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              segundos
            </span>
            .
          </h1>
          <p className="max-w-md text-base text-muted sm:text-lg">
            Barbearias, salões e estúdios perto de você. Escolha o serviço, o
            profissional e o horário — confirmação na hora.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="#estabelecimentos">
              <Button size="lg">Ver estabelecimentos</Button>
            </Link>
            <Link href="/comecar">
              <Button size="lg" variant="outline">
                Sou um estabelecimento
              </Button>
            </Link>
          </div>
          <ul className="flex flex-wrap gap-x-6 gap-y-2 pt-1 text-sm text-muted">
            <TrustItem>Confirmação imediata</TrustItem>
            <TrustItem>Sem cadastro complicado</TrustItem>
            <TrustItem>De graça para o cliente</TrustItem>
          </ul>
        </div>

        {/* Preview do produto — dá "cara de app" e preenche a largura */}
        <HeroPreview />
      </section>

      {/* Descoberta de estabelecimentos — conteúdo principal */}
      <EstablishmentDiscovery />

      {/* Como funciona */}
      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Como funciona
          </h2>
          <p className="text-sm text-muted">
            Do primeiro clique ao horário confirmado em três passos.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Step
            n="1"
            title="Escolha o lugar"
            desc="Encontre uma barbearia, salão ou estúdio na lista acima."
          />
          <Step
            n="2"
            title="Escolha serviço e horário"
            desc="Veja os horários livres por profissional e selecione o seu."
          />
          <Step
            n="3"
            title="Confirme"
            desc="Crie sua conta em segundos e pronto — agendamento confirmado."
          />
        </div>
      </section>

      {/* Faixa para donos */}
      <section className="relative overflow-hidden rounded-[var(--radius-card)] border border-border bg-gradient-to-br from-primary/12 via-surface to-accent/10 p-8 shadow-card sm:p-10">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/20 blur-3xl"
        />
        <div className="relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div className="max-w-xl">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Tem um estabelecimento?
            </h2>
            <p className="mt-2 text-sm text-muted sm:text-base">
              Receba agendamentos online 24h e gerencie serviços, equipe e
              horários num painel simples. 14 dias grátis, sem cartão.
            </p>
          </div>
          <Link href="/comecar" className="shrink-0">
            <Button size="lg">Cadastrar meu estabelecimento</Button>
          </Link>
        </div>
      </section>

      <footer className="mt-auto border-t border-border pt-6 text-center text-xs text-muted">
        Agendamento — barbearias, salões e estúdios.
      </footer>
    </div>
  );
}

function TrustItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2">
      <IconCheck className="h-4 w-4 text-primary" />
      {children}
    </li>
  );
}

/** Mock visual de um cartão de agendamento — decorativo, dá "cara de app". */
function HeroPreview() {
  const times = ['14:00', '14:30', '15:00', '15:30'];
  return (
    <div className="relative mx-auto hidden w-full max-w-sm lg:block">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-primary/25 to-accent/20 opacity-70 blur-3xl"
      />
      <div className="relative rotate-1 rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-lg transition-transform duration-300 ease-[var(--ease-fluid)] hover:rotate-0">
        {/* topo: estabelecimento */}
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-emerald-600 text-base font-bold text-primary-foreground">
            B
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-foreground">Barbearia do Zé</p>
            <p className="flex items-center gap-1 text-xs text-muted">
              <span className="inline-flex text-accent">
                {[0, 1, 2, 3, 4].map((i) => (
                  <IconStar key={i} className="h-3 w-3" />
                ))}
              </span>
              4,9 · São Paulo
            </p>
          </div>
        </div>

        {/* serviço */}
        <div className="mt-4 flex items-center justify-between rounded-xl bg-surface-2 px-3.5 py-3">
          <span className="flex items-center gap-2 text-sm font-medium text-foreground">
            <IconScissors className="h-4 w-4 text-muted" />
            Corte + Barba
          </span>
          <span className="text-sm font-semibold tabular-nums text-foreground">
            R$ 60
          </span>
        </div>

        {/* data + horários */}
        <div className="mt-4 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted">
          <IconCalendar className="h-4 w-4" />
          Hoje
        </div>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {times.map((t, i) => (
            <span
              key={t}
              className={`rounded-lg border px-2 py-1.5 text-center text-xs tabular-nums ${
                i === 2
                  ? 'border-primary bg-primary text-primary-foreground shadow-glow'
                  : 'border-border text-foreground'
              }`}
            >
              {t}
            </span>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-primary/12 py-2.5 text-sm font-semibold text-primary">
          <IconClock className="h-4 w-4" />
          Confirmado às 15:00
        </div>
      </div>
    </div>
  );
}

function Step({ n, title, desc }: { n: string; title: string; desc: string }) {
  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-card transition-[transform,border-color] duration-200 ease-[var(--ease-fluid)] hover:-translate-y-0.5 hover:border-ring/40">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15 text-sm font-bold text-accent">
        {n}
      </span>
      <h3 className="font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted">{desc}</p>
    </div>
  );
}
