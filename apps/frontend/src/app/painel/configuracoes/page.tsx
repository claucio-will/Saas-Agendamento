'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  UserRole,
  type MyTenantResponseDto,
  type UpdateMyTenantDto,
} from '@repo/shared';
import { useAuth } from '../../../lib/auth-context';
import { ESTABLISHMENT_LABEL, STATUS_LABEL } from '../../../lib/labels';
import { Button } from '../../../components/ui/button';
import { Card, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';

const TIMEZONES = [
  'America/Sao_Paulo',
  'America/Bahia',
  'America/Fortaleza',
  'America/Recife',
  'America/Belem',
  'America/Manaus',
  'America/Cuiaba',
  'America/Campo_Grande',
  'America/Rio_Branco',
  'America/Noronha',
];

const SLOT_OPTIONS = [10, 15, 20, 30, 60];

const MIN_ADVANCE_OPTIONS = [
  { value: 0, label: 'Sem antecedência' },
  { value: 30, label: '30 minutos' },
  { value: 60, label: '1 hora' },
  { value: 120, label: '2 horas' },
  { value: 1440, label: '1 dia' },
];

interface FormState {
  name: string;
  phone: string;
  addressLine: string;
  city: string;
  state: string;
  postalCode: string;
  timezone: string;
  minAdvanceMinutes: number;
  maxAdvanceDays: number;
  slotIntervalMinutes: number;
}

function toForm(t: MyTenantResponseDto): FormState {
  return {
    name: t.name,
    phone: t.phone ?? '',
    addressLine: t.addressLine ?? '',
    city: t.city ?? '',
    state: t.state ?? '',
    postalCode: t.postalCode ?? '',
    timezone: t.timezone,
    minAdvanceMinutes: t.minAdvanceMinutes,
    maxAdvanceDays: t.maxAdvanceDays,
    slotIntervalMinutes: t.slotIntervalMinutes,
  };
}

export default function ConfiguracoesPage() {
  const { user, loading, authFetch } = useAuth();
  const router = useRouter();

  const [tenant, setTenant] = useState<MyTenantResponseDto | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    try {
      const t = await authFetch<MyTenantResponseDto>('/tenants/me/settings');
      setTenant(t);
      setForm(toForm(t));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar.');
    }
  }, [authFetch]);

  useEffect(() => {
    if (loading) return;
    if (!user) return router.replace('/login');
    if (user.role !== UserRole.TENANT_ADMIN) return router.replace('/');
    void load();
  }, [loading, user, router, load]);

  function patch(p: Partial<FormState>) {
    setForm((f) => (f ? { ...f, ...p } : f));
    setSaved(false);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const dto: UpdateMyTenantDto = {
        name: form.name.trim(),
        phone: form.phone.trim() || null,
        addressLine: form.addressLine.trim() || null,
        city: form.city.trim() || null,
        state: form.state.trim() || null,
        postalCode: form.postalCode.trim() || null,
        timezone: form.timezone,
        minAdvanceMinutes: form.minAdvanceMinutes,
        maxAdvanceDays: form.maxAdvanceDays,
        slotIntervalMinutes: form.slotIntervalMinutes,
      };
      const updated = await authFetch<MyTenantResponseDto>(
        '/tenants/me/settings',
        { method: 'PATCH', body: dto },
      );
      setTenant(updated);
      setForm(toForm(updated));
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  if (loading || !user || user.role !== UserRole.TENANT_ADMIN || !form || !tenant) {
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
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="mt-1 text-sm text-muted">
          Dados do estabelecimento e regras da agenda.
        </p>
      </header>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        {/* Estabelecimento */}
        <Card className="flex flex-col gap-3">
          <CardTitle className="text-base">Estabelecimento</CardTitle>
          <Input
            label="Nome"
            value={form.name}
            onChange={(e) => patch({ name: e.target.value })}
            minLength={2}
            maxLength={120}
            required
          />
          <div className="grid gap-2 rounded-xl border border-border bg-background p-3 text-sm sm:grid-cols-3">
            <Info label="Link público" value={`/b/${tenant.slug}`} />
            <Info
              label="Tipo"
              value={ESTABLISHMENT_LABEL[tenant.establishmentType]}
            />
            <Info label="Assinatura" value={STATUS_LABEL[tenant.status]} />
          </div>
        </Card>

        {/* Contato e endereço */}
        <Card className="flex flex-col gap-3">
          <CardTitle className="text-base">Contato e endereço</CardTitle>
          <Input
            label="Telefone"
            value={form.phone}
            onChange={(e) => patch({ phone: e.target.value })}
            placeholder="(11) 90000-0000"
            maxLength={20}
          />
          <Input
            label="Endereço"
            value={form.addressLine}
            onChange={(e) => patch({ addressLine: e.target.value })}
            placeholder="Rua Exemplo, 123"
            maxLength={160}
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Input
              label="Cidade"
              value={form.city}
              onChange={(e) => patch({ city: e.target.value })}
              maxLength={80}
            />
            <Input
              label="UF"
              value={form.state}
              onChange={(e) => patch({ state: e.target.value })}
              maxLength={40}
            />
            <Input
              label="CEP"
              value={form.postalCode}
              onChange={(e) => patch({ postalCode: e.target.value })}
              maxLength={12}
            />
          </div>
        </Card>

        {/* Regras de agenda */}
        <Card className="flex flex-col gap-3">
          <CardTitle className="text-base">Regras da agenda</CardTitle>
          <Select
            label="Fuso horário"
            value={form.timezone}
            onChange={(v) => patch({ timezone: v })}
            options={TIMEZONES.map((tz) => ({ value: tz, label: tz }))}
          />
          <Select
            label="Intervalo entre horários"
            value={String(form.slotIntervalMinutes)}
            onChange={(v) => patch({ slotIntervalMinutes: Number(v) })}
            options={SLOT_OPTIONS.map((m) => ({
              value: String(m),
              label: `${m} minutos`,
            }))}
          />
          <Select
            label="Antecedência mínima para agendar"
            value={String(form.minAdvanceMinutes)}
            onChange={(v) => patch({ minAdvanceMinutes: Number(v) })}
            options={MIN_ADVANCE_OPTIONS.map((o) => ({
              value: String(o.value),
              label: o.label,
            }))}
          />
          <Input
            label="Antecedência máxima (dias)"
            type="number"
            min={1}
            max={365}
            value={form.maxAdvanceDays}
            onChange={(e) =>
              patch({ maxAdvanceDays: Number(e.target.value) })
            }
          />
        </Card>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={saving}>
            Salvar alterações
          </Button>
          {saved && (
            <span className="text-sm text-green-600">Salvo! ✓</span>
          )}
        </div>
      </form>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className="font-medium text-foreground">{value}</p>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-[var(--radius-btn)] border border-border bg-surface px-3 text-sm text-foreground"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
