/**
 * BP: Estimated Delivery & Geo - Delivery Rules Manager
 * Copyright (c) 2025 BluePeaks. All rights reserved.
 */
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import type { Prisma } from "@prisma/client";
import {
  data,
  useActionData,
  useLoaderData,
  useLocation,
  useNavigate,
  useNavigation,
  useSubmit,
} from "react-router";
import { Badge, Banner, Icon } from "@shopify/polaris";
import { DeleteIcon, EditIcon, InfoIcon } from "@shopify/polaris-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { LockGlyph, UpgradePlanModal } from "../components/UpgradePlanModal";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import {
  inventoryStatusLabel,
  isAllCountriesCode,
  normalizeCollectionIds,
  normalizeProductIds,
  normalizeTags,
} from "../lib/delivery";
import {
  daysLabel,
  getRuleCountryLabel,
  jsonStringArray,
  previewRuleMessage,
  RULE_COUNTRIES,
} from "../lib/deliveryRules";
import { ensureDefaultWidget } from "../lib/deliveryRules.server";
import {
  activeRuleOrderBy,
  canEditWidget,
  canServeRule,
  canUseRuleFeatureSet,
  eligibleRuleRankMap,
  getRequiredPlanForWidget,
  limitExceeded,
  limitLabel,
} from "../lib/pricing";
import { syncCurrentPlanForShop } from "../lib/pricing.server";

type RuleRow = {
  id: string;
  ruleName: string;
  countryCode: string;
  targetCountries: unknown;
  marketId: string | null;
  marketName: string | null;
  widgetId: string | null;
  widgetName: string | null;
  targetProducts: unknown;
  targetCollections: unknown;
  targetTags: unknown;
  inventoryStatus: string;
  minDays: number;
  maxDays: number;
  processingDays: number;
  shippingMessage: string;
  isActive: boolean;
  storefrontStatus: "Served" | "Draft" | "Over plan limit" | "Premium design locked" | "Requires Shopify Markets";
  storefrontTone: "success" | "attention" | "critical" | "warning";
};

type ActionResult = {
  success?: boolean;
  error?: string;
};

type UpgradeModalState = {
  open: boolean;
  featureName?: string;
  requiredPlanName?: string;
  message?: string;
  upgradeUrl?: string;
};

async function deleteRulesAndOrphanRuleDesigns(shop: string, ids: string[]) {
  const rules = await prisma.deliveryRule.findMany({
    where: { id: { in: ids }, shop },
    select: {
      widget: {
        select: {
          id: true,
          isDefault: true,
          isReusable: true,
        },
      },
    },
  });
  const ruleDesignIds = Array.from(
    new Set(
      rules
        .map((rule) => rule.widget)
        .filter((widget): widget is { id: string; isDefault: boolean; isReusable: boolean } =>
          Boolean(widget && !widget.isDefault && !widget.isReusable),
        )
        .map((widget) => widget.id),
    ),
  );

  await prisma.$transaction(async (tx) => {
    await tx.deliveryRule.deleteMany({
      where: { id: { in: ids }, shop },
    });

    if (ruleDesignIds.length > 0) {
      await tx.widget.deleteMany({
        where: {
          id: { in: ruleDesignIds },
          shop,
          isDefault: false,
          isReusable: false,
          deliveryRules: { none: {} },
        },
      });
    }
  });
}

const BUTTON_BASE =
  "inline-flex h-9 items-center justify-center rounded-xl px-3 text-xs font-bold transition-all disabled:cursor-not-allowed disabled:opacity-50";
const BUTTON_PRIMARY = `${BUTTON_BASE} bg-gray-900 text-white shadow-md shadow-gray-200 hover:bg-black`;
const BUTTON_SECONDARY = `${BUTTON_BASE} border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50`;
const BUTTON_DANGER = `${BUTTON_BASE} border border-red-200 bg-white text-red-600 shadow-sm hover:bg-red-50`;
const ICON_BUTTON_SECONDARY =
  "inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 shadow-sm transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50";
const ICON_BUTTON_DANGER =
  "inline-flex h-9 w-9 items-center justify-center rounded-xl border border-red-200 bg-white text-red-600 shadow-sm transition-all hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50";
const BULK_BUTTON_BASE =
  "inline-flex h-7 items-center justify-center rounded-lg px-2.5 text-[11px] font-bold transition-all disabled:cursor-not-allowed disabled:opacity-50";
