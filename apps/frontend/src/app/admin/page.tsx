'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  TenantStatus,
  UserRole,
  type TenantResponseDto,
  type TenantStatus as TenantStatusType,
} from '@repo/shared';
import { useAuth } from '../../lib/auth-context';
import { ThemeToggle } from '../../components/theme-toggle';
import { Button } from '../../components/ui/button';
import { Card, CardTitle } from '../../components/ui/card';

const STATUS_LABEL: Record<TenantStatusType, string> = {
  [TenantStatus.TRIAL]: 'Trial',
  [TenantStatus.ACTIVE]: 'Ativo',
  [TenantStatus.SUSPENDED]: 'Suspenso',
  [TenantStatus.CANCELLED]: 'Cancelado',
};

const STATUS_COLOR: Record<TenantStatusType, string> = {
  [TenantStatus.TRIAL]: 'bg-accent/20 text-accent',
  [TenantStatus.ACTIVE]: 'bg-green-500/15 text-green-600',
  [TenantStatus.SUSPENDED]: 'bg-red-500/15 text-red-500',
  [TenantStatus.CANCELLED]: 'bg-muted/20 text-muted',
};

export default function AdminPage() {
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
    if (!user) {
      router.replace('/login');
      return;
    }
    if (user.role !== UserRole.SUPER_ADMIN) {
      router.replace('/');
      return;
    }
    void load();
  }, [loading, user, router, load]);

  async function changeStatus(id: string, status: TenantStatusType) {
    await authFetch(`/tenants/${id}/status`, {
      method: 'PATCH',
      body: { status },
    });
    await load();
  }

  if (loading || !user || user.role !== UserRole.SUPER_ADMIN) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-transparent" />
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-8">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-accent">Plataforma</p>
          <h1 className="text-2xl font-bold text-foreground">Super Admin</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/" className="text-sm text-muted hover:text-foreground">
            Início
          </Link>
          <ThemeToggle />
        </div>
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
                  /b/{t.slug} · {t.establishmentType}
                </p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLOR[t.status]}`}
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
            </div>
          </Card>
        ))}
      </div>
    </main>
  );
}
