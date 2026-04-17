/**
 * BP: Estimated Delivery & Geo — Widget Template Builder
 * Copyright © 2025 BluePeaks. All rights reserved.
 */
import { useNavigate } from "react-router";
import { WidgetPreviewRenderer } from "../components/WidgetRenderer";

// ─── Templates Data ────────────────────────────────────────────────────────
const WIDGET_TEMPLATES = [
  {
    id: "banner-icons",
    name: "Classic Banner",
    description: "Banner màu phía trên kèm 3 khu vực biểu tượng đặt dưới.",
    style: "banner_icons" as const,
    textColor: "333333",
    iconColor: "10b981",
    bgColor: "ffffff",
    borderColor: "e5e7eb",
    borderRadius: 8,
  },
  {
    id: "gradient-timer",
    name: "Moment Meter",
    description: "Nhấn mạnh sự khẩn cấp với nền gradient và thanh tiến trình đếm ngược.",
    style: "gradient_timer" as const,
    textColor: "111827",
    iconColor: "ef4444",
    bgColor: "ffffff",
    borderColor: "fca5a5",
    borderRadius: 12,
  },
  {
    id: "split-blocks",
    name: "Split Sequence",
    description: "Khối chữ nhật bo tròn chia thành 3 mảng màu nền khối riêng biệt.",
    style: "split_blocks" as const,
    textColor: "1e40af",
    iconColor: "3b82f6",
    bgColor: "eff6ff",
    borderColor: "bfdbfe",
    borderRadius: 16,
  },
  {
    id: "simple-line",
    name: "Minimal Line",
    description: "Thiết kế mỏng viền nhỏ kết nối bằng một dải ngang sạch sẽ.",
    style: "simple_line" as const,
    textColor: "000000",
    iconColor: "000000",
    bgColor: "ffffff",
    borderColor: "000000",
    borderRadius: 4,
  },
  {
    id: "vertical-timeline",
    name: "Vertical Track",
    description: "Dòng sự kiện chạy dọc độc đáo, hiển thị tình trạng từng bước một.",
    style: "vertical_timeline" as const,
    textColor: "422006",
    iconColor: "eab308", 
    bgColor: "fefce8",
    borderColor: "fef08a",
    borderRadius: 12,
  },
  {
    id: "dual-cards",
    name: "Dual Elements",
    description: "Chia khung nhìn thành hai khối thẻ độc lập cho trải nghiệm song song.",
    style: "dual_cards" as const,
    textColor: "0891b2",
    iconColor: "06b6d4",
    bgColor: "ffffff",
    borderColor: "cffafe",
    borderRadius: 8,
  },
  {
    id: "minimal-no-line",
    name: "Icon Focus",
    description: "Tập trung 100% vào biểu tượng, loại bỏ đường nối tạo sự cởi mở tối đa.",
    style: "minimal_no_line" as const,
    textColor: "475569",
    iconColor: "334155",
    bgColor: "ffffff",
    borderColor: "e2e8f0",
    borderRadius: 0,
  },
  {
    id: "bullet-points",
    name: "Checklist Steps",
    description: "Hiển thị điều khoản dạng Check-list phối hợp timeline phía dưới.",
    style: "bullet_points" as const,
    textColor: "1f2937",
    iconColor: "111827",
    bgColor: "ffffff",
    borderColor: "d1d5db",
    borderRadius: 6,
  },
  {
    id: "thick-track",
    name: "Progress Bar",
    description: "Sử dụng một thanh bar thật lớn để mô phỏng tiến độ như tải file.",
    style: "thick_track" as const,
    textColor: "374151",
    iconColor: "f97316",
    bgColor: "fffbeb",
    borderColor: "fcd34d",
    borderRadius: 8,
  },
  {
    id: "framed-circles",
    name: "Bold Contrast",
    description: "Phong cách in đậm siêu tương phản với các vòng tròn lớn bọc quanh Icon.",
    style: "framed_circles" as const,
    textColor: "000000",
    iconColor: "000000",
    bgColor: "ffffff",
    borderColor: "000000",
    borderRadius: 0,
  },
  {
    id: "minimal-cards",
    name: "Minimal Cards",
    description: "Ba khối giao diện nhỏ thẻ vuông nhẹ nhàng và đơn giản hoá mọi thứ.",
    style: "minimal_cards" as const,
    textColor: "64748b",
    iconColor: "3b82f6",
    bgColor: "ffffff",
    borderColor: "e2e8f0",
    borderRadius: 8,
  },
  {
    id: "clean-horizontal",
    name: "Clean Horizontal",
    description: "Bộ đếm trong suốt siêu sạch hiển thị ngày cực to trên giao diện.",
    style: "clean_horizontal" as const,
    textColor: "000000",
    iconColor: "0ea5e9",
    bgColor: "ffffff",
    borderColor: "cbd5e1",
    borderRadius: 0,
  },
];

export default function TemplatesPage() {
  const navigate = useNavigate();

  const handleUseTemplate = (template: typeof WIDGET_TEMPLATES[0]) => {
    const params = new URLSearchParams({
      widgetStyle: template.style,
      textColor: template.textColor,
      iconColor: template.iconColor,
      bgColor: template.bgColor,
      borderColor: template.borderColor,
      borderRadius: String(template.borderRadius),
    });
    navigate(`/app/settings?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-[#f6f6f7] p-4 md:p-6 space-y-4 font-sans">
      <div className="mb-6 max-w-3xl">
        <h1 className="text-2xl font-bold text-gray-900">Template Gallery</h1>
        <p className="text-sm text-gray-500 mt-2 leading-relaxed">
          Khám phá các cấu trúc Widget chuẩn xác giúp tăng tỉ lệ chuyển đổi. Bạn hãy chọn 1 cấu trúc ưng ý nhất, sau đó tuỳ biến tiếp về phần Màu Sắc ở trang Cài Đặt.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {WIDGET_TEMPLATES.map((tpl) => (
          <div
            key={tpl.id}
            className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-blue-400 hover:shadow-lg transition-all flex flex-col"
          >
            {/* ─── Mock Preview (Top) ─── */}
            <div className="bg-gray-50 p-6 flex-1 flex items-center justify-center relative overflow-hidden border-b border-gray-100">
              <WidgetPreviewRenderer
                settings={{
                  style: tpl.style,
                  textColor: `#${tpl.textColor}`,
                  iconColor: `#${tpl.iconColor}`,
                  bgColor: `#${tpl.bgColor}`,
                  borderColor: `#${tpl.borderColor}`,
                  borderRadius: tpl.borderRadius,
                }}
              />
            </div>

            {/* ─── Detail Info (Bottom) ─── */}
            <div className="p-4 bg-white flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 text-base">{tpl.name}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{tpl.description}</p>
              </div>
              <button
                onClick={() => handleUseTemplate(tpl)}
                className="bg-gray-900 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-600 transition-colors shrink-0"
              >
                Customize
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
