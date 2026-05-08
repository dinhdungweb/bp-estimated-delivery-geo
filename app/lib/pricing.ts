import { TEMPLATE_DEFAULTS } from "../constants/templateDefaults";
import type { BlockConfig, BlockType } from "./delivery";
import { parseBlockConfigs } from "./delivery";
import { getAnimatedIconFileKey } from "./lordiconPresets";
import { WIDGET_TEMPLATES, type TemplateId } from "./widgetTemplates";

export type PlanHandle = "free" | "growth" | "pro" | "scale";
export type PaidPlanHandle = Exclude<PlanHandle, "free">;

export type PlanLimits = {
  activeRules: number | null;
  savedDesigns: number | null;
  analyticsDays: number;
  advancedAnalytics: boolean;
  shopifyMarkets: boolean;
  animatedIcons: boolean;
  components: BlockType[] | null;
  prioritySupport: boolean;
};

export type PricingPlan = {
  handle: PlanHandle;
  name: string;
  description: string;
  monthlyPrice: number;
  billingPlan?: string;
  recommended?: boolean;
  limits: PlanLimits;
  features: string[];
};

export type WidgetEntitlementInput = {
  customBlocks?: unknown;
  requiredPlan?: string | null;
};

export type RuleEntitlementInput = {
  isActive?: boolean;
  marketId?: string | null;
};

export const PLAN_ORDER: PlanHandle[] = ["free", "growth", "pro", "scale"];

export const COMPONENT_ENTITLEMENTS: Record<BlockType, PlanHandle> = {
  header: "free",
  steps: "free",
  divider: "free",
  spacer: "free",
  image: "free",
  timer: "growth",
  banner: "growth",
  promise_card: "growth",
  trust_badges: "growth",
  progress: "growth",
  policy: "growth",
  policy_accordion: "growth",
  dual_info: "growth",
  html: "scale",
};

export const STEP_PRESET_ENTITLEMENTS: Record<string, PlanHandle> = {
  timeline_dots: "free",
  chevron: "growth",
  split_segments: "growth",
  boxed_cards: "growth",
  boxed_steps: "growth",
  vertical: "growth",
  thick: "growth",
};

const FREE_COMPONENTS = Object.entries(COMPONENT_ENTITLEMENTS)
  .filter(([, requiredPlan]) => requiredPlan === "free")
  .map(([component]) => component as BlockType);

const GROWTH_COMPONENTS = Object.entries(COMPONENT_ENTITLEMENTS)
  .filter(([, requiredPlan]) => isPlanHandle(requiredPlan) && planRank(requiredPlan) <= planRank("growth"))
  .map(([component]) => component as BlockType);

export const PRICING_PLANS: Record<PlanHandle, PricingPlan> = {
  free: {
    handle: "free",
    name: "Free",
    description: "For stores testing one simple ETA rule.",
    monthlyPrice: 0,
    limits: {
      activeRules: 1,
      savedDesigns: 1,
      analyticsDays: 7,
      advancedAnalytics: false,
      shopifyMarkets: false,
      animatedIcons: false,
      components: FREE_COMPONENTS,
      prioritySupport: false,
    },
    features: [
      "1 active delivery rule",
      "1 saved My Design",
      "Basic components: header, steps, image, divider, spacer",
      "Standard Line steps with static icons",
      "Basic 7-day analytics",
    ],
  },
  growth: {
    handle: "growth",
    name: "Growth",
    description: "For stores that need product and country-specific ETA rules.",
    monthlyPrice: 7.99,
    billingPlan: "Growth",
    recommended: true,
    limits: {
      activeRules: 5,
      savedDesigns: 5,
      analyticsDays: 14,
      advancedAnalytics: false,
      shopifyMarkets: false,
      animatedIcons: false,
      components: GROWTH_COMPONENTS,
      prioritySupport: false,
    },
    features: [
      "5 active delivery rules",
      "5 saved My Designs",
      "Countdown, banner, promise, progress, badges, accordion, and dual info components",
      "Product, collection, tag, country, and inventory targeting",
      "Cut-off time and holiday logic",
    ],
  },
  pro: {
    handle: "pro",
    name: "Pro",
    description: "For multi-market stores that need deeper reporting and Studio control.",
    monthlyPrice: 14.99,
    billingPlan: "Pro",
    limits: {
      activeRules: 50,
      savedDesigns: null,
      analyticsDays: 90,
      advancedAnalytics: true,
      shopifyMarkets: true,
      animatedIcons: true,
      components: Object.keys(COMPONENT_ENTITLEMENTS).filter(
        (component) => component !== "html",
      ) as BlockType[],
      prioritySupport: true,
    },
    features: [
      "50 active delivery rules",
      "Unlimited My Designs",
      "Shopify Markets targeting",
      "Animated Studio icons and animated templates",
      "90-day product and country analytics",
    ],
  },
  scale: {
    handle: "scale",
    name: "Scale",
    description: "For high-volume stores that want no practical limits.",
    monthlyPrice: 29.99,
    billingPlan: "Scale",
    limits: {
      activeRules: null,
      savedDesigns: null,
      analyticsDays: 365,
      advancedAnalytics: true,
      shopifyMarkets: true,
      animatedIcons: true,
      components: null,
      prioritySupport: true,
    },
    features: [
      "Unlimited active delivery rules",
      "Unlimited My Designs",
      "All components including custom HTML",
      "365-day analytics window",
      "Priority support",
    ],
  },
};

export const PAID_PLAN_HANDLES: PaidPlanHandle[] = ["growth", "pro", "scale"];
export const PAID_BILLING_PLAN_NAMES = PAID_PLAN_HANDLES.map(
  (handle) => PRICING_PLANS[handle].billingPlan,
).filter((name): name is string => Boolean(name));

