/**
 * BP: Estimated Delivery Pro - Delivery Rule Editor
 * Copyright (c) 2025 BluePeaks. All rights reserved.
 */
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import type { Prisma, Widget } from "@prisma/client";
import {
  data,
  redirect,
  useActionData,
  useFetcher,
  useLoaderData,
  useLocation,
  useNavigate,
  useNavigation,
  useSubmit,
} from "react-router";
import {
  Badge,
  Banner,
  FormLayout,
  Icon,
  Text,
  TextField,
} from "@shopify/polaris";
import { ArrowLeftIcon, EditIcon, XIcon, ViewIcon, WandIcon } from "@shopify/polaris-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { WidgetPreviewRenderer } from "../components/WidgetRenderer";
import { LockGlyph, UpgradePlanModal } from "../components/UpgradePlanModal";
import {
  ALL_COUNTRIES_CODE,
  buildFallbackBlocks,
  DEFAULT_SHIPPING_MESSAGE,
  INVENTORY_STATUS_OPTIONS,
  inventoryStatusLabel,
  isAllCountriesCode,
  normalizeLocationPrefixText,
  normalizeLocationRowAlignment,
  normalizeCutoffTime,
  normalizeDateLocale,
  normalizeHolidayDates,
  normalizeCollectionIds,
  normalizeCountries,
  normalizeCountry,
  normalizeProductIds,
  normalizeRuleInventoryStatus,
  normalizeTags,
  normalizeTimeZone,
  normalizeVisibilityMode,
  OPERATIONAL_TIMEZONES,
  parseBlockConfigs,
  VISIBILITY_MODE_OPTIONS,
} from "../lib/delivery";
import { TEMPLATE_DEFAULTS } from "../constants/templateDefaults";
import {
  daysLabel,
  getRuleCountryLabel,
  isRuleCountryCode,
  jsonStringArray,
  previewRuleMessage,
  readRulePayload,
  RULE_COUNTRY_GROUPS,
  RULE_DEFAULT_MESSAGE,
} from "../lib/deliveryRules";
import {
  ensureAppSetting,
  ensureDefaultWidget,
  hasDuplicateDeliveryRule,
} from "../lib/deliveryRules.server";
import { widgetCopyData } from "../lib/widgetCopies.server";
import {
  CATEGORIES,
  MAIN_TABS,
  WIDGET_TEMPLATES,
  widgetPreviewSettings,
  type SavedWidget,
  type TemplateCategory,
  type TemplateId,
  type TemplateMainTab,
  type TemplateMeta,
} from "../lib/widgetTemplates";
import { hydrateBlocksForTemplate } from "../lib/widgetStyleSamples";
import {
  canEditWidget,
  canUseTemplate,
  getRequiredPlanForWidget,
  limitExceeded,
  limitLabel,
  requiredPlanForTemplate,
} from "../lib/pricing";
import { syncCurrentPlanForShop } from "../lib/pricing.server";

type RuleEditorRule = {
  id: string;
  ruleName: string;
  countryCode: string;
  targetCountries: unknown;
  marketId: string | null;
  marketName: string | null;
  widgetId: string | null;
  targetProducts: unknown;
  targetCollections: unknown;
  targetTags: unknown;
  inventoryStatus: string;
  minDays: number;
  maxDays: number;
  processingDays: number;
  shippingMessage: string;
  cutoffEnabled: boolean;
  cutoffTime: string;
  cutoffTimezone: string;
  holidayDates: unknown;
  visibilityMode: string;
  timerSeconds: number;
  dateLocale: string;
  isActive: boolean;
};

type ActionResult = {
  error?: string;
  success?: boolean;
  appliedWidgetId?: string;
  appliedWidget?: RuleEditorWidget;
  sourceDesignId?: string;
  designName?: string;
  templateApplied?: boolean;
};

type UpgradeModalState = {
  open: boolean;
  featureName?: string;
  requiredPlanName?: string;
  message?: string;
  upgradeUrl?: string;
};

type AdminGraphqlClient = {
  graphql: (
    query: string,
    options?: { variables?: Record<string, unknown> },
  ) => Promise<Response>;
};

type ShopifyResourcePickerResource = {
  id: string;
  title?: string;
  status?: string;
  images?: Array<{ originalSrc?: string }>;
  image?: { originalSrc?: string } | null;
};

type ShopifyAdminGlobal = {
  resourcePicker?: (options: {
    type: "product" | "collection";
    action?: "add" | "select";
    filter?: {
      variants?: boolean;
    };
    multiple?: boolean;
    selectionIds?: Array<{ id: string }>;
  }) => Promise<ShopifyResourcePickerResource[] | undefined>;
};

type TargetMode = "product" | "collection" | "tag";
type OperationalTab = "timing" | "cutoff" | "holidays" | "visibility";

type RuleEditorWidget = Omit<Widget, "createdAt" | "updatedAt"> & {
  createdAt: string | Date;
  updatedAt: string | Date;
};

type TargetResource = {
  id: string;
  title: string;
  imageUrl?: string;
  status?: string;
};

type TargetResourcesLoadResult = {
  error?: string;
  targetType?: "product" | "collection";
  resources?: TargetResource[];
  nextOffset?: number;
  hasMore?: boolean;
};

type CountrySource = "manual" | "markets";

type ShopifyMarketCountry = {
  code: string;
  name: string;
};

type ShopifyMarketOption = {
  id: string;
  name: string;
  status: string;
  countries: ShopifyMarketCountry[];
};

type CountryRuleTarget = {
  countryCode: string;
  targetCountries: string[];
  marketId?: string | null;
  marketName?: string | null;
};

function isNewRuleId(id: string | undefined) {
  return !id || id === "new";
}

function stringArrayCsv(value: unknown) {
  return jsonStringArray(value).join(", ");
}

function productGid(productId: string) {
  return productId.startsWith("gid://shopify/Product/")
    ? productId
    : `gid://shopify/Product/${productId}`;
}

function collectionGid(collectionId: string) {
  return collectionId.startsWith("gid://shopify/Collection/")
    ? collectionId
    : `gid://shopify/Collection/${collectionId}`;
}

const ALL_MANUAL_COUNTRY_CODES = RULE_COUNTRY_GROUPS.flatMap((group) =>
  group.countries.map((country) => country.value),
).filter((country) => !isAllCountriesCode(country));

function isAllCountrySelection(codes: string[]) {
  if (codes.some(isAllCountriesCode)) return true;
  const selectedCodes = new Set(codes);
  return ALL_MANUAL_COUNTRY_CODES.every((country) => selectedCodes.has(country));
}

function countrySelectionLabel(codes: string[], fallbackCode: string) {
  if (isAllCountrySelection(codes)) return "All countries";
  if (codes.length > 1) return `${codes.length} countries`;
  return getRuleCountryLabel(codes[0] || fallbackCode);
}

function initialCountrySelection(rule: RuleEditorRule | null) {
  if (!rule) return [];
  const targetCountries = normalizeCountries(jsonStringArray(rule?.targetCountries));
  if (targetCountries.length > 0) return targetCountries;
  if (isAllCountriesCode(rule?.countryCode)) return ALL_MANUAL_COUNTRY_CODES;
  return [rule.countryCode].filter(Boolean);
}

function parseSelectedCountryCodes(value: FormDataEntryValue | null) {
  return Array.from(
    new Set(
      String(value ?? "")
        .split(",")
        .map((country) => country.trim())
        .filter(Boolean)
        .map((country) => normalizeCountry(country))
        .filter(isRuleCountryCode),
    ),
  );
}

function buildManualCountryTargets(codes: string[]): CountryRuleTarget[] {
  const normalizedCodes = Array.from(
    new Set(codes.map((country) => normalizeCountry(country)).filter(isRuleCountryCode)),
  );

  if (normalizedCodes.length === 0) return [];
  if (isAllCountrySelection(normalizedCodes)) {
    return [{ countryCode: ALL_COUNTRIES_CODE, targetCountries: [] }];
  }
  if (normalizedCodes.length === 1) {
    return [{ countryCode: normalizedCodes[0], targetCountries: [] }];
  }

  return [{ countryCode: ALL_COUNTRIES_CODE, targetCountries: normalizedCodes.filter((country) => !isAllCountriesCode(country)) }];
}

function parseMarketTargets(value: FormDataEntryValue | null): CountryRuleTarget[] {
  try {
    const selections = JSON.parse(String(value || "[]")) as Array<{
      id?: string;
      name?: string;
      countries?: Array<string | { code?: string }>;
    }>;

    const marketTargets = selections
      .map((selection): CountryRuleTarget | null => {
        const targetCountries = Array.from(
          new Set(
            (selection.countries || [])
              .map((country) => normalizeCountry(typeof country === "string" ? country : country.code))
              .filter((country) => !isAllCountriesCode(country) && isRuleCountryCode(country)),
          ),
        );

        if (!selection.id || targetCountries.length === 0) return null;

        return {
          countryCode: ALL_COUNTRIES_CODE,
          targetCountries,
          marketId: selection.id,
          marketName: String(selection.name || "Shopify Market").trim(),
        };
      })
      .filter((target): target is CountryRuleTarget => Boolean(target));

    if (marketTargets.length <= 1) return marketTargets;

    return [
      {
        countryCode: ALL_COUNTRIES_CODE,
        targetCountries: Array.from(
          new Set(marketTargets.flatMap((target) => target.targetCountries)),
        ),
        marketId: null,
        marketName: `${marketTargets.length} Shopify Markets`,
      },
    ];
  } catch {
    return [];
  }
}

function targetResourceId(resourceId: string) {
  const match = resourceId.match(/\/(?:Product|Collection)\/([^/?]+)$/);
  return match ? match[1] : resourceId;
}

function pickerResourceToTarget(resource: ShopifyResourcePickerResource): TargetResource {
  return {
    id: targetResourceId(resource.id),
    title: resource.title || targetResourceId(resource.id),
    imageUrl: resource.images?.[0]?.originalSrc || resource.image?.originalSrc || "",
    status: resource.status ? resource.status.toLowerCase() : undefined,
  };
}

