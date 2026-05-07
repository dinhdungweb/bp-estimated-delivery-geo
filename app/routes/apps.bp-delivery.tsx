import type { LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import prisma from "../db.server";
import { authenticate } from "../shopify.server";
import {
  ALL_COUNTRIES_CODE,
  DEFAULT_SHIPPING_MESSAGE,
  INVENTORY_STATUS_BOTH,
  LEGACY_ALL_COUNTRIES_CODE,
  normalizeCollectionIds,
  normalizeCountry,
  normalizeCutoffTime,
  normalizeDateLocale,
  normalizeHolidayDates,
  normalizeProductInventoryStatus,
  normalizeProductId,
  normalizeTimeZone,
  normalizeVisibilityMode,
  normalizeTags,
  selectDeliveryRule,
  widgetBlocks,
} from "../lib/delivery";
import type { APIDeliveryResponse } from "../lib/delivery";

function detectCountryFromHeaders(request: Request): string {
  return normalizeCountry(
      request.headers.get("cf-ipcountry") ||
      request.headers.get("x-shopify-ip-country") ||
      request.headers.get("geoip-country-code") ||
      ALL_COUNTRIES_CODE,
  );
}

function zonedDateKey(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (type: string) => parts.find((part) => part.type === type)?.value || "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

function zonedWeekday(date: Date, timeZone: string): number {
  const [year, month, day] = zonedDateKey(date, timeZone).split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

function localTimeParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    hourCycle: "h23",
  }).formatToParts(date);
  return {
    hour: Number(parts.find((part) => part.type === "hour")?.value || "0"),
    minute: Number(parts.find((part) => part.type === "minute")?.value || "0"),
    second: Number(parts.find((part) => part.type === "second")?.value || "0"),
  };
}

function localSeconds(date: Date, timeZone: string): number {
  const parts = localTimeParts(date, timeZone);
  return parts.hour * 3600 + parts.minute * 60 + parts.second;
}

function cutoffSeconds(cutoffTime: string): number {
  const [hour, minute] = cutoffTime.split(":").map(Number);
  return hour * 3600 + minute * 60;
}

function dateKeyToUtcDate(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function addDaysToDateKey(dateKey: string, days: number) {
  const date = dateKeyToUtcDate(dateKey);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function isBusinessDateKey(dateKey: string, holidays: Set<string>) {
  return dateKeyToUtcDate(dateKey).getUTCDay() !== 0 && !holidays.has(dateKey);
}

function timeZoneOffsetMs(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    hourCycle: "h23",
  }).formatToParts(date);
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value || "0");
  const asUtc = Date.UTC(
    value("year"),
    value("month") - 1,
    value("day"),
    value("hour"),
    value("minute"),
    value("second"),
  );
  return asUtc - date.getTime();
}

function zonedDateTimeToUtc(dateKey: string, time: string, timeZone: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const localAsUtc = Date.UTC(year, month - 1, day, hour, minute, 0);
  let result = new Date(localAsUtc - timeZoneOffsetMs(new Date(localAsUtc), timeZone));
  result = new Date(localAsUtc - timeZoneOffsetMs(result, timeZone));
  return result;
}

function isBusinessDate(date: Date, timeZone: string, holidays: Set<string>) {
  return zonedWeekday(date, timeZone) !== 0 && !holidays.has(zonedDateKey(date, timeZone));
}

function addBusinessDays(date: Date, days: number, timeZone = "UTC", holidayDates: string[] = []): Date {
  const result = new Date(date);
  let added = 0;
  const holidays = new Set(holidayDates);

  while (added < days) {
    result.setDate(result.getDate() + 1);
    if (isBusinessDate(result, timeZone, holidays)) added += 1;
  }

  return result;
}

function formatDate(date: Date, locale = "en-AU", timeZone = "UTC"): string {
  return date.toLocaleDateString(locale, {
    timeZone,
    month: "short",
    day: "numeric",
    weekday: undefined,
  });
}

function etaStartDate(date: Date, rule: {
  cutoffTime: string;
  cutoffTimezone: string;
  holidayDates: unknown;
}) {
  const timeZone = normalizeTimeZone(rule.cutoffTimezone);
  const cutoffTime = normalizeCutoffTime(rule.cutoffTime);
  const holidayDates = normalizeHolidayDates(rule.holidayDates);
  if (localSeconds(date, timeZone) < cutoffSeconds(cutoffTime)) return date;
  return addBusinessDays(date, 1, timeZone, holidayDates);
}

function countdownSecondsUntilCutoff(date: Date, cutoffTime: string, timeZone: string, holidayDates: string[]) {
  const holidays = new Set(holidayDates);
  const currentDateKey = zonedDateKey(date, timeZone);
  const cutoffSecondOfDay = cutoffSeconds(cutoffTime);
  let targetDateKey = currentDateKey;

  if (!isBusinessDateKey(currentDateKey, holidays) || localSeconds(date, timeZone) >= cutoffSecondOfDay) {
    for (let days = 1; days <= 370; days += 1) {
      const candidateDateKey = addDaysToDateKey(currentDateKey, days);
      if (isBusinessDateKey(candidateDateKey, holidays)) {
        targetDateKey = candidateDateKey;
        break;
      }
    }
  }

  const targetCutoff = zonedDateTimeToUtc(targetDateKey, cutoffTime, timeZone);
  return Math.max(0, Math.floor((targetCutoff.getTime() - date.getTime()) / 1000));
}

