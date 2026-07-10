'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  UserRole,
  type CreateProfessionalDto,
  type CreateTimeBlockDto,
  type ProfessionalResponseDto,
  type SetWorkingHoursDto,
  type TimeBlockResponseDto,
} from '@repo/shared';
import { useAuth } from '../../../lib/auth-context';
import { Button } from '../../../components/ui/button';
import { Card, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { ActiveBadge } from '../../../components/ui/badge';

const WEEKDAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

/** minutos-desde-meia-noite → "HH:MM" para <input type="time">. */
function minutesToTime(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** "HH:MM" → minutos-desde-meia-noite. */
function timeToMinutes(value: string): number {
  const [h, m] = value.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/** Estado de edição da jornada semanal: um intervalo por dia (caso comum). */
interface DayShift {
  enabled: boolean;
  start: string; // "HH:MM"
  end: string; // "HH:MM"
}

const DEFAULT_SHIFT: DayShift = { enabled: false, start: '09:00', end: '18:00' };

/** Deriva os 7 dias a partir da resposta (pega o 1º intervalo de cada dia). */
function shiftsFromProfessional(p: ProfessionalResponseDto): DayShift[] {
  return WEEKDAYS.map((_, weekday) => {
    const wh = p.workingHours.find((h) => h.weekday === weekday);
    return wh
      ? {
          enabled: true,
          start: minutesToTime(wh.startMinute),
          end: minutesToTime(wh.endMinute),
        }
      : { ...DEFAULT_SHIFT };
  });
}

export default function ProfissionaisPage() {
  const { user, loading, authFetch } = useAuth();
  const router = useRouter();

  const [professionals, setProfessionals] = useState<
    ProfessionalResponseDto[] | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  // Formulário de novo profissional.
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    try {
      setProfessionals(
        await authFetch<ProfessionalResponseDto[]>('/professionals'),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar.');
    }
  }, [authFetch]);

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

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) return;
    setCreating(true);
    setError(null);
    try {
      const dto: CreateProfessionalDto = {
        name: name.trim(),
        ...(bio.trim() ? { bio: bio.trim() } : {}),
      };
      await authFetch('/professionals', { method: 'POST', body: dto });
      setName('');
      setBio('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar.');
    } finally {
      setCreating(false);
    }
  }

  async function toggleActive(p: ProfessionalResponseDto) {
    setError(null);
    try {
      await authFetch(`/professionals/${p.id}`, {
        method: 'PATCH',
        body: { active: !p.active },
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar.');
    }
  }

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
          Profissionais
        </h1>
      </header>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-[22rem_1fr] lg:items-start">
        {/* Novo profissional */}
        <Card className="lg:sticky lg:top-6">
          <CardTitle className="text-base">Adicionar profissional</CardTitle>
          <form onSubmit={handleCreate} className="mt-3 flex flex-col gap-3">
          <Input
            label="Nome"
            placeholder="Ex: João Silva"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
            maxLength={120}
          />
          <Input
            label="Bio (opcional)"
            placeholder="Ex: Barbeiro especialista em degradê"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={500}
          />
          <Button
            type="submit"
            loading={creating}
            disabled={name.trim().length < 2}
            className="self-start"
          >
            Adicionar
          </Button>
        </form>
      </Card>

        {/* Lista */}
        <div className="flex flex-col gap-3">
          {professionals?.length === 0 && (
            <p className="text-sm text-muted">
              Nenhum profissional cadastrado ainda.
            </p>
          )}
          {professionals?.map((p) => (
            <ProfessionalCard
              key={p.id}
              professional={p}
              onToggleActive={() => toggleActive(p)}
              onSaved={load}
              authFetch={authFetch}
              onError={setError}
            />
          ))}
        </div>
      </div>
    </main>
  );
}

/** Formata um intervalo de bloqueio para exibição (dia + horas). */
function formatBlock(startsAt: string, endsAt: string): string {
  const s = new Date(startsAt);
  const e = new Date(endsAt);
  const day = s.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  const hm = (d: Date) =>
    d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${day} · ${hm(s)}–${hm(e)}`;
}

/** Painel de folgas/bloqueios de um profissional (lista + criar + remover). */
function TimeBlocksPanel({
  professionalId,
  authFetch,
  onError,
}: {
  professionalId: string;
  authFetch: <T>(
    path: string,
    opts?: { method?: string; body?: unknown },
  ) => Promise<T>;
  onError: (msg: string) => void;
}) {
  const [blocks, setBlocks] = useState<TimeBlockResponseDto[] | null>(null);
  const [date, setDate] = useState('');
  const [start, setStart] = useState('12:00');
  const [end, setEnd] = useState('13:00');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setBlocks(
        await authFetch<TimeBlockResponseDto[]>(
          `/professionals/${professionalId}/time-blocks`,
        ),
      );
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Erro ao carregar folgas.');
    }
  }, [authFetch, professionalId, onError]);

  useEffect(() => {
    void load();
  }, [load]);

  async function add() {
    if (!date) {
      onError('Escolha o dia da folga.');
      return;
    }
    // date + time (horário local do navegador) → ISO UTC.
    const startsAt = new Date(`${date}T${start}`);
    const endsAt = new Date(`${date}T${end}`);
    if (endsAt <= startsAt) {
      onError('O fim deve ser depois do início.');
      return;
    }
    setBusy(true);
    onError('');
    try {
      const dto: CreateTimeBlockDto = {
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        ...(reason.trim() ? { reason: reason.trim() } : {}),
      };
      await authFetch(`/professionals/${professionalId}/time-blocks`, {
        method: 'POST',
        body: dto,
      });
      setReason('');
      await load();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Erro ao criar folga.');
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setBusy(true);
    onError('');
    try {
      await authFetch(`/time-blocks/${id}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Erro ao remover folga.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-1 flex flex-col gap-3 border-t border-border pt-3">
      <p className="text-sm font-medium text-foreground">
        Folgas e bloqueios (almoço, folga, imprevisto)
      </p>

      {/* Lista */}
      {blocks === null ? (
        <p className="text-sm text-muted">Carregando…</p>
      ) : blocks.length === 0 ? (
        <p className="text-sm text-muted">Nenhum bloqueio futuro.</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {blocks.map((b) => (
            <li
              key={b.id}
              className="flex items-center justify-between gap-2 text-sm"
            >
              <span className="text-foreground">
                {formatBlock(b.startsAt, b.endsAt)}
                {b.reason ? (
                  <span className="text-muted"> · {b.reason}</span>
                ) : null}
              </span>
              <button
                type="button"
                onClick={() => remove(b.id)}
                disabled={busy}
                className="text-xs text-danger hover:underline disabled:opacity-50"
              >
                Remover
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Novo bloqueio */}
      <div className="flex flex-wrap items-end gap-2">
        <Input
          label="Dia"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="max-w-[10rem]"
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Início</label>
          <input
            type="time"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="h-11 rounded-[var(--radius-btn)] border border-border bg-surface-2 px-2 text-sm text-foreground"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Fim</label>
          <input
            type="time"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="h-11 rounded-[var(--radius-btn)] border border-border bg-surface-2 px-2 text-sm text-foreground"
          />
        </div>
        <Input
          label="Motivo (opcional)"
          placeholder="Almoço"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="max-w-[12rem]"
        />
        <Button size="sm" loading={busy} onClick={add}>
          Adicionar
        </Button>
      </div>
    </div>
  );
}

/** Card de um profissional: status + editor de jornada semanal. */
function ProfessionalCard({
  professional: p,
  onToggleActive,
  onSaved,
  authFetch,
  onError,
}: {
  professional: ProfessionalResponseDto;
  onToggleActive: () => void;
  onSaved: () => Promise<void>;
  authFetch: <T>(
    path: string,
    opts?: { method?: string; body?: unknown },
  ) => Promise<T>;
  onError: (msg: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [blocksOpen, setBlocksOpen] = useState(false);
  const [shifts, setShifts] = useState<DayShift[]>(() =>
    shiftsFromProfessional(p),
  );
  const [saving, setSaving] = useState(false);

  function updateShift(weekday: number, patch: Partial<DayShift>) {
    setShifts((prev) =>
      prev.map((s, i) => (i === weekday ? { ...s, ...patch } : s)),
    );
  }

  async function saveWorkingHours() {
    setSaving(true);
    try {
      const items: SetWorkingHoursDto['items'] = shifts
        .map((s, weekday) => ({ s, weekday }))
        .filter(({ s }) => s.enabled)
        .map(({ s, weekday }) => ({
          weekday,
          startMinute: timeToMinutes(s.start),
          endMinute: timeToMinutes(s.end),
        }));

      // Valida localmente (fim > início) antes de enviar.
      const invalid = items.find((i) => i.endMinute <= i.startMinute);
      if (invalid) {
        onError(
          `${WEEKDAYS[invalid.weekday]}: o fim deve ser depois do início.`,
        );
        return;
      }

      await authFetch(`/professionals/${p.id}/working-hours`, {
        method: 'PUT',
        body: { items } satisfies SetWorkingHoursDto,
      });
      await onSaved();
      setOpen(false);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Erro ao salvar jornada.');
    } finally {
      setSaving(false);
    }
  }

  const activeDays = p.workingHours.length;

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <CardTitle className="text-base">{p.name}</CardTitle>
          {p.bio && <p className="text-xs text-muted">{p.bio}</p>}
          <p className="mt-1 text-xs text-muted">
            {activeDays > 0
              ? `Jornada em ${activeDays} dia(s) da semana`
              : 'Sem jornada definida'}
          </p>
        </div>
        <ActiveBadge active={p.active} />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => setOpen((v) => !v)}>
          {open ? 'Fechar jornada' : 'Editar jornada'}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setBlocksOpen((v) => !v)}
        >
          {blocksOpen ? 'Fechar folgas' : 'Folgas e bloqueios'}
        </Button>
        <Button size="sm" variant="ghost" onClick={onToggleActive}>
          {p.active ? 'Desativar' : 'Ativar'}
        </Button>
      </div>

      {blocksOpen && (
        <TimeBlocksPanel
          professionalId={p.id}
          authFetch={authFetch}
          onError={onError}
        />
      )}

      {open && (
        <div className="mt-1 flex flex-col gap-2 border-t border-border pt-3">
          {WEEKDAYS.map((label, weekday) => {
            const shift = shifts[weekday]!;
            return (
              <div
                key={weekday}
                className="flex flex-wrap items-center gap-2 text-sm"
              >
                <label className="flex w-28 items-center gap-2">
                  <input
                    type="checkbox"
                    checked={shift.enabled}
                    onChange={(e) =>
                      updateShift(weekday, { enabled: e.target.checked })
                    }
                    className="h-4 w-4 accent-accent"
                  />
                  <span className="text-foreground">{label}</span>
                </label>
                <input
                  type="time"
                  value={shift.start}
                  disabled={!shift.enabled}
                  onChange={(e) =>
                    updateShift(weekday, { start: e.target.value })
                  }
                  className="h-9 rounded-[var(--radius-btn)] border border-border bg-surface-2 px-2 text-sm text-foreground disabled:opacity-50"
                />
                <span className="text-muted">até</span>
                <input
                  type="time"
                  value={shift.end}
                  disabled={!shift.enabled}
                  onChange={(e) => updateShift(weekday, { end: e.target.value })}
                  className="h-9 rounded-[var(--radius-btn)] border border-border bg-surface-2 px-2 text-sm text-foreground disabled:opacity-50"
                />
              </div>
            );
          })}
          <Button
            size="sm"
            loading={saving}
            onClick={saveWorkingHours}
            className="mt-2 self-start"
          >
            Salvar jornada
          </Button>
        </div>
      )}
    </Card>
  );
}
