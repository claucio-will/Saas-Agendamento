import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Cliente Prisma da aplicação + enforcement do multi-tenancy.
 *
 * O ponto crítico do isolamento é `runWithTenant`: qualquer acesso a tabelas de
 * negócio deve ocorrer dentro dele. Ele abre uma transação e define
 * `app.current_tenant` com `SET LOCAL` (via set_config local), fazendo as
 * policies de RLS do Postgres filtrarem por tenant. O `tenantId` vem
 * exclusivamente do JWT (nunca de body/query/param). Ver PRD 2.3 / 8.2 §2.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  /**
   * Executa `work` no contexto de um tenant, com RLS ativo. Tudo dentro do
   * callback enxerga apenas linhas do `tenantId` informado.
   */
  async runWithTenant<T>(
    tenantId: string,
    work: (tx: PrismaTransaction) => Promise<T>,
  ): Promise<T> {
    return this.$transaction(async (tx) => {
      // is_local = true -> vale apenas para esta transação.
      await tx.$executeRaw`SELECT set_config('app.current_tenant', ${tenantId}, true)`;
      return work(tx);
    });
  }
}

/** Tipo do handle transacional passado a `runWithTenant`. */
export type PrismaTransaction = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;
