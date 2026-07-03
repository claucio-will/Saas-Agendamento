import { BadRequestException, PipeTransform } from '@nestjs/common';
import { ZodError, ZodType } from 'zod';

/**
 * Pipe que valida o payload contra um schema Zod compartilhado (packages/shared),
 * garantindo a mesma validação em web e backend. Ver PRD 8.2 §6.
 *
 * Uso: `@Body(new ZodValidationPipe(createTenantSchema)) dto: CreateTenantDto`
 */
export class ZodValidationPipe<T> implements PipeTransform {
  constructor(private readonly schema: ZodType<T>) {}

  transform(value: unknown): T {
    try {
      return this.schema.parse(value);
    } catch (err) {
      if (err instanceof ZodError) {
        throw new BadRequestException({
          message: 'Falha de validação',
          errors: err.issues.map((i) => ({
            path: i.path.join('.'),
            message: i.message,
          })),
        });
      }
      throw err;
    }
  }
}
