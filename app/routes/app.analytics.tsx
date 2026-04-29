/**
 * BP: Estimated Delivery & Geo — Analytics Dashboard
 * Copyright © 2025 BluePeaks. All rights reserved.
 * https://bluepeaks.top
 *
 * This software is proprietary and confidential.
 * Unauthorized copying, modification, or distribution of this file,
 * via any medium, is strictly prohibited.
 */
import {
  data,
  useLoaderData,
  type HeadersFunction,
  type LoaderFunctionArgs,
} from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { Icon, Text } from "@shopify/polaris";
import { ChatIcon, CheckCircleIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { useState } from "react";

type AdminGraphqlClient = {
  graphql: (
    query: string,
    options?: { variables?: Record<string, unknown> },
  ) => Promise<Response>;
};

const productGidFromId = (productId: string) => {
  const value = productId.trim();
  if (/^gid:\/\/shopify\/Product\/\d+$/i.test(value)) return value;
  if (/^\d+$/.test(value)) return `gid://shopify/Product/${value}`;
  return "";
};

const shortProductId = (productId: string) => {
  const match = productId.match(/Product\/(\d+)$/i);
  return match ? match[1] : productId;
};

type ProductMetadata = {
  title?: string;
  priceCents?: number;
  currencyCode?: string;
};

type OrderRevenueSummary = {
  amountCents: number;
  currencyCode: string;
  orderCount: number;
  unavailableReason?: "order_access_denied" | "api_error";
};

type AnalyticsEventSummary = {
  eventType: string;
  productId: string | null;
  productTitle?: string | null;
  productPriceCents?: number | null;
  currencyCode?: string | null;
  countryCode: string | null;
};

const formatMoney = (cents: number, currencyCode: string) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode || "USD",
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);

const fetchProductMetadata = async (
  admin: AdminGraphqlClient,
  productIds: string[],
) => {
  const sourceByGid = new Map<string, string[]>();

  productIds.forEach((productId) => {
    const gid = productGidFromId(productId);
    if (!gid) return;
    sourceByGid.set(gid, [...(sourceByGid.get(gid) || []), productId]);
  });

  const ids = Array.from(sourceByGid.keys());
  if (ids.length === 0) return new Map<string, ProductMetadata>();

  try {
    const response = await admin.graphql(
      `#graphql
        query ProductMetadata($ids: [ID!]!) {
          nodes(ids: $ids) {
            ... on Product {
              id
              title
              priceRangeV2 {
                minVariantPrice {
                  amount
                  currencyCode
                }
              }
            }
          }
        }
      `,
      { variables: { ids } },
    );
    const payload = (await response.json()) as {
      data?: {
        nodes?: Array<{
          id?: string;
          title?: string;
          priceRangeV2?: {
            minVariantPrice?: {
              amount?: string;
              currencyCode?: string;
            };
          };
        } | null>;
      };
    };
    const metadataByProductId = new Map<string, ProductMetadata>();

    payload.data?.nodes?.forEach((node) => {
      if (!node?.id) return;
      const amount = Number(node.priceRangeV2?.minVariantPrice?.amount);
      const metadata = {
        title: node.title,
        priceCents: Number.isFinite(amount) ? Math.round(amount * 100) : undefined,
        currencyCode: node.priceRangeV2?.minVariantPrice?.currencyCode,
      };
      (sourceByGid.get(node.id) || []).forEach((sourceProductId) => {
        metadataByProductId.set(sourceProductId, metadata);
      });
    });

    return metadataByProductId;
  } catch {
    return new Map<string, ProductMetadata>();
  }
};

