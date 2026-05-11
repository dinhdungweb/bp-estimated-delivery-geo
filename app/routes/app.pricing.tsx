import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import {
  data,
  redirect,
  useActionData,
  useLoaderData,
} from "react-router";
import { Badge, Banner } from "@shopify/polaris";
import { useEffect, useMemo, useState } from "react";
import prisma from "../db.server";
import {
  PAID_PLAN_HANDLES,
  PLAN_ORDER,
  PRICING_PLANS,
  isAtLeastPlan,
  limitLabel,
  planRank,
  type PlanHandle,
} from "../lib/pricing";
import {
  embeddedPricingActionPath,
  getCurrentPlan,
  isBillingTestMode,
  pricingReturnUrl,
  syncCurrentPlanForShop,
} from "../lib/pricing.server";
import { authenticate } from "../shopify.server";

type ActionResult = {
  error?: string;
};

type ShopifyGlobal = typeof globalThis & {
  shopify?: {
    idToken?: () => Promise<string>;
  };
};

function isPlanHandle(value: string): value is PlanHandle {
  return PLAN_ORDER.includes(value as PlanHandle);
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session, billing } = await authenticate.admin(request);
  const url = new URL(request.url);
  const currentPlan = await syncCurrentPlanForShop(session.shop, billing);
  const pricingAction = embeddedPricingActionPath(request, session.shop);
  const [totalRules, activeRules, savedDesigns] = await Promise.all([
    prisma.deliveryRule.count({ where: { shop: session.shop } }),
    prisma.deliveryRule.count({ where: { shop: session.shop, isActive: true } }),
    prisma.widget.count({
      where: {
        shop: session.shop,
        isDefault: false,
        isReusable: true,
      },
    }),
  ]);

  return data({
    plans: PLAN_ORDER.map((handle) => PRICING_PLANS[handle]),
    paidPlanHandles: PAID_PLAN_HANDLES,
    currentPlan,
    usage: {
      totalRules,
      activeRules,
      savedDesigns,
    },
    billingSuccess: url.searchParams.get("billing") === "success",
    billingCancelled: url.searchParams.get("billing") === "cancelled",
    upgradeReason: url.searchParams.get("upgrade") || "",
    isTestMode: isBillingTestMode(),
    pricingAction,
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session, billing } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = String(formData.get("intent") || "");
  const planHandle = String(formData.get("plan") || "");

  if (intent !== "select-plan" || !isPlanHandle(planHandle)) {
    return data({ error: "Invalid pricing action." }, { status: 400 });
  }

  const currentPlan = await getCurrentPlan(billing);

  if (planHandle === "free") {
    if (currentPlan.subscription) {
      await billing.cancel({
        subscriptionId: currentPlan.subscription.id,
        isTest: isBillingTestMode(),
        prorate: true,
      });
    }
    await prisma.appSetting.upsert({
      where: { shop: session.shop },
      update: { planHandle: "free", planSubscriptionId: null, planSyncedAt: new Date() },
      create: { shop: session.shop, isEnabled: true, widgetStyle: "modern", planHandle: "free", planSyncedAt: new Date() },
    });
    return redirect(pricingReturnUrl(request, "billing=cancelled"));
  }

  const plan = PRICING_PLANS[planHandle];
  if (!plan.billingPlan) {
    return data({ error: "This plan is not available for billing." }, { status: 400 });
  }

  await billing.request({
    plan: plan.billingPlan,
    isTest: isBillingTestMode(),
    returnUrl: pricingReturnUrl(request),
  });
};

const CARD_BASE =
  "flex h-full flex-col rounded-2xl border bg-white p-5 shadow-sm transition-all";
const BUTTON_BASE =
  "inline-flex h-10 items-center justify-center rounded-xl px-4 text-xs font-bold transition-all disabled:cursor-not-allowed disabled:opacity-60";
const BUTTON_PRIMARY = `${BUTTON_BASE} bg-gray-900 text-white shadow-md shadow-gray-200 hover:bg-black`;
const BUTTON_SECONDARY = `${BUTTON_BASE} border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50`;

