'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  PricingType,
  UserRole,
  type AppointmentResponseDto,
  type AvailabilityResponseDto,
  type CreateAppointmentDto,
  type CreateReviewDto,
  type PublicProfileResponseDto,
  type ReviewsResponseDto,
} from '@repo/shared';
import { apiFetch, ApiError } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';
import { ESTABLISHMENT_LABEL } from '../../../lib/labels';
import {
  IconArrowLeft,
  IconMapPin,
  IconPhone,
  IconStar,
} from '../../../components/icons';
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
  const { user, authFetch } = useAuth();

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

  // Confirmação
  const [booking, setBooking] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<AppointmentResponseDto | null>(
    null,
  );

  // Avaliações
  const [reviews, setReviews] = useState<ReviewsResponseDto | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewMsg, setReviewMsg] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);

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

  const loadReviews = useCallback(async () => {
    try {
      setReviews(await apiFetch<ReviewsResponseDto>(`/public/${slug}/reviews`));
    } catch {
      /* avaliações são opcionais; ignora erro */
    }
  }, [slug]);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  async function submitReview() {
    setReviewSubmitting(true);
    setReviewMsg(null);
    try {
      const dto: CreateReviewDto = {
        rating: reviewRating,
        ...(reviewComment.trim() ? { comment: reviewComment.trim() } : {}),
      };
      await authFetch(`/public/${slug}/reviews`, { method: 'POST', body: dto });
      setReviewMsg({ ok: true, text: 'Avaliação enviada. Obrigado!' });
      setReviewComment('');
      await loadReviews();
    } catch (err) {
      setReviewMsg({
        ok: false,
        text:
          err instanceof ApiError
            ? err.message
            : 'Não foi possível enviar a avaliação.',
      });
    } finally {
      setReviewSubmitting(false);
    }
  }

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

  async function handleBook() {
    if (!service || !selected || !user) return;
    setBooking(true);
    setFormError(null);
    try {
      // Cliente logado: o backend usa a conta; enviamos nome/e-mail como
      // fallback para outros perfis. Ver BookingService.resolveCustomer.
      const dto: CreateAppointmentDto = {
        serviceId: service.id,
        professionalId: selected.professionalId,
        startsAt: selected.startsAt,
        customerName: user.name,
        customerEmail: user.email,
      };
      const appt = await authFetch<AppointmentResponseDto>(
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
        <Card className="max-w-lg">
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
        <Card className="flex max-w-lg flex-col gap-2">
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
            Guardamos os detalhes em{' '}
            <Link href="/conta" className="text-accent hover:underline">
              Minha conta
            </Link>
            , onde você pode remarcar ou cancelar.
          </p>
          <Button
            variant="outline"
            className="mt-3 self-start"
            onClick={() => {
              setConfirmed(null);
              setService(null);
              setSelected(null);
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
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        {/* Sidebar — sobre o local + equipe (à direita no desktop) */}
        <aside className="order-1 flex flex-col gap-4 lg:order-2 lg:sticky lg:top-6">
      {/* Informações do estabelecimento */}
      <section className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-5 shadow-card">
        <div className="flex flex-wrap items-center gap-3">
          <span className="w-fit rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-medium text-accent">
            {ESTABLISHMENT_LABEL[profile.establishmentType]}
          </span>
          {profile.ratingCount > 0 && (
            <span className="flex items-center gap-1.5 text-sm">
              <Stars value={profile.ratingAverage} />
              <span className="font-medium text-foreground">
                {profile.ratingAverage.toFixed(1)}
              </span>
              <span className="text-muted">({profile.ratingCount})</span>
            </span>
          )}
        </div>
        {(profile.addressLine || profile.city || profile.state) && (
          <p className="flex items-center gap-2 text-sm text-muted">
            <IconMapPin className="h-4 w-4 shrink-0" />
            {[profile.addressLine, profile.city, profile.state]
              .filter(Boolean)
              .join(', ')}
          </p>
        )}
        {profile.phone && (
          <p className="flex items-center gap-2 text-sm text-muted">
            <IconPhone className="h-4 w-4 shrink-0" />
            {profile.phone}
          </p>
        )}
      </section>

      {/* Nossa equipe */}
      {profile.professionals.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-accent">Nossa equipe</h2>
          <div className="flex flex-col gap-3">
            {profile.professionals.map((pro) => (
              <div
                key={pro.id}
                className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-4"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {pro.name.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{pro.name}</p>
                  {pro.bio && (
                    <p className="text-xs text-muted">{pro.bio}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
        </aside>

        {/* Coluna principal — fluxo de agendamento */}
        <div className="order-2 flex flex-col gap-6 lg:order-1">
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

      {/* Passo 3 — confirmação (exige conta) */}
      {selected && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-accent">3. Confirmação</h2>
          <Card>
            <p className="mb-3 text-sm text-muted">
              {service?.name} · {selected.professionalName} ·{' '}
              {new Date(selected.startsAt).toLocaleString('pt-BR', {
                dateStyle: 'short',
                timeStyle: 'short',
              })}
            </p>

            {user ? (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-muted">
                  Agendando como{' '}
                  <strong className="text-foreground">{user.name}</strong> (
                  {user.email}).
                </p>
                {formError && (
                  <p className="text-sm text-red-500">{formError}</p>
                )}
                <Button
                  type="button"
                  onClick={handleBook}
                  loading={booking}
                  className="self-start"
                >
                  Confirmar agendamento
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-muted">
                  Para confirmar o agendamento, entre ou crie sua conta — leva
                  menos de um minuto e guarda seus dados.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/login?next=/b/${slug}`}>
                    <Button type="button">Entrar</Button>
                  </Link>
                  <Link href={`/register?next=/b/${slug}`}>
                    <Button type="button" variant="outline">
                      Criar conta
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </Card>
        </section>
      )}

      {/* Avaliações */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-accent">Avaliações</h2>
          {reviews && reviews.count > 0 && (
            <span className="flex items-center gap-1.5 text-sm">
              <Stars value={reviews.average} />
              <span className="font-medium text-foreground">
                {reviews.average.toFixed(1)}
              </span>
              <span className="text-muted">({reviews.count})</span>
            </span>
          )}
        </div>

        {user?.role === UserRole.CUSTOMER && (
          <Card className="flex flex-col gap-3">
            <p className="text-sm font-medium text-foreground">
              Deixe sua avaliação
            </p>
            <StarPicker value={reviewRating} onChange={setReviewRating} />
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Conte como foi seu atendimento (opcional)"
              maxLength={500}
              rows={3}
              className="w-full rounded-[var(--radius-btn)] border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            />
            {reviewMsg && (
              <p
                className={`text-sm ${reviewMsg.ok ? 'text-green-600' : 'text-red-500'}`}
              >
                {reviewMsg.text}
              </p>
            )}
            <Button
              type="button"
              onClick={submitReview}
              loading={reviewSubmitting}
              className="self-start"
            >
              Enviar avaliação
            </Button>
          </Card>
        )}

        {reviews && reviews.items.length === 0 && (
          <p className="text-sm text-muted">
            Ainda não há avaliações. Seja o primeiro após ser atendido.
          </p>
        )}

        <div className="flex flex-col gap-3">
          {reviews?.items.map((r) => (
            <div
              key={r.id}
              className="rounded-2xl border border-border bg-surface p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-foreground">
                  {r.customerName}
                </span>
                <Stars value={r.rating} />
              </div>
              {r.comment && (
                <p className="mt-1 text-sm text-muted">{r.comment}</p>
              )}
              <p className="mt-1 text-xs text-muted">
                {new Date(r.createdAt).toLocaleDateString('pt-BR')}
              </p>
            </div>
          ))}
        </div>
      </section>
        </div>
      </div>
    </Shell>
  );
}

/** Estrelas de exibição (1-5). */
function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex">
      {[1, 2, 3, 4, 5].map((i) => (
        <IconStar
          key={i}
          className={`h-4 w-4 ${i <= Math.round(value) ? 'text-accent' : 'text-border'}`}
        />
      ))}
    </span>
  );
}

/** Seletor de estrelas (1-5) para o formulário de avaliação. */
function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          aria-label={`${i} estrela(s)`}
          onClick={() => onChange(i)}
          className="p-0.5"
        >
          <IconStar
            className={`h-6 w-6 transition-colors ${i <= value ? 'text-accent' : 'text-border hover:text-accent/50'}`}
          />
        </button>
      ))}
    </div>
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
    <main className="mx-auto flex min-h-dvh max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6">
      <Link
        href="/"
        className="flex w-fit items-center gap-1 text-sm text-muted transition-colors hover:text-foreground"
      >
        <IconArrowLeft className="h-4 w-4" />
        Voltar
      </Link>

      <header className="flex items-center gap-3">
        {title && (
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-lg font-bold text-primary-foreground">
            {title.charAt(0).toUpperCase()}
          </span>
        )}
        <div>
          <p className="text-sm font-medium text-accent">Agendamento online</p>
          {title && (
            <h1 className="text-2xl font-bold leading-tight text-foreground">
              {title}
            </h1>
          )}
        </div>
      </header>
      {children}
    </main>
  );
}
