/**
 * BP: Estimated Delivery & Geo - Delivery Rule Editor
 * Copyright (c) 2025 BluePeaks. All rights reserved.
 */
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import type { Prisma, Widget } from "@prisma/client";
import {
  data,
  redirect,
  useActionData,
  useLoaderData,
  useNavigate,
  useNavigation,
  useSubmit,
} from "react-router";
import {
  Badge,
  Banner,
  FormLayout,
  Icon,
  Select,
  Text,
  TextField,
} from "@shopify/polaris";
import { EditIcon, ViewIcon, WandIcon } from "@shopify/polaris-icons";
import { useMemo, useState } from "react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { WidgetPreviewRenderer } from "../components/WidgetRenderer";
import { parseBlockConfigs } from "../lib/delivery";
import {
  daysLabel,
  getRuleCountryLabel,
  jsonStringArray,
  previewRuleMessage,
  readRulePayload,
  RULE_COUNTRIES,
  RULE_DEFAULT_MESSAGE,
} from "../lib/deliveryRules";
import {
  ensureDefaultWidget,
  hasDuplicateDeliveryRule,
} from "../lib/deliveryRules.server";

type RuleEditorRule = {
  id: string;
  countryCode: string;
  widgetId: string | null;
  targetProducts: unknown;
  targetTags: unknown;
  minDays: number;
  maxDays: number;
  processingDays: number;
  shippingMessage: string;
  isActive: boolean;
};

type ActionResult = {
  error?: string;
};

function isNewRuleId(id: string | undefined) {
  return !id || id === "new";
}

function stringArrayCsv(value: unknown) {
  return jsonStringArray(value).join(", ");
}

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const routeId = params.id;
  const isNew = isNewRuleId(routeId);
  const defaultWidget = await ensureDefaultWidget(session.shop);

  const [rule, widgets] = await Promise.all([
    isNew
      ? Promise.resolve(null)
      : prisma.deliveryRule.findFirst({
          where: { id: routeId, shop: session.shop },
        }),
    prisma.widget.findMany({
      where: { shop: session.shop },
      orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
    }),
  ]);

  if (!isNew && !rule) {
    throw redirect("/app/rules");
  }

  return data({
    isNew,
    rule,
    widgets,
    defaultWidgetId: rule?.widgetId || defaultWidget.id,
  });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const routeId = params.id;
  const isNew = isNewRuleId(routeId);
  const formData = await request.formData();
  const payload = readRulePayload(formData);

  if ("error" in payload) {
    return data({ error: payload.error }, { status: 400 });
  }

  const selectedWidget = await prisma.widget.findFirst({
    where: { id: payload.widgetId, shop: session.shop },
    select: { id: true },
  });

  if (!selectedWidget) {
    return data({ error: "Selected design was not found." }, { status: 400 });
  }

  const duplicate = await hasDuplicateDeliveryRule({
    shop: session.shop,
    id: isNew ? undefined : routeId,
    countryCode: payload.countryCode,
    targetProducts: payload.targetProducts,
    targetTags: payload.targetTags,
  });

  if (duplicate) {
    return data({ error: "A rule with this country/product/tag targeting already exists." }, { status: 400 });
  }

  const saveData = {
    countryCode: payload.countryCode,
    widgetId: payload.widgetId,
    targetProducts: payload.targetProducts as Prisma.InputJsonValue,
    targetTags: payload.targetTags as Prisma.InputJsonValue,
    minDays: payload.minDays,
    maxDays: payload.maxDays,
    processingDays: payload.processingDays,
    shippingMessage: payload.shippingMessage,
    isActive: payload.isActive,
  };

  if (isNew) {
    await prisma.deliveryRule.create({
      data: {
        shop: session.shop,
        ...saveData,
      },
    });
  } else {
    const updated = await prisma.deliveryRule.updateMany({
      where: { id: routeId, shop: session.shop },
      data: saveData,
    });

    if (updated.count === 0) {
      return data({ error: "Rule was not found." }, { status: 404 });
    }
  }

  return redirect("/app/rules?ruleSaved=1");
};

