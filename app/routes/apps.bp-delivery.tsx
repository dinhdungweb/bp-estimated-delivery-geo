import type { LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import prisma from "../db.server";
import { authenticate } from "../shopify.server";
import {
  DEFAULT_SHIPPING_MESSAGE,
  normalizeCountry,
  normalizeProductId,
  normalizeTags,
  selectWidget,
  widgetBlocks,
} from "../lib/delivery";
import type { APIDeliveryResponse } from "../lib/delivery";

function detectCountryFromHeaders(request: Request): string {
  return normalizeCountry(
    request.headers.get("cf-ipcountry") ||
      request.headers.get("x-shopify-ip-country") ||
      request.headers.get("geoip-country-code") ||
      "OTHER",
  );
}

function addBusinessDays(date: Date, days: number): Date {
  const result = new Date(date);
  let added = 0;

  while (added < days) {
    result.setDate(result.getDate() + 1);
    if (result.getDay() !== 0) added += 1;
  }

  return result;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-AU", {
    month: "short",
    day: "numeric",
    weekday: undefined,
  });
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
    return disabledResponse("OTHER", "missing_session");
  }

  const countryCode = url.searchParams.get("country")
    ? normalizeCountry(url.searchParams.get("country"))
    : detectCountryFromHeaders(request);
  const productId = normalizeProductId(url.searchParams.get("product_id"));
  const productTags = normalizeTags(url.searchParams.get("tags") || "");

  let rule = await prisma.deliveryRule.findFirst({
    where: { shop, countryCode, isActive: true },
  });

  if (!rule) {
    rule = await prisma.deliveryRule.findFirst({
      where: { shop, countryCode: "OTHER", isActive: true },
    });
  }

  const [allWidgets, globalSettings] = await Promise.all([
    prisma.widget.findMany({
      where: { shop, isActive: true },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    }),
    prisma.appSetting.findUnique({ where: { shop } }),
  ]);

  const selectedWidget = selectWidget(allWidgets, countryCode, productTags, productId);

  if (!globalSettings?.isEnabled || !selectedWidget || !rule) {
    return disabledResponse(countryCode, "disabled_or_missing_config");
  }

  const today = new Date();
  const shipDay = addBusinessDays(today, rule.processingDays);
  const minDelivery = addBusinessDays(shipDay, rule.minDays);
  const maxDelivery = addBusinessDays(shipDay, rule.maxDays);
  const shippingMessage = rule.shippingMessage || DEFAULT_SHIPPING_MESSAGE;

  return data<APIDeliveryResponse>(
    {
      enabled: true,
      widgetId: selectedWidget.id,
      countryCode,
      orderDate: formatDate(today),
      shipDate: formatDate(shipDay),
      minDate: formatDate(minDelivery),
      maxDate: formatDate(maxDelivery),
      shippingMessage,
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
