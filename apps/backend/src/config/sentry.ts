import * as Sentry from '@sentry/node';

/**
 * Inicializa o Sentry para monitoramento de erros (opcional, ativa só com DSN).
 * Deve ser chamado o mais cedo possível no boot, antes de criar a app Nest.
 * Ver PRD 3.5.
 */
export function initSentry(): void {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    tracesSampleRate: 0.1,
  });
}