const responseHeaders = {
  "Cache-Control": "public, max-age=60",
  Vary: "cf-ipcountry, x-shopify-ip-country, geoip-country-code",
};

function disabledResponse(
  countryCode: string,
  reason: APIDeliveryResponse["reason"],
  status = 200,
) {
  return data<APIDeliveryResponse>(
    { enabled: false, countryCode, reason },
    { status, headers: responseHeaders },
  );
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const appProxyContext = await authenticate.public.appProxy(request);
  const url = new URL(request.url);
  const shop = appProxyContext.session?.shop;

  if (!shop) {
    return disabledResponse(ALL_COUNTRIES_CODE, "missing_session");
  }

  const countryCode = url.searchParams.get("country")
    ? normalizeCountry(url.searchParams.get("country"))
    : detectCountryFromHeaders(request);
  const productId = normalizeProductId(url.searchParams.get("product_id"));
  const productCollectionIds = normalizeCollectionIds(url.searchParams.get("collections"));
  const productTags = normalizeTags(url.searchParams.get("tags") || "");
  const productInventoryStatus = normalizeProductInventoryStatus(url.searchParams.get("inventory_status"));
  const inventoryRuleStatuses = productInventoryStatus === "unknown"
    ? [INVENTORY_STATUS_BOTH]
    : [INVENTORY_STATUS_BOTH, productInventoryStatus];

  const [rules, defaultWidget, globalSettings] = await Promise.all([
    prisma.deliveryRule.findMany({
      where: {
        shop,
        isActive: true,
        countryCode: { in: [countryCode, ALL_COUNTRIES_CODE, LEGACY_ALL_COUNTRIES_CODE] },
        inventoryStatus: { in: inventoryRuleStatuses },
      },
      include: { widget: true },
      orderBy: [{ createdAt: "desc" }],
    }),
    prisma.widget.findFirst({
      where: { shop, isActive: true, isDefault: true },
    }),
    prisma.appSetting.findUnique({ where: { shop } }),
  ]);

  const rule = selectDeliveryRule(
    rules,
    countryCode,
    productTags,
    productId,
    productCollectionIds,
    productInventoryStatus,
  );
  if (!globalSettings?.isEnabled || !rule || normalizeVisibilityMode(rule.visibilityMode) === "hidden") {
    return disabledResponse(countryCode, "disabled_or_missing_config");
  }

  const selectedWidget = rule.widget?.isActive ? rule.widget : defaultWidget;
  if (!selectedWidget) {
    return disabledResponse(countryCode, "disabled_or_missing_config");
  }

  const today = new Date();
  const timeZone = normalizeTimeZone(rule.cutoffTimezone);
  const dateLocale = normalizeDateLocale(rule.dateLocale);
  const holidayDates = normalizeHolidayDates(rule.holidayDates);
  const etaStart = etaStartDate(today, rule);
  const shipDay = addBusinessDays(etaStart, rule.processingDays, timeZone, holidayDates);
  const minDelivery = addBusinessDays(shipDay, rule.minDays, timeZone, holidayDates);
  const maxDelivery = addBusinessDays(shipDay, rule.maxDays, timeZone, holidayDates);
  const shippingMessage = rule.shippingMessage || DEFAULT_SHIPPING_MESSAGE;
  const countdownSeconds = countdownSecondsUntilCutoff(
    today,
    normalizeCutoffTime(rule.cutoffTime),
    timeZone,
    holidayDates,
  );

  return data<APIDeliveryResponse>(
    {
      enabled: true,
      widgetId: selectedWidget.id,
      countryCode,
      orderDate: formatDate(today, dateLocale, timeZone),
      shipDate: formatDate(shipDay, dateLocale, timeZone),
      minDate: formatDate(minDelivery, dateLocale, timeZone),
      maxDate: formatDate(maxDelivery, dateLocale, timeZone),
      shippingMessage,
      countdownSeconds,
      settings: {
        style: "custom",
        widgetStyle: selectedWidget.widgetStyle || "custom",
        customBlocks: widgetBlocks(selectedWidget, shippingMessage),
        textColor: selectedWidget.textColor,
        iconColor: selectedWidget.iconColor,
        bgColor: selectedWidget.bgColor,
        borderColor: selectedWidget.borderColor,
        borderRadius: selectedWidget.borderRadius,
        shadow: selectedWidget.shadow,
        glassmorphism: selectedWidget.glassmorphism,
        padding: selectedWidget.padding,
        bgGradient: selectedWidget.bgGradient,
        showTimeline: selectedWidget.showTimeline,
        policyText: selectedWidget.policyText ?? "",
        headerText: selectedWidget.headerText ?? shippingMessage,
        subHeaderText: selectedWidget.subHeaderText,
        step1Label: selectedWidget.step1Label,
        step1SubText: selectedWidget.step1SubText,
        step1Icon: selectedWidget.step1Icon,
        step2Label: selectedWidget.step2Label,
        step2SubText: selectedWidget.step2SubText,
        step2Icon: selectedWidget.step2Icon,
        step3Label: selectedWidget.step3Label,
        step3SubText: selectedWidget.step3SubText,
        step3Icon: selectedWidget.step3Icon,
      },
    },
    { headers: responseHeaders },
  );
};
