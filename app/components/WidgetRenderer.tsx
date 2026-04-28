import {
  buildFallbackBlocks,
  normalizePolicyItems,
  normalizeStepItems,
  normalizeTrustBadges,
} from "../lib/delivery";
import type { WidgetSettingsProps } from "../lib/delivery";
import {
  PiAirplaneTiltDuotone,
  PiCalendarBlankDuotone,
  PiCheckCircleDuotone,
  PiClockCountdownDuotone,
  PiCubeDuotone,
  PiHeartDuotone,
  PiHouseLineDuotone,
  PiMapPinDuotone,
  PiMapTrifoldDuotone,
  PiMonitorDuotone,
  PiMopedDuotone,
  PiPackageDuotone,
  PiRocketLaunchDuotone,
  PiShieldCheckDuotone,
  PiShoppingBagDuotone,
  PiShoppingCartDuotone,
  PiSparkleDuotone,
  PiStorefrontDuotone,
  PiTagDuotone,
  PiTruckDuotone,
  PiWarehouseDuotone,
} from "react-icons/pi";
import type { IconType } from "react-icons";
import { createElement, useEffect, useRef, useState } from "react";
import type { ReactElement, ReactNode } from "react";

export type {
  BlockConfig,
  BlockType,
  WidgetSettingsProps,
  WidgetStyleId,
} from "../lib/delivery";

const hasTimelineConnector = (preset: string) => preset === "timeline_dots";
const hasVerticalConnector = (preset: string) => preset === "vertical";

const LORDICON_SCRIPT_ID = "bp-lordicon-player";
const LORDICON_SCRIPT_SRC = "https://cdn.lordicon.com/lordicon.js";
const LORDICON_PRESETS: Record<string, string> = {
  cart: "https://media.lordicon.com/icons/wired/lineal/146-trolley.li",
  bag: "https://media.lordicon.com/icons/wired/lineal/2870-shopping-bag.li",
  package: "https://media.lordicon.com/icons/wired/lineal/108-box.li",
  box: "https://media.lordicon.com/icons/wired/lineal/108-box.li",
  truck: "https://media.lordicon.com/icons/wired/lineal/497-truck-delivery.li",
  scooter: "https://media.lordicon.com/icons/wired/lineal/497-truck-delivery.li",
  plane: "https://media.lordicon.com/icons/wired/lineal/489-rocket-space.li",
  warehouse: "https://media.lordicon.com/icons/wired/lineal/481-shop.li",
  map_pin: "https://media.lordicon.com/icons/wired/lineal/53-location-pin-on-round-map.li",
  route: "https://media.lordicon.com/icons/wired/lineal/53-location-pin-on-round-map.li",
  home: "https://media.lordicon.com/icons/wired/lineal/63-home.li",
  shield: "https://media.lordicon.com/icons/wired/lineal/955-shield-security.li",
  check_badge: "https://media.lordicon.com/icons/wired/lineal/955-shield-security.li",
  clock: "https://media.lordicon.com/icons/wired/lineal/1046-clock-time.li",
  calendar: "https://media.lordicon.com/icons/wired/lineal/1046-clock-time.li",
  rocket: "https://media.lordicon.com/icons/wired/lineal/489-rocket-space.li",
  heart: "https://media.lordicon.com/icons/wired/lineal/436-love-care.li",
  store: "https://media.lordicon.com/icons/wired/lineal/481-shop.li",
  monitor: "https://media.lordicon.com/icons/wired/lineal/1359-online-shopping.li",
  tag: "https://media.lordicon.com/icons/wired/lineal/289-price-tag.li",
  sparkles: "https://media.lordicon.com/icons/wired/lineal/489-rocket-space.li",
};
const LORDICON_TRIGGER_VALUES = new Set(["in", "click", "hover", "loop", "loop-on-hover", "boomerang", "morph", "sequence"]);
const LORDICON_STROKE_VALUES = new Set(["light", "regular", "bold"]);
const LORDICON_URL_PATTERN = /^https:\/\/(?:media\.lordicon\.com\/icons\/wired\/(?:lineal|outline|flat|gradient)\/[a-z0-9-]+\.li|cdn\.lordicon\.com\/[a-z0-9-]+\.json)$/i;

