import { z } from 'zod';

/** Resposta do health check (usada por web e monitor de uptime). Ver PRD 3.5. */
export const healthResponseSchema = z.object({
  status: z.enum(['ok', 'error']),
  info: z.record(z.string(), z.object({ status: z.string() })).optional(),
  error: z.record(z.string(), z.object({ status: z.string() })).optional(),
});
export type HealthResponseDto = z.infer<typeof healthResponseSchema>;
