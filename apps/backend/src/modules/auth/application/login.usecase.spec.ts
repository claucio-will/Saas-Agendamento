import { UnauthorizedException } from '@nestjs/common';
import { UserRole } from '@repo/shared';
import { User } from '../domain/user.entity';
import type { PasswordHasher } from '../domain/password-hasher';
import type { UserRepository } from '../domain/user.repository';
import type { AuthResult } from './auth-result';
import { LoginUseCase } from './login.usecase';
import type { TokenIssuer } from './token-issuer';

function makeUser(): User {
  return new User(
    'u1',
    'joao@exemplo.com',
    'João',
    UserRole.CUSTOMER,
    null,
    'hash-da-senha',
    null,
    false,
    new Date(),
  );
}

const tokenIssuer = {
  issueFor: jest.fn(
    async (user: User): Promise<AuthResult> => ({
      user,
      accessToken: 'access',
      refreshToken: 'refresh',
    }),
  ),
} as unknown as TokenIssuer;

function makeUsers(user: User | null): UserRepository {
  return {
    findByEmail: jest.fn(async () => user),
    findById: jest.fn(async () => user),
    create: jest.fn(),
    findOwners: jest.fn(async () => []),
  };
}

function makeHasher(valid: boolean): PasswordHasher {
  return {
    hash: jest.fn(async () => 'hash'),
    verify: jest.fn(async () => valid),
  };
}

describe('LoginUseCase', () => {
  it('emite tokens com credenciais válidas', async () => {
    const useCase = new LoginUseCase(
      makeUsers(makeUser()),
      makeHasher(true),
      tokenIssuer,
    );
    const result = await useCase.execute({
      email: 'JOAO@exemplo.com',
      password: 'segredo123',
    });
    expect(result.accessToken).toBe('access');
    expect(result.refreshToken).toBe('refresh');
  });

  it('rejeita senha incorreta', async () => {
    const useCase = new LoginUseCase(
      makeUsers(makeUser()),
      makeHasher(false),
      tokenIssuer,
    );
    await expect(
      useCase.execute({ email: 'joao@exemplo.com', password: 'errada' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejeita e-mail inexistente', async () => {
    const useCase = new LoginUseCase(
      makeUsers(null),
      makeHasher(true),
      tokenIssuer,
    );
    await expect(
      useCase.execute({ email: 'ninguem@exemplo.com', password: 'x' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
