import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigate } from "react-router";
import { 
  Page, 
  Card, 
  Text, 
  Button, 
  Box, 
  InlineStack, 
  BlockStack, 
  Icon,
  Banner,
  Divider,
  ProgressBar,
  Badge,
} from "@shopify/polaris";
import { 
  ChevronRightIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  SettingsIcon,
  CircleChevronRightIcon,
  PlusIcon,
  LayoutColumns2Icon,
  WandIcon,
  ChatIcon,
  CalendarIcon
} from "@shopify/polaris-icons";
import { useState } from "react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const [widget, totalRules, appSetting] = await Promise.all([
    prisma.widget.findFirst({ where: { shop, isDefault: true } }),
    prisma.deliveryRule.count({ where: { shop } }),
    prisma.appSetting.findUnique({ where: { shop } })
  ]);

  return {
    shop,
    widget,
    totalRules,
    isEnabled: appSetting?.isEnabled ?? false,
    appSetting
  };
};

export default function DashboardHome() {
  const { shop, widget, totalRules, isEnabled } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [expandedStep, setExpandedStep] = useState<number | null>(0);

  const steps = [
    {
      id: 0,
      title: "Enable theme app embed block",
      desc: "To start using the app, please enable app embedding by following the steps below.",
      instructions: [
        'Click "Enable embed app" below.',
        'Find and enable "Estimated Delivery Date" in the theme customizer.',
        'Click "Save" button & reload app backend page.'
      ],
      buttonText: "Enable embed app",
      action: () => window.open(`https://admin.shopify.com/store/${shop.split('.')[0]}/themes/current/editor?context=apps`, '_blank'),
      completed: false
    },
    {
      id: 1,
      title: "Activate app",
      desc: "Turn on the main switch to allow the widget to appear on your store.",
      buttonText: "Go to Settings",
      action: () => navigate("/app/settings"),
      completed: isEnabled
    },
    {
      id: 2,
      title: "Use template to show ETA message",
      desc: "Select a professional design for your delivery estimation widget.",
      buttonText: "Browse Templates",
      action: () => navigate("/app/templates"),
      completed: !!widget?.widgetStyle
    },
    {
      id: 3,
      title: "Confirm ETA Display",
      desc: "Check your product page to ensure everything looks perfect.",
      buttonText: "View Store",
      action: () => window.open(`https://${shop}`, '_blank'),
      completed: false
    }
  ];

  const completedCount = steps.filter(s => s.completed).length;

  return (
    <div className="min-h-screen bg-[#f6f6f7] p-4 md:p-6 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
           <div className="space-y-1">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Onboarding Dashboard</h1>
              <div className="flex items-center gap-2">
                 <span className={`flex h-2 w-2 rounded-full ${isEnabled ? 'bg-green-500 animate-pulse' : 'bg-amber-500 animate-none'}`}></span>
                 <Text variant="bodySm" tone="subdued" as="p">{isEnabled ? "Widget is active on storefront" : "Action required to go live"}</Text>
              </div>
           </div>
           <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate("/app/settings")}
                className="inline-flex items-center gap-2 bg-white border border-gray-200 hover:border-gray-900 text-gray-900 px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm"
              >
                <div className="w-4 h-4 text-gray-500"><Icon source={SettingsIcon} /></div> Settings
              </button>
              <button 
                onClick={() => navigate("/app/rules")}
                className="inline-flex items-center gap-2 bg-gray-900 hover:bg-black text-white px-5 py-2 rounded-lg text-sm font-semibold transition-all shadow-md active:scale-95"
              >
                <div className="w-4 h-4 text-white"><Icon source={PlusIcon} /></div> New Rule
              </button>
           </div>
        </div>

        <BlockStack gap="600">
          
          {/* SETUP GUIDE SECTION */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-gray-50 bg-[#fafafa] relative overflow-hidden">
               <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1.5px,transparent_1.5px)] [background-size:24px_24px] opacity-10" />
               <BlockStack gap="400">
                  <div className="relative z-10 space-y-4">
                    <div className="flex items-center justify-between">
                       <div className="space-y-1">
                          <h2 className="text-base font-bold text-gray-800">Setup Guide</h2>
                          <p className="text-xs text-gray-400">Get started with the app in just a few simple steps!</p>
                       </div>
                       <Badge tone="info">{`${completedCount} / ${steps.length} Tasks`}</Badge>
                    </div>
                    
                    <div className="space-y-2">
                       <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          <span>Progress</span>
                          <span>{Math.round((completedCount / steps.length) * 100)}%</span>
                       </div>
                       <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                             className="h-full bg-blue-600 transition-all duration-1000" 
                             style={{ width: `${(completedCount / steps.length) * 100}%` }}
                          />
                       </div>
                    </div>
                  </div>
               </BlockStack>
            </div>

            <div className="divide-y divide-gray-50">
               {steps.map((step, idx) => {
                 const isExpanded = expandedStep === step.id;
                 return (
                   <div key={step.id} className={`transition-all ${isExpanded ? 'bg-blue-50/30' : 'bg-white'}`}>
                     <div 
                       className="p-5 cursor-pointer hover:bg-gray-50 flex items-center gap-4 group"
                       onClick={() => setExpandedStep(isExpanded ? null : step.id)}
                     >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${step.completed ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'}`}>
                           <div className="w-5 h-5">
                              <Icon source={step.completed ? CheckCircleIcon : CircleChevronRightIcon} />
                           </div>
                        </div>
                        <div className="flex-1">
                           <h3 className={`text-sm tracking-tight transition-all ${isExpanded ? 'font-bold text-gray-900' : 'font-semibold text-gray-600'}`}>{step.title}</h3>
                        </div>
                        <div className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                           <Icon source={ChevronDownIcon} />
                        </div>
                     </div>
                     
                     {isExpanded && (
                       <div className="px-16 pb-6 animate-in fade-in slide-in-from-top-2 duration-300">
                          <BlockStack gap="400">
                             <p className="text-xs text-gray-500 leading-relaxed max-w-lg">{step.desc}</p>
                             {step.instructions && (
                               <div className="space-y-2 p-4 bg-white border border-blue-50 rounded-xl shadow-sm">
                                 {step.instructions.map((inst, i) => (
                                   <div key={i} className="flex gap-3 items-start">
                                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                                      <p className="text-xs text-gray-600">{inst}</p>
                                   </div>
                                 ))}
                               </div>
                             )}
                             <div className="pt-2">
                               <button 
                                 onClick={() => step.action()}
                                 className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all active:scale-95 shadow-md shadow-blue-50"
                               >
                                 {step.buttonText} →
                               </button>
                             </div>
                          </BlockStack>
                       </div>
                     )}
                   </div>
                 );
               })}
            </div>
          </div>          {/* SYSTEM STATUS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4 flex flex-col">
                <div className="flex items-center justify-between">
                   <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
                      <div className="w-6 h-6"><Icon source={CheckCircleIcon} /></div>
                   </div>
                   <Badge tone={isEnabled ? "success" : "attention"}>{isEnabled ? "Active" : "Inactive"}</Badge>
                </div>
                <div className="space-y-1 flex-1">
                   <h3 className="text-sm font-bold text-gray-800">Theme Embed</h3>
                   <p className="text-xs text-gray-400">Main application switch in theme editor.</p>
                </div>
                <button 
                  onClick={() => navigate("/app/settings")}
                  className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-bold transition-all border border-transparent hover:border-gray-200"
                >
                   Manage Setup
                </button>
             </div>

             <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4 flex flex-col">
                <div className="flex items-center justify-between">
                   <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                      <div className="w-6 h-6"><Icon source={CalendarIcon} /></div>
                   </div>
                   <Badge tone="info">Live</Badge>
                </div>
                <div className="space-y-1 flex-1">
                   <h3 className="text-sm font-bold text-gray-800">Dynamic Blocks</h3>
                   <p className="text-xs text-gray-400">Position the widget anywhere on product pages.</p>
                </div>
                <button 
                  onClick={() => window.open(`https://admin.shopify.com/store/${shop.split('.')[0]}/themes/current/editor?context=apps`, '_blank')}
                  className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-bold transition-all border border-transparent hover:border-gray-200"
                >
                   Open Editor
                </button>
             </div>

             <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4 flex flex-col">
                <div className="flex items-center justify-between">
                   <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                      <div className="w-6 h-6"><Icon source={LayoutColumns2Icon} /></div>
                   </div>
                   <Badge tone="info">{`${totalRules} Rules`}</Badge>
                </div>
                <div className="space-y-1 flex-1">
                   <h3 className="text-sm font-bold text-gray-800">Delivery Rules</h3>
                   <p className="text-xs text-gray-400">Manage conditions for different regions/products.</p>
                </div>
                <button 
                   onClick={() => navigate("/app/rules")}
                   className="w-full py-2 bg-gray-900 text-white rounded-lg text-xs font-bold hover:bg-black transition-all shadow-md active:scale-95"
                >
                   View All Rules
                </button>
             </div>
          </div>
        </BlockStack>
      </div>
      
      {/* Footer support */}
      <div className="max-w-4xl mx-auto text-center space-y-6 py-16 border-t border-gray-100 mt-12">
        <div className="space-y-1">
           <h3 className="text-sm font-bold text-gray-800">Direct Support</h3>
           <p className="text-xs text-gray-400">Our team is available to help you with custom setups.</p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <a 
            href="mailto:support@bluepeaks.top" 
            className="inline-flex items-center gap-2 text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-xl px-4 py-2 hover:bg-gray-50 transition-all shadow-sm"
          >
            <div className="w-3.5 h-3.5"><Icon source={ChatIcon} /></div> Email Support
          </a>
          <a 
            href="#" 
            className="inline-flex items-center gap-2 text-xs font-bold text-green-700 bg-green-50 border border-green-100 rounded-xl px-4 py-2 hover:bg-green-100 transition-all shadow-sm"
          >
            <div className="w-3.5 h-3.5"><Icon source={ChatIcon} /></div> WhatsApp
          </a>
          <button className="inline-flex items-center gap-2 text-xs font-bold text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2 hover:bg-red-100 transition-all">
             <div className="w-3.5 h-3.5"><Icon source={CheckCircleIcon} /></div> Leave a Review
          </button>
        </div>
        <p className="text-[10px] text-gray-300 font-medium uppercase tracking-[0.1em]">© 2025 BluePeaks • All Rights Reserved</p>
      </div>
    </div>
  );
}
