import { AsyncLocalStorage } from 'node:async_hooks';
import { Injectable } from '@nestjs/common';

export interface TenantStore {
  tenantId: string;
  userId?: string;
  role?: string;
}

/**
 * Guarda o tenant/usuário corrente por requisição via AsyncLocalStorage.
 * Na Fase 1, um guard de autenticação preenche esse contexto a partir do JWT
 * (nunca de parâmetros do cliente) e os casos de uso o consomem para chamar
 * `prisma.runWithTenant(...)`. Ver PRD 2.3.
 */
@Injectable()
export class TenantContextService {
  private readonly als = new AsyncLocalStorage<TenantStore>();

  run<T>(store: TenantStore, fn: () => T): T {
    return this.als.run(store, fn);
  }

  get(): TenantStore | undefined {
    return this.als.getStore();
  }

  /** Retorna o tenant corrente ou lança — para uso em pontos que o exigem. */
  requireTenantId(): string {
    const store = this.als.getStore();
    if (!store?.tenantId) {
      throw new Error('Nenhum tenant no contexto da requisição.');
    }
    return store.tenantId;
  }
}
