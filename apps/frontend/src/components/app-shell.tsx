'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../lib/auth-context';
import { SettingsMenu } from './settings-menu';
import { IconGlobe, IconMenu } from './icons';

export interface ShellLink {
  href: string;
  label: string;
  icon: ReactNode;
}

interface AppShellProps {
  homeHref: string;
  brand: { label: string; initial: string; variant: 'primary' | 'accent' };
  links: ShellLink[];
  badge?: string;
  publicUrl?: string;
  children: ReactNode;
}

/**
 * App-shell autenticado: barra lateral fixa (desktop) e drawer (mobile), com a
 * área de conteúdo ao lado. Layout de dashboard moderno. Ver PRD 3.3.
 */
export function AppShell({
  homeHref,
  brand,
  links,
  badge,
  publicUrl,
  children,
}: AppShellProps) {
  const { logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [drawer, setDrawer] = useState(false);

  const isActive = (href: string) =>
    href === homeHref ? pathname === homeHref : pathname.startsWith(href);

  async function doLogout() {
    await logout();
    router.push('/');
  }

  const Brand = (
    <Link href={homeHref} className="flex items-center gap-2 px-2 py-1">
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold ${
          brand.variant === 'accent'
            ? 'bg-accent text-accent-foreground'
            : 'bg-primary text-primary-foreground'
        }`}
      >
        {brand.initial}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
        {brand.label}
      </span>
      {badge && (
        <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-medium text-accent">
          {badge}
        </span>
      )}
    </Link>
  );

  const Nav = ({ onNavigate }: { onNavigate?: () => void }) => (
    <nav className="flex flex-col gap-0.5">
      {links.map((l) => {
        const active = isActive(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? 'bg-surface text-foreground'
                : 'text-muted hover:bg-surface hover:text-foreground'
            }`}
          >
            <span className="shrink-0 [&>svg]:h-5 [&>svg]:w-5">{l.icon}</span>
            {l.label}
          </Link>
        );
      })}
    </nav>
  );

  const Footer = ({ onNavigate }: { onNavigate?: () => void }) => (
    <div className="mt-auto flex flex-col gap-1 border-t border-border pt-2">
      {publicUrl && (
        <a
          href={publicUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-surface hover:text-foreground"
        >
          <IconGlobe className="h-4 w-4 shrink-0" />
          Ver página pública ↗
        </a>
      )}
      <div className="flex items-center justify-between px-1">
        <SettingsMenu up align="left" />
        <button
          type="button"
          onClick={doLogout}
          className="rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface hover:text-foreground"
        >
          Sair
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      {/* Sidebar (desktop) */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col gap-2 border-r border-border bg-surface/30 p-3 lg:flex">
        {Brand}
        <div className="mt-1">
          <Nav />
        </div>
        <Footer />
      </aside>

      {/* Coluna principal */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar (mobile) */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setDrawer(true)}
            aria-label="Abrir menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-foreground hover:bg-surface"
          >
            <IconMenu className="h-5 w-5" />
          </button>
          <span className="truncate text-sm font-semibold text-foreground">
            {brand.label}
          </span>
          <SettingsMenu />
        </header>

        {children}
      </div>

      {/* Drawer (mobile) */}
      {drawer && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setDrawer(false)}
            className="absolute inset-0 bg-black/40"
          />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col gap-2 border-r border-border bg-surface p-3 shadow-xl">
            {Brand}
            <div className="mt-1">
              <Nav onNavigate={() => setDrawer(false)} />
            </div>
            <Footer onNavigate={() => setDrawer(false)} />
          </aside>
        </div>
      )}
    </div>
  );
}
