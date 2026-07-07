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
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-4">
        {/* Marca da plataforma */}
        <Link href="/admin" className="flex shrink-0 items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm text-accent-foreground">
            ⚙️
          </span>
          <span className="hidden text-sm font-semibold text-foreground sm:inline">
            Plataforma
          </span>
        </Link>

        <span className="hidden h-6 w-px shrink-0 bg-border sm:block" />

        <div className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto">
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

        <div className="flex shrink-0 items-center gap-1.5">
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
            className="rounded-md px-2.5 py-1.5 text-sm font-medium text-muted hover:bg-surface hover:text-foreground"
          >
            Sair
          </button>
        </div>
      </div>
    </nav>
  );
}
