import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

/** Superfície elevada do design system. Ver PRD 3.3. */
export function Card({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-card',
        'transition-[transform,box-shadow,border-color] duration-200 ease-[var(--ease-fluid)]',
        className,
      )}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('text-lg font-semibold text-foreground', className)}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('mt-1 text-sm text-muted', className)} {...props} />
  );
}
