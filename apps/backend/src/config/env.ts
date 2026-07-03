import { z } from 'zod';

/**
 * Validação das variáveis de ambiente no boot (fail-fast). Ver PRD 8.2 §10.
 * Segredos nunca são commitados; `.env.example` documenta as chaves.
 */
export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().url(),
  // Usado apenas pela CLI do Prisma (migrações). Opcional no runtime do app.
  DIRECT_DATABASE_URL: z.string().url().optional(),
  REDIS_URL: z.string().url().default('redis://localhost:6379'),
  WEB_ORIGIN: z.string().url().default('http://localhost:3000'),
  // Segredos JWT (access curto + refresh rotativo). Ver PRD 2.2 / 3.4.
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL_DAYS: z.coerce.number().int().positive().default(7),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
    .default('info'),
  SENTRY_DSN: z.string().url().optional(),
});

export type Env = z.infer<typeof envSchema>;

/** Usado por `ConfigModule.forRoot({ validate })`. */
export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.') || '(raiz)'}: ${i.message}`)
      .join('\n');
    throw new Error(`Variáveis de ambiente inválidas:\n${issues}`);
  }
  return parsed.data;
}
