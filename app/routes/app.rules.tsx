/**
 * BP: Estimated Delivery & Geo — Delivery Rules Manager
 * Copyright © 2025 BluePeaks. All rights reserved.
 * https://bluepeaks.top
 *
 * This software is proprietary and confidential.
 * Unauthorized copying, modification, or distribution of this file,
 * via any medium, is strictly prohibited.
 */
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useLoaderData, useSubmit, useNavigation, data } from "react-router";
import {
  Page,
  Card,
  IndexTable,
  Text,
  Badge,
  Button,
  Modal,
  FormLayout,
  TextField,
  Select,
  Banner,
  EmptyState,
  Tooltip,
  BlockStack,
  InlineStack,
  Icon,
} from "@shopify/polaris";
import {
  ProductIcon,
  DiscountIcon,
  LocationIcon,
  InventoryIcon,
  GlobeIcon,
  EmailIcon,
  StoreIcon,
} from "@shopify/polaris-icons";
import { useState, useCallback } from "react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

// ─── Danh sách quốc gia phổ biến ────────────────────────────────────────────
const COUNTRIES = [
  { value: "AU", label: "🇦🇺 Australia" },
  { value: "US", label: "🇺🇸 United States" },
  { value: "GB", label: "🇬🇧 United Kingdom" },
  { value: "CA", label: "🇨🇦 Canada" },
  { value: "DE", label: "🇩🇪 Germany" },
  { value: "FR", label: "🇫🇷 France" },
  { value: "JP", label: "🇯🇵 Japan" },
  { value: "SG", label: "🇸🇬 Singapore" },
  { value: "NZ", label: "🇳🇿 New Zealand" },
  { value: "VN", label: "🇻🇳 Vietnam" },
  { value: "TH", label: "🇹🇭 Thailand" },
  { value: "MY", label: "🇲🇾 Malaysia" },
  { value: "ID", label: "🇮🇩 Indonesia" },
  { value: "KR", label: "🇰🇷 South Korea" },
  { value: "IN", label: "🇮🇳 India" },
  { value: "AE", label: "🇦🇪 UAE" },
  { value: "ZA", label: "🇿🇦 South Africa" },
  { value: "MX", label: "🇲🇽 Mexico" },
  { value: "BR", label: "🇧🇷 Brazil" },
  { value: "OTHER", label: "🌍 Rest of World" },
];

// ─── Loader ──────────────────────────────────────────────────────────────────
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const rules = await prisma.deliveryRule.findMany({
    where: { shop: session.shop },
    orderBy: { createdAt: "desc" },
  });
  return data({ rules, shop: session.shop });
};

// ─── Action ──────────────────────────────────────────────────────────────────
export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = String(formData.get("intent"));

  if (intent === "create") {
    const countryCode = String(formData.get("countryCode"));
    const minDays = parseInt(String(formData.get("minDays") || "3"), 10);
    const maxDays = parseInt(String(formData.get("maxDays") || "7"), 10);
    const processingDays = parseInt(String(formData.get("processingDays") || "1"), 10);
    const shippingMessage = String(formData.get("shippingMessage") || "Order today and get it by: {min_date} - {max_date}");

    // Kiểm tra không trùng quốc gia
    const existing = await prisma.deliveryRule.findFirst({
      where: { shop: session.shop, countryCode },
    });
    if (existing) {
      return data({ error: "A rule for this country already exists." }, { status: 400 });
    }

    await prisma.deliveryRule.create({
      data: { shop: session.shop, countryCode, minDays, maxDays, processingDays, shippingMessage },
    });
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
    await prisma.deliveryRule.updateMany({ where: { id, shop: session.shop }, data: { isActive: !isActive } });
    return data({ success: true });
  }

  return data({ error: "Unknown intent" }, { status: 400 });
};

