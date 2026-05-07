ALTER TABLE "Widget"
ADD COLUMN "isReusable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "sourceWidgetId" TEXT;

CREATE INDEX "Widget_shop_isReusable_idx" ON "Widget"("shop", "isReusable");
