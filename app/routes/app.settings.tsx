import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import type { Prisma } from "@prisma/client";
import { useLoaderData, useSubmit, useNavigation, useNavigate, data as routerData } from "react-router";
import { useState } from "react";
import { 
  Page, 
  Layout, 
  Card, 
  Text, 
  Badge, 
  Button, 
  Box,
  InlineStack,
  BlockStack,
  TextField,
  Banner,
  Divider,
  Icon
} from "@shopify/polaris";
import { 
  PlusIcon, 
  LayoutColumns2Icon,
  ViewIcon,
  EditIcon,
  WandIcon,
  QuestionCircleIcon
} from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { WidgetPreviewRenderer } from "../components/WidgetRenderer";
import { buildFallbackBlocks, DEFAULT_SHIPPING_MESSAGE, parseBlockConfigs } from "../lib/delivery";

// ─── Helper Components ────────────────────────────────────────────────────────
const ToolbarButton = ({ icon, label, bold, italic, underline, colorIcon, bgIcon }: any) => (
  <div 
    style={{ 
      width: '32px', 
      height: '32px', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      cursor: 'pointer', 
      borderRadius: '4px'
    }}
    className="hover:bg-gray-100"
  >
    {bold && <b>{label}</b>}
    {italic && <i>{label}</i>}
    {underline && <span style={{ textDecoration: 'underline' }}>{label}</span>}
    {colorIcon && <div style={{ textAlign: 'center' }}><Text variant="bodySm" as="span">{label}</Text><div style={{ height: '3px', background: 'red', width: '12px', margin: '0 auto' }} /></div>}
    {bgIcon && <div style={{ textAlign: 'center', background: '#eee', padding: '2px' }}><Text variant="bodySm" as="span">{label}</Text></div>}
    {icon === "AlignLeft" && <Icon source="<svg viewBox='0 0 20 20'><path d='M17 14.5a.5.5 0 0 1 0 1H3a.5.5 0 0 1 0-1h14zm0-5a.5.5 0 0 1 0 1H3a.5.5 0 0 1 0-1h14zm0-5a.5.5 0 0 1 0 1H3a.5.5 0 0 1 0-1h14z'/></svg>" />}
    {icon === "AlignCenter" && <Icon source="<svg viewBox='0 0 20 20'><path d='M17 14.5a.5.5 0 0 1 0 1H3a.5.5 0 0 1 0-1h14zm-2-5a.5.5 0 0 1 0 1H5a.5.5 0 0 1 0-1h10zm-2-5a.5.5 0 0 1 0 1H7a.5.5 0 0 1 0-1h6z'/></svg>" />}
    {icon === "AlignRight" && <Icon source="<svg viewBox='0 0 20 20'><path d='M17 14.5a.5.5 0 0 1 0 1H3a.5.5 0 0 1 0-1h14zm0-5a.5.5 0 0 1 0 1H7a.5.5 0 0 1 0-1h10zm0-5a.5.5 0 0 1 0 1H10a.5.5 0 0 1 0-1h7z'/></svg>" />}
    {icon === "ListBullet" && <Icon source="<svg viewBox='0 0 20 20'><path d='M17 14.5a.5.5 0 0 1 0 1H7a.5.5 0 0 1 0-1h10zm-12 1a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm12-6a.5.5 0 0 1 0 1H7a.5.5 0 0 1 0-1h10zm-12 1a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm12-6a.5.5 0 0 1 0 1H7a.5.5 0 0 1 0-1h10zm-12 1a1 1 0 1 1 0-2 1 1 0 0 1 0 2z'/></svg>" />}
    {icon === "Undo" && <Icon source="<svg viewBox='0 0 20 20'><path d='M8 4.5l-4 4 4 4v-3a6 6 0 0 1 6 6h1a7 7 0 0 0-7-7v-4z'/></svg>" />}
    {icon === "Redo" && <Icon source="<svg viewBox='0 0 20 20'><path d='M12 4.5l4 4-4 4v-3a6 6 0 0 0-6 6H5a7 7 0 0 1 7-7v-4z'/></svg>" />}
    {icon === "Link" && <Icon source="<svg viewBox='0 0 20 20'><path d='M14 6h-2a1 1 0 1 1 0-2h2a4 4 0 0 1 0 8h-2a1 1 0 1 1 0-2h2a2 2 0 1 0 0-4zM8 12H6a4 4 0 0 1 0-8h2a1 1 0 1 1 0 2H6a2 2 0 1 0 0 4h2a1 1 0 1 1 0 2zm-1-4a1 1 0 0 1 1-1h4a1 1 0 1 1 0 2H8a1 1 0 0 1-1-1z'/></svg>" />}
    {icon === "Image" && <Icon source="<svg viewBox='0 0 20 20'><path d='M17 4a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4zM5 4h10v6l-2-2-3 3-2-2-3 3V4z'/></svg>" />}
    {icon === "Code" && <Icon source="<svg viewBox='0 0 20 20'><path d='M6.5 13.5L3 10l3.5-3.5 1 1L5 10l2.5 2.5-1 1zm7-7L17 10l-3.5 3.5-1-1 2.5-2.5-2.5-2.5 1-1z'/></svg>" />}
    {!bold && !italic && !underline && !colorIcon && !bgIcon && !icon && label}
  </div>
);

