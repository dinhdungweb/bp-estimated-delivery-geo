-- AlterTable
ALTER TABLE "DeliveryRule" ADD COLUMN "targetCountries" JSONB;
ALTER TABLE "DeliveryRule" ADD COLUMN "marketId" TEXT;
ALTER TABLE "DeliveryRule" ADD COLUMN "marketName" TEXT;
