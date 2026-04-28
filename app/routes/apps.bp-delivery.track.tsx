import type { ActionFunctionArgs } from "react-router";
import { data } from "react-router";
import type { Prisma } from "@prisma/client";
import prisma from "../db.server";
import { authenticate } from "../shopify.server";
import { normalizeCountry, normalizeProductId, normalizeTags } from "../lib/delivery";

const TRACKABLE_EVENTS = new Set([
  "view",
  "hover",
  "click",
  "country_change",
  "add_to_cart",
]);

async function readJsonBody(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const parsed = (await request.json()) as unknown;
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return null;
  }
  return null;
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const appProxyContext = await authenticate.public.appProxy(request);
  const shop = appProxyContext.session?.shop;

  if (!shop) {
    return data({ ok: false, reason: "missing_session" }, { status: 401 });
  }

  const payload = await readJsonBody(request);
  if (!payload) {
    return data({ ok: false, reason: "invalid_json" }, { status: 400 });
  }

  const eventType = String(payload.eventType ?? "");
  if (!TRACKABLE_EVENTS.has(eventType)) {
    return data({ ok: false, reason: "invalid_event" }, { status: 400 });
  }

  const productTags = normalizeTags(payload.productTags);
  const analyticsDelegate = prisma.analyticsEvent;
  if (!analyticsDelegate) {
    return data(
      { ok: false, reason: "analytics_unavailable" },
      { status: 202, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    await analyticsDelegate.create({
      data: {
        shop,
        eventType,
        productId: normalizeProductId(payload.productId) || null,
        widgetId: typeof payload.widgetId === "string" ? payload.widgetId : null,
        countryCode: normalizeCountry(payload.countryCode),
        productTags: productTags as unknown as Prisma.InputJsonValue,
        userAgent: request.headers.get("user-agent")?.slice(0, 500) || null,
      },
    });
  } catch {
    return data(
      { ok: false, reason: "analytics_unavailable" },
      { status: 202, headers: { "Cache-Control": "no-store" } },
    );
  }

  return data(
    { ok: true },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
};
