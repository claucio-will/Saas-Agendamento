-- Avaliações de estabelecimentos (PRD 2.11). Tabela de negócio: coluna
-- tenant_id + RLS forçado por tenant, no mesmo padrão das demais. O app_user
-- recebe os grants automaticamente via ALTER DEFAULT PRIVILEGES (migração
-- 20260703000200_app_role); mantemos o GRANT explícito por segurança.

CREATE TABLE "reviews" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "customer_name" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "reviews_rating_check" CHECK ("rating" BETWEEN 1 AND 5)
);

CREATE UNIQUE INDEX "reviews_tenant_id_customer_id_key" ON "reviews"("tenant_id", "customer_id");
CREATE INDEX "reviews_tenant_id_idx" ON "reviews"("tenant_id");

ALTER TABLE "reviews"
    ADD CONSTRAINT "reviews_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RLS: cada tenant só enxerga as próprias avaliações.
ALTER TABLE "reviews" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "reviews" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "reviews"
    USING ("tenant_id" = NULLIF(current_setting('app.current_tenant', true), '')::uuid)
    WITH CHECK ("tenant_id" = NULLIF(current_setting('app.current_tenant', true), '')::uuid);

GRANT SELECT, INSERT, UPDATE, DELETE ON "reviews" TO app_user;