const BULK_BUTTON_PRIMARY = `${BULK_BUTTON_BASE} bg-gray-900 text-white shadow-sm hover:bg-black`;
const BULK_BUTTON_SECONDARY = `${BULK_BUTTON_BASE} border border-gray-200 bg-white text-gray-700 hover:bg-gray-50`;
const BULK_BUTTON_DANGER = `${BULK_BUTTON_BASE} border border-red-200 bg-white text-red-600 hover:bg-red-50`;
const RULE_COUNTRY_COUNT = RULE_COUNTRIES.length;
const RULES_PER_PAGE = 50;
const STATUS_FILTERS = new Set(["all", "active", "draft"]);

function ruleTargetingSummary(rule: Pick<RuleRow, "targetProducts" | "targetCollections" | "targetTags">) {
  const products = normalizeProductIds(jsonStringArray(rule.targetProducts));
  if (products.length > 0) return { label: "Products", value: products.join(", ") };

  const collections = normalizeCollectionIds(jsonStringArray(rule.targetCollections));
  if (collections.length > 0) return { label: "Collections", value: collections.join(", ") };

  const tags = normalizeTags(jsonStringArray(rule.targetTags));
  if (tags.length > 0) return { label: "Tags", value: tags.join(", ") };

  return { label: "Country-wide", value: "All products" };
}

function ruleCountrySummary(rule: Pick<RuleRow, "countryCode" | "targetCountries" | "marketId" | "marketName">) {
  const targetCountries = jsonStringArray(rule.targetCountries);
  if (rule.marketName) {
    return {
      label: rule.marketName,
      detail: `${targetCountries.length} countr${targetCountries.length === 1 ? "y" : "ies"} from Shopify Market`,
    };
  }

  if (targetCountries.length > 0) {
    return {
      label: `${targetCountries.length} countries`,
      detail: targetCountries.slice(0, 4).join(", ") + (targetCountries.length > 4 ? `, +${targetCountries.length - 4} more` : ""),
    };
  }

  if (isAllCountriesCode(rule.countryCode)) {
    return {
      label: "All countries",
      detail: `${RULE_COUNTRY_COUNT} countries`,
    };
  }

  return {
    label: getRuleCountryLabel(rule.countryCode),
    detail: rule.countryCode,
  };
}

function storefrontStatusLabel(status: RuleRow["storefrontStatus"]) {
  return status === "Premium design locked" ? "Locked" : status;
}

