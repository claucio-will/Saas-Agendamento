import Link from 'next/link';
import { AuthNav } from '../components/auth-nav';
import { SettingsMenu } from '../components/settings-menu';
import { EstablishmentDiscovery } from '../components/establishment-discovery';
import { Button } from '../components/ui/button';

/** Página inicial pública, voltada ao cliente: encontrar e agendar. */
export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-12 px-4 py-6">
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

      {/* Hero — voltado ao cliente */}
      <section className="flex flex-col items-center gap-5 py-6 text-center">
        <p className="text-sm font-medium text-accent">Agende online</p>
        <h1 className="max-w-2xl text-3xl font-bold leading-tight text-foreground sm:text-4xl">
          Encontre e marque seu horário em segundos.
        </h1>
        <p className="max-w-xl text-base text-muted">
          Barbearias, salões e estúdios perto de você. Escolha o serviço, o
          profissional e o horário — sem instalar nada, confirmação na hora.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="#estabelecimentos">
            <Button size="lg">Ver estabelecimentos</Button>
          </Link>
        </div>
      </section>

      {/* Descoberta de estabelecimentos — conteúdo principal */}
      <EstablishmentDiscovery />

      {/* Como funciona — tranquiliza o cliente novo */}
      <section className="grid gap-4 sm:grid-cols-3">
        <Step
          n="1"
          title="Escolha o lugar"
          desc="Encontre uma barbearia, salão ou estúdio na lista acima."
        />
        <Step
          n="2"
          title="Escolha serviço e horário"
          desc="Veja os horários livres por profissional e selecione o seu."
        />
        <Step
          n="3"
          title="Confirme"
          desc="Crie sua conta em segundos e pronto — agendamento confirmado."
        />
      </section>

      {/* Faixa para donos — secundária e discreta */}
      <section className="rounded-2xl border border-border bg-gradient-to-br from-primary/5 to-accent/5 p-6 text-center">
        <h2 className="text-lg font-semibold text-foreground">
          Tem um estabelecimento?
        </h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted">
          Receba agendamentos online 24h e gerencie serviços, equipe e horários
          num painel simples. 14 dias grátis, sem cartão.
        </p>
        <div className="mt-4">
          <Link href="/comecar">
            <Button variant="outline">Cadastrar meu estabelecimento</Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-border pt-6 text-center text-xs text-muted">
        Agendamento — barbearias, salões e estúdios.
      </footer>
    </main>
  );
}

function Step({ n, title, desc }: { n: string; title: string; desc: string }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/15 text-sm font-bold text-accent">
        {n}
      </span>
      <h3 className="font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted">{desc}</p>
    </div>
  );
}
