import Link from 'next/link';
import type { ReactNode } from 'react';

/** Marca reutilizada nos painéis de autenticação. */
function Brand({ light }: { light?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold ${
          light
            ? 'bg-white/10 text-white ring-1 ring-white/20'
            : 'bg-gradient-to-br from-primary to-emerald-600 text-primary-foreground shadow-glow'
        }`}
      >
        A
      </span>
      <span
        className={`text-lg font-bold tracking-tight ${light ? 'text-white' : 'text-foreground'}`}
      >
        Agendamento
      </span>
    </span>
  );
}

/**
 * Layout de autenticação em duas colunas (split-screen), minimalista: painel de
 * marca escuro e discreto à esquerda (desktop) e o formulário à direita.
 * Compartilhado por login e cadastro. Ver PRD 3.3.
 */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-2">
      {/* Painel de marca (desktop) — dark, minimalista */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-emerald-900 via-[#0a1512] to-[#060a10] p-10 lg:flex lg:flex-col lg:justify-between xl:p-14">
        {/* Glow ambiente sutil */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-emerald-400/15 blur-3xl"
        />

        <div className="relative">
          <Brand light />
        </div>

        <h2 className="relative max-w-sm text-4xl font-extrabold leading-[1.1] tracking-tight text-white">
          Sua agenda cheia,{' '}
          <span className="bg-gradient-to-r from-emerald-300 to-amber-300 bg-clip-text text-transparent">
            sem esforço
          </span>
          .
        </h2>

        <p className="relative text-xs text-white/40">
          © {new Date().getFullYear()} Agendamento
        </p>
      </aside>

      {/* Formulário */}
      <div className="flex min-h-dvh flex-col justify-center px-6 py-10 sm:px-10 lg:min-h-0">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
            >
              ← Início
            </Link>
            {/* Marca no topo (apenas mobile, onde o painel fica oculto) */}
            <span className="lg:hidden">
              <Brand />
            </span>
          </div>

          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            {title}
          </h1>
          <p className="mt-1 text-sm text-muted">{subtitle}</p>

          <div className="mt-6">{children}</div>

          {footer && (
            <p className="mt-6 text-center text-sm text-muted">{footer}</p>
          )}
        </div>
      </div>
    </div>
  );
}
