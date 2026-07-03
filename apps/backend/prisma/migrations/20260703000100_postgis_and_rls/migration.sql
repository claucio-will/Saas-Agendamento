-- Extensão geoespacial usada na descoberta pública por raio (Etapa 1.3). Ver PRD 2.7.
CREATE EXTENSION IF NOT EXISTS postgis;

-- =====================================================================
-- Row-Level Security (RLS) — defesa em profundidade do multi-tenancy.
-- Ver PRD 2.3 / 8.2 §2.
--
-- Toda tabela de negócio (com `tenant_id`) recebe:
--   1. ENABLE ROW LEVEL SECURITY   -> ativa o mecanismo
--   2. FORCE  ROW LEVEL SECURITY   -> aplica a policy MESMO ao dono da tabela
--      (sem FORCE, o owner/superuser burla o RLS)
--   3. Policy que só enxerga linhas do tenant corrente da sessão.
--
-- O tenant corrente é definido por transação via
--   SELECT set_config('app.current_tenant', '<uuid>', true)
-- feito pelo PrismaService (nunca vem do cliente). Sem contexto definido,
-- current_setting(..., true) retorna string vazia (o "reset value" do GUC após
-- um SET LOCAL na mesma conexão), então usamos NULLIF(...,'') -> NULL: a
-- comparação vira NULL e a policy não retorna nenhuma linha
-- (default seguro: "nega tudo"). Sem o NULLIF, ''::uuid lançaria erro 22P02.
-- =====================================================================

ALTER TABLE "example_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "example_items" FORCE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON "example_items"
    USING ("tenant_id" = NULLIF(current_setting('app.current_tenant', true), '')::uuid)
    WITH CHECK ("tenant_id" = NULLIF(current_setting('app.current_tenant', true), '')::uuid);
