'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  planInfo,
  PLANS,
  TenantStatus,
  UserRole,
  type MyTenantResponseDto,
  type PlanTier,
} from '@repo/shared';
import { useAuth } from '../../../lib/auth-context';
import { Button } from '../../../components/ui/button';
import { Card, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { TenantBadge } from '../../../components/ui/badge';
import { IconCheck } from '../../../components/icons';

function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}
function daysLeft(iso: string | null): number {
  if (!iso) return 0;
  return Math.max(
    0,
    Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000),
  );
}
function longDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export default function AssinaturaPage() {
  const { user, loading, authFetch } = useAuth();
  const router = useRouter();
  const [tenant, setTenant] = useState<MyTenantResponseDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checkout, setCheckout] = useState(false);
  const [changing, setChanging] = useState<PlanTier | null>(null);

  const load = useCallback(async () => {
    try {
      setTenant(await authFetch<MyTenantResponseDto>('/tenants/me/settings'));
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

  async function changePlan(plan: PlanTier) {
    if (plan === tenant?.plan) return;
    setChanging(plan);
    setError(null);
    try {
      setTenant(
        await authFetch<MyTenantResponseDto>('/tenants/me/plan', {
          method: 'PATCH',
          body: { plan },
        }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao trocar plano.');
    } finally {
      setChanging(null);
    }
  }

  if (loading || !user || user.role !== UserRole.TENANT_ADMIN || !tenant) {
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <span
          aria-label="Carregando"
          className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-transparent"
        />
      </main>
    );
  }

  const current = planInfo(tenant.plan);
  const isActive = tenant.status === TenantStatus.ACTIVE;
  const isTrial = tenant.status === TenantStatus.TRIAL;
  const trialDays = daysLeft(tenant.trialEndsAt);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6">
      <header className="flex flex-col gap-1">
        <p className="text-sm font-medium text-accent">Painel do dono</p>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          Assinatura
        </h1>
        <p className="text-sm text-muted">
          Seu plano, período de teste e cobrança do estabelecimento.
        </p>
      </header>

      {error && <p className="text-sm text-danger">{error}</p>}

      {/* Estado atual */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-surface to-accent/5">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/20 blur-3xl"
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <CardTitle>Plano {current.name}</CardTitle>
              <TenantBadge status={tenant.status} />
            </div>
            <p className="text-sm text-muted">
              <span className="text-lg font-bold tabular-nums text-foreground">
                {formatBRL(current.priceCents)}
              </span>{' '}
              /mês
            </p>
            {isTrial && (
              <p className="text-sm text-amber-500">
                {trialDays > 0
                  ? `Teste grátis — faltam ${trialDays} dia${trialDays > 1 ? 's' : ''}.`
                  : 'Seu período de teste terminou. Ative para continuar.'}
              </p>
            )}
            {isActive && tenant.subscribedAt && (
              <p className="text-sm text-emerald-500">
                Assinatura ativa desde {longDate(tenant.subscribedAt)}.
              </p>
            )}
            {tenant.status === TenantStatus.SUSPENDED && (
              <p className="text-sm text-danger">
                Assinatura suspensa. Fale com o suporte da plataforma.
              </p>
            )}
          </div>
          {!isActive && (
            <Button size="lg" onClick={() => setCheckout(true)}>
              Ativar assinatura
            </Button>
          )}
        </div>
      </Card>

      {/* Comparação de planos */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-bold text-foreground">Planos</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {PLANS.map((p) => {
            const isCurrent = p.tier === tenant.plan;
            return (
              <Card
                key={p.tier}
                className={`flex flex-col gap-3 ${
                  isCurrent
                    ? 'border-primary shadow-glow'
                    : p.highlight
                      ? 'border-ring/40'
                      : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="font-bold text-foreground">{p.name}</p>
                  {isCurrent && (
                    <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                      Atual
                    </span>
                  )}
                </div>
                <p className="flex items-baseline gap-1">
                  <span className="text-2xl font-extrabold tabular-nums text-foreground">
                    {formatBRL(p.priceCents)}
                  </span>
                  <span className="text-xs text-muted">/mês</span>
                </p>
                <ul className="flex flex-1 flex-col gap-1.5 text-sm text-muted">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={isCurrent ? 'outline' : 'primary'}
                  disabled={isCurrent}
                  loading={changing === p.tier}
                  onClick={() => changePlan(p.tier)}
                  className="w-full"
                >
                  {isCurrent ? 'Plano atual' : `Mudar para ${p.name}`}
                </Button>
              </Card>
            );
          })}
        </div>
      </section>

      {checkout && (
        <CheckoutModal
          plan={tenant.plan}
          onClose={() => setCheckout(false)}
          onActivated={async (t) => {
            setTenant(t);
            setCheckout(false);
          }}
          authFetch={authFetch}
        />
      )}
    </main>
  );
}

/** Checkout SIMULADO — coleta dados de cartão só visualmente (sem gateway). */
function CheckoutModal({
  plan,
  onClose,
  onActivated,
  authFetch,
}: {
  plan: PlanTier;
  onClose: () => void;
  onActivated: (t: MyTenantResponseDto) => Promise<void>;
  authFetch: <T>(
    path: string,
    opts?: { method?: string; body?: unknown },
  ) => Promise<T>;
}) {
  const info = planInfo(plan);
  const [number, setNumber] = useState('');
  const [name, setName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pay() {
    if (number.replace(/\s/g, '').length < 12) {
      setError('Informe um número de cartão (simulado).');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const t = await authFetch<MyTenantResponseDto>(
        '/tenants/me/subscription/activate',
        { method: 'POST', body: {} },
      );
      await onActivated(t);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao ativar.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Fechar"
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />
      <Card className="relative z-10 flex w-full max-w-md flex-col gap-4">
        <div>
          <CardTitle>Ativar plano {info.name}</CardTitle>
          <p className="mt-1 text-sm text-muted">
            {formatBRL(info.priceCents)}/mês · cobrança simulada (ambiente de
            demonstração — nenhum pagamento real é processado).
          </p>
        </div>

        <Input
          label="Número do cartão"
          inputMode="numeric"
          placeholder="4242 4242 4242 4242"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
        />
        <Input
          label="Nome no cartão"
          placeholder="Como está no cartão"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Validade"
            placeholder="MM/AA"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
          />
          <Input
            label="CVV"
            inputMode="numeric"
            placeholder="123"
            value={cvv}
            onChange={(e) => setCvv(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex items-center justify-between gap-3">
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancelar
          </Button>
          <Button onClick={pay} loading={busy}>
            Pagar {formatBRL(info.priceCents)} e ativar
          </Button>
        </div>
        <p className="text-center text-xs text-muted">
          🔒 Simulação — não insira dados reais de cartão.
        </p>
      </Card>
    </div>
  );
}
