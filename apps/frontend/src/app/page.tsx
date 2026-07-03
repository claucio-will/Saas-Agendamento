import Link from 'next/link';
import { EstablishmentType } from '@repo/shared';
import { AuthNav } from '../components/auth-nav';
import { ThemeToggle } from '../components/theme-toggle';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardDescription, CardTitle } from '../components/ui/card';

const TYPE_LABELS: Record<EstablishmentType, string> = {
  [EstablishmentType.BARBERSHOP]: 'Barbearia',
  [EstablishmentType.HAIR_SALON]: 'Salão de Cabeleireiro',
  [EstablishmentType.TATTOO_STUDIO]: 'Estúdio de Tatuagem',
};

/**
 * Vitrine do design system (Fase 0). Prova a paleta light/dark, os componentes
 * base e o consumo de tipos do pacote @repo/shared. Substituída pela home
 * pública de descoberta na Etapa 1.3.
 */
export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-4 py-8">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-accent">Etapa 1.1 · Identidade</p>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            Agendamento
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <AuthNav />
          <ThemeToggle />
        </div>
      </header>

      <Card className="border-accent/40 bg-gradient-to-br from-primary/5 to-accent/5">
        <CardTitle>Tem um estabelecimento?</CardTitle>
        <CardDescription>
          Cadastre sua barbearia, salão ou estúdio e comece a receber
          agendamentos online. 14 dias grátis.
        </CardDescription>
        <div className="mt-4">
          <Link href="/comecar">
            <Button size="lg">Cadastrar meu estabelecimento</Button>
          </Link>
        </div>
      </Card>

      <Card>
        <CardTitle>Verticais suportados</CardTitle>
        <CardDescription>
          Tipos vindos de <code>@repo/shared</code> (mesma fonte de verdade no
          backend e no frontend).
        </CardDescription>
        <div className="mt-4 flex flex-wrap gap-2">
          {Object.values(EstablishmentType).map((type) => (
            <span
              key={type}
              className="rounded-full border border-border bg-background px-3 py-1 text-sm text-foreground"
            >
              {TYPE_LABELS[type]}
            </span>
          ))}
        </div>
      </Card>

      <Card>
        <CardTitle>Botões</CardTitle>
        <CardDescription>Estados: normal, loading e desabilitado.</CardDescription>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button variant="primary">Primário</Button>
          <Button variant="accent">Dourado</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button loading>Carregando</Button>
          <Button disabled>Desabilitado</Button>
        </div>
      </Card>

      <Card>
        <CardTitle>Formulário</CardTitle>
        <CardDescription>Inputs com label e estado de erro.</CardDescription>
        <div className="mt-4 flex flex-col gap-4">
          <Input label="Nome do estabelecimento" placeholder="Barbearia do Zé" />
          <Input
            label="E-mail"
            type="email"
            placeholder="contato@exemplo.com"
            error="E-mail inválido"
          />
          <div>
            <Button size="lg">Continuar</Button>
          </div>
        </div>
      </Card>
    </main>
  );
}
