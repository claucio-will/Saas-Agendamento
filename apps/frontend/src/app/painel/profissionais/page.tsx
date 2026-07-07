'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  UserRole,
  type CreateProfessionalDto,
  type ProfessionalResponseDto,
  type SetWorkingHoursDto,
} from '@repo/shared';
import { useAuth } from '../../../lib/auth-context';
import { Button } from '../../../components/ui/button';
import { Card, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';

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
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-8">
      <header>
        <p className="text-sm font-medium text-accent">Painel do dono</p>
        <h1 className="text-2xl font-bold text-foreground">Profissionais</h1>
      </header>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Novo profissional */}
      <Card>
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
    </main>
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
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            p.active
              ? 'bg-green-500/15 text-green-600'
              : 'bg-muted/20 text-muted'
          }`}
        >
          {p.active ? 'Ativo' : 'Inativo'}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => setOpen((v) => !v)}>
          {open ? 'Fechar jornada' : 'Editar jornada'}
        </Button>
        <Button size="sm" variant="ghost" onClick={onToggleActive}>
          {p.active ? 'Desativar' : 'Ativar'}
        </Button>
      </div>

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
                  className="h-9 rounded-[var(--radius-btn)] border border-border bg-surface px-2 text-sm text-foreground disabled:opacity-50"
                />
                <span className="text-muted">até</span>
                <input
                  type="time"
                  value={shift.end}
                  disabled={!shift.enabled}
                  onChange={(e) => updateShift(weekday, { end: e.target.value })}
                  className="h-9 rounded-[var(--radius-btn)] border border-border bg-surface px-2 text-sm text-foreground disabled:opacity-50"
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