// ─── Loader ───────────────────────────────────────────────────────────────────
const fetchOrderRevenue = async (
  admin: AdminGraphqlClient,
  since: Date,
): Promise<OrderRevenueSummary> => {
  const revenueByCurrency = new Map<string, number>();
  let orderCount = 0;
  let cursor: string | null = null;
  const queryString = `created_at:>=${since.toISOString().slice(0, 10)}`;

  try {
    for (let page = 0; page < 10; page += 1) {
      const response = await admin.graphql(
        `#graphql
          query OrdersRevenue($first: Int!, $after: String, $query: String!) {
            orders(first: $first, after: $after, reverse: true, sortKey: CREATED_AT, query: $query) {
              pageInfo {
                hasNextPage
                endCursor
              }
              nodes {
                totalPriceSet {
                  shopMoney {
                    amount
                    currencyCode
                  }
                }
              }
            }
          }
        `,
        {
          variables: {
            first: 100,
            after: cursor,
            query: queryString,
          },
        },
      );
      const payload = (await response.json()) as {
        errors?: Array<{
          message?: string;
          extensions?: {
            code?: string;
          };
        }>;
        data?: {
          orders?: {
            pageInfo?: {
              hasNextPage?: boolean;
              endCursor?: string | null;
            };
            nodes?: Array<{
              totalPriceSet?: {
                shopMoney?: {
                  amount?: string;
                  currencyCode?: string;
                };
              };
            }>;
          };
        };
      };
      const orders = payload.data?.orders;
      if (!orders && payload.errors?.length) {
        const accessDenied = payload.errors.some(
          (error) => error.extensions?.code === "ACCESS_DENIED",
        );
        return {
          amountCents: 0,
          currencyCode: "USD",
          orderCount: 0,
          unavailableReason: accessDenied ? "order_access_denied" : "api_error",
        };
      }
      if (!orders) break;

      orders.nodes?.forEach((order) => {
        const amount = Number(order.totalPriceSet?.shopMoney?.amount);
        const currencyCode = order.totalPriceSet?.shopMoney?.currencyCode || "USD";
        if (!Number.isFinite(amount)) return;
        orderCount += 1;
        revenueByCurrency.set(
          currencyCode,
          (revenueByCurrency.get(currencyCode) || 0) + Math.round(amount * 100),
        );
      });

      if (!orders.pageInfo?.hasNextPage || !orders.pageInfo.endCursor) break;
      cursor = orders.pageInfo.endCursor;
    }
  } catch {
    return { amountCents: 0, currencyCode: "USD", orderCount: 0, unavailableReason: "api_error" };
  }

  const primaryRevenue = Array.from(revenueByCurrency.entries()).sort(
    (a, b) => b[1] - a[1],
  )[0];

  return {
    amountCents: primaryRevenue?.[1] || 0,
    currencyCode: primaryRevenue?.[0] || "USD",
    orderCount,
  };
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  const shop = session.shop;
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const analyticsDelegate = prisma.analyticsEvent;

  const eventsPromise: Promise<AnalyticsEventSummary[]> = analyticsDelegate
    ? analyticsDelegate
        .findMany({
          where: { shop, createdAt: { gte: since } },
          orderBy: { createdAt: "desc" },
          take: 5000,
          select: {
            eventType: true,
            productId: true,
            productTitle: true,
            productPriceCents: true,
            currencyCode: true,
            countryCode: true,
          },
        })
        .catch(() =>
          analyticsDelegate
            .findMany({
              where: { shop, createdAt: { gte: since } },
              orderBy: { createdAt: "desc" },
              take: 5000,
              select: {
                eventType: true,
                productId: true,
                countryCode: true,
              },
            })
            .then((rows) => rows as AnalyticsEventSummary[])
            .catch(() => []),
        )
    : Promise.resolve([]);

  const [totalRules, activeRules, settings, events] = await Promise.all([
    prisma.deliveryRule.count({ where: { shop } }),
    prisma.deliveryRule.count({ where: { shop, isActive: true } }),
    prisma.appSetting.findUnique({ where: { shop } }),
    eventsPromise,
  ]);

  const countEvent = (eventType: string) =>
    events.filter((event) => event.eventType === eventType).length;
  const productCounts = new Map<string, number>();
  const eventProductMetadata = new Map<string, ProductMetadata>();
  const countryCounts = new Map<string, number>();

  events.forEach((event) => {
    if (event.eventType === "view" && event.productId) {
      productCounts.set(event.productId, (productCounts.get(event.productId) || 0) + 1);
    }
    if (event.productId) {
      const current = eventProductMetadata.get(event.productId) || {};
      eventProductMetadata.set(event.productId, {
        title: current.title || event.productTitle || undefined,
        priceCents:
          current.priceCents ??
          event.productPriceCents ??
          undefined,
        currencyCode: current.currencyCode || event.currencyCode || undefined,
      });
    }
    if (event.countryCode) {
      countryCounts.set(event.countryCode, (countryCounts.get(event.countryCode) || 0) + 1);
    }
  });

  const views = countEvent("view");
  const hovers = countEvent("hover");
  const clicks = countEvent("click");
  const addToCart = countEvent("add_to_cart");
  const engagementRate = views ? (((hovers + clicks) / views) * 100).toFixed(2) : "0.00";
  const clickThroughRate = views ? ((clicks / views) * 100).toFixed(2) : "0.00";
  const addToCartRate = views ? ((addToCart / views) * 100).toFixed(2) : "0.00";
  const topProducts = Array.from(productCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([productId, count]) => ({ productId, count }));

  const productIdsForMetadata = Array.from(
    new Set(topProducts.map((product) => product.productId)),
  );
  const [shopifyProductMetadata, orderRevenue] = await Promise.all([
    fetchProductMetadata(admin as AdminGraphqlClient, productIdsForMetadata),
    fetchOrderRevenue(admin as AdminGraphqlClient, since),
  ]);
  const metadataForProduct = (productId: string) => {
    const stored = eventProductMetadata.get(productId) || {};
    const shopify = shopifyProductMetadata.get(productId) || {};

    return {
      title: stored.title || shopify.title,
      priceCents: stored.priceCents ?? shopify.priceCents,
      currencyCode: stored.currencyCode || shopify.currencyCode,
    };
  };

  const estimatedSavedMinutes = Math.max(
    0,
    Math.round((views * 30 + clicks * 20 + addToCart * 45 + countEvent("country_change") * 20) / 60),
  );

  return data({
    shop,
    totalRules,
    activeRules,
    isEnabled: settings?.isEnabled ?? false,
    widgetStyle: settings?.widgetStyle ?? "modern",
    analytics: {
      views,
      hovers,
      clicks,
      addToCart,
      countryChanges: countEvent("country_change"),
      engagementRate,
      clickThroughRate,
      addToCartRate,
      revenue: formatMoney(orderRevenue.amountCents, orderRevenue.currencyCode),
      revenueCurrency: orderRevenue.currencyCode,
      orderCount: orderRevenue.orderCount,
      revenueUnavailableReason: orderRevenue.unavailableReason,
      estimatedSavedMinutes,
      topProducts: topProducts.map((product) => ({
        ...product,
        title: metadataForProduct(product.productId).title ||
          `Product ${shortProductId(product.productId)}`,
      })),
      customersByCountry: Array.from(countryCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([countryCode, count]) => ({ countryCode, count })),
    },
  });
};

