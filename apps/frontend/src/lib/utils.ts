/** Concatena classes condicionalmente (mini-`clsx`, sem dependência). */
export function cn(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(' ');
}
