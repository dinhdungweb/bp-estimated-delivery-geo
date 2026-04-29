/**
 * BP: Estimated Delivery & Geo - Widget Template Gallery
 * Copyright (c) 2025 BluePeaks. All rights reserved.
 */
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import type { Prisma } from "@prisma/client";
import {
  data as routerData,
  redirect,
  useActionData,
  useLoaderData,
  useNavigate,
  useNavigation,
  useSubmit,
} from "react-router";
import { useMemo, useState } from "react";
import { WidgetPreviewRenderer } from "../components/WidgetRenderer";
import { TEMPLATE_DEFAULTS } from "../constants/templateDefaults";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import {
  buildFallbackBlocks,
  DEFAULT_SHIPPING_MESSAGE,
  type BlockConfig,
  type WidgetSettingsProps,
  type WidgetStyleId,
} from "../lib/delivery";

type TemplateId = Exclude<WidgetStyleId, "custom">;
type TemplateMainTab = "General" | "My design";
type TemplateCategory =
  | "Animated"
  | "Industry"
  | "Order process"
  | "Dark"
  | "Light"
  | "Informative"
  | "Seasonal";

type TemplateMeta = {
  name: string;
  description: string;
  style: TemplateId;
  category: TemplateCategory;
  productImage?: string;
  discount: string;
  badgeTone: "green" | "red" | "blue" | "amber" | "slate" | "pink" | "cyan";
};

type ActionResult = {
  error?: string;
};

