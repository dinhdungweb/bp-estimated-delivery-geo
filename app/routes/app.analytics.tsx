/**
 * BP: Estimated Delivery & Geo — Analytics Dashboard
 * Copyright © 2025 BluePeaks. All rights reserved.
 * https://bluepeaks.top
 *
 * This software is proprietary and confidential.
 * Unauthorized copying, modification, or distribution of this file,
 * via any medium, is strictly prohibited.
 */
import type { LoaderFunctionArgs, HeadersFunction } from "react-router";
import { useLoaderData } from "react-router";
import { data } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { useState } from "react";

// ─── Loader ───────────────────────────────────────────────────────────────────
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const [totalRules, activeRules, settings] = await Promise.all([
    prisma.deliveryRule.count({ where: { shop } }),
    prisma.deliveryRule.count({ where: { shop, isActive: true } }),
    prisma.appSetting.findUnique({ where: { shop } }),
  ]);

  return data({
    shop,
    totalRules,
    activeRules,
    isEnabled: settings?.isEnabled ?? false,
    widgetStyle: settings?.widgetStyle ?? "modern",
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
    <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col gap-1">
      <span className="text-xs text-gray-500 font-medium">{label}</span>
      <span className="text-2xl font-bold text-gray-900">{value}</span>
    </div>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { totalRules, activeRules, isEnabled, widgetStyle } =
    useLoaderData<typeof loader>();

  const [dateRange] = useState("Yesterday");
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const countStats = [
    { label: "Total Rules", value: totalRules },
    { label: "Active rules", value: activeRules },
    { label: "Hovers", value: 0 },
    { label: "Clicks", value: 0 },
    { label: "Add to cart", value: 0 },
    { label: "Orders", value: 0 },
  ];

  const yLabels = ["1.0","0.9","0.8","0.7","0.6","0.5","0.4","0.3","0.2","0.1","0"];

  return (
    <div className="min-h-screen bg-[#f6f6f7] p-4 md:p-6 font-sans">
      <div className="max-w-5xl mx-auto space-y-4">

      {/* ─── Upgrade Banner ─────────────────────────────────────────────────── */}
      {!bannerDismissed && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <span className="text-amber-500 text-base">⚠️</span>
            <div>
              <p className="text-sm font-semibold text-amber-800">
                Unlock analytic dashboard
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Get advanced ETA insights and detailed reports by upgrading your plan
              </p>
              <button className="mt-2 text-xs bg-amber-500 hover:bg-amber-600 text-white px-3 py-1 rounded font-medium transition-colors">
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
        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
          <span>📅</span>
          <span>{dateRange}</span>
          <span className="text-gray-400 text-xs">▾</span>
        </button>
        <span className="text-xs text-gray-400">Analytics are updated every 24 hours</span>
      </div>

      {/* ─── Revenue & Time Saved ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 font-medium mb-1">Revenue</p>
          <p className="text-3xl font-bold text-gray-900">
            $0 <span className="text-base font-normal text-gray-400">USD</span>
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 font-medium mb-1">Total saved time</p>
          <p className="text-3xl font-bold text-gray-900">
            0 <span className="text-base font-normal text-gray-400">Min</span>
          </p>
        </div>
      </div>

      {/* ─── Rate Metrics ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Engagement rate" value="0.00 %" />
        <StatCard label="Click-through rate" value="0.00 %" />
        <StatCard label="Add to cart rate" value="0.00 %" />
      </div>

      {/* ─── Count Stats ──────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
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
      <div className="bg-white rounded-lg border border-gray-200 p-4">
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
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">Top selling ETA products</p>
          <div className="flex items-center justify-center h-28 text-xs text-gray-400">
            There was no data found for this date range
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">Customers by country</p>
          <div className="flex items-center justify-center h-28 text-xs text-gray-400">
            There was no data found for this date range
          </div>
        </div>
      </div>

      {/* ─── App Status ───────────────────────────────────────────────────────── */}
      <div className={`rounded-lg p-3 flex items-center gap-3 border ${
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
        <a href="/app/settings" className="text-xs underline text-gray-500 hover:text-gray-700">
          Configure →
        </a>
      </div>

      {/* ─── Footer Links ─────────────────────────────────────────────────────── */}
      <div className="text-center space-y-3 pt-2">
        <p className="text-xs text-blue-500 hover:underline cursor-pointer">
          Help or Feature request?
        </p>
        <div className="flex items-center justify-center gap-3">
          <a
            href="mailto:support@bluepeaks.top"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            ✉️ Email
          </a>
          <a
            href="https://wa.me/84000000000"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-green-200 text-xs font-medium text-green-600 hover:bg-green-50 transition-colors"
          >
            💬 WhatsApp
          </a>
          <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-red-200 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors">
            ❤️ Love this app?
          </button>
        </div>
      </div>

      </div>
    </div>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
