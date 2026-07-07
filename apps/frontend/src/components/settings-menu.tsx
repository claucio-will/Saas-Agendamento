'use client';

import { useState } from 'react';
import { useTheme } from './theme-provider';

const OPTIONS = [
  { value: 'light' as const, label: 'Claro', icon: '☀️' },
  { value: 'dark' as const, label: 'Escuro', icon: '🌙' },
];

/**
 * Menu de ajustes (engrenagem) na barra superior. Concentra a preferência de
 * aparência (tema claro/escuro) num único lugar, em vez de um botão por tela.
 */
export function SettingsMenu() {
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
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-foreground transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <span aria-hidden className="text-base">
          ⚙️
        </span>
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
            className="absolute right-0 z-40 mt-2 w-48 rounded-xl border border-border bg-surface p-2 shadow-lg"
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
                    <span aria-hidden>{opt.icon}</span>
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
