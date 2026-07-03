import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import type { User } from '../domain/user.entity';
import { USER_REPOSITORY, type UserRepository } from '../domain/user.repository';

/** Retorna o usuário autenticado (rota /auth/me). */
@Injectable()
export class GetMeUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  async execute(userId: string): Promise<User> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado.');
    }
    return user;
  }
}