const loadLordiconScript = () => {
  if (typeof document === "undefined") return;
  if (document.getElementById(LORDICON_SCRIPT_ID)) return;
  const script = document.createElement("script");
  script.id = LORDICON_SCRIPT_ID;
  script.src = LORDICON_SCRIPT_SRC;
  script.async = true;
  document.head.appendChild(script);
};

const clampNumber = (value: unknown, fallback: number, min: number, max: number) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
};

const cleanLordiconState = (value: unknown) => {
  const state = String(value || "").trim();
  return /^[a-z0-9_-]{1,48}$/i.test(state) ? state : "";
};

const safeLordiconUrl = (settings: Record<string, unknown> = {}, icon?: string) => {
  if (settings.iconAnimation !== "lordicon") return "";
  const customUrl = String(settings.lordiconUrl || "").trim();
  if (LORDICON_URL_PATTERN.test(customUrl)) return customUrl;
  const preset = String(settings.lordiconPreset || "auto");
  if (preset !== "auto" && LORDICON_PRESETS[preset]) return LORDICON_PRESETS[preset];
  const normalizedIcon = String(icon || "").replace(/^lucide:/, "").replace(/-/g, "_");
  return LORDICON_PRESETS[normalizedIcon] || LORDICON_PRESETS.package;
};

const safeLordiconTrigger = (value: unknown) => {
  const trigger = String(value || "loop-on-hover");
  return LORDICON_TRIGGER_VALUES.has(trigger) ? trigger : "loop-on-hover";
};

const safeLordiconStroke = (value: unknown) => {
  const stroke = String(value || "regular");
  return LORDICON_STROKE_VALUES.has(stroke) ? stroke : "regular";
};

type WidgetIcon = ((props: { s?: number }) => ReactElement) & { displayName?: string };

const phosphorIcon = (Icon: IconType): WidgetIcon => {
  function PhosphorWidgetIcon({ s = 24 }: { s?: number }) {
    return <Icon size={s} aria-hidden="true" focusable="false" />;
  }

  const namedIcon = Icon as IconType & { displayName?: string; name?: string };
  PhosphorWidgetIcon.displayName = namedIcon.displayName || namedIcon.name || "PhosphorWidgetIcon";
  return PhosphorWidgetIcon;
};

// Phosphor Duotone icon set. IDs stay backward-compatible with saved widgets.
export const IconList: Record<string, WidgetIcon> = {
  bag: phosphorIcon(PiShoppingBagDuotone),
  cart: phosphorIcon(PiShoppingCartDuotone),
  package: phosphorIcon(PiPackageDuotone),
  box: phosphorIcon(PiCubeDuotone),
  truck: phosphorIcon(PiTruckDuotone),
  truck_mini: phosphorIcon(PiTruckDuotone),
  scooter: phosphorIcon(PiMopedDuotone),
  plane: phosphorIcon(PiAirplaneTiltDuotone),
  warehouse: phosphorIcon(PiWarehouseDuotone),
  map_pin: phosphorIcon(PiMapPinDuotone),
  route: phosphorIcon(PiMapTrifoldDuotone),
  home: phosphorIcon(PiHouseLineDuotone),
  shield: phosphorIcon(PiShieldCheckDuotone),
  check_badge: phosphorIcon(PiCheckCircleDuotone),
  clock: phosphorIcon(PiClockCountdownDuotone),
  calendar: phosphorIcon(PiCalendarBlankDuotone),
  rocket: phosphorIcon(PiRocketLaunchDuotone),
  heart: phosphorIcon(PiHeartDuotone),
  store: phosphorIcon(PiStorefrontDuotone),
  monitor: phosphorIcon(PiMonitorDuotone),
  tag: phosphorIcon(PiTagDuotone),
  sparkles: phosphorIcon(PiSparkleDuotone),
};

