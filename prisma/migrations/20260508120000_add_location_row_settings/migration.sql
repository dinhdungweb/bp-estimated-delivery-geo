ALTER TABLE "AppSetting"
ADD COLUMN "locationPrefixText" TEXT NOT NULL DEFAULT 'Delivery to',
ADD COLUMN "showLocationFlag" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "locationRowAlignment" TEXT NOT NULL DEFAULT 'right';
