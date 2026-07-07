'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { registerSchema } from '@repo/shared';
import { useAuth } from '../../lib/auth-context';
import { AuthShell } from '../../components/auth-shell';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

type FieldErrors = Partial<
  Record<'name' | 'email' | 'password' | 'phone', string>
>;

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function set(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    const parsed = registerSchema.safeParse({
      name: form.name,
      email: form.email,
      password: form.password,
      phone: form.phone || undefined,
    });
    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FieldErrors;
        next[key] ??= issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await register(parsed.data);
      router.push('/conta');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Falha ao cadastrar.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Criar conta"
      subtitle="Cadastro rápido para agendar em qualquer estabelecimento."
      footer={
        <>
          Já tem conta?{' '}
          <Link
            href="/login"
            className="font-medium text-accent hover:underline"
          >
            Entrar
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <Input
          label="Nome"
          autoComplete="name"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          error={errors.name}
          placeholder="Seu nome"
        />
        <Input
          label="E-mail"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={(e) => set('email', e.target.value)}
          error={errors.email}
          placeholder="voce@exemplo.com"
        />
        <Input
          label="Telefone (opcional)"
          autoComplete="tel"
          value={form.phone}
          onChange={(e) => set('phone', e.target.value)}
          error={errors.phone}
          placeholder="(11) 90000-0000"
        />
        <Input
          label="Senha"
          type="password"
          autoComplete="new-password"
          value={form.password}
          onChange={(e) => set('password', e.target.value)}
          error={errors.password}
          placeholder="mínimo 8 caracteres"
        />

        {formError && (
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500">
            {formError}
          </p>
        )}

        <Button type="submit" size="lg" loading={loading}>
          Criar conta
        </Button>
      </form>
    </AuthShell>
  );
}