// ─── Component ───────────────────────────────────────────────────────────────
export default function RulesPage() {
  const loaderData = useLoaderData<typeof loader>();
  const rules = loaderData?.rules ?? [];
  const submit = useSubmit();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [modalOpen, setModalOpen] = useState(false);
  const [countryCode, setCountryCode] = useState("AU");
  const [minDays, setMinDays] = useState("3");
  const [maxDays, setMaxDays] = useState("7");
  const [processingDays, setProcessingDays] = useState("1");
  const [shippingMessage, setShippingMessage] = useState(
    "Order today and get it by: {min_date} - {max_date}"
  );

  const handleCreate = useCallback(() => {
    const formData = new FormData();
    formData.append("intent", "create");
    formData.append("countryCode", countryCode);
    formData.append("minDays", minDays);
    formData.append("maxDays", maxDays);
    formData.append("processingDays", processingDays);
    formData.append("shippingMessage", shippingMessage);
    submit(formData, { method: "post" });
    setModalOpen(false);
  }, [countryCode, minDays, maxDays, processingDays, shippingMessage, submit]);

  const handleDelete = useCallback((id: string) => {
    if (!confirm("Delete this rule?")) return;
    const formData = new FormData();
    formData.append("intent", "delete");
    formData.append("id", id);
    submit(formData, { method: "post" });
  }, [submit]);

  const handleToggle = useCallback((id: string, isActive: boolean) => {
    const formData = new FormData();
    formData.append("intent", "toggle");
    formData.append("id", id);
    formData.append("isActive", String(isActive));
    submit(formData, { method: "post" });
  }, [submit]);

  const getCountryLabel = (code: string) => {
    return COUNTRIES.find((c) => c.value === code)?.label ?? code;
  };

  const rowMarkup = rules.map((rule: { id: string; countryCode: string; minDays: number; maxDays: number; processingDays: number; shippingMessage: string; isActive: boolean }, index: number) => (
    <IndexTable.Row id={rule.id} key={rule.id} position={index}>
      <IndexTable.Cell>
        <Text variant="headingSm" as="span">{getCountryLabel(rule.countryCode)}</Text>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <div className="flex items-center gap-1">
          <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-700/10">
            {rule.minDays}–{rule.maxDays} days
          </span>
        </div>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <span className="text-sm text-gray-500">{rule.processingDays} day(s)</span>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Tooltip content={rule.shippingMessage}>
          <span className="max-w-xs truncate text-sm text-gray-600 cursor-help">
            {rule.shippingMessage.length > 40
              ? rule.shippingMessage.slice(0, 40) + "..."
              : rule.shippingMessage}
          </span>
        </Tooltip>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Badge tone={rule.isActive ? "success" : "critical"}>
          {rule.isActive ? "Active" : "Inactive"}
        </Badge>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <InlineStack gap="200">
          <Button
            size="slim"
            onClick={() => handleToggle(rule.id, rule.isActive)}
            loading={isSubmitting}
          >
            {rule.isActive ? "Disable" : "Enable"}
          </Button>
          <Button
            size="slim"
            tone="critical"
            onClick={() => handleDelete(rule.id)}
            loading={isSubmitting}
          >
            Delete
          </Button>
        </InlineStack>
      </IndexTable.Cell>
    </IndexTable.Row>
  ));

  return (
    <div className="min-h-screen bg-[#f6f6f7] p-4 md:p-6 font-sans">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Delivery Rules</h1>
          <p className="text-sm text-gray-500 mt-1">Configure estimated delivery times per country</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Add Rule
        </button>
      </div>
      {/* Banner hướng dẫn */}
      <div className="mb-4">
        <Banner title="How it works" tone="info">
          <p>
            Create rules for each country. The widget on your product pages will automatically
            show estimated delivery dates based on the visitor&apos;s location.
            Use <code className="bg-blue-50 px-1 rounded text-blue-700">{"{min_date}"}</code> and{" "}
            <code className="bg-blue-50 px-1 rounded text-blue-700">{"{max_date}"}</code> as dynamic
            placeholders in your message.
          </p>
        </Banner>
      </div>

      {/* Recommended rules */}
      <div className="mb-6 bg-white p-4 rounded-xl border border-gray-200">
        <Text variant="headingSm" as="h3">Recommended rules</Text>
        <div className="mt-1 mb-3">
          <Text variant="bodySm" as="p" tone="subdued">
            Create estimated delivery date customized by specific conditions
          </Text>
        </div>
        
        <div className="flex gap-3 overflow-x-auto pb-2 styled-scrollbar">
          {[
            { id: "collections", label: "Specific collections", icon: ProductIcon },
            { id: "tags", label: "Product tags", icon: DiscountIcon },
            { id: "locations", label: "Inventory locations", icon: LocationIcon },
            { id: "quantity", label: "Inventory quantity", icon: InventoryIcon },
            { id: "regions", label: "Regions, Countries", icon: GlobeIcon },
            { id: "zipcodes", label: "Zipcodes", icon: EmailIcon },
            { id: "markets", label: "Shopify Markets", icon: StoreIcon },
          ].map((rule) => (
            <div
              key={rule.id}
              className={`flex-shrink-0 flex flex-col items-center justify-center p-3 w-[110px] h-[100px] border rounded-xl cursor-pointer transition-all ${
                rule.id === "collections"
                  ? "border-blue-600 bg-white ring-1 ring-blue-600 shadow-sm"
                  : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <div className="mb-2 text-gray-500">
                <Icon source={rule.icon} tone="base" />
              </div>
              <span className="text-[12px] font-medium text-center leading-tight text-gray-700 whitespace-normal">
                {rule.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* RULES TABLE CARD */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {rules.length === 0 ? (
          <div className="p-16 text-center space-y-4">
             <div className="text-4xl">🚚</div>
             <div className="space-y-1">
                <p className="text-base font-bold text-gray-800">No delivery rules yet</p>
                <p className="text-sm text-gray-400">Add rules for each country to show estimated shipping dates.</p>
             </div>
             <button
               onClick={() => setModalOpen(true)}
               className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md transition-all"
             >
               Add your first rule
             </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-sans">
               <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                     <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Country</th>
                     <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Delivery Time</th>
                     <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Processing</th>
                     <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                     <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-50">
                  {rules.map((rule: any) => (
                    <tr key={rule.id} className="hover:bg-gray-50/50 transition-colors group">
                       <td className="px-6 py-4">
                          <Text variant="bodyMd" fontWeight="bold" as="span">{getCountryLabel(rule.countryCode)}</Text>
                       </td>
                       <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 text-xs font-bold text-blue-700">
                             {rule.minDays}–{rule.maxDays} days
                          </span>
                       </td>
                       <td className="px-6 py-4">
                          <span className="text-xs text-gray-500 font-medium">{rule.processingDays} day(s)</span>
                       </td>
                       <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase ${rule.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                             <span className={`w-1 h-1 rounded-full ${rule.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                             {rule.isActive ? "Active" : "Inactive"}
                          </span>
                       </td>
                       <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button
                               onClick={() => handleToggle(rule.id, rule.isActive)}
                               className={`px-3 py-1.5 border rounded-md text-xs font-bold transition-all shadow-sm ${
                                 rule.isActive ? 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50' : 'bg-gray-900 border-gray-900 text-white hover:bg-gray-800'
                               }`}
                             >
                               {rule.isActive ? "Disable" : "Enable"}
                             </button>
                             <button
                               onClick={() => handleDelete(rule.id)}
                               className="px-3 py-1.5 bg-white border border-red-200 rounded-md text-xs font-bold text-red-500 hover:bg-red-50 shadow-sm transition-all"
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

      {/* Modal tạo rule mới */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Delivery Rule"
        primaryAction={{
          content: "Save Rule",
          onAction: handleCreate,
          loading: isSubmitting,
        }}
        secondaryActions={[{ content: "Cancel", onAction: () => setModalOpen(false) }]}
      >
        <Modal.Section>
          <BlockStack gap="400">
            <Select
              label="Country"
              options={COUNTRIES}
              value={countryCode}
              onChange={setCountryCode}
            />
            <FormLayout.Group>
              <TextField
                label="Min Delivery Days"
                type="number"
                value={minDays}
                onChange={setMinDays}
                min={0}
                autoComplete="off"
                helpText="Minimum days after processing"
              />
              <TextField
                label="Max Delivery Days"
                type="number"
                value={maxDays}
                onChange={setMaxDays}
                min={0}
                autoComplete="off"
                helpText="Maximum days after processing"
              />
            </FormLayout.Group>
            <TextField
              label="Processing Days"
              type="number"
              value={processingDays}
              onChange={setProcessingDays}
              min={0}
              autoComplete="off"
              helpText="How many days to prepare the order before shipping"
            />
            <TextField
              label="Shipping Message"
              value={shippingMessage}
              onChange={setShippingMessage}
              autoComplete="off"
              multiline={2}
              helpText={
                <span>
                  Use <code>{"{min_date}"}</code> and <code>{"{max_date}"}</code> as placeholders.
                  E.g.: "Order today and get it by: {"{min_date}"} - {"{max_date}"}"
                </span>
              }
            />
          </BlockStack>
        </Modal.Section>
      </Modal>
      </div>
    </div>
  );
}
