/**
 * BP: Estimated Delivery Pro - Widget Template Gallery
 * Copyright (c) 2025 BluePeaks. All rights reserved.
 */
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import type { Prisma } from "@prisma/client";
import {
  data as routerData,
  redirect,
  useActionData,
  useLoaderData,
  useNavigate,
  useNavigation,
  useSearchParams,
  useSubmit,
} from "react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { WidgetPreviewRenderer } from "../components/WidgetRenderer";
import { LockGlyph, UpgradePlanModal } from "../components/UpgradePlanModal";
import { TEMPLATE_DEFAULTS } from "../constants/templateDefaults";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { widgetCopyData } from "../lib/widgetCopies.server";
import { hydrateBlocksForTemplate } from "../lib/widgetStyleSamples";
import {
  buildFallbackBlocks,
  DEFAULT_SHIPPING_MESSAGE,
  DEFAULT_LOCATION_PREFIX_TEXT,
  normalizeLocationPrefixText,
  normalizeLocationRowAlignment,
  type BlockConfig,
  type WidgetSettingsProps,
} from "../lib/delivery";
import {
  canEditWidget,
  canUseTemplate,
  getRequiredPlanForWidget,
  limitExceeded,
  limitLabel,
  requiredPlanForTemplate,
} from "../lib/pricing";
import { syncCurrentPlanForShop } from "../lib/pricing.server";
import type {
  SavedWidget,
  TemplateCategory,
  TemplateId,
  TemplateMainTab,
  TemplateMeta,
} from "../lib/widgetTemplates";

type ActionResult = {
  error?: string;
  success?: boolean;
  deletedDesignName?: string;
};

type UpgradeModalState = {
  open: boolean;
  featureName?: string;
  requiredPlanName?: string;
  message?: string;
  upgradeUrl?: string;
};