type SavedWidget = {
  id: string;
  name: string;
  isDefault: boolean;
  isActive: boolean;
  widgetStyle: string;
  customBlocks: unknown;
  textColor: string;
  iconColor: string;
  bgColor: string;
  borderColor: string;
  borderRadius: number;
  shadow: string | null;
  glassmorphism: boolean | null;
  padding: number | null;
  bgGradient: string | null;
  showTimeline: boolean;
  policyText: string | null;
  headerText: string | null;
  subHeaderText: string | null;
  step1Label: string | null;
  step1SubText: string | null;
  step1Icon: string | null;
  step2Label: string | null;
  step2SubText: string | null;
  step2Icon: string | null;
  step3Label: string | null;
  step3SubText: string | null;
  step3Icon: string | null;
  updatedAt: string;
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const widgets = await prisma.widget.findMany({
    where: { shop: session.shop, isDefault: false },
    orderBy: [{ updatedAt: "desc" }],
    select: {
      id: true,
      name: true,
      isDefault: true,
      isActive: true,
      widgetStyle: true,
      customBlocks: true,
      textColor: true,
      iconColor: true,
      bgColor: true,
      borderColor: true,
      borderRadius: true,
      shadow: true,
      glassmorphism: true,
      padding: true,
      bgGradient: true,
      showTimeline: true,
      policyText: true,
      headerText: true,
      subHeaderText: true,
      step1Label: true,
      step1SubText: true,
      step1Icon: true,
      step2Label: true,
      step2SubText: true,
      step2Icon: true,
      step3Label: true,
      step3SubText: true,
      step3Icon: true,
      updatedAt: true,
    },
  });

  return routerData({
    widgets: widgets.map((widget) => ({
      ...widget,
      updatedAt: widget.updatedAt.toISOString(),
    })),
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = String(formData.get("intent") || "template");
  const templateId = String(formData.get("templateId") || "");
  const widgetId = String(formData.get("widgetId") || "");

  if (intent === "create-design") {
    const widget = await prisma.widget.create({
      data: {
        shop: session.shop,
        name: "New Design",
        isDefault: false,
        isActive: true,
        padding: 16,
        customBlocks: buildFallbackBlocks(
          {},
          DEFAULT_SHIPPING_MESSAGE,
        ) as unknown as Prisma.InputJsonValue,
      },
    });

    return redirect(`/app/widgets/${widget.id}`);
  }

  if (intent === "saved-design") {
    if (!widgetId) {
      return routerData({ error: "Invalid design" }, { status: 400 });
    }

    const sourceWidget = await prisma.widget.findFirst({
      where: { id: widgetId, shop: session.shop },
    });

    if (!sourceWidget) {
      return routerData({ error: "Design not found" }, { status: 404 });
    }

    const defaultWidget = await prisma.widget.findFirst({
      where: { shop: session.shop, isDefault: true },
    });

    const widgetData = {
      widgetStyle: "custom",
      customBlocks: sourceWidget.customBlocks as Prisma.InputJsonValue,
      textColor: sourceWidget.textColor,
      iconColor: sourceWidget.iconColor,
      bgColor: sourceWidget.bgColor,
      borderColor: sourceWidget.borderColor,
      borderRadius: sourceWidget.borderRadius,
      shadow: sourceWidget.shadow,
      glassmorphism: sourceWidget.glassmorphism,
      padding: sourceWidget.padding,
      bgGradient: sourceWidget.bgGradient,
      showTimeline: sourceWidget.showTimeline,
      policyText: sourceWidget.policyText,
      headerText: sourceWidget.headerText,
      subHeaderText: sourceWidget.subHeaderText,
      step1Label: sourceWidget.step1Label,
      step1SubText: sourceWidget.step1SubText,
      step1Icon: sourceWidget.step1Icon,
      step2Label: sourceWidget.step2Label,
      step2SubText: sourceWidget.step2SubText,
      step2Icon: sourceWidget.step2Icon,
      step3Label: sourceWidget.step3Label,
      step3SubText: sourceWidget.step3SubText,
      step3Icon: sourceWidget.step3Icon,
      updatedAt: new Date(),
    };

    if (defaultWidget) {
      await prisma.widget.update({
        where: { id: defaultWidget.id },
        data: widgetData,
      });
    } else {
      await prisma.widget.create({
        data: {
          shop: session.shop,
          name: "Main Widget",
          isDefault: true,
          isActive: true,
          ...widgetData,
        },
      });
    }

    return redirect(`/app/settings?sourceDesignId=${encodeURIComponent(sourceWidget.id)}`);
  }

  if (!templateId || !TEMPLATE_DEFAULTS[templateId]) {
    return routerData({ error: "Invalid template" }, { status: 400 });
  }

  const def = TEMPLATE_DEFAULTS[templateId];
  const defaultWidget = await prisma.widget.findFirst({
    where: { shop: session.shop, isDefault: true },
  });

  const widgetData = {
    widgetStyle: "custom",
    customBlocks: def.customBlocks as unknown as Prisma.InputJsonValue,
    textColor: def.textColor || "#000000",
    iconColor: def.iconColor || "#0033cc",
    bgColor: def.bgColor || "#ffffff",
    borderColor: def.borderColor || "#e5e7eb",
    borderRadius: def.borderRadius || 10,
    shadow: def.shadow || "none",
    glassmorphism: def.glassmorphism || false,
    padding: def.padding ?? 16,
    bgGradient: def.bgGradient || "",
    updatedAt: new Date(),
  };

  if (defaultWidget) {
    await prisma.widget.update({
      where: { id: defaultWidget.id },
      data: widgetData,
    });
  } else {
    await prisma.widget.create({
      data: {
        shop: session.shop,
        name: "Main Widget",
        isDefault: true,
        isActive: true,
        ...widgetData,
      },
    });
  }

  return redirect("/app/settings?templateApplied=1");
};

const CATEGORIES: TemplateCategory[] = [
  "Animated",
  "Industry",
  "Order process",
  "Dark",
  "Light",
  "Informative",
  "Seasonal",
];

const MAIN_TABS: TemplateMainTab[] = ["General", "My design"];

const WIDGET_TEMPLATES: TemplateMeta[] = [
  {
    name: "Flash Sale Timer",
    description: "Countdown-first layout for urgent campaigns.",
    style: "animated_flash_sale",
    category: "Animated",
    discount: "72% off",
    badgeTone: "red",
  },
  {
    name: "Soft Pulse Tracker",
    description: "Animated progress with a calm delivery estimate.",
    style: "animated_soft_pulse",
    category: "Animated",
    discount: "64% off",
    badgeTone: "blue",
  },
  {
    name: "Urgent Pulse",
    description: "Red countdown timeline for limited-time shipping.",
    style: "urgent_pulse",
    category: "Animated",
    discount: "74% off",
    badgeTone: "red",
  },
  {
    name: "Red Moment Meter",
    description: "A bold urgency meter with dotted progress.",
    style: "red_moment_meter",
    category: "Animated",
    discount: "58% off",
    badgeTone: "red",
  },
  {
    name: "Yellow Progress",
    description: "Bright progress bar for animated visual movement.",
    style: "yellow_progress",
    category: "Animated",
    discount: "68% off",
    badgeTone: "amber",
  },
  {
    name: "Boutique ETA",
    description: "Fashion-focused delivery block with soft rose tones.",
    style: "fashion_boutique_eta",
    category: "Industry",
    productImage: "/fashion-sample.png",
    discount: "47% off",
    badgeTone: "pink",
  },
  {
    name: "Furniture Delivery",
    description: "Room-ready timeline for large item delivery.",
    style: "furniture_room_delivery",
    category: "Industry",
    discount: "55% off",
    badgeTone: "amber",
  },
  {
    name: "Electronics Express",
    description: "Fast dispatch lane for tech and gadgets.",
    style: "electronics_express_lane",
    category: "Industry",
    discount: "62% off",
    badgeTone: "cyan",
  },
  {
    name: "Beauty Care",
    description: "Warm care-focused template for cosmetics.",
    style: "beauty_care_delivery",
    category: "Industry",
    productImage: "/fashion-sample.png",
    discount: "51% off",
    badgeTone: "pink",
  },
  {
    name: "Eco Delivery",
    description: "Eco-friendly split segment delivery flow.",
    style: "eco_delivery",
    category: "Industry",
    discount: "73% off",
    badgeTone: "green",
  },
  {
    name: "Compact Tracker",
    description: "Dense order process for product pages with less space.",
    style: "process_compact_tracker",
    category: "Order process",
    discount: "48% off",
    badgeTone: "green",
  },
  {
    name: "Vertical Story",
    description: "Step-by-step journey with a vertical process.",
    style: "process_vertical_story",
    category: "Order process",
    discount: "59% off",
    badgeTone: "blue",
  },
  {
    name: "Simple Timeline",
    description: "Clean three-step delivery timeline.",
    style: "simple_timeline",
    category: "Order process",
    discount: "47% off",
    badgeTone: "amber",
  },
  {
    name: "Blue Boxed Cards",
    description: "Structured boxed steps with blue accents.",
    style: "boxed_cards_blue",
    category: "Order process",
    discount: "61% off",
    badgeTone: "blue",
  },
  {
    name: "Dual Cards",
    description: "Online and in-store delivery information cards.",
    style: "dual_cards",
    category: "Order process",
    discount: "52% off",
    badgeTone: "cyan",
  },
  {
    name: "Dark Luxury",
    description: "Premium dark delivery tracker for luxury stores.",
    style: "dark_luxury_tracker",
    category: "Dark",
    discount: "49% off",
    badgeTone: "amber",
  },
  {
    name: "Neon Route",
    description: "Dark neon route with countdown urgency.",
    style: "dark_neon_route",
    category: "Dark",
    discount: "56% off",
    badgeTone: "cyan",
  },
  {
    name: "Dark Glassmorphism",
    description: "Frosted dark widget with premium cards.",
    style: "dark_glassmorphism",
    category: "Dark",
    discount: "53% off",
    badgeTone: "slate",
  },
  {
    name: "Dark Urgency",
    description: "Dark sale message with shipping timeline.",
    style: "dark_urgency",
    category: "Dark",
    discount: "45% off",
    badgeTone: "red",
  },
  {
    name: "Clean ETA",
    description: "Minimal light template for quiet storefronts.",
    style: "light_clean_eta",
    category: "Light",
    discount: "44% off",
    badgeTone: "slate",
  },
  {
    name: "Light Card Steps",
    description: "Neutral card layout with soft contrast.",
    style: "light_card_steps",
    category: "Light",
    discount: "46% off",
    badgeTone: "slate",
  },
  {
    name: "Minimal Cart",
    description: "Simple cart, truck, and doorstep timeline.",
    style: "minimal_cart_truck",
    category: "Light",
    discount: "42% off",
    badgeTone: "slate",
  },
  {
    name: "Blue Boxed Steps",
    description: "Light blue structure for clear delivery dates.",
    style: "blue_boxed_steps",
    category: "Light",
    discount: "57% off",
    badgeTone: "blue",
  },
  {
    name: "Geo Trust",
    description: "Country-aware shipping promise and trust cards.",
    style: "informative_geo_trust",
    category: "Informative",
    discount: "39% off",
    badgeTone: "cyan",
  },
  {
    name: "Dispatch Stack",
    description: "Informational delivery details in a stacked layout.",
    style: "informative_dispatch_stack",
    category: "Informative",
    discount: "41% off",
    badgeTone: "blue",
  },
  {
    name: "Trust Info List",
    description: "Delivery facts with multiple trust signals.",
    style: "trust_info_list",
    category: "Informative",
    discount: "43% off",
    badgeTone: "amber",
  },
  {
    name: "Global Trust",
    description: "International shipping message with location context.",
    style: "global_trust",
    category: "Informative",
    discount: "50% off",
    badgeTone: "blue",
  },
  {
    name: "Holiday Gift",
    description: "Seasonal delivery window for gift campaigns.",
    style: "seasonal_holiday_gift",
    category: "Seasonal",
    discount: "69% off",
    badgeTone: "red",
  },
  {
    name: "Summer Fresh",
    description: "Bright seasonal template with fresh delivery energy.",
    style: "seasonal_summer_fresh",
    category: "Seasonal",
    discount: "63% off",
    badgeTone: "green",
  },
  {
    name: "Orange Blitz",
    description: "Bold free and fast delivery campaign block.",
    style: "orange_blitz",
    category: "Seasonal",
    discount: "54% off",
    badgeTone: "amber",
  },
  {
    name: "Green Order Now",
    description: "Green seasonal message for conversion pushes.",
    style: "green_order_now",
    category: "Seasonal",
    discount: "73% off",
    badgeTone: "green",
  },
];

function TemplateCard({
  template,
  isSubmitting,
  onUseTemplate,
}: {
  template: TemplateMeta;
  isSubmitting: boolean;
  onUseTemplate: (template: TemplateMeta) => void;
}) {
  const settings = TEMPLATE_DEFAULTS[template.style];

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="p-4">
        <div className="rounded-xl bg-gray-50 p-2">
          <WidgetPreviewRenderer settings={{ ...settings, shadow: "none" }} />
        </div>
      </div>

      <div className="mt-auto border-t border-gray-100 p-4">
        <div className="mb-3 min-h-[58px]">
          <h3 className="text-sm font-bold text-gray-950">{template.name}</h3>
          <p className="mt-1 text-xs leading-5 text-gray-500">{template.description}</p>
        </div>
        <button
          type="button"
          onClick={() => onUseTemplate(template)}
          disabled={isSubmitting}
          className="flex h-9 w-full items-center justify-center rounded-xl bg-gray-900 px-3 text-xs font-bold text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Applying..." : "Use template"}
        </button>
      </div>
    </article>
  );
}

