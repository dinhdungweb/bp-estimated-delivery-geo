import type { DeliveryRule, Prisma, Widget } from "@prisma/client";

export const ALL_COUNTRIES_CODE = "ALL";
export const LEGACY_ALL_COUNTRIES_CODE = "OTHER";
export const DEFAULT_LOCATION_PREFIX_TEXT = "Delivery to";
export const DEFAULT_LOCATION_ROW_ALIGNMENT = "right";

export type LocationRowAlignment = "left" | "center" | "right";

export function normalizeLocationPrefixText(value: unknown): string {
  const text = String(value ?? "").trim();
  return text ? text.slice(0, 80) : DEFAULT_LOCATION_PREFIX_TEXT;
}

export function normalizeLocationRowAlignment(value: unknown): LocationRowAlignment {
  return value === "left" || value === "center" || value === "right"
    ? value
    : DEFAULT_LOCATION_ROW_ALIGNMENT;
}

export function isAllCountriesCode(value: unknown): boolean {
  const country = String(value ?? "").trim().toUpperCase();
  return country === ALL_COUNTRIES_CODE || country === LEGACY_ALL_COUNTRIES_CODE;
}

export type WidgetStyleId =
  | "eco_delivery"
  | "urgent_pulse"
  | "express_alert"
  | "global_trust"
  | "orange_blitz"
  | "dark_glassmorphism"
  | "simple_timeline"
  | "boxed_cards_blue"
  | "estimate_shipping_period"
  | "minimal_cart_truck"
  | "dark_urgency"
  | "trust_info_list"
  | "vertical_yellow"
  | "vertical_orange"
  | "green_order_now"
  | "red_moment_meter"
  | "blue_gradient"
  | "blue_boxed_steps"
  | "yellow_progress"
  | "dual_cards"
  | "animated_flash_sale"
  | "animated_soft_pulse"
  | "fashion_boutique_eta"
  | "furniture_room_delivery"
  | "electronics_express_lane"
  | "beauty_care_delivery"
  | "process_compact_tracker"
  | "process_vertical_story"
  | "dark_luxury_tracker"
  | "dark_neon_route"
  | "light_clean_eta"
  | "light_card_steps"
  | "informative_geo_trust"
  | "informative_dispatch_stack"
  | "seasonal_holiday_gift"
  | "seasonal_summer_fresh"
  | "animated_countdown_priority"
  | "industry_premium_pack"
  | "process_split_fulfillment"
  | "dark_command_route"
  | "light_concierge_eta"
  | "informative_checkout_assurance"
  | "seasonal_sale_window"
  | "custom";

export type BlockType =
  | "header"
  | "steps"
  | "promise_card"
  | "timer"
  | "divider"
  | "policy"
  | "policy_accordion"
  | "spacer"
  | "banner"
  | "trust_badges"
  | "progress"
  | "html"
  | "image"
  | "dual_info";

export interface BlockConfig {
  id: string;
  type: BlockType;
  settings: Record<string, unknown>;
}

export interface StepItemConfig {
  id: string;
  label: string;
  subText: string;
  icon: string;
  bgColor?: string;
  dotColor?: string;
  iconColor?: string;
  labelColor?: string;
  subTextColor?: string;
  borderColor?: string;
}

export interface TrustBadgeConfig {
  id: string;
  icon: string;
  label: string;
  subText: string;
  bgColor?: string;
  borderColor?: string;
  iconColor?: string;
  labelColor?: string;
  subTextColor?: string;
}

export interface PolicyItemConfig {
  id: string;
  title: string;
  body: string;
  icon: string;
  bgColor?: string;
  borderColor?: string;
  iconColor?: string;
  titleColor?: string;
  bodyColor?: string;
}

