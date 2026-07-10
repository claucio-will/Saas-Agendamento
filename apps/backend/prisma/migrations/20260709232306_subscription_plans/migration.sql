-- CreateEnum
CREATE TYPE "PlanTier" AS ENUM ('ESSENCIAL', 'PROFISSIONAL', 'STUDIO');

-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "plan" "PlanTier" NOT NULL DEFAULT 'ESSENCIAL',
ADD COLUMN     "subscribed_at" TIMESTAMP(3),
ADD COLUMN     "trial_ends_at" TIMESTAMP(3);