function widgetPreviewSettings(widget: SavedWidget): WidgetSettingsProps {
  return {
    style: "custom",
    widgetStyle: widget.widgetStyle || "custom",
    customBlocks: Array.isArray(widget.customBlocks)
      ? (widget.customBlocks as BlockConfig[])
      : undefined,
    headerText: widget.headerText,
    subHeaderText: widget.subHeaderText,
    step1Label: widget.step1Label,
    step1SubText: widget.step1SubText,
    step1Icon: widget.step1Icon,
    step2Label: widget.step2Label,
    step2SubText: widget.step2SubText,
    step2Icon: widget.step2Icon,
    step3Label: widget.step3Label,
    step3SubText: widget.step3SubText,
    step3Icon: widget.step3Icon,
    textColor: widget.textColor || "#000000",
    iconColor: widget.iconColor || "#0033cc",
    bgColor: widget.bgColor || "#ffffff",
    borderColor: widget.borderColor || "#e5e7eb",
    borderRadius: widget.borderRadius ?? 10,
    shadow: widget.shadow || "none",
    glassmorphism: widget.glassmorphism,
    padding: widget.padding,
    bgGradient: widget.bgGradient,
    showTimeline: widget.showTimeline,
    policyText: widget.policyText,
  };
}

function MyDesignCard({
  widget,
  isSubmitting,
  onCustomize,
  onUseDesign,
}: {
  widget: SavedWidget;
  isSubmitting: boolean;
  onCustomize: (widgetId: string) => void;
  onUseDesign: (widget: SavedWidget) => void;
}) {
  const settings = widgetPreviewSettings(widget);
  const updatedAt = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(widget.updatedAt));

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="p-4">
        <div className="rounded-xl bg-gray-50 p-2">
          <WidgetPreviewRenderer settings={{ ...settings, shadow: "none" }} />
        </div>
      </div>

      <div className="mt-auto border-t border-gray-100 p-4">
        <div className="mb-3 min-h-[70px]">
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            {widget.isDefault && (
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                Default
              </span>
            )}
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                widget.isActive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
              }`}
            >
              {widget.isActive ? "Active" : "Disabled"}
            </span>
          </div>
          <h3 className="text-sm font-bold text-gray-950">{widget.name}</h3>
          <p className="mt-1 text-xs leading-5 text-gray-500">Updated {updatedAt}</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onUseDesign(widget)}
            disabled={isSubmitting}
            className="flex h-9 w-full items-center justify-center rounded-xl bg-gray-900 px-3 text-xs font-bold text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Applying..." : "Use design"}
          </button>
          <button
            type="button"
            onClick={() => onCustomize(widget.id)}
            disabled={isSubmitting}
            className="flex h-9 w-full items-center justify-center rounded-xl border border-gray-200 bg-white px-3 text-xs font-bold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Customize
          </button>
        </div>
      </div>
    </article>
  );
}

function NewDesignCard({
  isSubmitting,
  onCreate,
}: {
  isSubmitting: boolean;
  onCreate: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onCreate}
      disabled={isSubmitting}
      className="flex min-h-[360px] h-full flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-center shadow-sm transition-all hover:border-gray-900 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-3xl font-light leading-none text-gray-900">
        +
      </span>
      <span className="mt-4 text-sm font-bold text-gray-950">
        {isSubmitting ? "Creating..." : "Create new design"}
      </span>
      <span className="mt-2 max-w-[220px] text-xs leading-5 text-gray-500">
        Start from a blank delivery widget and customize it in the editor.
      </span>
    </button>
  );
}

export default function TemplateBuilder() {
  const { widgets } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const submit = useSubmit();
  const navigation = useNavigation();
  const actionData = useActionData() as ActionResult | undefined;
  const [activeMainTab, setActiveMainTab] = useState<TemplateMainTab>("General");
  const [activeCategory, setActiveCategory] = useState<TemplateCategory>("Animated");
  const [pendingStyle, setPendingStyle] = useState<TemplateId | null>(null);

  const visibleTemplates = useMemo(
    () => WIDGET_TEMPLATES.filter((template) => template.category === activeCategory),
    [activeCategory],
  );

  const handleUseTemplate = (template: TemplateMeta) => {
    setPendingStyle(template.style);
    submit(
      { templateId: template.style, templateName: template.name },
      { method: "post" },
    );
  };

  const handleUseSavedDesign = (widget: SavedWidget) => {
    setPendingStyle(null);
    submit(
      { intent: "saved-design", widgetId: widget.id, widgetName: widget.name },
      { method: "post" },
    );
  };

  const handleCreateDesign = () => {
    setPendingStyle(null);
    submit({ intent: "create-design" }, { method: "post" });
  };

  const isSubmitting = navigation.state === "submitting";
  const isCreatingDesign = isSubmitting && navigation.formData?.get("intent") === "create-design";

  return (
    <div className="min-h-screen bg-[#f6f6f7] p-4 font-sans md:p-6">
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-gray-950">Widget Templates</h1>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-blue-500" />
              <p className="text-sm text-gray-500">
                Pick a ready-made delivery design and apply it to your default storefront widget.
              </p>
            </div>
          </div>
          <div className="inline-flex h-9 items-center justify-center rounded-xl border border-gray-200 bg-white px-3 text-xs font-bold text-gray-500 shadow-sm">
            {activeMainTab === "General"
              ? `${WIDGET_TEMPLATES.length} templates`
              : `${widgets.length} designs`}
          </div>
        </div>

        {actionData?.error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 shadow-sm">
            {actionData.error}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="grid grid-cols-2 border-b border-gray-200">
            {MAIN_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveMainTab(tab)}
                className={`relative flex h-12 items-center justify-center text-sm font-bold transition-colors ${
                  activeMainTab === tab
                    ? "text-gray-950"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-950"
                }`}
              >
                {tab}
                {activeMainTab === tab && (
                  <span className="absolute -bottom-px left-1 right-1 h-0.5 rounded-full bg-gray-900" />
                )}
              </button>
            ))}
          </div>

          {activeMainTab === "General" && (
            <div className="overflow-x-auto px-3 py-4">
              <div className="flex min-w-max gap-2">
                {CATEGORIES.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setActiveCategory(category)}
                    className={`inline-flex h-9 items-center justify-center rounded-xl px-3 text-xs font-bold transition-colors ${
                      activeCategory === category
                        ? "bg-gray-100 text-gray-950 shadow-sm"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-950"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {activeMainTab === "General" ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleTemplates.map((template) => (
              <TemplateCard
                key={template.style}
                template={template}
                isSubmitting={isSubmitting && pendingStyle === template.style}
                onUseTemplate={handleUseTemplate}
              />
            ))}
          </div>
        ) : widgets.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <NewDesignCard isSubmitting={isCreatingDesign} onCreate={handleCreateDesign} />
            {widgets.map((widget) => (
              <MyDesignCard
                key={widget.id}
                widget={widget}
                isSubmitting={isSubmitting && navigation.formData?.get("widgetId") === widget.id}
                onCustomize={(widgetId) => navigate(`/app/widgets/${widgetId}`)}
                onUseDesign={handleUseSavedDesign}
              />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <NewDesignCard isSubmitting={isCreatingDesign} onCreate={handleCreateDesign} />
          </div>
        )}
      </div>
    </div>
  );
}