export interface WidgetSettingsProps {
  style: WidgetStyleId;
  widgetStyle?: string;
  isActive?: boolean;
  customBlocks?: BlockConfig[];
  blocks?: BlockConfig[];
  headerText?: string | null;
  subHeaderText?: string | null;
  step1Label?: string | null;
  step1SubText?: string | null;
  step1Icon?: string | null;
  step2Label?: string | null;
  step2SubText?: string | null;
  step2Icon?: string | null;
  step3Label?: string | null;
  step3SubText?: string | null;
  step3Icon?: string | null;
  textColor: string;
  iconColor: string;
  bgColor: string;
  borderColor: string;
  borderWidth?: number;
  borderRadius: number;
  shadow?: "none" | "sm" | "md" | "lg" | "xl" | "premium" | string | null;
  glassmorphism?: boolean | null;
  padding?: number | null;
  bgGradient?: string | null;
  showTimeline?: boolean;
  showLocationSelector?: boolean;
  locationPrefixText?: string | null;
  showLocationFlag?: boolean;
  locationRowAlignment?: LocationRowAlignment | string | null;
  policyText?: string | null;
}

export interface APIDeliveryResponse {
  enabled: boolean;
  reason?: "missing_session" | "disabled_or_missing_config";
  widgetId?: string;
  countryCode?: string;
  orderDate?: string;
  shipDate?: string;
  minDate?: string;
  maxDate?: string;
  shippingMessage?: string;
  countdownSeconds?: number;
  settings?: WidgetSettingsProps;
}

export const DEFAULT_SHIPPING_MESSAGE =
  "Order today and get it by: {min_date} - {max_date}";

export const INVENTORY_STATUS_OPTIONS = [
  {
    value: "both",
    label: "Both",
    description: "Works with any inventory status whether in stock or out of stock.",
  },
  {
    value: "in_stock",
    label: "In Stock Only",
    description: "Considers only product has available inventory (QTY greater than 0).",
  },
  {
    value: "out_of_stock_continue",
    label: "Out of stock (continue selling on)",
    description: "Considers out-of-stock items that are still available for purchase.",
  },
  {
    value: "out_of_stock_stop",
    label: "Out of stock (Continue selling off)",
    description: "Considers out-of-stock items that cannot be purchased.",
  },
] as const;

export type InventoryStatus = (typeof INVENTORY_STATUS_OPTIONS)[number]["value"];
export type ProductInventoryStatus = Exclude<InventoryStatus, "both"> | "unknown";

export const INVENTORY_STATUS_BOTH: InventoryStatus = "both";

const INVENTORY_STATUS_VALUES = new Set<InventoryStatus>(
  INVENTORY_STATUS_OPTIONS.map((option) => option.value),
);

export function normalizeRuleInventoryStatus(value: unknown): InventoryStatus {
  const status = String(value ?? "").trim().toLowerCase();
  return INVENTORY_STATUS_VALUES.has(status as InventoryStatus)
    ? (status as InventoryStatus)
    : INVENTORY_STATUS_BOTH;
}

export function normalizeProductInventoryStatus(value: unknown): ProductInventoryStatus {
  const status = String(value ?? "").trim().toLowerCase();
  if (status === "in_stock" || status === "out_of_stock_continue" || status === "out_of_stock_stop") {
    return status;
  }
  return "unknown";
}

export function inventoryStatusLabel(value: unknown) {
  const status = normalizeRuleInventoryStatus(value);
  return INVENTORY_STATUS_OPTIONS.find((option) => option.value === status)?.label || "Both";
}

export function inventoryStatusMatches(
  ruleInventoryStatus: unknown,
  productInventoryStatus: ProductInventoryStatus,
) {
  const ruleStatus = normalizeRuleInventoryStatus(ruleInventoryStatus);
  if (ruleStatus === INVENTORY_STATUS_BOTH) return true;
  return productInventoryStatus !== "unknown" && ruleStatus === productInventoryStatus;
}

export function inventoryStatusRank(
  ruleInventoryStatus: unknown,
  productInventoryStatus: ProductInventoryStatus,
) {
  const ruleStatus = normalizeRuleInventoryStatus(ruleInventoryStatus);
  if (productInventoryStatus !== "unknown" && ruleStatus === productInventoryStatus) return 0;
  if (ruleStatus === INVENTORY_STATUS_BOTH) return productInventoryStatus === "unknown" ? 0 : 1;
  return 2;
}

export const OPERATIONAL_TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Bangkok",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
] as const;

