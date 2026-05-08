import { describe, expect, it } from "vitest";
import {
  PRICING_PLANS,
  activeRuleOrderBy,
  canServeRule,
  canUseRuleFeatureSet,
  eligibleRuleRankMap,
} from "../lib/pricing";
import {
  currentPlanWithCachedFallback,
  pricingReturnUrl,
  type CurrentPlan,
} from "../lib/pricing.server";

const basicWidget = {
  requiredPlan: "free",
  customBlocks: [
    { id: "steps", type: "steps", settings: { preset: "timeline_dots" } },
  ],
};

const premiumWidget = {
  requiredPlan: "growth",
  customBlocks: [
    { id: "timer", type: "timer", settings: {} },
  ],
};

describe("pricing entitlement ranking", () => {
  it("ranks only feature-eligible rules before applying the Free active rule limit", () => {
    const entries = [
      { id: "premium", rule: { id: "premium", marketId: null }, widget: premiumWidget },
      { id: "basic", rule: { id: "basic", marketId: null }, widget: basicWidget },
    ];

    const ranks = eligibleRuleRankMap(entries, (entry) =>
      canUseRuleFeatureSet(PRICING_PLANS.free, entry.rule, entry.widget),
    );

    expect(ranks.has("premium")).toBe(false);
    expect(ranks.get("basic")).toBe(0);
    expect(canServeRule(PRICING_PLANS.free, entries[1].rule, entries[1].widget, ranks.get("basic") ?? 999)).toBe(true);
  });

  it("does not let Shopify Markets locked rules consume lower-plan active slots", () => {
    const entries = [
      { id: "market", rule: { id: "market", marketId: "gid://shopify/Market/1" }, widget: basicWidget },
      { id: "basic", rule: { id: "basic", marketId: null }, widget: basicWidget },
    ];

    const ranks = eligibleRuleRankMap(entries, (entry) =>
      canUseRuleFeatureSet(PRICING_PLANS.growth, entry.rule, entry.widget),
    );

    expect(ranks.has("market")).toBe(false);
    expect(ranks.get("basic")).toBe(0);
    expect(canServeRule(PRICING_PLANS.growth, entries[1].rule, entries[1].widget, ranks.get("basic") ?? 999)).toBe(true);
  });

  it("exposes one shared active rule rank order for admin and storefront", () => {
    expect(activeRuleOrderBy()).toEqual([
      { countryCode: "asc" },
      { createdAt: "desc" },
    ]);
  });
});

describe("pricing cache fallback", () => {
  it("keeps the cached paid plan when billing status cannot be verified", () => {
    const billingFailure: CurrentPlan = {
      plan: PRICING_PLANS.free,
      hasActivePayment: false,
      subscription: null,
      billingError: "Billing temporarily unavailable.",
    };

    const result = currentPlanWithCachedFallback(billingFailure, {
      planHandle: "pro",
      planSubscriptionId: "sub_123",
    });

    expect(result.plan.handle).toBe("pro");
    expect(result.hasActivePayment).toBe(true);
    expect(result.subscription?.id).toBe("sub_123");
    expect(result.billingError).toBe("Billing temporarily unavailable.");
  });

  it("falls back to Free only when there is no cached plan", () => {
    const billingFailure: CurrentPlan = {
      plan: PRICING_PLANS.free,
      hasActivePayment: false,
      subscription: null,
      billingError: "Billing temporarily unavailable.",
    };

    const result = currentPlanWithCachedFallback(billingFailure, null);

    expect(result.plan.handle).toBe("free");
    expect(result.hasActivePayment).toBe(false);
  });
});

describe("pricing return URL", () => {
  it("uses SHOPIFY_APP_URL instead of the proxied request protocol", () => {
    const previousAppUrl = process.env.SHOPIFY_APP_URL;
    process.env.SHOPIFY_APP_URL = "https://estimated-delivery.bluepeaks.top";

    try {
      const result = pricingReturnUrl(
        new Request("http://estimated-delivery.bluepeaks.top/app/pricing"),
      );

      expect(result).toBe("https://estimated-delivery.bluepeaks.top/app/pricing?billing=success");
    } finally {
      if (previousAppUrl === undefined) {
        delete process.env.SHOPIFY_APP_URL;
      } else {
        process.env.SHOPIFY_APP_URL = previousAppUrl;
      }
    }
  });
});
