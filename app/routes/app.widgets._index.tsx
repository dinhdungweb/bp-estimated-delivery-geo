import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import type { Prisma } from "@prisma/client";
import { useLoaderData, useNavigate, useSubmit, data as routerData } from "react-router";
import { Icon } from "@shopify/polaris";
import { DeleteIcon, EditIcon, PlusIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { buildFallbackBlocks, DEFAULT_SHIPPING_MESSAGE } from "../lib/delivery";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const widgets = await prisma.widget.findMany({
    where: { shop: session.shop },
    orderBy: { createdAt: "desc" },
  });
  return routerData({ widgets });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "create") {
    const widget = await prisma.widget.create({
      data: {
        shop: session.shop,
        name: "New Widget",
        isDefault: false,
        isActive: true,
        padding: 16,
        customBlocks: buildFallbackBlocks(
          {},
          DEFAULT_SHIPPING_MESSAGE,
        ) as unknown as Prisma.InputJsonValue,
      },
    });
    return routerData({ widgetId: widget.id });
  }

  if (intent === "delete") {
    const id = String(formData.get("id"));
    await prisma.widget.deleteMany({ where: { id, shop: session.shop } });
    return routerData({ success: true });
  }

  return routerData({ success: false });
};

export default function WidgetListPage() {
  const { widgets } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const submit = useSubmit();

  return (
    <div className="min-h-screen bg-[#f6f6f7] p-4 font-sans md:p-6">
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Widgets</h1>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-blue-500" />
              <p className="text-sm text-gray-500">Manage your delivery estimation widgets.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => submit({ intent: "create" }, { method: "post" })}
            className="inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-gray-900 px-3 text-xs font-bold text-white shadow-md transition-all hover:bg-black"
          >
            <span className="h-4 w-4"><Icon source={PlusIcon} /></span>
            Add Widget
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Name</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Status</th>
                <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-widest text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {widgets.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-gray-800">{item.name}</p>
                    {item.isDefault && (
                      <span className="rounded bg-blue-100 px-1 py-0.5 text-[9px] font-bold uppercase text-blue-600">
                        Default
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        item.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}
                    >
                      {item.isActive ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => navigate(`/app/widgets/${item.id}`)}
                        className="inline-flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border border-blue-700 bg-blue-600 px-3 text-xs font-bold text-white shadow-sm transition-all hover:bg-blue-700"
                      >
                        <span className="h-4 w-4"><Icon source={EditIcon} /></span>
                        Customize Design
                      </button>
                      {!item.isDefault && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm("Delete this widget?")) {
                              submit({ intent: "delete", id: item.id }, { method: "post" });
                            }
                          }}
                          className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                          title="Delete Widget"
                        >
                          <Icon source={DeleteIcon} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
