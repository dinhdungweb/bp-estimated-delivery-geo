ALTER TABLE "DeliveryRule"
ADD COLUMN "inventoryStatus" TEXT NOT NULL DEFAULT 'both';

CREATE INDEX "DeliveryRule_shop_countryCode_inventoryStatus_idx"
ON "DeliveryRule"("shop", "countryCode", "inventoryStatus");