const LordiconLayer = ({
  settings,
  icon,
  color,
  size,
  children,
}: {
  settings?: Record<string, unknown>;
  icon?: string;
  color: string;
  size: number;
  children: ReactNode;
}) => {
  const ref = useRef<HTMLElement | null>(null);
  const [ready, setReady] = useState(false);
  const src = safeLordiconUrl(settings, icon);

  useEffect(() => {
    if (!src) return;
    loadLordiconScript();
  }, [src]);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    const handleReady = () => setReady(true);
    node.addEventListener("ready", handleReady);
    return () => node.removeEventListener("ready", handleReady);
  }, [src]);

  if (!src) return <>{children}</>;

  const primary = String(settings?.lordiconPrimaryColor || color || "#3b82f6");
  const secondary = String(settings?.lordiconSecondaryColor || primary);
  const trigger = safeLordiconTrigger(settings?.lordiconTrigger);
  const stroke = safeLordiconStroke(settings?.lordiconStroke);
  const state = cleanLordiconState(settings?.lordiconState);
  const speed = clampNumber(settings?.lordiconSpeed, 1, 0.25, 3);
  const displaySize = clampNumber(settings?.lordiconSize, size, 8, 128);
  const keepStatic = settings?.lordiconKeepStatic === true;

  const lordiconProps: Record<string, unknown> = {
    ref,
    src,
    trigger,
    stroke,
    speed,
    loading: "lazy",
    colors: `primary:${primary},secondary:${secondary}`,
    className: "bp-lordicon",
    style: { width: `${displaySize}px`, height: `${displaySize}px` },
  };
  if (state) lordiconProps.state = state;

  return (
    <span
      className={`bp-icon-stack ${ready ? "bp-lordicon-ready" : ""} ${keepStatic ? "bp-icon-keep-static" : ""}`}
      style={{ width: displaySize, height: displaySize }}
    >
      <span className="bp-icon-static">{children}</span>
      {createElement("lord-icon" as any, lordiconProps)}
    </span>
  );
};

const IconRenderer = ({
  icon,
  color,
  size = 24,
  animation,
}: {
  icon?: string;
  color: string;
  size?: number;
  animation?: Record<string, unknown>;
}) => {
  if (!icon) return null;

  let staticIcon: ReactNode;
  if (icon.startsWith("/icons/") || icon.includes(".png")) {
    const path = icon.startsWith("/") ? icon : `/icons/${icon}`;
    staticIcon = (
      <img
        src={path}
        alt=""
        style={{
          width: size,
          height: size,
          objectFit: "contain",
          filter: icon.includes("colorable") ? `drop-shadow(0 0 0 ${color})` : "none",
        }}
      />
    );
  } else {
    const iconName = icon.startsWith("lucide:") ? icon.replace("lucide:", "").replace(/-/g, "_") : icon;
    const SelectedIcon = IconList[iconName] || IconList["package"];
    staticIcon = <div style={{ color }}><SelectedIcon s={size} /></div>;
  }

  return (
    <LordiconLayer settings={animation} icon={icon} color={color} size={size}>
      {staticIcon}
    </LordiconLayer>
  );
};

const PREVIEW_DATA = {
  orderDate: "Jan 10",
  shipDate: "Jan 12",
  minDate: "Jan 13",
  maxDate: "Jan 15",
  countdown: "02:14:59",
};