function storefrontStatusTooltip(status: RuleRow["storefrontStatus"]) {
  if (status === "Premium design locked") {
    return "Locked because this rule uses a design with premium components that are not included in the current plan. Upgrade or choose a basic design to serve it.";
  }

  if (status === "Over plan limit") {
    return "This active rule is outside the current plan limit and will not be served on the storefront.";
  }

  if (status === "Requires Shopify Markets") {
    return "This rule uses Shopify Markets targeting, which requires the Pro plan or higher.";
  }

  if (status === "Served") {
    return "This rule is eligible to be served on the storefront.";
  }

  return "Draft rules are saved but not served on the storefront.";
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session, billing } = await authenticate.admin(request);
  const url = new URL(request.url);
  await ensureDefaultWidget(session.shop);
  const currentPlan = await syncCurrentPlanForShop(session.shop, billing);
  const query = (url.searchParams.get("q") || "").trim().slice(0, 120);
  const rawStatus = url.searchParams.get("status") || "all";
  const status = STATUS_FILTERS.has(rawStatus) ? rawStatus : "all";
  const where: Prisma.DeliveryRuleWhereInput = { shop: session.shop };

  if (query) {
    where.ruleName = { contains: query, mode: "insensitive" };
  }

  if (status === "active") {
    where.isActive = true;
  } else if (status === "draft") {
    where.isActive = false;
  }

  const requestedPage = Math.max(1, Number.parseInt(url.searchParams.get("page") || "1", 10) || 1);
  const [totalRules, activeRuleCount] = await Promise.all([
    prisma.deliveryRule.count({ where }),
    prisma.deliveryRule.count({ where: { shop: session.shop, isActive: true } }),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalRules / RULES_PER_PAGE));
  const currentPage = Math.min(requestedPage, totalPages);

  const [rules, activeRuleOrder, defaultWidget] = await Promise.all([
    prisma.deliveryRule.findMany({
      where,
      orderBy: [{ isActive: "desc" }, { countryCode: "asc" }, { createdAt: "desc" }],
      skip: (currentPage - 1) * RULES_PER_PAGE,
      take: RULES_PER_PAGE,
      include: { widget: { select: { id: true, name: true, isDefault: true, isActive: true, customBlocks: true, requiredPlan: true } } },
    }),
    prisma.deliveryRule.findMany({
      where: { shop: session.shop, isActive: true },
      orderBy: activeRuleOrderBy(),
      select: {
        id: true,
        marketId: true,
        isActive: true,
        widget: { select: { isActive: true, customBlocks: true, requiredPlan: true } },
      },
    }),
    prisma.widget.findFirst({
      where: { shop: session.shop, isActive: true, isDefault: true },
      select: { customBlocks: true, requiredPlan: true },
    }),
  ]);
  const widgetForRule = (widget: { isActive?: boolean; customBlocks?: unknown; requiredPlan?: string | null } | null | undefined) =>
    widget?.isActive ? widget : defaultWidget;
  const activeRuleRank = eligibleRuleRankMap(activeRuleOrder, (rule) =>
    canUseRuleFeatureSet(currentPlan.plan, rule, widgetForRule(rule.widget)),
  );

  return data({
    rules: rules.map(({ widget, ...rule }) => ({
      ...rule,
      widgetName: widget?.name ?? null,
      storefrontStatus: (() => {
        if (!rule.isActive) return "Draft";
        if (rule.marketId && !currentPlan.plan.limits.shopifyMarkets) return "Requires Shopify Markets";
        const servingWidget = widgetForRule(widget);
        if (servingWidget && !canEditWidget(currentPlan.plan, servingWidget)) return "Premium design locked";
        const rank = activeRuleRank.get(rule.id) ?? Number.MAX_SAFE_INTEGER;
        if (!canServeRule(currentPlan.plan, rule, servingWidget, rank)) return "Over plan limit";
        return "Served";
      })(),
      storefrontTone: (() => {
        if (!rule.isActive) return "attention";
        if (rule.marketId && !currentPlan.plan.limits.shopifyMarkets) return "warning";
        const servingWidget = widgetForRule(widget);
        if (servingWidget && !canEditWidget(currentPlan.plan, servingWidget)) return "critical";
        const rank = activeRuleRank.get(rule.id) ?? Number.MAX_SAFE_INTEGER;
        if (!canServeRule(currentPlan.plan, rule, servingWidget, rank)) return "critical";
        return "success";
      })(),
    })),
    ruleSaved: url.searchParams.get("ruleSaved") === "1",
    pagination: {
      currentPage,
      totalPages,
      totalRules,
      pageSize: RULES_PER_PAGE,
      from: totalRules === 0 ? 0 : (currentPage - 1) * RULES_PER_PAGE + 1,
      to: Math.min(currentPage * RULES_PER_PAGE, totalRules),
    },
    currentPlan,
    activeRuleLimit: currentPlan.plan.limits.activeRules,
    activeRuleCount,
    filters: {
      query,
      status,
    },
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session, billing } = await authenticate.admin(request);
  const currentPlan = await syncCurrentPlanForShop(session.shop, billing);
  const formData = await request.formData();
  const intent = String(formData.get("intent"));
  const bulkIds = formData.getAll("ids").map(String).filter(Boolean);

  if (intent === "delete") {
    const id = String(formData.get("id"));
    await deleteRulesAndOrphanRuleDesigns(session.shop, [id]);
    return data({ success: true });
  }

  if (intent === "toggle") {
    const id = String(formData.get("id"));
    const isActive = formData.get("isActive") === "true";

    if (!isActive) {
      const [activeRuleCount, targetRule] = await Promise.all([
        prisma.deliveryRule.count({
          where: { shop: session.shop, isActive: true },
        }),
        prisma.deliveryRule.findFirst({
          where: { id, shop: session.shop },
          include: { widget: { select: { customBlocks: true, requiredPlan: true } } },
        }),
      ]);

      if (!targetRule) {
        return data({ error: "Rule was not found." }, { status: 404 });
      }

      if (targetRule.marketId && !currentPlan.plan.limits.shopifyMarkets) {
        return data({ error: "This rule uses Shopify Markets and requires the Pro plan or higher." }, { status: 403 });
      }

      if (!canEditWidget(currentPlan.plan, targetRule.widget)) {
        const requiredPlan = getRequiredPlanForWidget(targetRule.widget);
        return data({ error: `This rule design requires the ${requiredPlan.name} plan or higher.` }, { status: 403 });
      }

      if (limitExceeded(currentPlan.plan.limits.activeRules, activeRuleCount)) {
        return data({
          error: `Your ${currentPlan.plan.name} plan includes ${limitLabel(currentPlan.plan.limits.activeRules)} active delivery rule${currentPlan.plan.limits.activeRules === 1 ? "" : "s"}. Upgrade to activate more rules.`,
        }, { status: 403 });
      }
    }

    await prisma.deliveryRule.updateMany({
      where: { id, shop: session.shop },
      data: { isActive: !isActive },
    });
    return data({ success: true });
  }

  if (intent === "bulk-status") {
    if (!bulkIds.length) {
      return data({ error: "Select at least one rule." }, { status: 400 });
    }

    const status = String(formData.get("status"));
    if (status !== "active" && status !== "draft") {
      return data({ error: "Invalid bulk status." }, { status: 400 });
    }

    if (status === "active") {
      const [activeRuleCount, selectedRules] = await Promise.all([
        prisma.deliveryRule.count({ where: { shop: session.shop, isActive: true } }),
        prisma.deliveryRule.findMany({
          where: { id: { in: bulkIds }, shop: session.shop },
          include: { widget: { select: { customBlocks: true, requiredPlan: true } } },
        }),
      ]);
      const marketsLockedRule = selectedRules.find((rule) => rule.marketId && !currentPlan.plan.limits.shopifyMarkets);
      if (marketsLockedRule) {
        return data({ error: "One or more selected rules use Shopify Markets and require the Pro plan or higher." }, { status: 403 });
      }

      const premiumRule = selectedRules.find((rule) => !canEditWidget(currentPlan.plan, rule.widget));
      if (premiumRule) {
        const requiredPlan = getRequiredPlanForWidget(premiumRule.widget);
        return data({ error: `One or more selected rule designs require the ${requiredPlan.name} plan or higher.` }, { status: 403 });
      }

      const rulesToActivate = selectedRules.filter((rule) => !rule.isActive).length;

      if (limitExceeded(currentPlan.plan.limits.activeRules, activeRuleCount, rulesToActivate)) {
        return data({
          error: `Your ${currentPlan.plan.name} plan includes ${limitLabel(currentPlan.plan.limits.activeRules)} active delivery rule${currentPlan.plan.limits.activeRules === 1 ? "" : "s"}. Upgrade to activate more rules.`,
        }, { status: 403 });
      }
    }

    await prisma.deliveryRule.updateMany({
      where: { id: { in: bulkIds }, shop: session.shop },
      data: { isActive: status === "active" },
    });
    return data({ success: true });
  }

  if (intent === "bulk-delete") {
    if (!bulkIds.length) {
      return data({ error: "Select at least one rule." }, { status: 400 });
    }

    await deleteRulesAndOrphanRuleDesigns(session.shop, bulkIds);
    return data({ success: true });
  }

  return data({ error: "Unknown intent." }, { status: 400 });
};