function templateWidgetData(
  template: (typeof TEMPLATE_DEFAULTS)[string],
  templateName: string,
  templateId: string,
) {
  const customBlocks = hydrateBlocksForTemplate(template.customBlocks, template);
  return {
    name: templateName || "Template Design",
    isDefault: false,
    isActive: true,
    isReusable: false,
    sourceWidgetId: null,
    sourceTemplateId: templateId,
    requiredPlan: getRequiredPlanForWidget({ customBlocks }).handle,
    widgetStyle: "custom",
    customBlocks: customBlocks as unknown as Prisma.InputJsonValue,
    textColor: template.textColor || "#000000",
    iconColor: template.iconColor || "#0033cc",
    bgColor: template.bgColor || "#ffffff",
    borderColor: template.borderColor || "#e5e7eb",
    borderRadius: template.borderRadius || 10,
    shadow: template.shadow || "none",
    glassmorphism: template.glassmorphism || false,
    padding: template.padding ?? 16,
    bgGradient: template.bgGradient || "",
    showTimeline: template.showTimeline ?? true,
    policyText: template.policyText ?? null,
    headerText: template.headerText ?? null,
    subHeaderText: template.subHeaderText ?? null,
    step1Label: template.step1Label ?? null,
    step1SubText: template.step1SubText ?? null,
    step1Icon: template.step1Icon ?? null,
    step2Label: template.step2Label ?? null,
    step2SubText: template.step2SubText ?? null,
    step2Icon: template.step2Icon ?? null,
    step3Label: template.step3Label ?? null,
    step3SubText: template.step3SubText ?? null,
    step3Icon: template.step3Icon ?? null,
  };
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session, billing } = await authenticate.admin(request);
  const currentPlan = await syncCurrentPlanForShop(session.shop, billing);
  const [appSetting, activeRuleCount, widgets] = await Promise.all([
    prisma.appSetting.findUnique({ where: { shop: session.shop } }),
    prisma.deliveryRule.count({ where: { shop: session.shop, isActive: true } }),
    prisma.widget.findMany({
      where: { shop: session.shop, isDefault: false, isReusable: true },
      orderBy: [{ updatedAt: "desc" }],
      select: {
        id: true,
        name: true,
        isDefault: true,
        isActive: true,
        widgetStyle: true,
        sourceTemplateId: true,
        requiredPlan: true,
        customBlocks: true,
        textColor: true,
        iconColor: true,
        bgColor: true,
        borderColor: true,
        borderRadius: true,
        shadow: true,
        glassmorphism: true,
        padding: true,
        bgGradient: true,
        showTimeline: true,
        policyText: true,
        headerText: true,
        subHeaderText: true,
        step1Label: true,
        step1SubText: true,
        step1Icon: true,
        step2Label: true,
        step2SubText: true,
        step2Icon: true,
        step3Label: true,
        step3SubText: true,
        step3Icon: true,
        updatedAt: true,
      },
    }),
  ]);
  const widgetIds = widgets.map((widget) => widget.id);
  const usageCounts = new Map<string, number>();

  if (widgetIds.length > 0) {
    const [directRuleUsage, copiedRuleDesigns] = await Promise.all([
      prisma.deliveryRule.groupBy({
        by: ["widgetId"],
        where: {
          shop: session.shop,
          widgetId: { in: widgetIds },
        },
        _count: { _all: true },
      }),
      prisma.widget.findMany({
        where: {
          shop: session.shop,
          sourceWidgetId: { in: widgetIds },
        },
        select: {
          sourceWidgetId: true,
          _count: { select: { deliveryRules: true } },
        },
      }),
    ]);

    directRuleUsage.forEach((item) => {
      if (!item.widgetId) return;
      usageCounts.set(item.widgetId, (usageCounts.get(item.widgetId) || 0) + item._count._all);
    });

    copiedRuleDesigns.forEach((widget) => {
      if (!widget.sourceWidgetId) return;
      usageCounts.set(
        widget.sourceWidgetId,
        (usageCounts.get(widget.sourceWidgetId) || 0) + widget._count.deliveryRules,
      );
    });
  }

  return routerData({
    showLocationSelector: appSetting?.showLocationSelector ?? true,
    locationPrefixText: normalizeLocationPrefixText(appSetting?.locationPrefixText),
    showLocationFlag: appSetting?.showLocationFlag ?? true,
    locationRowAlignment: normalizeLocationRowAlignment(appSetting?.locationRowAlignment),
    currentPlan,
    activeRuleCount,
    activeRuleLimit: currentPlan.plan.limits.activeRules,
    widgets: widgets.map((widget) => ({
      ...widget,
      updatedAt: widget.updatedAt.toISOString(),
      usedByRuleCount: usageCounts.get(widget.id) || 0,
    })),
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session, billing } = await authenticate.admin(request);
  const currentPlan = await syncCurrentPlanForShop(session.shop, billing);
  const formData = await request.formData();
  const intent = String(formData.get("intent") || "template");
  const templateId = String(formData.get("templateId") || "");
  const templateName = String(formData.get("templateName") || "").trim();
  const widgetId = String(formData.get("widgetId") || "");

  if (intent === "create-design") {
    const savedDesignCount = await prisma.widget.count({
      where: { shop: session.shop, isDefault: false, isReusable: true },
    });

    if (limitExceeded(currentPlan.plan.limits.savedDesigns, savedDesignCount)) {
      return routerData({
        error: `Your ${currentPlan.plan.name} plan includes ${limitLabel(currentPlan.plan.limits.savedDesigns)} saved My Design${currentPlan.plan.limits.savedDesigns === 1 ? "" : "s"}. Upgrade to save more designs.`,
      }, { status: 403 });
    }

    const widget = await prisma.widget.create({
      data: {
        shop: session.shop,
        name: "New Design",
        isDefault: false,
        isActive: true,
        isReusable: true,
        sourceWidgetId: null,
        requiredPlan: "free",
        padding: 16,
        customBlocks: buildFallbackBlocks(
          {},
          DEFAULT_SHIPPING_MESSAGE,
        ) as unknown as Prisma.InputJsonValue,
      },
    });

    return redirect(`/app/widgets/${widget.id}`);
  }

  if (intent === "delete-design") {
    if (!widgetId) {
      return routerData({ error: "Invalid design" }, { status: 400 });
    }

    const sourceWidget = await prisma.widget.findFirst({
      where: { id: widgetId, shop: session.shop, isDefault: false, isReusable: true },
    });

    if (!sourceWidget) {
      return routerData({ error: "Design not found" }, { status: 404 });
    }

    const directRules = await prisma.deliveryRule.findMany({
      where: { shop: session.shop, widgetId: sourceWidget.id },
      select: { id: true },
    });

    await prisma.$transaction(async (tx) => {
      for (const rule of directRules) {
        const ruleWidget = await tx.widget.create({
          data: widgetCopyData(sourceWidget, {
            shop: session.shop,
            isReusable: false,
            isActive: true,
            sourceWidgetId: sourceWidget.id,
          }),
        });

        await tx.deliveryRule.update({
          where: { id: rule.id },
          data: { widgetId: ruleWidget.id },
        });
      }

      await tx.widget.delete({
        where: { id: sourceWidget.id },
      });
    });

    return routerData({ success: true, deletedDesignName: sourceWidget.name });
  }

  if (intent === "saved-design") {
    const activeRuleCount = await prisma.deliveryRule.count({
      where: { shop: session.shop, isActive: true },
    });
    if (limitExceeded(currentPlan.plan.limits.activeRules, activeRuleCount)) {
      return routerData({
        error: `Your ${currentPlan.plan.name} plan includes ${limitLabel(currentPlan.plan.limits.activeRules)} active delivery rule${currentPlan.plan.limits.activeRules === 1 ? "" : "s"}. Upgrade to create another rule from this design.`,
      }, { status: 403 });
    }

    if (!widgetId) {
      return routerData({ error: "Invalid design" }, { status: 400 });
    }

    const sourceWidget = await prisma.widget.findFirst({
      where: { id: widgetId, shop: session.shop, isDefault: false, isReusable: true },
    });

    if (!sourceWidget) {
      return routerData({ error: "Design not found" }, { status: 404 });
    }

    if (!canEditWidget(currentPlan.plan, sourceWidget)) {
      const requiredPlan = getRequiredPlanForWidget(sourceWidget);
      return routerData({
        error: `${sourceWidget.name || "This design"} requires the ${requiredPlan.name} plan or higher.`,
      }, { status: 403 });
    }

    const ruleWidget = await prisma.widget.create({
      data: widgetCopyData(sourceWidget, {
        shop: session.shop,
        isReusable: false,
        isActive: true,
        sourceWidgetId: sourceWidget.id,
      }),
    });

    const params = new URLSearchParams({
      selectedWidgetId: ruleWidget.id,
      sourceDesignId: sourceWidget.id,
    });
    if (sourceWidget.name) params.set("designName", sourceWidget.name);

    return redirect(`/app/rules/new?${params.toString()}`);
  }

  if (!templateId || !TEMPLATE_DEFAULTS[templateId]) {
    return routerData({ error: "Invalid template" }, { status: 400 });
  }

  const activeRuleCount = await prisma.deliveryRule.count({
    where: { shop: session.shop, isActive: true },
  });
  if (limitExceeded(currentPlan.plan.limits.activeRules, activeRuleCount)) {
    return routerData({
      error: `Your ${currentPlan.plan.name} plan includes ${limitLabel(currentPlan.plan.limits.activeRules)} active delivery rule${currentPlan.plan.limits.activeRules === 1 ? "" : "s"}. Upgrade to create another rule from this template.`,
    }, { status: 403 });
  }

  if (!canUseTemplate(currentPlan.plan, templateId)) {
    const requiredPlan = requiredPlanForTemplate(templateId);
    return routerData({
      error: `${templateName || "This template"} requires the ${requiredPlan.name} plan or higher.`,
    }, { status: 403 });
  }

  const def = TEMPLATE_DEFAULTS[templateId];
  const widget = await prisma.widget.create({
      data: {
        shop: session.shop,
        ...templateWidgetData(def, templateName, templateId),
      },
    });

  const params = new URLSearchParams({
    selectedWidgetId: widget.id,
    templateApplied: "1",
    designName: widget.name,
  });

  return redirect(`/app/rules/new?${params.toString()}`);
};

