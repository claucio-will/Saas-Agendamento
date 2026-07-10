'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  TenantStatus,
  UserRole,
  type TenantResponseDto,
  type TenantStatus as TenantStatusType,
} from '@repo/shared';
import { useAuth } from '../../../lib/auth-context';
import { ESTABLISHMENT_LABEL } from '../../../lib/labels';
import { Button } from '../../../components/ui/button';
import { Card, CardTitle } from '../../../components/ui/card';
import { TenantBadge } from '../../../components/ui/badge';

export default function EstabelecimentosPage() {
  const { user, loading, authFetch } = useAuth();
  const router = useRouter();
  const [tenants, setTenants] = useState<TenantResponseDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setTenants(await authFetch<TenantResponseDto[]>('/tenants'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar.');
    }
  }, [authFetch]);

  useEffect(() => {
    if (loading) return;
    if (!user) return router.replace('/login');
    if (user.role !== UserRole.SUPER_ADMIN) return router.replace('/');
    void load();
  }, [loading, user, router, load]);

  async function changeStatus(id: string, status: TenantStatusType) {
    setError(null);
    try {
      await authFetch(`/tenants/${id}/status`, {
        method: 'PATCH',
        body: { status },
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar.');
    }
  }

  if (loading || !user || user.role !== UserRole.SUPER_ADMIN) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-transparent" />
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-8">
      <header className="flex flex-col gap-1">
        <p className="text-sm font-medium text-accent">Plataforma</p>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          Estabelecimentos
        </h1>
        <p className="text-sm text-muted">
          Todos os estabelecimentos da plataforma. Você gerencia o status da
          assinatura de cada um.
        </p>
      </header>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="grid gap-3 sm:grid-cols-2">
        {tenants?.length === 0 && (
          <p className="text-sm text-muted">Nenhum estabelecimento ainda.</p>
        )}
        {tenants?.map((t) => (
          <Card key={t.id} className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-base">{t.name}</CardTitle>
                <p className="text-xs text-muted">
                  {ESTABLISHMENT_LABEL[t.establishmentType]} · /b/{t.slug}
                </p>
              </div>
              <TenantBadge status={t.status} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => changeStatus(t.id, TenantStatus.ACTIVE)}
              >
                Ativar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => changeStatus(t.id, TenantStatus.SUSPENDED)}
              >
                Suspender
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => changeStatus(t.id, TenantStatus.CANCELLED)}
              >
                Cancelar
              </Button>
              <a
                href={`/b/${t.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-[var(--radius-btn)] px-3 py-1.5 text-sm font-medium text-muted hover:text-foreground"
              >
                Ver página ↗
              </a>
            </div>
          </Card>
        ))}
      </div>
    </main>
  );
}
