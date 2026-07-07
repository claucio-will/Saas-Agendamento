'use client';

import { useState } from 'react';
import { useTheme } from './theme-provider';
import { IconCog, IconMoon, IconSun } from './icons';

const OPTIONS = [
  { value: 'light' as const, label: 'Claro', Icon: IconSun },
  { value: 'dark' as const, label: 'Escuro', Icon: IconMoon },
];

/**
 * Menu de ajustes (engrenagem) na barra superior/lateral. Concentra a
 * preferência de aparência (tema claro/escuro) num único lugar.
 * `up` abre para cima; `align` controla o lado da abertura.
 */
export function SettingsMenu({
  up = false,
  align = 'right',
}: {
  up?: boolean;
  align?: 'left' | 'right';
}) {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Ajustes"
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-muted transition-colors hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <IconCog className="h-[18px] w-[18px]" />
      </button>

      {open && (
        <>
          {/* Fecha ao clicar fora */}
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-30 cursor-default"
          />
          <div
            role="menu"
            className={`absolute z-40 w-48 rounded-xl border border-border bg-surface p-2 shadow-lg ${
              up ? 'bottom-full mb-2' : 'mt-2'
            } ${align === 'left' ? 'left-0' : 'right-0'}`}
          >
            <p className="px-2 py-1 text-xs font-medium uppercase tracking-wide text-muted">
              Aparência
            </p>
            {OPTIONS.map((opt) => {
              const active = theme === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="menuitemradio"
                  aria-checked={active}
                  onClick={() => {
                    setTheme(opt.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-2 py-2 text-sm transition-colors ${
                    active
                      ? 'bg-background font-medium text-foreground'
                      : 'text-muted hover:bg-background hover:text-foreground'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <opt.Icon className="h-4 w-4" />
                    {opt.label}
                  </span>
                  {active && <span aria-hidden className="text-accent">✓</span>}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
