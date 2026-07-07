'use client';

import Link from 'next/link';
import { useAuth } from '../lib/auth-context';
import { homePathForRole } from '../lib/routes';

/** Navegação de autenticação no cabeçalho: login/cadastro ou usuário logado. */
export function AuthNav() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="h-9 w-32" aria-hidden />;
  }

  if (user) {
    const firstName = user.name.split(' ')[0];
    return (
      <Link
        href={homePathForRole(user.role)}
        className="inline-flex h-9 items-center gap-2 rounded-full border border-border bg-surface px-3 text-sm font-medium text-foreground hover:bg-background"
      >
        <span
          aria-hidden
          className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground"
        >
          {firstName.charAt(0).toUpperCase()}
        </span>
        {firstName}
      </Link>
    );
  }

  return (
    <nav className="flex items-center gap-2">
      <Link
        href="/login"
        className="inline-flex h-9 items-center rounded-[var(--radius-btn)] px-3 text-sm font-medium text-foreground hover:bg-surface"
      >
        Entrar
      </Link>
      <Link
        href="/register"
        className="inline-flex h-9 items-center rounded-[var(--radius-btn)] bg-primary px-3 text-sm font-medium text-primary-foreground hover:opacity-90"
      >
        Criar conta
      </Link>
    </nav>
  );
}
