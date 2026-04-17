-- BP: Estimated Delivery & Geo — Baseline Migration
-- Copyright © 2025 BluePeaks. All rights reserved.
-- This migration is a baseline for the existing PostgreSQL database created via prisma db push.

-- Session table
CREATE TABLE IF NOT EXISTS "Session" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT,
    "expires" TIMESTAMP(3),
    "accessToken" TEXT NOT NULL,
    "userId" BIGINT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "accountOwner" BOOLEAN NOT NULL DEFAULT false,
    "locale" TEXT,
    "collaborator" BOOLEAN DEFAULT false,
    "emailVerified" BOOLEAN DEFAULT false,
    "refreshToken" TEXT,
    "refreshTokenExpires" TIMESTAMP(3),
    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- DeliveryRule table
CREATE TABLE IF NOT EXISTS "DeliveryRule" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "minDays" INTEGER NOT NULL DEFAULT 3,
    "maxDays" INTEGER NOT NULL DEFAULT 7,
    "processingDays" INTEGER NOT NULL DEFAULT 1,
    "shippingMessage" TEXT NOT NULL DEFAULT 'Order today and get it by: {min_date} - {max_date}',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DeliveryRule_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "DeliveryRule_shop_countryCode_idx" ON "DeliveryRule"("shop", "countryCode");

-- AppSetting table
CREATE TABLE IF NOT EXISTS "AppSetting" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "widgetStyle" TEXT NOT NULL DEFAULT 'modern',
    "textColor" TEXT NOT NULL DEFAULT '#000000',
    "iconColor" TEXT NOT NULL DEFAULT '#0033cc',
    "showTimeline" BOOLEAN NOT NULL DEFAULT true,
    "policyText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AppSetting_shop_key" ON "AppSetting"("shop");
