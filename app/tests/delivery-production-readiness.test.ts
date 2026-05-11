import type { DeliveryRule, Widget } from "@prisma/client";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import {
  buildFallbackBlocks,
  DEFAULT_SHIPPING_MESSAGE,
  normalizeCutoffTime,
  normalizeCollectionIds,
  normalizeCountries,
  normalizeHolidayDates,
  normalizePolicyItems,
  normalizeProductIds,
  normalizeStepItems,
  normalizeTags,
  normalizeTimerSeconds,
  normalizeVisibilityMode,
  normalizeTrustBadges,
  parseBlockConfigs,
  selectDeliveryRule,
  selectWidget,
} from "../lib/delivery";

function widget(overrides: Partial<Widget>): Widget {
  return {
    id: "widget",
    shop: "shop.myshopify.com",
    name: "Widget",
    isDefault: false,
    isActive: true,
    isReusable: true,
    sourceWidgetId: null,
    sourceTemplateId: null,
    requiredPlan: "free",
    targetCountries: null,
    targetProducts: null,
    targetTags: null,
    widgetStyle: "custom",
    customBlocks: null,
    textColor: "#000000",
    iconColor: "#0033cc",
    bgColor: "#ffffff",
    borderColor: "#e5e7eb",
    borderRadius: 10,
    shadow: "none",
    glassmorphism: false,
    padding: 16,
    bgGradient: null,
    showTimeline: true,
    policyText: null,
    headerText: null,
    subHeaderText: null,
    step1Label: null,
    step1SubText: null,
    step1Icon: null,
    step2Label: null,
    step2SubText: null,
    step2Icon: null,
    step3Label: null,
    step3SubText: null,
    step3Icon: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

function rule(overrides: Partial<DeliveryRule>): DeliveryRule {
  return {
    id: "rule",
    shop: "shop.myshopify.com",
    ruleName: "Delivery rule",
    countryCode: "ALL",
    targetCountries: null,
    marketId: null,
    marketName: null,
    widgetId: null,
    targetProducts: null,
    targetCollections: null,
    targetTags: null,
    inventoryStatus: "both",
    minDays: 3,
    maxDays: 7,
    processingDays: 1,
    shippingMessage: DEFAULT_SHIPPING_MESSAGE,
    cutoffEnabled: false,
    cutoffTime: "17:00",
    cutoffTimezone: "UTC",
    holidayDates: null,
    visibilityMode: "visible",
    timerSeconds: 8100,
    dateLocale: "en-AU",
    isActive: true,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

describe("delivery production helpers", () => {
  it("normalizes country and tag targeting before save/read", () => {
    expect(normalizeCountries(["us", " VN ", "bad", "US"])).toEqual(["US", "VN"]);
    expect(normalizeProductIds(["gid://shopify/Product/123", " 456 ", "123"])).toEqual([
      "123",
      "456",
    ]);
    expect(normalizeCollectionIds(["gid://shopify/Collection/123", " 456 ", "123"])).toEqual([
      "123",
      "456",
    ]);
    expect(normalizeTags([" VIP ", "vip", "Pre Order"])).toEqual(["vip", "pre order"]);
  });

  it("normalizes operational rule settings", () => {
    expect(normalizeCutoffTime("18:30")).toBe("18:30");
    expect(normalizeCutoffTime("25:00")).toBe("17:00");
    expect(normalizeHolidayDates("2026-01-01\nbad\n2026-12-25")).toEqual([
      "2026-01-01",
      "2026-12-25",
    ]);
    expect(normalizeVisibilityMode("hidden")).toBe("hidden");
    expect(normalizeVisibilityMode("bad")).toBe("visible");
    expect(normalizeTimerSeconds("90000")).toBe(86400);
  });

  it("builds fallback blocks from the shipping message and default step fields", () => {
    const blocks = buildFallbackBlocks({}, DEFAULT_SHIPPING_MESSAGE);

    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toMatchObject({
      type: "header",
      settings: { text: DEFAULT_SHIPPING_MESSAGE },
    });
    expect(blocks[1]).toMatchObject({
      type: "steps",
      settings: {
        step1SubText: "{order_date}",
        step2SubText: "{ship_date}",
        step3SubText: "{max_date}",
      },
    });
  });

  it("parses advanced V1 blocks and drops unsupported block types", () => {
    const blocks = parseBlockConfigs([
      { id: "promise", type: "promise_card", settings: { title: "Get it by {max_date}" } },
      { id: "policy", type: "policy_accordion", settings: { items: [] } },
      { id: "bad", type: "raw_script", settings: {} },
    ]);

    expect(blocks.map((block) => block.type)).toEqual(["promise_card", "policy_accordion"]);
  });

  it("normalizes flexible steps and keeps legacy step fields working", () => {
    expect(
      normalizeStepItems({
        items: [
          { id: "a", label: "Packed", subText: "{order_date}", icon: "bag", bgColor: "#fff" },
          { id: "b", label: "Delivered", subText: "{max_date}", icon: "map_pin" },
        ],
      }),
    ).toMatchObject([
      { id: "a", label: "Packed", subText: "{order_date}", icon: "bag", bgColor: "#fff" },
      { id: "b", label: "Delivered", subText: "{max_date}", icon: "map_pin", bgColor: "" },
    ]);

    expect(
      normalizeStepItems({
        step1Label: "Legacy order",
        step1SubText: "Today",
        step1Icon: "bag",
      })[0],
    ).toMatchObject({ label: "Legacy order", subText: "Today", icon: "bag" });
  });

  it("normalizes trust badge and policy accordion item schemas", () => {
    expect(normalizeTrustBadges({ badges: ["shield", { id: "b2", icon: "truck", label: "Fast" }] })).toMatchObject([
      { id: "trust-1", icon: "shield", label: "", subText: "" },
      { id: "b2", icon: "truck", label: "Fast", subText: "" },
    ]);

    expect(
      normalizePolicyItems({
        items: [{ id: "p1", title: "Returns", body: "30 days", icon: "shield" }],
      }),
    ).toMatchObject([{ id: "p1", title: "Returns", body: "30 days", icon: "shield" }]);
  });

  it("selects widgets by country, then tag, then default, then match-all", () => {
    const defaultWidget = widget({ id: "default", isDefault: true });
    const productWidget = widget({ id: "product", targetProducts: ["123"] });
    const tagWidget = widget({ id: "tag", targetTags: ["vip"] });
    const countryWidget = widget({ id: "country", targetCountries: ["US"] });
    const matchAllWidget = widget({ id: "match-all" });

    expect(
      selectWidget([defaultWidget, tagWidget, countryWidget, productWidget], "US", ["vip"], "123")?.id,
    ).toBe("product");
    expect(
      selectWidget([defaultWidget, tagWidget, countryWidget, matchAllWidget], "US", ["vip"])?.id,
    ).toBe("country");
    expect(selectWidget([defaultWidget, tagWidget, matchAllWidget], "CA", ["VIP"])?.id).toBe(
      "tag",
    );
    expect(selectWidget([defaultWidget, matchAllWidget], "CA", [])?.id).toBe("default");
    expect(selectWidget([matchAllWidget], "CA", [])?.id).toBe("match-all");
  });

  it("selects delivery rules by product, then collection, then tag, then country, then rest of world", () => {
    const restOfWorldRule = rule({ id: "rest", countryCode: "ALL" });
    const countryRule = rule({ id: "country", countryCode: "US" });
    const tagRule = rule({ id: "tag", countryCode: "US", targetTags: ["vip"] });
    const collectionRule = rule({ id: "collection", countryCode: "US", targetCollections: ["987"] });
    const productRule = rule({ id: "product", countryCode: "US", targetProducts: ["123"] });
    const marketRule = rule({
      id: "market",
      countryCode: "ALL",
      targetCountries: ["CA", "MX"],
      marketId: "gid://shopify/Market/1",
      marketName: "North America",
    });
    const broadCountryGroupRule = rule({
      id: "broad-country-group",
      countryCode: "ALL",
      targetCountries: ["US", "CA", "MX", "GB", "AU"],
    });
    const narrowCountryGroupRule = rule({
      id: "narrow-country-group",
      countryCode: "ALL",
      targetCountries: ["US", "CA"],
    });

    expect(
      selectDeliveryRule([restOfWorldRule, countryRule, tagRule, collectionRule, productRule], "US", ["vip"], "123", ["987"])?.id,
    ).toBe("product");
    expect(
      selectDeliveryRule([restOfWorldRule, countryRule, tagRule, collectionRule], "US", ["VIP"], "", ["987"])?.id,
    ).toBe("collection");
    expect(selectDeliveryRule([restOfWorldRule, countryRule, tagRule], "US", ["VIP"])?.id).toBe(
      "tag",
    );
    expect(selectDeliveryRule([restOfWorldRule, countryRule], "US", [])?.id).toBe("country");
    expect(selectDeliveryRule([restOfWorldRule, marketRule], "CA", [])?.id).toBe("market");
    expect(selectDeliveryRule([marketRule, restOfWorldRule], "FR", [])?.id).toBe("rest");
    expect(selectDeliveryRule([restOfWorldRule], "CA", [])?.id).toBe("rest");
    expect(selectDeliveryRule([broadCountryGroupRule, narrowCountryGroupRule], "US", [])?.id).toBe(
      "narrow-country-group",
    );
    expect(selectDeliveryRule([narrowCountryGroupRule, countryRule], "US", [])?.id).toBe(
      "country",
    );
  });

  it("prefers delivery rules that match the current inventory status", () => {
    const bothRule = rule({ id: "both", countryCode: "US", inventoryStatus: "both" });
    const inStockRule = rule({ id: "in-stock", countryCode: "US", inventoryStatus: "in_stock" });
    const outOfStockContinueRule = rule({
      id: "out-continue",
      countryCode: "US",
      inventoryStatus: "out_of_stock_continue",
    });

    expect(selectDeliveryRule([bothRule, inStockRule], "US", [], "", [], "in_stock")?.id).toBe(
      "in-stock",
    );
    expect(
      selectDeliveryRule([bothRule, inStockRule, outOfStockContinueRule], "US", [], "", [], "out_of_stock_continue")?.id,
    ).toBe("out-continue");
    expect(selectDeliveryRule([inStockRule, bothRule], "US", [], "", [], "unknown")?.id).toBe(
      "both",
    );
  });
});

describe("storefront embed sanitization", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    window.localStorage.clear();
    vi.restoreAllMocks();
    delete (window as Window & { __bpDeliveryLoaded?: boolean }).__bpDeliveryLoaded;
    delete (window as Window & { Shopify?: unknown }).Shopify;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders merchant text as text nodes instead of executable HTML", async () => {
    document.body.innerHTML = `
      <div id="bp-delivery-block-content" data-shop="shop.myshopify.com" data-product-id="1" data-product-tags="vip" style="display:none">
        <div class="bp-skeleton"></div>
      </div>
    `;

    const payload = {
      enabled: true,
      orderDate: "Jan 1",
      shipDate: "Jan 2",
      minDate: "Jan 3",
      maxDate: "Jan 4",
      shippingMessage: "<script>window.__xss = true</script>",
      settings: {
        textColor: "#111111",
        iconColor: "#222222",
        bgColor: "#ffffff",
        borderColor: "#eeeeee",
        borderRadius: 8,
        padding: 16,
        customBlocks: [
          {
            id: "malicious",
            type: "header",
            settings: {
              text: '<img src=x onerror="window.__xss = true"> {countdown}',
              icon: "bag",
            },
          },
          {
            id: "ignored-html",
            type: "html",
            settings: {
              code: '<script>window.__xss = true</script>',
            },
          },
        ],
      },
    };

    (window as unknown as { fetch: typeof fetch }).fetch = vi.fn().mockResolvedValue({
      json: async () => payload,
    });

    const script = fs.readFileSync(
      path.join(process.cwd(), "extensions/bp-estimated-delivery/assets/bp-delivery-embed.js"),
      "utf8",
    );
    window.eval(script);
    await new Promise((resolve) => setTimeout(resolve, 0));

    const container = document.getElementById("bp-delivery-block-content");
    expect(container?.querySelector("script")).toBeNull();
    expect(container?.querySelector("img[src='x']")).toBeNull();
    expect(container?.textContent).toContain('<img src=x onerror="window.__xss = true">');
    expect((window as Window & { __xss?: boolean }).__xss).toBeUndefined();
  });

  it("renders advanced block text safely without raw merchant HTML", async () => {
    document.body.innerHTML = `
      <div id="bp-delivery-block-content" data-shop="shop.myshopify.com" data-product-id="1" data-product-tags="vip" style="display:none">
        <div class="bp-skeleton"></div>
      </div>
    `;

    const malicious = '<img src=x onerror="window.__xss = true">';
    const payload = {
      enabled: true,
      orderDate: "Jan 1",
      shipDate: "Jan 2",
      minDate: "Jan 3",
      maxDate: "Jan 4",
      settings: {
        textColor: "#111111",
        iconColor: "#222222",
        bgColor: "#ffffff",
        borderColor: "#eeeeee",
        borderRadius: 8,
        padding: 16,
        customBlocks: [
          {
            id: "steps",
            type: "steps",
            settings: {
              items: [
                { id: "s1", label: malicious, subText: "<script>window.__xss = true</script>", icon: "bag" },
                { id: "s2", label: "Delivered", subText: "{max_date}", icon: "map_pin" },
              ],
            },
          },
          {
            id: "promise",
            type: "promise_card",
            settings: { title: malicious, subtitle: "<script>window.__xss = true</script>", badgeText: "Safe" },
          },
          {
            id: "policy",
            type: "policy_accordion",
            settings: { items: [{ id: "p1", title: malicious, body: "<script>window.__xss = true</script>", icon: "shield" }] },
          },
          {
            id: "trust",
            type: "trust_badges",
            settings: { badges: [{ id: "b1", icon: "shield", label: malicious, subText: "<script>window.__xss = true</script>" }] },
          },
        ],
      },
    };

    (window as unknown as { fetch: typeof fetch }).fetch = vi.fn().mockResolvedValue({
      json: async () => payload,
    });

    const script = fs.readFileSync(
      path.join(process.cwd(), "extensions/bp-estimated-delivery/assets/bp-delivery-embed.js"),
      "utf8",
    );
    window.eval(script);
    await new Promise((resolve) => setTimeout(resolve, 0));

    const container = document.getElementById("bp-delivery-block-content");
    expect(container?.querySelector("script")).toBeNull();
    expect(container?.querySelector("img[src='x']")).toBeNull();
    expect(container?.textContent).toContain(malicious);
    expect(container?.textContent).toContain("<script>window.__xss = true</script>");
    expect((window as Window & { __xss?: boolean }).__xss).toBeUndefined();
  });

  it("renders countdown from timerFormat only when timer text is missing", async () => {
    document.body.innerHTML = `
      <div id="bp-delivery-block-content" data-shop="shop.myshopify.com" data-product-id="1" data-product-tags="" style="display:none">
        <div class="bp-skeleton"></div>
      </div>
    `;

    const payload = {
      enabled: true,
      orderDate: "Jan 1",
      shipDate: "Jan 2",
      minDate: "Jan 3",
      maxDate: "Jan 4",
      settings: {
        customBlocks: [
          {
            id: "timer",
            type: "timer",
            settings: { timerFormat: "{countdown}" },
          },
        ],
      },
    };

    (window as unknown as { fetch: typeof fetch }).fetch = vi.fn().mockResolvedValue({
      json: async () => payload,
    });

    const script = fs.readFileSync(
      path.join(process.cwd(), "extensions/bp-estimated-delivery/assets/bp-delivery-embed.js"),
      "utf8",
    );
    window.eval(script);
    await new Promise((resolve) => setTimeout(resolve, 0));

    const timerValue = document.querySelector(".bp-timer-val");
    expect(timerValue?.textContent).toMatch(/\d{2}:\d{2}:\d{2}/);
  });

  it("uses the rule countdown duration returned by the app proxy", async () => {
    document.body.innerHTML = `
      <div id="bp-delivery-block-content" data-shop="shop.myshopify.com" data-product-id="1" data-product-tags="" style="display:none">
        <div class="bp-skeleton"></div>
      </div>
    `;

    const payload = {
      enabled: true,
      orderDate: "Jan 1",
      shipDate: "Jan 2",
      minDate: "Jan 3",
      maxDate: "Jan 4",
      countdownSeconds: 60,
      settings: {
        customBlocks: [
          {
            id: "timer",
            type: "timer",
            settings: { timerFormat: "{countdown}" },
          },
        ],
      },
    };

    (window as unknown as { fetch: typeof fetch }).fetch = vi.fn().mockResolvedValue({
      json: async () => payload,
    });

    const script = fs.readFileSync(
      path.join(process.cwd(), "extensions/bp-estimated-delivery/assets/bp-delivery-embed.js"),
      "utf8",
    );
    window.eval(script);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(document.querySelector(".bp-timer-val")?.textContent).toBe("00:00:59");
  });

  it("keeps the timer text blank when merchant explicitly clears it", async () => {
    document.body.innerHTML = `
      <div id="bp-delivery-block-content" data-shop="shop.myshopify.com" data-product-id="1" data-product-tags="" style="display:none">
        <div class="bp-skeleton"></div>
      </div>
    `;

    const payload = {
      enabled: true,
      orderDate: "Jan 1",
      shipDate: "Jan 2",
      minDate: "Jan 3",
      maxDate: "Jan 4",
      settings: {
        customBlocks: [
          {
            id: "timer",
            type: "timer",
            settings: { text: "", timerFormat: "{countdown}" },
          },
        ],
      },
    };

    (window as unknown as { fetch: typeof fetch }).fetch = vi.fn().mockResolvedValue({
      json: async () => payload,
    });

    const script = fs.readFileSync(
      path.join(process.cwd(), "extensions/bp-estimated-delivery/assets/bp-delivery-embed.js"),
      "utf8",
    );
    window.eval(script);
    await new Promise((resolve) => setTimeout(resolve, 0));

    const label = document.querySelector(".bp-timer .bp-text-label");
    expect(label?.textContent).toBe("");
  });

  it("passes the product inventory status to the delivery app proxy", async () => {
    document.body.innerHTML = `
      <div id="bp-delivery-block-content" data-shop="shop.myshopify.com" data-product-id="1" data-product-tags="" data-inventory-status="out_of_stock_continue" style="display:none">
        <div class="bp-skeleton"></div>
      </div>
    `;

    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({
        enabled: false,
        countryCode: "ALL",
        reason: "disabled_or_missing_config",
      }),
    });
    (window as unknown as { fetch: typeof fetch }).fetch = fetchMock;

    const script = fs.readFileSync(
      path.join(process.cwd(), "extensions/bp-estimated-delivery/assets/bp-delivery-embed.js"),
      "utf8",
    );
    window.eval(script);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain("inventory_status=out_of_stock_continue");
  });

  it("detects the visitor country from Shopify browsing context before requesting delivery rules", async () => {
    document.body.innerHTML = `
      <div id="bp-delivery-block-content" data-shop="shop.myshopify.com" data-product-id="1" data-product-tags="" style="display:none">
        <div class="bp-skeleton"></div>
      </div>
    `;
    (window as Window & { Shopify?: unknown }).Shopify = {
      country: "VN",
      routes: { root: "/" },
    };

    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (String(url).startsWith("/browsing_context_suggestions.json")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            detected_values: {
              country: { handle: "GB", name: "United Kingdom" },
            },
          }),
        });
      }

      return Promise.resolve({
        ok: true,
        json: async () => ({
          enabled: true,
          countryCode: "GB",
          orderDate: "Jan 1",
          shipDate: "Jan 2",
          minDate: "Jan 3",
          maxDate: "Jan 4",
          shippingMessage: "Arrives {min_date} - {max_date}",
          settings: {
            showLocationSelector: true,
            customBlocks: [
              {
                id: "header",
                type: "header",
                settings: { text: "Arrives {min_date} - {max_date}" },
              },
            ],
          },
        }),
      });
    });
    (window as unknown as { fetch: typeof fetch }).fetch = fetchMock;

    const script = fs.readFileSync(
      path.join(process.cwd(), "extensions/bp-estimated-delivery/assets/bp-delivery-embed.js"),
      "utf8",
    );
    window.eval(script);
    await new Promise((resolve) => setTimeout(resolve, 0));
    await new Promise((resolve) => setTimeout(resolve, 0));

    const browsingCalls = fetchMock.mock.calls.filter(([url]) =>
      String(url).startsWith("/browsing_context_suggestions.json"),
    );
    const deliveryCalls = fetchMock.mock.calls.filter(([url]) =>
      String(url).startsWith("/apps/bp-delivery?"),
    );
    expect(browsingCalls).toHaveLength(1);
    expect(deliveryCalls).toHaveLength(1);
    expect(String(deliveryCalls[0][0])).toContain("country=GB");
    expect(document.querySelector(".bp-change-link")?.textContent).toContain("United Kingdom");
    expect(window.localStorage.getItem("bpDeliveryCountry")).toBeNull();
  });

  it("uses the selected shipping country when the location modal is saved", async () => {
    document.body.innerHTML = `
      <div id="bp-delivery-block-content" data-shop="shop.myshopify.com" data-product-id="1" data-product-tags="vip" style="display:none">
        <div class="bp-skeleton"></div>
      </div>
    `;

    const payload = {
      enabled: true,
      countryCode: "ALL",
      orderDate: "Jan 1",
      shipDate: "Jan 2",
      minDate: "Jan 3",
      maxDate: "Jan 4",
      shippingMessage: "Arrives {min_date} - {max_date}",
      settings: {
        customBlocks: [
          {
            id: "header",
            type: "header",
            settings: { text: "Arrives {min_date} - {max_date}" },
          },
        ],
      },
    };

    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => payload,
    });
    (window as unknown as { fetch: typeof fetch }).fetch = fetchMock;

    const script = fs.readFileSync(
      path.join(process.cwd(), "extensions/bp-estimated-delivery/assets/bp-delivery-embed.js"),
      "utf8",
    );
    window.eval(script);
    await new Promise((resolve) => setTimeout(resolve, 0));

    document.querySelector<HTMLButtonElement>(".bp-change-link")?.click();
    const select = document.getElementById("bp-delivery-embed-country-select") as HTMLSelectElement;
    select.value = "US";
    document.getElementById("bp-delivery-embed-modal-save")?.click();
    await new Promise((resolve) => setTimeout(resolve, 0));

    const deliveryCalls = fetchMock.mock.calls.filter(([url]) =>
      String(url).startsWith("/apps/bp-delivery?"),
    );
    expect(deliveryCalls).toHaveLength(2);
    expect(String(deliveryCalls[1][0])).toContain("country=US");
    expect(window.localStorage.getItem("bpDeliveryCountry")).toBe("US");
  });

  it("uses the detected country for the location selector and country placeholders", async () => {
    document.body.innerHTML = `
      <div id="bp-delivery-block-content" data-shop="shop.myshopify.com" data-product-id="1" data-product-tags="vip" style="display:none">
        <div class="bp-skeleton"></div>
      </div>
    `;

    const payload = {
      enabled: true,
      countryCode: "VN",
      orderDate: "Jan 1",
      shipDate: "Jan 2",
      minDate: "Jan 3",
      maxDate: "Jan 4",
      shippingMessage: "Arrives {min_date} - {max_date}",
      settings: {
        customBlocks: [
          {
            id: "header",
            type: "header",
            settings: { text: "Free Shipping to {COUNTRY_FLAG} {COUNTRY_NAME}" },
          },
        ],
      },
    };

    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => payload,
    });
    (window as unknown as { fetch: typeof fetch }).fetch = fetchMock;

    const script = fs.readFileSync(
      path.join(process.cwd(), "extensions/bp-estimated-delivery/assets/bp-delivery-embed.js"),
      "utf8",
    );
    window.eval(script);
    await new Promise((resolve) => setTimeout(resolve, 0));

    const link = document.querySelector<HTMLButtonElement>(".bp-change-link");
    expect(link?.textContent).toContain("Vietnam");
    expect(link?.querySelector("img")?.getAttribute("src")).toContain("flagcdn.com/vn.svg");
    expect(document.body.textContent).toContain("Vietnam");
    expect(document.querySelector(".bp-text-label img")?.getAttribute("src")).toContain(
      "flagcdn.com/vn.svg",
    );

    link?.click();
    const select = document.getElementById("bp-delivery-embed-country-select") as HTMLSelectElement;
    expect(select.value).toBe("VN");
    expect(document.getElementById("bp-delivery-country-select-flag")).toBeNull();
    expect(select.options.length).toBeGreaterThan(200);
    expect(Array.from(select.options).some((option) => option.value === "AD")).toBe(true);
    expect(Array.from(select.options).some((option) => option.textContent?.includes("Vietnam"))).toBe(
      true,
    );
  });

  it("hides the location selector when the widget setting is disabled", async () => {
    document.body.innerHTML = `
      <div id="bp-delivery-block-content" data-shop="shop.myshopify.com" data-product-id="1" data-product-tags="vip" style="display:none">
        <div class="bp-skeleton"></div>
      </div>
    `;

    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({
        enabled: true,
        countryCode: "US",
        orderDate: "Jan 1",
        shipDate: "Jan 2",
        minDate: "Jan 3",
        maxDate: "Jan 4",
        shippingMessage: "Arrives {min_date} - {max_date}",
        settings: {
          showLocationSelector: false,
          customBlocks: [
            {
              id: "header",
              type: "header",
              settings: { text: "Arrives {min_date} - {max_date}" },
            },
          ],
        },
      }),
    });
    (window as unknown as { fetch: typeof fetch }).fetch = fetchMock;

    const script = fs.readFileSync(
      path.join(process.cwd(), "extensions/bp-estimated-delivery/assets/bp-delivery-embed.js"),
      "utf8",
    );
    window.eval(script);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(document.querySelector(".bp-change-link")).toBeNull();
  });

  it("applies location row text flag and alignment settings", async () => {
    document.body.innerHTML = `
      <div id="bp-delivery-block-content" data-shop="shop.myshopify.com" data-product-id="1" data-product-tags="vip" style="display:none">
        <div class="bp-skeleton"></div>
      </div>
    `;

    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({
        enabled: true,
        countryCode: "US",
        orderDate: "Jan 1",
        shipDate: "Jan 2",
        minDate: "Jan 3",
        maxDate: "Jan 4",
        shippingMessage: "Arrives {min_date} - {max_date}",
        settings: {
          showLocationSelector: true,
          locationPrefixText: "Ships to",
          showLocationFlag: false,
          locationRowAlignment: "center",
          customBlocks: [
            {
              id: "header",
              type: "header",
              settings: { text: "Arrives {min_date} - {max_date}" },
            },
          ],
        },
      }),
    });
    (window as unknown as { fetch: typeof fetch }).fetch = fetchMock;

    const script = fs.readFileSync(
      path.join(process.cwd(), "extensions/bp-estimated-delivery/assets/bp-delivery-embed.js"),
      "utf8",
    );
    window.eval(script);
    await new Promise((resolve) => setTimeout(resolve, 0));

    const row = document.querySelector<HTMLElement>(".bp-location-row");
    const link = document.querySelector<HTMLButtonElement>(".bp-change-link");

    expect(row?.style.justifyContent).toBe("center");
    expect(link?.querySelector(".bp-country-link-prefix")?.textContent).toBe("Ships to");
    expect(link?.querySelector(".bp-country-link-country")?.textContent).toBe("United States");
    expect(link?.querySelector(".bp-country-flag")).toBeNull();
  });

  it("prefers the explicit app block when both app embed and app block are present", async () => {
    document.body.innerHTML = `
      <div id="bp-delivery-embed-content" data-shop="shop.myshopify.com" data-product-id="1" data-product-tags="" style="display:none">
        <div class="bp-skeleton"></div>
      </div>
      <div id="bp-delivery-block-content" data-shop="shop.myshopify.com" data-product-id="1" data-product-tags="" style="display:none">
        <div class="bp-skeleton"></div>
      </div>
    `;

    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({
        enabled: false,
        countryCode: "ALL",
        reason: "disabled_or_missing_config",
      }),
    });
    (window as unknown as { fetch: typeof fetch }).fetch = fetchMock;

    const script = fs.readFileSync(
      path.join(process.cwd(), "extensions/bp-estimated-delivery/assets/bp-delivery-embed.js"),
      "utf8",
    );
    window.eval(script);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(document.getElementById("bp-delivery-embed-content")?.getAttribute("data-bp-init")).toBe(
      "skipped",
    );
  });
});
