'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserRole, type AuthUserDto } from '@repo/shared';
import { useAuth } from '../../lib/auth-context';
import { Button } from '../../components/ui/button';
import { Card, CardDescription, CardTitle } from '../../components/ui/card';

const ROLE_LABELS: Record<AuthUserDto['role'], string> = {
  [UserRole.SUPER_ADMIN]: 'Administrador da plataforma',
  [UserRole.TENANT_ADMIN]: 'Dono de estabelecimento',
  [UserRole.PROFESSIONAL]: 'Profissional',
  [UserRole.CUSTOMER]: 'Cliente',
};

export default function ContaPage() {
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
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-4 py-10">
      <div>
        <Link href="/" className="text-sm text-muted hover:text-foreground">
          ← Início
        </Link>
      </div>

      <Card>
        <CardTitle>Minha conta</CardTitle>
        <CardDescription>Você está autenticado. 🎉</CardDescription>

        <dl className="mt-4 flex flex-col gap-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Nome</dt>
            <dd className="font-medium text-foreground">{user.name}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">E-mail</dt>
            <dd className="font-medium text-foreground">{user.email}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Perfil</dt>
            <dd className="font-medium text-foreground">
              {ROLE_LABELS[user.role]}
            </dd>
          </div>
        </dl>

        <div className="mt-6">
          <Button
            variant="outline"
            onClick={async () => {
              await logout();
              router.push('/');
            }}
          >
            Sair
          </Button>
        </div>
      </Card>
    </main>
  );
}
