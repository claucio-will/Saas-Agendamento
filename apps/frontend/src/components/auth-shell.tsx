import Link from 'next/link';
import type { ReactNode } from 'react';

/** Marca reutilizada nos painéis de autenticação. */
function Brand({ light }: { light?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold ${
          light ? 'bg-accent text-accent-foreground' : 'bg-primary text-primary-foreground'
        }`}
      >
        A
      </span>
      <span
        className={`text-lg font-bold ${light ? 'text-primary-foreground' : 'text-foreground'}`}
      >
        Agendamento
      </span>
    </span>
  );
}

/**
 * Layout de autenticação em duas colunas (split-screen): painel de marca à
 * esquerda (desktop) e o formulário à direita. Dá uma aparência moderna e
 * consistente ao login e ao cadastro.
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
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      {/* Painel de marca (desktop) */}
      <aside className="relative hidden overflow-hidden bg-primary p-10 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
        {/* Blobs decorativos */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent/25 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-accent/10 blur-3xl"
        />

        <div className="relative">
          <Brand light />
        </div>

        <div className="relative flex flex-col gap-4">
          <h2 className="text-3xl font-bold leading-tight">
            Sua agenda cheia, sem esforço.
          </h2>
          <p className="max-w-sm text-primary-foreground/80">
            Barbearias, salões e estúdios recebem agendamentos online 24h.
            Serviços, equipe e horários num painel só.
          </p>
          <ul className="mt-2 flex flex-col gap-2 text-sm text-primary-foreground/80">
            <li>✓ Página pública própria para agendamentos</li>
            <li>✓ Agenda por profissional, sem overbooking</li>
            <li>✓ Controle total de serviços e equipe</li>
          </ul>
        </div>

        <p className="relative text-xs text-primary-foreground/60">
          © {new Date().getFullYear()} Agendamento
        </p>
      </aside>

      {/* Formulário */}
      <div className="flex min-h-screen flex-col justify-center px-6 py-10 sm:px-10 lg:min-h-0">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 flex items-center justify-between">
            <Link
              href="/"
              className="text-sm text-muted transition-colors hover:text-foreground"
            >
              ← Início
            </Link>
            {/* Marca no topo (apenas mobile, onde o painel fica oculto) */}
            <span className="lg:hidden">
              <Brand />
            </span>
          </div>

          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
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
