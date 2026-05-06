import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { data, useLoaderData, useNavigation, useSubmit } from "react-router";
import { Badge, Banner, Icon } from "@shopify/polaris";
import { ViewIcon } from "@shopify/polaris-icons";
import prisma from "../db.server";
import { ensureAppSetting } from "../lib/deliveryRules.server";
import { authenticate } from "../shopify.server";

const BUTTON_BASE =
  "inline-flex h-9 items-center justify-center rounded-xl px-3 text-xs font-bold transition-all disabled:cursor-not-allowed disabled:opacity-50";
const BUTTON_PRIMARY = `${BUTTON_BASE} bg-gray-900 text-white shadow-md shadow-gray-200 hover:bg-black`;
const BUTTON_SECONDARY = `${BUTTON_BASE} border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50`;

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const setting = await ensureAppSetting(session.shop);
  const [totalRules, activeRules] = await Promise.all([
    prisma.deliveryRule.count({ where: { shop: session.shop } }),
    prisma.deliveryRule.count({ where: { shop: session.shop, isActive: true } }),
  ]);

  return data({
    isEnabled: setting.isEnabled,
    shop: session.shop,
    totalRules,
    activeRules,
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = String(formData.get("intent") || "");

  if (intent !== "set-global-enabled") {
    return data({ error: "Unknown intent." }, { status: 400 });
  }

  const isEnabled = formData.get("isEnabled") === "true";
  await ensureAppSetting(session.shop);
  await prisma.appSetting.update({
    where: { shop: session.shop },
    data: { isEnabled },
  });

  return data({ success: true });
};

export default function AppSettingsPage() {
  const { isEnabled, shop, totalRules, activeRules } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const shopHandle = shop.split(".")[0];
  const themeEditorUrl = `https://admin.shopify.com/store/${shopHandle}/themes/current/editor?context=apps`;

  const updateGlobalStatus = (nextEnabled: boolean) => {
    submit(
      {
        intent: "set-global-enabled",
        isEnabled: String(nextEnabled),
      },
      { method: "post" },
    );
  };

  return (
    <div className="min-h-screen bg-[#f6f6f7] p-4 font-sans md:p-6">
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
          <Badge tone={isEnabled ? "success" : "attention"}>
            {isEnabled ? "Storefront enabled" : "Storefront paused"}
          </Badge>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-gray-100 bg-gray-50 p-6 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <h2 className="text-base font-bold text-gray-800">Global Activation</h2>
                <p className="text-sm text-gray-500">
                  This controls whether the delivery widget can render on the storefront across all active rules.
                </p>
              </div>
              <Badge tone={isEnabled ? "success" : "attention"}>
                {isEnabled ? "Live" : "Paused"}
              </Badge>
            </div>
            <div className="space-y-5 p-6">
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-sm font-semibold text-gray-800">
                  {isEnabled
                    ? "The storefront can evaluate delivery rules."
                    : "The storefront is blocked even if delivery rules are active."}
                </p>
                <p className="mt-1 text-xs leading-5 text-gray-500">
                  Rule-specific active/draft status is still managed from the delivery rules list or rule editor.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {isEnabled ? (
                  <button
                    type="button"
                    onClick={() => updateGlobalStatus(false)}
                    disabled={isSubmitting}
                    className={BUTTON_SECONDARY}
                  >
                    Pause storefront widget
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => updateGlobalStatus(true)}
                    disabled={isSubmitting}
                    className={BUTTON_PRIMARY}
                  >
                    Enable storefront widget
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => window.open(themeEditorUrl, "_blank")}
                  className={`${BUTTON_SECONDARY} gap-2`}
                >
                  <span className="h-4 w-4 text-gray-500">
                    <Icon source={ViewIcon} />
                  </span>
                  Open Theme Editor
                </button>
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