const CATEGORIES: TemplateCategory[] = [
  "Animated",
  "Industry",
  "Order process",
  "Dark",
  "Light",
  "Informative",
  "Seasonal",
];

const MAIN_TABS: TemplateMainTab[] = ["General", "My design"];

const WIDGET_TEMPLATES: TemplateMeta[] = [
  {
    name: "Flash Sale Timer",
    description: "Countdown-first layout for urgent campaigns.",
    style: "animated_flash_sale",
    category: "Animated",
    discount: "72% off",
    badgeTone: "red",
  },
  {
    name: "Soft Pulse Tracker",
    description: "Animated progress with a calm delivery estimate.",
    style: "animated_soft_pulse",
    category: "Animated",
    discount: "64% off",
    badgeTone: "blue",
  },
  {
    name: "Countdown Priority",
    description: "Timer, queue progress, steps, and trust badges.",
    style: "animated_countdown_priority",
    category: "Animated",
    discount: "66% off",
    badgeTone: "amber",
  },
  {
    name: "Urgent Pulse",
    description: "Red countdown timeline for limited-time shipping.",
    style: "urgent_pulse",
    category: "Animated",
    discount: "74% off",
    badgeTone: "red",
  },
  {
    name: "Red Moment Meter",
    description: "A bold urgency meter with dotted progress.",
    style: "red_moment_meter",
    category: "Animated",
    discount: "58% off",
    badgeTone: "red",
  },
  {
    name: "Yellow Progress",
    description: "Bright progress bar for animated visual movement.",
    style: "yellow_progress",
    category: "Animated",
    discount: "68% off",
    badgeTone: "amber",
  },
  {
    name: "Boutique ETA",
    description: "Fashion-focused delivery block with soft rose tones.",
    style: "fashion_boutique_eta",
    category: "Industry",
    productImage: "/fashion-sample.png",
    discount: "47% off",
    badgeTone: "pink",
  },
  {
    name: "Furniture Delivery",
    description: "Room-ready timeline for large item delivery.",
    style: "furniture_room_delivery",
    category: "Industry",
    discount: "55% off",
    badgeTone: "amber",
  },
  {
    name: "Electronics Express",
    description: "Fast dispatch lane for tech and gadgets.",
    style: "electronics_express_lane",
    category: "Industry",
    discount: "62% off",
    badgeTone: "cyan",
  },
  {
    name: "Beauty Care",
    description: "Warm care-focused template for cosmetics.",
    style: "beauty_care_delivery",
    category: "Industry",
    productImage: "/fashion-sample.png",
    discount: "51% off",
    badgeTone: "pink",
  },
  {
    name: "Eco Delivery",
    description: "Eco-friendly split segment delivery flow.",
    style: "eco_delivery",
    category: "Industry",
    discount: "73% off",
    badgeTone: "green",
  },
  {
    name: "Premium Pack",
    description: "Premium packing promise with fulfillment details.",
    style: "industry_premium_pack",
    category: "Industry",
    discount: "57% off",
    badgeTone: "pink",
  },
  {
    name: "Compact Tracker",
    description: "Dense order process for product pages with less space.",
    style: "process_compact_tracker",
    category: "Order process",
    discount: "48% off",
    badgeTone: "green",
  },
  {
    name: "Vertical Story",
    description: "Step-by-step journey with a vertical process.",
    style: "process_vertical_story",
    category: "Order process",
    discount: "59% off",
    badgeTone: "blue",
  },
  {
    name: "Simple Timeline",
    description: "Clean three-step delivery timeline.",
    style: "simple_timeline",
    category: "Order process",
    discount: "47% off",
    badgeTone: "amber",
  },
  {
    name: "Blue Boxed Cards",
    description: "Structured boxed steps with blue accents.",
    style: "boxed_cards_blue",
    category: "Order process",
    discount: "61% off",
    badgeTone: "blue",
  },
  {
    name: "Dual Cards",
    description: "Online and in-store delivery information cards.",
    style: "dual_cards",
    category: "Order process",
    discount: "52% off",
    badgeTone: "cyan",
  },
  {
    name: "Split Fulfillment",
    description: "Warehouse and carrier timeline with progress.",
    style: "process_split_fulfillment",
    category: "Order process",
    discount: "54% off",
    badgeTone: "green",
  },
  {
    name: "Dark Luxury",
    description: "Premium dark delivery tracker for luxury stores.",
    style: "dark_luxury_tracker",
    category: "Dark",
    discount: "49% off",
    badgeTone: "amber",
  },
  {
    name: "Neon Route",
    description: "Dark neon route with countdown urgency.",
    style: "dark_neon_route",
    category: "Dark",
    discount: "56% off",
    badgeTone: "cyan",
  },
  {
    name: "Dark Glassmorphism",
    description: "Frosted dark widget with premium cards.",
    style: "dark_glassmorphism",
    category: "Dark",
    discount: "53% off",
    badgeTone: "slate",
  },
  {
    name: "Dark Urgency",
    description: "Dark sale message with shipping timeline.",
    style: "dark_urgency",
    category: "Dark",
    discount: "45% off",
    badgeTone: "red",
  },
  {
    name: "Dark Command Route",
    description: "High-contrast route command with live trust signals.",
    style: "dark_command_route",
    category: "Dark",
    discount: "58% off",
    badgeTone: "cyan",
  },
  {
    name: "Clean ETA",
    description: "Minimal light template for quiet storefronts.",
    style: "light_clean_eta",
    category: "Light",
    discount: "44% off",
    badgeTone: "slate",
  },
  {
    name: "Light Card Steps",
    description: "Neutral card layout with soft contrast.",
    style: "light_card_steps",
    category: "Light",
    discount: "46% off",
    badgeTone: "slate",
  },
  {
    name: "Minimal Cart",
    description: "Simple cart, truck, and doorstep timeline.",
    style: "minimal_cart_truck",
    category: "Light",
    discount: "42% off",
    badgeTone: "slate",
  },
  {
    name: "Blue Boxed Steps",
    description: "Light blue structure for clear delivery dates.",
    style: "blue_boxed_steps",
    category: "Light",
    discount: "57% off",
    badgeTone: "blue",
  },
  {
    name: "Concierge ETA",
    description: "Polished promise card with delivery policy details.",
    style: "light_concierge_eta",
    category: "Light",
    discount: "49% off",
    badgeTone: "blue",
  },
  {
    name: "Geo Trust",
    description: "Country-aware shipping promise and trust cards.",
    style: "informative_geo_trust",
    category: "Informative",
    discount: "39% off",
    badgeTone: "cyan",
  },
  {
    name: "Dispatch Stack",
    description: "Informational delivery details in a stacked layout.",
    style: "informative_dispatch_stack",
    category: "Informative",
    discount: "41% off",
    badgeTone: "blue",
  },
  {
    name: "Trust Info List",
    description: "Delivery facts with multiple trust signals.",
    style: "trust_info_list",
    category: "Informative",
    discount: "43% off",
    badgeTone: "amber",
  },
  {
    name: "Global Trust",
    description: "International shipping message with location context.",
    style: "global_trust",
    category: "Informative",
    discount: "50% off",
    badgeTone: "blue",
  },
  {
    name: "Checkout Assurance",
    description: "Shipping facts, badges, and policy context for checkout.",
    style: "informative_checkout_assurance",
    category: "Informative",
    discount: "42% off",
    badgeTone: "cyan",
  },
  {
    name: "Holiday Gift",
    description: "Seasonal delivery window for gift campaigns.",
    style: "seasonal_holiday_gift",
    category: "Seasonal",
    discount: "69% off",
    badgeTone: "red",
  },
  {
    name: "Summer Fresh",
    description: "Bright seasonal template with fresh delivery energy.",
    style: "seasonal_summer_fresh",
    category: "Seasonal",
    discount: "63% off",
    badgeTone: "green",
  },
  {
    name: "Orange Blitz",
    description: "Bold free and fast delivery campaign block.",
    style: "orange_blitz",
    category: "Seasonal",
    discount: "54% off",
    badgeTone: "amber",
  },
  {
    name: "Green Order Now",
    description: "Green seasonal message for conversion pushes.",
    style: "green_order_now",
    category: "Seasonal",
    discount: "73% off",
    badgeTone: "green",
  },
  {
    name: "Sale Window",
    description: "Seasonal countdown with promo and dispatch cues.",
    style: "seasonal_sale_window",
    category: "Seasonal",
    discount: "71% off",
    badgeTone: "red",
  },
];