export function isPlanHandle(value: unknown): value is PlanHandle {
  return typeof value === "string" && PLAN_ORDER.includes(value as PlanHandle);
}

export function normalizePlanHandle(value: unknown): PlanHandle {
  return isPlanHandle(value) ? value : "free";
}

export function planRank(handle: PlanHandle) {
  return PLAN_ORDER.indexOf(handle);
}

export function maxPlan(...handles: PlanHandle[]): PlanHandle {
  return handles.reduce((max, handle) => (planRank(handle) > planRank(max) ? handle : max), "free");
}

export function isAtLeastPlan(current: PlanHandle, required: PlanHandle) {
  return planRank(current) >= planRank(required);
}

export function limitLabel(limit: number | null) {
  return limit === null ? "Unlimited" : String(limit);
}

export function getPlanByBillingName(name: string | null | undefined) {
  return PAID_PLAN_HANDLES.map((handle) => PRICING_PLANS[handle]).find(
    (plan) => plan.billingPlan === name,
  );
}

export function planByHandle(handle: unknown) {
  return PRICING_PLANS[normalizePlanHandle(handle)];
}

export function isComponentAllowed(plan: PricingPlan, component: BlockType) {
  if (!plan.limits.components) return true;
  return plan.limits.components.includes(component);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function containsAnimatedIcon(value: unknown): boolean {
  if (typeof value === "string") {
    return Boolean(getAnimatedIconFileKey(value)) || /\/icons\/animated\/[a-z0-9-]+\.json/i.test(value);
  }

  if (Array.isArray(value)) {
    return value.some(containsAnimatedIcon);
  }

  if (!isRecord(value)) return false;

  if (String(value.iconAnimation || "") === "lordicon") return true;
  if (String(value.animationType || "") === "lordicon") return true;
  if (typeof value.lordiconUrl === "string" && value.lordiconUrl.trim()) return true;

  return Object.values(value).some(containsAnimatedIcon);
}

export function blockUsesAnimatedIcons(block: BlockConfig) {
  return containsAnimatedIcon(block.settings);
}

export function getRequiredPlanForBlock(block: BlockConfig): PlanHandle {
  const componentPlan = COMPONENT_ENTITLEMENTS[block.type] || "growth";
  const presetPlan = block.type === "steps"
    ? getRequiredPlanForStepPreset(block.settings.preset)
    : "free";
  const iconPlan = blockUsesAnimatedIcons(block) ? "pro" : "free";
  return maxPlan(componentPlan, presetPlan, iconPlan);
}

export function getRequiredPlanForStepPreset(preset: unknown): PlanHandle {
  const presetKey = String(preset || "timeline_dots");
  return STEP_PRESET_ENTITLEMENTS[presetKey] || "growth";
}

export function getRequiredPlanForBlocks(blocks: unknown): PlanHandle {
  return parseBlockConfigs(blocks).reduce(
    (requiredPlan, block) => maxPlan(requiredPlan, getRequiredPlanForBlock(block)),
    "free" as PlanHandle,
  );
}

export function getRequiredPlanForWidget(widget: WidgetEntitlementInput | null | undefined) {
  if (!widget) return PRICING_PLANS.free;

  const storedPlan = normalizePlanHandle(widget.requiredPlan);
  const runtimePlan = getRequiredPlanForBlocks(widget.customBlocks);
  return PRICING_PLANS[maxPlan(storedPlan, runtimePlan)];
}

export function canEditWidget(plan: PricingPlan, widget: WidgetEntitlementInput | null | undefined) {
  return isAtLeastPlan(plan.handle, getRequiredPlanForWidget(widget).handle);
}

export function activeRuleOrderBy() {
  return [{ countryCode: "asc" as const }, { createdAt: "desc" as const }];
}

export function canUseRuleFeatureSet(
  plan: PricingPlan,
  rule: RuleEntitlementInput,
  widget: WidgetEntitlementInput | null | undefined,
) {
  if (rule.marketId && !plan.limits.shopifyMarkets) return false;
  return canEditWidget(plan, widget);
}

export function eligibleRuleRankMap<T extends { id: string }>(
  rules: T[],
  isEligible: (rule: T) => boolean,
) {
  const ranks = new Map<string, number>();
  let rank = 0;

  for (const rule of rules) {
    if (!isEligible(rule)) continue;
    ranks.set(rule.id, rank);
    rank += 1;
  }

  return ranks;
}

export function canServeRule(
  plan: PricingPlan,
  rule: RuleEntitlementInput,
  widget: WidgetEntitlementInput | null | undefined,
  activeRuleRank: number,
) {
  if (!canUseRuleFeatureSet(plan, rule, widget)) return false;
  if (plan.limits.activeRules !== null && activeRuleRank >= plan.limits.activeRules) return false;
  return true;
}

function templateBlocks(templateId: TemplateId | string) {
  const template = TEMPLATE_DEFAULTS[templateId];
  return template?.customBlocks || [];
}

export function requiredPlanForTemplate(templateId: TemplateId | string) {
  const template = WIDGET_TEMPLATES.find((item) => item.style === templateId);
  if (!template || !TEMPLATE_DEFAULTS[templateId]) return PRICING_PLANS.growth;
  return PRICING_PLANS[getRequiredPlanForBlocks(templateBlocks(templateId))];
}

export function canUseTemplate(plan: PricingPlan, templateId: TemplateId | string) {
  return isAtLeastPlan(plan.handle, requiredPlanForTemplate(templateId).handle);
}

export function limitExceeded(limit: number | null, currentCount: number, addCount = 1) {
  return limit !== null && currentCount + addCount > limit;
}