const CollapsibleCard = ({ title, badge, children, defaultOpen = false }: any) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card>
       <BlockStack gap="400">
          <div style={{ cursor: 'pointer' }} onClick={() => setOpen(!open)}>
             <InlineStack align="space-between" blockAlign="center">
                <InlineStack gap="200" blockAlign="center">
                   <Text variant="headingMd" as="h2">{title}</Text>
                   {badge}
                </InlineStack>
                <div style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                   <Icon source="<svg viewBox='0 0 20 20'><path d='M15 7.5L10 12.5L5 7.5' stroke='currentColor' fill='none' strokeWidth='2'/></svg>" />
                </div>
             </InlineStack>
          </div>
          {open && <Divider />}
          {open && children}
       </BlockStack>
    </Card>
  );
};

// ─── Loader (Fetch Default Widget & Settings) ────────────────────────────────
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const shop = session.shop;
  const templateApplied = url.searchParams.get("templateApplied") === "1";
  const sourceDesignId = url.searchParams.get("sourceDesignId") || "";

  const [widgets, appSetting] = await Promise.all([
    prisma.widget.findMany({
      where: { shop },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    }),
    prisma.appSetting.findUnique({ where: { shop } })
  ]);
  
  if (widgets.length === 0) {
      const defaultWidget = await prisma.widget.create({
        data: {
          shop,
          name: "Default Widget",
          isDefault: true,
          isActive: true,
          padding: 16,
          customBlocks: buildFallbackBlocks(
            {},
            DEFAULT_SHIPPING_MESSAGE,
          ) as unknown as Prisma.InputJsonValue,
        },
      });
      return routerData({ defaultWidget, appSetting, shop, templateApplied, sourceDesignId });
  }

  return routerData({ defaultWidget: widgets[0], appSetting, shop, templateApplied, sourceDesignId });
};

// ─── Action (Updates) ────────────────────────────────────────────────────────
export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  
  const id = formData.get("id") as string;
  const headerText = formData.get("headerText") as string;
  const isActive = formData.get("isActive") === "true";
  const isEnabled = formData.get("isEnabled") === "true";

  // Cập nhật Widget
  await prisma.widget.updateMany({
    where: { id, shop: session.shop },
    data: { headerText, isActive },
  });

  // Cập nhật AppSetting (Toàn cục)
  await prisma.appSetting.upsert({
    where: { shop: session.shop },
    update: { isEnabled },
    create: {
      shop: session.shop,
      isEnabled,
      widgetStyle: 'modern'
    }
  });

  return routerData({ success: true });
};

