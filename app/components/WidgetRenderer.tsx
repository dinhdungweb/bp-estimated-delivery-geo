import React from "react";

export type WidgetStyleId = "banner_icons" | "gradient_timer" | "split_blocks" | "simple_line" | "vertical_timeline" | "dual_cards" | "minimal_no_line" | "bullet_points" | "thick_track" | "framed_circles" | "minimal_cards" | "clean_horizontal";

export interface WidgetSettingsProps {
  style: WidgetStyleId;
  textColor: string;
  iconColor: string;
  bgColor: string;
  borderColor: string;
  borderRadius: number;
  step1Label?: string;
  step2Label?: string;
  step3Label?: string;
  step1Lead?: string;
  step2Lead?: string;
  step3Lead?: string;
  stepLabelColor?: string;
  leadDaysColor?: string;
  progressColor?: string;
  globalMessage?: string;
  widgetTitle?: string;
  isEditable?: boolean;
  onTitleChange?: (val: string) => void;
  onMessageChange?: (val: string) => void;
}

// ─── Premium SVG Icons ──────────────────────────────────────────────────────────
const BagIcon = ({ c, s = 24 }: { c: string; s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
);
const TruckIcon = ({ c, s = 24 }: { c: string; s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14v10Z"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>
);
const HomeIcon = ({ c, s = 24 }: { c: string; s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
);
const GiftIcon = ({ c, s = 24 }: { c: string; s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="8" width="18" height="14" rx="2"/><path d="M12 5a3 3 0 1 0-3 3"/><path d="M12 5a3 3 0 1 1 3 3"/><path d="M12 5v17"/><path d="M3 8h18"/></svg>
);
const RocketIcon = ({ c, s = 24 }: { c: string; s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>
);
const PackageIcon = ({ c, s = 24 }: { c: string; s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
);
// ──────────────────────────────────────────────────────────────────────────────

// Giả lập dữ liệu preview
const PREVIEW_DATA = {
  orderDate: "Jan 10",
  shipDate: "Jan 11",
  minDate: "Jan 13",
  maxDate: "Jan 15",
  countdown: "02:14:59",
};

export function WidgetPreviewRenderer({ settings }: { settings: WidgetSettingsProps }) {
  const { 
    style, textColor, iconColor, bgColor, borderColor, borderRadius, 
    step1Label, step2Label, step3Label, 
    step1Lead, step2Lead, step3Lead,
    stepLabelColor, leadDaysColor, progressColor,
    globalMessage, widgetTitle, isEditable, onTitleChange, onMessageChange
  } = settings;
  const { orderDate, shipDate, minDate, maxDate, countdown } = PREVIEW_DATA;

  const sLColor = stepLabelColor || textColor;
  const lDColor = leadDaysColor || textColor;
  const pColor = progressColor || iconColor;

  const s1L = step1Label || "Order Now";
  const s2L = step2Label || "Ready to Ship";
  const s3L = step3Label || "At Doorstep";
  const s1D = step1Lead || orderDate;
  const s2D = step2Lead || shipDate;
  const s3D = step3Lead || maxDate;

  // 1. Banner & Icons
  if (style === "banner_icons") {
    return (
      <div 
        className="w-full max-w-md mx-auto overflow-hidden shadow-sm"
        style={{ borderRadius: `${borderRadius}px`, backgroundColor: bgColor, border: `1px solid ${borderColor}` }}
      >
        <div style={{ backgroundColor: `${pColor}15`, padding: '12px' }} className="text-center font-medium text-sm flex items-center justify-center flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <TruckIcon c={pColor} s={16} />
            {isEditable ? (
              <input 
                type="text" 
                value={widgetTitle || "FREE & FAST DELIVERY"} 
                onChange={e => onTitleChange?.(e.target.value)}
                className="w-full font-bold uppercase tracking-tight bg-transparent border-0 focus:ring-0 p-0 m-0 text-center"
                style={{ color: sLColor }}
              />
            ) : (
              <span style={{ color: sLColor }} className="font-bold uppercase tracking-tight">{widgetTitle || "FREE & FAST DELIVERY"}</span>
            )}
          </div>
          {isEditable ? (
            <input 
              type="text" 
              value={globalMessage} 
              onChange={e => onMessageChange?.(e.target.value)}
              className="w-full text-center text-[11px] bg-transparent border-0 focus:ring-0 p-0 m-0"
              style={{ color: lDColor }}
              placeholder="Enter message..."
            />
          ) : (
            globalMessage && <span style={{ color: lDColor }} className="text-[11px] mt-0.5">{globalMessage}</span>
          )}
        </div>
        <div className="flex justify-between items-center p-6 bg-white">
          <div className="flex flex-col items-center gap-2">
            <BagIcon c={pColor} />
            <span style={{ color: sLColor }} className="text-xs font-medium text-center">{s1L}<br/><span style={{ color: lDColor }}>{s1D}</span></span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <TruckIcon c={pColor} />
            <span style={{ color: sLColor }} className="text-xs font-medium text-center">{s2L}<br/><span style={{ color: lDColor }}>{s2D}</span></span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <HomeIcon c={pColor} />
            <span style={{ color: sLColor }} className="text-xs font-medium text-center">{s3L}<br/><span style={{ color: lDColor }}>{s3D}</span></span>
          </div>
        </div>
      </div>
    );
  }

  // 2. Gradient Timer
  if (style === "gradient_timer") {
    return (
      <div 
        className="w-full max-w-md mx-auto p-6 shadow-sm"
        style={{ borderRadius: `${borderRadius}px`, background: `linear-gradient(to bottom, ${bgColor}, ${pColor}15)`, border: `1px solid ${borderColor}` }}
      >
        <div className="text-center mb-6">
          {isEditable ? (
            <input 
              type="text" 
              value={widgetTitle || "Moment Meter"} 
              onChange={e => onTitleChange?.(e.target.value)}
              className="font-bold text-sm mb-1 uppercase bg-transparent border-0 focus:ring-0 p-0 m-0 text-center w-full"
              style={{ color: sLColor }}
            />
          ) : (
            <p className="font-bold text-sm mb-1 uppercase" style={{ color: sLColor }}>{widgetTitle || "Moment Meter"}</p>
          )}
          {isEditable ? (
            <input 
              type="text" 
              value={globalMessage} 
              onChange={e => onMessageChange?.(e.target.value)}
              className="w-full text-center text-xs bg-transparent border-0 focus:ring-0 p-0 mb-2"
              style={{ color: lDColor }}
              placeholder="Enter message..."
            />
          ) : (
            globalMessage && <p className="text-xs mb-2" style={{ color: lDColor }}>{globalMessage}</p>
          )}
          <p className="text-xs" style={{ color: sLColor }}>Order in <strong style={{ color: pColor }}>{countdown}</strong> to get delivery between</p>
        </div>
        <div className="relative px-6 mb-6 mt-4">
          <div className="absolute top-2 left-8 right-8 h-0.5 z-0" style={{ backgroundColor: pColor }}></div>
          <div className="flex justify-between items-center relative z-10">
            <div className="w-4 h-4 rounded-full border-2 bg-white" style={{ borderColor: pColor }}></div>
            <div className="w-4 h-4 rounded-full bg-white border-2" style={{ borderColor: pColor }}></div>
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: pColor }}></div>
          </div>
        </div>
        <div className="flex justify-between px-2">
          <div className="flex flex-col items-center gap-1">
            <BagIcon c={pColor} s={20} />
            <span style={{ color: sLColor }} className="text-[10px] text-center">{s1L}<br/><span style={{ color: lDColor }}>{s1D}</span></span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <TruckIcon c={pColor} s={20} />
            <span style={{ color: sLColor }} className="text-[10px] text-center">{s2L}<br/><span style={{ color: lDColor }}>{s2D}</span></span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <HomeIcon c={pColor} s={20} />
            <span style={{ color: sLColor }} className="text-[10px] text-center">{s3L}<br/><span style={{ color: lDColor }}>{s3D}</span></span>
          </div>
        </div>
      </div>
    );
  }

  if (style === "split_blocks") {
    return (
      <div className="w-full max-w-md mx-auto">
        {isEditable ? (
            <input 
              type="text" 
              value={globalMessage} 
              onChange={e => onMessageChange?.(e.target.value)}
              className="w-full text-center text-sm font-semibold mb-3 bg-transparent border-0 focus:ring-0 p-0"
              style={{ color: sLColor }}
              placeholder="Enter message..."
            />
          ) : (
            globalMessage && <p className="text-center text-sm font-semibold mb-3" style={{ color: sLColor }}>{globalMessage}</p>
          )}
        <div className="flex shadow-sm overflow-hidden" style={{ borderRadius: `${borderRadius}px`, backgroundColor: bgColor, border: `1px solid ${borderColor}` }}>
          <div className="flex-1 p-4 flex flex-col items-center justify-center border-r" style={{ borderColor: `${borderColor}50`, backgroundColor: `${pColor}15` }}>
            <div className="mb-2"><BagIcon c={pColor} /></div>
            <span className="text-[10px] font-bold text-center" style={{ color: sLColor }}>{s1L}<br/><span className="text-xs" style={{ color: lDColor }}>{s1D}</span></span>
          </div>
          <div className="flex-1 p-4 flex flex-col items-center justify-center border-r" style={{ borderColor: `${borderColor}50`, backgroundColor: `${pColor}10` }}>
            <div className="mb-2"><TruckIcon c={pColor} /></div>
            <span className="text-[10px] font-bold text-center" style={{ color: sLColor }}>{s2L}<br/><span className="text-xs" style={{ color: lDColor }}>{s2D}</span></span>
          </div>
          <div className="flex-1 p-4 flex flex-col items-center justify-center" style={{ backgroundColor: `${pColor}05` }}>
            <div className="mb-2"><HomeIcon c={pColor} /></div>
            <span className="text-[10px] font-bold text-center" style={{ color: sLColor }}>{s3L}<br/><span className="text-xs" style={{ color: lDColor }}>{s3D}</span></span>
          </div>
        </div>
      </div>
    );
  }

  if (style === "vertical_timeline") {
    return (
      <div className="w-full max-w-md mx-auto p-5 shadow-sm relative overflow-hidden" style={{ borderRadius: `${borderRadius}px`, backgroundColor: bgColor, border: `1px solid ${borderColor}` }}>
        {isEditable ? (
          <input 
            type="text" 
            value={widgetTitle || "Delivery Status"} 
            onChange={e => onTitleChange?.(e.target.value)}
            className="text-sm font-bold mb-1 uppercase bg-transparent border-0 focus:ring-0 p-0 m-0 w-full"
            style={{ color: sLColor }}
          />
        ) : (
          <p className="text-sm font-bold mb-1 uppercase" style={{ color: sLColor }}>{widgetTitle || "Delivery Status"}</p>
        )}
        {isEditable ? (
            <input 
              type="text" 
              value={globalMessage} 
              onChange={e => onMessageChange?.(e.target.value)}
              className="w-full text-[11px] mb-4 bg-transparent border-0 focus:ring-0 p-0"
              style={{ color: lDColor }}
              placeholder="Enter message..."
            />
          ) : (
            globalMessage && <p className="text-[11px] mb-4" style={{ color: lDColor }}>{globalMessage}</p>
          )}
        {!globalMessage && !isEditable && <div className="mb-2"></div>}
        <div className="relative pl-3">
          <div className="absolute top-2 bottom-2 left-[19px] w-[2px] z-0" style={{ backgroundColor: pColor }}></div>
          <div className="flex items-start gap-3 mb-4 relative z-10">
            <div className="w-4 h-4 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: pColor }}></div>
            <div>
              <p className="text-xs font-bold" style={{ color: sLColor }}>{s1L}</p>
              <p className="text-[10px]" style={{ color: lDColor }}>Order successfully placed ({s1D})</p>
            </div>
          </div>
          <div className="flex items-start gap-3 mb-4 relative z-10">
            <div className="w-4 h-4 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: pColor }}></div>
            <div>
              <p className="text-xs font-bold" style={{ color: sLColor }}>{s2L}</p>
              <p className="text-[10px]" style={{ color: lDColor }}>Your order will be shipped ({s2D})</p>
            </div>
          </div>
          <div className="flex items-start gap-3 relative z-10">
            <div className="w-4 h-4 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: pColor }}></div>
            <div>
              <p className="text-xs font-bold" style={{ color: sLColor }}>{s3L}</p>
              <p className="text-[10px]" style={{ color: lDColor }}>It will arrive at your address ({s3D})</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 6. Dual Cards
  if (style === "dual_cards") {
    return (
      <div className="w-full max-w-md mx-auto">
        {isEditable ? (
          <input 
            type="text" 
            value={globalMessage} 
            onChange={e => onMessageChange?.(e.target.value)}
            className="w-full text-center text-sm font-semibold mb-3 bg-transparent border-0 focus:ring-0 p-0"
            style={{ color: sLColor }}
            placeholder="Enter message..."
          />
        ) : (
          globalMessage && <p className="text-center text-sm font-semibold mb-3" style={{ color: sLColor }}>{globalMessage}</p>
        )}
        <div className="flex gap-3">
          <div className="flex-1 p-3 shadow-sm flex flex-col gap-2" style={{ borderRadius: `${borderRadius}px`, backgroundColor: bgColor, border: `1px solid ${pColor}` }}>
            <BagIcon c={pColor} />
            <p className="text-xs font-bold" style={{ color: pColor }}>{s1L}</p>
            <p className="text-[10px]" style={{ color: sLColor }}>Expected Delivery by<br/><strong style={{ color: lDColor }}>{s1D}</strong></p>
          </div>
          <div className="flex-1 p-3 shadow-sm flex flex-col gap-2 relative" style={{ borderRadius: `${borderRadius}px`, backgroundColor: bgColor, border: `1px solid ${borderColor}` }}>
            <div style={{ opacity: 0.6 }}><HomeIcon c={pColor} /></div>
            <p className="text-xs font-bold" style={{ color: sLColor }}>{s3L}</p>
            <p className="text-[10px] opacity-70" style={{ color: sLColor }}>Arriving into location<br/><strong style={{ color: lDColor }}>{s3D}</strong></p>
          </div>
        </div>
      </div>
    );
  }

  // 7. Minimal No Line
  if (style === "minimal_no_line") {
    return (
      <div className="w-full max-w-md mx-auto">
        {isEditable ? (
          <input 
            type="text" 
            value={globalMessage} 
            onChange={e => onMessageChange?.(e.target.value)}
            className="w-full text-center text-sm font-semibold mb-3 bg-transparent border-0 focus:ring-0 p-0"
            style={{ color: sLColor }}
            placeholder="Enter message..."
          />
        ) : (
          globalMessage && <p className="text-center text-sm font-semibold mb-3" style={{ color: sLColor }}>{globalMessage}</p>
        )}
        <div className="p-4 flex justify-between shadow-sm" style={{ borderRadius: `${borderRadius}px`, backgroundColor: bgColor, border: `1px solid ${borderColor}` }}>
          <div className="flex flex-col items-center gap-2">
            <BagIcon c={pColor} s={32} />
            <span className="text-[10px] font-bold text-center uppercase tracking-wide" style={{ color: sLColor }}>{s1L}<br/><span className="font-normal opacity-70" style={{ color: lDColor }}>{s1D}</span></span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <TruckIcon c={pColor} s={32} />
            <span className="text-[10px] font-bold text-center uppercase tracking-wide" style={{ color: sLColor }}>{s2L}<br/><span className="font-normal opacity-70" style={{ color: lDColor }}>{s2D}</span></span>
          </div>
          <div className="flex flex-col items-center gap-2 relative">
            <HomeIcon c={pColor} s={32} />
            <span className="text-[10px] font-bold text-center uppercase tracking-wide" style={{ color: sLColor }}>{s3L}<br/><span className="font-normal opacity-70" style={{ color: lDColor }}>{s3D}</span></span>
          </div>
        </div>
      </div>
    );
  }

  // 8. Bullet Points Timeline
  if (style === "bullet_points") {
    return (
      <div className="w-full max-w-md mx-auto p-4 shadow-sm" style={{ borderRadius: `${borderRadius}px`, backgroundColor: bgColor, border: `1px solid ${borderColor}` }}>
        <div className="flex flex-col gap-3 mb-5">
           <div className="flex items-center gap-3 text-xs"><RocketIcon c={pColor} s={16} /> <span style={{ color: sLColor }}>Free Shipping on all orders</span></div>
           <div className="flex items-center gap-3 text-xs"><PackageIcon c={pColor} s={16} /> <span style={{ color: sLColor }}>Order within next <strong>{countdown}</strong> for dispatch</span></div>
           {isEditable ? (
              <div className="flex items-center gap-3 text-xs">
                <TruckIcon c={pColor} s={16} />
                <input 
                  type="text" 
                  value={globalMessage} 
                  onChange={e => onMessageChange?.(e.target.value)}
                  className="flex-1 text-xs bg-transparent border-0 focus:ring-0 p-0"
                  style={{ color: lDColor }}
                  placeholder="Enter message..."
                />
              </div>
            ) : (
              globalMessage && <div className="flex items-center gap-3 text-xs"><TruckIcon c={pColor} s={16} /> <span style={{ color: lDColor }}>{globalMessage}</span></div>
            )}
        </div>
        <div className="relative px-6 pt-2 pb-2">
          <div className="absolute top-[18px] left-[40px] right-[40px] h-0.5 z-0" style={{ backgroundColor: pColor }}></div>
          <div className="flex justify-between relative z-10">
            <div className="flex flex-col items-center gap-1">
              <div className="w-8 h-8 rounded-full border border-gray-200 bg-white flex items-center justify-center shadow-sm">
                <BagIcon c={pColor} s={14} />
              </div>
              <span className="text-[10px] font-bold text-center uppercase" style={{ color: sLColor }}>{s1L}<br/><span className="font-normal" style={{color: lDColor}}>{s1D}</span></span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-8 h-8 rounded-full border border-gray-200 bg-white flex items-center justify-center shadow-sm">
                <TruckIcon c={pColor} s={14} />
              </div>
              <span className="text-[10px] font-bold text-center uppercase" style={{ color: sLColor }}>{s2L}<br/><span className="font-normal" style={{color: lDColor}}>{s2D}</span></span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-8 h-8 rounded-full border border-gray-200 bg-white flex items-center justify-center shadow-sm">
                <GiftIcon c={pColor} s={14} />
              </div>
              <span className="text-[10px] font-bold text-center uppercase" style={{ color: sLColor }}>{s3L}<br/><span className="font-normal" style={{color: lDColor}}>{s3D}</span></span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 9. Thick Track
  if (style === "thick_track") {
    return (
      <div className="w-full max-w-md mx-auto p-4 shadow-sm" style={{ borderRadius: `${borderRadius}px`, backgroundColor: bgColor, border: `1px solid ${borderColor}` }}>
        {isEditable ? (
          <input 
            type="text" 
            value={globalMessage} 
            onChange={e => onMessageChange?.(e.target.value)}
            className="w-full text-left text-sm font-bold mb-4 bg-transparent border-0 focus:ring-0 p-0"
            style={{ color: sLColor }}
            placeholder="Estimate shipping period"
          />
        ) : (
          <p className="font-bold text-sm mb-4" style={{ color: sLColor }}>{globalMessage || "Estimate shipping period"}</p>
        )}
        <div className="grid grid-cols-3 gap-1 px-1 mb-2">
          <span className="text-[10px] font-bold text-left" style={{ color: sLColor }}>Ordered today</span>
          <span className="text-[10px] font-bold text-center" style={{ color: sLColor }}>Shipping<br/>1 to 2 days</span>
          <span className="text-[10px] font-bold text-right" style={{ color: sLColor }}>Delivery<br/>3 to 5 days</span>
        </div>
        <div className="relative h-2 rounded-full mb-2 mx-1 bg-gray-200" style={{ backgroundColor: `${borderColor}` }}>
          <div className="absolute top-0 left-0 h-full rounded-full" style={{ width: '50%', backgroundColor: pColor }}></div>
          <div className="absolute top-1/2 left-[50%] w-4 h-4 rounded-full outline outline-[3px] outline-white -translate-y-1/2 -translate-x-1/2" style={{ backgroundColor: pColor }}></div>
        </div>
        <div className="grid grid-cols-3 gap-1 px-1">
          <span className="text-[10px] opacity-70 text-left" style={{ color: lDColor }}>{s1D}</span>
          <span className="text-[10px] opacity-70 text-center" style={{ color: lDColor }}>{shipDate} - {minDate}</span>
          <span className="text-[10px] opacity-70 text-right" style={{ color: lDColor }}>{minDate} - {maxDate}</span>
        </div>
      </div>
    );
  }

  // 10. Framed Circles
  if (style === "framed_circles") {
    return (
      <div className="w-full max-w-md mx-auto p-5 shadow-sm" style={{ borderRadius: `${borderRadius}px`, backgroundColor: bgColor, border: `1px solid ${borderColor}` }}>
        <div className="flex items-center justify-center gap-2 mb-5">
           <GiftIcon c={pColor} s={24} />
           <div className="text-center">
             {isEditable ? (
               <input 
                 type="text" 
                 value={widgetTitle || "FREE & FAST DELIVERY"} 
                 onChange={e => onTitleChange?.(e.target.value)}
                 className="w-full font-bold text-sm font-serif italic uppercase bg-transparent border-0 focus:ring-0 p-0 m-0 text-center"
                 style={{ color: sLColor }}
               />
             ) : (
               <p className="font-bold text-sm font-serif italic uppercase" style={{ color: sLColor }}>{widgetTitle || "FREE & FAST DELIVERY"}</p>
             )}
             {isEditable ? (
               <input 
                 type="text" 
                 value={globalMessage} 
                 onChange={e => onMessageChange?.(e.target.value)}
                 className="w-full text-center text-[10px] mt-1 bg-transparent border-0 focus:ring-0 p-0"
                 style={{ color: lDColor }}
                 placeholder="Enter message..."
               />
             ) : (
               globalMessage && <p className="text-[10px] mt-1" style={{ color: lDColor }}>{globalMessage}</p>
             )}
           </div>
        </div>
        <div className="relative px-6 pt-2 pb-2">
          <div className="absolute top-[28px] left-[48px] right-[48px] h-0.5 z-0" style={{ backgroundColor: pColor }}></div>
          <div className="flex justify-between relative z-10">
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-md relative" style={{ border: `2px solid ${pColor}` }}>
                <BagIcon c={pColor} />
              </div>
              <span className="text-[10px] font-bold text-center uppercase tracking-tight" style={{ color: sLColor }}>{s1L}<br/><span className="font-normal capitalize" style={{ color: lDColor }}>{s1D}</span></span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-md relative" style={{ border: `2px solid ${pColor}` }}>
                <TruckIcon c={pColor} />
              </div>
              <span className="text-[10px] font-bold text-center uppercase tracking-tight" style={{ color: sLColor }}>{s2L}<br/><span className="font-normal capitalize" style={{ color: lDColor }}>{s2D}</span></span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-md relative" style={{ border: `2px solid ${pColor}` }}>
                <HomeIcon c={pColor} />
              </div>
              <span className="text-[10px] font-bold text-center uppercase tracking-tight" style={{ color: sLColor }}>{s3L}<br/><span className="font-normal capitalize" style={{ color: lDColor }}>{s3D}</span></span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 11. Minimal Cards
  if (style === "minimal_cards") {
    return (
      <div className="w-full max-w-md mx-auto">
        {isEditable ? (
          <input 
            type="text" 
            value={globalMessage} 
            onChange={e => onMessageChange?.(e.target.value)}
            className="w-full text-center text-sm font-semibold mb-3 bg-transparent border-0 focus:ring-0 p-0"
            style={{ color: sLColor }}
            placeholder="Enter message..."
          />
        ) : (
          globalMessage && <p className="text-center text-sm font-semibold mb-3" style={{ color: sLColor }}>{globalMessage}</p>
        )}
        <div className="flex gap-2">
          <div className="flex-1 p-3 shadow-none flex flex-col items-center gap-1" style={{ borderRadius: `${borderRadius}px`, backgroundColor: bgColor, border: `1px solid ${borderColor}` }}>
            <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center mb-1">
              <BagIcon c={pColor} s={16} />
            </div>
            <span className="text-[10px] font-bold uppercase" style={{ color: sLColor }}>{s1L}</span>
            <span className="text-[10px] opacity-60" style={{ color: lDColor }}>{s1D}</span>
          </div>
          <div className="flex-1 p-3 shadow-none flex flex-col items-center gap-1" style={{ borderRadius: `${borderRadius}px`, backgroundColor: bgColor, border: `1px solid ${pColor}` }}>
            <div className="w-8 h-8 rounded flex items-center justify-center mb-1" style={{ backgroundColor: `${pColor}20` }}>
              <TruckIcon c={pColor} s={16} />
            </div>
            <span className="text-[10px] font-bold uppercase" style={{ color: pColor }}>{s2L}</span>
            <span className="text-[10px] opacity-60" style={{ color: pColor }}>{s2D}</span>
          </div>
          <div className="flex-1 p-3 shadow-none flex flex-col items-center gap-1" style={{ borderRadius: `${borderRadius}px`, backgroundColor: bgColor, border: `1px solid ${borderColor}` }}>
            <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center mb-1">
              <HomeIcon c={pColor} s={16} />
            </div>
            <span className="text-[10px] font-bold uppercase" style={{ color: sLColor }}>{s3L}</span>
            <span className="text-[10px] opacity-60" style={{ color: lDColor }}>{s3D}</span>
          </div>
        </div>
      </div>
    );
  }

  // 12. Clean Horizontal
  if (style === "clean_horizontal") {
    return (
      <div className="w-full max-w-md mx-auto" style={{ backgroundColor: 'transparent' }}>
        {isEditable ? (
          <input 
            type="text" 
            value={widgetTitle || "Delivery Progress"} 
            onChange={e => onTitleChange?.(e.target.value)}
            className="font-semibold text-xs mb-1 uppercase tracking-widest text-center bg-transparent border-0 focus:ring-0 p-0 m-0 w-full"
            style={{ color: sLColor }}
          />
        ) : (
          <p className="font-semibold text-xs mb-1 uppercase tracking-widest text-center" style={{ color: sLColor }}>{widgetTitle || "Delivery Progress"}</p>
        )}
        {isEditable ? (
          <input 
            type="text" 
            value={globalMessage} 
            onChange={e => onMessageChange?.(e.target.value)}
            className="w-full text-center text-[11px] mb-4 bg-transparent border-0 focus:ring-0 p-0"
            style={{ color: lDColor }}
            placeholder="Enter message..."
          />
        ) : (
          globalMessage && <p className="text-center text-[11px] mb-4" style={{ color: lDColor }}>{globalMessage}</p>
        )}
        {!globalMessage && !isEditable && <div className="mb-4"></div>}
        <div className="flex items-center justify-between">
          <div className="flex flex-col items-center">
            <span className="text-xl font-light" style={{ color: sLColor }}>{s1D.split(' ')[1] || '10'}</span>
            <span className="text-[10px] uppercase font-bold" style={{ color: pColor }}>{s1L}</span>
          </div>
          <div className="flex-1 h-[1px] mx-4 relative bg-gray-200" style={{ backgroundColor: borderColor }}>
            <div className="absolute top-0 right-0 w-1/2 h-full" style={{ backgroundColor: pColor }}></div>
          </div>
          <div className="flex flex-col items-center">
             <div className="w-6 h-6 rounded-full flex items-center justify-center mb-1" style={{ backgroundColor: pColor }}>
                 <TruckIcon c="#ffffff" s={12} />
             </div>
             <span className="text-[10px] uppercase font-bold" style={{ color: sLColor }}>{s2L}</span>
          </div>
          <div className="flex-1 h-[1px] mx-4 relative bg-gray-200" style={{ backgroundColor: borderColor }}></div>
          <div className="flex flex-col items-center">
            <span className="text-xl font-light" style={{ color: sLColor }}>{s3D.split(' ')[1] || '15'}</span>
            <span className="text-[10px] uppercase font-bold opacity-60" style={{ color: lDColor }}>{s3L}</span>
          </div>
        </div>
      </div>
    );
  }

  // 4. Simple Line (Fallback defaults)
  return (
    <div 
      className="w-full max-w-md mx-auto p-5 shadow-sm"
      style={{ borderRadius: `${borderRadius}px`, backgroundColor: bgColor, border: `1px solid ${borderColor}` }}
    >
      <div className="flex items-center gap-3 mb-6 justify-center">
        <GiftIcon c={pColor} />
        <div className="flex-1">
          {isEditable ? (
            <input 
              type="text" 
              value={widgetTitle || "FREE & FAST DELIVERY"} 
              onChange={e => onTitleChange?.(e.target.value)}
              className="font-bold text-base uppercase bg-transparent border-0 focus:ring-0 p-0 m-0 w-full"
              style={{ color: sLColor }}
            />
          ) : (
            <p className="font-bold text-base uppercase" style={{ color: sLColor }}>{widgetTitle || "FREE & FAST DELIVERY"}</p>
          )}
          {isEditable ? (
            <input 
              type="text" 
              value={globalMessage} 
              onChange={e => onMessageChange?.(e.target.value)}
              className="w-full text-xs bg-transparent border-0 focus:ring-0 p-0"
              style={{ color: lDColor }}
              placeholder="Enter message..."
            />
          ) : (
            globalMessage && <p className="text-xs" style={{ color: lDColor }}>{globalMessage}</p>
          )}
        </div>
      </div>
      <div className="relative px-8 pt-2">
        <div className="absolute top-6 left-[52px] right-[52px] h-0.5 z-0" style={{ backgroundColor: pColor }}></div>
        <div className="flex justify-between relative z-10">
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full border-2 bg-white flex items-center justify-center" style={{ borderColor: pColor }}>
              <BagIcon c={pColor} s={16} />
            </div>
            <span className="text-[10px] text-center font-medium" style={{ color: sLColor }}>{s1L}<br/><span style={{ color: lDColor }}>{s1D}</span></span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full border-2 bg-white flex items-center justify-center" style={{ borderColor: pColor }}>
              <TruckIcon c={pColor} s={16} />
            </div>
            <span className="text-[10px] text-center font-medium" style={{ color: sLColor }}>{s2L}<br/><span style={{ color: lDColor }}>{s2D}</span></span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full border-2 bg-white flex items-center justify-center" style={{ borderColor: pColor }}>
              <HomeIcon c={pColor} s={16} />
            </div>
            <span className="text-[10px] text-center font-medium" style={{ color: sLColor }}>{s3L}<br/><span style={{ color: lDColor }}>{s3D}</span></span>
          </div>
        </div>
      </div>
    </div>
  );
}