export const DATE_LOCALE_OPTIONS = [
  { value: "en-AU", label: "English (AU)" },
  { value: "en-US", label: "English (US)" },
  { value: "vi-VN", label: "Vietnamese" },
  { value: "fr-FR", label: "French" },
  { value: "de-DE", label: "German" },
] as const;

export const VISIBILITY_MODE_OPTIONS = [
  { value: "visible", label: "Show widget" },
  { value: "hidden", label: "Hide widget" },
] as const;

export type VisibilityMode = (typeof VISIBILITY_MODE_OPTIONS)[number]["value"];

const DATE_LOCALES = new Set(DATE_LOCALE_OPTIONS.map((option) => option.value));
const VISIBILITY_MODES = new Set<VisibilityMode>(VISIBILITY_MODE_OPTIONS.map((option) => option.value));

export function normalizeCutoffTime(value: unknown) {
  const time = String(value ?? "").trim();
  return /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time) ? time : "17:00";
}

export function normalizeTimeZone(value: unknown) {
  const timeZone = String(value ?? "").trim();
  if (!timeZone) return "UTC";
  try {
    new Intl.DateTimeFormat("en-US", { timeZone }).format(new Date());
    return timeZone;
  } catch {
    return "UTC";
  }
}

export function normalizeHolidayDates(value: unknown) {
  const source = Array.isArray(value)
    ? value.join("\n")
    : String(value ?? "");
  const dates = source.match(/\d{4}-\d{2}-\d{2}/g) || [];
  return Array.from(new Set(dates)).slice(0, 100);
}

export function normalizeVisibilityMode(value: unknown): VisibilityMode {
  const mode = String(value ?? "").trim().toLowerCase();
  return VISIBILITY_MODES.has(mode as VisibilityMode) ? (mode as VisibilityMode) : "visible";
}

export function normalizeTimerSeconds(value: unknown) {
  const parsed = Number.parseInt(String(value ?? "8100"), 10);
  if (!Number.isInteger(parsed)) return 8100;
  return Math.min(86_400, Math.max(0, parsed));
}

export function normalizeDateLocale(value: unknown) {
  const locale = String(value ?? "").trim();
  return DATE_LOCALES.has(locale as (typeof DATE_LOCALE_OPTIONS)[number]["value"])
    ? locale
    : "en-AU";
}

const BLOCK_TYPES = new Set<BlockType>([
  "header",
  "steps",
  "promise_card",
  "timer",
  "divider",
  "policy",
  "policy_accordion",
  "spacer",
  "banner",
  "trust_badges",
  "progress",
  "html",
  "image",
  "dual_info",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringSetting(value: unknown, fallback = ""): string {
  if (value === undefined || value === null) return fallback;
  const text = String(value);
  return text.length ? text : fallback;
}

function boundedRecords(value: unknown, max: number): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord).slice(0, max);
}

export function normalizeCountry(value: unknown): string {
  const country = String(value ?? "").trim().toUpperCase();
  if (isAllCountriesCode(country)) return ALL_COUNTRIES_CODE;
  if (/^[A-Z]{2}$/.test(country)) return country;
  return ALL_COUNTRIES_CODE;
}

export function normalizeTags(value: unknown): string[] {
  const tags = Array.isArray(value)
    ? value
    : String(value ?? "")
        .split(",")
        .map((tag) => tag.trim());

  return Array.from(
    new Set(
      tags
        .map((tag) => String(tag).trim().toLowerCase())
        .filter(Boolean),
    ),
  );
}

export function normalizeCountries(value: unknown): string[] {
  const countries = Array.isArray(value)
    ? value
    : String(value ?? "")
        .split(",")
        .map((country) => country.trim());

  return Array.from(
    new Set(
      countries
        .map((country) => normalizeCountry(country))
        .filter((country) => !isAllCountriesCode(country)),
    ),
  );
}

export function normalizeProductId(value: unknown): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const gidPrefix = "gid://shopify/Product/";
  if (raw.startsWith(gidPrefix)) return raw.slice(gidPrefix.length);
  return raw.replace(/^\/+|\/+$/g, "");
}

export function normalizeProductIds(value: unknown): string[] {
  const productIds = Array.isArray(value)
    ? value
    : String(value ?? "")
        .split(",")
        .map((productId) => productId.trim());

  return Array.from(
    new Set(
      productIds
        .map(normalizeProductId)
        .filter(Boolean),
    ),
  );
}

