import type { Widget } from "@prisma/client";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import {
  buildFallbackBlocks,
  DEFAULT_SHIPPING_MESSAGE,
  normalizeCountries,
  normalizePolicyItems,
  normalizeProductIds,
  normalizeStepItems,
  normalizeTags,
  normalizeTrustBadges,
  parseBlockConfigs,
  selectWidget,
} from "../lib/delivery";

function widget(overrides: Partial<Widget>): Widget {
  return {
    id: "widget",
    shop: "shop.myshopify.com",
    name: "Widget",
    isDefault: false,
    isActive: true,
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

describe("delivery production helpers", () => {
  it("normalizes country and tag targeting before save/read", () => {
    expect(normalizeCountries(["us", " VN ", "bad", "US"])).toEqual(["US", "VN"]);
    expect(normalizeProductIds(["gid://shopify/Product/123", " 456 ", "123"])).toEqual([
      "123",
      "456",
    ]);
    expect(normalizeTags([" VIP ", "vip", "Pre Order"])).toEqual(["vip", "pre order"]);
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
});

describe("storefront embed sanitization", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    window.localStorage.clear();
    vi.restoreAllMocks();
    delete (window as Window & { __bpDeliveryLoaded?: boolean }).__bpDeliveryLoaded;
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

  it("uses the selected shipping country when the location modal is saved", async () => {
    document.body.innerHTML = `
      <div id="bp-delivery-block-content" data-shop="shop.myshopify.com" data-product-id="1" data-product-tags="vip" style="display:none">
        <div class="bp-skeleton"></div>
      </div>
    `;

    const payload = {
      enabled: true,
      countryCode: "OTHER",
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
        countryCode: "OTHER",
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
