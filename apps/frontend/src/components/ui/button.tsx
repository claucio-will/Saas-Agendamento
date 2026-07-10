'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

type Variant = 'primary' | 'accent' | 'outline' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-[var(--radius-btn)] font-semibold select-none cursor-pointer ' +
  'transition-[transform,background-color,box-shadow,opacity] duration-200 ease-[var(--ease-fluid)] ' +
  'active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ' +
  'disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100';

const variants: Record<Variant, string> = {
  primary:
    'bg-primary text-primary-foreground shadow-glow hover:brightness-110 hover:-translate-y-px',
  accent:
    'bg-accent text-accent-foreground shadow-sm hover:brightness-110 hover:-translate-y-px',
  outline:
    'border border-border bg-surface/60 text-foreground hover:bg-surface hover:border-ring/50',
  ghost: 'bg-transparent text-foreground hover:bg-surface-2',
};

// Touch targets ≥ 44px (h-11) no md/lg para uso mobile. Ver PRD 3.3.
const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = 'primary', size = 'md', loading = false, disabled, className, children, ...props },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading && (
          <span
            aria-hidden
            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          />
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
