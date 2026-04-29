import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigate } from "react-router";
import { 
  Text, 
  BlockStack, 
  Icon,
  Badge,
} from "@shopify/polaris";
import { 
  ChevronRightIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  SettingsIcon,
  CircleChevronRightIcon,
  PlusIcon,
  LayoutColumns2Icon,
  ChatIcon,
  CalendarIcon
} from "@shopify/polaris-icons";
import { useEffect, useState } from "react";
import { authenticate, apiVersion } from "../shopify.server";
import prisma from "../db.server";

type AdminGraphqlClient = {
  graphql: (
    query: string,
    options?: { variables?: Record<string, unknown> },
  ) => Promise<Response>;
};

type ShopifyReviewResponse = {
  success: boolean;
  code: string;
  message: string;
};

type ShopifyAdminGlobal = {
  reviews?: {
    request?: () => Promise<ShopifyReviewResponse>;
  };
  toast?: {
    show?: (message: string, options?: { isError?: boolean }) => void;
  };
};

type ThemeEmbedStatus = "enabled" | "disabled" | "unknown";

type ThemeEmbedCheck = {
  status: ThemeEmbedStatus;
  reason?: string;
};

type ThemeBlock = {
  type?: unknown;
  disabled?: unknown;
};

const APP_EMBED_TYPE_HINTS = [
  "bp-estimated-delivery",
  "bp-delivery",
  "estimated-delivery",
];

function restThemeIdFromGraphqlId(themeId: string) {
  return themeId.match(/(\d+)$/)?.[1] || "";
}

function isOwnAppEmbedBlock(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const block = value as ThemeBlock;
  const type = typeof block.type === "string" ? block.type.toLowerCase() : "";
  if (!type) return false;
  const looksLikeThisApp = APP_EMBED_TYPE_HINTS.some((hint) => type.includes(hint));
  const looksLikeEmbedBlock = type.includes("/blocks/app-embed/") || type.includes("app-embed");
  return looksLikeThisApp && looksLikeEmbedBlock && block.disabled !== true;
}

async function requestShopifyReviewModal() {
  const shopify = (window as Window & { shopify?: ShopifyAdminGlobal }).shopify;
  if (!shopify?.reviews?.request) {
    shopify?.toast?.show?.("Shopify review prompt is not available yet.", { isError: true });
    return;
  }

  try {
    const result = await shopify.reviews.request();
    if (!result.success) {
      shopify.toast?.show?.(result.message || "Shopify review prompt is not available right now.");
    }
  } catch {
    shopify.toast?.show?.("Could not open Shopify review prompt right now.", { isError: true });
  }
}

async function getThemeEmbedStatus(
  admin: AdminGraphqlClient,
  shop: string,
  accessToken: string,
): Promise<ThemeEmbedCheck> {
  try {
    if (!accessToken) {
      return { status: "unknown", reason: "missing_access_token" };
    }

    const themeResponse = await admin.graphql(`#graphql
      query MainThemeForAppEmbedCheck {
        themes(first: 1, roles: [MAIN]) {
          nodes {
            id
          }
        }
      }
    `);
    const themePayload = (await themeResponse.json()) as {
      errors?: Array<{ message?: string; extensions?: { code?: string } }>;
      data?: { themes?: { nodes?: Array<{ id?: string }> } };
    };

    if (themePayload.errors?.length) {
      const accessDenied = themePayload.errors.some(
        (error) => error.extensions?.code === "ACCESS_DENIED",
      );
      return {
        status: "unknown",
        reason: accessDenied ? "missing_read_themes_scope" : "theme_query_failed",
      };
    }

    const themeId = restThemeIdFromGraphqlId(themePayload.data?.themes?.nodes?.[0]?.id || "");
    if (!themeId) {
      return { status: "unknown", reason: "main_theme_not_found" };
    }

    const assetUrl = new URL(
      `https://${shop}/admin/api/${apiVersion}/themes/${themeId}/assets.json`,
    );
    assetUrl.searchParams.set("asset[key]", "config/settings_data.json");
    assetUrl.searchParams.set("fields", "value");

    const assetResponse = await fetch(assetUrl, {
      headers: {
        Accept: "application/json",
        "X-Shopify-Access-Token": accessToken,
      },
    });

    if (!assetResponse.ok) {
      return {
        status: "unknown",
        reason: assetResponse.status === 403 ? "missing_read_themes_scope" : "theme_asset_failed",
      };
    }

    const assetPayload = (await assetResponse.json()) as {
      asset?: { value?: string };
    };
    const rawSettings = assetPayload.asset?.value;
    if (!rawSettings) {
      return { status: "unknown", reason: "settings_data_missing" };
    }

    const settings = JSON.parse(rawSettings) as {
      current?: { blocks?: Record<string, unknown> };
    };
    const blocks = settings.current?.blocks || {};
    return {
      status: Object.values(blocks).some(isOwnAppEmbedBlock) ? "enabled" : "disabled",
    };
  } catch {
    return { status: "unknown", reason: "theme_check_failed" };
  }
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  const shop = session.shop;

  const [widget, totalRules, appSetting, themeEmbedCheck] = await Promise.all([
    prisma.widget.findFirst({ where: { shop, isDefault: true } }),
    prisma.deliveryRule.count({ where: { shop } }),
    prisma.appSetting.findUnique({ where: { shop } }),
    getThemeEmbedStatus(admin, shop, session.accessToken || ""),
  ]);

  return {
    shop,
    widget,
    totalRules,
    isEnabled: appSetting?.isEnabled ?? false,
    appSetting,
    themeEmbedStatus: themeEmbedCheck.status,
    themeEmbedCheckReason: themeEmbedCheck.reason || null,
  };
};

