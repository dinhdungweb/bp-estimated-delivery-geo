import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import type { Prisma } from "@prisma/client";
import { useLoaderData, useSubmit, useNavigate, data as routerData } from "react-router";
import { 
  PlusIcon, 
  EditIcon, 
  DuplicateIcon,
  DeleteIcon
} from "@shopify/polaris-icons";
import { Icon } from "@shopify/polaris";
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
    <div className="min-h-screen bg-[#f6f6f7] p-4 md:p-6 space-y-6 font-sans">
      <div className="flex items-center justify-between">
         <div className="space-y-1">
            <h1 className="text-xl font-bold text-gray-900">Widgets</h1>
            <p className="text-xs text-gray-400">Manage your delivery estimation widgets.</p>
         </div>
         <button 
           onClick={() => submit({ intent: "create" }, { method: "post" })}
           className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md transition-all flex items-center gap-2"
         >
           <span>➕</span> Add Widget
         </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
         <table className="w-full text-left border-collapse">
            <thead>
               <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Name</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
               {widgets.map((item: any) => (
                 <tr key={item.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4">
                       <p className="text-sm font-bold text-gray-800">{item.name}</p>
                       {item.isDefault && <span className="text-[9px] bg-blue-100 text-blue-600 px-1 py-0.5 rounded font-bold uppercase">Default</span>}
                    </td>
                    <td className="px-6 py-4">
                       <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${item.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {item.isActive ? "Active" : "Disabled"}
                       </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex items-center justify-end gap-3">
                          <button 
                            onClick={() => navigate(`/app/widgets/${item.id}`)} 
                            className="px-4 py-1.5 bg-blue-600 border border-blue-700 rounded-lg text-xs font-bold text-white hover:bg-blue-700 shadow-sm transition-all flex items-center gap-1.5"
                          >
                             <span>🎨</span> Customize Design
                          </button>
                          {!item.isDefault && (
                            <button 
                              onClick={() => { if(confirm('Delete this widget?')) submit({ intent: 'delete', id: item.id }, { method: 'post' }); }} 
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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
  );
}
