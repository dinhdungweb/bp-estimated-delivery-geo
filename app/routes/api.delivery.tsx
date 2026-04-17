/**
 * BP: Estimated Delivery & Geo — Delivery API Proxy
 * Copyright © 2025 BluePeaks. All rights reserved.
 * https://bluepeaks.top
 *
 * This software is proprietary and confidential.
 * Unauthorized copying, modification, or distribution of this file,
 * via any medium, is strictly prohibited.
 */
import type { LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import prisma from "../db.server";

// ─── Lookup GeoIP bằng Cloudflare/Shopify header (siêu nhanh) ────────────────
function detectCountryFromHeaders(request: Request): string {
  return (
    request.headers.get("cf-ipcountry") ||
    request.headers.get("x-shopify-ip-country") ||
    request.headers.get("geoip-country-code") ||
    "OTHER"
  );
}

// ─── Tính ngày giao hàng, bỏ qua Chủ nhật ────────────────────────────────────
function addBusinessDays(date: Date, days: number): Date {
  const result = new Date(date);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    if (result.getDay() !== 0) added++; // 0 = Chủ nhật
  }
  return result;
}

// ─── Format ngày ra chuỗi hiển thị ────────────────────────────────────────────
function formatDate(date: Date): string {
  return date.toLocaleDateString("en-AU", {
    month: "short",
    day: "numeric",
    weekday: undefined,
  });
}

// ─── Loader ───────────────────────────────────────────────────────────────────
export const loader = async ({ request }: LoaderFunctionArgs) => {
  // Lấy shopDomain từ query param (app proxy inject)
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  const overrideCountry = url.searchParams.get("country"); // Cho phép JS override

  if (!shop) {
    return data({ error: "Missing shop param" }, { status: 400 });
  }

  // 1. Lấy country code
  const countryCode = overrideCountry || detectCountryFromHeaders(request);

  // 2. Lấy rule cho quốc gia này, fallback về "OTHER"
  let rule = await prisma.deliveryRule.findFirst({
    where: { shop, countryCode, isActive: true },
  });

  if (!rule) {
    rule = await prisma.deliveryRule.findFirst({
      where: { shop, countryCode: "OTHER", isActive: true },
    });
  }

  // 3. Lấy cài đặt widget
  const settings = await prisma.appSetting.findUnique({ where: { shop } });

  // 4. Widget đang tắt hoặc không có rule thì trả về disabled
  if (!settings?.isEnabled || !rule) {
    return data(
      { enabled: false, countryCode },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=60",
        },
      }
    );
  }

  // 5. Tính ngày dự kiến (xử lý + giao hàng)
  const today = new Date();
  const shipDay = addBusinessDays(today, rule.processingDays);
  const minDelivery = addBusinessDays(shipDay, rule.minDays);
  const maxDelivery = addBusinessDays(shipDay, rule.maxDays);

  const minDate = formatDate(minDelivery);
  const maxDate = formatDate(maxDelivery);
  const shipDate = formatDate(shipDay);
  const orderDate = formatDate(today);

  // 6. Build message
  const message = rule.shippingMessage
    .replace("{min_date}", minDate)
    .replace("{max_date}", maxDate);

  return data(
    {
      enabled: true,
      countryCode,
      message,
      orderDate,
      shipDate,
      minDate,
      maxDate,
      settings: {
        widgetStyle: settings.widgetStyle,
        textColor: settings.textColor,
        iconColor: settings.iconColor,
        bgColor: settings.bgColor,
        borderColor: settings.borderColor,
        borderRadius: settings.borderRadius,
        showTimeline: settings.showTimeline,
        policyText: settings.policyText ?? "",
      },
    },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=60",
      },
    }
  );
};
