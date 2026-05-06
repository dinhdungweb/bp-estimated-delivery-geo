import type { BlockConfig, WidgetSettingsProps, WidgetStyleId } from "./delivery";

export type TemplateId = Exclude<WidgetStyleId, "custom">;
export type TemplateMainTab = "General" | "My design";
export type TemplateCategory =
  | "Animated"
  | "Industry"
  | "Order process"
  | "Dark"
  | "Light"
  | "Informative"
  | "Seasonal";

export type TemplateMeta = {
  name: string;
  description: string;
  style: TemplateId;
  category: TemplateCategory;
  productImage?: string;
  discount: string;
  badgeTone: "green" | "red" | "blue" | "amber" | "slate" | "pink" | "cyan";
};

export type SavedWidget = {
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

export const CATEGORIES: TemplateCategory[] = [
  "Animated",
  "Industry",
  "Order process",
  "Dark",
  "Light",
  "Informative",
  "Seasonal",
];

export const MAIN_TABS: TemplateMainTab[] = ["General", "My design"];

export const WIDGET_TEMPLATES: TemplateMeta[] = [
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

export function widgetPreviewSettings(widget: SavedWidget): WidgetSettingsProps {
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
