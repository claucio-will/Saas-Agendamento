'use client';

import type { ReactNode } from 'react';
import { UserRole } from '@repo/shared';
import { useAuth } from '../lib/auth-context';
import { AppShell, type ShellLink } from './app-shell';

const LINKS: ShellLink[] = [
  { href: '/admin', label: 'Visão geral', icon: '📊' },
  { href: '/admin/estabelecimentos', label: 'Estabelecimentos', icon: '🏪' },
  { href: '/admin/donos', label: 'Donos', icon: '👤' },
];

/** Shell da área do Super Admin: sidebar da plataforma + conteúdo. */
export function AdminShell({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  if (!user || user.role !== UserRole.SUPER_ADMIN) return <>{children}</>;

  return (
    <AppShell
      homeHref="/admin"
      brand={{ label: 'Plataforma', initial: '⚙️', variant: 'accent' }}
      badge="Admin"
      links={LINKS}
    >
      {children}
    </AppShell>
  );
}
