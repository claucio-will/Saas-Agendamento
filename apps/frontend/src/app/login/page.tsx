'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { loginSchema } from '@repo/shared';
import { useAuth } from '../../lib/auth-context';
import { ThemeToggle } from '../../components/theme-toggle';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardDescription, CardTitle } from '../../components/ui/card';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]);
        next[key] ??= issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await login(parsed.data);
      router.push('/conta');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Falha ao entrar.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-4 py-10">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm text-muted hover:text-foreground">
          ← Início
        </Link>
        <ThemeToggle />
      </div>

      <Card>
        <CardTitle>Entrar</CardTitle>
        <CardDescription>Acesse sua conta para agendar.</CardDescription>

        <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-4" noValidate>
          <Input
            label="E-mail"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            placeholder="voce@exemplo.com"
          />
          <Input
            label="Senha"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            placeholder="••••••••"
          />

          {formError && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500">
              {formError}
            </p>
          )}

          <Button type="submit" size="lg" loading={loading}>
            Entrar
          </Button>
        </form>
      </Card>

      <p className="text-center text-sm text-muted">
        Não tem conta?{' '}
        <Link href="/register" className="font-medium text-accent hover:underline">
          Cadastre-se
        </Link>
      </p>
    </main>
  );
}
