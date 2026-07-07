'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { UserRole, type TenantResponseDto } from '@repo/shared';
import { useAuth } from '../lib/auth-context';
import { SettingsMenu } from './settings-menu';

const LINKS = [
  { href: '/painel', label: 'Início' },
  { href: '/painel/agenda', label: 'Agenda' },
  { href: '/painel/servicos', label: 'Serviços' },
  { href: '/painel/profissionais', label: 'Profissionais' },
  { href: '/painel/clientes', label: 'Clientes' },
  { href: '/painel/configuracoes', label: 'Configurações' },
];

/** Barra de navegação da área do dono (todas as telas /painel/*). */
export function PainelNav() {
  const { user, authFetch, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [tenant, setTenant] = useState<TenantResponseDto | null>(null);

  // Carrega o estabelecimento do dono (nome + slug para o link público).
  useEffect(() => {
    if (!user || user.role !== UserRole.TENANT_ADMIN) return;
    authFetch<TenantResponseDto>('/tenants/me')
      .then(setTenant)
      .catch(() => undefined);
  }, [user, authFetch]);

  if (!user || user.role !== UserRole.TENANT_ADMIN) return null;

  return (
    <nav className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        {/* Marca / estabelecimento */}
        <Link href="/painel" className="mr-2 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            {(tenant?.name ?? 'A').charAt(0).toUpperCase()}
          </span>
          <span className="max-w-[10rem] truncate text-sm font-semibold text-foreground">
            {tenant?.name ?? 'Meu estabelecimento'}
          </span>
        </Link>

        {/* Links de seção */}
        <div className="flex flex-1 flex-wrap items-center gap-1">
          {LINKS.map((link) => {
            const active =
              link.href === '/painel'
                ? pathname === '/painel'
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={`rounded-[var(--radius-btn)] px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-surface text-foreground'
                    : 'text-muted hover:bg-surface hover:text-foreground'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Ações à direita */}
        <div className="flex items-center gap-2">
          {tenant && (
            <a
              href={`/b/${tenant.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden rounded-[var(--radius-btn)] border border-border px-3 py-1.5 text-sm text-foreground hover:bg-surface sm:inline-flex"
            >
              Ver página pública ↗
            </a>
          )}
          <SettingsMenu />
          <button
            type="button"
            onClick={async () => {
              await logout();
              router.push('/');
            }}
            className="rounded-[var(--radius-btn)] px-3 py-1.5 text-sm font-medium text-muted hover:bg-surface hover:text-foreground"
          >
            Sair
          </button>
        </div>
      </div>
    </nav>
  );
}
