'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { PublicEstablishmentDto } from '@repo/shared';
import { apiFetch } from '../lib/api';
import { ESTABLISHMENT_LABEL } from '../lib/labels';
import { IconArrowRight, IconMapPin } from './icons';

/** Grade pública de estabelecimentos (descoberta na home). */
export function EstablishmentDiscovery() {
  const [items, setItems] = useState<PublicEstablishmentDto[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    apiFetch<PublicEstablishmentDto[]>('/establishments')
      .then(setItems)
      .catch(() => setFailed(true));
  }, []);

  if (failed) return null;

  return (
    <section id="estabelecimentos" className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Estabelecimentos
          </h2>
          <p className="mt-1 text-sm text-muted">
            Escolha um lugar e agende online em segundos.
          </p>
        </div>
        {items && items.length > 0 && (
          <span className="text-sm text-muted">
            {items.length} lugar{items.length > 1 ? 'es' : ''} disponíve
            {items.length > 1 ? 'is' : 'l'}
          </span>
        )}
      </div>

      {items === null && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-[var(--radius-card)] bg-surface-2"
            />
          ))}
        </div>
      )}

      {items && items.length === 0 && (
        <p className="text-sm text-muted">
          Nenhum estabelecimento disponível ainda.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items?.map((e) => (
          <Link
            key={e.slug}
            href={`/b/${e.slug}`}
            className="group relative flex flex-col gap-4 overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-card transition-[transform,border-color,box-shadow] duration-200 ease-[var(--ease-fluid)] hover:-translate-y-1 hover:border-ring/50 hover:shadow-lg"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/10 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
            />
            <div className="relative flex items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-emerald-600 text-lg font-bold text-primary-foreground shadow-glow">
                {e.name.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <h3 className="truncate text-base font-semibold text-foreground">
                  {e.name}
                </h3>
                <span className="mt-0.5 inline-flex rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent">
                  {ESTABLISHMENT_LABEL[e.establishmentType]}
                </span>
              </div>
            </div>
            <div className="relative flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-muted">
                {e.city && (
                  <>
                    <IconMapPin className="h-4 w-4" />
                    {e.city}
                  </>
                )}
              </span>
              <span className="flex items-center gap-1 font-medium text-primary opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                Agendar
                <IconArrowRight className="h-4 w-4" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
