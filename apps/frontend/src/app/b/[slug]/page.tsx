'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  PricingType,
  type AppointmentResponseDto,
  type AvailabilityResponseDto,
  type CreateAppointmentDto,
  type PublicProfileResponseDto,
} from '@repo/shared';
import { apiFetch, ApiError } from '../../../lib/api';
import { Button } from '../../../components/ui/button';
import { Card, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';

type PublicService = PublicProfileResponseDto['services'][number];

/** centavos → "R$ 0,00". */
function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

/** Rótulo de preço conforme o tipo de precificação. */
function priceLabel(s: PublicService): string {
  if (s.pricingType === PricingType.QUOTE) return 'Sob orçamento';
  const prefix = s.pricingType === PricingType.STARTING_AT ? 'A partir de ' : '';
  return `${prefix}${formatBRL(s.priceCents)}`;
}

/** ISO (UTC) → "HH:MM" no fuso do navegador. */
function slotTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function PublicBookingPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const [profile, setProfile] = useState<PublicProfileResponseDto | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Fluxo de agendamento
  const [service, setService] = useState<PublicService | null>(null);
  const [date, setDate] = useState<string>(today());
  const [availability, setAvailability] =
    useState<AvailabilityResponseDto | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selected, setSelected] = useState<{
    professionalId: string;
    professionalName: string;
    startsAt: string;
  } | null>(null);

  // Dados do cliente
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [booking, setBooking] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<AppointmentResponseDto | null>(
    null,
  );

  // Carrega o perfil público do estabelecimento.
  useEffect(() => {
    apiFetch<PublicProfileResponseDto>(`/public/${slug}`)
      .then(setProfile)
      .catch((err) =>
        setLoadError(
          err instanceof ApiError && err.status === 404
            ? 'Estabelecimento não encontrado.'
            : 'Não foi possível carregar. Tente novamente.',
        ),
      );
  }, [slug]);

  const loadSlots = useCallback(async () => {
    if (!service) return;
    setLoadingSlots(true);
    setSelected(null);
    setAvailability(null);
    try {
      const query = new URLSearchParams({ serviceId: service.id, date });
      setAvailability(
        await apiFetch<AvailabilityResponseDto>(
          `/public/${slug}/availability?${query.toString()}`,
        ),
      );
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Erro ao buscar horários.',
      );
    } finally {
      setLoadingSlots(false);
    }
  }, [service, date, slug]);

  // Ao escolher serviço ou trocar a data, recarrega os horários.
  useEffect(() => {
    if (service) void loadSlots();
  }, [service, date, loadSlots]);

  const hasSlots = useMemo(
    () => availability?.professionals.some((p) => p.slots.length > 0) ?? false,
    [availability],
  );

  async function handleBook(e: React.FormEvent) {
    e.preventDefault();
    if (!service || !selected) return;
    setBooking(true);
    setFormError(null);
    try {
      const dto: CreateAppointmentDto = {
        serviceId: service.id,
        professionalId: selected.professionalId,
        startsAt: selected.startsAt,
        customerName: name.trim(),
        customerEmail: email.trim(),
        ...(phone.trim() ? { customerPhone: phone.trim() } : {}),
      };
      const appt = await apiFetch<AppointmentResponseDto>(
        `/public/${slug}/appointments`,
        { method: 'POST', body: dto },
      );
      setConfirmed(appt);
    } catch (err) {
      setFormError(
        err instanceof ApiError
          ? err.message
          : 'Não foi possível concluir o agendamento.',
      );
      // Conflito de horário: recarrega os slots para refletir a mudança.
      if (err instanceof ApiError && err.status === 409) void loadSlots();
    } finally {
      setBooking(false);
    }
  }

  // ---- Estados de página ----------------------------------------------------

  if (loadError) {
    return (
      <Shell>
        <Card>
          <CardTitle>{loadError}</CardTitle>
        </Card>
      </Shell>
    );
  }

  if (!profile) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <span
          aria-label="Carregando"
          className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-transparent"
        />
      </main>
    );
  }

  // Tela de confirmação.
  if (confirmed) {
    return (
      <Shell title={profile.name}>
        <Card className="flex flex-col gap-2">
          <span className="text-3xl">✅</span>
          <CardTitle>Agendamento confirmado!</CardTitle>
          <p className="text-sm text-muted">
            {confirmed.serviceName} com {confirmed.professionalName}
          </p>
          <p className="text-sm text-foreground">
            {new Date(confirmed.startsAt).toLocaleString('pt-BR', {
              dateStyle: 'full',
              timeStyle: 'short',
            })}
          </p>
          <p className="mt-2 text-xs text-muted">
            Enviamos os detalhes para {confirmed.customerEmail}.
          </p>
          <Button
            variant="outline"
            className="mt-3 self-start"
            onClick={() => {
              setConfirmed(null);
              setService(null);
              setSelected(null);
              setName('');
              setEmail('');
              setPhone('');
            }}
          >
            Fazer outro agendamento
          </Button>
        </Card>
      </Shell>
    );
  }

  return (
    <Shell title={profile.name}>
      {/* Passo 1 — escolher serviço */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-accent">1. Escolha o serviço</h2>
        {profile.services.length === 0 && (
          <p className="text-sm text-muted">
            Este estabelecimento ainda não publicou serviços.
          </p>
        )}
        <div className="flex flex-col gap-2">
          {profile.services.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setService(s)}
              className={`rounded-2xl border p-4 text-left transition-colors ${
                service?.id === s.id
                  ? 'border-accent bg-accent/10'
                  : 'border-border bg-surface hover:border-accent/60'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium text-foreground">{s.name}</span>
                <span className="text-sm text-foreground">{priceLabel(s)}</span>
              </div>
              <p className="mt-0.5 text-xs text-muted">
                {s.durationMinutes} min
                {s.description ? ` · ${s.description}` : ''}
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* Passo 2 — data e horário */}
      {service && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-accent">
            2. Escolha data e horário
          </h2>
          <Input
            label="Data"
            type="date"
            min={today()}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="max-w-[12rem]"
          />

          {loadingSlots && (
            <p className="text-sm text-muted">Buscando horários…</p>
          )}

          {!loadingSlots && availability && !hasSlots && (
            <p className="text-sm text-muted">
              Nenhum horário livre nesta data. Tente outro dia.
            </p>
          )}

          {!loadingSlots &&
            availability?.professionals.map(
              (pro) =>
                pro.slots.length > 0 && (
                  <div key={pro.professionalId} className="flex flex-col gap-2">
                    <p className="text-sm font-medium text-foreground">
                      {pro.professionalName}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {pro.slots.map((iso) => {
                        const isSel =
                          selected?.startsAt === iso &&
                          selected?.professionalId === pro.professionalId;
                        return (
                          <button
                            key={`${pro.professionalId}-${iso}`}
                            type="button"
                            onClick={() =>
                              setSelected({
                                professionalId: pro.professionalId,
                                professionalName: pro.professionalName,
                                startsAt: iso,
                              })
                            }
                            className={`rounded-[var(--radius-btn)] border px-3 py-1.5 text-sm transition-colors ${
                              isSel
                                ? 'border-accent bg-accent text-accent-foreground'
                                : 'border-border text-foreground hover:border-accent'
                            }`}
                          >
                            {slotTime(iso)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ),
            )}
        </section>
      )}

      {/* Passo 3 — dados do cliente */}
      {selected && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-accent">3. Seus dados</h2>
          <Card>
            <p className="mb-3 text-sm text-muted">
              {service?.name} · {selected.professionalName} ·{' '}
              {new Date(selected.startsAt).toLocaleString('pt-BR', {
                dateStyle: 'short',
                timeStyle: 'short',
              })}
            </p>
            <form onSubmit={handleBook} className="flex flex-col gap-3">
              <Input
                label="Nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
                maxLength={120}
              />
              <Input
                label="E-mail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                label="Telefone (opcional)"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={20}
              />
              {formError && <p className="text-sm text-red-500">{formError}</p>}
              <Button
                type="submit"
                loading={booking}
                disabled={name.trim().length < 2 || !email.trim()}
                className="self-start"
              >
                Confirmar agendamento
              </Button>
            </form>
          </Card>
        </section>
      )}
    </Shell>
  );
}

/** Layout comum da página pública. */
function Shell({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-6 px-4 py-8">
      <header>
        <p className="text-sm font-medium text-accent">Agendamento online</p>
        {title && (
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        )}
      </header>
      {children}
    </main>
  );
}