export default function RulesPage() {
  const loaderData = useLoaderData<typeof loader>();
  const rules = useMemo(() => (loaderData?.rules ?? []) as RuleRow[], [loaderData?.rules]);
  const actionData = useActionData() as ActionResult | undefined;
  const submit = useSubmit();
  const location = useLocation();
  const navigate = useNavigate();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const actionError = actionData?.error;
  const pagination = loaderData.pagination;
  const filters = loaderData.filters;
  const activeRuleLimit = loaderData.activeRuleLimit;
  const activeRuleLimitReached =
    activeRuleLimit !== null && loaderData.activeRuleCount >= activeRuleLimit;
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState(filters.query);
  const [statusFilter, setStatusFilter] = useState(filters.status);
  const [toastMessage, setToastMessage] = useState<string | null>(
    loaderData.ruleSaved ? "Delivery rule saved" : null,
  );
  const [upgradeModal, setUpgradeModal] = useState<UpgradeModalState>({ open: false });

  const openUpgradeModal = useCallback((
    featureName: string,
    requiredPlanName?: string,
    upgradeUrl = "/app/pricing",
    message?: string,
  ) => {
    setUpgradeModal({ open: true, featureName, requiredPlanName, upgradeUrl, message });
  }, []);

  const ruleIds = useMemo(() => rules.map((rule) => rule.id), [rules]);
  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectedCount = selectedIds.length;
  const allSelected = ruleIds.length > 0 && ruleIds.every((id) => selectedIdSet.has(id));
  const hasActiveFilters = Boolean(filters.query || filters.status !== "all");
  const pageUrl = useCallback((page: number) => {
    const params = new URLSearchParams(location.search);
    params.set("page", String(page));
    params.delete("ruleSaved");
    const query = params.toString();
    return `${location.pathname}${query ? `?${query}` : ""}`;
  }, [location.pathname, location.search]);

  const navigateWithFilters = useCallback((nextSearchQuery: string, nextStatusFilter: string) => {
    const params = new URLSearchParams(location.search);
    const nextQuery = nextSearchQuery.trim();

    params.delete("ruleSaved");
    params.set("page", "1");
    if (nextQuery) params.set("q", nextQuery);
    else params.delete("q");

    if (nextStatusFilter !== "all") params.set("status", nextStatusFilter);
    else params.delete("status");

    const query = params.toString();
    const nextUrl = `${location.pathname}${query ? `?${query}` : ""}`;
    if (nextUrl !== `${location.pathname}${location.search}`) {
      navigate(nextUrl, { replace: true });
    }
  }, [location.pathname, location.search, navigate]);

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setStatusFilter("all");
    const params = new URLSearchParams(location.search);
    params.delete("q");
    params.delete("status");
    params.delete("page");
    params.delete("ruleSaved");
    const query = params.toString();
    navigate(`${location.pathname}${query ? `?${query}` : ""}`);
  }, [location.pathname, location.search, navigate]);

  const handleAddRule = useCallback(() => {
    if (activeRuleLimitReached) {
      openUpgradeModal(
        "Add more active delivery rules",
        undefined,
        "/app/pricing?upgrade=rules",
        `Your ${loaderData.currentPlan.plan.name} plan includes ${limitLabel(activeRuleLimit)} active delivery rule${activeRuleLimit === 1 ? "" : "s"}. Upgrade to add more active storefront rules.`,
      );
      return;
    }

    navigate("/app/rules/new");
  }, [activeRuleLimit, activeRuleLimitReached, loaderData.currentPlan.plan.name, navigate, openUpgradeModal]);

  const handleStorefrontStatusClick = useCallback((rule: RuleRow) => {
    if (rule.storefrontStatus === "Premium design locked") {
      openUpgradeModal(
        rule.widgetName || "Premium design",
        undefined,
        "/app/pricing?upgrade=design",
        "This rule uses a design with premium components that are not included in the current plan. Upgrade or choose a basic design to serve it.",
      );
      return;
    }

    if (rule.storefrontStatus === "Over plan limit") {
      openUpgradeModal(
        "More active delivery rules",
        undefined,
        "/app/pricing?upgrade=rules",
        `This active rule is over the ${loaderData.currentPlan.plan.name} plan limit and is not served on the storefront. Upgrade to serve more active rules.`,
      );
      return;
    }

    if (rule.storefrontStatus === "Requires Shopify Markets") {
      openUpgradeModal(
        "Shopify Markets targeting",
        "Pro",
        "/app/pricing?upgrade=markets",
        "This rule uses Shopify Markets targeting, which requires the Pro plan or higher.",
      );
    }
  }, [loaderData.currentPlan.plan.name, openUpgradeModal]);

  const handleDelete = useCallback((id: string) => {
    if (!confirm("Delete this delivery rule?")) return;
    submit({ intent: "delete", id }, { method: "post" });
  }, [submit]);

  const toggleRuleSelection = useCallback((id: string) => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((selectedId) => selectedId !== id)
        : [...current, id],
    );
  }, []);

  const toggleAllSelection = useCallback(() => {
    setSelectedIds((current) => {
      const currentSet = new Set(current);
      const isAllSelected = ruleIds.length > 0 && ruleIds.every((id) => currentSet.has(id));

      if (isAllSelected) {
        return current.filter((id) => !ruleIds.includes(id));
      }

      return Array.from(new Set([...current, ...ruleIds]));
    });
  }, [ruleIds]);

  const submitBulkAction = useCallback((intent: "bulk-status" | "bulk-delete", status?: "active" | "draft") => {
    if (!selectedIds.length) return;
    if (intent === "bulk-delete" && !confirm(`Delete ${selectedIds.length} selected delivery rules?`)) return;

    const formData = new FormData();
    formData.append("intent", intent);
    selectedIds.forEach((id) => formData.append("ids", id));
    if (status) formData.append("status", status);
    submit(formData, { method: "post" });
  }, [selectedIds, submit]);

  useEffect(() => {
    const visibleIds = new Set(ruleIds);
    setSelectedIds((current) => current.filter((id) => visibleIds.has(id)));
  }, [ruleIds]);

  useEffect(() => {
    setSearchQuery(filters.query);
    setStatusFilter(filters.status);
  }, [filters.query, filters.status]);

  useEffect(() => {
    if (searchQuery === filters.query) return;

    const timer = window.setTimeout(() => {
      navigateWithFilters(searchQuery, statusFilter);
    }, 400);

    return () => window.clearTimeout(timer);
  }, [filters.query, navigateWithFilters, searchQuery, statusFilter]);

  useEffect(() => {
    if (actionData?.success && navigation.state === "idle") {
      setSelectedIds([]);
      setToastMessage("Delivery rules updated");
    }
  }, [actionData?.success, navigation.state]);

  useEffect(() => {
    if (loaderData.ruleSaved) {
      setToastMessage("Delivery rule saved");
    }
  }, [loaderData.ruleSaved]);

  useEffect(() => {
    if (!toastMessage) return;

    const timer = window.setTimeout(() => setToastMessage(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  return (
    <div className="min-h-screen bg-[#f6f6f7] p-4 md:p-6 font-sans">
      <UpgradePlanModal
        open={upgradeModal.open}
        onClose={() => setUpgradeModal({ open: false })}
        featureName={upgradeModal.featureName}
        requiredPlanName={upgradeModal.requiredPlanName}
        currentPlanName={loaderData.currentPlan.plan.name}
        message={upgradeModal.message}
        upgradeUrl={upgradeModal.upgradeUrl}
      />
      {toastMessage && (
        <div className="fixed right-5 top-5 z-50 w-[min(360px,calc(100vw-2.5rem))] rounded-2xl border border-green-200 bg-white shadow-xl">
          <div className="flex items-start gap-3 p-4">
            <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-green-500" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-gray-900">{toastMessage}</p>
              <p className="mt-1 text-xs leading-5 text-gray-500">
                Your delivery rule changes are now saved.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="text-xs font-bold text-gray-400 transition-colors hover:text-gray-900"
              aria-label="Dismiss notification"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <div className="w-full space-y-4">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Delivery Rules</h1>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-green-500" />
              <p className="text-sm text-gray-500">Control estimated delivery dates by country, product, tag, and design.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleAddRule}
            className={`${BUTTON_PRIMARY} whitespace-nowrap`}
          >
            {activeRuleLimitReached ? (
              <>
                <LockGlyph className="mr-1.5 h-3.5 w-3.5" />
                Upgrade to add rule
              </>
            ) : (
              "Add rule"
            )}
          </button>
        </div>

        {actionError && (
          <Banner title="Rule action failed" tone="critical">
            <p>{actionError}</p>
          </Banner>
        )}

        {activeRuleLimitReached && (
          <Banner title={`${loaderData.currentPlan.plan.name} plan rule limit reached`} tone="warning">
            <p>
              You have {loaderData.activeRuleCount} active delivery rules. Upgrade to add more active storefront rules.
            </p>
          </Banner>
        )}

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-sky-200 bg-sky-300 px-5 py-4">
            <span className="h-4 w-4 text-gray-900">
              <Icon source={InfoIcon} />
            </span>
            <h2 className="text-sm font-bold text-gray-900">How storefront matching works</h2>
          </div>
          <div className="p-5">
            <p className="max-w-4xl text-sm leading-6 text-gray-500">
              The storefront matches product rules first, then collection rules, then tag rules,
              then country rules, and finally any All countries rule. Within each targeting level,
              inventory-specific rules are preferred over Both when the product stock status matches.
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-gray-100 bg-gray-50 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-800">Country ETA rules</h2>
              <p className="mt-1 text-xs text-gray-500">
                Use the rule editor to choose a design and configure targeting.
              </p>
            </div>
            <div
              className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto lg:items-center"
            >
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search rule name..."
                className="h-9 min-w-0 rounded-xl border border-gray-200 bg-white px-3 pb-1 pt-0 text-sm leading-normal text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 sm:w-64"
              />
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(event) => {
                    const nextStatus = event.target.value;
                    setStatusFilter(nextStatus);
                    navigateWithFilters(searchQuery, nextStatus);
                  }}
                  className="h-9 appearance-none rounded-xl border border-gray-200 bg-white pb-1 pl-3 pr-10 pt-0 text-xs font-bold leading-normal text-gray-700 shadow-sm outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                >
                  <option value="all">All status</option>
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                </select>
                <svg
                  aria-hidden="true"
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-700"
                  viewBox="0 0 20 20"
                  fill="none"
                >
                  <path
                    d="M6 8l4 4 4-4"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              {(filters.query || filters.status !== "all") && (
                <button type="button" onClick={clearFilters} className={BUTTON_SECONDARY}>
                  Clear
                </button>
              )}
            </div>
          </div>

          {rules.length === 0 ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center px-6 py-12 text-center">
              <div className="mb-4 rounded-full bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-500">
                {hasActiveFilters ? "No matching rules" : "No rules"}
              </div>
              <h3 className="text-base font-bold text-gray-900">
                {hasActiveFilters ? "No rules match this search" : "Create your first delivery rule"}
              </h3>
              <p className="mt-2 max-w-md text-sm text-gray-500">
                {hasActiveFilters
                  ? "Try a different rule name or status filter."
                  : "Add a country rule so the storefront can calculate delivery dates and render the selected ETA design."}
              </p>
              {hasActiveFilters ? (
                <button type="button" onClick={clearFilters} className={`${BUTTON_SECONDARY} mt-5`}>
                  Clear filters
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleAddRule}
                  className={`${BUTTON_PRIMARY} mt-5`}
                >
                  {activeRuleLimitReached ? (
                    <>
                      <LockGlyph className="mr-1.5 h-3.5 w-3.5" />
                      Upgrade to add rule
                    </>
                  ) : (
                    "Add first rule"
                  )}
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1320px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="w-12 px-5 py-3 align-middle">
                      <div className="flex items-center justify-center">
                        <input
                          type="checkbox"
                          aria-label="Select all delivery rules on this page"
                          checked={allSelected}
                          onChange={toggleAllSelection}
                          className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                        />
                      </div>
                    </th>
                    {selectedCount > 0 ? (
                      <th colSpan={8} className="px-5 py-2">
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                          <p className="text-xs font-semibold normal-case tracking-normal text-gray-700">
                            {selectedCount} selected
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            <button
                              type="button"
                              onClick={() => submitBulkAction("bulk-status", "active")}
                              disabled={isSubmitting}
                              className={BULK_BUTTON_PRIMARY}
                            >
                              Set active
                            </button>
                            <button
                              type="button"
                              onClick={() => submitBulkAction("bulk-status", "draft")}
                              disabled={isSubmitting}
                              className={BULK_BUTTON_SECONDARY}
                            >
                              Set draft
                            </button>
                            <button
                              type="button"
                              onClick={() => submitBulkAction("bulk-delete")}
                              disabled={isSubmitting}
                              className={BULK_BUTTON_DANGER}
                            >
                              Delete selected
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedIds([])}
                              disabled={isSubmitting}
                              className={BULK_BUTTON_SECONDARY}
                            >
                              Clear
                            </button>
                          </div>
                        </div>
                      </th>
                    ) : (
                      <>
                        <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-gray-500">Rule name</th>
                        <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-gray-500">Country</th>
                        <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-gray-500">Design</th>
                        <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-gray-500">Targeting</th>
                        <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-gray-500">Timeline</th>
                        <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-gray-500">Storefront message</th>
                        <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-gray-500">Status</th>
                        <th className="px-5 py-3 text-right text-[11px] font-bold uppercase tracking-wide text-gray-500">Actions</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rules.map((rule) => {
                    const targeting = ruleTargetingSummary(rule);
                    const country = ruleCountrySummary(rule);
                    const storefrontLocked =
                      rule.storefrontStatus === "Premium design locked" ||
                      rule.storefrontStatus === "Over plan limit" ||
                      rule.storefrontStatus === "Requires Shopify Markets";

                    return (
                        <tr
                          key={rule.id}
                          className={`align-middle transition-colors hover:bg-gray-50/80 ${
                            selectedIdSet.has(rule.id) ? "bg-gray-50" : ""
                          }`}
                        >
                          <td className="px-5 py-4 align-middle">
                            <div className="flex items-center justify-center">
                              <input
                                type="checkbox"
                                aria-label={`Select rule for ${getRuleCountryLabel(rule.countryCode)}`}
                                checked={selectedIdSet.has(rule.id)}
                                onChange={() => toggleRuleSelection(rule.id)}
                                className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                              />
                            </div>
                          </td>
                          <td className="px-5 py-4 align-middle">
                            <p className="max-w-[220px] truncate text-sm font-bold text-gray-900">
                              {rule.ruleName || "Delivery rule"}
                            </p>
                            <p className="mt-1 text-xs text-gray-400">Rule ID: {rule.id.slice(0, 8)}</p>
                          </td>
                          <td className="px-5 py-4 align-middle">
                            <p className="text-sm font-bold text-gray-900">{country.label}</p>
                            <p className="mt-1 max-w-[220px] truncate text-xs text-gray-400">{country.detail}</p>
                          </td>
                          <td className="px-5 py-4 align-middle">
                            <p className="text-sm font-bold text-gray-800">{rule.widgetName || "Default Widget"}</p>
                            <p className="mt-1 text-xs text-gray-400">
                              {rule.widgetId ? "Rule design" : "Fallback default"}
                            </p>
                          </td>
                          <td className="px-5 py-4 align-middle">
                            <div className="space-y-1 text-xs text-gray-500">
                              <p className="font-semibold text-gray-700">{targeting.label}</p>
                              <p className="max-w-[260px] truncate">{targeting.value}</p>
                              <p className="text-gray-400">Inventory: {inventoryStatusLabel(rule.inventoryStatus)}</p>
                            </div>
                          </td>
                          <td className="px-5 py-4 align-middle">
                            <div className="space-y-1">
                              <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-800">
                                {daysLabel(rule.minDays)} - {daysLabel(rule.maxDays)}
                              </span>
                              <p className="text-xs text-gray-500">Processing: {daysLabel(rule.processingDays)}</p>
                            </div>
                          </td>
                          <td className="max-w-xl px-5 py-4 align-middle">
                            <p className="line-clamp-2 text-sm font-medium text-gray-700">{rule.shippingMessage}</p>
                            <p className="mt-1 line-clamp-1 text-xs text-gray-400">
                              Preview: {previewRuleMessage(rule.shippingMessage)}
                            </p>
                          </td>
                          <td className="px-5 py-4 align-middle">
                            <div className="space-y-1">
                              <Badge tone={rule.isActive ? "success" : "attention"}>
                                {rule.isActive ? "Active" : "Draft"}
                              </Badge>
                              <div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (storefrontLocked) handleStorefrontStatusClick(rule);
                                  }}
                                  className={`inline-flex ${storefrontLocked ? "cursor-pointer" : "cursor-help"}`}
                                  title={storefrontStatusTooltip(rule.storefrontStatus)}
                                  aria-label={storefrontStatusTooltip(rule.storefrontStatus)}
                                >
                                  {storefrontLocked && <LockGlyph className="mr-1 h-3.5 w-3.5 text-gray-500" />}
                                  <Badge tone={rule.storefrontTone}>
                                    {storefrontStatusLabel(rule.storefrontStatus)}
                                  </Badge>
                                </button>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 align-middle">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => navigate(`/app/rules/${rule.id}`)}
                                aria-label={`Edit rule for ${getRuleCountryLabel(rule.countryCode)}`}
                                title="Edit"
                                className={ICON_BUTTON_SECONDARY}
                              >
                                <span className="h-4 w-4">
                                  <Icon source={EditIcon} />
                                </span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(rule.id)}
                                disabled={isSubmitting}
                                aria-label={`Delete rule for ${getRuleCountryLabel(rule.countryCode)}`}
                                title="Delete"
                                className={ICON_BUTTON_DANGER}
                              >
                                <span className="h-4 w-4">
                                  <Icon source={DeleteIcon} />
                                </span>
                              </button>
                            </div>
                          </td>
                        </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="flex flex-col gap-3 border-t border-gray-100 bg-white px-5 py-4 md:flex-row md:items-center md:justify-between">
                <p className="text-xs font-medium text-gray-500">
                  Showing <span className="font-bold text-gray-900">{pagination.from}</span>
                  {" - "}
                  <span className="font-bold text-gray-900">{pagination.to}</span>
                  {" of "}
                  <span className="font-bold text-gray-900">{pagination.totalRules}</span> rules
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(pageUrl(pagination.currentPage - 1))}
                    disabled={pagination.currentPage <= 1}
                    className={BUTTON_SECONDARY}
                  >
                    Previous
                  </button>
                  <span className="inline-flex h-9 items-center rounded-xl border border-gray-200 bg-gray-50 px-3 text-xs font-bold text-gray-700">
                    Page {pagination.currentPage} / {pagination.totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => navigate(pageUrl(pagination.currentPage + 1))}
                    disabled={pagination.currentPage >= pagination.totalPages}
                    className={BUTTON_SECONDARY}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
