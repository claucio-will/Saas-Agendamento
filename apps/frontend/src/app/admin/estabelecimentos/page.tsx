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
import { ESTABLISHMENT_LABEL, STATUS_COLOR, STATUS_LABEL } from '../../../lib/labels';
import { Button } from '../../../components/ui/button';
import { Card, CardTitle } from '../../../components/ui/card';

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
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-4 py-8">
      <header>
        <p className="text-sm font-medium text-accent">Plataforma</p>
        <h1 className="text-2xl font-bold text-foreground">Estabelecimentos</h1>
        <p className="mt-1 text-sm text-muted">
          Todos os estabelecimentos da plataforma. Você gerencia o status da
          assinatura de cada um.
        </p>
      </header>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex flex-col gap-3">
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
              <span
                className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLOR[t.status]}`}
              >
                {STATUS_LABEL[t.status]}
              </span>
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
