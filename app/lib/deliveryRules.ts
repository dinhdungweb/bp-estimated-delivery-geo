import {
  DEFAULT_SHIPPING_MESSAGE,
  normalizeCountry,
  normalizeProductIds,
  normalizeTags,
} from "./delivery";

export type RulePayload =
  | {
      countryCode: string;
      widgetId: string;
      targetProducts: string[];
      targetTags: string[];
      minDays: number;
      maxDays: number;
      processingDays: number;
      shippingMessage: string;
      isActive: boolean;
    }
  | { error: string };

export const RULE_COUNTRIES = [
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

export const RULE_DEFAULT_MESSAGE = DEFAULT_SHIPPING_MESSAGE;

export function parseNonNegativeInt(value: FormDataEntryValue | null, fallback: number): number | null {
  const parsed = Number.parseInt(String(value ?? fallback), 10);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 365) return null;
  return parsed;
}

export function getRuleCountryLabel(code: string) {
  return RULE_COUNTRIES.find((country) => country.value === code)?.label ?? code;
}

export function daysLabel(value: number) {
  return value === 1 ? "1 day" : `${value} days`;
}

export function previewRuleMessage(message: string) {
  return message
    .replaceAll("{order_date}", "Apr 28")
    .replaceAll("{ship_date}", "Apr 29")
    .replaceAll("{min_date}", "May 2")
    .replaceAll("{max_date}", "May 6");
}

export function csvList(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function jsonStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export function sameStringArray(left: string[], right: string[]) {
  if (left.length !== right.length) return false;
  const leftSorted = [...left].sort();
  const rightSorted = [...right].sort();
  return leftSorted.every((value, index) => value === rightSorted[index]);
}

export function readRulePayload(formData: FormData): RulePayload {
  const countryCode = normalizeCountry(formData.get("countryCode"));
  const widgetId = String(formData.get("widgetId") || "").trim();
  const targetProducts = normalizeProductIds(csvList(formData.get("targetProducts")));
  const targetTags = normalizeTags(csvList(formData.get("targetTags")));
  const minDays = parseNonNegativeInt(formData.get("minDays"), 3);
  const maxDays = parseNonNegativeInt(formData.get("maxDays"), 7);
  const processingDays = parseNonNegativeInt(formData.get("processingDays"), 1);
  const shippingMessage = String(formData.get("shippingMessage") || RULE_DEFAULT_MESSAGE).trim();
  const isActive = String(formData.get("isActive") ?? "true") === "true";

  if (!RULE_COUNTRIES.some((country) => country.value === countryCode)) {
    return { error: "Invalid country code." };
  }

  if (!widgetId) {
    return { error: "Choose a design for this rule." };
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

  return {
    countryCode,
    widgetId,
    targetProducts,
    targetTags,
    minDays,
    maxDays,
    processingDays,
    shippingMessage,
    isActive,
  };
}
