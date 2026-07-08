'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { PublicEstablishmentDto } from '@repo/shared';
import { apiFetch } from '../lib/api';
import { ESTABLISHMENT_LABEL } from '../lib/labels';
import { IconMapPin } from './icons';
import { Card, CardTitle } from './ui/card';

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
    <section id="estabelecimentos" className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-bold text-foreground">Estabelecimentos</h2>
        <p className="text-sm text-muted">
          Escolha um lugar e agende online em segundos.
        </p>
      </div>

      {items === null && (
        <div className="flex justify-center py-8">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-transparent" />
        </div>
      )}

      {items && items.length === 0 && (
        <p className="text-sm text-muted">
          Nenhum estabelecimento disponível ainda.
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items?.map((e) => (
          <Link key={e.slug} href={`/b/${e.slug}`} className="group">
            <Card className="flex h-full flex-col gap-2 transition-colors group-hover:border-accent">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-base font-bold text-primary-foreground">
                {e.name.charAt(0).toUpperCase()}
              </span>
              <CardTitle className="text-base">{e.name}</CardTitle>
              <p className="flex items-center gap-1.5 text-xs text-muted">
                <span className="rounded-full bg-accent/15 px-2 py-0.5 font-medium text-accent">
                  {ESTABLISHMENT_LABEL[e.establishmentType]}
                </span>
                {e.city && (
                  <span className="flex items-center gap-1">
                    <IconMapPin className="h-3.5 w-3.5" />
                    {e.city}
                  </span>
                )}
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
