import type { Prisma, PrismaClient } from "@prisma/client";
import {
  normalizeCountries,
  normalizeProductIds,
  normalizeTags,
  parseBlockConfigs,
  parseJsonArrayField,
} from "./delivery";
import {
  canEditWidget,
  getRequiredPlanForBlocks,
  getRequiredPlanForWidget,
  isAtLeastPlan,
  PRICING_PLANS,
  type PricingPlan,
} from "./pricing";

export type WidgetStudioDb = Pick<PrismaClient, "widget" | "$transaction">;

export type SaveWidgetStudioResult = {
  success?: boolean;
  newId?: string;
  designName?: string;
  savedAsDesign?: boolean;
  error?: string;
  status?: number;
};

const GENERIC_WIDGET_NAMES = new Set(["default widget", "main widget", "untitled widget"]);

function resolveDesignName(widgetName: string, suggestedName: string) {
  const name = widgetName.trim();
  const designName = suggestedName.trim();

  if (name && !GENERIC_WIDGET_NAMES.has(name.toLowerCase())) {
    return name;
  }

  return designName || name || "Custom Design";
}

export async function saveWidgetStudio({
  db,
  formData,
  id,
  requestUrl,
  shop,
  currentPlan,
}: {
  db: WidgetStudioDb;
  formData: FormData;
  id: string | undefined;
  requestUrl: string;
  shop: string;
  currentPlan: PricingPlan;
}): Promise<SaveWidgetStudioResult> {
  const url = new URL(requestUrl);
  const widgetId = id || "";
  const sourceTemplateId = String(url.searchParams.get("template") || "").trim();
  const saveAsDesign =
    url.searchParams.get("saveAsDesign") === "1" || formData.get("saveAsDesign") === "true";
  const sourceDesignId = String(
    formData.get("sourceDesignId") || url.searchParams.get("sourceDesignId") || "",
  ).trim();
  const suggestedDesignName = String(
    formData.get("designName") || url.searchParams.get("designName") || "",
  ).trim();
  const name = String(formData.get("name") || "").trim() || "Untitled Widget";
  const isActive = formData.get("isActive") === "true";
  const widgetStyle = String(formData.get("widgetStyle") || "custom");
  const customBlocksRaw = parseJsonArrayField(formData.get("customBlocks"));
  const textColor = String(formData.get("textColor") || "#000000");
  const iconColor = String(formData.get("iconColor") || "#0033cc");
  const bgColor = String(formData.get("bgColor") || "#ffffff");
  const borderColor = String(formData.get("borderColor") || "#e5e7eb");
  const borderRadius = parseInt(String(formData.get("borderRadius") || "10"), 10);
  const shadow = String(formData.get("shadow") || "none");
  const glassmorphism = formData.get("glassmorphism") === "true";
  const padding = parseInt(String(formData.get("padding") || "16"), 10);
  const bgGradient = String(formData.get("bgGradient") || "");
  const showTimeline = formData.get("showTimeline") === "true";
  const targetCountriesRaw = parseJsonArrayField(formData.get("targetCountries"));
  const targetProductsRaw = parseJsonArrayField(formData.get("targetProducts"));
  const targetTagsRaw = parseJsonArrayField(formData.get("targetTags"));

  if (!customBlocksRaw || !targetCountriesRaw || !targetProductsRaw || !targetTagsRaw) {
    return { error: "Invalid widget payload", status: 400 };
  }

  const customBlocks = parseBlockConfigs(customBlocksRaw);
  const requiredPlan = getRequiredPlanForBlocks(customBlocks);
  if (!isAtLeastPlan(currentPlan.handle, requiredPlan)) {
    return {
      error: `This design requires the ${PRICING_PLANS[requiredPlan].name} plan or higher. Remove premium components or upgrade before saving.`,
      status: 403,
    };
  }

  if (widgetId && widgetId !== "new") {
    const existingWidget = await db.widget.findFirst({
      where: { id: widgetId, shop },
      select: { customBlocks: true, requiredPlan: true },
    });

    if (existingWidget && !canEditWidget(currentPlan, existingWidget)) {
      const existingRequiredPlan = getRequiredPlanForWidget(existingWidget);
      return {
        error: `This design is locked on your ${currentPlan.name} plan because it requires the ${existingRequiredPlan.name} plan or higher.`,
        status: 403,
      };
    }
  }

  const targetCountries = normalizeCountries(targetCountriesRaw);
  const targetProducts = normalizeProductIds(targetProductsRaw);
  const targetTags = normalizeTags(targetTagsRaw);
  const designRecordName = resolveDesignName(name, suggestedDesignName);

  const data = {
    shop,
    name,
    isActive,
    widgetStyle,
    customBlocks: customBlocks as unknown as Prisma.InputJsonValue,
    textColor,
    iconColor,
    bgColor,
    borderColor,
    borderRadius,
    shadow,
    glassmorphism,
    padding,
    bgGradient,
    showTimeline,
    requiredPlan,
    targetCountries: targetCountries as Prisma.InputJsonValue,
    targetProducts: targetProducts as Prisma.InputJsonValue,
    targetTags: targetTags as Prisma.InputJsonValue,
  };

  if (widgetId === "new") {
    const newWidget = await db.widget.create({
      data: {
        ...data,
        isReusable: true,
        sourceTemplateId: sourceTemplateId || null,
      },
    });
    return { success: true, newId: newWidget.id };
  }

  if (saveAsDesign) {
    const [, savedDesign] = await db.$transaction([
      db.widget.updateMany({
        where: { id: widgetId, shop },
        data,
      }),
      db.widget.create({
        data: {
          ...data,
          name: designRecordName,
          isDefault: false,
          isReusable: true,
          sourceWidgetId: sourceDesignId || widgetId,
          sourceTemplateId: sourceTemplateId || null,
        },
      }),
    ]);

    return {
      success: true,
      newId: savedDesign.id,
      designName: savedDesign.name,
      savedAsDesign: true,
    };
  }

  await db.widget.updateMany({
    where: { id: widgetId, shop },
    data,
  });

  return { success: true };
}
