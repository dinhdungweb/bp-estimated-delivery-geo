/**
 * BP: Estimated Delivery & Geo - Delivery Rules Manager
 * Copyright (c) 2025 BluePeaks. All rights reserved.
 */
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import {
  data,
  useActionData,
  useLoaderData,
  useNavigate,
  useNavigation,
  useSubmit,
} from "react-router";
import { Badge, Banner, Text } from "@shopify/polaris";
import { useCallback, useMemo } from "react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { normalizeProductIds, normalizeTags } from "../lib/delivery";
import {
  daysLabel,
  getRuleCountryLabel,
  jsonStringArray,
  previewRuleMessage,
} from "../lib/deliveryRules";
import { ensureDefaultWidget } from "../lib/deliveryRules.server";

type RuleRow = {
  id: string;
  countryCode: string;
  widgetId: string | null;
  widgetName: string | null;
  targetProducts: unknown;
  targetTags: unknown;
  minDays: number;
  maxDays: number;
  processingDays: number;
  shippingMessage: string;
  isActive: boolean;
};

type ActionResult = {
  success?: boolean;
  error?: string;
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const url = new URL(request.url);
  await ensureDefaultWidget(session.shop);

  const rules = await prisma.deliveryRule.findMany({
    where: { shop: session.shop },
    orderBy: [{ isActive: "desc" }, { countryCode: "asc" }, { createdAt: "desc" }],
    include: { widget: { select: { id: true, name: true, isDefault: true, isActive: true } } },
  });

  return data({
    rules: rules.map(({ widget, ...rule }) => ({
      ...rule,
      widgetName: widget?.name ?? null,
    })),
    ruleSaved: url.searchParams.get("ruleSaved") === "1",
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = String(formData.get("intent"));

  if (intent === "delete") {
    const id = String(formData.get("id"));
    await prisma.deliveryRule.deleteMany({ where: { id, shop: session.shop } });
    return data({ success: true });
  }

  if (intent === "toggle") {
    const id = String(formData.get("id"));
    const isActive = formData.get("isActive") === "true";
    await prisma.deliveryRule.updateMany({
      where: { id, shop: session.shop },
      data: { isActive: !isActive },
    });
    return data({ success: true });
  }

  return data({ error: "Unknown intent." }, { status: 400 });
};

export default function RulesPage() {
  const loaderData = useLoaderData<typeof loader>();
  const rules = useMemo(() => (loaderData?.rules ?? []) as RuleRow[], [loaderData?.rules]);
  const actionData = useActionData() as ActionResult | undefined;
  const submit = useSubmit();
  const navigate = useNavigate();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const actionError = actionData?.error;

  const summary = useMemo(() => {
    const active = rules.filter((rule) => rule.isActive).length;
    const fallbackRule = rules.find((rule) => rule.countryCode === "OTHER");
    const averageMax = rules.length
      ? Math.round(rules.reduce((sum, rule) => sum + rule.maxDays, 0) / rules.length)
      : 0;

    return {
      total: rules.length,
      active,
      inactive: rules.length - active,
      fallback: fallbackRule ? "Configured" : "Missing",
      averageMax,
    };
  }, [rules]);

  const handleDelete = useCallback((id: string) => {
    if (!confirm("Delete this delivery rule?")) return;
    submit({ intent: "delete", id }, { method: "post" });
  }, [submit]);

  const handleToggle = useCallback((id: string, isActive: boolean) => {
    submit({ intent: "toggle", id, isActive: String(isActive) }, { method: "post" });
  }, [submit]);

  return (
    <div className="min-h-screen bg-[#f6f6f7] p-4 md:p-6 font-sans">
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Delivery Rules</h1>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-blue-500" />
              <p className="text-sm text-gray-500">Control estimated delivery dates by country, product, tag, and design.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate("/app/rules/new")}
            className="inline-flex h-9 items-center justify-center whitespace-nowrap rounded-xl bg-gray-900 px-3 text-xs font-bold text-white shadow-md transition-colors hover:bg-black"
          >
            Add rule
          </button>
        </div>

        {loaderData.ruleSaved && (
          <Banner title="Delivery rule saved" tone="success">
            <p>Your rule targeting, ETA settings, and selected design are now saved.</p>
          </Banner>
        )}

        {actionError && (
          <Banner title="Rule action failed" tone="critical">
            <p>{actionError}</p>
          </Banner>
        )}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Total rules</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{summary.total}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Active</p>
            <p className="mt-2 text-2xl font-bold text-green-700">{summary.active}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Fallback</p>
            <p className="mt-2 text-lg font-bold text-gray-900">{summary.fallback}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Avg max ETA</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {summary.averageMax ? daysLabel(summary.averageMax) : "-"}
            </p>
          </div>
        </div>

        <Banner title="How storefront matching works" tone="info">
          <p>
            The storefront matches product-specific rules first, then tag rules, then country rules,
            and finally Rest of World. Each rule renders the design selected for that rule.
          </p>
        </Banner>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <div>
              <Text as="h2" variant="headingMd">Country ETA rules</Text>
              <p className="mt-1 text-xs text-gray-500">
                Use the rule editor to choose a design and configure targeting.
              </p>
            </div>
            {summary.inactive > 0 && (
              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                {summary.inactive} inactive
              </span>
            )}
          </div>

          {rules.length === 0 ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center px-6 py-12 text-center">
              <div className="mb-4 rounded-full bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-500">
                No rules
              </div>
              <h3 className="text-base font-bold text-gray-900">Create your first delivery rule</h3>
              <p className="mt-2 max-w-md text-sm text-gray-500">
                Add a country rule so the storefront can calculate delivery dates and render the selected ETA design.
              </p>
              <button
                type="button"
                onClick={() => navigate("/app/rules/new")}
                className="mt-5 inline-flex h-9 items-center justify-center rounded-xl bg-gray-900 px-3 text-xs font-bold text-white hover:bg-black"
              >
                Add first rule
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-gray-500">Country</th>
                    <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-gray-500">Design</th>
                    <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-gray-500">Product / tag targeting</th>
                    <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-gray-500">Timeline</th>
                    <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-gray-500">Storefront message</th>
                    <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-gray-500">Status</th>
                    <th className="px-5 py-3 text-right text-[11px] font-bold uppercase tracking-wide text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rules.map((rule) => (
                    <tr key={rule.id} className="align-top transition-colors hover:bg-gray-50">
                      <td className="px-5 py-4">
                        <p className="text-sm font-bold text-gray-900">{getRuleCountryLabel(rule.countryCode)}</p>
                        <p className="mt-1 text-xs text-gray-400">{rule.countryCode}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-bold text-gray-800">{rule.widgetName || "Default Widget"}</p>
                        <p className="mt-1 text-xs text-gray-400">
                          {rule.widgetId ? "Rule design" : "Fallback default"}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <div className="space-y-1 text-xs text-gray-500">
                          <p>
                            Products:{" "}
                            <span className="font-semibold text-gray-700">
                              {normalizeProductIds(jsonStringArray(rule.targetProducts)).join(", ") || "All"}
                            </span>
                          </p>
                          <p>
                            Tags:{" "}
                            <span className="font-semibold text-gray-700">
                              {normalizeTags(jsonStringArray(rule.targetTags)).join(", ") || "All"}
                            </span>
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                            {daysLabel(rule.minDays)} - {daysLabel(rule.maxDays)}
                          </span>
                          <p className="text-xs text-gray-500">Processing: {daysLabel(rule.processingDays)}</p>
                        </div>
                      </td>
                      <td className="max-w-md px-5 py-4">
                        <p className="line-clamp-2 text-sm font-medium text-gray-700">{rule.shippingMessage}</p>
                        <p className="mt-1 line-clamp-1 text-xs text-gray-400">
                          Preview: {previewRuleMessage(rule.shippingMessage)}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <Badge tone={rule.isActive ? "success" : "critical"}>
                          {rule.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => navigate(`/app/rules/${rule.id}`)}
                            className="inline-flex h-9 items-center justify-center rounded-xl border border-gray-200 bg-white px-3 text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggle(rule.id, rule.isActive)}
                            disabled={isSubmitting}
                            className="inline-flex h-9 items-center justify-center rounded-xl border border-gray-200 bg-white px-3 text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
                          >
                            {rule.isActive ? "Disable" : "Enable"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(rule.id)}
                            disabled={isSubmitting}
                            className="inline-flex h-9 items-center justify-center rounded-xl border border-red-200 bg-white px-3 text-xs font-bold text-red-600 shadow-sm hover:bg-red-50 disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
