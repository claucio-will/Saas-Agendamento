'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole, type CustomerSummaryDto } from '@repo/shared';
import { useAuth } from '../../../lib/auth-context';
import { Card, CardTitle } from '../../../components/ui/card';

function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function ClientesPage() {
  const { user, loading, authFetch } = useAuth();
  const router = useRouter();
  const [customers, setCustomers] = useState<CustomerSummaryDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setCustomers(await authFetch<CustomerSummaryDto[]>('/customers'));
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
      <header>
        <p className="text-sm font-medium text-accent">Painel do dono</p>
        <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
        <p className="mt-1 text-sm text-muted">
          Todos que já agendaram no seu estabelecimento, do mais recente ao mais
          antigo.
        </p>
      </header>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="grid gap-3 sm:grid-cols-2">
        {customers?.length === 0 && (
          <p className="text-sm text-muted">
            Nenhum cliente ainda. Eles aparecem aqui após o primeiro
            agendamento.
          </p>
        )}
        {customers?.map((c) => (
          <Card key={c.email} className="flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {c.name.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-base">{c.name}</CardTitle>
                <p className="truncate text-xs text-muted">
                  {c.email}
                  {c.phone ? ` · ${c.phone}` : ''}
                </p>
              </div>
              <span className="whitespace-nowrap text-xs text-muted">
                Última: {formatDate(c.lastVisit)}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 border-t border-border pt-3 text-xs">
              <Stat label="Agendamentos" value={String(c.totalAppointments)} />
              <Stat label="Concluídos" value={String(c.completedAppointments)} />
              <Stat label="Gasto total" value={formatBRL(c.totalSpentCents)} />
            </div>
          </Card>
        ))}
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-background px-3 py-1.5">
      <span className="text-muted">{label}: </span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}