export function normalizeCollectionId(value: unknown): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const gidPrefix = "gid://shopify/Collection/";
  if (raw.startsWith(gidPrefix)) return raw.slice(gidPrefix.length);
  return raw.replace(/^\/+|\/+$/g, "");
}

export function normalizeCollectionIds(value: unknown): string[] {
  const collectionIds = Array.isArray(value)
    ? value
    : String(value ?? "")
        .split(",")
        .map((collectionId) => collectionId.trim());

  return Array.from(
    new Set(
      collectionIds
        .map(normalizeCollectionId)
        .filter(Boolean),
    ),
  );
}

export function parseBlockConfigs(value: unknown): BlockConfig[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((block, index) => {
    if (!isRecord(block)) return [];
    const type = String(block.type ?? "");
    if (!BLOCK_TYPES.has(type as BlockType)) return [];

    return [
      {
        id: String(block.id || `block-${index}`),
        type: type as BlockType,
        settings: isRecord(block.settings) ? block.settings : {},
      },
    ];
  });
}

export function normalizeStepItems(settings: Record<string, unknown> = {}): StepItemConfig[] {
  const items = boundedRecords(settings.items, 6)
    .map((item, index) => ({
      id: stringSetting(item.id, `step-${index + 1}`),
      label: stringSetting(item.label, index === 0 ? "Order" : index === 1 ? "Shipped" : "Delivery"),
      subText: stringSetting(item.subText, index === 0 ? "{order_date}" : index === 1 ? "{ship_date}" : "{max_date}"),
      icon: stringSetting(item.icon, index === 0 ? "bag" : index === 1 ? "truck" : "map_pin"),
      bgColor: stringSetting(item.bgColor),
      dotColor: stringSetting(item.dotColor),
      iconColor: stringSetting(item.iconColor),
      labelColor: stringSetting(item.labelColor),
      subTextColor: stringSetting(item.subTextColor),
      borderColor: stringSetting(item.borderColor),
    }))
    .filter((item) => item.label || item.subText || item.icon);

  if (items.length >= 2) return items;

  return [1, 2, 3].map((step) => ({
    id: `step-${step}`,
    label: stringSetting(
      settings[`step${step}Label`],
      step === 1 ? "Order" : step === 2 ? "Shipped" : "Delivery",
    ),
    subText: stringSetting(
      settings[`step${step}SubText`],
      step === 1 ? "{order_date}" : step === 2 ? "{ship_date}" : "{max_date}",
    ),
    icon: stringSetting(
      settings[`step${step}Icon`],
      step === 1 ? "bag" : step === 2 ? "truck" : "map_pin",
    ),
    bgColor: stringSetting(settings[`step${step}Bg`]),
    dotColor: stringSetting(settings[`step${step}DotColor`]),
    iconColor: stringSetting(settings[`step${step}IconColor`]),
    labelColor: stringSetting(settings[`step${step}LabelColor`]),
    subTextColor: stringSetting(settings[`step${step}SubTextColor`]),
    borderColor: stringSetting(settings[`step${step}BorderColor`]),
  }));
}

export function normalizeTrustBadges(settings: Record<string, unknown> = {}): TrustBadgeConfig[] {
  const badges = Array.isArray(settings.badges) ? settings.badges : ["check_badge", "shield"];

  return badges.slice(0, 8).map((badge, index) => {
    if (isRecord(badge)) {
      return {
        id: stringSetting(badge.id, `trust-${index + 1}`),
        icon: stringSetting(badge.icon, "shield"),
        label: stringSetting(badge.label, ""),
        subText: stringSetting(badge.subText, ""),
        bgColor: stringSetting(badge.bgColor),
        borderColor: stringSetting(badge.borderColor),
        iconColor: stringSetting(badge.iconColor),
        labelColor: stringSetting(badge.labelColor),
        subTextColor: stringSetting(badge.subTextColor),
      };
    }

    return {
      id: `trust-${index + 1}`,
      icon: stringSetting(badge, "shield"),
      label: "",
      subText: "",
      bgColor: "",
      borderColor: "",
      iconColor: "",
      labelColor: "",
      subTextColor: "",
    };
  });
}

