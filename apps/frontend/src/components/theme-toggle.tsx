'use client';

import { useTheme } from './theme-provider';
import { IconMoon, IconSun } from './icons';

const OPTIONS = [
  { value: 'light' as const, label: 'Claro', Icon: IconSun },
  { value: 'dark' as const, label: 'Escuro', Icon: IconMoon },
];

/**
 * Seletor de tema segmentado (Claro | Escuro), inline — pensado para a barra
 * lateral, onde há espaço e clareza importa mais que um ícone de engrenagem.
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <div
      role="group"
      aria-label="Aparência"
      className="flex items-center gap-1 rounded-xl border border-border bg-surface-2/60 p-1"
    >
      {OPTIONS.map((opt) => {
        const active = theme === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={active}
            onClick={() => setTheme(opt.value)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
              active
                ? 'bg-surface text-foreground shadow-sm'
                : 'text-muted hover:text-foreground'
            }`}
          >
            <opt.Icon className="h-4 w-4" />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
