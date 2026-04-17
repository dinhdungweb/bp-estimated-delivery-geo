import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useLoaderData, useSubmit, useNavigation, useSearchParams, data as routerData } from "react-router";
import { WidgetPreviewRenderer } from "../components/WidgetRenderer";
import { useState, useCallback } from "react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

// ─── Templates Data ────────────────────────────────────────────────────────
const WIDGET_TEMPLATES = [
  { id: "banner-icons", name: "Classic Banner", description: "Banner màu phía trên kèm 3 khu vực biểu tượng đặt dưới.", style: "banner_icons" as const, textColor: "333333", iconColor: "10b981", bgColor: "ffffff", borderColor: "e5e7eb", borderRadius: 8, hasGlobalMessage: true },
  { id: "gradient-timer", name: "Moment Meter", description: "Nhấn mạnh sự khẩn cấp với nền gradient và thanh tiến trình đếm ngược.", style: "gradient_timer" as const, textColor: "111827", iconColor: "ef4444", bgColor: "ffffff", borderColor: "fca5a5", borderRadius: 12, hasGlobalMessage: true },
  { id: "banner-icons", name: "Classic Banner", description: "Banner màu phía trên kèm 3 khu vực biểu tượng đặt dưới.", style: "banner_icons" as const, textColor: "333333", iconColor: "10b981", bgColor: "ffffff", borderColor: "e5e7eb", borderRadius: 8, hasGlobalMessage: true, defaultTitle: "FREE & FAST DELIVERY" },
  { id: "gradient-timer", name: "Moment Meter", description: "Nhấn mạnh sự khẩn cấp với nền gradient và thanh tiến trình đếm ngược.", style: "gradient_timer" as const, textColor: "111827", iconColor: "ef4444", bgColor: "ffffff", borderColor: "fca5a5", borderRadius: 12, hasGlobalMessage: true, defaultTitle: "Moment Meter" },
  { id: "split-blocks", name: "Split Sequence", description: "Khối chữ nhật bo tròn chia thành 3 mảng màu nền khối riêng biệt.", style: "split_blocks" as const, textColor: "1e40af", iconColor: "3b82f6", bgColor: "eff6ff", borderColor: "bfdbfe", borderRadius: 16, hasGlobalMessage: true, defaultTitle: "Delivery Progress" },
  { id: "simple-line", name: "Minimal Line", description: "Thiết kế mỏng viền nhỏ kết nối bằng một dải ngang sạch sẽ.", style: "simple_line" as const, textColor: "000000", iconColor: "000000", bgColor: "ffffff", borderColor: "000000", borderRadius: 4, hasGlobalMessage: true, defaultTitle: "FREE & FAST DELIVERY" },
  { id: "vertical-timeline", name: "Vertical Track", description: "Dòng sự kiện chạy dọc độc đáo, hiển thị tình trạng từng bước một.", style: "vertical_timeline" as const, textColor: "422006", iconColor: "eab308", bgColor: "fefce8", borderColor: "fef08a", borderRadius: 12, hasGlobalMessage: true, defaultTitle: "Delivery Status" },
  { id: "dual-cards", name: "Dual Elements", description: "Chia khung nhìn thành hai khối thẻ độc lập cho trải nghiệm song song.", style: "dual_cards" as const, textColor: "0891b2", iconColor: "06b6d4", bgColor: "ffffff", borderColor: "cffafe", borderRadius: 8, hasGlobalMessage: false, defaultTitle: "Free Delivery" },
  { id: "minimal-no-line", name: "Icon Focus", description: "Tập trung 100% vào biểu tượng, loại bỏ đường nối tạo sự cởi mở tối đa.", style: "minimal_no_line" as const, textColor: "475569", iconColor: "334155", bgColor: "ffffff", borderColor: "e2e8f0", borderRadius: 0, hasGlobalMessage: false, defaultTitle: "FREE SHIPPING" },
  { id: "bullet-points", name: "Checklist Steps", description: "Hiển thị điều khoản dạng Check-list phối hợp timeline phía dưới.", style: "bullet_points" as const, textColor: "1f2937", iconColor: "111827", bgColor: "ffffff", borderColor: "d1d5db", borderRadius: 6, hasGlobalMessage: true, defaultTitle: "Shipping Details" },
  { id: "thick-track", name: "Progress Bar", description: "Sử dụng một thanh bar thật lớn để mô phỏng tiến độ như tải file.", style: "thick_track" as const, textColor: "374151", iconColor: "f97316", bgColor: "fffbeb", borderColor: "fcd34d", borderRadius: 8, hasGlobalMessage: true, defaultTitle: "Estimate shipping period" },
  { id: "framed-circles", name: "Bold Contrast", description: "Phong cách in đậm siêu tương phản với các vòng tròn lớn bọc quanh Icon.", style: "framed_circles" as const, textColor: "000000", iconColor: "000000", bgColor: "ffffff", borderColor: "000000", borderRadius: 0, hasGlobalMessage: true, defaultTitle: "FREE & FAST DELIVERY" },
  { id: "minimal-cards", name: "Minimal Cards", description: "Ba khối giao diện nhỏ thẻ vuông nhẹ nhàng và đơn giản hoá mọi thứ.", style: "minimal_cards" as const, textColor: "64748b", iconColor: "3b82f6", bgColor: "ffffff", borderColor: "e2e8f0", borderRadius: 8, hasGlobalMessage: false, defaultTitle: "Delivery Status" },
  { id: "clean-horizontal", name: "Clean Horizontal", description: "Bộ đếm trong suốt siêu sạch hiển thị ngày cực to trên giao diện.", style: "clean_horizontal" as const, textColor: "000000", iconColor: "0ea5e9", bgColor: "ffffff", borderColor: "cbd5e1", borderRadius: 0, hasGlobalMessage: true, defaultTitle: "Delivery Progress" },
];

