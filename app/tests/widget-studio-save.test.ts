import { describe, expect, it, vi } from "vitest";
import { saveWidgetStudio } from "../lib/widgetStudio.server";
import type { WidgetStudioDb } from "../lib/widgetStudio.server";
import { PRICING_PLANS } from "../lib/pricing";

type FakeDbResult = {
  created: Record<string, unknown>[];
  updateMany: Record<string, unknown>[];
  updates: Record<string, unknown>[];
  db: WidgetStudioDb;
};

function makeFormData(overrides: Record<string, string> = {}) {
  const formData = new FormData();
  const fields = {
    name: "Default Widget",
    isActive: "true",
    widgetStyle: "custom",
    customBlocks: JSON.stringify([
      { id: "header", type: "header", settings: { text: "Estimated delivery" } },
    ]),
    textColor: "#000000",
    iconColor: "#0033cc",
    bgColor: "#ffffff",
    borderColor: "#e5e7eb",
    borderRadius: "10",
    shadow: "none",
    glassmorphism: "false",
    padding: "16",
    bgGradient: "",
    showTimeline: "true",
    targetCountries: JSON.stringify([]),
    targetProducts: JSON.stringify([]),
    targetTags: JSON.stringify([]),
    saveAsDesign: "false",
    sourceDesignId: "",
    designName: "",
    ...overrides,
  };

  Object.entries(fields).forEach(([key, value]) => formData.append(key, value));
  return formData;
}

function createDb({ sourceExists = true } = {}): FakeDbResult {
  const created: Record<string, unknown>[] = [];
  const updateMany: Record<string, unknown>[] = [];
  const updates: Record<string, unknown>[] = [];

  const fake = {
    created,
    updateMany,
    updates,
    db: {
      widget: {
        create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
          const row = { id: `created-${created.length + 1}`, ...data };
          created.push(row);
          return row;
        }),
        findFirst: vi.fn(async ({ where }: { where: { id: string } }) =>
          sourceExists ? { id: where.id, customBlocks: [], requiredPlan: "free" } : null,
        ),
        update: vi.fn(async (args: Record<string, unknown>) => {
          updates.push(args);
          return { id: "updated" };
        }),
        updateMany: vi.fn(async (args: Record<string, unknown>) => {
          updateMany.push(args);
          return { count: 1 };
        }),
      },
      $transaction: vi.fn(async (queries: Promise<unknown>[]) => Promise.all(queries)),
    },
  };

  return fake as unknown as FakeDbResult;
}

describe("saveWidgetStudio", () => {
  it("creates a saved design when saveAsDesign is true", async () => {
    const { created, db, updateMany } = createDb();

    const result = await saveWidgetStudio({
      db,
      formData: makeFormData({
        saveAsDesign: "true",
        designName: "Flash Sale Timer",
      }),
      id: "default-widget",
      requestUrl: "https://example.com/app/widgets/default-widget",
      shop: "test-shop.myshopify.com",
      currentPlan: PRICING_PLANS.scale,
    });

    expect(result).toMatchObject({
      success: true,
      newId: "created-1",
      savedAsDesign: true,
    });
    expect(updateMany).toHaveLength(1);
    expect(created).toHaveLength(1);
    expect(created[0]).toMatchObject({
      name: "Flash Sale Timer",
      isDefault: false,
      isReusable: true,
      sourceWidgetId: "default-widget",
      shop: "test-shop.myshopify.com",
    });
  });

  it("does not update the source design when saving a rule design", async () => {
    const { created, db, updateMany, updates } = createDb();

    const result = await saveWidgetStudio({
      db,
      formData: makeFormData({
        sourceDesignId: "source-design",
        designName: "Existing Saved Design",
      }),
      id: "default-widget",
      requestUrl: "https://example.com/app/widgets/default-widget",
      shop: "test-shop.myshopify.com",
      currentPlan: PRICING_PLANS.scale,
    });

    expect(result).toMatchObject({
      success: true,
    });
    expect(created).toHaveLength(0);
    expect(updateMany).toHaveLength(1);
    expect(updateMany[0]).toMatchObject({
      where: { id: "default-widget", shop: "test-shop.myshopify.com" },
    });
    expect(updates).toHaveLength(0);
  });

  it("returns an error and skips writes when the widget payload is invalid", async () => {
    const { created, db, updateMany, updates } = createDb();

    const result = await saveWidgetStudio({
      db,
      formData: makeFormData({
        customBlocks: "not-json",
        saveAsDesign: "true",
        designName: "Broken Design",
      }),
      id: "default-widget",
      requestUrl: "https://example.com/app/widgets/default-widget",
      shop: "test-shop.myshopify.com",
      currentPlan: PRICING_PLANS.scale,
    });

    expect(result).toMatchObject({
      error: "Invalid widget payload",
      status: 400,
    });
    expect(created).toHaveLength(0);
    expect(updateMany).toHaveLength(0);
    expect(updates).toHaveLength(0);
  });

  it("blocks premium step presets on the Free plan", async () => {
    const { created, db, updateMany, updates } = createDb();

    const result = await saveWidgetStudio({
      db,
      formData: makeFormData({
        customBlocks: JSON.stringify([
          { id: "steps", type: "steps", settings: { preset: "boxed_cards" } },
        ]),
      }),
      id: "default-widget",
      requestUrl: "https://example.com/app/widgets/default-widget",
      shop: "test-shop.myshopify.com",
      currentPlan: PRICING_PLANS.free,
    });

    expect(result).toMatchObject({
      status: 403,
    });
    expect(result.error).toContain("Growth plan");
    expect(created).toHaveLength(0);
    expect(updateMany).toHaveLength(0);
    expect(updates).toHaveLength(0);
  });
});