export function normalizePolicyItems(settings: Record<string, unknown> = {}): PolicyItemConfig[] {
  const items = boundedRecords(settings.items, 5)
    .map((item, index) => ({
      id: stringSetting(item.id, `policy-${index + 1}`),
      title: stringSetting(item.title, index === 0 ? "Shipping & delivery" : "Policy"),
      body: stringSetting(item.body, ""),
      icon: stringSetting(item.icon, index === 0 ? "truck" : "shield"),
      bgColor: stringSetting(item.bgColor),
      borderColor: stringSetting(item.borderColor),
      iconColor: stringSetting(item.iconColor),
      titleColor: stringSetting(item.titleColor),
      bodyColor: stringSetting(item.bodyColor),
    }))
    .filter((item) => item.title || item.body);

  if (items.length > 0) return items;

  return [
    {
      id: "policy-1",
      title: "Shipping & delivery",
      body: "Orders are prepared quickly and shipped with tracking when available.",
      icon: "truck",
      bgColor: "",
      borderColor: "",
      iconColor: "",
      titleColor: "",
      bodyColor: "",
    },
  ];
}

export function parseJsonArrayField(raw: FormDataEntryValue | null): unknown[] | null {
  if (typeof raw !== "string") return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function blocksFromJson(value: Prisma.JsonValue | null | undefined): BlockConfig[] {
  return parseBlockConfigs(value);
}

export function buildFallbackBlocks(
  settings: Partial<WidgetSettingsProps> = {},
  shippingMessage = DEFAULT_SHIPPING_MESSAGE,
): BlockConfig[] {
  return [
    {
      id: "fallback-header",
      type: "header",
      settings: {
        text: settings.headerText || shippingMessage,
        subText: settings.subHeaderText || "",
        align: "center",
        fontSize: "sm",
        padding: 8,
      },
    },
    {
      id: "fallback-steps",
      type: "steps",
      settings: {
        preset: "timeline_dots",
        connectorStyle: "solid",
        borderRadius: 50,
        borderWidth: 2,
        itemGap: 12,
        step1Label: settings.step1Label || "Order Now",
        step1SubText: settings.step1SubText || "{order_date}",
        step1Icon: settings.step1Icon || "bag",
        step2Label: settings.step2Label || "Ready to Ship",
        step2SubText: settings.step2SubText || "{ship_date}",
        step2Icon: settings.step2Icon || "truck",
        step3Label: settings.step3Label || "At Doorstep",
        step3SubText: settings.step3SubText || "{max_date}",
        step3Icon: settings.step3Icon || "map_pin",
      },
    },
  ];
}

export function widgetBlocks(
  widget: Pick<
    Widget,
    | "customBlocks"
    | "headerText"
    | "subHeaderText"
    | "step1Label"
    | "step1SubText"
    | "step1Icon"
    | "step2Label"
    | "step2SubText"
    | "step2Icon"
    | "step3Label"
    | "step3SubText"
    | "step3Icon"
  >,
  shippingMessage = DEFAULT_SHIPPING_MESSAGE,
): BlockConfig[] {
  const blocks = blocksFromJson(widget.customBlocks);
  if (blocks.length > 0) return blocks;
  return buildFallbackBlocks(
    {
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
    },
    shippingMessage,
  );
}

function jsonStringArray(value: Prisma.JsonValue | null): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export function selectWidget(
  widgets: Widget[],
  countryCode: string,
  productTags: string[],
  productId?: string,
): Widget | undefined {
  const normalizedCountry = normalizeCountry(countryCode);
  const normalizedTags = normalizeTags(productTags);
  const normalizedProductId = normalizeProductId(productId);

  if (normalizedProductId) {
    const productMatch = widgets.find((widget) =>
      normalizeProductIds(jsonStringArray(widget.targetProducts)).includes(normalizedProductId),
    );
    if (productMatch) return productMatch;
  }

  const countryMatch = widgets.find((widget) =>
    jsonStringArray(widget.targetCountries)
      .map(normalizeCountry)
      .includes(normalizedCountry),
  );
  if (countryMatch) return countryMatch;

  const tagMatch = widgets.find((widget) => {
    const targets = normalizeTags(jsonStringArray(widget.targetTags));
    return targets.some((tag) => normalizedTags.includes(tag));
  });
  if (tagMatch) return tagMatch;

  const defaultWidget = widgets.find((widget) => widget.isDefault);
  if (defaultWidget) return defaultWidget;

  const matchAllWidget = widgets.find((widget) => {
    return (
      !widget.isDefault &&
      jsonStringArray(widget.targetProducts).length === 0 &&
      jsonStringArray(widget.targetCountries).length === 0 &&
      jsonStringArray(widget.targetTags).length === 0
    );
  });
  if (matchAllWidget) return matchAllWidget;

  return widgets[0];
}

export function selectDeliveryRule<T extends DeliveryRule>(
  rules: T[],
  countryCode: string,
  productTags: string[],
  productId?: string,
  productCollectionIds: string[] = [],
  productInventoryStatus: ProductInventoryStatus = "unknown",
): T | undefined {
  const normalizedCountry = normalizeCountry(countryCode);
  const normalizedTags = normalizeTags(productTags);
  const normalizedProductId = normalizeProductId(productId);
  const normalizedCollectionIds = normalizeCollectionIds(productCollectionIds);
  const normalizedInventoryStatus = normalizeProductInventoryStatus(productInventoryStatus);
  const exactCountryRank = 0;
  const targetCountryBaseRank = 1;
  const allCountriesRank = 100_000;
  const noCountryMatchRank = 100_001;

  const countryRank = (rule: DeliveryRule) => {
    const ruleCountry = normalizeCountry(rule.countryCode);
    if (ruleCountry === normalizedCountry) return exactCountryRank;

    const targetCountries = normalizeCountries(jsonStringArray(rule.targetCountries));
    if (targetCountries.length > 0) {
      return targetCountries.includes(normalizedCountry)
        ? targetCountryBaseRank + targetCountries.length
        : noCountryMatchRank;
    }

    if (isAllCountriesCode(ruleCountry)) return allCountriesRank;
    return noCountryMatchRank;
  };

  const candidates = rules
    .filter((rule) => rule.isActive)
    .filter((rule) => countryRank(rule) < noCountryMatchRank)
    .filter((rule) => inventoryStatusMatches(rule.inventoryStatus, normalizedInventoryStatus))
    .sort((a, b) => (
      countryRank(a) - countryRank(b) ||
      inventoryStatusRank(a.inventoryStatus, normalizedInventoryStatus) -
        inventoryStatusRank(b.inventoryStatus, normalizedInventoryStatus)
    ));

  if (normalizedProductId) {
    const productMatch = candidates.find((rule) =>
      normalizeProductIds(jsonStringArray(rule.targetProducts)).includes(normalizedProductId),
    );
    if (productMatch) return productMatch;
  }

  if (normalizedCollectionIds.length > 0) {
    const collectionMatch = candidates.find((rule) => {
      const targets = normalizeCollectionIds(jsonStringArray(rule.targetCollections));
      return targets.length > 0 && targets.some((collectionId) => normalizedCollectionIds.includes(collectionId));
    });
    if (collectionMatch) return collectionMatch;
  }

  const tagMatch = candidates.find((rule) => {
    const targets = normalizeTags(jsonStringArray(rule.targetTags));
    return targets.length > 0 && targets.some((tag) => normalizedTags.includes(tag));
  });
  if (tagMatch) return tagMatch;

  const genericCountryMatch = candidates.find((rule) => {
    return (
      countryRank(rule) < allCountriesRank &&
      jsonStringArray(rule.targetProducts).length === 0 &&
      jsonStringArray(rule.targetCollections).length === 0 &&
      jsonStringArray(rule.targetTags).length === 0
    );
  });
  if (genericCountryMatch) return genericCountryMatch;

  return candidates.find((rule) => {
    return (
      countryRank(rule) === allCountriesRank &&
      jsonStringArray(rule.targetProducts).length === 0 &&
      jsonStringArray(rule.targetCollections).length === 0 &&
      jsonStringArray(rule.targetTags).length === 0
    );
  });
}
