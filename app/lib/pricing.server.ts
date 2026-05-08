import { BillingInterval } from "@shopify/shopify-app-react-router/server";
import prisma from "../db.server";
import {
  PAID_PLAN_HANDLES,
  PRICING_PLANS,
  getPlanByBillingName,
  normalizePlanHandle,
  planByHandle,
  type PricingPlan,
} from "./pricing";

export type CurrentPlan = {
  plan: PricingPlan;
  hasActivePayment: boolean;
  subscription: {
    id: string;
    name: string;
    status?: string;
  } | null;
  billingError?: string;
};

export const SHOPIFY_BILLING_CONFIG = Object.fromEntries(
  PAID_PLAN_HANDLES.map((handle) => {
    const plan = PRICING_PLANS[handle];
    return [
      plan.billingPlan,
      {
        trialDays: 7,
        lineItems: [
          {
            amount: plan.monthlyPrice,
            currencyCode: "USD",
            interval: BillingInterval.Every30Days,
          },
        ],
      },
    ];
  }),
);

export function isBillingTestMode() {
  if (process.env.SHOPIFY_BILLING_TEST) {
    return process.env.SHOPIFY_BILLING_TEST === "true";
  }

  return process.env.NODE_ENV !== "production";
}

export async function getCurrentPlan(billing: {
  check: (options?: Record<string, unknown>) => Promise<{
    hasActivePayment: boolean;
    appSubscriptions?: Array<{ id: string; name: string; status?: string }>;
  }>;
}): Promise<CurrentPlan> {
  try {
    const billingCheck = await billing.check({
      plans: PAID_PLAN_HANDLES.map((handle) => PRICING_PLANS[handle].billingPlan),
      isTest: isBillingTestMode(),
    });
    const subscription = billingCheck.appSubscriptions?.find((item) =>
      Boolean(getPlanByBillingName(item.name)),
    );
    const paidPlan = getPlanByBillingName(subscription?.name);

    if (!billingCheck.hasActivePayment || !paidPlan || !subscription) {
      return {
        plan: PRICING_PLANS.free,
        hasActivePayment: false,
        subscription: null,
      };
    }

    return {
      plan: paidPlan,
      hasActivePayment: true,
      subscription: {
        id: subscription.id,
        name: subscription.name,
        status: subscription.status,
      },
    };
  } catch (error) {
    return {
      plan: PRICING_PLANS.free,
      hasActivePayment: false,
      subscription: null,
      billingError: error instanceof Error ? error.message : "Billing status could not be loaded.",
    };
  }
}

export function storedPlanFromAppSetting(setting: {
  planHandle?: string | null;
  planSubscriptionId?: string | null;
} | null | undefined): CurrentPlan {
  const plan = planByHandle(setting?.planHandle || "free");
  return {
    plan,
    hasActivePayment: normalizePlanHandle(setting?.planHandle) !== "free",
    subscription: setting?.planSubscriptionId
      ? {
          id: setting.planSubscriptionId,
          name: plan.billingPlan || plan.name,
        }
      : null,
  };
}

export function currentPlanWithCachedFallback(
  currentPlan: CurrentPlan,
  setting: { planHandle?: string | null; planSubscriptionId?: string | null } | null | undefined,
): CurrentPlan {
  if (!currentPlan.billingError || !setting) return currentPlan;

  return {
    ...storedPlanFromAppSetting(setting),
    billingError: currentPlan.billingError,
  };
}

export async function syncCurrentPlanForShop(
  shop: string,
  billing: Parameters<typeof getCurrentPlan>[0],
): Promise<CurrentPlan> {
  const currentPlan = await getCurrentPlan(billing);
  const existingSetting = currentPlan.billingError
    ? await prisma.appSetting.findUnique({
        where: { shop },
        select: { planHandle: true, planSubscriptionId: true },
      })
    : null;

  if (currentPlan.billingError && existingSetting) {
    return currentPlanWithCachedFallback(currentPlan, existingSetting);
  }

  await prisma.appSetting.upsert({
    where: { shop },
    update: {
      planHandle: currentPlan.plan.handle,
      planSubscriptionId: currentPlan.subscription?.id || null,
      planSyncedAt: new Date(),
    },
    create: {
      shop,
      isEnabled: true,
      widgetStyle: "modern",
      planHandle: currentPlan.plan.handle,
      planSubscriptionId: currentPlan.subscription?.id || null,
      planSyncedAt: new Date(),
    },
  });

  return currentPlan;
}

export function pricingReturnUrl(request: Request, search = "billing=success") {
  const url = new URL("/app/pricing", request.url);
  if (search) {
    const params = new URLSearchParams(search);
    params.forEach((value, key) => url.searchParams.set(key, value));
  }
  return url.toString();
}
