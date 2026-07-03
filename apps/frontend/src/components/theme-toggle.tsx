'use client';

import { useTheme } from './theme-provider';

/** Botão de 1 clique para alternar light/dark. Touch target ≥ 44px. */
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface text-foreground transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <span aria-hidden className="text-lg">
        {isDark ? '☀️' : '🌙'}
      </span>
    </button>
  );
}
