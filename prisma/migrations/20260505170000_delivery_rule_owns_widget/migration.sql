-- AlterTable
ALTER TABLE "DeliveryRule"
ADD COLUMN     "widgetId" TEXT,
ADD COLUMN     "targetProducts" JSONB,
ADD COLUMN     "targetTags" JSONB;

-- CreateIndex
CREATE INDEX "DeliveryRule_shop_widgetId_idx" ON "DeliveryRule"("shop", "widgetId");

-- AddForeignKey
ALTER TABLE "DeliveryRule" ADD CONSTRAINT "DeliveryRule_widgetId_fkey" FOREIGN KEY ("widgetId") REFERENCES "Widget"("id") ON DELETE SET NULL ON UPDATE CASCADE;