export default function PricingPage() {
  const {
    plans,
    currentPlan,
    usage,
    billingSuccess,
    billingCancelled,
    upgradeReason,
    isTestMode,
    pricingAction,
  } = useLoaderData<typeof loader>();
  const actionData = useActionData() as ActionResult | undefined;
  const [clientError, setClientError] = useState("");
  const [submittingPlan, setSubmittingPlan] = useState("");
  const [noticeDismissed, setNoticeDismissed] = useState(false);

  const currentRank = planRank(currentPlan.plan.handle);
  const shouldShowNotice = !noticeDismissed && (billingSuccess || billingCancelled || Boolean(upgradeReason));

  const notice = useMemo(() => {
    if (billingSuccess) return "Plan updated. Your new limits are now active.";
    if (billingCancelled) return "Subscription cancelled. Your store is now on the Free plan.";
    if (upgradeReason === "rules") return "Upgrade to add more active delivery rules.";
    if (upgradeReason === "designs") return "Upgrade to save more My Designs.";
    if (upgradeReason === "markets") return "Upgrade to Pro to use Shopify Markets targeting.";
    if (upgradeReason === "templates") return "Upgrade to use templates with premium components.";
    if (upgradeReason.startsWith("component-")) return "Upgrade to add this premium Studio component.";
    if (upgradeReason.startsWith("step-preset-")) return "Upgrade to use premium Steps presets.";
    if (upgradeReason === "studio" || upgradeReason === "design") return "Upgrade to edit or save this premium design.";
    return "";
  }, [billingCancelled, billingSuccess, upgradeReason]);

  useEffect(() => {
    setNoticeDismissed(false);
  }, [billingCancelled, billingSuccess, upgradeReason]);

  const requestPlan = async (planHandle: PlanHandle) => {
    setClientError("");
    setSubmittingPlan(planHandle);

    try {
      const token = await (globalThis as ShopifyGlobal).shopify?.idToken?.();
      const formData = new FormData();
      formData.set("intent", "select-plan");
      formData.set("plan", planHandle);

      const response = await fetch(pricingAction, {
        method: "POST",
        body: formData,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        redirect: "manual",
      });

      const billingUrl = response.headers.get("X-Shopify-API-Request-Failure-Reauthorize-Url");
      if (billingUrl) {
        window.open(billingUrl, "_top");
        return;
      }

      if (response.type === "opaqueredirect" || response.status >= 300 && response.status < 400) {
        window.location.assign(pricingAction);
        return;
      }

      if (!response.ok) {
        setClientError("Could not open Shopify billing. Refresh the app and try again.");
        return;
      }

      window.location.assign(pricingAction);
    } catch {
      setClientError("Could not open Shopify billing. Refresh the app and try again.");
    } finally {
      setSubmittingPlan("");
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f6f7] p-4 font-sans md:p-6">
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-gray-950">Pricing</h1>
            <p className="max-w-2xl text-sm leading-6 text-gray-500">
              Choose the right plan for your delivery rules, widget designs, Shopify Markets targeting, and analytics.
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-medium text-gray-500">Current plan</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-sm font-bold text-gray-950">{currentPlan.plan.name}</span>
              {isTestMode && <Badge tone="attention">Test billing</Badge>}
            </div>
          </div>
        </div>

        {(actionData?.error || clientError) && (
          <Banner title="Pricing action failed" tone="critical">
            <p>{actionData?.error || clientError}</p>
          </Banner>
        )}

        {currentPlan.billingError && (
          <Banner title="Billing status could not be verified" tone="warning">
            <p>{currentPlan.billingError}</p>
          </Banner>
        )}

        {shouldShowNotice && notice && (
          <div className="flex items-start justify-between gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 shadow-sm">
            <p className="text-sm font-semibold text-green-800">{notice}</p>
            <button
              type="button"
              onClick={() => setNoticeDismissed(true)}
              className="text-xs font-bold text-green-700 hover:text-green-900"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => {
            const isCurrent = plan.handle === currentPlan.plan.handle;
            const isDowngrade = planRank(plan.handle) < currentRank;
            const isBusy = submittingPlan === plan.handle;
            const activeRuleUsage = `${usage.activeRules} / ${limitLabel(plan.limits.activeRules)}`;
            const savedDesignUsage = `${usage.savedDesigns} / ${limitLabel(plan.limits.savedDesigns)}`;

            return (
              <article
                key={plan.handle}
                className={`${CARD_BASE} ${
                  plan.recommended
                    ? "border-gray-900 ring-2 ring-gray-900/10"
                    : isCurrent
                      ? "border-green-200"
                      : "border-gray-200"
                }`}
              >
                <div className="mb-4">
                  <div className="flex min-h-6 items-center justify-between gap-3">
                    <h2 className="text-base font-bold text-gray-950">{plan.name}</h2>
                    <div className="flex shrink-0 items-center gap-2">
                      {plan.recommended && <Badge tone="info">Popular</Badge>}
                      {isCurrent && <Badge tone="success">Current</Badge>}
                    </div>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-gray-500">{plan.description}</p>
                </div>

                <div className="mb-4">
                  <span className="text-3xl font-bold text-gray-950">
                    {plan.monthlyPrice === 0 ? "Free" : `$${plan.monthlyPrice}`}
                  </span>
                  {plan.monthlyPrice > 0 && <span className="text-sm font-medium text-gray-500"> / month</span>}
                  {plan.handle === "free" && (
                    <p className="mt-1 text-xs text-gray-400">
                      Experience the app before scaling
                    </p>
                  )}
                  {plan.monthlyPrice > 0 && (
                    <p className="mt-1 text-xs text-gray-400">7-day free trial through Shopify Billing</p>
                  )}
                </div>

                <div className="mb-4 grid gap-2 rounded-xl border border-gray-100 bg-gray-50 p-3 text-xs">
                  <div className="flex justify-between gap-2">
                    <span className="text-gray-500">Active rules</span>
                    <span className="font-bold text-gray-900">{activeRuleUsage}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-gray-500">My Designs</span>
                    <span className="font-bold text-gray-900">{savedDesignUsage}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-gray-500">Analytics</span>
                    <span className="font-bold text-gray-900">{plan.limits.analyticsDays} days</span>
                  </div>
                </div>

                <ul className="mb-5 flex-1 space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="grid grid-cols-[6px_1fr] gap-2 text-xs leading-5 text-gray-600">
                      <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-gray-900" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => requestPlan(plan.handle)}
                  disabled={isCurrent || Boolean(submittingPlan)}
                  className={`w-full ${plan.recommended || isAtLeastPlan(plan.handle, "pro") ? BUTTON_PRIMARY : BUTTON_SECONDARY}`}
                >
                  {isBusy
                    ? "Opening Shopify billing..."
                    : isCurrent
                      ? "Current plan"
                      : plan.handle === "free"
                        ? "Downgrade to Free"
                        : isDowngrade
                          ? `Switch to ${plan.name}`
                          : `Upgrade to ${plan.name}`}
                </button>
              </article>
            );
          })}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-gray-950">How limits are enforced</h2>
          <p className="mt-2 text-sm leading-6 text-gray-500">
            Limits apply to active delivery rules and reusable My Designs. Existing draft rules and rule-specific design copies remain available, but creating new active rules or saved designs can require an upgrade.
          </p>
        </div>
      </div>
    </div>
  );
}
