import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Autenticação OPCIONAL: se houver Bearer válido, popula req.user; senão segue
 * como anônimo (não lança). Usado no agendamento — o cliente navega e agenda
 * sem login, mas se estiver logado aproveitamos sua identidade. Ver PRD 2.2/2.8.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = unknown>(_err: unknown, user: TUser): TUser | null {
    return user ?? null;
  }
}
