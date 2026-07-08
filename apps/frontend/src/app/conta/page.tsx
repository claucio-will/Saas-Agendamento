'use client';

import { useCallback, useEffect, useState } from 'react';
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

const ROLE_LABELS: Record<AuthUserDto['role'], string> = {
  [UserRole.SUPER_ADMIN]: 'Administrador da plataforma',
  [UserRole.TENANT_ADMIN]: 'Dono de estabelecimento',
  [UserRole.PROFESSIONAL]: 'Profissional',
  [UserRole.CUSTOMER]: 'Cliente',
};

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

  if (loading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <span
          aria-label="Carregando"
          className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-transparent"
        />
      </main>
    );
  }

  const firstName = user.name.split(' ')[0];
  const isCustomer = user.role === UserRole.CUSTOMER;

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-6 px-4 py-10">
      <div>
        <Link href="/" className="text-sm text-muted hover:text-foreground">
          ← Início
        </Link>
      </div>

      <header>
        <p className="text-sm font-medium text-accent">Minha conta</p>
        <h1 className="text-2xl font-bold text-foreground">
          Olá, {firstName} 👋
        </h1>
      </header>

      {/* Próximo passo por perfil */}
      {isCustomer ? (
        <Card className="border-accent/40 bg-accent/5">
          <CardTitle>Pronto para agendar?</CardTitle>
          <CardDescription>
            Escolha um estabelecimento e marque seu horário em segundos.
          </CardDescription>
          <div className="mt-4">
            <Link href="/#estabelecimentos">
              <Button>Explorar estabelecimentos</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <Card className="border-accent/40 bg-accent/5">
          <CardTitle>Seu painel</CardTitle>
          <CardDescription>
            Acesse a área do seu perfil para gerenciar tudo.
          </CardDescription>
          <div className="mt-4">
            <Link href={homePathForRole(user.role)}>
              <Button>Ir para o painel</Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Meus agendamentos (cliente) */}
      {isCustomer && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-accent">Meus agendamentos</h2>
          {appointments === null ? (
            <p className="text-sm text-muted">Carregando…</p>
          ) : appointments.length === 0 ? (
            <p className="text-sm text-muted">
              Você ainda não tem agendamentos.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {appointments.map((a) => (
                <AppointmentItem
                  key={a.id}
                  appointment={a}
                  authFetch={authFetch}
                  onChanged={loadAppointments}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Dados da conta */}
      <Card>
        <CardTitle className="text-base">Dados da conta</CardTitle>
        <dl className="mt-3 flex flex-col gap-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Nome</dt>
            <dd className="font-medium text-foreground">{user.name}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">E-mail</dt>
            <dd className="font-medium text-foreground">{user.email}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Perfil</dt>
            <dd className="font-medium text-foreground">
              {ROLE_LABELS[user.role]}
            </dd>
          </div>
        </dl>

        <div className="mt-6">
          <Button
            variant="outline"
            onClick={async () => {
              await logout();
              router.push('/');
            }}
          >
            Sair
          </Button>
        </div>
      </Card>
    </main>
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
    <Card className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-foreground">{a.serviceName}</p>
          <p className="text-xs text-muted">
            <Link
              href={`/b/${a.establishmentSlug}`}
              className="hover:text-foreground"
            >
              {a.establishmentName}
            </Link>{' '}
            · {a.professionalName}
          </p>
        </div>
        <span
          className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLOR[a.status]}`}
        >
          {STATUS_LABEL[a.status]}
        </span>
      </div>
      <p className="text-sm text-foreground">
        {new Date(a.startsAt).toLocaleString('pt-BR', {
          dateStyle: 'short',
          timeStyle: 'short',
        })}{' '}
        · {formatBRL(a.priceCents)}
      </p>

      {error && <p className="text-sm text-red-500">{error}</p>}

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
            className="text-red-500"
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
                  className="rounded-[var(--radius-btn)] border border-border px-3 py-1.5 text-sm text-foreground transition-colors hover:border-accent disabled:opacity-50"
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
