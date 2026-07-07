-- CreateEnum
CREATE TYPE "PricingType" AS ENUM ('FIXED', 'STARTING_AT', 'QUOTE');
CREATE TYPE "AppointmentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- AlterTable: regras de agendamento no tenant
ALTER TABLE "tenants" ADD COLUMN "min_advance_minutes" INTEGER NOT NULL DEFAULT 60;
ALTER TABLE "tenants" ADD COLUMN "max_advance_days" INTEGER NOT NULL DEFAULT 60;
ALTER TABLE "tenants" ADD COLUMN "slot_interval_minutes" INTEGER NOT NULL DEFAULT 15;

-- CreateTable: categorias globais (sem tenant)
CREATE TABLE "service_categories" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "service_categories_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "service_categories_slug_key" ON "service_categories"("slug");

-- CreateTable: services
CREATE TABLE "services" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "category_id" UUID,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "duration_minutes" INTEGER NOT NULL,
    "price_cents" INTEGER NOT NULL,
    "pricing_type" "PricingType" NOT NULL DEFAULT 'FIXED',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "services_tenant_id_idx" ON "services"("tenant_id");

-- CreateTable: professionals
CREATE TABLE "professionals" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_id" UUID,
    "name" TEXT NOT NULL,
    "bio" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "professionals_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "professionals_tenant_id_idx" ON "professionals"("tenant_id");

-- CreateTable: service_professionals (N:N)
CREATE TABLE "service_professionals" (
    "service_id" UUID NOT NULL,
    "professional_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    CONSTRAINT "service_professionals_pkey" PRIMARY KEY ("service_id", "professional_id")
);
CREATE INDEX "service_professionals_tenant_id_idx" ON "service_professionals"("tenant_id");
CREATE INDEX "service_professionals_professional_id_idx" ON "service_professionals"("professional_id");

-- CreateTable: working_hours
CREATE TABLE "working_hours" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "professional_id" UUID NOT NULL,
    "weekday" INTEGER NOT NULL,
    "start_minute" INTEGER NOT NULL,
    "end_minute" INTEGER NOT NULL,
    CONSTRAINT "working_hours_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "working_hours_tenant_id_idx" ON "working_hours"("tenant_id");
CREATE INDEX "working_hours_professional_id_idx" ON "working_hours"("professional_id");

-- CreateTable: time_blocks
CREATE TABLE "time_blocks" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "professional_id" UUID NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    CONSTRAINT "time_blocks_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "time_blocks_tenant_id_idx" ON "time_blocks"("tenant_id");
CREATE INDEX "time_blocks_professional_id_starts_at_idx" ON "time_blocks"("professional_id", "starts_at");

-- CreateTable: appointments
CREATE TABLE "appointments" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "service_id" UUID NOT NULL,
    "professional_id" UUID NOT NULL,
    "customer_id" UUID,
    "customer_name" TEXT NOT NULL,
    "customer_email" TEXT NOT NULL,
    "customer_phone" TEXT,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'PENDING',
    "price_cents" INTEGER NOT NULL,
    "notes" TEXT,
    "cancel_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "appointments_tenant_id_idx" ON "appointments"("tenant_id");
CREATE INDEX "appointments_professional_id_starts_at_idx" ON "appointments"("professional_id", "starts_at");
CREATE INDEX "appointments_customer_id_idx" ON "appointments"("customer_id");

-- Foreign keys
ALTER TABLE "services" ADD CONSTRAINT "services_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "services" ADD CONSTRAINT "services_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "service_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "professionals" ADD CONSTRAINT "professionals_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "service_professionals" ADD CONSTRAINT "service_professionals_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "service_professionals" ADD CONSTRAINT "service_professionals_professional_id_fkey" FOREIGN KEY ("professional_id") REFERENCES "professionals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "working_hours" ADD CONSTRAINT "working_hours_professional_id_fkey" FOREIGN KEY ("professional_id") REFERENCES "professionals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "time_blocks" ADD CONSTRAINT "time_blocks_professional_id_fkey" FOREIGN KEY ("professional_id") REFERENCES "professionals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_professional_id_fkey" FOREIGN KEY ("professional_id") REFERENCES "professionals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- =====================================================================
-- RLS em todas as tabelas de negócio (mesmo padrão do ADR 0002).
-- service_categories é GLOBAL (sem tenant) → sem RLS.
-- =====================================================================
ALTER TABLE "services" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "services" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "services"
    USING ("tenant_id" = NULLIF(current_setting('app.current_tenant', true), '')::uuid)
    WITH CHECK ("tenant_id" = NULLIF(current_setting('app.current_tenant', true), '')::uuid);

ALTER TABLE "professionals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "professionals" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "professionals"
    USING ("tenant_id" = NULLIF(current_setting('app.current_tenant', true), '')::uuid)
    WITH CHECK ("tenant_id" = NULLIF(current_setting('app.current_tenant', true), '')::uuid);

ALTER TABLE "service_professionals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "service_professionals" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "service_professionals"
    USING ("tenant_id" = NULLIF(current_setting('app.current_tenant', true), '')::uuid)
    WITH CHECK ("tenant_id" = NULLIF(current_setting('app.current_tenant', true), '')::uuid);

ALTER TABLE "working_hours" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "working_hours" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "working_hours"
    USING ("tenant_id" = NULLIF(current_setting('app.current_tenant', true), '')::uuid)
    WITH CHECK ("tenant_id" = NULLIF(current_setting('app.current_tenant', true), '')::uuid);

ALTER TABLE "time_blocks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "time_blocks" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "time_blocks"
    USING ("tenant_id" = NULLIF(current_setting('app.current_tenant', true), '')::uuid)
    WITH CHECK ("tenant_id" = NULLIF(current_setting('app.current_tenant', true), '')::uuid);

ALTER TABLE "appointments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "appointments" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "appointments"
    USING ("tenant_id" = NULLIF(current_setting('app.current_tenant', true), '')::uuid)
    WITH CHECK ("tenant_id" = NULLIF(current_setting('app.current_tenant', true), '')::uuid);

-- =====================================================================
-- Prevenção de overbooking (PRD 2.9 / 8.2 §5): constraint de exclusão.
-- Impede dois agendamentos ATIVOS sobrepostos para o mesmo profissional,
-- mesmo sob concorrência (garantia no nível do banco, não em memória).
-- tsrange '[)' = início inclusivo / fim exclusivo (back-to-back não colide).
-- =====================================================================
CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_no_overlap"
    EXCLUDE USING gist (
        "professional_id" WITH =,
        tsrange("starts_at", "ends_at") WITH &&
    ) WHERE ("status" <> 'CANCELLED' AND "status" <> 'NO_SHOW');
