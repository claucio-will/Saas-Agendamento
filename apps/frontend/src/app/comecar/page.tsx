'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  EstablishmentType,
  onboardingSchema,
  type OnboardingDto,
} from '@repo/shared';
import { useAuth } from '../../lib/auth-context';
import { slugify } from '../../lib/slugify';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardDescription, CardTitle } from '../../components/ui/card';

const TYPES = [
  {
    value: EstablishmentType.BARBERSHOP,
    label: 'Barbearia',
    emoji: '💈',
    desc: 'Corte, barba, sobrancelha',
  },
  {
    value: EstablishmentType.HAIR_SALON,
    label: 'Salão de Cabeleireiro',
    emoji: '✂️',
    desc: 'Corte, coloração, escova, manicure',
  },
  {
    value: EstablishmentType.TATTOO_STUDIO,
    label: 'Estúdio de Tatuagem',
    emoji: '🎨',
    desc: 'Sessões, orçamento, retoque',
  },
] as const;

const EMPTY = {
  tenantName: '',
  slug: '',
  documentId: '',
  phone: '',
  addressLine: '',
  city: '',
  state: '',
  postalCode: '',
  ownerName: '',
  ownerEmail: '',
  ownerPassword: '',
};

export default function OnboardingPage() {
  const { onboard } = useAuth();
  const router = useRouter();

  const [type, setType] = useState<EstablishmentType | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [slugEdited, setSlugEdited] = useState(false);
  const [offersChemicalServices, setOffersChemical] = useState(false);
  const [consentFormRequired, setConsentForm] = useState(true);
  const [requiresDeposit, setRequiresDeposit] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function set(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function onNameChange(value: string) {
    setForm((prev) => ({
      ...prev,
      tenantName: value,
      slug: slugEdited ? prev.slug : slugify(value),
    }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!type) return;
    setFormError(null);

    const base = {
      establishmentType: type,
      tenantName: form.tenantName,
      slug: form.slug,
      documentId: form.documentId,
      phone: form.phone,
      address: {
        addressLine: form.addressLine,
        city: form.city,
        state: form.state,
        postalCode: form.postalCode,
      },
      owner: {
        name: form.ownerName,
        email: form.ownerEmail,
        password: form.ownerPassword,
      },
      acceptTerms,
    };
    const payload =
      type === EstablishmentType.HAIR_SALON
        ? { ...base, offersChemicalServices }
        : type === EstablishmentType.TATTOO_STUDIO
          ? { ...base, consentFormRequired, requiresDeposit }
          : base;

    const parsed = onboardingSchema.safeParse(payload);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join('.');
        next[key] ??= issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await onboard(parsed.data as OnboardingDto);
      router.push('/painel');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Falha no cadastro.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-6 px-4 py-8">
      <div>
        <Link href="/" className="text-sm text-muted hover:text-foreground">
          ← Início
        </Link>
      </div>

      <div>
        <p className="text-sm font-medium text-accent">Cadastro do estabelecimento</p>
        <h1 className="text-2xl font-bold text-foreground">
          {type ? 'Dados do estabelecimento' : 'Que tipo de negócio é o seu?'}
        </h1>
      </div>

      {!type && (
        <div className="flex flex-col gap-3">
          {TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setType(t.value)}
              className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 text-left transition-colors hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <span className="text-3xl" aria-hidden>
                {t.emoji}
              </span>
              <span>
                <span className="block font-semibold text-foreground">
                  {t.label}
                </span>
                <span className="block text-sm text-muted">{t.desc}</span>
              </span>
            </button>
          ))}
        </div>
      )}

      {type && (
        <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
          <Card>
            <CardTitle>Estabelecimento</CardTitle>
            <div className="mt-4 flex flex-col gap-4">
              <Input
                label="Nome do estabelecimento"
                value={form.tenantName}
                onChange={(e) => onNameChange(e.target.value)}
                error={errors.tenantName}
                placeholder="Barbearia do Zé"
              />
              <Input
                label="Endereço público (slug)"
                value={form.slug}
                onChange={(e) => {
                  setSlugEdited(true);
                  set('slug', e.target.value);
                }}
                error={errors.slug}
                placeholder="barbearia-do-ze"
              />
              <p className="-mt-2 text-xs text-muted">
                Seu link será <code>/b/{form.slug || 'seu-slug'}</code>
              </p>
              <Input
                label="CNPJ ou CPF"
                value={form.documentId}
                onChange={(e) => set('documentId', e.target.value)}
                error={errors.documentId}
                placeholder="00.000.000/0000-00"
              />
              <Input
                label="Telefone"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                error={errors.phone}
                placeholder="(11) 90000-0000"
              />
            </div>
          </Card>

          <Card>
            <CardTitle>Endereço</CardTitle>
            <div className="mt-4 flex flex-col gap-4">
              <Input
                label="Logradouro"
                value={form.addressLine}
                onChange={(e) => set('addressLine', e.target.value)}
                error={errors['address.addressLine']}
                placeholder="Rua Exemplo, 123"
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Cidade"
                  value={form.city}
                  onChange={(e) => set('city', e.target.value)}
                  error={errors['address.city']}
                />
                <Input
                  label="UF"
                  value={form.state}
                  onChange={(e) => set('state', e.target.value)}
                  error={errors['address.state']}
                  placeholder="SP"
                />
              </div>
              <Input
                label="CEP"
                value={form.postalCode}
                onChange={(e) => set('postalCode', e.target.value)}
                error={errors['address.postalCode']}
                placeholder="01000-000"
              />
            </div>
          </Card>

          {type === EstablishmentType.HAIR_SALON && (
            <Card>
              <CardTitle>Opções do salão</CardTitle>
              <CardDescription>Ajuste conforme seus serviços.</CardDescription>
              <label className="mt-4 flex items-center gap-3 text-sm text-foreground">
                <input
                  type="checkbox"
                  className="h-5 w-5 accent-[var(--color-primary)]"
                  checked={offersChemicalServices}
                  onChange={(e) => setOffersChemical(e.target.checked)}
                />
                Ofereço serviços químicos (coloração/alisamento) — habilita ficha
                de química
              </label>
            </Card>
          )}

          {type === EstablishmentType.TATTOO_STUDIO && (
            <Card>
              <CardTitle>Opções do estúdio</CardTitle>
              <CardDescription>Regras do seu atendimento.</CardDescription>
              <div className="mt-4 flex flex-col gap-3">
                <label className="flex items-center gap-3 text-sm text-foreground">
                  <input
                    type="checkbox"
                    className="h-5 w-5 accent-[var(--color-primary)]"
                    checked={consentFormRequired}
                    onChange={(e) => setConsentForm(e.target.checked)}
                  />
                  Exigir termo de consentimento do cliente
                </label>
                <label className="flex items-center gap-3 text-sm text-foreground">
                  <input
                    type="checkbox"
                    className="h-5 w-5 accent-[var(--color-primary)]"
                    checked={requiresDeposit}
                    onChange={(e) => setRequiresDeposit(e.target.checked)}
                  />
                  Exigir sinal/depósito no agendamento
                </label>
              </div>
            </Card>
          )}

          <Card>
            <CardTitle>Sua conta de dono</CardTitle>
            <div className="mt-4 flex flex-col gap-4">
              <Input
                label="Seu nome"
                value={form.ownerName}
                onChange={(e) => set('ownerName', e.target.value)}
                error={errors['owner.name']}
              />
              <Input
                label="E-mail"
                type="email"
                value={form.ownerEmail}
                onChange={(e) => set('ownerEmail', e.target.value)}
                error={errors['owner.email']}
                placeholder="voce@exemplo.com"
              />
              <Input
                label="Senha"
                type="password"
                value={form.ownerPassword}
                onChange={(e) => set('ownerPassword', e.target.value)}
                error={errors['owner.password']}
                placeholder="mínimo 8 caracteres"
              />
            </div>
          </Card>

          <div>
            <label className="flex items-start gap-3 text-sm text-foreground">
              <input
                type="checkbox"
                className="mt-0.5 h-5 w-5 accent-[var(--color-primary)]"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
              />
              <span>
                Li e aceito os Termos de Uso e a Política de Privacidade.
              </span>
            </label>
            {errors.acceptTerms && (
              <p className="mt-1 text-sm text-red-500">{errors.acceptTerms}</p>
            )}
          </div>

          {formError && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500">
              {formError}
            </p>
          )}

          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setType(null)}
            >
              ← Voltar
            </Button>
            <Button type="submit" size="lg" loading={loading}>
              Criar estabelecimento
            </Button>
          </div>
        </form>
      )}
    </main>
  );
}
