import type { Prisma } from "@prisma/client";
import prisma from "../db.server";
import {
  buildFallbackBlocks,
  DEFAULT_SHIPPING_MESSAGE,
  type InventoryStatus,
  normalizeCollectionIds,
  normalizeProductIds,
  normalizeRuleInventoryStatus,
  normalizeTags,
} from "./delivery";
import { jsonStringArray, sameStringArray } from "./deliveryRules";

export type RuleWidgetOption = {
  id: string;
  name: string;
  isDefault: boolean;
  isActive: boolean;
};

export async function ensureDefaultWidget(shop: string): Promise<RuleWidgetOption> {
  const existing = await prisma.widget.findFirst({
    where: { shop, isDefault: true },
    select: { id: true, name: true, isDefault: true, isActive: true },
  });

  if (existing) return existing;

  return prisma.widget.create({
    data: {
      shop,
      name: "Default Widget",
      isDefault: true,
      isActive: true,
      padding: 16,
      customBlocks: buildFallbackBlocks(
        {},
        DEFAULT_SHIPPING_MESSAGE,
      ) as unknown as Prisma.InputJsonValue,
    },
    select: { id: true, name: true, isDefault: true, isActive: true },
  });
}

export async function ensureAppSetting(shop: string) {
  const existing = await prisma.appSetting.findUnique({ where: { shop } });
  if (existing) return existing;

  return prisma.appSetting.create({
    data: {
      shop,
      isEnabled: true,
      widgetStyle: "modern",
    },
  });
}

export async function ensureEnabledAppSetting(shop: string) {
  return prisma.appSetting.upsert({
    where: { shop },
    update: { isEnabled: true },
    create: {
      shop,
      isEnabled: true,
      widgetStyle: "modern",
    },
  });
}

export async function hasDuplicateDeliveryRule({
  shop,
  id,
  countryCode,
  targetCountries = [],
  targetProducts,
  targetCollections,
  targetTags,
  inventoryStatus = "both",
}: {
  shop: string;
  id?: string;
  countryCode: string;
  targetCountries?: string[];
  targetProducts: string[];
  targetCollections: string[];
  targetTags: string[];
  inventoryStatus?: InventoryStatus;
}) {
  const normalizedInventoryStatus = normalizeRuleInventoryStatus(inventoryStatus);
  const possibleDuplicates = await prisma.deliveryRule.findMany({
    where: {
      shop,
      countryCode,
      ...(id ? { NOT: { id } } : {}),
    },
  });

  return possibleDuplicates.some((rule) => {
    return (
      sameStringArray(jsonStringArray(rule.targetCountries), targetCountries) &&
      sameStringArray(normalizeProductIds(jsonStringArray(rule.targetProducts)), targetProducts) &&
      sameStringArray(normalizeCollectionIds(jsonStringArray(rule.targetCollections)), targetCollections) &&
      sameStringArray(normalizeTags(jsonStringArray(rule.targetTags)), targetTags) &&
      normalizeRuleInventoryStatus(rule.inventoryStatus) === normalizedInventoryStatus
    );
  });
}