export default function RuleEditorPage() {
  const { isNew, rule, widgets, defaultWidgetId } = useLoaderData<typeof loader>();
  const actionData = useActionData() as ActionResult | undefined;
  const navigate = useNavigate();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const initialRule = rule as RuleEditorRule | null;
  const [countryCode, setCountryCode] = useState(initialRule?.countryCode || "AU");
  const [widgetId, setWidgetId] = useState(initialRule?.widgetId || defaultWidgetId);
  const [targetProducts, setTargetProducts] = useState(stringArrayCsv(initialRule?.targetProducts));
  const [targetTags, setTargetTags] = useState(stringArrayCsv(initialRule?.targetTags));
  const [minDays, setMinDays] = useState(String(initialRule?.minDays ?? 3));
  const [maxDays, setMaxDays] = useState(String(initialRule?.maxDays ?? 7));
  const [processingDays, setProcessingDays] = useState(String(initialRule?.processingDays ?? 1));
  const [shippingMessage, setShippingMessage] = useState(initialRule?.shippingMessage || RULE_DEFAULT_MESSAGE);
  const [isActive, setIsActive] = useState(initialRule?.isActive ?? true);

  const typedWidgets = widgets as Widget[];
  const selectedWidget = useMemo(() => {
    return typedWidgets.find((widget) => widget.id === widgetId) || typedWidgets[0];
  }, [typedWidgets, widgetId]);

  const widgetOptions = useMemo(
    () =>
      typedWidgets.map((widget) => ({
        value: widget.id,
        label: `${widget.name}${widget.isDefault ? " (Default)" : ""}${widget.isActive ? "" : " (Inactive)"}`,
      })),
    [typedWidgets],
  );

  const timelineSummary = useMemo(() => {
    const min = Number.parseInt(minDays, 10);
    const max = Number.parseInt(maxDays, 10);
    const processing = Number.parseInt(processingDays, 10);

    return {
      min: Number.isFinite(min) ? min : 0,
      max: Number.isFinite(max) ? max : 0,
      processing: Number.isFinite(processing) ? processing : 0,
    };
  }, [minDays, maxDays, processingDays]);

  const handleSave = () => {
    const formData = new FormData();
    formData.append("countryCode", countryCode);
    formData.append("widgetId", widgetId);
    formData.append("targetProducts", targetProducts);
    formData.append("targetTags", targetTags);
    formData.append("minDays", minDays);
    formData.append("maxDays", maxDays);
    formData.append("processingDays", processingDays);
    formData.append("shippingMessage", shippingMessage);
    formData.append("isActive", String(isActive));
    submit(formData, { method: "post" });
  };

  return (
    <div className="min-h-screen bg-[#f6f6f7] p-4 md:p-6 font-sans">
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => navigate("/app/rules")}
              className="mb-2 inline-flex h-8 items-center justify-center rounded-xl border border-gray-200 bg-white px-3 text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Back to rules
            </button>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              {isNew ? "Add delivery rule" : "Edit delivery rule"}
            </h1>
            <div className="flex items-center gap-2">
              <span className={`flex h-2 w-2 rounded-full ${isActive ? "bg-green-500" : "bg-amber-500"}`} />
              <Text variant="bodySm" tone="subdued" as="p">
                {isActive ? "This rule can match storefront traffic." : "This rule is saved but not active."}
              </Text>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSubmitting}
            className="inline-flex h-9 min-w-[112px] items-center justify-center whitespace-nowrap rounded-xl bg-blue-600 px-3 text-xs font-bold text-white shadow-md shadow-blue-100 transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : "Save rule"}
          </button>
        </div>

        {actionData?.error && (
          <Banner title="Rule could not be saved" tone="critical">
            <p>{actionData.error}</p>
          </Banner>
        )}

        <div className="flex flex-col gap-8 lg:flex-row">
          <div className="flex-1 space-y-6">
            <div
              className={`relative overflow-hidden rounded-2xl border bg-white shadow-sm ${
                isActive ? "border-green-200" : "border-amber-200"
              }`}
            >
              <div className={`absolute inset-y-0 left-0 w-1.5 ${isActive ? "bg-green-500" : "bg-amber-500"}`} />
              <div className="flex flex-col gap-4 p-5 pl-6 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-bold text-gray-900">Rule status</h2>
                    <Badge tone={isActive ? "success" : "attention"}>
                      {isActive ? "Active" : "Paused"}
                    </Badge>
                  </div>
                  <p className="max-w-xl text-sm text-gray-500">
                    Active rules are evaluated on the storefront. Paused rules remain saved for later.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsActive((current) => !current)}
                  className={`inline-flex h-9 min-w-[112px] items-center justify-center rounded-xl px-3 text-xs font-bold transition-all ${
                    isActive
                      ? "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                      : "bg-green-600 text-white shadow-lg shadow-green-100 hover:bg-green-700"
                  }`}
                >
                  {isActive ? "Pause rule" : "Activate"}
                </button>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-50 p-6">
                <h2 className="text-base font-bold text-gray-800">Rule targeting</h2>
                <p className="mt-1 text-xs text-gray-400">
                  Product IDs match first, then tags, then country-wide rules.
                </p>
              </div>
              <div className="space-y-4 p-6">
                <Select
                  label="Country"
                  options={RULE_COUNTRIES}
                  value={countryCode}
                  onChange={setCountryCode}
                />
                <FormLayout.Group>
                  <TextField
                    label="Target product IDs"
                    value={targetProducts}
                    onChange={setTargetProducts}
                    autoComplete="off"
                    placeholder="1234567890, gid://shopify/Product/1234567890"
                    helpText="Optional. Leave empty if this rule should match by tag or country."
                  />
                  <TextField
                    label="Target product tags"
                    value={targetTags}
                    onChange={setTargetTags}
                    autoComplete="off"
                    placeholder="VIP, Pre-order"
                    helpText="Optional. Leave product IDs and tags empty for a country-wide rule."
                  />
                </FormLayout.Group>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-50 p-6">
                <div>
                  <h2 className="text-base font-bold text-gray-800">Design selection</h2>
                  <p className="mt-1 text-xs text-gray-400">
                    This is the widget design rendered when the rule matches.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/app/templates?tab=my-design")}
                  className="inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-transparent bg-gray-50 px-3 text-xs font-bold text-gray-700 transition-all hover:border-gray-200 hover:bg-gray-100"
                >
                  <span className="h-4 w-4 text-gray-400"><Icon source={WandIcon} /></span>
                  Templates
                </button>
              </div>
              <div className="space-y-4 p-6">
                <Select
                  label="Design for this rule"
                  options={widgetOptions}
                  value={widgetId}
                  onChange={setWidgetId}
                  helpText="Create designs in Templates, then attach one here."
                />
                {selectedWidget && (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <div>
                      <p className="text-sm font-bold text-gray-900">{selectedWidget.name}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {selectedWidget.isDefault ? "Default storefront design" : "Saved My design"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate(`/app/widgets/${selectedWidget.id}?sourceDesignId=${selectedWidget.id}`)}
                      className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 text-xs font-bold text-white shadow-md shadow-blue-100 hover:bg-blue-700"
                    >
                      <span className="h-4 w-4 text-white"><Icon source={EditIcon} /></span>
                      Customize
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-50 p-6">
                <h2 className="text-base font-bold text-gray-800">Delivery timing and message</h2>
                <p className="mt-1 text-xs text-gray-400">
                  Configure the ETA math and storefront text for this rule.
                </p>
              </div>
              <div className="space-y-4 p-6">
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
                  multiline={3}
                  helpText="Supported placeholders: {order_date}, {ship_date}, {min_date}, {max_date}."
                />
              </div>
            </div>
          </div>

          <div className="w-full space-y-6 lg:w-96">
            <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-50 p-5">
                <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Context Preview</h2>
                <Badge tone={isActive ? "success" : "attention"}>
                  {isActive ? "Live" : "Paused"}
                </Badge>
              </div>

              <div className="flex flex-1 flex-col gap-6 bg-[#f8fafc] p-6">
                <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-gray-100 shadow-sm">
                  <div className="absolute left-4 top-4 z-10">
                    <Badge tone="attention">{getRuleCountryLabel(countryCode)}</Badge>
                  </div>
                  <img
                    src="/fashion-sample.png"
                    alt="Product preview"
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="h-4 w-3/4 rounded-full bg-gray-200" />
                    <div className="h-3 w-1/2 rounded-full bg-gray-100" />
                  </div>

                  <button
                    type="button"
                    className="flex h-9 w-full items-center justify-center rounded-xl bg-gray-900 px-3 text-xs font-bold text-white shadow-lg shadow-gray-200"
                  >
                    Buy Now - $129.00
                  </button>

                  {selectedWidget && (
                    <div className="pointer-events-none w-full">
                      <WidgetPreviewRenderer
                        settings={{
                          ...selectedWidget,
                          style: "custom",
                          customBlocks: parseBlockConfigs(selectedWidget.customBlocks),
                          isActive: true,
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-800">Rule summary</h3>
                <span className="h-4 w-4 text-gray-400"><Icon source={ViewIcon} /></span>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-gray-500">Country</span>
                  <span className="font-bold text-gray-900">{getRuleCountryLabel(countryCode)}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-gray-500">Timeline</span>
                  <span className="font-bold text-gray-900">
                    {daysLabel(timelineSummary.min)} - {daysLabel(timelineSummary.max)}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-gray-500">Processing</span>
                  <span className="font-bold text-gray-900">{daysLabel(timelineSummary.processing)}</span>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Message preview</p>
                  <p className="mt-1 text-sm font-medium text-gray-800">
                    {previewRuleMessage(shippingMessage)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
