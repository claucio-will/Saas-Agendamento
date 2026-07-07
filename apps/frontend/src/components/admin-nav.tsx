'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { UserRole } from '@repo/shared';
import { useAuth } from '../lib/auth-context';
import { SettingsMenu } from './settings-menu';

const LINKS = [
  { href: '/admin', label: 'Visão geral' },
  { href: '/admin/estabelecimentos', label: 'Estabelecimentos' },
  { href: '/admin/donos', label: 'Donos' },
];

/** Barra de navegação da área do Super Admin (gestão da plataforma). */
export function AdminNav() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  if (!user || user.role !== UserRole.SUPER_ADMIN) return null;

  return (
    <nav className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        {/* Marca da plataforma */}
        <Link href="/admin" className="mr-2 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-sm text-accent-foreground">
            ⚙️
          </span>
          <span className="text-sm font-semibold text-foreground">
            Plataforma
          </span>
        </Link>

        <div className="flex flex-1 flex-wrap items-center gap-1">
          {LINKS.map((link) => {
            const active =
              link.href === '/admin'
                ? pathname === '/admin'
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

        <div className="flex items-center gap-2">
          <span className="hidden rounded-full bg-accent/15 px-2.5 py-1 text-xs font-medium text-accent sm:inline">
            Super Admin
          </span>
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