export function WidgetPreviewRenderer({ settings }: { settings: WidgetSettingsProps }) {
  const {
    customBlocks, blocks: legacyBlocks, textColor, iconColor, bgColor, borderColor, borderRadius,
    shadow, glassmorphism, padding = 16, bgGradient
  } = settings;

  const blocks =
    customBlocks?.length
      ? customBlocks
      : legacyBlocks?.length
        ? legacyBlocks
        : buildFallbackBlocks(settings);
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
      .replace(/{COUNTRY_FLAG}/g, "VN");
  };

  const blockIconColor = (s: any) => s.iconColor || s.blockIconColor || iconColor;

  const blockWrapperStyle = (s: any) => {
    const style: Record<string, string | number> = {};
    if (s.blockBgColor) style.background = s.blockBgColor;
    if (s.blockTextColor) style.color = s.blockTextColor;
    if (s.blockAlign && s.blockAlign !== "inherit") style.textAlign = s.blockAlign;
    if (s.blockPadding !== undefined) style.padding = `${Number(s.blockPadding) || 0}px`;
    if (s.blockRadius !== undefined) {
      style.borderRadius = `${Number(s.blockRadius) || 0}px`;
      style.overflow = "hidden";
    }
    if (s.blockMarginTop !== undefined) style.marginTop = `${Number(s.blockMarginTop) || 0}px`;
    if (s.blockMarginBottom !== undefined) style.marginBottom = `${Number(s.blockMarginBottom) || 0}px`;
    if (s.blockOpacity !== undefined) style.opacity = Math.min(100, Math.max(20, Number(s.blockOpacity) || 100)) / 100;
    const borderWidth = Number(s.blockBorderWidth || 0);
    if (borderWidth > 0 || s.blockBorderColor) {
      style.border = `${borderWidth || 1}px solid ${s.blockBorderColor || borderColor}`;
    }
    if (s.blockShadow === "soft") style.boxShadow = "var(--bp-shadow-soft)";
    if (s.blockShadow === "deep") style.boxShadow = "var(--bp-shadow-deep)";
    if (s.blockShadow === "glow") style.boxShadow = "var(--bp-shadow-glow)";
    return style;
  };

  const wrapBlock = (block: any, content: any) => {
    if (!content) return null;
    return (
      <div key={block.id} className="bp-block" style={blockWrapperStyle(block.settings) as any}>
        {content}
      </div>
    );
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
        gap: s.gap !== undefined ? `${s.gap}px` : undefined,
        '--bp-size': `${s.iconSize || 24}px`
      } as any}>
        {(s.iconPosition === 'top' || s.iconPosition === 'left') && s.icon && <IconRenderer icon={s.icon} color={s.iconColor || s.blockIconColor || "inherit"} size={s.iconSize || 24} animation={s} />}
        <div style={{ display: 'flex', flexDirection: 'column', gap: s.textGap !== undefined ? `${s.textGap}px` : '2px', textAlign: s.align || 'center' }}>
           <div className="bp-text-label" style={{
             color: s.textColor || undefined,
             fontSize: s.titleFontSize !== undefined ? `${s.titleFontSize}px` : s.fontSize === 'sm' ? '14px' : s.fontSize === 'lg' ? '20px' : 'inherit',
             fontWeight: s.fontWeight || undefined,
           }}>{formatText(s.text)}</div>
           {s.subText && <div className="bp-text-sub" style={{ color: s.subTextColor || undefined, fontSize: s.subTextFontSize !== undefined ? `${s.subTextFontSize}px` : undefined }}>{formatText(s.subText)}</div>}
        </div>
        {(s.iconPosition === 'bottom' || s.iconPosition === 'right') && s.icon && <IconRenderer icon={s.icon} color={s.iconColor || s.blockIconColor || "inherit"} size={s.iconSize || 24} animation={s} />}
      </div>
    );
  };

  const render_steps = (s: any) => {
    const preset = s.preset || 'horizontal';
    const items = normalizeStepItems(s);
    const accent = blockIconColor(s);

    const presetClass = `bp-steps-${preset.replace('_', '-')}`;
    
    return (
      <div key={s.id} className={`bp-steps ${presetClass}`} data-count={items.length} style={{ 
        '--bp-size': `${s.iconSize || 24}px`,
        '--bp-gap': `${s.itemGap || 16}px`,
      } as any}>
        {items.map((item, i) => {
          const isFirst = i === 0;
          const isLast = i === items.length - 1;
          const dotBg = item.dotColor || (isFirst ? accent : '#fff');
          const stepIconColor = item.iconColor || (isFirst ? '#fff' : accent);
          const usesItemSurface = ['boxed_cards', 'boxed_steps', 'split_segments', 'thick', 'chevron'].includes(preset);
          const stepBg = usesItemSurface ? item.bgColor : undefined;
          
          let itemClass = 'bp-timeline-item';
          if (preset === 'vertical') itemClass = 'bp-vertical-item';
          else if (preset === 'boxed_cards' || preset === 'boxed_steps') itemClass = 'bp-card';
          else if (preset === 'split_segments' || preset === 'thick' || preset === 'chevron') itemClass = 'bp-segment';

          const hasItemBorder = (preset === 'boxed_cards' || preset === 'boxed_steps' || preset === 'split_segments');
          const dotBorderColor = usesItemSurface ? (item.borderColor || dotBg) : dotBg;

          return (
            <div key={item.id || i} className={itemClass} style={{
              background: stepBg,
              padding: s.padding !== undefined ? `${s.padding}px` : undefined,
              borderRadius: s.borderRadius !== undefined ? `${s.borderRadius}px` : undefined,
              border: (s.borderWidth && hasItemBorder) ? `${s.borderWidth}px solid ${item.borderColor || (isFirst ? accent : '#eee')}` : undefined
            }}>
              {!isLast && hasTimelineConnector(preset) && <div className="bp-timeline-connector" style={{ borderTopStyle: s.connectorStyle || 'dashed', borderTopColor: accent } as any} />}
              {!isLast && hasVerticalConnector(preset) && <div className="bp-vertical-connector" style={{ borderLeftStyle: s.connectorStyle || 'dashed', borderLeftColor: accent } as any} />}
              
              <div className="bp-timeline-dot" style={{
                background: dotBg,
                borderColor: dotBorderColor,
                borderWidth: s.dotBorderWidth !== undefined ? `${s.dotBorderWidth}px` : undefined,
              }}>
                <IconRenderer icon={item.icon} color={stepIconColor} size={s.iconSize || (preset === 'timeline_dots' ? 16 : 22)} animation={s} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: preset === 'vertical' ? 'left' : 'center' }}>
                <div className="bp-text-label" style={{ color: item.labelColor || undefined, fontSize: s.labelFontSize !== undefined ? `${s.labelFontSize}px` : undefined }}>{formatText(item.label)}</div>
                <div className="bp-text-sub" style={{ color: item.subTextColor || undefined, fontSize: s.subTextFontSize !== undefined ? `${s.subTextFontSize}px` : undefined }}>{formatText(item.subText)}</div>
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
      border: Number(s.borderWidth || 0) > 0 ? `${s.borderWidth}px solid ${s.borderColor || borderColor}` : undefined,
      borderRadius: s.borderRadius !== undefined ? `${s.borderRadius}px` : undefined,
      padding: s.padding !== undefined ? `${s.padding}px ${Math.round(Number(s.padding) * 1.2)}px` : undefined,
      fontSize: s.fontSize !== undefined ? `${s.fontSize}px` : undefined,
      gap: s.gap !== undefined ? `${s.gap}px` : undefined,
      '--bp-ic': s.color || s.blockIconColor || iconColor
    } as any}>
      <div className="bp-timer-dot" style={{
        width: s.dotSize !== undefined ? `${s.dotSize}px` : undefined,
        height: s.dotSize !== undefined ? `${s.dotSize}px` : undefined,
        flexBasis: s.dotSize !== undefined ? `${s.dotSize}px` : undefined,
      }} />
      <div className="bp-text-label" style={{ fontWeight: s.fontWeight || '500' }}>
        {formatText(s.text ?? s.timerFormat ?? "Order in {countdown}")}
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
        backgroundColor: s.bgColor || (s.styleType === 'outline' ? 'transparent' : bg),
        borderColor: s.borderColor || bc,
        borderWidth: s.borderWidth !== undefined ? `${s.borderWidth}px` : undefined,
        borderRadius: s.borderRadius !== undefined ? `${s.borderRadius}px` : undefined,
        padding: s.padding !== undefined ? `${s.padding}px ${Math.round(Number(s.padding) * 1.33)}px` : undefined,
        gap: s.gap !== undefined ? `${s.gap}px` : undefined,
        fontSize: s.fontSize !== undefined ? `${s.fontSize}px` : undefined,
        fontWeight: s.fontWeight || undefined,
        textAlign: s.align || 'left',
        color: s.textColor || 'inherit'
      }}>
        {s.icon && <IconRenderer icon={s.icon} color={blockIconColor(s)} size={s.iconSize || 20} animation={s} />}
        <div style={{ flex: 1 }}>{formatText(s.text)}</div>
      </div>
    );
  };

  const render_promise_card = (s: any) => {
    const tone = ["success", "info", "warning", "premium"].includes(s.tone) ? s.tone : "success";

    return (
      <div
        key={s.id}
        className={`bp-promise-card bp-promise-${tone}`}
        style={{
          background: s.bgColor || undefined,
          borderColor: s.borderColor || undefined,
          color: s.textColor || undefined,
          textAlign: s.align || "left",
          padding: s.padding !== undefined ? `${s.padding}px` : undefined,
          borderRadius: s.borderRadius !== undefined ? `${s.borderRadius}px` : undefined,
          borderWidth: s.borderWidth !== undefined ? `${s.borderWidth}px` : undefined,
          gap: s.gap !== undefined ? `${s.gap}px` : undefined,
        }}
      >
        <div className="bp-promise-icon" style={{
          background: s.iconBgColor || undefined,
          width: s.iconBoxSize !== undefined ? `${s.iconBoxSize}px` : undefined,
          height: s.iconBoxSize !== undefined ? `${s.iconBoxSize}px` : undefined,
          flexBasis: s.iconBoxSize !== undefined ? `${s.iconBoxSize}px` : undefined,
          borderRadius: s.iconBoxRadius !== undefined ? `${s.iconBoxRadius}px` : undefined,
        }}>
          <IconRenderer icon={s.icon || "truck"} color={blockIconColor(s)} size={s.iconSize || 24} animation={s} />
        </div>
        <div className="bp-promise-body">
          <div className="bp-text-label" style={{ color: s.titleColor || s.textColor || undefined, fontSize: s.titleFontSize !== undefined ? `${s.titleFontSize}px` : undefined }}>{formatText(s.title || "Get it by {max_date}")}</div>
          {s.subtitle && <div className="bp-text-sub" style={{ color: s.subtitleColor || undefined, fontSize: s.subtitleFontSize !== undefined ? `${s.subtitleFontSize}px` : undefined }}>{formatText(s.subtitle)}</div>}
        </div>
        {s.badgeText && <div className="bp-promise-badge" style={{
          background: s.badgeBgColor || undefined,
          color: s.badgeTextColor || undefined,
          fontSize: s.badgeFontSize !== undefined ? `${s.badgeFontSize}px` : undefined,
          borderRadius: s.badgeRadius !== undefined ? `${s.badgeRadius}px` : undefined,
        }}>{formatText(s.badgeText)}</div>}
      </div>
    );
  };

  const render_policy_accordion = (s: any) => (
    <div key={s.id} className="bp-policy-list" style={{ gap: s.itemGap !== undefined ? `${s.itemGap}px` : undefined }}>
      {normalizePolicyItems(s).map((item, index) => (
        <details key={item.id} className="bp-policy-item" open={s.openFirst !== false && index === 0} style={{
          background: item.bgColor || undefined,
          borderColor: item.borderColor || undefined,
          borderWidth: s.borderWidth !== undefined ? `${s.borderWidth}px` : undefined,
          borderRadius: s.itemRadius !== undefined ? `${s.itemRadius}px` : undefined,
        }}>
          <summary className="bp-policy-summary" style={{ padding: s.itemPadding !== undefined ? `${s.itemPadding}px ${s.itemPadding + 2}px` : undefined }}>
            <IconRenderer icon={item.icon || "shield"} color={item.iconColor || blockIconColor(s)} size={s.iconSize || 18} animation={s} />
            <span style={{ color: item.titleColor || undefined, fontSize: s.titleFontSize !== undefined ? `${s.titleFontSize}px` : undefined }}>{formatText(item.title)}</span>
          </summary>
          <div className="bp-policy-body" style={{ color: item.bodyColor || undefined, fontSize: s.bodyFontSize !== undefined ? `${s.bodyFontSize}px` : undefined }}>{formatText(item.body)}</div>
        </details>
      ))}
    </div>
  );

  const render_custom_block = (block: any) => {
    let content = null;
    switch (block.type) {
      case 'header': content = render_header(block.settings); break;
      case 'steps': content = render_steps(block.settings); break;
      case 'promise_card': content = render_promise_card(block.settings); break;
      case 'timer': content = render_timer(block.settings); break;
      case 'banner': content = render_banner(block.settings); break;
      case 'policy_accordion': content = render_policy_accordion(block.settings); break;
      case 'dual_info': content = (
        <div key={block.id} className="bp-dual-info" style={{ gap: block.settings.columnGap !== undefined ? `${block.settings.columnGap}px` : undefined }}>
          <div className="bp-dual-card" style={{
            background: block.settings.leftBgColor || undefined,
            borderColor: block.settings.leftBorderColor || undefined,
            borderWidth: block.settings.borderWidth !== undefined ? `${block.settings.borderWidth}px` : undefined,
            borderRadius: block.settings.cardRadius !== undefined ? `${block.settings.cardRadius}px` : undefined,
            padding: block.settings.cardPadding !== undefined ? `${block.settings.cardPadding}px` : undefined,
            gap: block.settings.cardGap !== undefined ? `${block.settings.cardGap}px` : undefined,
          }}>
            <IconRenderer icon={block.settings.leftIcon || "monitor"} color={block.settings.leftIconColor || blockIconColor(block.settings)} size={block.settings.iconSize || 28} animation={block.settings} />
            <div className="bp-text-label" style={{ color: block.settings.leftTitleColor || undefined, fontSize: block.settings.titleFontSize !== undefined ? `${block.settings.titleFontSize}px` : undefined }}>{formatText(block.settings.leftTitle || "Online")}</div>
            <div className="bp-text-sub" style={{ color: block.settings.leftTextColor || undefined, fontSize: block.settings.textFontSize !== undefined ? `${block.settings.textFontSize}px` : undefined }}>{formatText(block.settings.leftText)}</div>
          </div>
          <div className="bp-dual-card" style={{
            background: block.settings.rightBgColor || undefined,
            borderColor: block.settings.rightBorderColor || undefined,
            borderWidth: block.settings.borderWidth !== undefined ? `${block.settings.borderWidth}px` : undefined,
            borderRadius: block.settings.cardRadius !== undefined ? `${block.settings.cardRadius}px` : undefined,
            padding: block.settings.cardPadding !== undefined ? `${block.settings.cardPadding}px` : undefined,
            gap: block.settings.cardGap !== undefined ? `${block.settings.cardGap}px` : undefined,
          }}>
            <IconRenderer icon={block.settings.rightIcon || "store"} color={block.settings.rightIconColor || blockIconColor(block.settings)} size={block.settings.iconSize || 28} animation={block.settings} />
            <div className="bp-text-label" style={{ color: block.settings.rightTitleColor || undefined, fontSize: block.settings.titleFontSize !== undefined ? `${block.settings.titleFontSize}px` : undefined }}>{formatText(block.settings.rightTitle || "In Store")}</div>
            <div className="bp-text-sub" style={{ color: block.settings.rightTextColor || undefined, fontSize: block.settings.textFontSize !== undefined ? `${block.settings.textFontSize}px` : undefined }}>{formatText(block.settings.rightText)}</div>
          </div>
        </div>
      ); break;
      case 'divider': content = <div key={block.id} style={{ height: block.settings.height || 1, background: block.settings.color || borderColor, margin: '8px 0' }} />; break;
      case 'spacer': content = <div key={block.id} style={{ height: block.settings.height || 16 }} />; break;
      case 'progress': content = (
        <div key={block.id} style={{ padding: '8px 0' }}>
          <div className="bp-text-label" style={{ marginBottom: '6px', color: block.settings.labelColor || undefined, fontSize: block.settings.labelFontSize !== undefined ? `${block.settings.labelFontSize}px` : undefined }}>{formatText(block.settings.label)}</div>
          <div className="bp-progress-bar" style={{
            background: block.settings.trackColor || undefined,
            border: (block.settings.trackBorderWidth || block.settings.trackBorderColor) ? `${block.settings.trackBorderWidth || 1}px solid ${block.settings.trackBorderColor || borderColor}` : undefined,
            height: block.settings.height !== undefined ? `${block.settings.height}px` : undefined,
            borderRadius: block.settings.radius !== undefined ? `${block.settings.radius}px` : undefined,
          }}>
            <div className="bp-progress-fill" style={{
              width: `${block.settings.percentage || 75}%`,
              background: block.settings.fillStyle === 'gradient'
                ? `linear-gradient(90deg, ${block.settings.color || iconColor}, ${block.settings.gradientEndColor || '#818cf8'})`
                : block.settings.color || block.settings.blockIconColor || iconColor,
              borderRadius: block.settings.radius !== undefined ? `${block.settings.radius}px` : undefined,
            }} />
          </div>
        </div>
      ); break;
      case 'trust_badges': content = (
        <div key={block.id} className="bp-trust-row" style={{ gap: block.settings.rowGap !== undefined ? `${block.settings.rowGap}px` : undefined }}>
          {normalizeTrustBadges(block.settings).map((badge) => (
            <div key={badge.id} className="bp-trust-item" title={badge.label || badge.icon} style={{
              background: badge.bgColor || undefined,
              border: badge.borderColor ? `1px solid ${badge.borderColor}` : undefined,
              padding: block.settings.itemPadding !== undefined ? `${block.settings.itemPadding}px ${Math.round(Number(block.settings.itemPadding) * 1.25)}px` : undefined,
              borderRadius: block.settings.itemRadius !== undefined ? `${block.settings.itemRadius}px` : undefined,
              gap: block.settings.itemGap !== undefined ? `${block.settings.itemGap}px` : undefined,
            }}>
              <IconRenderer icon={badge.icon} color={badge.iconColor || blockIconColor(block.settings)} size={block.settings.iconSize || 24} animation={block.settings} />
              {(badge.label || badge.subText) && (
                <span className="bp-trust-copy">
                  {badge.label && <span className="bp-text-label" style={{ color: badge.labelColor || undefined, fontSize: block.settings.labelFontSize !== undefined ? `${block.settings.labelFontSize}px` : undefined }}>{formatText(badge.label)}</span>}
                  {badge.subText && <span className="bp-text-sub" style={{ color: badge.subTextColor || undefined, fontSize: block.settings.subTextFontSize !== undefined ? `${block.settings.subTextFontSize}px` : undefined }}>{formatText(badge.subText)}</span>}
                </span>
              )}
            </div>
          ))}
        </div>
      ); break;
      case 'image': content = block.settings.url ? (
        <div key={block.id} style={{ textAlign: block.settings.align || "center" }}>
          <img
            src={String(block.settings.url)}
            alt=""
            style={{
              display: "inline-block",
              maxWidth: "100%",
              width: String(block.settings.width || "auto"),
              height: String(block.settings.height || "auto"),
              objectFit: block.settings.objectFit || "contain",
              borderRadius: block.settings.borderRadius !== undefined ? `${block.settings.borderRadius}px` : undefined,
              border: block.settings.borderWidth ? `${block.settings.borderWidth}px solid ${block.settings.borderColor || borderColor}` : undefined,
              opacity: block.settings.opacity !== undefined ? Number(block.settings.opacity) / 100 : undefined,
            }}
          />
        </div>
      ) : null; break;
      case 'html': content = (
        <pre key={block.id} className="bp-text-sub" style={{ whiteSpace: "pre-wrap", margin: 0 }}>
          {String(block.settings.code || "")}
        </pre>
      ); break;
      default: content = null;
    }
    return wrapBlock(block, content);
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
