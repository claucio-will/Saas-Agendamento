'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AppointmentStatus,
  UserRole,
  type AppointmentResponseDto,
  type AppointmentStatus as AppointmentStatusT,
  type AvailabilityResponseDto,
  type CreateManualAppointmentDto,
  type MyTenantResponseDto,
  type ProfessionalResponseDto,
  type ServiceResponseDto,
} from '@repo/shared';
import { apiFetch } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';
import { Button } from '../../../components/ui/button';
import { Card, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { AppointmentBadge } from '../../../components/ui/badge';

type AuthFetch = <T>(
  path: string,
  opts?: { method?: string; body?: unknown },
) => Promise<T>;

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
  const [services, setServices] = useState<ServiceResponseDto[]>([]);
  const [slug, setSlug] = useState('');
  const [showNew, setShowNew] = useState(false);
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

  // Carrega dados auxiliares uma vez (filtro + formulário de novo agendamento).
  useEffect(() => {
    if (!user || user.role !== UserRole.TENANT_ADMIN) return;
    authFetch<ProfessionalResponseDto[]>('/professionals')
      .then(setProfessionals)
      .catch(() => undefined);
    authFetch<ServiceResponseDto[]>('/services')
      .then((s) => setServices(s.filter((x) => x.active)))
      .catch(() => undefined);
    authFetch<MyTenantResponseDto>('/tenants/me')
      .then((t) => setSlug(t.slug))
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
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-8">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-accent">Painel do dono</p>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            Agenda
          </h1>
        </div>
        <Button
          onClick={() => setShowNew((v) => !v)}
          variant={showNew ? 'ghost' : 'primary'}
        >
          {showNew ? 'Fechar' : '+ Novo agendamento'}
        </Button>
      </header>

      {/* Novo agendamento (encaixe/walk-in/telefone) */}
      {showNew && (
        <NewAppointmentForm
          services={services}
          professionals={professionals}
          slug={slug}
          authFetch={authFetch}
          onCreated={async () => {
            setShowNew(false);
            await load();
          }}
        />
      )}

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
            className="h-11 rounded-[var(--radius-btn)] border border-border bg-surface-2 px-3 text-sm text-foreground"
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

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="grid gap-3 sm:grid-cols-2">
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

/** Formulário do dono para lançar um agendamento manual (encaixe/telefone). */
function NewAppointmentForm({
  services,
  professionals,
  slug,
  authFetch,
  onCreated,
}: {
  services: ServiceResponseDto[];
  professionals: ProfessionalResponseDto[];
  slug: string;
  authFetch: AuthFetch;
  onCreated: () => Promise<void>;
}) {
  const [serviceId, setServiceId] = useState('');
  const [professionalId, setProfessionalId] = useState('');
  const [date, setDate] = useState(today());
  const [slot, setSlot] = useState(''); // ISO escolhido nos horários livres
  const [manualTime, setManualTime] = useState(''); // datetime-local (encaixe)
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [avail, setAvail] = useState<AvailabilityResponseDto | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const service = useMemo(
    () => services.find((s) => s.id === serviceId) ?? null,
    [services, serviceId],
  );
  // Só profissionais ativos que executam o serviço escolhido.
  const eligiblePros = useMemo(() => {
    if (!service) return [];
    return professionals.filter(
      (p) => p.active && service.professionalIds.includes(p.id),
    );
  }, [professionals, service]);

  const loadSlots = useCallback(async () => {
    if (!serviceId || !professionalId || !slug) return;
    setLoadingSlots(true);
    setSlot('');
    setAvail(null);
    try {
      const q = new URLSearchParams({ serviceId, date, professionalId });
      setAvail(
        await apiFetch<AvailabilityResponseDto>(
          `/public/${slug}/availability?${q.toString()}`,
        ),
      );
    } catch {
      /* horários são sugestão; ignora erro */
    } finally {
      setLoadingSlots(false);
    }
  }, [serviceId, professionalId, date, slug]);

  useEffect(() => {
    void loadSlots();
  }, [loadSlots]);

  const proSlots = avail?.professionals.find(
    (p) => p.professionalId === professionalId,
  );

  async function submit() {
    setError(null);
    if (!serviceId || !professionalId) {
      setError('Escolha serviço e profissional.');
      return;
    }
    if (customerName.trim().length < 2) {
      setError('Informe o nome do cliente.');
      return;
    }
    // Horário manual (encaixe) tem prioridade sobre o slot sugerido.
    const startsAt = manualTime
      ? new Date(manualTime).toISOString()
      : slot || '';
    if (!startsAt) {
      setError('Escolha um horário livre ou informe um horário manual.');
      return;
    }
    setBusy(true);
    try {
      const dto: CreateManualAppointmentDto = {
        serviceId,
        professionalId,
        startsAt,
        customerName: customerName.trim(),
        status: 'CONFIRMED',
        ...(customerPhone.trim() ? { customerPhone: customerPhone.trim() } : {}),
      };
      await authFetch('/appointments', { method: 'POST', body: dto });
      await onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao agendar.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="flex flex-col gap-4 border-accent/40">
      <CardTitle className="text-base">Novo agendamento</CardTitle>

      <div className="grid gap-3 sm:grid-cols-2">
        {/* Serviço */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Serviço</label>
          <select
            value={serviceId}
            onChange={(e) => {
              setServiceId(e.target.value);
              setProfessionalId('');
            }}
            className="h-11 rounded-[var(--radius-btn)] border border-border bg-surface-2 px-3 text-sm text-foreground"
          >
            <option value="">Selecione…</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} · {s.durationMinutes} min
              </option>
            ))}
          </select>
        </div>

        {/* Profissional */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">
            Profissional
          </label>
          <select
            value={professionalId}
            onChange={(e) => setProfessionalId(e.target.value)}
            disabled={!service}
            className="h-11 rounded-[var(--radius-btn)] border border-border bg-surface-2 px-3 text-sm text-foreground disabled:opacity-50"
          >
            <option value="">Selecione…</option>
            {eligiblePros.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <Input
          label="Cliente"
          placeholder="Nome do cliente"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
        />
        <Input
          label="Telefone (opcional)"
          placeholder="(11) 90000-0000"
          value={customerPhone}
          onChange={(e) => setCustomerPhone(e.target.value)}
        />
      </div>

      {/* Horários livres + encaixe manual */}
      {serviceId && professionalId && (
        <div className="flex flex-col gap-2 border-t border-border pt-3">
          <Input
            label="Dia"
            type="date"
            min={today()}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="max-w-[12rem]"
          />
          {loadingSlots && (
            <p className="text-sm text-muted">Buscando horários livres…</p>
          )}
          {!loadingSlots && proSlots && proSlots.slots.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {proSlots.slots.map((iso) => (
                <button
                  key={iso}
                  type="button"
                  onClick={() => {
                    setSlot(iso);
                    setManualTime('');
                  }}
                  className={`rounded-[var(--radius-btn)] border px-3 py-1.5 text-sm transition-colors ${
                    slot === iso
                      ? 'border-accent bg-accent text-accent-foreground'
                      : 'border-border text-foreground hover:border-accent'
                  }`}
                >
                  {hhmm(iso)}
                </button>
              ))}
            </div>
          )}
          {!loadingSlots && proSlots && proSlots.slots.length === 0 && (
            <p className="text-sm text-muted">
              Sem horários livres neste dia — use o encaixe manual abaixo.
            </p>
          )}
          <div className="flex flex-wrap items-end gap-2">
            <Input
              label="Encaixe (horário manual)"
              type="datetime-local"
              value={manualTime}
              onChange={(e) => {
                setManualTime(e.target.value);
                setSlot('');
              }}
            />
          </div>
        </div>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}

      <div>
        <Button onClick={submit} loading={busy} className="self-start">
          Agendar
        </Button>
      </div>
    </Card>
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
        <AppointmentBadge status={a.status} />
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
            className="text-danger"
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
