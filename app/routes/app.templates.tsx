/**
 * BP: Estimated Delivery & Geo - Widget Template Gallery
 * Copyright (c) 2025 BluePeaks. All rights reserved.
 */
import type { ActionFunctionArgs } from "react-router";
import type { Prisma } from "@prisma/client";
import {
  data as routerData,
  redirect,
  useActionData,
  useNavigation,
  useSubmit,
} from "react-router";
import { useMemo, useState } from "react";
import { WidgetPreviewRenderer } from "../components/WidgetRenderer";
import { TEMPLATE_DEFAULTS } from "../constants/templateDefaults";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import type { WidgetStyleId } from "../lib/delivery";

type TemplateId = Exclude<WidgetStyleId, "custom">;
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

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const templateId = String(formData.get("templateId") || "");

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

  return redirect("/app/settings");
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
    <article className="group flex h-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="p-4">
        <div className="rounded-lg bg-gray-50 p-2">
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
          className="w-full rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Applying..." : "Use template"}
        </button>
      </div>
    </article>
  );
}

export default function TemplateBuilder() {
  const submit = useSubmit();
  const navigation = useNavigation();
  const actionData = useActionData() as ActionResult | undefined;
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

  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="min-h-screen bg-[#f6f6f7] px-4 py-5 md:px-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-950">Widget Templates</h1>
            <p className="mt-1 text-sm text-gray-500">
              Pick a ready-made delivery design and apply it to your default storefront widget.
            </p>
          </div>
          <div className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-gray-500 shadow-sm ring-1 ring-gray-200">
            {WIDGET_TEMPLATES.length} templates
          </div>
        </div>

        {actionData?.error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {actionData.error}
          </div>
        )}

        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white p-2 shadow-sm">
          <div className="flex min-w-max gap-1">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={`rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
                  activeCategory === category
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-950"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

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
      </div>
    </div>
  );
}
