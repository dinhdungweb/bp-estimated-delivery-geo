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

  // 1. Lấy country code và context
  const countryCode = overrideCountry || detectCountryFromHeaders(request);
  const productTagsRaw = url.searchParams.get("tags") || "";
  const productTags = productTagsRaw.split(",").map(t => t.trim().toLowerCase());

  // 2. Lấy rule giao hàng (Vẫn dùng DeliveryRule hiện tại)
  let rule = await prisma.deliveryRule.findFirst({
    where: { shop, countryCode, isActive: true },
  });

  if (!rule) {
    rule = await prisma.deliveryRule.findFirst({
      where: { shop, countryCode: "OTHER", isActive: true },
    });
  }

  // 3. Chọn Widget phù hợp nhất (Logic Đa Widget) - Dùng RAW SQL
  const allWidgets: any[] = await prisma.$queryRaw`
    SELECT * FROM "Widget" 
    WHERE shop = ${shop} AND "isActive" = true 
    ORDER BY "isDefault" DESC
  `;

  // Tìm widget khớp với quốc gia hiện tại
  let selectedWidget = allWidgets.find((w: any) => {
    const targets = Array.isArray(w.targetCountries) ? (w.targetCountries as string[]) : [];
    return targets.includes(countryCode);
  });

  // Nếu không thấy, tìm widget khớp với Tags
  if (!selectedWidget && productTags.length > 0) {
      selectedWidget = allWidgets.find((w: any) => {
         const targets = Array.isArray(w.targetTags) ? (w.targetTags as string[]) : [];
         return targets.some(t => productTags.includes(t.toLowerCase()));
      });
  }

  // Fallback cuối cùng: Widget Default hoặc cái đầu tiên
  if (!selectedWidget) {
    selectedWidget = allWidgets.find((w: any) => w.isDefault) || allWidgets[0];
  }

  const globalSettings = await prisma.appSetting.findUnique({ where: { shop } });

  // 4. Widget đang tắt hoặc không có widget nào thì ẩn
  console.log(`BP Delivery API: Request from ${shop}, Country: ${countryCode}`);
  
  if (!globalSettings?.isEnabled) {
     console.log(`BP Delivery API: App is disabled for ${shop}`);
  }
  if (!selectedWidget) {
     console.log(`BP Delivery API: No widget found for ${shop}`);
  }
  if (!rule) {
     console.log(`BP Delivery API: No delivery rule found for ${shop} and ${countryCode}`);
  }

  if (!globalSettings?.isEnabled || !selectedWidget || !rule) {
    return data(
      { enabled: false, countryCode, reason: "disabled_or_missing_config" },
      { headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "public, max-age=60" } }
    );
  }

  // 5. Tính ngày dự kiến
  const today = new Date();
  const shipDay = addBusinessDays(today, rule.processingDays);
  const minDelivery = addBusinessDays(shipDay, rule.minDays);
  const maxDelivery = addBusinessDays(shipDay, rule.maxDays);

  const dates = {
    orderDate: formatDate(today),
    shipDate: formatDate(shipDay),
    minDate: formatDate(minDelivery),
    maxDate: formatDate(maxDelivery),
  };

  // 6. Trả về toàn bộ cấu hình Pro của Widget được chọn
  return data(
    {
      enabled: true,
      countryCode,
      ...dates,
      settings: {
        widgetStyle: selectedWidget.widgetStyle || "custom",
        customBlocks: selectedWidget.customBlocks,
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
        // Fallbacks for standard blocks
        headerText: selectedWidget.headerText,
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
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=60",
      },
    }
  );
};
