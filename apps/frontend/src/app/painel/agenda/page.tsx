'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AppointmentStatus,
  UserRole,
  type AppointmentResponseDto,
  type AppointmentStatus as AppointmentStatusT,
  type ProfessionalResponseDto,
} from '@repo/shared';
import { useAuth } from '../../../lib/auth-context';
import { Button } from '../../../components/ui/button';
import { Card, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';

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

/** Status terminais não têm mais ações. */
const TERMINAL: AppointmentStatusT[] = [
  AppointmentStatus.COMPLETED,
  AppointmentStatus.CANCELLED,
  AppointmentStatus.NO_SHOW,
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

export default function AgendaPage() {
  const { user, loading, authFetch } = useAuth();
  const router = useRouter();

  const [date, setDate] = useState(today());
  const [professionalId, setProfessionalId] = useState('');
  const [professionals, setProfessionals] = useState<ProfessionalResponseDto[]>(
    [],
  );
  const [appointments, setAppointments] = useState<
    AppointmentResponseDto[] | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const query = new URLSearchParams({ date });
      if (professionalId) query.set('professionalId', professionalId);
      setAppointments(
        await authFetch<AppointmentResponseDto[]>(
          `/appointments?${query.toString()}`,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar agenda.');
    }
  }, [authFetch, date, professionalId]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (user.role !== UserRole.TENANT_ADMIN) {
      router.replace('/');
      return;
    }
    void load();
  }, [loading, user, router, load]);

  // Carrega profissionais uma vez (para o filtro).
  useEffect(() => {
    if (!user || user.role !== UserRole.TENANT_ADMIN) return;
    authFetch<ProfessionalResponseDto[]>('/professionals')
      .then(setProfessionals)
      .catch(() => undefined);
  }, [user, authFetch]);

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
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-8">
      <header>
        <p className="text-sm font-medium text-accent">Painel do dono</p>
        <h1 className="text-2xl font-bold text-foreground">Agenda</h1>
      </header>

      {/* Filtros */}
      <div className="flex flex-wrap items-end gap-3">
        <Input
          label="Dia"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="max-w-[12rem]"
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">
            Profissional
          </label>
          <select
            value={professionalId}
            onChange={(e) => setProfessionalId(e.target.value)}
            className="h-11 rounded-[var(--radius-btn)] border border-border bg-surface px-3 text-sm text-foreground"
          >
            <option value="">Todos</option>
            {professionals.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex flex-col gap-3">
        {appointments?.length === 0 && (
          <p className="text-sm text-muted">
            Nenhum agendamento para este dia.
          </p>
        )}
        {appointments?.map((a) => (
          <AppointmentCard
            key={a.id}
            appointment={a}
            authFetch={authFetch}
            onChanged={load}
            onError={setError}
          />
        ))}
      </div>
    </main>
  );
}

/** Card de agendamento com ações de status/cancelar/remarcar. */
function AppointmentCard({
  appointment: a,
  authFetch,
  onChanged,
  onError,
}: {
  appointment: AppointmentResponseDto;
  authFetch: <T>(
    path: string,
    opts?: { method?: string; body?: unknown },
  ) => Promise<T>;
  onChanged: () => Promise<void>;
  onError: (msg: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  const [newStart, setNewStart] = useState('');

  const isTerminal = TERMINAL.includes(a.status);

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    onError('');
    try {
      await fn();
      await onChanged();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Erro ao atualizar.');
    } finally {
      setBusy(false);
    }
  }

  function setStatus(status: AppointmentStatusT) {
    return run(() =>
      authFetch(`/appointments/${a.id}/status`, {
        method: 'PATCH',
        body: { status },
      }),
    );
  }

  function cancel() {
    if (!window.confirm(`Cancelar o agendamento de ${a.customerName}?`)) return;
    return run(() =>
      authFetch(`/appointments/${a.id}/cancel`, {
        method: 'POST',
        body: {},
      }),
    );
  }

  function reschedule() {
    if (!newStart) return;
    // datetime-local (horário do navegador) → ISO UTC.
    const startsAt = new Date(newStart).toISOString();
    return run(async () => {
      await authFetch(`/appointments/${a.id}/reschedule`, {
        method: 'POST',
        body: { startsAt },
      });
      setRescheduling(false);
      setNewStart('');
    });
  }

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <CardTitle className="text-base">
            {hhmm(a.startsAt)}–{hhmm(a.endsAt)} · {a.customerName}
          </CardTitle>
          <p className="mt-1 text-xs text-muted">
            {a.serviceName} · {a.professionalName}
          </p>
          <p className="text-xs text-muted">
            {a.customerEmail}
            {a.customerPhone ? ` · ${a.customerPhone}` : ''}
          </p>
        </div>
        <span
          className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLOR[a.status]}`}
        >
          {STATUS_LABEL[a.status]}
        </span>
      </div>

      {!isTerminal && (
        <div className="flex flex-wrap gap-2">
          {a.status === AppointmentStatus.PENDING && (
            <Button
              size="sm"
              variant="outline"
              loading={busy}
              onClick={() => setStatus(AppointmentStatus.CONFIRMED)}
            >
              Confirmar
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            loading={busy}
            onClick={() => setStatus(AppointmentStatus.COMPLETED)}
          >
            Concluir
          </Button>
          <Button
            size="sm"
            variant="ghost"
            loading={busy}
            onClick={() => setRescheduling((v) => !v)}
          >
            Remarcar
          </Button>
          <Button
            size="sm"
            variant="ghost"
            loading={busy}
            onClick={() => setStatus(AppointmentStatus.NO_SHOW)}
          >
            Não compareceu
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-red-500"
            loading={busy}
            onClick={cancel}
          >
            Cancelar
          </Button>
        </div>
      )}

      {rescheduling && !isTerminal && (
        <div className="flex flex-wrap items-end gap-2 border-t border-border pt-3">
          <Input
            label="Novo horário"
            type="datetime-local"
            value={newStart}
            onChange={(e) => setNewStart(e.target.value)}
          />
          <Button size="sm" loading={busy} disabled={!newStart} onClick={reschedule}>
            Salvar
          </Button>
        </div>
      )}
    </Card>
  );
}