function TemplateCard({
  template,
  showLocationSelector,
  locationPrefixText,
  showLocationFlag,
  locationRowAlignment,
  isSubmitting,
  isLocked,
  onUseTemplate,
}: {
  template: TemplateMeta;
  showLocationSelector: boolean;
  locationPrefixText: string;
  showLocationFlag: boolean;
  locationRowAlignment: string;
  isSubmitting: boolean;
  isLocked: boolean;
  onUseTemplate: (template: TemplateMeta) => void;
}) {
  const settings = TEMPLATE_DEFAULTS[template.style];
  const previewSettings = {
    ...settings,
    customBlocks: hydrateBlocksForTemplate(settings.customBlocks, settings),
  };

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="p-4">
        <div className="rounded-xl bg-gray-50 p-2">
          <WidgetPreviewRenderer
            settings={{
              ...previewSettings,
              shadow: "none",
              showLocationSelector,
              locationPrefixText,
              showLocationFlag,
              locationRowAlignment,
            }}
          />
        </div>
      </div>

      <div className="mt-auto border-t border-gray-100 p-4">
        <div className="mb-2 min-h-[48px]">
          <h3 className="text-sm font-bold text-gray-950">{template.name}</h3>
          <p className="mt-1 line-clamp-2 text-xs leading-4 text-gray-500">{template.description}</p>
        </div>
        <button
          type="button"
          onClick={() => onUseTemplate(template)}
          disabled={isSubmitting}
          className={`flex h-9 w-full items-center justify-center rounded-xl px-3 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
            isLocked
              ? "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              : "bg-gray-900 text-white hover:bg-black"
          }`}
        >
          {isSubmitting ? (
            "Applying..."
          ) : isLocked ? (
            <>
              <LockGlyph className="mr-1.5 h-3.5 w-3.5" />
              Upgrade to use
            </>
          ) : (
            "Use template"
          )}
        </button>
      </div>
    </article>
  );
}

