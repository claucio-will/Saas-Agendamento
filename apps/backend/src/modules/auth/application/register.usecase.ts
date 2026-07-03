import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { UserRole, type RegisterDto } from '@repo/shared';
import {
  PASSWORD_HASHER,
  type PasswordHasher,
} from '../domain/password-hasher';
import { USER_REPOSITORY, type UserRepository } from '../domain/user.repository';
import type { AuthResult } from './auth-result';
import { TokenIssuer } from './token-issuer';

/** Cadastro público de cliente final (role CUSTOMER). Ver PRD 2.8. */
@Injectable()
export class RegisterUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
    private readonly tokenIssuer: TokenIssuer,
  ) {}

  async execute(input: RegisterDto): Promise<AuthResult> {
    const email = input.email.toLowerCase();
    const existing = await this.users.findByEmail(email);
    if (existing) {
      throw new ConflictException('E-mail já cadastrado.');
    }

    const passwordHash = await this.hasher.hash(input.password);
    const user = await this.users.create({
      email,
      name: input.name,
      role: UserRole.CUSTOMER,
      tenantId: null,
      phone: input.phone ?? null,
      passwordHash,
    });

    return this.tokenIssuer.issueFor(user);
  }
}
