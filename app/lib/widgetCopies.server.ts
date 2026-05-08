import type { Prisma, Widget } from "@prisma/client";

function jsonField(value: Prisma.JsonValue | null | undefined) {
  return value == null ? undefined : (value as Prisma.InputJsonValue);
}

export function widgetCopyData(
  source: Widget,
  {
    shop,
    name,
    isReusable = false,
    isActive = source.isActive,
    sourceWidgetId = source.id,
  }: {
    shop: string;
    name?: string;
    isReusable?: boolean;
    isActive?: boolean;
    sourceWidgetId?: string | null;
  },
): Prisma.WidgetUncheckedCreateInput {
  return {
    shop,
    name: name || source.name,
    isDefault: false,
    isActive,
    isReusable,
    sourceWidgetId,
    sourceTemplateId: source.sourceTemplateId,
    requiredPlan: source.requiredPlan,
    targetCountries: jsonField(source.targetCountries),
    targetProducts: jsonField(source.targetProducts),
    targetTags: jsonField(source.targetTags),
    widgetStyle: source.widgetStyle,
    customBlocks: jsonField(source.customBlocks),
    textColor: source.textColor,
    iconColor: source.iconColor,
    bgColor: source.bgColor,
    borderColor: source.borderColor,
    borderRadius: source.borderRadius,
    shadow: source.shadow,
    glassmorphism: source.glassmorphism,
    padding: source.padding,
    bgGradient: source.bgGradient,
    showTimeline: source.showTimeline,
    policyText: source.policyText,
    headerText: source.headerText,
    subHeaderText: source.subHeaderText,
    step1Label: source.step1Label,
    step1SubText: source.step1SubText,
    step1Icon: source.step1Icon,
    step2Label: source.step2Label,
    step2SubText: source.step2SubText,
    step2Icon: source.step2Icon,
    step3Label: source.step3Label,
    step3SubText: source.step3SubText,
    step3Icon: source.step3Icon,
  };
}
