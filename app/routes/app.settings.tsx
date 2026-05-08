import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { data, useActionData, useLoaderData, useNavigation, useSubmit } from "react-router";
import { Badge, Banner, Icon } from "@shopify/polaris";
import { ViewIcon } from "@shopify/polaris-icons";
import { useCallback, useEffect, useState } from "react";
import prisma from "../db.server";
import {
  DEFAULT_LOCATION_PREFIX_TEXT,
  normalizeLocationPrefixText,
  normalizeLocationRowAlignment,
  type LocationRowAlignment,
} from "../lib/delivery";
import { ensureAppSetting } from "../lib/deliveryRules.server";
import { authenticate } from "../shopify.server";

const BUTTON_BASE =
  "inline-flex h-9 items-center justify-center rounded-xl px-3 text-xs font-bold transition-all disabled:cursor-not-allowed disabled:opacity-50";
const BUTTON_PRIMARY = `${BUTTON_BASE} bg-gray-900 text-white shadow-md shadow-gray-200 hover:bg-black`;
const BUTTON_SECONDARY = `${BUTTON_BASE} border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50`;

type ActionResult = {
  success?: boolean;
  error?: string;
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const setting = await ensureAppSetting(session.shop);
  const [totalRules, activeRules] = await Promise.all([
    prisma.deliveryRule.count({ where: { shop: session.shop } }),
    prisma.deliveryRule.count({ where: { shop: session.shop, isActive: true } }),
  ]);

  return data({
    isEnabled: setting.isEnabled,
    showLocationSelector: setting.showLocationSelector,
    locationPrefixText: setting.locationPrefixText,
    showLocationFlag: setting.showLocationFlag,
    locationRowAlignment: normalizeLocationRowAlignment(setting.locationRowAlignment),
    shop: session.shop,
    totalRules,
    activeRules,
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = String(formData.get("intent") || "");

  if (intent !== "save-settings" && intent !== "set-global-enabled" && intent !== "set-location-selector") {
    return data({ error: "Unknown intent." }, { status: 400 });
  }

  await ensureAppSetting(session.shop);

  if (intent === "save-settings") {
    const isEnabled = formData.get("isEnabled") === "true";
    const showLocationSelector = formData.get("showLocationSelector") === "true";
    const locationPrefixText = normalizeLocationPrefixText(formData.get("locationPrefixText"));
    const showLocationFlag = formData.get("showLocationFlag") !== "false";
    const locationRowAlignment = normalizeLocationRowAlignment(formData.get("locationRowAlignment"));

    await prisma.appSetting.update({
      where: { shop: session.shop },
      data: {
        isEnabled,
        showLocationSelector,
        locationPrefixText,
        showLocationFlag,
        locationRowAlignment,
      },
    });
  }

  if (intent === "set-global-enabled") {
    const isEnabled = formData.get("isEnabled") === "true";
    await prisma.appSetting.update({
      where: { shop: session.shop },
      data: { isEnabled },
    });
  }

  if (intent === "set-location-selector") {
    const showLocationSelector = formData.get("showLocationSelector") === "true";
    const locationPrefixText = normalizeLocationPrefixText(formData.get("locationPrefixText"));
    const showLocationFlag = formData.get("showLocationFlag") !== "false";
    const locationRowAlignment = normalizeLocationRowAlignment(formData.get("locationRowAlignment"));
    await prisma.appSetting.update({
      where: { shop: session.shop },
      data: {
        showLocationSelector,
        locationPrefixText,
        showLocationFlag,
        locationRowAlignment,
      },
    });
  }

  return data({ success: true });
};

function ToggleSwitch({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0 space-y-1">
        <p className="text-sm font-bold text-gray-900">{label}</p>
        {description && <p className="text-xs leading-5 text-gray-500">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full p-0.5 transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
          checked ? "bg-gray-900" : "bg-gray-300"
        }`}
      >
        <span
          className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

export default function AppSettingsPage() {
  const {
    isEnabled,
    showLocationSelector,
    locationPrefixText,
    showLocationFlag,
    locationRowAlignment,
    shop,
    totalRules,
    activeRules,
  } = useLoaderData<typeof loader>();
  const actionData = useActionData() as ActionResult | undefined;
  const submit = useSubmit();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const shopHandle = shop.split(".")[0];
  const themeEditorUrl = `https://admin.shopify.com/store/${shopHandle}/themes/current/editor?context=apps`;
  const [isEnabledDraft, setIsEnabledDraft] = useState(isEnabled);
  const [showLocationSelectorDraft, setShowLocationSelectorDraft] = useState(showLocationSelector);
  const [locationPrefixDraft, setLocationPrefixDraft] = useState(locationPrefixText || DEFAULT_LOCATION_PREFIX_TEXT);
  const [showLocationFlagDraft, setShowLocationFlagDraft] = useState(showLocationFlag);
  const [locationRowAlignmentDraft, setLocationRowAlignmentDraft] =
    useState<LocationRowAlignment>(locationRowAlignment);
  const [toast, setToast] = useState<{ message: string; isError?: boolean } | null>(null);

  const showToast = useCallback((message: string, isError = false) => {
    const shopify = (globalThis as unknown as {
      shopify?: { toast?: { show?: (message: string, options?: { isError?: boolean }) => void } };
    }).shopify;

    if (shopify?.toast?.show) {
      shopify.toast.show(message, { isError });
      return;
    }

    setToast({ message, isError });
  }, []);

  useEffect(() => {
    setIsEnabledDraft(isEnabled);
    setShowLocationSelectorDraft(showLocationSelector);
    setLocationPrefixDraft(locationPrefixText || DEFAULT_LOCATION_PREFIX_TEXT);
    setShowLocationFlagDraft(showLocationFlag);
    setLocationRowAlignmentDraft(locationRowAlignment);
  }, [isEnabled, locationPrefixText, locationRowAlignment, showLocationFlag, showLocationSelector]);

  useEffect(() => {
    if (navigation.state !== "idle") return;
    if (actionData?.error) {
      showToast(actionData.error, true);
      return;
    }
    if (actionData?.success) {
      showToast("Settings saved.");
    }
  }, [actionData, navigation.state, showToast]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const hasUnsavedChanges =
    isEnabledDraft !== isEnabled ||
    showLocationSelectorDraft !== showLocationSelector ||
    normalizeLocationPrefixText(locationPrefixDraft) !== normalizeLocationPrefixText(locationPrefixText) ||
    showLocationFlagDraft !== showLocationFlag ||
    locationRowAlignmentDraft !== locationRowAlignment;

  const saveSettings = () => {
    submit(
      {
        intent: "save-settings",
        isEnabled: String(isEnabledDraft),
        showLocationSelector: String(showLocationSelectorDraft),
        locationPrefixText: locationPrefixDraft,
        showLocationFlag: String(showLocationFlagDraft),
        locationRowAlignment: locationRowAlignmentDraft,
      },
      { method: "post" },
    );
  };
  const locationPreviewText = normalizeLocationPrefixText(locationPrefixDraft);
  const locationPreviewJustify =
    locationRowAlignmentDraft === "left" ? "flex-start" : locationRowAlignmentDraft === "center" ? "center" : "flex-end";

  return (
    <div className="min-h-screen bg-[#f6f6f7] p-4 font-sans md:p-6">
      {toast && (
        <div
          className={`fixed right-5 top-5 z-50 w-[min(360px,calc(100vw-2.5rem))] rounded-2xl border bg-white shadow-xl ${
            toast.isError ? "border-red-200" : "border-green-200"
          }`}
        >
          <div className="flex items-start gap-3 p-4">
            <span
              className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                toast.isError ? "bg-red-500" : "bg-green-500"
              }`}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-gray-900">{toast.message}</p>
              <p className="mt-1 text-xs leading-5 text-gray-500">
                {toast.isError ? "Please review the setting and try again." : "Your app settings are now saved."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="text-xs font-bold text-gray-400 transition-colors hover:text-gray-900"
              aria-label="Dismiss notification"
            >
              Close
            </button>
          </div>
        </div>
      )}
      <div className="mx-auto max-w-[1440px] space-y-4">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">App Settings</h1>
            <div className="flex items-center gap-2">
              <span className={`flex h-2 w-2 rounded-full ${isEnabled ? "bg-green-500" : "bg-amber-500"}`} />
              <p className="text-sm text-gray-500">
                Manage app-level storefront activation and theme setup.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {hasUnsavedChanges && <Badge tone="attention">Unsaved changes</Badge>}
            <Badge tone={isEnabledDraft ? "success" : "attention"}>
              {isEnabledDraft ? "Storefront enabled" : "Storefront paused"}
            </Badge>
            <button
              type="button"
              onClick={saveSettings}
              disabled={isSubmitting || !hasUnsavedChanges}
              className={BUTTON_PRIMARY}
            >
              {isSubmitting ? "Saving..." : "Save settings"}
            </button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-gray-100 bg-gray-50 p-6 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <h2 className="text-base font-bold text-gray-800">Global Activation</h2>
                <p className="text-sm text-gray-500">
                  This controls whether the delivery widget can render on the storefront across all active rules.
                </p>
              </div>
              <Badge tone={isEnabledDraft ? "success" : "attention"}>
                {isEnabledDraft ? "Live" : "Paused"}
              </Badge>
            </div>
            <div className="grid gap-4 p-6 lg:grid-cols-[1fr_220px]">
              <div className="space-y-3">
                <ToggleSwitch
                  label="Enable storefront widget"
                  description="Allow active rules to render on product pages."
                  checked={isEnabledDraft}
                  disabled={isSubmitting}
                  onChange={setIsEnabledDraft}
                />
              </div>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => window.open(themeEditorUrl, "_blank")}
                  className={`${BUTTON_SECONDARY} w-full gap-2`}
                >
                  <span className="h-4 w-4 text-gray-500">
                    <Icon source={ViewIcon} />
                  </span>
                  Open Theme Editor
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-gray-100 bg-gray-50 p-6 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <h2 className="text-base font-bold text-gray-800">Delivery Location Row</h2>
                <p className="text-sm text-gray-500">
                  Show or hide the flag and country selector below every storefront delivery widget.
                </p>
              </div>
              <Badge tone={showLocationSelectorDraft ? "success" : "attention"}>
                {showLocationSelectorDraft ? "Shown globally" : "Hidden globally"}
              </Badge>
            </div>
            <div className="space-y-5 p-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <ToggleSwitch
                  label="Show delivery location row"
                  description="Display the country selector below every storefront delivery widget."
                  checked={showLocationSelectorDraft}
                  disabled={isSubmitting}
                  onChange={setShowLocationSelectorDraft}
                />
                <ToggleSwitch
                  label="Show flag"
                  description="Country text stays visible when the flag is hidden."
                  checked={showLocationFlagDraft}
                  disabled={isSubmitting}
                  onChange={setShowLocationFlagDraft}
                />
              </div>

              <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-gray-500" htmlFor="locationPrefixText">
                    Location text
                  </label>
                  <input
                    id="locationPrefixText"
                    value={locationPrefixDraft}
                    onChange={(event) => setLocationPrefixDraft(event.currentTarget.value)}
                    className="mt-2 h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-gray-900 outline-none transition focus:border-gray-900"
                    placeholder={DEFAULT_LOCATION_PREFIX_TEXT}
                  />
                  <p className="mt-2 text-xs leading-5 text-gray-500">
                    This text appears before the detected country name.
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Position</p>
                  <div className="mt-2 grid grid-cols-3 gap-2 rounded-2xl bg-gray-100 p-1">
                    {(["left", "center", "right"] as const).map((alignment) => (
                      <button
                        key={alignment}
                        type="button"
                        onClick={() => setLocationRowAlignmentDraft(alignment)}
                        disabled={isSubmitting}
                        className={`h-9 rounded-xl text-xs font-bold capitalize transition ${
                          locationRowAlignmentDraft === alignment
                            ? "bg-white text-gray-950 shadow-sm"
                            : "text-gray-500 hover:text-gray-950"
                        }`}
                      >
                        {alignment}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs leading-5 text-gray-500">
                    Choose where the row sits inside each widget.
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-5">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Preview</p>
                <div className="mt-3 flex rounded-xl bg-gray-50 p-4" style={{ justifyContent: locationPreviewJustify }}>
                  {showLocationSelectorDraft ? (
                    <div className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-900">
                      {showLocationFlagDraft && (
                        <img
                          src="https://flagcdn.com/us.svg"
                          alt="United States flag"
                          className="h-3.5 w-5 object-cover"
                          loading="lazy"
                        />
                      )}
                      <span>{locationPreviewText}</span>
                      <span className="font-bold text-blue-600">United States</span>
                    </div>
                  ) : (
                    <p className="text-xs font-medium text-gray-400">Location row hidden</p>
                  )}
                </div>
              </div>
            </div>
          </div>
          </div>

          <div className="space-y-4">
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 bg-gray-50 px-5 py-4">
                <h2 className="text-sm font-bold text-gray-800">Rule Coverage</h2>
              </div>
              <div className="space-y-3 p-5 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-gray-500">Total rules</span>
                  <span className="font-bold text-gray-900">{totalRules}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-gray-500">Active rules</span>
                  <span className="font-bold text-green-700">{activeRules}</span>
                </div>
              </div>
            </div>

            <Banner title="Theme block required" tone="info">
              <p>
                Keep the app embed or theme block installed in the Shopify Theme Editor so active rules can appear on product pages.
              </p>
            </Banner>
          </div>
        </div>
      </div>
    </div>
  );
}
