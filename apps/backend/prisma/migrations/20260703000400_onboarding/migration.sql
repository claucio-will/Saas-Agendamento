-- AlterTable: campos de endereço, geolocalização e config por vertical
ALTER TABLE "tenants" ADD COLUMN "address_line" TEXT;
ALTER TABLE "tenants" ADD COLUMN "city" TEXT;
ALTER TABLE "tenants" ADD COLUMN "state" TEXT;
ALTER TABLE "tenants" ADD COLUMN "postal_code" TEXT;
ALTER TABLE "tenants" ADD COLUMN "latitude" DOUBLE PRECISION;
ALTER TABLE "tenants" ADD COLUMN "longitude" DOUBLE PRECISION;
ALTER TABLE "tenants" ADD COLUMN "settings" JSONB;

-- CreateTable: aceite de termos (versão, data/hora, IP)
CREATE TABLE "terms_acceptances" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "tenant_id" UUID,
    "terms_version" TEXT NOT NULL,
    "ip_address" TEXT,
    "accepted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "terms_acceptances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "terms_acceptances_user_id_idx" ON "terms_acceptances"("user_id");

-- AddForeignKey
ALTER TABLE "terms_acceptances" ADD CONSTRAINT "terms_acceptances_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "terms_acceptances" ADD CONSTRAINT "terms_acceptances_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
