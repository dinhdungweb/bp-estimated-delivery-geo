import { describe, expect, it } from "vitest";
import {
  PRICING_PLANS,
  activeRuleOrderBy,
  canServeRule,
  canUseRuleFeatureSet,
  eligibleRuleRankMap,
} from "../lib/pricing";
import {
  adminHostParamForShop,
  currentPlanWithCachedFallback,
  embeddedPricingActionPath,
  pricingReturnUrl,
  shopHandleFromShopDomain,
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

  it("preserves embedded app context after billing approval", () => {
    const previousAppUrl = process.env.SHOPIFY_APP_URL;
    const previousAdminHandle = process.env.SHOPIFY_ADMIN_APP_HANDLE;
    process.env.SHOPIFY_APP_URL = "https://estimated-delivery.bluepeaks.top";
    process.env.SHOPIFY_ADMIN_APP_HANDLE = "";

    try {
      const result = pricingReturnUrl(
        new Request(
          "http://estimated-delivery.bluepeaks.top/app/pricing?embedded=1&shop=bp-estimated-delivery-geo.myshopify.com&host=abc123",
        ),
      );

      expect(result).toBe(
        "https://admin.shopify.com/store/bp-estimated-delivery-geo/apps/bp-estimated-delivery-geo-2/app/pricing?shop=bp-estimated-delivery-geo.myshopify.com&host=abc123&embedded=1&billing=success",
      );
    } finally {
      if (previousAdminHandle === undefined) {
        delete process.env.SHOPIFY_ADMIN_APP_HANDLE;
      } else {
        process.env.SHOPIFY_ADMIN_APP_HANDLE = previousAdminHandle;
      }

      if (previousAppUrl === undefined) {
        delete process.env.SHOPIFY_APP_URL;
      } else {
        process.env.SHOPIFY_APP_URL = previousAppUrl;
      }
    }
  });

  it("can return directly to the embedded Shopify Admin app route", () => {
    const previousAppUrl = process.env.SHOPIFY_APP_URL;
    const previousAdminHandle = process.env.SHOPIFY_ADMIN_APP_HANDLE;
    process.env.SHOPIFY_APP_URL = "https://estimated-delivery.bluepeaks.top";
    process.env.SHOPIFY_ADMIN_APP_HANDLE = "bp-estimated-delivery-geo-2";

    try {
      const result = pricingReturnUrl(
        new Request(
          "https://estimated-delivery.bluepeaks.top/app/pricing?embedded=1&shop=bp-estimated-delivery-geo.myshopify.com&host=abc123",
        ),
      );

      expect(result).toBe(
        "https://admin.shopify.com/store/bp-estimated-delivery-geo/apps/bp-estimated-delivery-geo-2/app/pricing?shop=bp-estimated-delivery-geo.myshopify.com&host=abc123&embedded=1&billing=success",
      );
    } finally {
      if (previousAdminHandle === undefined) {
        delete process.env.SHOPIFY_ADMIN_APP_HANDLE;
      } else {
        process.env.SHOPIFY_ADMIN_APP_HANDLE = previousAdminHandle;
      }

      if (previousAppUrl === undefined) {
        delete process.env.SHOPIFY_APP_URL;
      } else {
        process.env.SHOPIFY_APP_URL = previousAppUrl;
      }
    }
  });

  it("defaults billing approval return URLs to this app's Shopify Admin handle", () => {
    const previousAppUrl = process.env.SHOPIFY_APP_URL;
    const previousAdminHandle = process.env.SHOPIFY_ADMIN_APP_HANDLE;
    process.env.SHOPIFY_APP_URL = "https://estimated-delivery.bluepeaks.top";
    delete process.env.SHOPIFY_ADMIN_APP_HANDLE;

    try {
      const result = pricingReturnUrl(
        new Request(
          "https://estimated-delivery.bluepeaks.top/app/pricing?embedded=1&shop=smart-bundle-upsell.myshopify.com&host=abc123",
        ),
      );

      expect(result).toBe(
        "https://admin.shopify.com/store/smart-bundle-upsell/apps/bp-estimated-delivery-geo-2/app/pricing?shop=smart-bundle-upsell.myshopify.com&host=abc123&embedded=1&billing=success",
      );
    } finally {
      if (previousAdminHandle === undefined) {
        delete process.env.SHOPIFY_ADMIN_APP_HANDLE;
      } else {
        process.env.SHOPIFY_ADMIN_APP_HANDLE = previousAdminHandle;
      }

      if (previousAppUrl === undefined) {
        delete process.env.SHOPIFY_APP_URL;
      } else {
        process.env.SHOPIFY_APP_URL = previousAppUrl;
      }
    }
  });
});

describe("pricing action URL", () => {
  it("builds embedded context from the authenticated shop when URL params are missing", () => {
    const result = embeddedPricingActionPath(
      new Request("https://estimated-delivery.bluepeaks.top/app/pricing"),
      "smart-bundle-upsell.myshopify.com",
    );

    expect(shopHandleFromShopDomain("smart-bundle-upsell.myshopify.com")).toBe(
      "smart-bundle-upsell",
    );
    expect(adminHostParamForShop("smart-bundle-upsell.myshopify.com")).toBe(
      "YWRtaW4uc2hvcGlmeS5jb20vc3RvcmUvc21hcnQtYnVuZGxlLXVwc2VsbA",
    );
    expect(result).toBe(
      "/app/pricing?shop=smart-bundle-upsell.myshopify.com&host=YWRtaW4uc2hvcGlmeS5jb20vc3RvcmUvc21hcnQtYnVuZGxlLXVwc2VsbA&embedded=1",
    );
  });

  it("preserves host from the current embedded URL when present", () => {
    const result = embeddedPricingActionPath(
      new Request(
        "https://estimated-delivery.bluepeaks.top/app/pricing?embedded=1&shop=smart-bundle-upsell.myshopify.com&host=current-host",
      ),
      "smart-bundle-upsell.myshopify.com",
    );

    expect(result).toBe(
      "/app/pricing?shop=smart-bundle-upsell.myshopify.com&host=current-host&embedded=1",
    );
  });
});
