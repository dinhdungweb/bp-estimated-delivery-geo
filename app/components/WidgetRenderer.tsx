import React from "react";

export type WidgetStyleId = "eco_delivery" | "urgent_pulse" | "express_alert" | "global_trust" | "orange_blitz" | "dark_glassmorphism" | "simple_timeline" | "boxed_cards_blue" | "estimate_shipping_period" | "minimal_cart_truck" | "dark_urgency" | "trust_info_list" | "vertical_yellow" | "vertical_orange" | "green_order_now" | "red_moment_meter" | "blue_gradient" | "blue_boxed_steps" | "yellow_progress" | "dual_cards" | "custom";

export type BlockType = "header" | "steps" | "timer" | "divider" | "policy" | "spacer" | "banner" | "trust_badges" | "progress" | "html" | "image" | "dual_info";

export interface BlockConfig {
  id: string;
  type: BlockType;
  settings: Record<string, any>;
}

export interface WidgetSettingsProps {
  style: WidgetStyleId;
  customBlocks?: BlockConfig[];
  blocks?: BlockConfig[];
  headerText?: string;
  subHeaderText?: string;
  step1Label?: string;
  step1SubText?: string;
  step1Icon?: string;
  step2Label?: string;
  step2SubText?: string;
  step2Icon?: string;
  step3Label?: string;
  step3SubText?: string;
  step3Icon?: string;
  textColor: string;
  iconColor: string;
  bgColor: string;
  borderColor: string;
  borderWidth?: number;
  borderRadius: number;
  shadow?: "none" | "sm" | "md" | "lg" | "xl" | "premium" | string;
  glassmorphism?: boolean;
  padding?: number;
  bgGradient?: string;
  showTimeline?: boolean;
  policyText?: string;
}

// ─── High-Fidelity SVG Icons (Pixel-Perfect) ───────────────────────────────────
export const IconList: Record<string, any> = {
  bag: ({ c, s = 24 }: { c: string; s?: number }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" strokeWidth="1.6" stroke={c}><path d="M6 8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8z" /><path d="M9 6c0-1.657 1.343-3 3-3s3 1.343 3 3" /><path d="M6 10h12" /><circle cx="9" cy="14" r="1.5" fill={c} /><circle cx="15" cy="14" r="1.5" fill={c} /></svg>
  ),
  truck: ({ c, s = 24 }: { c: string; s?: number }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" strokeWidth="1.6" stroke={c}><circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" /><path d="M5 17h2.5" /><path d="M11.5 17h3.5" /><path d="M21 17h-1.5v-5a1 1 0 0 0-1-1H14" /><path d="M14 17h5l1.5-3.5V11H14V6a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v11h3" /></svg>
  ),
  truck_mini: ({ c, s = 16 }: { c: string; s?: number }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill={c}><path d="M19 10h-2V7c0-1.1-.9-2-2-2H3c-1.1 0-2 .9-2 2v10h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-2zm-13 8c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm12 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" /></svg>
  ),
  heart: ({ c, s = 24 }: { c: string; s?: number }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill={c}><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
  ),
  map_pin: ({ c, s = 24 }: { c: string; s?: number }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" strokeWidth="1.6" stroke={c}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" fill={c} /></svg>
  ),
  package: ({ c, s = 24 }: { c: string; s?: number }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" strokeWidth="1.6" stroke={c}><path d="M12 3L4 8v8l8 5 8-5V8l-8-5z" /><path d="M4 8l8 5 8-5" /><path d="M12 21V13" /></svg>
  ),
  box: ({ c, s = 24 }: { c: string; s?: number }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" strokeWidth="1.6" stroke={c}><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></svg>
  ),
  scooter: ({ c, s = 24 }: { c: string; s?: number }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" strokeWidth="1.6" stroke={c}><circle cx="6" cy="18" r="2" /><circle cx="18" cy="18" r="2" /><path d="M8 18h8" /><path d="M18 18h1c1.1 0 2-.9 2-2V7a2 2 0 0 0-2-2h-3" /><path d="M12 11h6V5h-6z" /><path d="M12 5V2" /><path d="M12 17V8c0-1.1-.9-2-2-2H2v3h6v8" /></svg>
  ),
  check_badge: ({ c, s = 24 }: { c: string; s?: number }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill={c} transform="scale(1.1)"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2z" /></svg>
  ),
  store: ({ c, s = 24 }: { c: string; s?: number }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" strokeWidth="1.6" stroke={c}><path d="M2.2 7.3h19.6l-1 4.4H3.2l-1-4.4z" /><path d="M5.5 11.7V21h13V11.7" /><path d="M10 21v-5h4v5" /></svg>
  ),
  monitor: ({ c, s = 24 }: { c: string; s?: number }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" strokeWidth="1.6" stroke={c}><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M12 16v4" /><path d="M8 20h8" /></svg>
  ),
  shield: ({ c, s = 24 }: { c: string; s?: number }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" strokeWidth="1.6" stroke={c}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M12 8v4" /><path d="M12 16h.01" /></svg>
  ),
  rocket: ({ c, s = 24 }: { c: string; s?: number }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" strokeWidth="1.6" stroke={c} d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" /><path d="M9 12H4s.5-1 1-4c2 0 3 0 3 0" /><path d="M15 9V4s-1 .5-4 1c0 2 0 3 0 3" /></svg>
  ),
  clock: ({ c, s = 24 }: { c: string; s?: number }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" strokeWidth="1.6" stroke={c}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
  ),
};