function widgetPreviewSettings(widget: SavedWidget): WidgetSettingsProps {
  return {
    style: "custom",
    widgetStyle: widget.widgetStyle || "custom",
    customBlocks: Array.isArray(widget.customBlocks)
      ? (widget.customBlocks as BlockConfig[])
      : undefined,
    headerText: widget.headerText,
    subHeaderText: widget.subHeaderText,
    step1Label: widget.step1Label,
    step1SubText: widget.step1SubText,
    step1Icon: widget.step1Icon,
    step2Label: widget.step2Label,
    step2SubText: widget.step2SubText,
    step2Icon: widget.step2Icon,
    step3Label: widget.step3Label,
    step3SubText: widget.step3SubText,
    step3Icon: widget.step3Icon,
    textColor: widget.textColor || "#000000",
    iconColor: widget.iconColor || "#0033cc",
    bgColor: widget.bgColor || "#ffffff",
    borderColor: widget.borderColor || "#e5e7eb",
    borderRadius: widget.borderRadius ?? 10,
    shadow: widget.shadow || "none",
    glassmorphism: widget.glassmorphism,
    padding: widget.padding,
    bgGradient: widget.bgGradient,
    showTimeline: widget.showTimeline,
    policyText: widget.policyText,
  };
}

function MyDesignCard({
  widget,
  showLocationSelector,
  locationPrefixText,
  showLocationFlag,
  locationRowAlignment,
  isSubmitting,
  isDeleting,
  isLocked,
  useLocked,
  requiredPlanName,
  onCustomize,
  onDelete,
  onLockedFeature,
  onUseDesign,
}: {
  widget: SavedWidget;
  showLocationSelector: boolean;
  locationPrefixText: string;
  showLocationFlag: boolean;
  locationRowAlignment: string;
  isSubmitting: boolean;
  isDeleting: boolean;
  isLocked: boolean;
  useLocked: boolean;
  requiredPlanName: string;
  onCustomize: (widgetId: string) => void;
  onDelete: (widget: SavedWidget) => void;
  onLockedFeature: (featureName: string, requiredPlanName?: string, upgradeUrl?: string) => void;
  onUseDesign: (widget: SavedWidget) => void;
}) {
  const settings = widgetPreviewSettings(widget);
  const updatedAt = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(widget.updatedAt));
  const usedByRuleCount = widget.usedByRuleCount || 0;
  const usageLabel = usedByRuleCount === 1 ? "Used by 1 rule" : `Used by ${usedByRuleCount} rules`;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="p-4">
        <div className="rounded-xl bg-gray-50 p-2">
          <WidgetPreviewRenderer
            settings={{
              ...settings,
              shadow: "none",
              showLocationSelector,
              locationPrefixText,
              showLocationFlag,
              locationRowAlignment,
            }}
          />
        </div>
      </div>

      <div className="mt-auto border-t border-gray-100 p-4">
        <div className="mb-2 min-h-[48px]">
          <div className="flex items-center justify-between gap-3">
            <h3 className="min-w-0 flex-1 truncate text-sm font-bold text-gray-950">{widget.name}</h3>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                isLocked
                  ? "bg-amber-100 text-amber-800"
                  : usedByRuleCount > 0
                    ? "bg-blue-50 text-blue-700"
                    : "bg-gray-100 text-gray-600"
              }`}
            >
              {isLocked ? (
                <span className="inline-flex items-center gap-1">
                  <LockGlyph className="h-3 w-3" />
                  {requiredPlanName} required
                </span>
              ) : usedByRuleCount > 0 ? usageLabel : "Unused"}
            </span>
          </div>
          <p className="mt-1 text-xs leading-4 text-gray-500">Updated {updatedAt}</p>
        </div>
        <div className="grid grid-cols-[1fr_auto_auto] gap-2">
          <button
            type="button"
            onClick={() => onUseDesign(widget)}
            disabled={isSubmitting}
            className={`flex h-9 w-full items-center justify-center rounded-xl px-3 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
              useLocked
                ? "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                : "bg-gray-900 text-white hover:bg-black"
            }`}
          >
            {isSubmitting ? (
              "Applying..."
            ) : useLocked ? (
              <>
                <LockGlyph className="mr-1.5 h-3.5 w-3.5" />
                Upgrade to use
              </>
            ) : (
              "Use design"
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              if (isLocked) {
                onLockedFeature(`Customize ${widget.name}`, requiredPlanName, "/app/pricing?upgrade=studio");
                return;
              }
              onCustomize(widget.id);
            }}
            disabled={isSubmitting || isDeleting}
            aria-label={`Customize ${widget.name}`}
            title={isLocked ? `${widget.name} requires the ${requiredPlanName} plan` : "Customize"}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLocked ? (
              <LockGlyph />
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path
                  d="M9.7 3.05 12.95 6.3M2.67 13.33l3.02-.67 7.96-7.96a1.53 1.53 0 0 0-2.17-2.17L3.52 10.5l-.85 2.83Z"
                  stroke="currentColor"
                  strokeWidth="1.45"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
          <button
            type="button"
            onClick={() => onDelete(widget)}
            disabled={isSubmitting || isDeleting}
            aria-label={`Delete ${widget.name}`}
            title="Delete design"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDeleting ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="animate-spin">
                <path
                  d="M8 2.5a5.5 5.5 0 1 1-5.2 7.3"
                  stroke="currentColor"
                  strokeWidth="1.45"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path
                  d="M2.67 4.33h10.66M6.33 2.67h3.34M5.33 6.67v4.66M8 6.67v4.66M10.67 6.67v4.66M4 4.33l.48 8.17c.05.83.73 1.5 1.56 1.5h3.92c.83 0 1.51-.67 1.56-1.5L12 4.33"
                  stroke="currentColor"
                  strokeWidth="1.45"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}

function NewDesignCard({
  isSubmitting,
  isLocked,
  onCreate,
}: {
  isSubmitting: boolean;
  isLocked: boolean;
  onCreate: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onCreate}
      disabled={isSubmitting}
      className="flex min-h-[360px] h-full flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-center shadow-sm transition-all hover:border-gray-900 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-3xl font-light leading-none text-gray-900">
        +
      </span>
      <span className="mt-4 text-sm font-bold text-gray-950">
        {isSubmitting ? (
          "Creating..."
        ) : isLocked ? (
          <span className="inline-flex items-center gap-1.5">
            <LockGlyph className="h-4 w-4" />
            Upgrade for more designs
          </span>
        ) : (
          "Create new design"
        )}
      </span>
      <span className="mt-2 max-w-[220px] text-xs leading-5 text-gray-500">
        {isLocked
          ? "Your current plan has reached its My Design limit."
          : "Start from a blank delivery widget and customize it in the editor."}
      </span>
    </button>
  );
}

export default function TemplateBuilder() {
  const {
    widgets,
    showLocationSelector,
    locationPrefixText = DEFAULT_LOCATION_PREFIX_TEXT,
    showLocationFlag = true,
    locationRowAlignment = "right",
    currentPlan,
    activeRuleCount,
    activeRuleLimit,
  } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const submit = useSubmit();
  const navigation = useNavigation();
  const [searchParams, setSearchParams] = useSearchParams();
  const actionData = useActionData() as ActionResult | undefined;
  const [activeMainTab, setActiveMainTab] = useState<TemplateMainTab>(
    searchParams.get("tab") === "my-design" ? "My design" : "General",
  );
  const [activeCategory, setActiveCategory] = useState<TemplateCategory>("Animated");
  const [pendingStyle, setPendingStyle] = useState<TemplateId | null>(null);
  const designSaved = searchParams.get("designSaved") === "1";
  const [toast, setToast] = useState<{ message: string; isError?: boolean } | null>(null);
  const [upgradeModal, setUpgradeModal] = useState<UpgradeModalState>({ open: false });
  const activeRuleLimitReached = activeRuleLimit !== null && activeRuleCount >= activeRuleLimit;

  const openUpgradeModal = useCallback((
    featureName: string,
    requiredPlanName?: string,
    upgradeUrl = "/app/pricing",
    message?: string,
  ) => {
    setUpgradeModal({ open: true, featureName, requiredPlanName, upgradeUrl, message });
  }, []);

  const showToast = useCallback((message: string, isError = false) => {
    const shopify = (globalThis as unknown as {
      shopify?: { toast?: { show?: (message: string, options?: { isError?: boolean }) => void } };
    }).shopify;

    if (shopify?.toast?.show) {
      shopify.toast.show(message, { isError });
      return;
    }

    setToast({ message, isError });
  }, []);

  const visibleTemplates = useMemo(
    () => WIDGET_TEMPLATES.filter((template) => template.category === activeCategory),
    [activeCategory],
  );

  const handleUseTemplate = (template: TemplateMeta) => {
    if (activeRuleLimitReached) {
      openUpgradeModal(
        "Create another delivery rule",
        undefined,
        "/app/pricing?upgrade=rules",
        `Your ${currentPlan.plan.name} plan includes ${limitLabel(activeRuleLimit)} active delivery rule${activeRuleLimit === 1 ? "" : "s"}. Upgrade to create another rule from this template.`,
      );
      return;
    }

    if (!canUseTemplate(currentPlan.plan, template.style)) {
      const requiredPlan = requiredPlanForTemplate(template.style);
      openUpgradeModal(
        template.name,
        requiredPlan.name,
        "/app/pricing?upgrade=templates",
        `${template.name} uses components that are available on the ${requiredPlan.name} plan or higher.`,
      );
      return;
    }

    setPendingStyle(template.style);
    submit(
      { templateId: template.style, templateName: template.name },
      { method: "post" },
    );
  };

  const handleUseSavedDesign = (widget: SavedWidget) => {
    if (activeRuleLimitReached) {
      openUpgradeModal(
        "Create another delivery rule",
        undefined,
        "/app/pricing?upgrade=rules",
        `Your ${currentPlan.plan.name} plan includes ${limitLabel(activeRuleLimit)} active delivery rule${activeRuleLimit === 1 ? "" : "s"}. Upgrade to create another rule from this design.`,
      );
      return;
    }

    if (!canEditWidget(currentPlan.plan, widget)) {
      const requiredPlan = getRequiredPlanForWidget(widget);
      openUpgradeModal(
        widget.name,
        requiredPlan.name,
        "/app/pricing?upgrade=designs",
        `${widget.name} includes premium components that require the ${requiredPlan.name} plan or higher.`,
      );
      return;
    }

    setPendingStyle(null);
    submit(
      { intent: "saved-design", widgetId: widget.id, widgetName: widget.name },
      { method: "post" },
    );
  };

  const handleCreateDesign = () => {
    if (savedDesignLimitReached) {
      openUpgradeModal(
        "Create more My Designs",
        undefined,
        "/app/pricing?upgrade=designs",
        `Your ${currentPlan.plan.name} plan includes ${limitLabel(currentPlan.plan.limits.savedDesigns)} saved My Design${currentPlan.plan.limits.savedDesigns === 1 ? "" : "s"}. Upgrade to save more designs.`,
      );
      return;
    }

    setPendingStyle(null);
    submit({ intent: "create-design" }, { method: "post" });
  };

  const handleDeleteDesign = (widget: SavedWidget) => {
    const usedByRuleCount = widget.usedByRuleCount || 0;
    const message = usedByRuleCount > 0
      ? `Delete "${widget.name}" from My Design? Existing rules that use copied versions of this design will continue working.`
      : `Delete "${widget.name}" from My Design?`;
    if (!confirm(message)) return;

    setPendingStyle(null);
    submit({ intent: "delete-design", widgetId: widget.id }, { method: "post" });
  };

  const isSubmitting = navigation.state === "submitting";
  const isCreatingDesign = isSubmitting && navigation.formData?.get("intent") === "create-design";
  const isDeletingDesign = isSubmitting && navigation.formData?.get("intent") === "delete-design";
  const savedDesignLimit = currentPlan.plan.limits.savedDesigns;
  const savedDesignLimitReached = savedDesignLimit !== null && widgets.length >= savedDesignLimit;

  useEffect(() => {
    if (!designSaved) return;
    showToast("Design saved to My design.");
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("designSaved");
    setSearchParams(nextParams, { replace: true });
  }, [designSaved, searchParams, setSearchParams, showToast]);

  useEffect(() => {
    if (navigation.state !== "idle") return;
    if (actionData?.error) {
      showToast(actionData.error, true);
      return;
    }
    if (actionData?.success && actionData.deletedDesignName) {
      showToast(`${actionData.deletedDesignName} was removed from My Design.`);
    }
  }, [actionData, navigation.state, showToast]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  return (
    <div className="min-h-screen bg-[#f6f6f7] p-4 font-sans md:p-6">
      <UpgradePlanModal
        open={upgradeModal.open}
        onClose={() => setUpgradeModal({ open: false })}
        featureName={upgradeModal.featureName}
        requiredPlanName={upgradeModal.requiredPlanName}
        currentPlanName={currentPlan.plan.name}
        message={upgradeModal.message}
        upgradeUrl={upgradeModal.upgradeUrl}
      />
      {toast && (
        <div
          className={`fixed right-5 top-5 z-50 w-[min(360px,calc(100vw-2.5rem))] rounded-2xl border bg-white shadow-xl ${
            toast.isError ? "border-red-200" : "border-green-200"
          }`}
        >
          <div className="flex items-start gap-3 p-4">
            <span
              className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                toast.isError ? "bg-red-500" : "bg-green-500"
              }`}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-gray-900">{toast.message}</p>
              <p className="mt-1 text-xs leading-5 text-gray-500">
                {toast.isError ? "Please try again." : "Your design changes are now reflected."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="text-xs font-bold text-gray-400 transition-colors hover:text-gray-900"
              aria-label="Dismiss notification"
            >
              Close
            </button>
          </div>
        </div>
      )}
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-gray-950">Widget Templates</h1>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-green-500" />
              <p className="text-sm text-gray-500">
                Pick a ready-made delivery design and attach it to a delivery rule.
              </p>
            </div>
          </div>
          <div className="inline-flex h-9 items-center justify-center rounded-xl border border-gray-200 bg-white px-3 text-xs font-bold text-gray-500 shadow-sm">
            {activeMainTab === "General"
              ? `${WIDGET_TEMPLATES.length} templates`
              : `${widgets.length} designs`}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="grid grid-cols-2 border-b border-gray-200">
            {MAIN_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveMainTab(tab)}
                className={`relative flex h-12 items-center justify-center text-sm font-bold transition-colors ${
                  activeMainTab === tab
                    ? "text-gray-950"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-950"
                }`}
              >
                {tab}
                {activeMainTab === tab && (
                  <span className="absolute -bottom-px left-1 right-1 h-0.5 rounded-full bg-gray-900" />
                )}
              </button>
            ))}
          </div>

          {activeMainTab === "General" && (
            <div className="overflow-x-auto px-3 py-4">
              <div className="flex min-w-max gap-2">
                {CATEGORIES.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setActiveCategory(category)}
                    className={`inline-flex h-9 items-center justify-center rounded-xl px-3 text-xs font-bold transition-colors ${
                      activeCategory === category
                        ? "bg-gray-100 text-gray-950 shadow-sm"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-950"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {activeMainTab === "General" ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleTemplates.map((template) => (
              <TemplateCard
                key={template.style}
                template={template}
                showLocationSelector={showLocationSelector}
                locationPrefixText={locationPrefixText}
                showLocationFlag={showLocationFlag}
                locationRowAlignment={locationRowAlignment}
                isSubmitting={isSubmitting && pendingStyle === template.style}
                isLocked={activeRuleLimitReached || !canUseTemplate(currentPlan.plan, template.style)}
                onUseTemplate={handleUseTemplate}
              />
            ))}
          </div>
        ) : widgets.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <NewDesignCard
              isSubmitting={isCreatingDesign}
              isLocked={savedDesignLimitReached}
              onCreate={handleCreateDesign}
            />
            {widgets.map((widget) => (
              <MyDesignCard
                key={widget.id}
                widget={widget}
                showLocationSelector={showLocationSelector}
                locationPrefixText={locationPrefixText}
                showLocationFlag={showLocationFlag}
                locationRowAlignment={locationRowAlignment}
                isSubmitting={isSubmitting && navigation.formData?.get("widgetId") === widget.id}
                isDeleting={isDeletingDesign && navigation.formData?.get("widgetId") === widget.id}
                isLocked={!canEditWidget(currentPlan.plan, widget)}
                useLocked={activeRuleLimitReached || !canEditWidget(currentPlan.plan, widget)}
                requiredPlanName={getRequiredPlanForWidget(widget).name}
                onCustomize={(widgetId) => {
                  const targetWidget = widgets.find((item) => item.id === widgetId);
                  if (targetWidget && !canEditWidget(currentPlan.plan, targetWidget)) {
                    const requiredPlan = getRequiredPlanForWidget(targetWidget);
                    openUpgradeModal(
                      `Customize ${targetWidget.name}`,
                      requiredPlan.name,
                      "/app/pricing?upgrade=studio",
                      `${targetWidget.name} includes premium components that require the ${requiredPlan.name} plan or higher.`,
                    );
                    return;
                  }
                  navigate(`/app/widgets/${widgetId}`);
                }}
                onDelete={handleDeleteDesign}
                onLockedFeature={openUpgradeModal}
                onUseDesign={handleUseSavedDesign}
              />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <NewDesignCard
              isSubmitting={isCreatingDesign}
              isLocked={savedDesignLimitReached}
              onCreate={handleCreateDesign}
            />
          </div>
        )}
      </div>
    </div>
  );
}
