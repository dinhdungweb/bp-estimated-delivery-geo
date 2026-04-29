/**
 * BP: Estimated Delivery & Geo - Delivery Rules Manager
 * Copyright (c) 2025 BluePeaks. All rights reserved.
 */
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import {
  data,
  useActionData,
  useLoaderData,
  useNavigation,
  useSubmit,
} from "react-router";
import {
  Badge,
  Banner,
  BlockStack,
  FormLayout,
  Modal,
  Select,
  Text,
  TextField,
} from "@shopify/polaris";
import { useCallback, useEffect, useMemo, useState } from "react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { normalizeCountry } from "../lib/delivery";

type RuleRow = {
  id: string;
  countryCode: string;
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

const COUNTRIES = [
  { value: "AU", label: "Australia" },
  { value: "US", label: "United States" },
  { value: "GB", label: "United Kingdom" },
  { value: "CA", label: "Canada" },
  { value: "DE", label: "Germany" },
  { value: "FR", label: "France" },
  { value: "JP", label: "Japan" },
  { value: "SG", label: "Singapore" },
  { value: "NZ", label: "New Zealand" },
  { value: "VN", label: "Vietnam" },
  { value: "TH", label: "Thailand" },
  { value: "MY", label: "Malaysia" },
  { value: "ID", label: "Indonesia" },
  { value: "KR", label: "South Korea" },
  { value: "IN", label: "India" },
  { value: "AE", label: "UAE" },
  { value: "ZA", label: "South Africa" },
  { value: "MX", label: "Mexico" },
  { value: "BR", label: "Brazil" },
  { value: "OTHER", label: "Rest of World" },
];

const DEFAULT_MESSAGE = "Order today and get it by: {min_date} - {max_date}";

function parseNonNegativeInt(value: FormDataEntryValue | null, fallback: number): number | null {
  const parsed = Number.parseInt(String(value ?? fallback), 10);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 365) return null;
  return parsed;
}

function getCountryLabel(code: string) {
  return COUNTRIES.find((country) => country.value === code)?.label ?? code;
}

function daysLabel(value: number) {
  return value === 1 ? "1 day" : `${value} days`;
}

function previewMessage(message: string) {
  return message
    .replaceAll("{order_date}", "Apr 28")
    .replaceAll("{ship_date}", "Apr 29")
    .replaceAll("{min_date}", "May 2")
    .replaceAll("{max_date}", "May 6");
}

