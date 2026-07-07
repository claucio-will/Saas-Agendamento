import Link from 'next/link';
import { EstablishmentType } from '@repo/shared';
import { AuthNav } from '../components/auth-nav';
import { SettingsMenu } from '../components/settings-menu';
import { Button } from '../components/ui/button';
import { Card, CardTitle } from '../components/ui/card';
import { ESTABLISHMENT_LABEL } from '../lib/labels';

/** Página inicial pública: apresenta o produto e direciona cada perfil. */
export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-12 px-4 py-6">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            A
          </span>
          <span className="text-lg font-bold text-foreground">Agendamento</span>
        </div>
        <div className="flex items-center gap-3">
          <AuthNav />
          <SettingsMenu />
        </div>
      </header>

      {/* Hero */}
      <section className="flex flex-col items-center gap-5 py-6 text-center">
        <p className="text-sm font-medium text-accent">
          Agenda online para o seu negócio
        </p>
        <h1 className="max-w-2xl text-3xl font-bold leading-tight text-foreground sm:text-4xl">
          Sua barbearia, salão ou estúdio recebendo agendamentos 24 horas por
          dia.
        </h1>
        <p className="max-w-xl text-base text-muted">
          Seus clientes marcam sozinhos por um link. Você gerencia serviços,
          equipe e horários num painel simples — sem WhatsApp bagunçado.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/comecar">
            <Button size="lg">Cadastrar meu estabelecimento</Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline">
              Entrar
            </Button>
          </Link>
        </div>
        <p className="text-xs text-muted">14 dias grátis · sem cartão</p>
      </section>

      {/* Dois públicos */}
      <section className="grid gap-4 sm:grid-cols-2">
        <Card className="flex flex-col gap-3">
          <CardTitle>Para donos de estabelecimento</CardTitle>
          <ul className="flex flex-col gap-2 text-sm text-muted">
            <li>✓ Agenda diária e por profissional</li>
            <li>✓ Catálogo de serviços com preço e duração</li>
            <li>✓ Equipe com jornada de trabalho</li>
            <li>
              ✓ Página pública própria em <code>/b/sua-marca</code>
            </li>
          </ul>
          <Link href="/comecar" className="mt-1">
            <Button variant="accent">Começar agora</Button>
          </Link>
        </Card>

        <Card className="flex flex-col gap-3">
          <CardTitle>Para clientes</CardTitle>
          <ul className="flex flex-col gap-2 text-sm text-muted">
            <li>✓ Agende em segundos pelo link do estabelecimento</li>
            <li>✓ Escolha serviço, profissional e horário livre</li>
            <li>✓ Sem instalar nada</li>
            <li>✓ Confirmação na hora</li>
          </ul>
          <Link href="/register" className="mt-1">
            <Button variant="outline">Criar minha conta</Button>
          </Link>
        </Card>
      </section>

      {/* Verticais */}
      <section className="flex flex-col items-center gap-3 text-center">
        <p className="text-sm text-muted">Feito para</p>
        <div className="flex flex-wrap justify-center gap-2">
          {Object.values(EstablishmentType).map((type) => (
            <span
              key={type}
              className="rounded-full border border-border bg-surface px-4 py-1.5 text-sm text-foreground"
            >
              {ESTABLISHMENT_LABEL[type]}
            </span>
          ))}
        </div>
      </section>

      <footer className="mt-auto border-t border-border pt-6 text-center text-xs text-muted">
        É administrador da plataforma?{' '}
        <Link href="/login" className="font-medium text-accent hover:underline">
          Entrar no painel
        </Link>
      </footer>
    </main>
  );
}
