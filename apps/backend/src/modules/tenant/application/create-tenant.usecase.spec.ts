import { ConflictException } from '@nestjs/common';
import { Tenant } from '../domain/tenant.entity';
import type { TenantRepository } from '../domain/tenant.repository';
import { CreateTenantUseCase } from './create-tenant.usecase';

function makeTenant(slug: string): Tenant {
  return new Tenant(
    'id-1',
    'Nome',
    slug,
    'BARBERSHOP',
    'TRIAL',
    null,
    null,
    'America/Sao_Paulo',
    new Date(),
  );
}

function makeRepo(overrides: Partial<TenantRepository> = {}): TenantRepository {
  return {
    create: jest.fn(async (data) => makeTenant(data.slug)),
    findAll: jest.fn(async () => []),
    findBySlug: jest.fn(async () => null),
    updateStatus: jest.fn(async () => null),
    ...overrides,
  };
}

describe('CreateTenantUseCase', () => {
  it('cria o tenant quando o slug está livre', async () => {
    const repo = makeRepo();
    const useCase = new CreateTenantUseCase(repo);

    const tenant = await useCase.execute({
      name: 'Barbearia do Zé',
      slug: 'barbearia-do-ze',
      establishmentType: 'BARBERSHOP',
    });

    expect(tenant.slug).toBe('barbearia-do-ze');
    expect(repo.create).toHaveBeenCalledTimes(1);
  });

  it('rejeita quando o slug já existe', async () => {
    const repo = makeRepo({
      findBySlug: jest.fn(async () => makeTenant('barbearia-do-ze')),
    });
    const useCase = new CreateTenantUseCase(repo);

    await expect(
      useCase.execute({
        name: 'Outra',
        slug: 'barbearia-do-ze',
        establishmentType: 'BARBERSHOP',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(repo.create).not.toHaveBeenCalled();
  });
});
