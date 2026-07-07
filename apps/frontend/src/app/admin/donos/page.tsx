'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole, type PlatformOwnerDto } from '@repo/shared';
import { useAuth } from '../../../lib/auth-context';
import { ESTABLISHMENT_LABEL, STATUS_COLOR, STATUS_LABEL } from '../../../lib/labels';
import { Card, CardTitle } from '../../../components/ui/card';

export default function DonosPage() {
  const { user, loading, authFetch } = useAuth();
  const router = useRouter();
  const [owners, setOwners] = useState<PlatformOwnerDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setOwners(await authFetch<PlatformOwnerDto[]>('/platform/owners'));
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

  if (loading || !user || user.role !== UserRole.SUPER_ADMIN) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-transparent" />
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-8">
      <header>
        <p className="text-sm font-medium text-accent">Plataforma</p>
        <h1 className="text-2xl font-bold text-foreground">Donos</h1>
        <p className="mt-1 text-sm text-muted">
          Os donos são os clientes da plataforma. Cada um administra um
          estabelecimento e se cadastrou sozinho pelo site.
        </p>
      </header>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="grid gap-3 sm:grid-cols-2">
        {owners?.length === 0 && (
          <p className="text-sm text-muted">Nenhum dono cadastrado ainda.</p>
        )}
        {owners?.map((o) => (
          <Card key={o.id} className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {o.name.charAt(0).toUpperCase()}
                </span>
                <div>
                  <CardTitle className="text-base">{o.name}</CardTitle>
                  <p className="text-xs text-muted">
                    {o.email}
                    {o.phone ? ` · ${o.phone}` : ''}
                  </p>
                </div>
              </div>
              {o.tenant && (
                <span
                  className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLOR[o.tenant.status]}`}
                >
                  {STATUS_LABEL[o.tenant.status]}
                </span>
              )}
            </div>

            {o.tenant ? (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    🏪 {o.tenant.name}
                  </p>
                  <p className="text-xs text-muted">
                    {ESTABLISHMENT_LABEL[o.tenant.establishmentType]} · /b/
                    {o.tenant.slug}
                  </p>
                </div>
                <a
                  href={`/b/${o.tenant.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="whitespace-nowrap text-sm text-muted hover:text-foreground"
                >
                  Ver página ↗
                </a>
              </div>
            ) : (
              <p className="text-xs text-muted">Sem estabelecimento vinculado.</p>
            )}
          </Card>
        ))}
      </div>
    </main>
  );
}
