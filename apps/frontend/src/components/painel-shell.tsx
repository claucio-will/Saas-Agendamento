'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { UserRole, type TenantResponseDto } from '@repo/shared';
import { useAuth } from '../lib/auth-context';
import { AppShell, type ShellLink } from './app-shell';
import {
  IconCalendar,
  IconCog,
  IconHome,
  IconScissors,
  IconUser,
  IconUsers,
  IconWallet,
} from './icons';

const LINKS: ShellLink[] = [
  { href: '/painel', label: 'Início', icon: <IconHome /> },
  { href: '/painel/agenda', label: 'Agenda', icon: <IconCalendar /> },
  { href: '/painel/servicos', label: 'Serviços', icon: <IconScissors /> },
  { href: '/painel/profissionais', label: 'Profissionais', icon: <IconUsers /> },
  { href: '/painel/clientes', label: 'Histórico de clientes', icon: <IconUser /> },
  { href: '/painel/assinatura', label: 'Assinatura', icon: <IconWallet /> },
  { href: '/painel/configuracoes', label: 'Configurações', icon: <IconCog /> },
];

/** Shell da área do dono: sidebar do estabelecimento + conteúdo. */
export function PainelShell({ children }: { children: ReactNode }) {
  const { user, authFetch } = useAuth();
  const [tenant, setTenant] = useState<TenantResponseDto | null>(null);

  useEffect(() => {
    if (!user || user.role !== UserRole.TENANT_ADMIN) return;
    authFetch<TenantResponseDto>('/tenants/me')
      .then(setTenant)
      .catch(() => undefined);
  }, [user, authFetch]);

  // Fora do papel de dono, a própria página cuida do redirecionamento.
  if (!user || user.role !== UserRole.TENANT_ADMIN) return <>{children}</>;

  return (
    <AppShell
      homeHref="/painel"
      brand={{
        label: tenant?.name ?? 'Meu estabelecimento',
        initial: (tenant?.name ?? 'A').charAt(0).toUpperCase(),
        variant: 'primary',
      }}
      publicUrl={tenant ? `/b/${tenant.slug}` : undefined}
      links={LINKS}
    >
      {children}
    </AppShell>
  );
}
