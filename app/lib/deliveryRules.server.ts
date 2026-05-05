import type { Prisma } from "@prisma/client";
import prisma from "../db.server";
import {
  buildFallbackBlocks,
  DEFAULT_SHIPPING_MESSAGE,
  normalizeProductIds,
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

export async function hasDuplicateDeliveryRule({
  shop,
  id,
  countryCode,
  targetProducts,
  targetTags,
}: {
  shop: string;
  id?: string;
  countryCode: string;
  targetProducts: string[];
  targetTags: string[];
}) {
  const possibleDuplicates = await prisma.deliveryRule.findMany({
    where: {
      shop,
      countryCode,
      ...(id ? { NOT: { id } } : {}),
    },
  });

  return possibleDuplicates.some((rule) => {
    return (
      sameStringArray(normalizeProductIds(jsonStringArray(rule.targetProducts)), targetProducts) &&
      sameStringArray(normalizeTags(jsonStringArray(rule.targetTags)), targetTags)
    );
  });
}