// ─── Loader ──────────────────────────────────────────────────────────────────
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const settings = await prisma.appSetting.findUnique({
    where: { shop: session.shop },
  });
  return routerData({ settings, shop: session.shop });
};

// ─── Action ──────────────────────────────────────────────────────────────────
export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();

  const updateData = {
    isEnabled: formData.get("isEnabled") === "true",
    widgetStyle: String(formData.get("widgetStyle") || "modern"),
    textColor: String(formData.get("textColor") || "#000000"),
    iconColor: String(formData.get("iconColor") || "#0033cc"),
    bgColor: String(formData.get("bgColor") || "#ffffff"),
    borderColor: String(formData.get("borderColor") || "#e5e7eb"),
    borderRadius: parseInt(String(formData.get("borderRadius") || "10"), 10),
    showTimeline: formData.get("showTimeline") === "true",
    policyText: String(formData.get("policyText") || ""),
  };

  await prisma.appSetting.upsert({
    where: { shop: session.shop },
    create: { shop: session.shop, ...updateData },
    update: updateData,
  });

  return routerData({ success: true });
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SettingsPage() {
  const loaderData = useLoaderData<typeof loader>();
  const settings = loaderData?.settings;
  const shop = loaderData?.shop;
  const submit = useSubmit();
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();
  const isSubmitting = navigation.state === "submitting";

  const [isEnabled, setIsEnabled] = useState(settings?.isEnabled ?? true);
  const [widgetStyle, setWidgetStyle] = useState(searchParams.get("widgetStyle") || settings?.widgetStyle || "split_blocks");
  const [textColor, setTextColor] = useState(searchParams.get("textColor") ? `#${searchParams.get("textColor")}` : settings?.textColor || "#000000");
  const [iconColor, setIconColor] = useState(searchParams.get("iconColor") ? `#${searchParams.get("iconColor")}` : settings?.iconColor || "#0033cc");
  const [bgColor, setBgColor] = useState(searchParams.get("bgColor") ? `#${searchParams.get("bgColor")}` : settings?.bgColor || "#ffffff");
  const [borderColor, setBorderColor] = useState(searchParams.get("borderColor") ? `#${searchParams.get("borderColor")}` : settings?.borderColor || "#e5e7eb");
  const [borderRadius, setBorderRadius] = useState(searchParams.has("borderRadius") ? parseInt(searchParams.get("borderRadius")!) : settings?.borderRadius ?? 10);
  const [showTimeline, setShowTimeline] = useState(searchParams.has("showTimeline") ? searchParams.get("showTimeline") === "true" : settings?.showTimeline ?? true);
  const [policyText, setPolicyText] = useState(settings?.policyText ?? "");
  
  const [saved, setSaved] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  
  // NEW STATES FOR EDIT DELIVERY STEPS WIDGET
  const [isEditStepsModalOpen, setIsEditStepsModalOpen] = useState(false);
  const [activeEditTab, setActiveEditTab] = useState<'steps' | 'appearance'>('steps');

  const [step1Label, setStep1Label] = useState("Order Now");
  const [step2Label, setStep2Label] = useState("Ready to Ship");
  const [step3Label, setStep3Label] = useState("At your Doorstep");

  const [step1Lead, setStep1Lead] = useState("{min_lead_days,0}");
  const [step2Lead, setStep2Lead] = useState("{min_lead_days,2}");
  const [step3Lead, setStep3Lead] = useState("{max_lead_days,5}");

  const [leadDaysColor, setLeadDaysColor] = useState(textColor);
  const [progressColor, setProgressColor] = useState(iconColor);

  const [globalMessage, setGlobalMessage] = useState("Receive your order : {MIN_LEAD_DAYS,3} to {MAX_LEAD_DAYS,5}");
  const [widgetTitle, setWidgetTitle] = useState("FREE & FAST DELIVERY");

  const handleSave = useCallback(() => {
    const formData = new FormData();
    formData.append("isEnabled", String(isEnabled));
    formData.append("widgetStyle", widgetStyle);
    formData.append("textColor", textColor);
    formData.append("iconColor", iconColor);
    formData.append("bgColor", bgColor);
    formData.append("borderColor", borderColor);
    formData.append("borderRadius", String(borderRadius));
    formData.append("showTimeline", String(showTimeline));
    formData.append("policyText", policyText);
    submit(formData, { method: "post" });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }, [isEnabled, widgetStyle, textColor, iconColor, bgColor, borderColor, borderRadius, showTimeline, policyText, submit]);

  const handleUseTemplate = (template: typeof WIDGET_TEMPLATES[0]) => {
    setWidgetStyle(template.style);
    setWidgetTitle(template.defaultTitle);
    setTextColor(`#${template.textColor}`);
    setIconColor(`#${template.iconColor}`);
    setLeadDaysColor(`#${template.textColor}`);
    setProgressColor(`#${template.iconColor}`);
    setBgColor(`#${template.bgColor}`);
    setBorderColor(`#${template.borderColor}`);
    setBorderRadius(template.borderRadius);
    setIsTemplateModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#f1f2f4] p-4 md:p-6 font-sans">
      
      {/* Header */}
      <div className="max-w-6xl mx-auto flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Settings</h1>
        <button 
          onClick={handleSave} 
          disabled={isSubmitting}
          className="bg-gray-900 hover:bg-black text-white px-5 py-2 rounded-lg text-sm font-semibold transition shadow-sm disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Save settings'}
        </button>
      </div>

      {saved && (
        <div className="max-w-6xl mx-auto mb-6 bg-green-50 text-green-800 border border-green-200 px-4 py-3 rounded-lg text-sm font-medium shadow-sm">
          ✅ Settings saved successfully!
        </div>
      )}

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ─── LEFT COLUMN ───────────────────────────────────────────────────── */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* 1. Activate App */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-[13px] font-semibold text-gray-900">Activate app</h2>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${isEnabled ? 'bg-[#c6f6d5] text-[#22543d]' : 'bg-[#feebc8] text-[#744210]'}`}>
                  {isEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <p className="text-xs text-gray-500">App is currently {isEnabled ? 'enabled' : 'disabled'}</p>
            </div>
            <button 
              onClick={() => setIsEnabled(!isEnabled)} 
              className="bg-[#202223] hover:bg-black text-white px-4 py-1.5 rounded text-xs font-semibold shadow-sm transition"
            >
              {isEnabled ? 'Disable' : 'Enable'}
            </button>
          </div>

          {/* 2. General ETA message */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 text-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                 <h2 className="text-[14px] font-bold text-gray-900">General ETA message</h2>
                 <p className="text-[13px] text-gray-500 mt-1.5 leading-relaxed">
                   Use a ready template or enter ETA message to show it on the product page. Use shortcodes to<br/>configure lead days. <a href="#" className="text-blue-600 hover:underline">See an example</a>
                 </p>
              </div>
              <div className="flex gap-2 shrink-0">
                 <button className="bg-white border border-gray-300 text-gray-700 text-[12px] font-medium px-3 py-1.5 rounded flex items-center shadow-sm hover:bg-gray-50">Shortcodes ▾</button>
                 <button 
                    onClick={() => setIsTemplateModalOpen(true)} 
                    className="bg-[#202223] hover:bg-[#111213] text-white text-[12px] font-medium px-3 py-1.5 rounded flex items-center shadow-sm transition"
                 >
                   <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
                   Templates
                 </button>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg overflow-hidden mt-6">
              {/* Toolbar */}
              <div className="flex justify-between items-center bg-transparent border-b border-gray-200 p-2.5 px-4 text-gray-600">
                 <div className="flex items-center gap-3 font-serif font-bold cursor-not-allowed">
                   <span className="hover:bg-gray-100 px-1 rounded flex items-center leading-none">B</span>
                   <span className="italic hover:bg-gray-100 px-1 rounded flex items-center leading-none">I</span>
                   <span className="underline hover:bg-gray-100 px-1 rounded flex items-center leading-none">U</span>
                   <span className="font-sans font-medium text-[12px] flex items-center hover:bg-gray-100 px-1 rounded">14 <span className="ml-1 text-[8px] text-gray-400">▼</span></span>
                   <div className="w-[1px] h-4 bg-gray-200 mx-1"></div>
                   <span className="font-sans font-medium text-[12px] flex items-center hover:bg-gray-100 px-1 rounded">≡</span>
                   <div className="w-[1px] h-4 bg-gray-200 mx-1"></div>
                   <span className="font-sans font-medium text-[14px] flex items-center hover:bg-gray-100 px-1 rounded transform rotate-45">🔗</span>
                 </div>
              </div>

              {/* Editor Body */}
              <div className="p-6">
                <div 
                  className="relative group rounded-xl overflow-hidden max-w-3xl mx-auto shadow-sm border border-transparent hover:border-gray-200 transition-all flex flex-col items-center"
                >
                  {/* Real Widget Render - WITH INLINE EDITING */}
                  <div className="w-full transition duration-300 transform scale-100">
                     <WidgetPreviewRenderer
                       settings={{
                         style: widgetStyle as any,
                         textColor: textColor,
                         iconColor: iconColor,
                         bgColor: bgColor,
                         borderColor: borderColor,
                         borderRadius: borderRadius,
                         step1Label, step2Label, step3Label,
                         step1Lead, step2Lead, step3Lead,
                         leadDaysColor, progressColor,
                         globalMessage,
                         widgetTitle,
                         isEditable: true,
                         onTitleChange: (val) => setWidgetTitle(val),
                         onMessageChange: (val) => setGlobalMessage(val)
                       }}
                     />
                  </div>

                  {/* Dark "Edit steps widget" Hover Overlay */}
                  <div 
                    onClick={() => setIsEditStepsModalOpen(true)}
                    className="absolute bottom-0 left-0 right-0 h-[65%] bg-[#40434b]/80 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center cursor-pointer"
                  >
                     <button className="bg-[#4a4f56] hover:bg-[#3d4248] border border-[#5a5f66] text-white text-[14px] font-bold px-5 py-2 rounded shadow-lg tracking-wide transition">
                       Edit steps
                     </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. ETA options */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <h2 className="text-[13px] font-semibold text-gray-900">ETA options</h2>
            <p className="text-[11px] text-gray-500 mt-1 mb-3">Customize the cutoff time, week off, date format, countdown timer, and translation settings.</p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1.5 border border-gray-300 text-[11px] font-medium rounded-md text-gray-700 bg-white cursor-pointer shadow-sm hover:bg-gray-50">Cut-off time</span>
              <span className="px-3 py-1.5 border border-gray-300 text-[11px] font-medium rounded-md text-gray-700 bg-white cursor-pointer shadow-sm hover:bg-gray-50">Weekoff / holidays</span>
              <span className="px-3 py-1.5 border border-gray-300 text-[11px] font-medium rounded-md text-gray-700 bg-white cursor-pointer shadow-sm hover:bg-gray-50">Date visibility</span>
              <span className="px-3 py-1.5 border border-gray-300 text-[11px] font-medium rounded-md text-gray-700 bg-white cursor-pointer shadow-sm hover:bg-gray-50">Countdown timer</span>
              <span className="px-3 py-1.5 border border-gray-300 text-[11px] font-medium rounded-md text-gray-700 bg-white cursor-pointer shadow-sm hover:bg-gray-50">Translation</span>
            </div>
          </div>

          {/* 4. ETA message position */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div className="flex justify-between items-center mb-1 cursor-pointer">
               <h2 className="text-[13px] font-semibold text-gray-900">ETA message position</h2>
               <span className="text-gray-400">▴</span>
            </div>
            <p className="text-[11px] text-gray-500 mb-3">Change ETA message to display after the "Add to Cart" button on the product page.</p>
            
            <div className="border border-gray-200 rounded p-4 bg-white shadow-sm">
               <div className="flex items-center gap-2 mb-2">
                 <span className="text-[12px] font-semibold text-gray-800">App Block</span>
                 <span className="text-[9px] bg-[#c6f6d5] text-[#22543d] font-bold px-1.5 py-0.5 rounded tracking-wide uppercase">Recommended</span>
               </div>
               <p className="text-[11px] text-gray-500 leading-relaxed mb-4">
                 Click <strong>"Open product page"</strong> button below to open the theme editor. In the left sidebar, click <strong>"Add block"</strong> under the Product information section. Search and select <strong>"Estimated Delivery Date"</strong> from the app list. Drag the block to your desired position on the product page. Click <strong>"Save"</strong> to apply changes.
               </p>
               <a 
                 href={`https://admin.shopify.com/store/${shop?.replace('.myshopify.com','')}/themes/current/editor`} 
                 target="_blank" 
                 rel="noreferrer"
                 className="bg-white border border-gray-300 shadow-sm text-gray-800 px-3 py-1.5 rounded text-[11px] font-semibold inline-flex items-center gap-1 hover:bg-gray-50 transition"
               >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 19H5V5H12V3H5C3.89 3 3 3.9 3 5V19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V12H19V19ZM14 3V5H17.59L7.76 14.83L9.17 16.24L19 6.41V10H21V3H14Z" />
                  </svg>
                  Open product page
               </a>
            </div>
          </div>

          {/* 5. ETA for additional pages */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div className="flex justify-between items-center mb-4">
               <div className="flex items-center gap-2">
                 <h2 className="text-[13px] font-semibold text-gray-900">ETA for additional pages</h2>
                 <span className="text-[9px] bg-[#bee3f8] text-[#2b6cb0] font-bold px-1.5 py-0.5 rounded flex items-center tracking-wide uppercase">🔒 Upgrade</span>
               </div>
               <span className="text-gray-400">▴</span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center border border-gray-200 rounded p-3 bg-white shadow-sm opacity-60">
                <span className="text-[11px] font-medium text-gray-700">Configure the ETA display on the home page</span>
                <span className="text-[11px] font-semibold text-gray-400 cursor-not-allowed">Configure</span>
              </div>
              <div className="flex justify-between items-center border border-gray-200 rounded p-3 bg-white shadow-sm opacity-60">
                <span className="text-[11px] font-medium text-gray-700">Show message on collection pages</span>
                <div className="w-8 h-4 bg-gray-300 rounded-full flex items-center px-0.5"><div className="w-3 h-3 bg-white rounded-full"></div></div>
              </div>
            </div>
          </div>

          {/* 6. ETA for checkout pages */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div className="flex justify-between items-center mb-1">
               <h2 className="text-[13px] font-semibold text-gray-900">ETA for checkout pages</h2>
               <span className="text-gray-400">▴</span>
            </div>
            <p className="text-[11px] text-gray-500 mb-3">Configure ETA display on checkout pages.</p>
            <div className="flex justify-between items-center border border-gray-200 rounded p-3 bg-white shadow-sm opacity-60">
                <span className="text-[11px] font-medium text-gray-700">Enable ETA on the cart, checkout, and thank you pages</span>
                <div className="w-8 h-4 bg-gray-300 rounded-full flex items-center px-0.5"><div className="w-3 h-3 bg-white rounded-full"></div></div>
            </div>
          </div>

          {/* 7. Vacation mode */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-[13px] font-semibold text-gray-900">Vacation mode</h2>
              <span className="text-[9px] bg-[#bee3f8] text-[#2b6cb0] font-bold px-1.5 py-0.5 rounded flex items-center tracking-wide uppercase">🔒 Upgrade</span>
            </div>
            <p className="text-[11px] text-gray-500 mb-3">Override all ETA rules & display common holiday notice during vacation mode.</p>
            <div className="flex justify-between items-center border border-gray-200 rounded p-3 bg-white shadow-sm opacity-60">
                <span className="text-[11px] font-medium text-gray-700">Enable vacation mode</span>
                <div className="w-8 h-4 bg-gray-300 rounded-full flex items-center px-0.5"><div className="w-3 h-3 bg-white rounded-full"></div></div>
            </div>
          </div>

        </div>

        {/* ─── RIGHT COLUMN ──────────────────────────────────────────────────── */}
        <div className="lg:col-span-5 sticky top-6">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5">
              <h2 className="text-[12px] font-semibold text-gray-800">Preview</h2>
            </div>
            <div className="p-5 flex flex-col items-center bg-white">
              
              {/* Fake Product Image */}
              <div className="w-48 h-48 bg-white border border-gray-100 shadow-sm rounded-lg flex items-center justify-center relative mb-4">
                 <img src="https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png" className="w-32 object-contain opacity-70" alt="Product" />
                 <span className="absolute top-2 right-2 bg-gray-100 text-gray-600 text-[9px] font-bold px-1.5 py-0.5 rounded">15% off</span>
              </div>

              {/* Fake Add To Cart Button */}
              <div className="w-full max-w-[340px] border border-gray-300 rounded p-2 text-center text-[12px] font-semibold text-gray-800 shadow-sm mb-5 cursor-default hover:bg-gray-50 transition">
                Add to cart
              </div>

              {/* Widget Preview */}
              <div className="w-full">
                <WidgetPreviewRenderer
                  settings={{
                    style: widgetStyle as any,
                    textColor: textColor,
                    iconColor: iconColor,
                    bgColor: bgColor,
                    borderColor: borderColor,
                    borderRadius: borderRadius,
                    step1Label, step2Label, step3Label,
                    step1Lead, step2Lead, step3Lead,
                    leadDaysColor, progressColor,
                    globalMessage,
                    widgetTitle
                  }}
                />
              </div>

            </div>
          </div>
        </div>

      </div>

      {/* ─── TEMPLATE SELECTION MODAL ──────────────────────────────────────── */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-[990] flex items-center justify-center p-4 sm:p-6 bg-gray-900/40 backdrop-blur-sm transition-opacity">
          <div className="bg-[#f6f6f7] w-full max-w-6xl max-h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 py-4 border-b border-gray-200 bg-white shadow-sm z-10">
              <div>
                <h2 className="text-base font-bold text-gray-900">Template Gallery</h2>
                <p className="text-[12px] text-gray-500 mt-0.5">Select a layout structure for your widget. Your live preview will instantly update.</p>
              </div>
              <button onClick={() => setIsTemplateModalOpen(false)} className="bg-gray-100 hover:bg-gray-200 text-gray-600 p-2 rounded-full transition-colors focus:outline-none">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {WIDGET_TEMPLATES.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="group bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-gray-900 hover:shadow-xl transition-all flex flex-col cursor-pointer"
                    onClick={() => handleUseTemplate(tpl)}
                  >
                    <div className="bg-gray-50 p-6 flex-1 flex items-center justify-center relative overflow-hidden border-b border-gray-100 min-h-[180px]">
                      <div className="w-full">
                        <WidgetPreviewRenderer
                          settings={{
                            style: tpl.style,
                            textColor: `#${tpl.textColor}`,
                            iconColor: `#${tpl.iconColor}`,
                            bgColor: `#${tpl.bgColor}`,
                            borderColor: `#${tpl.borderColor}`,
                            borderRadius: tpl.borderRadius,
                            step1Label, step2Label, step3Label,
                            step1Lead, step2Lead, step3Lead,
                            leadDaysColor: `#${tpl.textColor}`,
                            progressColor: `#${tpl.iconColor}`,
                            globalMessage, // Restore actual message for consistency
                            widgetTitle: widgetTitle || tpl.defaultTitle // Use current title or template default
                          }}
                        />
                      </div>
                    </div>
                    <div className="p-3 bg-white flex flex-col items-center text-center">
                      <h3 className="font-semibold text-gray-900 text-[12px]">{tpl.name}</h3>
                      <p className="text-[10px] text-gray-400 mt-1 line-clamp-2 leading-relaxed">{tpl.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── EDIT STEPS WIDGET MODAL (TRUE CENTERED MODAL) ────────────────────── */}
      {isEditStepsModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 bg-gray-900/50 backdrop-blur-sm transition-opacity">
          
          <div className="bg-[#fcfcfc] w-full max-w-7xl h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center gap-3 px-6 py-4 bg-white border-b border-gray-200 shrink-0">
              <button 
                onClick={() => setIsEditStepsModalOpen(false)} 
                className="text-gray-500 hover:text-black hover:bg-gray-100 p-1.5 rounded-full transition"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              </button>
              <h1 className="text-[17px] font-bold text-gray-900">Edit delivery steps widget</h1>
            </div>
            
            {/* Horizontal Tabs */}
            <div className="flex px-4 border-b border-gray-200 bg-white shrink-0">
               <button 
                 onClick={() => setActiveEditTab('steps')}
                 className={`flex-1 text-center py-3.5 text-[14px] transition ${activeEditTab === 'steps' ? 'border-b-2 border-black text-black font-semibold' : 'text-gray-600 hover:text-black font-medium'}`}
               >
                 Edit steps
               </button>
               <button 
                 onClick={() => setActiveEditTab('appearance')}
                 className={`flex-1 text-center py-3.5 text-[14px] transition ${activeEditTab === 'appearance' ? 'border-b-2 border-blue-600 text-blue-600 font-semibold' : 'text-gray-600 hover:text-black font-medium'}`}
               >
                 Appearance
               </button>
            </div>

            {/* Tab Content Body */}
            <div className="flex-1 overflow-y-auto p-6 bg-[#f7f8f9]">
                  
                  {/* TAB 1: EDIT STEPS */}
                  {activeEditTab === 'steps' && (
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                        {/* Step 1 */}
                        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                           <div className="text-[13px] font-semibold text-gray-800 mb-5 bg-gray-50/80 -mx-5 -mt-5 px-5 py-3 border-b border-gray-200 rounded-t-lg">
                             Step 1
                           </div>
                           <label className="block text-[12px] text-gray-600 mb-2">Choose icon</label>
                           <button className="w-full border border-gray-300 rounded-lg p-2.5 mb-5 hover:bg-gray-50 flex justify-center shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                              <span className="text-2xl drop-shadow-sm">🍅</span> {/* Mock icon */}
                           </button>
                           <label className="block text-[12px] text-gray-600 mb-2">Step label</label>
                           <input type="text" value={step1Label} onChange={e => setStep1Label(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2.5 text-[13px] mb-5 text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 shadow-inner bg-[#fff]" />
                           <label className="block text-[12px] text-gray-600 mb-2">Lead days</label>
                           <input type="text" value={step1Lead} onChange={e => setStep1Lead(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2.5 text-[13px] text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 shadow-inner bg-[#fff]" />
                        </div>
                        {/* Step 2 */}
                        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                           <div className="text-[13px] font-semibold text-gray-800 mb-5 bg-gray-50/80 -mx-5 -mt-5 px-5 py-3 border-b border-gray-200 rounded-t-lg">
                             Step 2
                           </div>
                           <label className="block text-[12px] text-gray-600 mb-2">Choose icon</label>
                           <button className="w-full border border-gray-300 rounded-lg p-2.5 mb-5 hover:bg-gray-50 flex justify-center shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                              <span className="text-2xl drop-shadow-sm">🚚</span>
                           </button>
                           <label className="block text-[12px] text-gray-600 mb-2">Step label</label>
                           <input type="text" value={step2Label} onChange={e => setStep2Label(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2.5 text-[13px] mb-5 text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 shadow-inner bg-[#fff]" />
                           <label className="block text-[12px] text-gray-600 mb-2">Lead days</label>
                           <input type="text" value={step2Lead} onChange={e => setStep2Lead(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2.5 text-[13px] text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 shadow-inner bg-[#fff]" />
                        </div>
                        {/* Step 3 */}
                        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm relative">
                           <div className="text-[13px] font-semibold text-gray-800 mb-5 bg-gray-50/80 -mx-5 -mt-5 px-5 py-3 border-b border-gray-200 rounded-t-lg flex justify-between items-center">
                              Step 3
                              <button className="text-gray-400 hover:text-red-500 transition-colors">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                           </div>
                           <label className="block text-[12px] text-gray-600 mb-2">Choose icon</label>
                           <button className="w-full border border-gray-300 rounded-lg p-2.5 mb-5 hover:bg-gray-50 flex justify-center shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                              <span className="text-2xl drop-shadow-sm">🛍️</span>
                           </button>
                           <label className="block text-[12px] text-gray-600 mb-2">Step label</label>
                           <input type="text" value={step3Label} onChange={e => setStep3Label(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2.5 text-[13px] mb-5 text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 shadow-inner bg-[#fff]" />
                           <label className="block text-[12px] text-gray-600 mb-2">Lead days</label>
                           <input type="text" value={step3Lead} onChange={e => setStep3Lead(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2.5 text-[13px] text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 shadow-inner bg-[#fff]" />
                        </div>
                     </div>
                  )}

                  {/* TAB 2: APPEARANCE */}
                  {activeEditTab === 'appearance' && (
                     <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-6xl mx-auto bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        
                        {/* LSidebar: Config */}
                        <div className="lg:col-span-4 border-r border-gray-200 p-6 space-y-6 bg-white">
                           
                           <div>
                             <label className="block text-[12px] font-semibold text-gray-800 mb-2">Choose widget design</label>
                             <div className="relative">
                                <select 
                                   className="w-full appearance-none text-[13px] text-gray-800 border border-gray-300 rounded shadow-sm bg-white py-2 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                   value={widgetStyle}
                                   onChange={(e) => setWidgetStyle(e.target.value)}
                                >
                                   {WIDGET_TEMPLATES.map(tpl => (
                                     <option key={tpl.style} value={tpl.style}>{tpl.name}</option>
                                   ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center">
                                  <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4"></path></svg>
                                </div>
                             </div>
                           </div>

                           <div>
                             <label className="block text-[12px] font-semibold text-gray-800 mb-2">Display mode</label>
                             <div className="relative">
                                <select className="w-full appearance-none text-[13px] text-gray-800 border border-gray-300 rounded shadow-sm bg-white py-2 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                                   <option>Display on page</option>
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center">
                                  <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4"></path></svg>
                                </div>
                             </div>
                           </div>

                           <div className="pt-2">
                             <h3 className="text-[12px] font-semibold text-gray-800 mb-4">Font style</h3>
                             <div className="flex items-center justify-between mb-4">
                               <label className="text-[12px] text-gray-600">Step label</label>
                               <div className="flex rounded text-gray-600 font-serif overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.05)] border border-gray-200">
                                 <button className="px-2.5 py-1 hover:bg-gray-50 border-r border-gray-200">B</button>
                                 <button className="px-2.5 py-1 hover:bg-gray-50 italic border-r border-gray-200">I</button>
                                 <button className="px-2.5 py-1 hover:bg-gray-50 underline border-r border-gray-200">U</button>
                                 <button className="px-2.5 py-1 hover:bg-gray-50 font-sans flex items-center text-[11px]">13 <span className="text-[10px] ml-1 text-gray-400">▼</span></button>
                               </div>
                             </div>
                             <div className="flex items-center justify-between">
                               <label className="text-[12px] text-gray-600">Lead days</label>
                               <div className="flex rounded text-gray-600 font-serif overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.05)] border border-gray-200">
                                 <button className="px-2.5 py-1 hover:bg-gray-50 border-r border-gray-200">B</button>
                                 <button className="px-2.5 py-1 hover:bg-gray-50 italic border-r border-gray-200">I</button>
                                 <button className="px-2.5 py-1 hover:bg-gray-50 underline border-r border-gray-200">U</button>
                                 <button className="px-2.5 py-1 hover:bg-gray-50 font-sans flex items-center text-[11px]">13 <span className="text-[10px] ml-1 text-gray-400">▼</span></button>
                               </div>
                             </div>
                           </div>

                           <div className="pt-2 space-y-4">
                             <h3 className="text-[12px] font-semibold text-gray-800 mb-3">Colors</h3>
                             
                             <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-full border border-gray-200 overflow-hidden shrink-0">
                                  <input type="color" value={textColor} onChange={e => setTextColor(e.target.value)} className="w-[150%] h-[150%] -translate-x-1/4 -translate-y-1/4 cursor-pointer p-0" />
                               </div>
                               <div>
                                 <p className="text-[12px] text-gray-700 leading-tight mb-0.5">Step label</p>
                                 <p className="text-[11px] text-gray-400 uppercase">{textColor}</p>
                               </div>
                             </div>

                             <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-full border border-gray-200 overflow-hidden shrink-0">
                                  <input type="color" value={leadDaysColor} onChange={e => setLeadDaysColor(e.target.value)} className="w-[150%] h-[150%] -translate-x-1/4 -translate-y-1/4 cursor-pointer p-0" />
                               </div>
                               <div>
                                 <p className="text-[12px] text-gray-700 leading-tight mb-0.5">Lead days</p>
                                 <p className="text-[11px] text-gray-400 uppercase">{leadDaysColor}</p>
                               </div>
                             </div>

                             <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-full border border-gray-200 overflow-hidden shrink-0">
                                  <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="w-[150%] h-[150%] -translate-x-1/4 -translate-y-1/4 cursor-pointer p-0" />
                               </div>
                               <div>
                                 <p className="text-[12px] text-gray-700 leading-tight mb-0.5">Background</p>
                                 <p className="text-[11px] text-gray-400 uppercase">{bgColor}</p>
                               </div>
                             </div>

                             <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-full border border-gray-200 overflow-hidden shrink-0">
                                  <input type="color" value={progressColor} onChange={e => setProgressColor(e.target.value)} className="w-[150%] h-[150%] -translate-x-1/4 -translate-y-1/4 cursor-pointer p-0" />
                               </div>
                               <div>
                                 <p className="text-[12px] text-gray-700 leading-tight mb-0.5">Progress bar</p>
                                 <p className="text-[11px] text-gray-400 uppercase">{progressColor}</p>
                               </div>
                             </div>
                           </div>
                        </div>

                        {/* RCenter: Live Preview Display */}
                        <div className="lg:col-span-8 p-6 bg-[#fcfcfc] flex flex-col pt-8">
                           <p className="text-[12px] font-bold text-gray-700 mb-4 px-2">Preview:</p>
                           <div className="w-full flex-1 border border-gray-200 rounded-xl bg-white shadow-sm flex items-center justify-center p-8">
                              <div className="w-full max-w-full scale-[1.05]">
                                <WidgetPreviewRenderer
                                  settings={{
                                    style: widgetStyle as any,
                                    textColor: textColor,
                                    iconColor: iconColor,
                                    bgColor: bgColor,
                                    borderColor: borderColor,
                                    borderRadius: borderRadius,
                                    step1Label, step2Label, step3Label,
                                    step1Lead, step2Lead, step3Lead,
                                    leadDaysColor, progressColor,
                                    globalMessage: "", // Don't show in modal preview to focus on steps
                                    widgetTitle
                                  }}
                                />
                              </div>
                           </div>
                        </div>
                     </div>
                  )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