// ─── Mini chart (SVG sparkline) ────────────────────────────────────────────────
function SparkLine({ color = "#22c55e" }: { color?: string }) {
  const points = "10,40 60,38 110,42 160,35 210,38 260,40 310,36 360,40";
  return (
    <svg viewBox="0 0 370 50" className="w-full h-12" preserveAspectRatio="none">
      <polyline fill="none" stroke={color} strokeWidth="2" points={points} />
      <polyline
        fill={`${color}20`}
        stroke="none"
        points={`10,50 ${points} 360,50`}
      />
    </svg>
  );
}

// ─── Stat Card ──────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <span className="text-xs text-gray-500 font-medium">{label}</span>
      <span className="text-2xl font-bold text-gray-900">{value}</span>
    </div>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { totalRules, activeRules, isEnabled, widgetStyle, analytics } =
    useLoaderData<typeof loader>();

  const [dateRange] = useState("Last 7 days");
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const countStats = [
    { label: "Total Rules", value: totalRules },
    { label: "Active rules", value: activeRules },
    { label: "Views", value: analytics.views },
    { label: "Hovers", value: analytics.hovers },
    { label: "Clicks", value: analytics.clicks },
    { label: "Add to cart", value: analytics.addToCart },
  ];

  const yLabels = ["1.0","0.9","0.8","0.7","0.6","0.5","0.4","0.3","0.2","0.1","0"];

  return (
    <div className="min-h-screen bg-[#f6f6f7] p-4 md:p-6 font-sans">
      <div className="mx-auto max-w-6xl space-y-4">

      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Analytics Dashboard</h1>
          <div className="flex items-center gap-2">
            <span className={`flex h-2 w-2 rounded-full ${isEnabled ? "bg-green-500 animate-pulse" : "bg-amber-500"}`} />
            <Text variant="bodySm" tone="subdued" as="p">
              Storefront events and order insights
            </Text>
          </div>
        </div>
      </div>

      {/* ─── Upgrade Banner ─────────────────────────────────────────────────── */}
      {!bannerDismissed && (
        <div className="flex items-start justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <div className="flex items-start gap-2">
            <span className="text-amber-500 text-base">⚠️</span>
            <div>
              <p className="text-sm font-semibold text-amber-800">
                Unlock analytic dashboard
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Get advanced ETA insights and detailed reports by upgrading your plan
              </p>
              <button className="mt-2 inline-flex h-9 items-center justify-center rounded-xl bg-amber-500 px-3 text-xs font-bold text-white transition-colors hover:bg-amber-600">
                Upgrade now
              </button>
            </div>
          </div>
          <button
            onClick={() => setBannerDismissed(true)}
            className="text-amber-400 hover:text-amber-600 text-lg leading-none"
          >
            ✕
          </button>
        </div>
      )}

      {/* ─── Date Filter ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <button className="inline-flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border border-gray-200 bg-white px-3 text-xs font-bold text-gray-700 shadow-sm transition-colors hover:bg-gray-50">
          <span>📅</span>
          <span>{dateRange}</span>
          <span className="text-gray-400 text-xs">▾</span>
        </button>
        <span className="text-xs text-gray-400">Analytics are based on storefront events from the last 7 days</span>
      </div>

      {/* ─── Revenue & Time Saved ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500 font-medium mb-1">Revenue</p>
          {analytics.revenueUnavailableReason ? (
            <>
              <p className="text-2xl font-bold text-amber-700">Unavailable</p>
              <p className="text-xs text-amber-700 mt-1">
                {analytics.revenueUnavailableReason === "order_access_denied"
                  ? "Order API access is blocked by Shopify protected customer data settings."
                  : "Shopify Orders API could not be loaded."}
              </p>
            </>
          ) : (
            <>
              <p className="text-3xl font-bold text-gray-900">
                {analytics.revenue}{" "}
                <span className="text-base font-normal text-gray-400">
                  {analytics.revenueCurrency}
                </span>
              </p>
              <p className="text-xs text-gray-400 mt-1">
                From {analytics.orderCount} Shopify orders
              </p>
            </>
          )}
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500 font-medium mb-1">Estimated saved time</p>
          <p className="text-3xl font-bold text-gray-900">
            {analytics.estimatedSavedMinutes}{" "}
            <span className="text-base font-normal text-gray-400">Min</span>
          </p>
        </div>
      </div>

      {/* ─── Rate Metrics ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <StatCard label="Engagement rate" value={`${analytics.engagementRate} %`} />
        <StatCard label="Click-through rate" value={`${analytics.clickThroughRate} %`} />
        <StatCard label="Add to cart rate" value={`${analytics.addToCartRate} %`} />
      </div>

      {/* ─── Count Stats ──────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4 divide-x divide-gray-100">
          {countStats.map((item) => (
            <div key={item.label} className="pl-4 first:pl-0 flex flex-col gap-1">
              <span className="text-xs text-gray-400 font-medium">{item.label}</span>
              <span className="text-xl font-bold text-gray-900">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Chart: Hover by device type ──────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <p className="text-sm font-semibold text-gray-700 mb-3">Hover by device type</p>
        <div className="flex gap-2">
          {/* Y-labels */}
          <div className="flex flex-col justify-between py-1 text-right">
            {yLabels.map((v) => (
              <span key={v} className="text-[10px] text-gray-300">{v}</span>
            ))}
          </div>
          {/* Chart area */}
          <div className="flex-1 flex flex-col justify-between">
            {yLabels.map((v) => (
              <div key={v} className="border-b border-gray-100 h-4" />
            ))}
            <SparkLine color="#3b82f6" />
          </div>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-1.5">
            <span className="w-6 h-0.5 bg-blue-500 inline-block" />
            <span className="text-xs text-gray-500">Desktop</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-6 h-0.5 bg-gray-400 inline-block" />
            <span className="text-xs text-gray-500">Mobile</span>
          </div>
        </div>
      </div>

      {/* ─── Bottom panels ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-gray-700 mb-3">Top selling ETA products</p>
          {analytics.topProducts.length === 0 ? (
            <div className="flex items-center justify-center h-28 text-xs text-gray-400">
              There was no data found for this date range
            </div>
          ) : (
            <div className="space-y-2">
              {analytics.topProducts.map((item) => (
                <div key={item.productId} className="flex items-center justify-between text-xs">
                  <span className="font-medium text-gray-700 truncate pr-3" title={item.productId}>
                    {item.title}
                  </span>
                  <span className="text-gray-500">{item.count} views</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-gray-700 mb-3">Customers by country</p>
          {analytics.customersByCountry.length === 0 ? (
            <div className="flex items-center justify-center h-28 text-xs text-gray-400">
              There was no data found for this date range
            </div>
          ) : (
            <div className="space-y-2">
              {analytics.customersByCountry.map((item) => (
                <div key={item.countryCode} className="flex items-center justify-between text-xs">
                  <span className="font-medium text-gray-700">{item.countryCode}</span>
                  <span className="text-gray-500">{item.count} events</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── App Status ───────────────────────────────────────────────────────── */}
      <div className={`flex items-center gap-3 rounded-2xl border p-4 shadow-sm ${
        isEnabled ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
      }`}>
        <span className="text-lg">{isEnabled ? "✅" : "⚡"}</span>
        <div className="flex-1">
          <p className={`text-sm font-semibold ${isEnabled ? "text-green-800" : "text-red-700"}`}>
            {isEnabled ? "Widget is Active" : "Widget is Disabled"}
          </p>
          <p className="text-xs text-gray-500">
            Style: <strong>{widgetStyle}</strong> · Active rules:{" "}
            <strong>{activeRules}</strong> of <strong>{totalRules}</strong>
          </p>
        </div>
        <a href="/app/settings" className="inline-flex h-9 items-center justify-center rounded-xl border border-gray-200 bg-white px-3 text-xs font-bold text-gray-600 shadow-sm hover:bg-gray-50">
          Configure →
        </a>
      </div>

      {/* ─── Footer Links ─────────────────────────────────────────────────────── */}
      <div className="mx-auto mt-6 max-w-6xl space-y-3 border-t border-gray-100 py-6 text-center">
        <div className="space-y-0.5">
          <h3 className="text-sm font-bold text-gray-800">Direct Support</h3>
          <p className="text-xs text-gray-400">Our team is available to help you with custom setups.</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            href="mailto:support@bluepeaks.top"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-xs font-bold text-gray-600 shadow-sm transition-colors hover:bg-gray-50"
          >
            <div className="h-3.5 w-3.5"><Icon source={ChatIcon} /></div>
            Email Support
          </a>
          <button
            type="button"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-green-100 bg-green-50 px-3 text-xs font-bold text-green-700 shadow-sm transition-colors hover:bg-green-100"
          >
            <div className="h-3.5 w-3.5"><Icon source={ChatIcon} /></div>
            WhatsApp
          </button>
          <button className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 text-xs font-bold text-red-600 transition-colors hover:bg-red-100">
            <div className="h-3.5 w-3.5"><Icon source={CheckCircleIcon} /></div>
            Leave a Review
          </button>
        </div>
        <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-gray-300">(c) 2025 BluePeaks - All Rights Reserved</p>
      </div>

      </div>
    </div>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
