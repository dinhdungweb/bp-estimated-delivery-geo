-- Add cached shop plan state for storefront entitlement checks.
ALTER TABLE "AppSetting"
ADD COLUMN "planHandle" TEXT NOT NULL DEFAULT 'free',
ADD COLUMN "planSubscriptionId" TEXT,
ADD COLUMN "planSyncedAt" TIMESTAMP(3);

-- Add widget entitlement metadata while preserving runtime fallback from customBlocks.
ALTER TABLE "Widget"
ADD COLUMN "sourceTemplateId" TEXT,
ADD COLUMN "requiredPlan" TEXT NOT NULL DEFAULT 'free';