// ─── Main Component (Premium UI) ─────────────────────────────────────────────
export default function SettingsPage() {
  const { defaultWidget, appSetting, shop, templateApplied, sourceDesignId } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [headerText, setHeaderText] = useState(defaultWidget?.headerText || "");
  const [isActive, setIsActive] = useState(defaultWidget?.isActive ?? true);
  const [isEnabled, setIsEnabled] = useState(appSetting?.isEnabled ?? false);
  const shopHandle = shop.split(".")[0];
  const themeEditorUrl = `https://admin.shopify.com/store/${shopHandle}/themes/current/editor?context=apps`;

  const handleSaveQuick = (newIsActive: boolean, newIsEnabled: boolean) => {
    const formData = new FormData();
    formData.append("id", defaultWidget.id);
    formData.append("headerText", headerText);
    formData.append("isActive", String(newIsActive));
    formData.append("isEnabled", String(newIsEnabled));
    submit(formData, { method: "post" });
  };

  return (
    <div className="min-h-screen bg-[#f6f6f7] p-4 md:p-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-4">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
         <div className="space-y-1">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Elite Delivery Dashboard</h1>
            <div className="flex items-center gap-2">
               <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
               <Text variant="bodySm" tone="subdued" as="p">System active on your storefront</Text>
            </div>
         </div>
         <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={() => navigate("/app/widgets")}
              className="inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-gray-200 bg-white px-3 text-xs font-bold text-gray-900 shadow-sm transition-all hover:border-gray-900"
            >
              <div className="w-4 h-4 text-gray-500"><Icon source={LayoutColumns2Icon} /></div> All Widgets
            </button>
            <button 
              onClick={() => navigate("/app/widgets/new")}
              className="inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-gray-900 px-3 text-xs font-bold text-white shadow-md transition-all hover:bg-black active:scale-95"
            >
              <div className="w-4 h-4 text-white"><Icon source={PlusIcon} /></div> Build New
            </button>
         </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* LEFT COLUMN: MAIN CONFIGURATION */}
        <div className="flex-1 space-y-6">
            {/* 1. ACTIVATE APP CARD */}
            <div
              className={`relative overflow-hidden rounded-2xl border bg-white shadow-sm ${
                isEnabled ? "border-green-200" : "border-amber-200"
              }`}
            >
              <div
                className={`absolute inset-y-0 left-0 w-1.5 ${
                  isEnabled ? "bg-green-500" : "bg-amber-500"
                }`}
              />
              <div className="flex flex-col gap-4 p-5 pl-6 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                      isEnabled
                        ? "bg-green-50 text-green-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    <svg
                      aria-hidden="true"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="none"
                    >
                      <path
                        d="M10 3v6"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                      <path
                        d="M6.3 5.8a6 6 0 1 0 7.4 0"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-bold text-gray-900">Global Activation</h2>
                      <Badge tone={isEnabled ? "success" : "attention"}>
                        {isEnabled ? "Live" : "Paused"}
                      </Badge>
                    </div>
                    <p className="max-w-xl text-sm text-gray-500">
                      {isEnabled
                        ? "Delivery widget is enabled and can appear on your storefront."
                        : "Delivery widget is hidden from your storefront until you activate it."}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          isEnabled ? "bg-green-500" : "bg-amber-500"
                        }`}
                      />
                      <span>{isEnabled ? "Storefront active" : "Storefront paused"}</span>
                      <span className="text-gray-300">•</span>
                      <span>Applies to all active delivery widgets</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const newStatus = !isEnabled;
                    setIsEnabled(newStatus);
                    handleSaveQuick(isActive, newStatus);
                  }}
                  disabled={isSubmitting}
                  className={`inline-flex h-9 min-w-[112px] items-center justify-center whitespace-nowrap rounded-xl px-3 text-xs font-bold transition-all ${
                    isEnabled
                      ? "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                      : "bg-green-600 text-white shadow-lg shadow-green-100 hover:bg-green-700"
                  } ${isSubmitting ? "cursor-not-allowed opacity-50" : ""}`}
                >
                  {isSubmitting ? "Saving..." : isEnabled ? "Turn off" : "Activate"}
                </button>
              </div>
            </div>

            {/* 2. GENERAL ETA MESSAGE (VISUAL EDITOR) */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
               <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                  <div className="space-y-1">
                    <h2 className="text-base font-bold text-gray-800">Visual Experience</h2>
                    <p className="text-xs text-gray-400">Preview and modify your current storefront delivery message.</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button 
                      onClick={() => navigate('/app/templates')}
                      className="inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-transparent bg-gray-50 px-3 text-xs font-bold text-gray-700 transition-all hover:border-gray-200 hover:bg-gray-100"
                    >
                      <div className="w-4 h-4 text-gray-400"><Icon source={WandIcon} /></div> Templates
                    </button>
                    <button 
                      onClick={() => {
                        const params = new URLSearchParams();
                        if (templateApplied) params.set("saveAsDesign", "1");
                        if (sourceDesignId) params.set("sourceDesignId", sourceDesignId);
                        const query = params.toString();
                        navigate(`/app/widgets/${defaultWidget.id}${query ? `?${query}` : ""}`);
                      }}
                      className="inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-blue-600 px-3 text-xs font-bold text-white shadow-md shadow-blue-100 transition-all hover:bg-blue-700 active:scale-95"
                    >
                      <div className="w-4 h-4 text-white"><Icon source={EditIcon} /></div> Customize
                    </button>
                  </div>
               </div>

               {/* CANVAS */}
               <div className="p-6 bg-gray-50/50 flex-1">
                 <div className="border border-gray-100 rounded-2xl p-10 bg-white flex items-center justify-center relative overflow-hidden shadow-inner group min-h-[300px]">
                    <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1.5px,transparent_1.5px)] [background-size:24px_24px] opacity-20" />
                    <div className="w-full relative z-10 scale-[0.9] origin-center transition-transform">
                      <WidgetPreviewRenderer 
                          settings={{
                            ...defaultWidget,
                            style: "custom",
                            customBlocks: parseBlockConfigs(defaultWidget.customBlocks),
                            isActive: true
                          }} 
                        />
                    </div>
                    <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity">
                       <Badge tone="info">Live Preview Overlay</Badge>
                    </div>
                 </div>
               </div>
            </div>

            {/* 3. ETA OPTIONS */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-sm">
               <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-gray-800">Operational Logic</h2>
                  <Badge tone="info">Core Engine</Badge>
               </div>
               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                 {['Cut-off time', 'Holidays', 'Visibility', 'Timer', 'Language'].map(label => (
                   <button key={label} className="flex h-9 items-center justify-center rounded-xl border border-gray-100 bg-gray-50 px-3 text-center text-xs font-bold text-gray-600 transition-all hover:border-gray-300 hover:bg-white hover:shadow-sm active:scale-95">
                      {label}
                   </button>
                 ))}
               </div>
            </div>

            {/* 4. COLLAPSIBLE SECTIONS */}
            <div className="space-y-4">
               <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                  <BlockStack gap="400">
                     <InlineStack align="space-between" blockAlign="center">
                        <div className="space-y-1">
                           <h2 className="text-sm font-bold text-gray-800">Store Integration</h2>
                           <p className="text-xs text-gray-400">Position the widget on your product pages.</p>
                        </div>
                        <button 
                          onClick={() => window.open(themeEditorUrl, '_blank')}
                          className="inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-gray-900 px-3 text-xs font-bold text-white shadow-lg transition-all hover:bg-black"
                        >
                          <div className="w-4 h-4 text-white"><Icon source={ViewIcon} /></div> Open Theme Editor
                        </button>
                     </InlineStack>
                     <div className="p-4 bg-green-50 border border-green-100 rounded-xl">
                        <p className="text-[11px] text-green-800 leading-relaxed font-medium flex items-center gap-2">
                           <div className="w-4 h-4 text-green-600"><Icon source={PlusIcon} /></div>
                           <span><b>Tip:</b> After opening the editor, add the <b>"BP: Estimated Delivery"</b> block to your Product template.</span>
                        </p>
                     </div>
                  </BlockStack>
               </div>

               <CollapsibleCard title="ETA for additional pages" badge={<span className="bg-amber-100 text-amber-700 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ml-2">Upgrade</span>}>
                  <p className="text-xs text-gray-400">Unlock additional displays for Home, Collection, and Checkout pages.</p>
               </CollapsibleCard>

               <CollapsibleCard title="Vacation mode" badge={<span className="bg-amber-100 text-amber-700 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ml-2">Upgrade</span>}>
                  <p className="text-xs text-gray-400">Set a common holiday notice for all ETA rules.</p>
               </CollapsibleCard>
            </div>
        </div>

        {/* RIGHT COLUMN: PREVIEW SIDEBAR */}
        <div className="w-full lg:w-96 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm flex flex-col">
               <div className="p-5 border-b border-gray-50 flex items-center justify-between">
                  <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Context Preview</h2>
                  <div className="flex gap-1">
                     <div className="w-2 h-2 rounded-full bg-red-400 opacity-20" />
                     <div className="w-2 h-2 rounded-full bg-amber-400 opacity-20" />
                     <div className="w-2 h-2 rounded-full bg-green-400 opacity-20" />
                  </div>
               </div>

               <div className="p-6 bg-[#f8fafc] flex-1 flex flex-col gap-6">
                  {/* PRODUCT MOCKUP: SQUARE FASHION WITH ROUNDED CORNERS */}
                  <div className="aspect-square relative overflow-hidden group w-full rounded-2xl shadow-sm border border-gray-100">
                     <div className="absolute top-4 left-4 z-10">
                        <Badge tone="attention">New Arrival</Badge>
                     </div>
                     <img 
                        src="/fashion-sample.png" 
                        alt="Fashion Sample" 
                        className="w-full h-full object-cover transition-transform duration-500" 
                     />
                  </div>

                  <div className="space-y-4">
                     <div className="space-y-2">
                        <div className="h-4 w-3/4 bg-gray-200 rounded-full animate-pulse" />
                        <div className="h-3 w-1/2 bg-gray-100 rounded-full animate-pulse" />
                     </div>

                     <button className="flex h-9 w-full items-center justify-center rounded-xl bg-gray-900 px-3 text-xs font-bold text-white shadow-lg shadow-gray-200 transition-all active:scale-95">
                        Buy Now • $129.00
                     </button>

                     <div className="w-full pointer-events-none">
                        <WidgetPreviewRenderer 
                            settings={{
                              ...defaultWidget,
                              style: 'moment_meter' as any,
                              customBlocks: parseBlockConfigs(defaultWidget.customBlocks),
                              isActive: true
                            }} 
                           />
                     </div>
                  </div>
               </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl p-6 text-white shadow-xl shadow-blue-100 relative overflow-hidden group">
               <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white opacity-5 rounded-full group-hover:scale-150 transition-transform duration-700" />
               <h3 className="text-sm font-bold mb-2 flex items-center gap-2">
                  <div className="w-4 h-4 text-blue-200"><Icon source={QuestionCircleIcon} /></div> Need support?
               </h3>
               <p className="text-[11px] text-blue-100 mb-4 leading-relaxed opacity-80">Our experts can help you with custom styling and shipping logic.</p>
               <button className="flex h-9 w-full items-center justify-center rounded-xl border border-white/20 bg-white/10 px-3 text-xs font-bold text-white transition-all hover:bg-white/20">
                  Chat with Designer
               </button>
            </div>
        </div>
      </div>
      </div>
    </div>
  );
}
