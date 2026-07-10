'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  PricingType,
  UserRole,
  type CreateServiceDto,
  type PricingType as PricingTypeT,
  type ProfessionalResponseDto,
  type ServiceResponseDto,
  type UpdateServiceDto,
} from '@repo/shared';
import { useAuth } from '../../../lib/auth-context';
import { Button } from '../../../components/ui/button';
import { Card, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { ActiveBadge } from '../../../components/ui/badge';

const PRICING_LABEL: Record<PricingTypeT, string> = {
  [PricingType.FIXED]: 'Preço fixo',
  [PricingType.STARTING_AT]: 'A partir de',
  [PricingType.QUOTE]: 'Sob orçamento',
};

/** centavos → "R$ 0,00". */
function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

/** Campos editáveis compartilhados entre criar e editar. */
interface ServiceForm {
  name: string;
  durationMinutes: number;
  priceReais: string; // string para o input controlado
  pricingType: PricingTypeT;
  professionalIds: string[];
  description: string;
}

const EMPTY_FORM: ServiceForm = {
  name: '',
  durationMinutes: 30,
  priceReais: '',
  pricingType: PricingType.FIXED,
  professionalIds: [],
  description: '',
};

function formToDto(f: ServiceForm): CreateServiceDto {
  const priceCents = Math.round(parseFloat(f.priceReais || '0') * 100) || 0;
  return {
    name: f.name.trim(),
    durationMinutes: f.durationMinutes,
    priceCents,
    pricingType: f.pricingType,
    professionalIds: f.professionalIds,
    ...(f.description.trim() ? { description: f.description.trim() } : {}),
  };
}

export default function ServicosPage() {
  const { user, loading, authFetch } = useAuth();
  const router = useRouter();

  const [services, setServices] = useState<ServiceResponseDto[] | null>(null);
  const [professionals, setProfessionals] = useState<ProfessionalResponseDto[]>(
    [],
  );
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<ServiceForm>(EMPTY_FORM);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    try {
      const [svc, pros] = await Promise.all([
        authFetch<ServiceResponseDto[]>('/services'),
        authFetch<ProfessionalResponseDto[]>('/professionals'),
      ]);
      setServices(svc);
      setProfessionals(pros);
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
    if (form.name.trim().length < 2) return;
    setCreating(true);
    setError(null);
    try {
      await authFetch('/services', { method: 'POST', body: formToDto(form) });
      setForm(EMPTY_FORM);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar serviço.');
    } finally {
      setCreating(false);
    }
  }

  function patchForm(patch: Partial<ServiceForm>) {
    setForm((f) => ({ ...f, ...patch }));
  }

  function toggleProfessional(id: string) {
    setForm((f) => ({
      ...f,
      professionalIds: f.professionalIds.includes(id)
        ? f.professionalIds.filter((p) => p !== id)
        : [...f.professionalIds, id],
    }));
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
          Serviços
        </h1>
      </header>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-[24rem_1fr] lg:items-start">
        {/* Novo serviço */}
        <Card className="lg:sticky lg:top-6">
          <CardTitle className="text-base">Adicionar serviço</CardTitle>
          <form onSubmit={handleCreate} className="mt-3 flex flex-col gap-3">
          <Input
            label="Nome"
            placeholder="Ex: Corte masculino"
            value={form.name}
            onChange={(e) => patchForm({ name: e.target.value })}
            required
            minLength={2}
            maxLength={120}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Duração (min)"
              type="number"
              min={5}
              max={600}
              step={5}
              value={form.durationMinutes}
              onChange={(e) =>
                patchForm({ durationMinutes: Number(e.target.value) })
              }
            />
            <Input
              label="Preço (R$)"
              type="number"
              min={0}
              step="0.01"
              placeholder="0,00"
              value={form.priceReais}
              onChange={(e) => patchForm({ priceReais: e.target.value })}
              disabled={form.pricingType === PricingType.QUOTE}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">
              Precificação
            </label>
            <select
              value={form.pricingType}
              onChange={(e) =>
                patchForm({ pricingType: e.target.value as PricingTypeT })
              }
              className="h-11 w-full rounded-[var(--radius-btn)] border border-border bg-surface-2 px-3 text-sm text-foreground"
            >
              {Object.values(PricingType).map((pt) => (
                <option key={pt} value={pt}>
                  {PRICING_LABEL[pt]}
                </option>
              ))}
            </select>
          </div>

          {professionals.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-foreground">
                Profissionais que realizam
              </span>
              <div className="flex flex-wrap gap-2">
                {professionals.map((pro) => {
                  const checked = form.professionalIds.includes(pro.id);
                  return (
                    <button
                      key={pro.id}
                      type="button"
                      onClick={() => toggleProfessional(pro.id)}
                      className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                        checked
                          ? 'border-accent bg-accent/15 text-accent'
                          : 'border-border text-muted hover:text-foreground'
                      }`}
                    >
                      {pro.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <Input
            label="Descrição (opcional)"
            placeholder="Detalhes do serviço"
            value={form.description}
            onChange={(e) => patchForm({ description: e.target.value })}
            maxLength={500}
          />
          <Button
            type="submit"
            loading={creating}
            disabled={form.name.trim().length < 2}
            className="self-start"
          >
            Adicionar
          </Button>
        </form>
      </Card>

        {/* Lista */}
        <div className="flex flex-col gap-3">
          {services?.length === 0 && (
            <p className="text-sm text-muted">Nenhum serviço cadastrado ainda.</p>
          )}
          {services?.map((s) => (
            <ServiceCard
              key={s.id}
              service={s}
              professionals={professionals}
              authFetch={authFetch}
              onChanged={load}
              onError={setError}
            />
          ))}
        </div>
      </div>
    </main>
  );
}

/** Card de serviço: exibe resumo, permite editar, ativar/desativar e excluir. */
function ServiceCard({
  service: s,
  professionals,
  authFetch,
  onChanged,
  onError,
}: {
  service: ServiceResponseDto;
  professionals: ProfessionalResponseDto[];
  authFetch: <T>(
    path: string,
    opts?: { method?: string; body?: unknown },
  ) => Promise<T>;
  onChanged: () => Promise<void>;
  onError: (msg: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ServiceForm>(() => ({
    name: s.name,
    durationMinutes: s.durationMinutes,
    priceReais: (s.priceCents / 100).toFixed(2),
    pricingType: s.pricingType,
    professionalIds: s.professionalIds,
    description: s.description ?? '',
  }));

  function patchForm(patch: Partial<ServiceForm>) {
    setForm((f) => ({ ...f, ...patch }));
  }

  async function save() {
    setSaving(true);
    try {
      const dto: UpdateServiceDto = formToDto(form);
      await authFetch(`/services/${s.id}`, { method: 'PATCH', body: dto });
      await onChanged();
      setEditing(false);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive() {
    onError('');
    try {
      await authFetch(`/services/${s.id}`, {
        method: 'PATCH',
        body: { active: !s.active },
      });
      await onChanged();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Erro ao atualizar.');
    }
  }

  async function remove() {
    if (!window.confirm(`Excluir o serviço "${s.name}"?`)) return;
    try {
      await authFetch(`/services/${s.id}`, { method: 'DELETE' });
      await onChanged();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Erro ao excluir.');
    }
  }

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <CardTitle className="text-base">{s.name}</CardTitle>
          <p className="mt-1 text-xs text-muted">
            {s.durationMinutes} min ·{' '}
            {s.pricingType === PricingType.QUOTE
              ? PRICING_LABEL[s.pricingType]
              : `${s.pricingType === PricingType.STARTING_AT ? 'A partir de ' : ''}${formatBRL(s.priceCents)}`}
            {s.professionalIds.length > 0 &&
              ` · ${s.professionalIds.length} profissional(is)`}
          </p>
        </div>
        <ActiveBadge active={s.active} />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setEditing((v) => !v)}
        >
          {editing ? 'Fechar' : 'Editar'}
        </Button>
        <Button size="sm" variant="ghost" onClick={toggleActive}>
          {s.active ? 'Desativar' : 'Ativar'}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-danger"
          onClick={remove}
        >
          Excluir
        </Button>
      </div>

      {editing && (
        <div className="mt-1 flex flex-col gap-3 border-t border-border pt-3">
          <Input
            label="Nome"
            value={form.name}
            onChange={(e) => patchForm({ name: e.target.value })}
            minLength={2}
            maxLength={120}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Duração (min)"
              type="number"
              min={5}
              max={600}
              step={5}
              value={form.durationMinutes}
              onChange={(e) =>
                patchForm({ durationMinutes: Number(e.target.value) })
              }
            />
            <Input
              label="Preço (R$)"
              type="number"
              min={0}
              step="0.01"
              value={form.priceReais}
              onChange={(e) => patchForm({ priceReais: e.target.value })}
              disabled={form.pricingType === PricingType.QUOTE}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">
              Precificação
            </label>
            <select
              value={form.pricingType}
              onChange={(e) =>
                patchForm({ pricingType: e.target.value as PricingTypeT })
              }
              className="h-11 w-full rounded-[var(--radius-btn)] border border-border bg-surface-2 px-3 text-sm text-foreground"
            >
              {Object.values(PricingType).map((pt) => (
                <option key={pt} value={pt}>
                  {PRICING_LABEL[pt]}
                </option>
              ))}
            </select>
          </div>
          {professionals.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-foreground">
                Profissionais que realizam
              </span>
              <div className="flex flex-wrap gap-2">
                {professionals.map((pro) => {
                  const checked = form.professionalIds.includes(pro.id);
                  return (
                    <button
                      key={pro.id}
                      type="button"
                      onClick={() =>
                        patchForm({
                          professionalIds: checked
                            ? form.professionalIds.filter((p) => p !== pro.id)
                            : [...form.professionalIds, pro.id],
                        })
                      }
                      className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                        checked
                          ? 'border-accent bg-accent/15 text-accent'
                          : 'border-border text-muted hover:text-foreground'
                      }`}
                    >
                      {pro.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <Button size="sm" loading={saving} onClick={save} className="self-start">
            Salvar alterações
          </Button>
        </div>
      )}
    </Card>
  );
}
