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
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-4">
        {/* Marca / estabelecimento */}
        <Link href="/painel" className="flex shrink-0 items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            {(tenant?.name ?? 'A').charAt(0).toUpperCase()}
          </span>
          <span className="hidden max-w-[9rem] truncate text-sm font-semibold text-foreground md:inline">
            {tenant?.name ?? 'Meu estabelecimento'}
          </span>
        </Link>

        <span className="hidden h-6 w-px shrink-0 bg-border md:block" />

        {/* Links de seção — linha única, rola se faltar espaço */}
        <div className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto">
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
                className={`whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors ${
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
        <div className="flex shrink-0 items-center gap-1.5">
          {tenant && (
            <a
              href={`/b/${tenant.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center rounded-md border border-border px-2.5 py-1.5 text-sm text-foreground hover:bg-surface lg:inline-flex"
            >
              Ver página ↗
            </a>
          )}
          <SettingsMenu />
          <button
            type="button"
            onClick={async () => {
              await logout();
              router.push('/');
            }}
            className="rounded-md px-2.5 py-1.5 text-sm font-medium text-muted hover:bg-surface hover:text-foreground"
          >
            Sair
          </button>
        </div>
      </div>
    </nav>
  );
}
