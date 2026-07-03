import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import type { LoginDto } from '@repo/shared';
import {
  PASSWORD_HASHER,
  type PasswordHasher,
} from '../domain/password-hasher';
import { USER_REPOSITORY, type UserRepository } from '../domain/user.repository';
import type { AuthResult } from './auth-result';
import { TokenIssuer } from './token-issuer';

/** Login por e-mail + senha. Ver PRD 2.2. */
@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
    private readonly tokenIssuer: TokenIssuer,
  ) {}

  async execute(input: LoginDto): Promise<AuthResult> {
    const user = await this.users.findByEmail(input.email.toLowerCase());
    // Mesma mensagem para "não existe" e "senha errada" (evita enumeração).
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }
    const valid = await this.hasher.verify(user.passwordHash, input.password);
    if (!valid) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }
    return this.tokenIssuer.issueFor(user);
  }
}