export default function DashboardHome() {
  const { shop, widget, totalRules, isEnabled, themeEmbedStatus, themeEmbedCheckReason } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [expandedStep, setExpandedStep] = useState<number | null>(0);
  const etaConfirmationKey = `bp-eta-confirmed:${shop}`;
  const [etaConfirmed, setEtaConfirmed] = useState(false);

  useEffect(() => {
    setEtaConfirmed(window.localStorage.getItem(etaConfirmationKey) === "true");
  }, [etaConfirmationKey]);

  const handleEtaConfirmed = () => {
    setEtaConfirmed(true);
    window.localStorage.setItem(etaConfirmationKey, "true");
    void requestShopifyReviewModal();
  };

  const steps = [
    {
      id: 0,
      title: "Enable theme app embed block",
      desc: "To start using the app, please enable app embedding by following the steps below.",
      instructions: [
        'Click "Enable embed app" below.',
        'Find and enable "BP: Estimated Delivery" in the theme customizer.',
        'Click "Save", then return here and refresh the app page.'
      ],
      buttonText: themeEmbedStatus === "enabled" ? "Review theme" : "Enable embed app",
      action: () => window.open(`https://admin.shopify.com/store/${shop.split('.')[0]}/themes/current/editor?context=apps`, '_blank'),
      completed: themeEmbedStatus === "enabled",
      statusNote:
        themeEmbedStatus === "unknown"
          ? `Could not verify theme embed automatically (${themeEmbedCheckReason || "unknown"}). Make sure read_themes is granted and re-authorize the app.`
          : themeEmbedStatus === "disabled"
            ? "Theme embed is not enabled in the main theme yet."
            : "Theme embed is enabled in the main theme."
    },
    {
      id: 1,
      title: "Activate app",
      desc: "Turn on the main switch to allow the widget to appear on your store.",
      buttonText: "Go to Settings",
      action: () => navigate("/app/settings"),
      completed: isEnabled
    },
    {
      id: 2,
      title: "Use template to show ETA message",
      desc: "Select a professional design for your delivery estimation widget.",
      buttonText: "Browse Templates",
      action: () => navigate("/app/templates"),
      completed: !!widget?.widgetStyle
    },
    {
      id: 3,
      title: "Confirm ETA Display",
      desc: "Check your product page to ensure everything looks perfect.",
      buttonText: "Yay, It's working 😊",
      action: () => window.open(`https://${shop}`, '_blank'),
      completed: etaConfirmed
    }
  ];

  const completedCount = steps.filter(s => s.completed).length;
  const themeEmbedBadgeTone =
    themeEmbedStatus === "enabled" ? "success" : themeEmbedStatus === "disabled" ? "critical" : "attention";
  const themeEmbedLabel =
    themeEmbedStatus === "enabled" ? "Enabled" : themeEmbedStatus === "disabled" ? "Off" : "Needs scope";
  const themeEmbedDescription =
    themeEmbedStatus === "enabled"
      ? "App embed is enabled in the main theme."
      : themeEmbedStatus === "disabled"
        ? "App embed is not enabled in the main theme."
        : "Theme embed status could not be verified.";

  return (
    <div className="min-h-screen bg-[#f6f6f7] p-4 font-sans md:p-6">
      <div className="mx-auto max-w-6xl space-y-4">
        {/* HEADER */}
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
           <div className="space-y-1">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Onboarding Dashboard</h1>
              <div className="flex items-center gap-2">
                 <span className={`flex h-2 w-2 rounded-full ${isEnabled ? 'bg-green-500 animate-pulse' : 'bg-amber-500 animate-none'}`}></span>
                 <Text variant="bodySm" tone="subdued" as="p">{isEnabled ? "Widget is active on storefront" : "Action required to go live"}</Text>
              </div>
           </div>
           <div className="flex flex-wrap items-center gap-3">
              <button 
                type="button"
                onClick={() => navigate("/app/settings")}
                className="inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-gray-200 bg-white px-3 text-xs font-bold text-gray-900 shadow-sm transition-all hover:border-gray-900"
              >
                <div className="w-4 h-4 text-gray-500"><Icon source={SettingsIcon} /></div> Settings
              </button>
              <button 
                type="button"
                onClick={() => navigate("/app/rules")}
                className="inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-gray-900 px-3 text-xs font-bold text-white shadow-md transition-all hover:bg-black"
              >
                <div className="w-4 h-4 text-white"><Icon source={PlusIcon} /></div> New Rule
              </button>
           </div>
        </div>

        <BlockStack gap="600">
          
          {/* SETUP GUIDE SECTION */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-gray-50 bg-[#fafafa] relative overflow-hidden">
               <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1.5px,transparent_1.5px)] [background-size:24px_24px] opacity-10" />
               <BlockStack gap="400">
                  <div className="relative z-10 space-y-4">
                    <div className="flex items-center justify-between">
                       <div className="space-y-1">
                          <h2 className="text-base font-bold text-gray-800">Setup Guide</h2>
                          <p className="text-xs text-gray-400">Get started with the app in just a few simple steps!</p>
                       </div>
                       <Badge tone="info">{`${completedCount} / ${steps.length} Tasks`}</Badge>
                    </div>
                    
                    <div className="space-y-2">
                       <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          <span>Progress</span>
                          <span>{Math.round((completedCount / steps.length) * 100)}%</span>
                       </div>
                       <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                             className="h-full bg-blue-600 transition-all duration-1000" 
                             style={{ width: `${(completedCount / steps.length) * 100}%` }}
                          />
                       </div>
                    </div>
                  </div>
               </BlockStack>
            </div>

            <div className="divide-y divide-gray-50">
               {steps.map((step) => {
                 const isExpanded = expandedStep === step.id;
                 return (
                   <div key={step.id} className={`transition-all ${isExpanded ? 'bg-blue-50/30' : 'bg-white'}`}>
                     <button
                       type="button"
                       className="group flex w-full cursor-pointer items-center gap-4 p-5 text-left hover:bg-gray-50"
                       onClick={() => setExpandedStep(isExpanded ? null : step.id)}
                     >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${step.completed ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'}`}>
                           <div className="w-5 h-5">
                              <Icon source={step.completed ? CheckCircleIcon : CircleChevronRightIcon} />
                           </div>
                        </div>
                        <div className="flex-1">
                           <h3 className={`text-sm tracking-tight transition-all ${isExpanded ? 'font-bold text-gray-900' : 'font-semibold text-gray-600'}`}>{step.title}</h3>
                        </div>
                        <div className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                           <Icon source={ChevronDownIcon} />
                        </div>
                     </button>
                     
                     {isExpanded && (
                       <div className="px-16 pb-6 animate-in fade-in slide-in-from-top-2 duration-300">
                          <BlockStack gap="400">
                             {step.desc && (
                               <p className="max-w-lg text-xs leading-relaxed text-gray-500">{step.desc}</p>
                             )}
                             {step.statusNote && (
                               <p
                                 className={`max-w-lg rounded-xl border px-3 py-2 text-xs font-medium ${
                                   step.completed
                                     ? "border-green-100 bg-green-50 text-green-700"
                                     : themeEmbedStatus === "unknown"
                                       ? "border-amber-100 bg-amber-50 text-amber-700"
                                       : "border-gray-100 bg-gray-50 text-gray-600"
                                 }`}
                               >
                                 {step.statusNote}
                               </p>
                             )}
                             {step.instructions && (
                               <div className="space-y-2 p-4 bg-white border border-blue-50 rounded-xl shadow-sm">
                                 {step.instructions.map((inst, i) => (
                                   <div key={i} className="flex gap-3 items-start">
                                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                                      <p className="text-xs text-gray-600">{inst}</p>
                                   </div>
                                 ))}
                               </div>
                             )}
                             <div className="flex flex-wrap gap-2 pt-2">
                               {step.id === 3 ? (
                                 <>
                                   <button
                                     type="button"
                                     onClick={handleEtaConfirmed}
                                     className="inline-flex h-9 items-center justify-center rounded-xl bg-gray-900 px-3 text-xs font-bold text-white shadow-md transition-all hover:bg-black"
                                   >
                                     {step.buttonText}
                                   </button>
                                   <a
                                     href="mailto:support@bluepeaks.top"
                                     className="inline-flex h-9 items-center justify-center rounded-xl border border-gray-200 bg-white px-3 text-xs font-bold text-gray-700 shadow-sm transition-all hover:bg-gray-50"
                                   >
                                     Contact support
                                   </a>
                                 </>
                               ) : (
                                 <button
                                   type="button"
                                   onClick={() => step.action()}
                                   className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 text-xs font-bold text-white shadow-md shadow-blue-50 transition-all hover:bg-blue-700"
                                 >
                                   {step.buttonText}
                                   <span className="h-3.5 w-3.5"><Icon source={ChevronRightIcon} /></span>
                                 </button>
                               )}
                             </div>
                          </BlockStack>
                       </div>
                     )}
                   </div>
                 );
               })}
            </div>
          </div>          {/* SYSTEM STATUS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4 flex flex-col">
                <div className="flex items-center justify-between">
                   <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
                      <div className="w-6 h-6"><Icon source={CheckCircleIcon} /></div>
                   </div>
                    <Badge tone={themeEmbedBadgeTone}>{themeEmbedLabel}</Badge>
                 </div>
                 <div className="space-y-1 flex-1">
                    <h3 className="text-sm font-bold text-gray-800">Theme Embed</h3>
                    <p className="text-xs text-gray-400">{themeEmbedDescription}</p>
                 </div>
                 <button 
                  type="button"
                  onClick={() => window.open(`https://admin.shopify.com/store/${shop.split('.')[0]}/themes/current/editor?context=apps`, '_blank')}
                  className="flex h-9 w-full items-center justify-center rounded-xl border border-transparent bg-gray-50 px-3 text-xs font-bold text-gray-700 transition-all hover:border-gray-200 hover:bg-gray-100"
                >
                   Open Editor
                </button>
             </div>

             <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4 flex flex-col">
                <div className="flex items-center justify-between">
                   <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                      <div className="w-6 h-6"><Icon source={CalendarIcon} /></div>
                   </div>
                    <Badge tone="info">Theme block</Badge>
                </div>
                <div className="space-y-1 flex-1">
                   <h3 className="text-sm font-bold text-gray-800">Dynamic Blocks</h3>
                   <p className="text-xs text-gray-400">Position the widget anywhere on product pages.</p>
                </div>
                <button 
                  type="button"
                  onClick={() => window.open(`https://admin.shopify.com/store/${shop.split('.')[0]}/themes/current/editor?context=apps`, '_blank')}
                  className="flex h-9 w-full items-center justify-center rounded-xl border border-transparent bg-gray-50 px-3 text-xs font-bold text-gray-700 transition-all hover:border-gray-200 hover:bg-gray-100"
                >
                   Open Editor
                </button>
             </div>

             <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4 flex flex-col">
                <div className="flex items-center justify-between">
                   <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                      <div className="w-6 h-6"><Icon source={LayoutColumns2Icon} /></div>
                   </div>
                   <Badge tone="info">{`${totalRules} Rules`}</Badge>
                </div>
                <div className="space-y-1 flex-1">
                   <h3 className="text-sm font-bold text-gray-800">Delivery Rules</h3>
                   <p className="text-xs text-gray-400">Manage conditions for different regions/products.</p>
                </div>
                <button 
                   type="button"
                   onClick={() => navigate("/app/rules")}
                   className="flex h-9 w-full items-center justify-center rounded-xl bg-gray-900 px-3 text-xs font-bold text-white shadow-md transition-all hover:bg-black"
                >
                   View All Rules
                </button>
             </div>
          </div>
        </BlockStack>
      </div>
      
      {/* Footer support */}
      <div className="mx-auto mt-6 max-w-6xl space-y-3 border-t border-gray-100 py-6 text-center">
        <div className="space-y-0.5">
           <h3 className="text-sm font-bold text-gray-800">Direct Support</h3>
           <p className="text-xs text-gray-400">Our team is available to help you with custom setups.</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <a 
            href="mailto:support@bluepeaks.top" 
            className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-xs font-bold text-gray-600 shadow-sm transition-all hover:bg-gray-50"
          >
            <div className="w-3.5 h-3.5"><Icon source={ChatIcon} /></div> Email Support
          </a>
          <button
            type="button"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-green-100 bg-green-50 px-3 text-xs font-bold text-green-700 shadow-sm transition-all hover:bg-green-100"
          >
            <div className="w-3.5 h-3.5"><Icon source={ChatIcon} /></div> WhatsApp
          </button>
          <button
            type="button"
            onClick={() => void requestShopifyReviewModal()}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 text-xs font-bold text-red-600 transition-all hover:bg-red-100"
          >
             <div className="w-3.5 h-3.5"><Icon source={CheckCircleIcon} /></div> Leave a Review
          </button>
        </div>
        <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-gray-300">(c) 2025 BluePeaks - All Rights Reserved</p>
      </div>
    </div>
  );
}