const IconRenderer = ({ icon, color, size = 24 }: { icon?: string; color: string; size?: number }) => {
  if (!icon) return null;
  const iconName = icon.startsWith("lucide:") ? icon.replace("lucide:", "").replace(/-/g, "_") : icon;
  const SelectedIcon = IconList[iconName] || IconList["package"];
  return <SelectedIcon c={color} s={size} />;
};

const PREVIEW_DATA = {
  orderDate: "Jan 10",
  shipDate: "Jan 12",
  minDate: "Jan 13",
  maxDate: "Jan 15",
  countdown: "02:14:59",
};

const shadowStyles: Record<string, string> = {
  none: "none",
  sm: "0 1px 3px rgba(0,0,0,0.1)",
  md: "0 4px 6px rgba(0,0,0,0.1)",
  lg: "0 10px 15px rgba(0,0,0,0.1)",
  xl: "0 20px 25px rgba(0,0,0,0.1)",
  premium: "0 15px 35px rgba(0,0,0,0.15)"
};

export function WidgetPreviewRenderer({ settings }: { settings: WidgetSettingsProps }) {
  const {
    customBlocks, blocks: legacyBlocks, textColor, iconColor, bgColor, borderColor, borderRadius,
    shadow, glassmorphism, padding = 16, bgGradient
  } = settings;

  const blocks = customBlocks || legacyBlocks || [];
  const { orderDate, shipDate, minDate, maxDate, countdown } = PREVIEW_DATA;

  const formatText = (text?: string) => {
    if (!text) return "";
    return text
      .replace(/{order_date}/g, orderDate)
      .replace(/{ship_date}/g, shipDate)
      .replace(/{min_date}/g, minDate)
      .replace(/{max_date}/g, maxDate)
      .replace(/{countdown}/g, countdown)
      .replace(/{COUNTRY_NAME}/g, "Vietnam")
      .replace(/{COUNTRY_FLAG}/g, "🇻🇳");
  };

  const render_header = (s: any) => {
    const isBannerType = s.styleType === 'title_banner';
    const isHorizontal = s.iconPosition === 'left' || s.iconPosition === 'right';

    return (
      <div key={s.id} className={`bp-header ${isBannerType ? 'bp-header-banner' : ''}`} style={{
        background: isBannerType ? (s.bgColor || '#fde047') : (s.bgColor || 'transparent'),
        border: s.borderWidth ? `${s.borderWidth}px solid ${s.borderColor || borderColor}` : 'none',
        borderRadius: s.borderRadius !== undefined ? `${s.borderRadius}px` : (isBannerType ? 8 : 0),
        color: isBannerType ? (s.textColor || '#000') : (s.textColor || 'inherit'),
        flexDirection: isHorizontal ? 'row' : 'column',
        alignItems: s.align === 'left' ? 'flex-start' : s.align === 'right' ? 'flex-end' : 'center',
        padding: s.padding !== undefined ? `${s.padding}px` : '',
        '--bp-size': `${s.iconSize || 24}px`
      } as any}>
        {(s.iconPosition === 'top' || s.iconPosition === 'left') && s.icon && <IconRenderer icon={s.icon} color="inherit" size={s.iconSize || 24} />}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: s.align || 'center' }}>
           <div className="bp-text-label" style={{ fontSize: s.fontSize === 'sm' ? '14px' : s.fontSize === 'lg' ? '20px' : 'inherit' }}>{formatText(s.text)}</div>
           {s.subText && <div className="bp-text-sub">{formatText(s.subText)}</div>}
        </div>
        {(s.iconPosition === 'bottom' || s.iconPosition === 'right') && s.icon && <IconRenderer icon={s.icon} color="inherit" size={s.iconSize || 24} />}
      </div>
    );
  };

  const render_steps = (s: any) => {
    const preset = s.preset || 'horizontal';
    const items = [
      { label: s.step1Label || "Order", sub: s.step1SubText || orderDate, icon: s.step1Icon || "bag" },
      { label: s.step2Label || "Shipped", sub: s.step2SubText || shipDate, icon: s.step2Icon || "truck" },
      { label: s.step3Label || "Delivery", sub: s.step3SubText || maxDate, icon: s.step3Icon || "map_pin" },
    ];

    const presetClass = `bp-steps-${preset.replace('_', '-')}`;
    
    return (
      <div key={s.id} className={`bp-steps ${presetClass}`} style={{ 
        '--bp-size': `${s.iconSize || 24}px`,
        '--bp-gap': `${s.itemGap || 16}px`,
      } as any}>
        {items.map((item, i) => {
          const isFirst = i === 0;
          const isLast = i === items.length - 1;
          const stepBg = s[`step${i+1}Bg`];
          
          let itemClass = 'bp-timeline-item';
          if (preset === 'vertical') itemClass = 'bp-vertical-item';
          else if (preset === 'boxed_cards' || preset === 'boxed_steps') itemClass = 'bp-card';
          else if (preset === 'split_segments' || preset === 'thick' || preset === 'chevron') itemClass = 'bp-segment';

          const hasItemBorder = (preset === 'boxed_cards' || preset === 'boxed_steps' || preset === 'split_segments');

          return (
            <div key={i} className={itemClass} style={{
              background: stepBg,
              borderRadius: s.borderRadius !== undefined ? `${s.borderRadius}px` : undefined,
              border: (s.borderWidth && hasItemBorder) ? `${s.borderWidth}px solid ${isFirst ? iconColor : '#eee'}` : undefined
            }}>
              {!isLast && (preset === 'timeline_dots' || preset === 'thick') && <div className="bp-timeline-connector" style={{ borderTopStyle: s.connectorStyle || 'dashed', borderTopColor: iconColor } as any} />}
              {!isLast && preset === 'vertical' && <div className="bp-vertical-connector" style={{ borderLeftStyle: s.connectorStyle || 'dashed', borderLeftColor: iconColor } as any} />}
              
              <div className="bp-timeline-dot" style={{ background: isFirst ? iconColor : '#fff', borderColor: isFirst ? iconColor : '#eee' }}>
                <IconRenderer icon={item.icon} color={isFirst ? '#fff' : iconColor} size={s.iconSize || (preset === 'timeline_dots' ? 16 : 22)} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: preset === 'vertical' ? 'left' : 'center' }}>
                <div className="bp-text-label">{formatText(item.label)}</div>
                <div className="bp-text-sub">{formatText(item.sub)}</div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const render_timer = (s: any) => (
    <div key={s.id} className="bp-timer" style={{
      background: s.bgColor || 'rgba(0,0,0,0.03)',
      color: s.textColor || 'inherit',
      '--bp-ic': s.color || iconColor
    } as any}>
      <div className="bp-timer-dot" />
      <div className="bp-text-label" style={{ fontWeight: '500' }}>
        {formatText(s.text)}
      </div>
    </div>
  );

  const render_banner = (s: any) => {
    let bg = '#e0f2fe'; let bc = '#7dd3fc';
    if (s.type === 'success') { bg = '#dcfce7'; bc = '#86efac'; }
    if (s.type === 'warning') { bg = '#fef9c3'; bc = '#fde047'; }
    if (s.type === 'error') { bg = '#fee2e2'; bc = '#fca5a5'; }
    return (
      <div key={s.id} className="bp-banner" style={{
        backgroundColor: s.styleType === 'outline' ? 'transparent' : bg,
        borderColor: bc,
        textAlign: s.align || 'left',
        color: s.textColor || 'inherit'
      }}>
        {s.icon && <IconRenderer icon={s.icon} color={iconColor} size={20} />}
        <div style={{ flex: 1 }}>{formatText(s.text)}</div>
      </div>
    );
  };

  const render_custom_block = (block: any) => {
    switch (block.type) {
      case 'header': return render_header(block.settings);
      case 'steps': return render_steps(block.settings);
      case 'timer': return render_timer(block.settings);
      case 'banner': return render_banner(block.settings);
      case 'dual_info': return (
        <div key={block.id} className="bp-dual-info">
          <div className="bp-dual-card">
            <IconRenderer icon={block.settings.leftIcon || "monitor"} color={iconColor} size={28} />
            <div className="bp-text-label">{formatText(block.settings.leftTitle || "Online")}</div>
            <div className="bp-text-sub">{formatText(block.settings.leftText)}</div>
          </div>
          <div className="bp-dual-card">
            <IconRenderer icon={block.settings.rightIcon || "store"} color={iconColor} size={28} />
            <div className="bp-text-label">{formatText(block.settings.rightTitle || "In Store")}</div>
            <div className="bp-text-sub">{formatText(block.settings.rightText)}</div>
          </div>
        </div>
      );
      case 'divider': return <div key={block.id} style={{ height: block.settings.height || 1, background: block.settings.color || borderColor, margin: '8px 0' }} />;
      case 'spacer': return <div key={block.id} style={{ height: block.settings.height || 16 }} />;
      case 'progress': return (
        <div key={block.id} style={{ padding: '8px 0' }}>
          <div className="bp-text-label" style={{ marginBottom: '6px' }}>{formatText(block.settings.label)}</div>
          <div className="bp-progress-bar">
            <div className="bp-progress-fill" style={{ width: `${block.settings.percentage || 75}%`, background: block.settings.color || iconColor }} />
          </div>
        </div>
      );
      case 'trust_badges': return (
        <div key={block.id} className="bp-trust-row">
          {(block.settings.badges || ['check_badge', 'shield']).map((b: any, i: number) => (
            <div key={i} title={b}><IconRenderer icon={b} color={iconColor} size={24} /></div>
          ))}
        </div>
      );
      default: return null;
    }
  };

  return (
    <div className={`bp-widget bp-shadow-${shadow || 'none'} ${glassmorphism ? 'bp-glass' : ''}`} style={{
      '--bp-tc': textColor,
      '--bp-ic': iconColor,
      '--bp-bg': bgColor || '#fff',
      '--bp-bc': borderColor,
      '--bp-rad': `${borderRadius}px`,
      '--bp-pad': `${padding}px`,
      background: bgGradient || bgColor || '#fff',
      border: settings.borderWidth ? `${settings.borderWidth}px solid ${settings.borderColor || borderColor}` : 'none'
    } as any}>
      <div className="bp-container">
        {blocks.map(render_custom_block)}
      </div>
    </div>
  );
}
