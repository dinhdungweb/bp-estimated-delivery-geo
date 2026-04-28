CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "productId" TEXT,
    "widgetId" TEXT,
    "countryCode" TEXT,
    "productTags" JSONB,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AnalyticsEvent_shop_createdAt_idx" ON "AnalyticsEvent"("shop", "createdAt");
CREATE INDEX "AnalyticsEvent_shop_eventType_createdAt_idx" ON "AnalyticsEvent"("shop", "eventType", "createdAt");
CREATE INDEX "AnalyticsEvent_shop_countryCode_createdAt_idx" ON "AnalyticsEvent"("shop", "countryCode", "createdAt");
CREATE INDEX "AnalyticsEvent_shop_productId_createdAt_idx" ON "AnalyticsEvent"("shop", "productId", "createdAt");
