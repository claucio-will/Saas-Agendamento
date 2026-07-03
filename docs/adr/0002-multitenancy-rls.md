# ADR 0002 — Multi-tenancy com RLS e papel de aplicação não-privilegiado

**Status:** Aceito · **Data:** 2026-07-03

## Contexto

Requisito crítico e inegociável do PRD (2.3): isolamento 100% entre tenants.
Nenhum dado de um tenant pode ser lido/escrito por outro. Estratégia: banco
compartilhado com coluna `tenant_id` + Row-Level Security (RLS) no PostgreSQL
como defesa em profundidade, além do filtro na aplicação.

## Decisão

1. **Toda tabela de negócio tem `tenant_id`** e uma policy de RLS que só enxerga
   linhas do tenant corrente da sessão.

2. **O tenant corrente vem por transação**, nunca do cliente. O
   `PrismaService.runWithTenant(tenantId, work)` abre uma transação e executa
   `SELECT set_config('app.current_tenant', $tenantId, true)` (local à
   transação). A policy compara:

   ```sql
   tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::uuid
   ```

   O `NULLIF(..., '')` é essencial: após um `SET LOCAL`, o "reset value" do GUC
   vira **string vazia** (não NULL) na mesma conexão do pool; sem o NULLIF,
   `''::uuid` lançaria erro `22P02`. Sem contexto, a comparação vira NULL e a
   policy **nega tudo** (default seguro).

3. **`FORCE ROW LEVEL SECURITY`** em cada tabela, para a policy valer inclusive
   ao dono da tabela.

4. **Dois papéis de banco** (idiomático do Prisma via `url` + `directUrl`):
   - `DIRECT_DATABASE_URL` → papel privilegiado (dono). Roda **migrações**,
     `CREATE EXTENSION`, criação de policies e de papéis.
   - `DATABASE_URL` → `app_user`, **NOSUPERUSER NOBYPASSRLS**. É como o **runtime**
     conecta. Superusuários burlam RLS mesmo com FORCE — por isso o app nunca
     usa o papel privilegiado.

## Alternativas descartadas

- **Banco/schema por tenant:** custo operacional alto no cold-start; adiado.
- **Só filtro na aplicação (sem RLS):** um `where` esquecido vaza dados entre
  tenants. RLS é a rede de segurança.

## Verificação

`apps/backend/test/tenant-isolation.e2e-spec.ts` roda no CI contra Postgres real
e prova: leitura só do próprio tenant, impossibilidade de ler item alheio por id,
"nega tudo" sem contexto e bloqueio de INSERT com `tenant_id` de outro tenant
(WITH CHECK). Novos módulos devem adicionar testes equivalentes.
