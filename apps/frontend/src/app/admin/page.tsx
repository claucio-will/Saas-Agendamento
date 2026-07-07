'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  TenantStatus,
  UserRole,
  type PlatformOwnerDto,
  type TenantResponseDto,
} from '@repo/shared';
import { useAuth } from '../../lib/auth-context';
import { Card, CardDescription, CardTitle } from '../../components/ui/card';

export default function AdminOverviewPage() {
  const { user, loading, authFetch } = useAuth();
  const router = useRouter();
  const [tenants, setTenants] = useState<TenantResponseDto[] | null>(null);
  const [owners, setOwners] = useState<PlatformOwnerDto[] | null>(null);

  const load = useCallback(async () => {
    const [t, o] = await Promise.all([
      authFetch<TenantResponseDto[]>('/tenants'),
      authFetch<PlatformOwnerDto[]>('/platform/owners'),
    ]);
    setTenants(t);
    setOwners(o);
  }, [authFetch]);

  useEffect(() => {
    if (loading) return;
    if (!user) return router.replace('/login');
    if (user.role !== UserRole.SUPER_ADMIN) return router.replace('/');
    void load().catch(() => undefined);
  }, [loading, user, router, load]);

  if (loading || !user || user.role !== UserRole.SUPER_ADMIN) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-transparent" />
      </main>
    );
  }

  const count = (s: TenantStatus) =>
    tenants?.filter((t) => t.status === s).length ?? 0;

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-4 py-8">
      <header>
        <p className="text-sm font-medium text-accent">Plataforma</p>
        <h1 className="text-2xl font-bold text-foreground">Visão geral</h1>
      </header>

      {/* Quem é quem — deixa a hierarquia do sistema explícita */}
      <Card className="flex flex-col gap-4">
        <div>
          <CardTitle className="text-base">Como o sistema se organiza</CardTitle>
          <CardDescription>
            Você é o <strong className="text-foreground">Admin</strong> da
            plataforma. Você gerencia todos os estabelecimentos e seus donos —
            mas <strong className="text-foreground">não cria</strong>{' '}
            estabelecimentos: os donos se cadastram sozinhos.
          </CardDescription>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
          <HierarchyStep
            icon="⚙️"
            title="Admin (você)"
            desc="Gerencia a plataforma inteira"
            highlight
          />
          <Arrow />
          <HierarchyStep
            icon="🏪"
            title="Donos"
            desc="Cada um administra 1 estabelecimento — os clientes da plataforma"
          />
          <Arrow />
          <HierarchyStep
            icon="🧑"
            title="Clientes finais"
            desc="Agendam nos estabelecimentos"
          />
        </div>
      </Card>

      {/* Números da plataforma */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Stat
          label="Estabelecimentos"
          value={tenants?.length}
          hint={`${count(TenantStatus.ACTIVE)} ativos · ${count(TenantStatus.TRIAL)} em trial · ${count(TenantStatus.SUSPENDED)} suspensos`}
        />
        <Stat
          label="Donos (clientes da plataforma)"
          value={owners?.length}
          hint="Responsáveis pelos estabelecimentos"
        />
      </div>

      {/* Acessos rápidos */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/admin/estabelecimentos" className="group">
          <Card className="h-full transition-colors group-hover:border-accent">
            <CardTitle>Estabelecimentos →</CardTitle>
            <CardDescription>
              Ver todos e gerenciar o status (ativar, suspender, cancelar).
            </CardDescription>
          </Card>
        </Link>
        <Link href="/admin/donos" className="group">
          <Card className="h-full transition-colors group-hover:border-accent">
            <CardTitle>Donos →</CardTitle>
            <CardDescription>
              Ver os donos e qual estabelecimento cada um administra.
            </CardDescription>
          </Card>
        </Link>
      </div>
    </main>
  );
}

function HierarchyStep({
  icon,
  title,
  desc,
  highlight,
}: {
  icon: string;
  title: string;
  desc: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex-1 rounded-xl border p-3 ${
        highlight ? 'border-accent bg-accent/10' : 'border-border bg-background'
      }`}
    >
      <div className="flex items-center gap-2">
        <span aria-hidden>{icon}</span>
        <span className="text-sm font-semibold text-foreground">{title}</span>
      </div>
      <p className="mt-1 text-xs text-muted">{desc}</p>
    </div>
  );
}

function Arrow() {
  return (
    <div
      aria-hidden
      className="flex items-center justify-center text-muted sm:px-1"
    >
      <span className="hidden sm:inline">→</span>
      <span className="sm:hidden">↓</span>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: number | undefined;
  hint: string;
}) {
  return (
    <Card>
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-3xl font-bold text-foreground">
        {value ?? '—'}
      </p>
      <p className="mt-1 text-xs text-muted">{hint}</p>
    </Card>
  );
}
