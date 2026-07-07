'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import { ThemeToggle } from '../../components/theme-toggle';
import { Button } from '../../components/ui/button';
import { Card, CardDescription, CardTitle } from '../../components/ui/card';

export default function PainelPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <span
          aria-label="Carregando"
          className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-transparent"
        />
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-8">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-accent">Painel do dono</p>
          <h1 className="text-2xl font-bold text-foreground">
            Olá, {user.name.split(' ')[0]} 👋
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              await logout();
              router.push('/');
            }}
          >
            Sair
          </Button>
        </div>
      </header>

      <Card>
        <CardTitle>Estabelecimento criado 🎉</CardTitle>
        <CardDescription>
          Seu estabelecimento está em período de teste (TRIAL). Os próximos
          passos aparecem aqui conforme forem construídos.
        </CardDescription>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/painel/servicos" className="group">
          <Card className="h-full transition-colors group-hover:border-accent">
            <CardTitle>Serviços</CardTitle>
            <CardDescription>
              Cadastre serviços, duração e preço.
            </CardDescription>
          </Card>
        </Link>
        <Card className="opacity-70">
          <CardTitle>Agenda</CardTitle>
          <CardDescription>
            Sua agenda diária e por profissional. (Etapa 1.2)
          </CardDescription>
        </Card>
        <Link href="/painel/profissionais" className="group">
          <Card className="h-full transition-colors group-hover:border-accent">
            <CardTitle>Profissionais</CardTitle>
            <CardDescription>
              Cadastre a equipe e defina as jornadas de trabalho.
            </CardDescription>
          </Card>
        </Link>
        <Card className="opacity-70">
          <CardTitle>Clientes</CardTitle>
          <CardDescription>
            Histórico e contato dos clientes. (Etapa 1.2)
          </CardDescription>
        </Card>
      </div>

      <p className="text-center text-sm text-muted">
        <Link href="/" className="text-accent hover:underline">
          Voltar ao início
        </Link>
      </p>
    </main>
  );
}