function readRulePayload(formData: FormData) {
  const countryCode = normalizeCountry(formData.get("countryCode"));
  const minDays = parseNonNegativeInt(formData.get("minDays"), 3);
  const maxDays = parseNonNegativeInt(formData.get("maxDays"), 7);
  const processingDays = parseNonNegativeInt(formData.get("processingDays"), 1);
  const shippingMessage = String(formData.get("shippingMessage") || DEFAULT_MESSAGE).trim();

  if (!COUNTRIES.some((country) => country.value === countryCode)) {
    return { error: "Invalid country code." };
  }

  if (minDays === null || maxDays === null || processingDays === null) {
    return { error: "Delivery days must be whole numbers between 0 and 365." };
  }

  if (minDays > maxDays) {
    return { error: "Min delivery days cannot be greater than max delivery days." };
  }

  if (shippingMessage.length === 0 || shippingMessage.length > 500) {
    return { error: "Shipping message must be between 1 and 500 characters." };
  }

  return { countryCode, minDays, maxDays, processingDays, shippingMessage };
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const rules = await prisma.deliveryRule.findMany({
    where: { shop: session.shop },
    orderBy: [{ isActive: "desc" }, { countryCode: "asc" }],
  });

  return data({ rules, shop: session.shop });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = String(formData.get("intent"));

  if (intent === "create" || intent === "update") {
    const payload = readRulePayload(formData);
    if ("error" in payload) {
      return data({ error: payload.error }, { status: 400 });
    }

    const id = String(formData.get("id") || "");
    if (intent === "update" && !id) {
      return data({ error: "Rule id is required." }, { status: 400 });
    }

    const duplicate = await prisma.deliveryRule.findFirst({
      where: {
        shop: session.shop,
        countryCode: payload.countryCode,
        ...(intent === "update" ? { NOT: { id } } : {}),
      },
    });

    if (duplicate) {
      return data({ error: "A rule for this country already exists." }, { status: 400 });
    }

    if (intent === "create") {
      await prisma.deliveryRule.create({
        data: {
          shop: session.shop,
          countryCode: payload.countryCode,
          minDays: payload.minDays,
          maxDays: payload.maxDays,
          processingDays: payload.processingDays,
          shippingMessage: payload.shippingMessage,
        },
      });
    } else {
      await prisma.deliveryRule.updateMany({
        where: { id, shop: session.shop },
        data: {
          countryCode: payload.countryCode,
          minDays: payload.minDays,
          maxDays: payload.maxDays,
          processingDays: payload.processingDays,
          shippingMessage: payload.shippingMessage,
        },
      });
    }

    return data({ success: true });
  }

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
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const actionError = actionData?.error;

  const [modalOpen, setModalOpen] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [countryCode, setCountryCode] = useState("AU");
  const [minDays, setMinDays] = useState("3");
  const [maxDays, setMaxDays] = useState("7");
  const [processingDays, setProcessingDays] = useState("1");
  const [shippingMessage, setShippingMessage] = useState(DEFAULT_MESSAGE);

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

  useEffect(() => {
    if (actionData?.success) {
      setModalOpen(false);
      setEditingRuleId(null);
    }
  }, [actionData]);

  const openCreateModal = useCallback(() => {
    setEditingRuleId(null);
    setCountryCode("AU");
    setMinDays("3");
    setMaxDays("7");
    setProcessingDays("1");
    setShippingMessage(DEFAULT_MESSAGE);
    setModalOpen(true);
  }, []);

  const handleEdit = useCallback((rule: RuleRow) => {
    setEditingRuleId(rule.id);
    setCountryCode(rule.countryCode);
    setMinDays(String(rule.minDays));
    setMaxDays(String(rule.maxDays));
    setProcessingDays(String(rule.processingDays));
    setShippingMessage(rule.shippingMessage);
    setModalOpen(true);
  }, []);

  const handleSave = useCallback(() => {
    const formData = new FormData();
    formData.append("intent", editingRuleId ? "update" : "create");
    if (editingRuleId) formData.append("id", editingRuleId);
    formData.append("countryCode", countryCode);
    formData.append("minDays", minDays);
    formData.append("maxDays", maxDays);
    formData.append("processingDays", processingDays);
    formData.append("shippingMessage", shippingMessage);
    submit(formData, { method: "post" });
  }, [editingRuleId, countryCode, minDays, maxDays, processingDays, shippingMessage, submit]);

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
              <p className="text-sm text-gray-500">Control estimated delivery dates by shipping country.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex h-9 items-center justify-center whitespace-nowrap rounded-xl bg-gray-900 px-3 text-xs font-bold text-white shadow-md transition-colors hover:bg-black"
          >
            Add rule
          </button>
        </div>

        {actionError && (
          <Banner title="Rule could not be saved" tone="critical">
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
            The storefront first tries an exact country rule, then falls back to Rest of World.
            If no active rule is found, the delivery widget stays hidden for that visitor.
          </p>
        </Banner>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <div>
              <Text as="h2" variant="headingMd">Country ETA rules</Text>
              <p className="mt-1 text-xs text-gray-500">
                Use placeholders: {"{order_date}"}, {"{ship_date}"}, {"{min_date}"}, {"{max_date}"}.
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
                Add a country rule so the storefront can calculate delivery dates and render the ETA widget.
              </p>
              <button
                type="button"
                onClick={openCreateModal}
                className="mt-5 inline-flex h-9 items-center justify-center rounded-xl bg-gray-900 px-3 text-xs font-bold text-white hover:bg-black"
              >
                Add first rule
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-gray-500">Country</th>
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
                        <p className="text-sm font-bold text-gray-900">{getCountryLabel(rule.countryCode)}</p>
                        <p className="mt-1 text-xs text-gray-400">{rule.countryCode}</p>
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
                          Preview: {previewMessage(rule.shippingMessage)}
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
                            onClick={() => handleEdit(rule)}
                            className="inline-flex h-9 items-center justify-center rounded-xl border border-gray-200 bg-white px-3 text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggle(rule.id, rule.isActive)}
                            className="inline-flex h-9 items-center justify-center rounded-xl border border-gray-200 bg-white px-3 text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-50"
                          >
                            {rule.isActive ? "Disable" : "Enable"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(rule.id)}
                            className="inline-flex h-9 items-center justify-center rounded-xl border border-red-200 bg-white px-3 text-xs font-bold text-red-600 shadow-sm hover:bg-red-50"
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

        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingRuleId ? "Edit delivery rule" : "Add delivery rule"}
          primaryAction={{
            content: editingRuleId ? "Update rule" : "Save rule",
            onAction: handleSave,
            loading: isSubmitting,
          }}
          secondaryActions={[{ content: "Cancel", onAction: () => setModalOpen(false) }]}
        >
          <Modal.Section>
            <BlockStack gap="400">
              {actionError && (
                <Banner title="Rule could not be saved" tone="critical">
                  <p>{actionError}</p>
                </Banner>
              )}
              <Select
                label="Country"
                options={COUNTRIES}
                value={countryCode}
                onChange={setCountryCode}
              />
              <FormLayout.Group>
                <TextField
                  label="Min delivery days"
                  type="number"
                  value={minDays}
                  onChange={setMinDays}
                  min={0}
                  autoComplete="off"
                  helpText="Earliest delivery date after processing."
                />
                <TextField
                  label="Max delivery days"
                  type="number"
                  value={maxDays}
                  onChange={setMaxDays}
                  min={0}
                  autoComplete="off"
                  helpText="Latest delivery date after processing."
                />
              </FormLayout.Group>
              <TextField
                label="Processing days"
                type="number"
                value={processingDays}
                onChange={setProcessingDays}
                min={0}
                autoComplete="off"
                helpText="Days needed before the order is ready to ship."
              />
              <TextField
                label="Storefront message"
                value={shippingMessage}
                onChange={setShippingMessage}
                autoComplete="off"
                multiline={2}
                helpText="Supported placeholders: {order_date}, {ship_date}, {min_date}, {max_date}."
              />
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Preview</p>
                <p className="mt-1 text-sm font-medium text-gray-800">
                  {previewMessage(shippingMessage)}
                </p>
              </div>
            </BlockStack>
          </Modal.Section>
        </Modal>
      </div>
    </div>
  );
}