async function fetchTargetResources(
  admin: AdminGraphqlClient,
  productIds: string[],
  collectionIds: string[],
) {
  const productSourceByGid = new Map<string, string>();
  productIds.forEach((productId) => productSourceByGid.set(productGid(productId), productId));

  const collectionSourceByGid = new Map<string, string>();
  collectionIds.forEach((collectionId) => collectionSourceByGid.set(collectionGid(collectionId), collectionId));

  const ids = [...productSourceByGid.keys(), ...collectionSourceByGid.keys()];
  if (ids.length === 0) return { products: [], collections: [] };

  try {
    const response = await admin.graphql(
      `#graphql
        query DeliveryRuleTargetResources($ids: [ID!]!) {
          nodes(ids: $ids) {
            ... on Product {
              id
              title
              status
              featuredMedia {
                preview {
                  image {
                    url
                  }
                }
              }
            }
            ... on Collection {
              id
              title
              image {
                url
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
          status?: string;
          featuredMedia?: { preview?: { image?: { url?: string } | null } | null } | null;
          image?: { url?: string } | null;
        } | null>;
      };
    };

    const products: TargetResource[] = [];
    const collections: TargetResource[] = [];

    payload.data?.nodes?.forEach((node) => {
      if (!node?.id) return;
      if (productSourceByGid.has(node.id)) {
        products.push({
          id: productSourceByGid.get(node.id) || targetResourceId(node.id),
          title: node.title || targetResourceId(node.id),
          imageUrl: node.featuredMedia?.preview?.image?.url || "",
          status: node.status ? node.status.toLowerCase() : undefined,
        });
      } else if (collectionSourceByGid.has(node.id)) {
        collections.push({
          id: collectionSourceByGid.get(node.id) || targetResourceId(node.id),
          title: node.title || targetResourceId(node.id),
          imageUrl: node.image?.url || "",
          status: "collection",
        });
      }
    });

    return { products, collections };
  } catch {
    return {
      products: productIds.map((id) => ({ id, title: id })),
      collections: collectionIds.map((id) => ({ id, title: id, status: "collection" })),
    };
  }
}

function marketCountryCodes(markets: ShopifyMarketOption[], marketIds: string[]) {
  const selectedMarketIds = new Set(marketIds);
  return Array.from(
    new Set(
      markets
        .filter((market) => selectedMarketIds.has(market.id))
        .flatMap((market) => market.countries.map((country) => normalizeCountry(country.code)))
        .filter((country) => !isAllCountriesCode(country) && isRuleCountryCode(country)),
    ),
  );
}

async function fetchShopifyMarkets(admin: AdminGraphqlClient) {
  try {
    const response = await admin.graphql(
      `#graphql
        query DeliveryRuleShopifyMarkets {
          markets(first: 250) {
            nodes {
              id
              name
              status
              conditions {
                regionsCondition {
                  regions(first: 250) {
                    nodes {
                      id
                      name
                      ... on MarketRegionCountry {
                        code
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `,
    );
    const payload = (await response.json()) as {
      data?: {
        markets?: {
          nodes?: Array<{
            id?: string;
            name?: string;
            status?: string;
            conditions?: {
              regionsCondition?: {
                regions?: {
                  nodes?: Array<{
                    name?: string;
                    code?: string;
                  } | null>;
                };
              } | null;
            } | null;
          } | null>;
        };
      };
      errors?: Array<{ message?: string }>;
    };

    if (payload.errors?.length) {
      return {
        markets: [] as ShopifyMarketOption[],
        error: "Shopify Markets could not be loaded. Add the read_markets scope and reconnect the app, or use manual countries.",
      };
    }

    const markets = (payload.data?.markets?.nodes || [])
      .map((market): ShopifyMarketOption | null => {
        if (!market?.id) return null;
        const countries = (market.conditions?.regionsCondition?.regions?.nodes || [])
          .map((region) => {
            const code = normalizeCountry(region?.code);
            if (isAllCountriesCode(code) || !isRuleCountryCode(code)) return null;
            return {
              code,
              name: region?.name || getRuleCountryLabel(code),
            };
          })
          .filter((country): country is ShopifyMarketCountry => Boolean(country));

        return {
          id: market.id,
          name: market.name || "Untitled market",
          status: market.status || "UNKNOWN",
          countries,
        };
      })
      .filter((market): market is ShopifyMarketOption => market !== null && market.countries.length > 0);

    return { markets, error: "" };
  } catch {
    return {
      markets: [] as ShopifyMarketOption[],
      error: "Shopify Markets could not be loaded. Add the read_markets scope and reconnect the app, or use manual countries.",
    };
  }
}

const BUTTON_BASE =
  "inline-flex h-9 items-center justify-center rounded-xl px-3 text-xs font-bold transition-all disabled:cursor-not-allowed disabled:opacity-60";
const BUTTON_PRIMARY = `${BUTTON_BASE} bg-gray-900 text-white shadow-md shadow-gray-200 hover:bg-black`;
const BUTTON_SECONDARY = `${BUTTON_BASE} border border-gray-200 bg-white text-gray-700 hover:bg-gray-50`;
const TARGET_LIST_PAGE_SIZE = 10;
const OPERATIONAL_TABS: Array<{ id: OperationalTab; label: string }> = [
  { id: "timing", label: "Timing" },
  { id: "cutoff", label: "Cut-off time" },
  { id: "holidays", label: "Holidays" },
  { id: "visibility", label: "Visibility" },
];

function SelectedTargetList({
  items,
  totalCount,
  emptyText,
  onRemove,
  onLoadMore,
  isLoadingMore,
}: {
  items: TargetResource[];
  totalCount?: number;
  emptyText: string;
  onRemove: (id: string) => void;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-sm text-gray-500">
        {emptyText}
      </div>
    );
  }

  const remainingCount = Math.max(0, (totalCount ?? items.length) - items.length);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {items.map((item, index) => (
        <div
          key={item.id}
          className="grid grid-cols-[2rem_3rem_1fr_auto_2rem] items-center gap-3 border-b border-gray-100 px-4 py-3 last:border-b-0"
        >
          <span className="text-right text-sm font-medium text-gray-700">{index + 1}.</span>
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
            {item.imageUrl ? (
              <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-xs font-bold text-gray-400">{item.title.slice(0, 1).toUpperCase()}</span>
            )}
          </div>
          <p className="min-w-0 truncate text-sm font-medium text-gray-900">{item.title}</p>
          <Badge tone={item.status === "draft" ? "attention" : item.status === "archived" ? "critical" : "success"}>
            {item.status === "collection"
              ? "Collection"
              : item.status
                ? item.status.charAt(0).toUpperCase() + item.status.slice(1)
                : "Active"}
          </Badge>
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            aria-label={`Remove ${item.title}`}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-900"
          >
            <span className="h-4 w-4">
              <Icon source={XIcon} />
            </span>
          </button>
        </div>
      ))}
      {remainingCount > 0 && onLoadMore && (
        <div className="flex items-center justify-center border-t border-gray-100 bg-gray-50 px-4 py-3">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className={BUTTON_SECONDARY}
          >
            {isLoadingMore ? "Loading..." : `Load ${Math.min(TARGET_LIST_PAGE_SIZE, remainingCount)} more`}
          </button>
        </div>
      )}
    </div>
  );
}

function CountryPicker({
  selectedCodes,
  onChange,
}: {
  selectedCodes: string[];
  onChange: (codes: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const selectedSet = useMemo(() => new Set(selectedCodes), [selectedCodes]);
  const allCountryCodes = useMemo(
    () => RULE_COUNTRY_GROUPS.flatMap((group) => group.countries.map((country) => country.value)),
    [],
  );
  const normalizedQuery = query.trim().toLowerCase();

  const updateCodes = useCallback((codes: string[]) => {
    const validCodes = new Set(allCountryCodes);
    onChange(Array.from(new Set(codes.filter((code) => validCodes.has(code)))));
  }, [allCountryCodes, onChange]);

  const toggleCountry = useCallback((code: string) => {
    updateCodes(selectedSet.has(code)
      ? selectedCodes.filter((selectedCode) => selectedCode !== code)
      : [...selectedCodes, code]);
  }, [selectedCodes, selectedSet, updateCodes]);

  const toggleGroup = useCallback((countryCodes: string[]) => {
    const groupSelected = countryCodes.every((code) => selectedSet.has(code));
    updateCodes(groupSelected
      ? selectedCodes.filter((code) => !countryCodes.includes(code))
      : [...selectedCodes, ...countryCodes]);
  }, [selectedCodes, selectedSet, updateCodes]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-gray-800">Countries</p>
          <span className="rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-semibold text-yellow-800">
            {selectedCodes.length} selected
          </span>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => updateCodes(allCountryCodes)}
            className={BUTTON_SECONDARY}
          >
            Select All
          </button>
          <button
            type="button"
            onClick={() => updateCodes([])}
            className={BUTTON_SECONDARY}
          >
            Clear All
          </button>
        </div>
      </div>

      <TextField
        label="Search countries"
        labelHidden
        value={query}
        onChange={setQuery}
        autoComplete="off"
        placeholder="Search countries..."
      />

      <div className="max-h-[340px] overflow-y-auto rounded-xl border border-gray-200 bg-white">
        {RULE_COUNTRY_GROUPS.map((group) => {
          const matchingCountries = group.countries.filter((country) => {
            if (!normalizedQuery) return true;
            return (
              country.label.toLowerCase().includes(normalizedQuery) ||
              country.value.toLowerCase().includes(normalizedQuery)
            );
          });
          if (matchingCountries.length === 0) return null;

          const groupCodes = group.countries.map((country) => country.value);
          const visibleCodes = matchingCountries.map((country) => country.value);
          const selectedInGroup = groupCodes.filter((code) => selectedSet.has(code)).length;
          const isOpen = normalizedQuery ? true : Boolean(openGroups[group.name]);
          const allVisibleSelected = visibleCodes.every((code) => selectedSet.has(code));

          return (
            <div key={group.name} className="border-b border-gray-100 last:border-b-0">
              <div className="grid grid-cols-[2rem_2rem_1fr_auto] items-center gap-2 px-4 py-3">
                <button
                  type="button"
                  onClick={() => setOpenGroups((current) => ({ ...current, [group.name]: !isOpen }))}
                  aria-label={`${isOpen ? "Collapse" : "Expand"} ${group.name}`}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    aria-hidden="true"
                    className={`transition-transform ${isOpen ? "rotate-90" : ""}`}
                  >
                    <path d="M5 3.5L8.5 7L5 10.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <div className="flex justify-center">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={() => toggleGroup(visibleCodes)}
                    className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                    aria-label={`Select ${group.name}`}
                  />
                </div>
                <p className="text-sm font-medium text-gray-900">{group.name}</p>
                <span className="text-sm text-gray-500">{selectedInGroup}/{group.countries.length}</span>
              </div>
              {isOpen && (
                <div className="space-y-1 bg-gray-50/60 px-12 pb-3">
                  {matchingCountries.map((country) => (
                    <label
                      key={country.value}
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-white"
                    >
                      <input
                        type="checkbox"
                        checked={selectedSet.has(country.value)}
                        onChange={() => toggleCountry(country.value)}
                        className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                      />
                      <span className="min-w-0 flex-1 truncate">{country.label}</span>
                      <span className="text-xs font-semibold text-gray-400">{country.value}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ShopifyMarketPicker({
  markets,
  error,
  selectedMarketIds,
  onChange,
}: {
  markets: ShopifyMarketOption[];
  error: string;
  selectedMarketIds: string[];
  onChange: (marketIds: string[], countryCodes: string[]) => void;
}) {
  const selectedMarketIdSet = useMemo(() => new Set(selectedMarketIds), [selectedMarketIds]);
  const selectedCountryCount = useMemo(
    () => marketCountryCodes(markets, selectedMarketIds).length,
    [markets, selectedMarketIds],
  );

  const updateMarkets = useCallback((marketIds: string[]) => {
    const nextMarketIds = Array.from(new Set(marketIds));
    onChange(nextMarketIds, marketCountryCodes(markets, nextMarketIds));
  }, [markets, onChange]);

  const toggleMarket = useCallback((marketId: string) => {
    updateMarkets(
      selectedMarketIdSet.has(marketId)
        ? selectedMarketIds.filter((selectedMarketId) => selectedMarketId !== marketId)
        : [...selectedMarketIds, marketId],
    );
  }, [selectedMarketIds, selectedMarketIdSet, updateMarkets]);

  if (error) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <p className="font-bold">Shopify Markets unavailable</p>
        <p className="mt-1 text-xs leading-5">{error}</p>
      </div>
    );
  }

  if (markets.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
        No country-based Shopify Markets were found. Create markets in Shopify or use manual countries.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-gray-800">Shopify Markets</p>
          <span className="rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-semibold text-yellow-800">
            {selectedMarketIds.length} markets / {selectedCountryCount} countries
          </span>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => updateMarkets(markets.map((market) => market.id))}
            className={BUTTON_SECONDARY}
          >
            Select All
          </button>
          <button
            type="button"
            onClick={() => updateMarkets([])}
            className={BUTTON_SECONDARY}
          >
            Clear All
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {markets.map((market) => {
          const previewCountries = market.countries.slice(0, 5);
          const extraCountryCount = Math.max(0, market.countries.length - previewCountries.length);

          return (
            <label
              key={market.id}
              className="grid cursor-pointer grid-cols-[2rem_1fr_auto] items-center gap-3 border-b border-gray-100 px-4 py-3 last:border-b-0 hover:bg-gray-50"
            >
              <span className="flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={selectedMarketIdSet.has(market.id)}
                  onChange={() => toggleMarket(market.id)}
                  className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                  aria-label={`Select ${market.name}`}
                />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold text-gray-900">{market.name}</span>
                <span className="mt-1 block text-xs text-gray-500">
                  {previewCountries.map((country) => country.name).join(", ")}
                  {extraCountryCount > 0 ? `, +${extraCountryCount} more` : ""}
                </span>
              </span>
              <span className="flex flex-col items-end gap-2">
                <Badge tone={market.status === "ACTIVE" ? "success" : "attention"}>
                  {market.status === "ACTIVE" ? "Active" : "Draft"}
                </Badge>
                <span className="text-xs font-semibold text-gray-400">
                  {market.countries.length} countries
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function templateWidgetData(
  template: (typeof TEMPLATE_DEFAULTS)[string],
  templateName: string,
  templateId: string,
) {
  const customBlocks = hydrateBlocksForTemplate(template.customBlocks, template);
  return {
    name: templateName || "Template Design",
    isDefault: false,
    isActive: true,
    isReusable: false,
    sourceWidgetId: null,
    sourceTemplateId: templateId,
    requiredPlan: getRequiredPlanForWidget({ customBlocks }).handle,
    widgetStyle: "custom",
    customBlocks: customBlocks as unknown as Prisma.InputJsonValue,
    textColor: template.textColor || "#000000",
    iconColor: template.iconColor || "#0033cc",
    bgColor: template.bgColor || "#ffffff",
    borderColor: template.borderColor || "#e5e7eb",
    borderRadius: template.borderRadius || 10,
    shadow: template.shadow || "none",
    glassmorphism: template.glassmorphism || false,
    padding: template.padding ?? 16,
    bgGradient: template.bgGradient || "",
    showTimeline: template.showTimeline ?? true,
    policyText: template.policyText ?? null,
    headerText: template.headerText ?? null,
    subHeaderText: template.subHeaderText ?? null,
    step1Label: template.step1Label ?? null,
    step1SubText: template.step1SubText ?? null,
    step1Icon: template.step1Icon ?? null,
    step2Label: template.step2Label ?? null,
    step2SubText: template.step2SubText ?? null,
    step2Icon: template.step2Icon ?? null,
    step3Label: template.step3Label ?? null,
    step3SubText: template.step3SubText ?? null,
    step3Icon: template.step3Icon ?? null,
  };
}

function serializeWidget(widget: Widget): RuleEditorWidget {
  return {
    ...widget,
    createdAt: widget.createdAt.toISOString(),
    updatedAt: widget.updatedAt.toISOString(),
  };
}

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { session, admin, billing } = await authenticate.admin(request);
  const url = new URL(request.url);
  const routeId = params.id;
  const isNew = isNewRuleId(routeId);
  const requestedWidgetId = url.searchParams.get("selectedWidgetId") || "";
  const currentPlan = await syncCurrentPlanForShop(session.shop, billing);
  const [defaultWidget, appSetting] = await Promise.all([
    ensureDefaultWidget(session.shop),
    ensureAppSetting(session.shop),
  ]);

  const [rule, widgets] = await Promise.all([
    isNew
      ? Promise.resolve(null)
      : prisma.deliveryRule.findFirst({
          where: { id: routeId, shop: session.shop },
          select: {
            id: true,
            ruleName: true,
            countryCode: true,
            targetCountries: true,
            marketId: true,
            marketName: true,
            widgetId: true,
            targetProducts: true,
            targetCollections: true,
            targetTags: true,
            inventoryStatus: true,
            minDays: true,
            maxDays: true,
            processingDays: true,
            shippingMessage: true,
            cutoffEnabled: true,
            cutoffTime: true,
            cutoffTimezone: true,
            holidayDates: true,
            visibilityMode: true,
            timerSeconds: true,
            dateLocale: true,
            isActive: true,
          },
        }),
    prisma.widget.findMany({
      where: { shop: session.shop },
      orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
    }),
  ]);

  if (!isNew && !rule) {
    throw redirect("/app/rules");
  }

  const selectedWidgetId = widgets.some((widget) => widget.id === requestedWidgetId)
    ? requestedWidgetId
    : "";
  const targetProductIds = normalizeProductIds(jsonStringArray(rule?.targetProducts));
  const targetCollectionIds = normalizeCollectionIds(jsonStringArray(rule?.targetCollections));
  const [hydratedTargets, shopifyMarketsResult] = await Promise.all([
    fetchTargetResources(
      admin as AdminGraphqlClient,
      targetProductIds.slice(0, TARGET_LIST_PAGE_SIZE),
      targetCollectionIds.slice(0, TARGET_LIST_PAGE_SIZE),
    ),
    currentPlan.plan.limits.shopifyMarkets
      ? fetchShopifyMarkets(admin as AdminGraphqlClient)
      : Promise.resolve({
          markets: [] as ShopifyMarketOption[],
          error: "Upgrade to Pro to use Shopify Markets targeting.",
        }),
  ]);

  return data({
    isNew,
    rule,
    widgets,
    savedWidgets: widgets
      .filter((widget) => !widget.isDefault && widget.isReusable)
      .map((widget) => ({
        ...widget,
        updatedAt: widget.updatedAt.toISOString(),
    })),
    shop: session.shop,
    currentPlan,
    showLocationSelector: appSetting.showLocationSelector,
    locationPrefixText: normalizeLocationPrefixText(appSetting.locationPrefixText),
    showLocationFlag: appSetting.showLocationFlag,
    locationRowAlignment: normalizeLocationRowAlignment(appSetting.locationRowAlignment),
    defaultWidgetId: rule?.widgetId || selectedWidgetId || defaultWidget.id,
    templateApplied: url.searchParams.get("templateApplied") === "1",
    sourceDesignId: url.searchParams.get("sourceDesignId") || "",
    designName: url.searchParams.get("designName") || "",
    selectedProducts: hydratedTargets.products,
    selectedCollections: hydratedTargets.collections,
    shopifyMarkets: shopifyMarketsResult.markets,
    shopifyMarketsError: shopifyMarketsResult.error,
  });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { session, admin, billing } = await authenticate.admin(request);
  const currentPlan = await syncCurrentPlanForShop(session.shop, billing);
  const routeId = params.id;
  const isNew = isNewRuleId(routeId);
  const formData = await request.formData();
  const intent = String(formData.get("intent") || "save-rule");
  const requestUrl = new URL(request.url);

  if (intent === "load-target-resources") {
    const targetType = String(formData.get("targetType") || "") === "collection" ? "collection" : "product";
    const offset = Math.max(0, Number.parseInt(String(formData.get("offset") || "0"), 10) || 0);
    const ids = targetType === "collection"
      ? normalizeCollectionIds(String(formData.get("ids") || ""))
      : normalizeProductIds(String(formData.get("ids") || ""));
    const pageIds = ids.slice(offset, offset + TARGET_LIST_PAGE_SIZE);

    if (pageIds.length === 0) {
      return data({
        targetType,
        resources: [],
        nextOffset: offset,
        hasMore: false,
      });
    }

    const hydratedTargets = await fetchTargetResources(
      admin as AdminGraphqlClient,
      targetType === "product" ? pageIds : [],
      targetType === "collection" ? pageIds : [],
    );
    const resources = targetType === "product"
      ? hydratedTargets.products
      : hydratedTargets.collections;
    const nextOffset = offset + pageIds.length;

    return data({
      targetType,
      resources,
      nextOffset,
      hasMore: nextOffset < ids.length,
    });
  }

  await ensureAppSetting(session.shop);

  if (intent === "create-design") {
    const widget = await prisma.widget.create({
      data: {
        shop: session.shop,
        name: "New Design",
        isDefault: false,
        isActive: true,
        isReusable: false,
        sourceWidgetId: null,
        requiredPlan: "free",
        padding: 16,
        customBlocks: buildFallbackBlocks(
          {},
          DEFAULT_SHIPPING_MESSAGE,
        ) as unknown as Prisma.InputJsonValue,
      },
    });

    const returnTo = `${requestUrl.pathname}${requestUrl.search}`;
    return redirect(`/app/widgets/${widget.id}?returnTo=${encodeURIComponent(returnTo)}`);
  }

  if (intent === "apply-template") {
    const templateId = String(formData.get("templateId") || "");
    const templateName = String(formData.get("templateName") || "").trim();
    const template = TEMPLATE_DEFAULTS[templateId];

    if (!template) {
      return data({ error: "Invalid template" }, { status: 400 });
    }

    if (!canUseTemplate(currentPlan.plan, templateId)) {
      const requiredPlan = requiredPlanForTemplate(templateId);
      return data({
        error: `${templateName || "This template"} requires the ${requiredPlan.name} plan or higher.`,
      }, { status: 403 });
    }

    const ruleWidget = await prisma.widget.create({
      data: {
        shop: session.shop,
        ...templateWidgetData(template, templateName, templateId),
      },
    });

    return data({
      success: true,
      appliedWidgetId: ruleWidget.id,
      appliedWidget: serializeWidget(ruleWidget),
      sourceDesignId: "",
      designName: ruleWidget.name,
      templateApplied: true,
    });
  }

  if (intent === "saved-design") {
    const widgetId = String(formData.get("widgetId") || "");
    if (!widgetId) {
      return data({ error: "Invalid design" }, { status: 400 });
    }

    const sourceWidget = await prisma.widget.findFirst({
      where: { id: widgetId, shop: session.shop, isDefault: false, isReusable: true },
    });

    if (!sourceWidget) {
      return data({ error: "Design not found" }, { status: 404 });
    }

    if (!canEditWidget(currentPlan.plan, sourceWidget)) {
      const requiredPlan = getRequiredPlanForWidget(sourceWidget);
      return data({
        error: `${sourceWidget.name || "This design"} requires the ${requiredPlan.name} plan or higher.`,
      }, { status: 403 });
    }

    const ruleWidget = await prisma.widget.create({
      data: widgetCopyData(sourceWidget, {
        shop: session.shop,
        isReusable: false,
        isActive: true,
        sourceWidgetId: sourceWidget.id,
      }),
    });

    return data({
      success: true,
      appliedWidgetId: ruleWidget.id,
      appliedWidget: serializeWidget(ruleWidget),
      sourceDesignId: sourceWidget.id,
      designName: sourceWidget.name,
      templateApplied: false,
    });
  }

  const payload = readRulePayload(formData);

  if ("error" in payload) {
    return data({ error: payload.error }, { status: 400 });
  }

  const selectedWidget = await prisma.widget.findFirst({
    where: { id: payload.widgetId, shop: session.shop },
  });

  if (!selectedWidget) {
    return data({ error: "Selected design was not found." }, { status: 400 });
  }

  if (!canEditWidget(currentPlan.plan, selectedWidget)) {
    const requiredPlan = getRequiredPlanForWidget(selectedWidget);
    return data({
      error: `The selected design requires the ${requiredPlan.name} plan or higher. Choose a basic design or upgrade before saving.`,
    }, { status: 403 });
  }

  const countrySource = String(formData.get("countrySource") || "manual") === "markets" ? "markets" : "manual";
  if (countrySource === "markets" && !currentPlan.plan.limits.shopifyMarkets) {
    return data({ error: "Shopify Markets targeting requires the Pro plan or higher." }, { status: 403 });
  }

  const countryTargets = countrySource === "markets"
    ? parseMarketTargets(formData.get("marketSelections"))
    : buildManualCountryTargets(parseSelectedCountryCodes(formData.get("countryCodes")));

  if (countryTargets.length === 0) {
    return data({ error: "Select at least one country." }, { status: 400 });
  }

  const duplicates = await Promise.all(
    countryTargets.map((countryTarget) =>
      hasDuplicateDeliveryRule({
        shop: session.shop,
        id: isNew ? undefined : routeId,
        countryCode: countryTarget.countryCode,
        targetCountries: countryTarget.targetCountries,
        targetProducts: payload.targetProducts,
        targetCollections: payload.targetCollections,
        targetTags: payload.targetTags,
        inventoryStatus: payload.inventoryStatus,
      }),
    ),
  );

  if (duplicates.some(Boolean)) {
    return data({ error: "A rule with this country/product/collection/tag targeting already exists." }, { status: 400 });
  }

  const saveData = {
    ruleName: payload.ruleName,
    widgetId: payload.widgetId,
    targetProducts: payload.targetProducts as Prisma.InputJsonValue,
    targetCollections: payload.targetCollections as Prisma.InputJsonValue,
    targetTags: payload.targetTags as Prisma.InputJsonValue,
    inventoryStatus: payload.inventoryStatus,
    minDays: payload.minDays,
    maxDays: payload.maxDays,
    processingDays: payload.processingDays,
    shippingMessage: payload.shippingMessage,
    cutoffEnabled: payload.cutoffEnabled,
    cutoffTime: payload.cutoffTime,
    cutoffTimezone: payload.cutoffTimezone,
    holidayDates: payload.holidayDates as Prisma.InputJsonValue,
    visibilityMode: payload.visibilityMode,
    timerSeconds: payload.timerSeconds,
    dateLocale: payload.dateLocale,
    isActive: payload.isActive,
  };

  if (payload.isActive) {
    const activeRuleCount = await prisma.deliveryRule.count({
      where: {
        shop: session.shop,
        isActive: true,
        ...(isNew ? {} : { id: { not: routeId } }),
      },
    });

    if (limitExceeded(currentPlan.plan.limits.activeRules, activeRuleCount, countryTargets.length)) {
      return data({
        error: `Your ${currentPlan.plan.name} plan includes ${limitLabel(currentPlan.plan.limits.activeRules)} active delivery rule${currentPlan.plan.limits.activeRules === 1 ? "" : "s"}. Save this rule as draft or upgrade to add more active rules.`,
      }, { status: 403 });
    }
  }

  if (isNew) {
    await prisma.$transaction(
      countryTargets.map((countryTarget) =>
        prisma.deliveryRule.create({
          data: {
            shop: session.shop,
            countryCode: countryTarget.countryCode,
            targetCountries: countryTarget.targetCountries as Prisma.InputJsonValue,
            marketId: countryTarget.marketId ?? null,
            marketName: countryTarget.marketName ?? null,
            ...saveData,
          },
        }),
      ),
    );
  } else {
    const [firstCountryTarget, ...additionalCountryTargets] = countryTargets;
    const updated = await prisma.deliveryRule.updateMany({
      where: { id: routeId, shop: session.shop },
      data: {
        countryCode: firstCountryTarget.countryCode,
        targetCountries: firstCountryTarget.targetCountries as Prisma.InputJsonValue,
        marketId: firstCountryTarget.marketId ?? null,
        marketName: firstCountryTarget.marketName ?? null,
        ...saveData,
      },
    });

    if (updated.count === 0) {
      return data({ error: "Rule was not found." }, { status: 404 });
    }

    if (additionalCountryTargets.length > 0) {
      await prisma.$transaction(
        additionalCountryTargets.map((countryTarget) =>
          prisma.deliveryRule.create({
            data: {
              shop: session.shop,
              countryCode: countryTarget.countryCode,
              targetCountries: countryTarget.targetCountries as Prisma.InputJsonValue,
              marketId: countryTarget.marketId ?? null,
              marketName: countryTarget.marketName ?? null,
              ...saveData,
            },
          }),
        ),
      );
    }
  }

  return redirect("/app/rules?ruleSaved=1");
};

export default function RuleEditorPage() {
  const {
    isNew,
    rule,
    widgets,
    savedWidgets,
    shop,
    showLocationSelector,
    locationPrefixText,
    showLocationFlag,
    locationRowAlignment,
    defaultWidgetId,
    templateApplied,
    sourceDesignId,
    designName,
    selectedProducts: loaderSelectedProducts,
    selectedCollections: loaderSelectedCollections,
    shopifyMarkets: loaderShopifyMarkets,
    shopifyMarketsError,
    currentPlan,
  } = useLoaderData<typeof loader>();
  const actionData = useActionData() as ActionResult | undefined;
  const productTargetFetcher = useFetcher<TargetResourcesLoadResult>();
  const collectionTargetFetcher = useFetcher<TargetResourcesLoadResult>();
  const location = useLocation();
  const navigate = useNavigate();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const submittingIntent = String(navigation.formData?.get("intent") || "");

  const initialRule = rule as RuleEditorRule | null;
  const [ruleName, setRuleName] = useState(initialRule?.ruleName || "Delivery rule");
  const [selectedCountryCodes, setSelectedCountryCodes] = useState<string[]>(
    () => initialCountrySelection(initialRule),
  );
  const [countrySource, setCountrySource] = useState<CountrySource>(
    initialRule?.marketId ? "markets" : "manual",
  );
  const [selectedMarketIds, setSelectedMarketIds] = useState<string[]>(
    () => initialRule?.marketId ? [initialRule.marketId] : [],
  );
  const [countryTargetError, setCountryTargetError] = useState("");
  const countryCode = selectedCountryCodes[0] || "";
  const [widgetId, setWidgetId] = useState(initialRule?.widgetId || defaultWidgetId);
  const [targetProducts, setTargetProducts] = useState(stringArrayCsv(initialRule?.targetProducts));
  const [targetCollections, setTargetCollections] = useState(stringArrayCsv(initialRule?.targetCollections));
  const [targetTags, setTargetTags] = useState(stringArrayCsv(initialRule?.targetTags));
  const [selectedProducts, setSelectedProducts] = useState<TargetResource[]>(
    () => loaderSelectedProducts as TargetResource[],
  );
  const [selectedCollections, setSelectedCollections] = useState<TargetResource[]>(
    () => loaderSelectedCollections as TargetResource[],
  );
  const [productLoadOffset, setProductLoadOffset] = useState(() =>
    (loaderSelectedProducts as TargetResource[]).length,
  );
  const [collectionLoadOffset, setCollectionLoadOffset] = useState(() =>
    (loaderSelectedCollections as TargetResource[]).length,
  );
  const [targetMode, setTargetMode] = useState<TargetMode>(() => {
    if (normalizeCollectionIds(initialRule?.targetCollections).length > 0) return "collection";
    if (normalizeTags(jsonStringArray(initialRule?.targetTags)).length > 0) return "tag";
    return "product";
  });
  const [inventoryStatus, setInventoryStatus] = useState(() =>
    normalizeRuleInventoryStatus(initialRule?.inventoryStatus),
  );
  const [minDays, setMinDays] = useState(String(initialRule?.minDays ?? 3));
  const [maxDays, setMaxDays] = useState(String(initialRule?.maxDays ?? 7));
  const [processingDays, setProcessingDays] = useState(String(initialRule?.processingDays ?? 1));
  const [shippingMessage, setShippingMessage] = useState(initialRule?.shippingMessage || RULE_DEFAULT_MESSAGE);
  const [activeOperationalTab, setActiveOperationalTab] = useState<OperationalTab>("timing");
  const [cutoffTime, setCutoffTime] = useState(() => normalizeCutoffTime(initialRule?.cutoffTime));
  const [cutoffTimezone, setCutoffTimezone] = useState(() => normalizeTimeZone(initialRule?.cutoffTimezone));
  const [holidayDates, setHolidayDates] = useState(() =>
    normalizeHolidayDates(initialRule?.holidayDates).join("\n"),
  );
  const [visibilityMode, setVisibilityMode] = useState(() => normalizeVisibilityMode(initialRule?.visibilityMode));
  const [dateLocale, setDateLocale] = useState(() => normalizeDateLocale(initialRule?.dateLocale));
  const [isActive, setIsActive] = useState(initialRule?.isActive ?? true);
  const [targetPickerError, setTargetPickerError] = useState("");
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [activeTemplateTab, setActiveTemplateTab] = useState<TemplateMainTab>("General");
  const [activeCategory, setActiveCategory] = useState<TemplateCategory>("Animated");
  const [pendingStyle, setPendingStyle] = useState<TemplateId | null>(null);
  const [pendingDesignId, setPendingDesignId] = useState<string | null>(null);
  const [customizeAfterApply, setCustomizeAfterApply] = useState(false);
  const [templateWorkflow, setTemplateWorkflow] = useState({
    templateApplied,
    sourceDesignId,
    designName,
  });
  const [upgradeModal, setUpgradeModal] = useState<UpgradeModalState>({ open: false });

  const openUpgradeModal = useCallback((
    featureName: string,
    requiredPlanName?: string,
    upgradeUrl = "/app/pricing",
    message?: string,
  ) => {
    setUpgradeModal({ open: true, featureName, requiredPlanName, upgradeUrl, message });
  }, []);

  const [localWidgets, setLocalWidgets] = useState<RuleEditorWidget[]>(
    () => widgets as RuleEditorWidget[],
  );
  const typedWidgets = localWidgets;
  const typedSavedWidgets = savedWidgets as SavedWidget[];
  const shopifyMarkets = loaderShopifyMarkets as ShopifyMarketOption[];
  const selectedWidget = useMemo(() => {
    return typedWidgets.find((widget) => widget.id === widgetId) || typedWidgets[0];
  }, [typedWidgets, widgetId]);
  const selectedWidgetRequiredPlan = useMemo(
    () => getRequiredPlanForWidget(selectedWidget),
    [selectedWidget],
  );
  const selectedWidgetLocked = Boolean(selectedWidget && !canEditWidget(currentPlan.plan, selectedWidget));
  const locationRowPreviewSettings = {
    showLocationSelector,
    locationPrefixText,
    showLocationFlag,
    locationRowAlignment,
  };

  useEffect(() => {
    setLocalWidgets(widgets as RuleEditorWidget[]);
  }, [widgets]);
  const selectedProductIds = useMemo(() => normalizeProductIds(targetProducts), [targetProducts]);
  const selectedCollectionIds = useMemo(() => normalizeCollectionIds(targetCollections), [targetCollections]);
  const isLoadingMoreProducts = productTargetFetcher.state !== "idle";
  const isLoadingMoreCollections = collectionTargetFetcher.state !== "idle";
  const shopHandle = shop.split(".")[0];
  const themeEditorUrl = `https://admin.shopify.com/store/${shopHandle}/themes/current/editor?context=apps`;
  const ruleEditorReturnTo = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const returnWidgetId = widgetId || selectedWidget?.id;
    if (returnWidgetId) params.set("selectedWidgetId", returnWidgetId);
    const query = params.toString();
    return `${location.pathname}${query ? `?${query}` : ""}`;
  }, [location.pathname, location.search, selectedWidget?.id, widgetId]);
  const customizeUrl = useMemo(() => {
    if (!selectedWidget) return "";

    const params = new URLSearchParams();
    params.set("returnTo", ruleEditorReturnTo);
    const sourceForEditor = templateWorkflow.sourceDesignId || selectedWidget.sourceWidgetId || "";
    if (templateWorkflow.templateApplied) params.set("saveAsDesign", "1");
    if (sourceForEditor) params.set("sourceDesignId", sourceForEditor);
    if (templateWorkflow.designName) params.set("designName", templateWorkflow.designName);

    const query = params.toString();
    return `/app/widgets/${selectedWidget.id}${query ? `?${query}` : ""}`;
  }, [ruleEditorReturnTo, selectedWidget, templateWorkflow]);

  const widgetEditorUrl = useCallback((id: string) => {
    const params = new URLSearchParams();
    params.set("returnTo", ruleEditorReturnTo);
    return `/app/widgets/${id}?${params.toString()}`;
  }, [ruleEditorReturnTo]);

  const visibleTemplates = useMemo(
    () => WIDGET_TEMPLATES.filter((template) => template.category === activeCategory),
    [activeCategory],
  );

  const timelineSummary = useMemo(() => {
    const min = Number.parseInt(minDays, 10);
    const max = Number.parseInt(maxDays, 10);
    const processing = Number.parseInt(processingDays, 10);

    return {
      min: Number.isFinite(min) ? min : 0,
      max: Number.isFinite(max) ? max : 0,
      processing: Number.isFinite(processing) ? processing : 0,
    };
  }, [minDays, maxDays, processingDays]);

  const handleSave = () => {
    if (countrySource === "markets" && selectedMarketIds.length === 0) {
      setCountryTargetError("Choose at least one Shopify Market, or switch to Manual countries.");
      return;
    }

    if (countrySource === "markets" && !currentPlan.plan.limits.shopifyMarkets) {
      openUpgradeModal(
        "Shopify Markets targeting",
        "Pro",
        "/app/pricing?upgrade=markets",
        "Shopify Markets targeting is available on the Pro plan or higher.",
      );
      return;
    }

    if (selectedWidgetLocked) {
      openUpgradeModal(
        selectedWidget?.name || "Selected design",
        selectedWidgetRequiredPlan.name,
        "/app/pricing?upgrade=design",
        `The selected design requires the ${selectedWidgetRequiredPlan.name} plan or higher before this rule can be saved.`,
      );
      return;
    }

    if (selectedCountryCodes.length === 0) {
      setCountryTargetError("Select at least one country.");
      return;
    }

    const selectedMarkets = shopifyMarkets
      .filter((market) => selectedMarketIds.includes(market.id))
      .map((market) => ({
        id: market.id,
        name: market.name,
        countries: market.countries.map((country) => country.code),
      }));

    const formData = new FormData();
    formData.append("ruleName", ruleName);
    formData.append("countrySource", countrySource);
    formData.append("countryCode", selectedCountryCodes[0]);
    formData.append("countryCodes", selectedCountryCodes.join(", "));
    formData.append("marketSelections", JSON.stringify(selectedMarkets));
    formData.append("widgetId", widgetId);
    formData.append("targetProducts", targetMode === "product" ? targetProducts : "");
    formData.append("targetCollections", targetMode === "collection" ? targetCollections : "");
    formData.append("targetTags", targetMode === "tag" ? targetTags : "");
    formData.append("inventoryStatus", inventoryStatus);
    formData.append("minDays", minDays);
    formData.append("maxDays", maxDays);
    formData.append("processingDays", processingDays);
    formData.append("shippingMessage", shippingMessage);
    formData.append("cutoffEnabled", "true");
    formData.append("cutoffTime", cutoffTime);
    formData.append("cutoffTimezone", cutoffTimezone);
    formData.append("holidayDates", holidayDates);
    formData.append("visibilityMode", visibilityMode);
    formData.append("dateLocale", dateLocale);
    formData.append("isActive", String(isActive));
    submit(formData, { method: "post" });
  };

  const handleCountrySourceChange = useCallback((source: CountrySource) => {
    if (source === "markets" && !currentPlan.plan.limits.shopifyMarkets) {
      openUpgradeModal(
        "Shopify Markets targeting",
        "Pro",
        "/app/pricing?upgrade=markets",
        "Upgrade to Pro to use Shopify Markets as the country source for delivery rules.",
      );
      return;
    }

    setCountrySource(source);
    setCountryTargetError("");
    if (source === "manual") {
      setSelectedMarketIds([]);
    }
  }, [currentPlan.plan.limits.shopifyMarkets, openUpgradeModal]);

  const handleManualCountryChange = useCallback((codes: string[]) => {
    setCountryTargetError("");
    setSelectedCountryCodes(codes);
  }, []);

  const handleMarketCountryChange = useCallback((marketIds: string[], countryCodes: string[]) => {
    setCountryTargetError("");
    setSelectedMarketIds(marketIds);
    setSelectedCountryCodes(countryCodes);
  }, []);

  const handleTargetModeChange = useCallback((mode: TargetMode) => {
    setTargetMode(mode);
    setTargetPickerError("");
  }, []);

  const handleRemoveProduct = useCallback((productId: string) => {
    const nextProductIds = selectedProductIds.filter((id) => id !== productId);
    const removedIndex = selectedProductIds.indexOf(productId);
    setTargetProducts(nextProductIds.join(", "));
    if (removedIndex >= 0) {
      setProductLoadOffset((offset) => (removedIndex < offset ? Math.max(0, offset - 1) : offset));
    }
    setSelectedProducts((current) => {
      const next = current.filter((product) => product.id !== productId);
      return next;
    });
  }, [selectedProductIds]);

  const handleRemoveCollection = useCallback((collectionId: string) => {
    const nextCollectionIds = selectedCollectionIds.filter((id) => id !== collectionId);
    const removedIndex = selectedCollectionIds.indexOf(collectionId);
    setTargetCollections(nextCollectionIds.join(", "));
    if (removedIndex >= 0) {
      setCollectionLoadOffset((offset) => (removedIndex < offset ? Math.max(0, offset - 1) : offset));
    }
    setSelectedCollections((current) => {
      const next = current.filter((collection) => collection.id !== collectionId);
      return next;
    });
  }, [selectedCollectionIds]);

  const handleLoadMoreProducts = useCallback(() => {
    if (isLoadingMoreProducts || productLoadOffset >= selectedProductIds.length) return;
    productTargetFetcher.submit(
      {
        intent: "load-target-resources",
        targetType: "product",
        ids: selectedProductIds.join(", "),
        offset: String(productLoadOffset),
      },
      { method: "post" },
    );
  }, [isLoadingMoreProducts, productLoadOffset, productTargetFetcher, selectedProductIds]);

  const handleLoadMoreCollections = useCallback(() => {
    if (isLoadingMoreCollections || collectionLoadOffset >= selectedCollectionIds.length) return;
    collectionTargetFetcher.submit(
      {
        intent: "load-target-resources",
        targetType: "collection",
        ids: selectedCollectionIds.join(", "),
        offset: String(collectionLoadOffset),
      },
      { method: "post" },
    );
  }, [collectionLoadOffset, collectionTargetFetcher, isLoadingMoreCollections, selectedCollectionIds]);

  const handleOpenProductPicker = useCallback(async () => {
    const shopify = (window as Window & { shopify?: ShopifyAdminGlobal }).shopify;

    if (!shopify?.resourcePicker) {
      setTargetPickerError("Shopify product picker is not available in this view.");
      return;
    }

    setTargetPickerError("");

    const selection = await shopify.resourcePicker({
      type: "product",
      action: "select",
      filter: {
        variants: false,
      },
      multiple: true,
      selectionIds: selectedProductIds.map((productId) => ({ id: productGid(productId) })),
    });

    if (!selection) return;

    const products = selection.map(pickerResourceToTarget);
    setSelectedProducts(products);
    setTargetProducts(products.map((product) => product.id).join(", "));
    setProductLoadOffset(products.length);
  }, [selectedProductIds]);

  const handleOpenCollectionPicker = useCallback(async () => {
    const shopify = (window as Window & { shopify?: ShopifyAdminGlobal }).shopify;

    if (!shopify?.resourcePicker) {
      setTargetPickerError("Shopify collection picker is not available in this view.");
      return;
    }

    setTargetPickerError("");

    const selection = await shopify.resourcePicker({
      type: "collection",
      action: "select",
      multiple: true,
      selectionIds: selectedCollectionIds.map((collectionId) => ({ id: collectionGid(collectionId) })),
    });

    if (!selection) return;

    const collections = selection.map(pickerResourceToTarget);
    setSelectedCollections(collections);
    setTargetCollections(collections.map((collection) => collection.id).join(", "));
    setCollectionLoadOffset(collections.length);
  }, [selectedCollectionIds]);

  const handleUseTemplate = (template: TemplateMeta) => {
    if (!canUseTemplate(currentPlan.plan, template.style)) {
      const requiredPlan = requiredPlanForTemplate(template.style);
      openUpgradeModal(
        template.name,
        requiredPlan.name,
        "/app/pricing?upgrade=templates",
        `${template.name} uses premium components that require the ${requiredPlan.name} plan or higher.`,
      );
      return;
    }

    setPendingStyle(template.style);
    setPendingDesignId(null);
    submit(
      { intent: "apply-template", templateId: template.style, templateName: template.name },
      { method: "post" },
    );
  };

  const handleUseSavedDesign = (
    widget: Pick<SavedWidget, "id" | "name" | "customBlocks" | "requiredPlan">,
    options: { customizeAfterApply?: boolean } = {},
  ) => {
    if (!canEditWidget(currentPlan.plan, widget)) {
      const requiredPlan = getRequiredPlanForWidget(widget);
      openUpgradeModal(
        widget.name || "Selected design",
        requiredPlan.name,
        "/app/pricing?upgrade=designs",
        `${widget.name || "This design"} includes premium components that require the ${requiredPlan.name} plan or higher.`,
      );
      return;
    }

    setPendingStyle(null);
    setPendingDesignId(widget.id);
    setCustomizeAfterApply(Boolean(options.customizeAfterApply));
    submit(
      { intent: "saved-design", widgetId: widget.id, widgetName: widget.name },
      { method: "post" },
    );
  };

  const handleCreateDesign = () => {
    setPendingStyle(null);
    setPendingDesignId(null);
    submit({ intent: "create-design" }, { method: "post" });
  };

  useEffect(() => {
    const result = productTargetFetcher.data;
    if (!result || result.targetType !== "product") return;

    if (result.error) {
      setTargetPickerError(result.error);
      return;
    }

    if (typeof result.nextOffset === "number") {
      setProductLoadOffset(result.nextOffset);
    }

    if (result.resources?.length) {
      setSelectedProducts((current) => {
        const currentIds = new Set(current.map((product) => product.id));
        const nextResources = result.resources?.filter((product) => !currentIds.has(product.id)) || [];
        return [...current, ...nextResources];
      });
    }
  }, [productTargetFetcher.data]);

  useEffect(() => {
    const result = collectionTargetFetcher.data;
    if (!result || result.targetType !== "collection") return;

    if (result.error) {
      setTargetPickerError(result.error);
      return;
    }

    if (typeof result.nextOffset === "number") {
      setCollectionLoadOffset(result.nextOffset);
    }

    if (result.resources?.length) {
      setSelectedCollections((current) => {
        const currentIds = new Set(current.map((collection) => collection.id));
        const nextResources = result.resources?.filter((collection) => !currentIds.has(collection.id)) || [];
        return [...current, ...nextResources];
      });
    }
  }, [collectionTargetFetcher.data]);

  useEffect(() => {
    if (!actionData?.appliedWidgetId) return;

    if (actionData.appliedWidget) {
      setLocalWidgets((current) => {
        const nextWidgets = current.filter((widget) => widget.id !== actionData.appliedWidget?.id);
        return [actionData.appliedWidget as RuleEditorWidget, ...nextWidgets];
      });
    }
    setWidgetId(actionData.appliedWidgetId);
    setTemplateWorkflow({
      templateApplied: Boolean(actionData.templateApplied),
      sourceDesignId: actionData.sourceDesignId || "",
      designName: actionData.designName || "",
    });
    setTemplateModalOpen(false);
    setPendingStyle(null);
    setPendingDesignId(null);
    if (customizeAfterApply) {
      const returnParams = new URLSearchParams(location.search);
      returnParams.set("selectedWidgetId", actionData.appliedWidgetId);
      const returnQuery = returnParams.toString();
      const nextReturnTo = `${location.pathname}${returnQuery ? `?${returnQuery}` : ""}`;
      const editorParams = new URLSearchParams({ returnTo: nextReturnTo });
      if (actionData.sourceDesignId) editorParams.set("sourceDesignId", actionData.sourceDesignId);
      if (actionData.designName) editorParams.set("designName", actionData.designName);
      setCustomizeAfterApply(false);
      navigate(`/app/widgets/${actionData.appliedWidgetId}?${editorParams.toString()}`);
    }
  }, [actionData, customizeAfterApply, location.pathname, location.search, navigate]);

  return (
    <div className="min-h-screen bg-[#f6f6f7] p-4 md:p-6 font-sans">
      <UpgradePlanModal
        open={upgradeModal.open}
        onClose={() => setUpgradeModal({ open: false })}
        featureName={upgradeModal.featureName}
        requiredPlanName={upgradeModal.requiredPlanName}
        currentPlanName={currentPlan.plan.name}
        message={upgradeModal.message}
        upgradeUrl={upgradeModal.upgradeUrl}
      />
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => navigate("/app/rules")}
              className="mb-2 inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 transition-colors hover:text-gray-950"
            >
              <span className="h-3.5 w-3.5">
                <Icon source={ArrowLeftIcon} />
              </span>
              Back to rules
            </button>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              {isNew ? "Add delivery rule" : "Edit delivery rule"}
            </h1>
            <div className="flex items-center gap-2">
              <span className={`flex h-2 w-2 rounded-full ${isActive ? "bg-green-500" : "bg-amber-500"}`} />
              <Text variant="bodySm" tone="subdued" as="p">
                {isActive ? "This rule can match storefront traffic." : "This rule is saved but not active."}
              </Text>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSubmitting}
            className={`${selectedWidgetLocked ? BUTTON_SECONDARY : BUTTON_PRIMARY} min-w-[112px] whitespace-nowrap`}
          >
            {isSubmitting ? (
              "Saving..."
            ) : selectedWidgetLocked ? (
              <>
                <LockGlyph className="mr-1.5 h-3.5 w-3.5" />
                Upgrade to save
              </>
            ) : (
              "Save rule"
            )}
          </button>
        </div>

        {actionData?.error && (
          <Banner title="Rule could not be saved" tone="critical">
            <p>{actionData.error}</p>
          </Banner>
        )}

        <div className="flex flex-col gap-8 lg:flex-row">
          <div className="flex-1 space-y-6">
            <div
              className={`relative overflow-hidden rounded-2xl border bg-white shadow-sm ${
                isActive ? "border-green-200" : "border-amber-200"
              }`}
            >
              <div className={`absolute inset-y-0 left-0 w-1.5 ${isActive ? "bg-green-500" : "bg-amber-500"}`} />
              <div className="flex flex-col gap-4 border-b border-gray-100 bg-gray-50 p-5 pl-6 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-bold text-gray-900">Rule status</h2>
                    <Badge tone={isActive ? "success" : "attention"}>
                      {isActive ? "Active" : "Paused"}
                    </Badge>
                  </div>
                  <p className="max-w-xl text-sm text-gray-500">
                    Active rules are evaluated on the storefront. Paused rules remain saved for later.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsActive((current) => !current)}
                  className={`${isActive ? BUTTON_SECONDARY : BUTTON_PRIMARY} min-w-[112px]`}
                >
                  {isActive ? "Pause rule" : "Activate"}
                </button>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 bg-gray-50 p-6">
                <h2 className="text-base font-bold text-gray-800">Rule details</h2>
                <p className="mt-1 text-xs text-gray-400">
                  Name this rule so it is easy to identify in the rule list.
                </p>
              </div>
              <div className="p-6">
                <TextField
                  label="Rule name"
                  value={ruleName}
                  onChange={setRuleName}
                  autoComplete="off"
                  placeholder="United States priority delivery"
                  helpText="Shown only inside the app. Max 120 characters."
                />
              </div>
            </div>

            <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 p-6">
                <div className="space-y-1">
                  <h2 className="text-base font-bold text-gray-800">Visual Experience</h2>
                  <p className="text-xs text-gray-400">Preview and modify the delivery widget design used by this rule.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTemplateModalOpen(true)}
                    className={`${BUTTON_SECONDARY} gap-2 whitespace-nowrap`}
                  >
                    <span className="h-4 w-4 text-gray-400"><Icon source={WandIcon} /></span>
                    Templates
                  </button>
                  {selectedWidget && (
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedWidgetLocked) {
                          openUpgradeModal(
                            selectedWidget.name || "Selected design",
                            selectedWidgetRequiredPlan.name,
                            "/app/pricing?upgrade=studio",
                            `This design requires the ${selectedWidgetRequiredPlan.name} plan or higher before it can be customized.`,
                          );
                          return;
                        }
                        if (selectedWidget.isReusable && !selectedWidget.isDefault) {
                          handleUseSavedDesign(selectedWidget, { customizeAfterApply: true });
                          return;
                        }
                        navigate(customizeUrl);
                      }}
                      className={`${selectedWidgetLocked ? BUTTON_SECONDARY : BUTTON_PRIMARY} gap-2 whitespace-nowrap`}
                    >
                      {selectedWidgetLocked ? (
                        <LockGlyph className="h-4 w-4 text-gray-500" />
                      ) : (
                        <span className="h-4 w-4 text-white"><Icon source={EditIcon} /></span>
                      )}
                      {selectedWidgetLocked ? "Upgrade to customize" : "Customize"}
                    </button>
                  )}
                </div>
              </div>
              <div className="space-y-4 p-6">
                {selectedWidget && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Current design</p>
                        <p className="text-sm font-bold text-gray-900">{selectedWidget.name}</p>
                        <p className="mt-1 text-xs text-gray-500">
                          {selectedWidget.isDefault
                            ? "Default storefront design"
                            : selectedWidget.isReusable
                              ? "Saved My design"
                              : "Rule design"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedWidgetLocked) {
                            openUpgradeModal(
                              selectedWidget.name || "Selected design",
                              selectedWidgetRequiredPlan.name,
                              "/app/pricing?upgrade=design",
                              `This selected design includes premium components that require the ${selectedWidgetRequiredPlan.name} plan or higher.`,
                            );
                          }
                        }}
                        className={`inline-flex items-center ${selectedWidgetLocked ? "cursor-pointer gap-1" : "cursor-default"}`}
                      >
                        {selectedWidgetLocked && <LockGlyph className="h-3.5 w-3.5 text-amber-700" />}
                        <Badge tone={selectedWidgetLocked ? "warning" : selectedWidget.isActive ? "success" : "attention"}>
                          {selectedWidgetLocked ? `${selectedWidgetRequiredPlan.name} required` : selectedWidget.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </button>
                    </div>
                    {selectedWidgetLocked && (
                      <Banner title="Selected design is locked by your current plan" tone="warning">
                        <p>
                          This rule can be viewed, but it cannot be saved or customized until you upgrade or choose a basic design.
                        </p>
                      </Banner>
                    )}
                    <div className="relative flex min-h-[300px] items-center justify-center overflow-hidden rounded-2xl border border-gray-100 bg-gray-50/50 p-6">
                      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1.5px,transparent_1.5px)] [background-size:24px_24px] opacity-20" />
                      <div className="relative z-10 w-full">
                        <WidgetPreviewRenderer
                          settings={{
                            ...selectedWidget,
                            style: "custom",
                            customBlocks: parseBlockConfigs(selectedWidget.customBlocks),
                            ...locationRowPreviewSettings,
                            isActive: true,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="flex flex-col gap-4 border-b border-gray-100 bg-gray-50 p-6 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <h2 className="text-base font-bold text-gray-800">Country targeting</h2>
                  <p className="text-xs text-gray-400">
                    Choose countries manually or use the countries from configured Shopify Markets.
                  </p>
                </div>
                <div className="grid w-full gap-2 rounded-2xl border border-gray-100 bg-white p-1 md:w-[360px] md:grid-cols-2">
                  {[
                    { id: "manual", label: "Manual countries" },
                    { id: "markets", label: "Shopify Markets" },
                  ].map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleCountrySourceChange(option.id as CountrySource)}
                      className={`inline-flex h-9 items-center justify-center rounded-xl px-3 text-xs font-bold transition-all ${
                        countrySource === option.id
                          ? "bg-gray-900 text-white shadow-sm"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-950"
                      }`}
                    >
                      {option.id === "markets" && !currentPlan.plan.limits.shopifyMarkets && (
                        <LockGlyph className="mr-1.5 h-3.5 w-3.5" />
                      )}
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-3 p-6">
                  {countrySource === "manual" ? (
                    <CountryPicker
                      selectedCodes={selectedCountryCodes}
                      onChange={handleManualCountryChange}
                    />
                  ) : (
                    <ShopifyMarketPicker
                      markets={shopifyMarkets}
                      error={shopifyMarketsError}
                      selectedMarketIds={selectedMarketIds}
                      onChange={handleMarketCountryChange}
                    />
                  )}

                  {countryTargetError && (
                    <p className="text-xs font-medium text-red-600">{countryTargetError}</p>
                  )}
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="flex flex-col gap-4 border-b border-gray-100 bg-gray-50 p-6 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <h2 className="text-base font-bold text-gray-800">Product targeting</h2>
                  <p className="text-xs text-gray-400">
                    Storefront matching checks product, collection, tag, then country-wide rules.
                  </p>
                </div>
                <div className="grid w-full gap-2 rounded-2xl border border-gray-100 bg-white p-1 md:w-[420px] md:grid-cols-3">
                {[
                  { id: "product", label: "Products" },
                  { id: "collection", label: "Collections" },
                  { id: "tag", label: "Product tags" },
                ].map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleTargetModeChange(option.id as TargetMode)}
                    className={`h-9 rounded-xl px-3 text-xs font-bold transition-all ${
                      targetMode === option.id
                        ? "bg-gray-900 text-white shadow-sm"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-950"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
                </div>
              </div>
              <div className="space-y-4 p-6">
                {targetMode === "product" && (
                  <div className="space-y-3">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">Target products</p>
                        <p className="mt-1 text-xs text-gray-500">
                          {selectedProductIds.length > 0
                            ? `${selectedProductIds.length} product${selectedProductIds.length === 1 ? "" : "s"} selected.`
                            : "Optional. Leave empty if this rule should match all products in the selected country."}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleOpenProductPicker()}
                        className={BUTTON_SECONDARY}
                      >
                        Choose products
                      </button>
                    </div>
                    <SelectedTargetList
                      items={selectedProducts}
                      totalCount={selectedProductIds.length}
                      emptyText="No products selected. This rule will match all products for the selected country unless another targeting type is used."
                      onRemove={handleRemoveProduct}
                      onLoadMore={handleLoadMoreProducts}
                      isLoadingMore={isLoadingMoreProducts}
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      {selectedProductIds.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setTargetProducts("");
                            setSelectedProducts([]);
                            setTargetPickerError("");
                            setProductLoadOffset(0);
                          }}
                          className={BUTTON_SECONDARY}
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {targetMode === "collection" && (
                  <div className="space-y-3">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">Target collections</p>
                        <p className="mt-1 text-xs text-gray-500">
                          {selectedCollectionIds.length > 0
                            ? `${selectedCollectionIds.length} collection${selectedCollectionIds.length === 1 ? "" : "s"} selected.`
                            : "Optional. Leave empty if this rule should match all products in the selected country."}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleOpenCollectionPicker()}
                        className={BUTTON_SECONDARY}
                      >
                        Choose collections
                      </button>
                    </div>
                    <SelectedTargetList
                      items={selectedCollections}
                      totalCount={selectedCollectionIds.length}
                      emptyText="No collections selected. This rule will match all products for the selected country unless another targeting type is used."
                      onRemove={handleRemoveCollection}
                      onLoadMore={handleLoadMoreCollections}
                      isLoadingMore={isLoadingMoreCollections}
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      {selectedCollectionIds.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setTargetCollections("");
                            setSelectedCollections([]);
                            setTargetPickerError("");
                            setCollectionLoadOffset(0);
                          }}
                          className={BUTTON_SECONDARY}
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {targetMode === "tag" && (
                  <TextField
                    label="Target product tags"
                    value={targetTags}
                    onChange={setTargetTags}
                    autoComplete="off"
                    placeholder="VIP, Pre-order"
                    helpText="Optional. Leave empty if this rule should match all products in the selected country."
                  />
                )}

                {targetPickerError && (
                  <p className="text-xs font-medium text-red-600">{targetPickerError}</p>
                )}
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 bg-gray-50 p-6">
                <h2 className="text-base font-bold text-gray-800">Inventory</h2>
                <p className="mt-1 text-xs text-gray-400">
                  ETA can be set based on stock status, such as in-stock, out-of-stock, or both.
                </p>
              </div>
              <div className="space-y-4 p-6">
                <p className="text-sm font-semibold text-gray-800">Select option</p>
                <div className="space-y-3">
                  {INVENTORY_STATUS_OPTIONS.map((option) => {
                    const optionId = `inventory-status-${option.value}`;

                    return (
                      <label
                        key={option.value}
                        htmlFor={optionId}
                        aria-label={option.label}
                        className="grid cursor-pointer grid-cols-[1.25rem_1fr] gap-3 rounded-xl px-1 py-1.5 text-sm text-gray-700"
                      >
                        <input
                          id={optionId}
                          type="radio"
                          name="inventoryStatus"
                          checked={inventoryStatus === option.value}
                          onChange={() => setInventoryStatus(option.value)}
                          className="mt-0.5 h-4 w-4 border-gray-300 text-gray-900 focus:ring-gray-900"
                        />
                        <span className="min-w-0">
                          <span className="block font-semibold text-gray-900">{option.label}</span>
                          <span className="mt-1 block leading-5 text-gray-500">{option.description}</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 bg-gray-50 p-6">
                <h2 className="text-base font-bold text-gray-800">Delivery timing, message, and logic</h2>
                <p className="mt-1 text-xs text-gray-400">
                  Configure ETA dates, storefront text, cut-off rules, holidays, and visibility.
                </p>
                <div className="mt-4 grid w-full gap-2 rounded-2xl border border-gray-100 bg-white p-1 md:grid-cols-4">
                  {OPERATIONAL_TABS.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveOperationalTab(tab.id)}
                      className={`h-9 rounded-xl px-3 text-xs font-bold transition-all ${
                        activeOperationalTab === tab.id
                          ? "bg-gray-900 text-white shadow-sm"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-950"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-4 p-6">
                {activeOperationalTab === "timing" && (
                  <>
                    <FormLayout.Group>
                      <TextField
                        label="Min delivery days"
                        type="number"
                        value={minDays}
                        onChange={setMinDays}
                        min={0}
                        autoComplete="off"
                        helpText="Earliest delivery date after processing."
                      />
                      <TextField
                        label="Max delivery days"
                        type="number"
                        value={maxDays}
                        onChange={setMaxDays}
                        min={0}
                        autoComplete="off"
                        helpText="Latest delivery date after processing."
                      />
                    </FormLayout.Group>
                    <TextField
                      label="Processing days"
                      type="number"
                      value={processingDays}
                      onChange={setProcessingDays}
                      min={0}
                      autoComplete="off"
                      helpText="Days needed before the order is ready to ship."
                    />
                    <TextField
                      label="Storefront message"
                      value={shippingMessage}
                      onChange={setShippingMessage}
                      autoComplete="off"
                      multiline={3}
                      helpText="Supported placeholders: {order_date}, {ship_date}, {min_date}, {max_date}."
                    />
                  </>
                )}

                {activeOperationalTab === "cutoff" && (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-sky-100 bg-sky-50 p-3 text-xs leading-5 text-sky-900">
                      Orders after this time start ETA calculation from the next business day. Countdown blocks use this cut-off automatically.
                    </div>
                    <FormLayout.Group>
                      <TextField
                        label="Cut-off time"
                        type="time"
                        value={cutoffTime}
                        onChange={setCutoffTime}
                        autoComplete="off"
                      />
                      <div>
                        <label htmlFor="cutoffTimezone" className="mb-1 block text-sm text-gray-900">Timezone</label>
                        <select
                          id="cutoffTimezone"
                          value={cutoffTimezone}
                          onChange={(event) => setCutoffTimezone(event.currentTarget.value)}
                          className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                        >
                          {OPERATIONAL_TIMEZONES.map((timeZone) => (
                            <option key={timeZone} value={timeZone}>{timeZone}</option>
                          ))}
                        </select>
                      </div>
                    </FormLayout.Group>
                  </div>
                )}

                {activeOperationalTab === "holidays" && (
                  <TextField
                    label="Holiday dates"
                    value={holidayDates}
                    onChange={setHolidayDates}
                    autoComplete="off"
                    multiline={4}
                    placeholder={"2026-01-01\n2026-12-25"}
                    helpText="One date per line. These dates are skipped when calculating ship and delivery dates."
                  />
                )}

                {activeOperationalTab === "visibility" && (
                  <div className="space-y-3">
                    {VISIBILITY_MODE_OPTIONS.map((option) => (
                      <label
                        key={option.value}
                        className="grid cursor-pointer grid-cols-[1.25rem_1fr] gap-3 rounded-xl px-1 py-1.5 text-sm text-gray-700"
                      >
                        <input
                          type="radio"
                          checked={visibilityMode === option.value}
                          onChange={() => setVisibilityMode(option.value)}
                          className="mt-0.5 h-4 w-4 border-gray-300 text-gray-900 focus:ring-gray-900"
                        />
                        <span className="font-semibold text-gray-900">{option.label}</span>
                      </label>
                    ))}
                    <p className="text-xs leading-5 text-gray-500">
                      Hidden rules still match their target, then suppress the storefront widget for that traffic.
                    </p>
                  </div>
                )}

              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="flex flex-col gap-4 border-b border-gray-100 bg-gray-50 p-6 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <h2 className="text-sm font-bold text-gray-800">Store Integration</h2>
                  <p className="text-xs text-gray-400">Position the widget on your product pages.</p>
                </div>
                <button
                  type="button"
                  onClick={() => window.open(themeEditorUrl, "_blank")}
                  className={`${BUTTON_PRIMARY} gap-2 whitespace-nowrap`}
                >
                  <span className="h-4 w-4 text-white"><Icon source={ViewIcon} /></span>
                  Open Theme Editor
                </button>
              </div>
              <div className="space-y-4 p-6">
                <div className="rounded-xl border border-green-100 bg-green-50 p-4">
                  <p className="text-[11px] font-medium leading-relaxed text-green-800">
                    <b>Tip:</b> After opening the editor, add the <b>"Estimated Delivery Pro"</b> block to your Product template.
                  </p>
                </div>
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                  <img
                    src="/add-block-to-product-sample.jpeg"
                    alt="Add BP Estimated Delivery block to the Product template"
                    loading="lazy"
                    className="block w-full object-cover"
                  />
                </div>
              </div>
            </div>

          </div>

          <div className="w-full space-y-6 lg:w-96">
            <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 p-5">
                <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Context Preview</h2>
                <Badge tone={isActive ? "success" : "attention"}>
                  {isActive ? "Live" : "Paused"}
                </Badge>
              </div>

              <div className="flex flex-1 flex-col gap-6 bg-[#f8fafc] p-6">
                <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-gray-100 shadow-sm">
                  <div className="absolute left-4 top-4 z-10">
                    <Badge tone="attention">
                      New arrival
                    </Badge>
                  </div>
                  <img
                    src="/fashion-sample.png"
                    alt="Product preview"
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="h-4 w-3/4 rounded-full bg-gray-200" />
                    <div className="h-3 w-1/2 rounded-full bg-gray-100" />
                  </div>

                  <button
                    type="button"
                    className={`${BUTTON_PRIMARY} w-full`}
                  >
                    Buy Now - $129.00
                  </button>

                  {selectedWidget && (
                    <div className="pointer-events-none w-full">
                      <WidgetPreviewRenderer
                        settings={{
                          ...selectedWidget,
                          style: "custom",
                          customBlocks: parseBlockConfigs(selectedWidget.customBlocks),
                          ...locationRowPreviewSettings,
                          isActive: true,
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 p-5">
                <h3 className="text-sm font-bold text-gray-800">Rule summary</h3>
                <span className="h-4 w-4 text-gray-400"><Icon source={ViewIcon} /></span>
              </div>
              <div className="space-y-3 p-6 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-gray-500">Countries</span>
                  <span className="text-right font-bold text-gray-900">
                    {countrySelectionLabel(selectedCountryCodes, countryCode)}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-gray-500">Inventory</span>
                  <span className="text-right font-bold text-gray-900">
                    {inventoryStatusLabel(inventoryStatus)}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-gray-500">Timeline</span>
                  <span className="font-bold text-gray-900">
                    {daysLabel(timelineSummary.min)} - {daysLabel(timelineSummary.max)}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-gray-500">Processing</span>
                  <span className="font-bold text-gray-900">{daysLabel(timelineSummary.processing)}</span>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Message preview</p>
                  <p className="mt-1 text-sm font-medium text-gray-800">
                    {previewRuleMessage(shippingMessage)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {templateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="flex flex-col gap-4 border-b border-gray-100 bg-gray-50 p-5 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-gray-950">Choose widget template</h2>
                  <p className="text-xs text-gray-500">
                    Select any gallery template or saved My design without leaving this rule.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setTemplateModalOpen(false)}
                  aria-label="Close template modal"
                  title="Close"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 shadow-sm transition-all hover:bg-gray-50"
                >
                  <span className="h-4 w-4">
                    <Icon source={XIcon} />
                  </span>
                </button>
              </div>

              <div className="border-b border-gray-100">
                <div className="grid grid-cols-2">
                  {MAIN_TABS.map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTemplateTab(tab)}
                      className={`relative flex h-12 items-center justify-center text-sm font-bold transition-colors ${
                        activeTemplateTab === tab
                          ? "text-gray-950"
                          : "text-gray-500 hover:bg-gray-50 hover:text-gray-950"
                      }`}
                    >
                      {tab}
                      {activeTemplateTab === tab && (
                        <span className="absolute -bottom-px left-1 right-1 h-0.5 rounded-full bg-gray-900" />
                      )}
                    </button>
                  ))}
                </div>

                {activeTemplateTab === "General" && (
                  <div className="overflow-x-auto px-3 py-4">
                    <div className="flex min-w-max gap-2">
                      {CATEGORIES.map((category) => (
                        <button
                          key={category}
                          type="button"
                          onClick={() => setActiveCategory(category)}
                          className={`inline-flex h-9 items-center justify-center rounded-xl px-3 text-xs font-bold transition-colors ${
                            activeCategory === category
                              ? "bg-gray-100 text-gray-950 shadow-sm"
                              : "text-gray-600 hover:bg-gray-50 hover:text-gray-950"
                          }`}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="overflow-y-auto bg-[#f6f6f7] p-4">
                {activeTemplateTab === "General" ? (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {visibleTemplates.map((template) => {
                      const isApplying = submittingIntent === "apply-template" && pendingStyle === template.style;
                      const isLocked = !canUseTemplate(currentPlan.plan, template.style);
                      const settings = TEMPLATE_DEFAULTS[template.style];
                      const previewSettings = {
                        ...settings,
                        customBlocks: hydrateBlocksForTemplate(settings.customBlocks, settings),
                      };

                      return (
                        <article
                          key={template.style}
                          className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                        >
                          <div className="p-4">
                            <div className="rounded-xl bg-gray-50 p-2">
                              <WidgetPreviewRenderer
                                settings={{
                                  ...previewSettings,
                                  shadow: "none",
                                  ...locationRowPreviewSettings,
                                }}
                              />
                            </div>
                          </div>
                          <div className="mt-auto border-t border-gray-100 p-4">
                            <div className="mb-2 min-h-[48px]">
                              <h3 className="text-sm font-bold text-gray-950">{template.name}</h3>
                              <p className="mt-1 line-clamp-2 text-xs leading-4 text-gray-500">{template.description}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleUseTemplate(template)}
                              disabled={isSubmitting}
                              className={`${isLocked ? BUTTON_SECONDARY : BUTTON_PRIMARY} w-full`}
                            >
                              {isApplying ? (
                                "Applying..."
                              ) : isLocked ? (
                                <>
                                  <LockGlyph className="mr-1.5 h-3.5 w-3.5" />
                                  Upgrade to use
                                </>
                              ) : (
                                "Use template"
                              )}
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <button
                      type="button"
                      onClick={handleCreateDesign}
                      disabled={isSubmitting}
                      className="flex min-h-[360px] h-full flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-center shadow-sm transition-all hover:border-gray-900 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-3xl font-light leading-none text-gray-900">
                        +
                      </span>
                      <span className="mt-4 text-sm font-bold text-gray-950">
                        {submittingIntent === "create-design" ? "Creating..." : "Create new design"}
                      </span>
                      <span className="mt-2 max-w-[220px] text-xs leading-5 text-gray-500">
                        Start from a blank delivery widget and customize it in the editor.
                      </span>
                    </button>

                    {typedSavedWidgets.map((widget) => {
                      const settings = widgetPreviewSettings(widget);
                      const updatedAt = new Intl.DateTimeFormat("en", {
                        month: "short",
                        day: "numeric",
                      }).format(new Date(widget.updatedAt));
                      const isApplying = submittingIntent === "saved-design" && pendingDesignId === widget.id;
                      const usedByRuleCount = widget.usedByRuleCount || 0;
                      const usageLabel = usedByRuleCount === 1 ? "Used by 1 rule" : `Used by ${usedByRuleCount} rules`;
                      const designLocked = !canEditWidget(currentPlan.plan, widget);
                      const designRequiredPlan = getRequiredPlanForWidget(widget);

                      return (
                        <article
                          key={widget.id}
                          className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                        >
                          <div className="p-4">
                            <div className="rounded-xl bg-gray-50 p-2">
                              <WidgetPreviewRenderer
                                settings={{
                                  ...settings,
                                  shadow: "none",
                                  ...locationRowPreviewSettings,
                                }}
                              />
                            </div>
                          </div>
                          <div className="mt-auto border-t border-gray-100 p-4">
                            <div className="mb-2 min-h-[48px]">
                              <div className="flex items-center justify-between gap-3">
                                <h3 className="min-w-0 flex-1 truncate text-sm font-bold text-gray-950">{widget.name}</h3>
                                <span
                                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                    designLocked
                                      ? "bg-amber-100 text-amber-800"
                                      : usedByRuleCount > 0
                                        ? "bg-blue-50 text-blue-700"
                                        : "bg-gray-100 text-gray-600"
                                  }`}
                                >
                                  {designLocked ? (
                                    <span className="inline-flex items-center gap-1">
                                      <LockGlyph className="h-3 w-3" />
                                      {designRequiredPlan.name} required
                                    </span>
                                  ) : usedByRuleCount > 0 ? usageLabel : "Unused"}
                                </span>
                              </div>
                              <p className="mt-1 text-xs leading-4 text-gray-500">Updated {updatedAt}</p>
                            </div>
                            <div className="grid gap-2">
                              <button
                                type="button"
                                onClick={() => handleUseSavedDesign(widget)}
                                disabled={isSubmitting}
                                className={`${designLocked ? BUTTON_SECONDARY : BUTTON_PRIMARY} w-full`}
                              >
                                {isApplying ? (
                                  "Applying..."
                                ) : designLocked ? (
                                  <>
                                    <LockGlyph className="mr-1.5 h-3.5 w-3.5" />
                                    Upgrade to use
                                  </>
                                ) : (
                                  "Use design"
                                )}
                              </button>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
