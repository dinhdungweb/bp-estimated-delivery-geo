import {
  buildFallbackBlocks,
  DEFAULT_LOCATION_PREFIX_TEXT,
  normalizeLocationPrefixText,
  normalizeLocationRowAlignment,
  normalizePolicyItems,
  normalizeStepItems,
  normalizeTrustBadges,
} from "../lib/delivery";
import {
  LORDICON_HOVER_STATES,
  LORDICON_INTRO_STATES,
  LORDICON_LOOP_STATES,
  LORDICON_PRESETS,
  LORDICON_STATES_BY_FILE,
  LORDICON_URL_PATTERN,
  getAnimatedIconFileKey,
} from "../lib/lordiconPresets";
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
import { createElement, useEffect } from "react";
import type { ReactElement, ReactNode } from "react";

export type {
  BlockConfig,
  BlockType,
  WidgetSettingsProps,
  WidgetStyleId,
} from "../lib/delivery";

const hasTimelineConnector = (preset: string) => preset === "timeline_dots";
const hasVerticalConnector = (preset: string) => preset === "vertical";

const resolveOrnamentSrc = (value: unknown) => {
  const raw = String(value || "");
  return raw.replace(/^\/ornaments\/(.+)\.png$/i, "/ornaments/$1.svg");
};

const hexLuminance = (color?: string) => {
  const value = color?.trim();
  if (!value || !/^#[0-9a-f]{3,8}$/i.test(value)) return null;
  const hex = value.slice(1);
  const fullHex = hex.length === 3
    ? hex.split("").map((char) => `${char}${char}`).join("")
    : hex.slice(0, 6);
  if (fullHex.length !== 6) return null;
  const channels = [0, 2, 4].map((offset) => parseInt(fullHex.slice(offset, offset + 2), 16) / 255);
  const linear = channels.map((channel) =>
    channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
};

const isDarkHex = (color?: string) => {
  const luminance = hexLuminance(color);
  return luminance !== null && luminance < 0.35;
};

const scaledPx = (value: unknown, fallback?: number) => {
  const raw = value === undefined || value === null || value === "" ? fallback : value;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return undefined;
  return `calc(${parsed}px * var(--bp-ui-scale, 1))`;
};

const scaledPairPx = (vertical: unknown, horizontal: unknown) => {
  const y = scaledPx(vertical);
  const x = scaledPx(horizontal);
  return y && x ? `${y} ${x}` : undefined;
};

const scaledCssSize = (value: unknown, fallback?: string) => {
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? scaledPx(parsed) : String(value);
};

const LORDICON_SCRIPT_ID = "bp-lordicon-player";
const LORDICON_SCRIPT_SRC = "https://cdn.lordicon.com/lordicon.js";
const LORDICON_TRIGGER_VALUES = new Set(["in", "click", "hover", "loop", "loop-on-hover", "boomerang", "morph", "sequence"]);
const LORDICON_STROKE_VALUES = new Set(["light", "regular", "bold"]);

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

const animatedIconUrl = (icon?: string) => {
  const fileKey = getAnimatedIconFileKey(icon);
  return fileKey && LORDICON_STATES_BY_FILE[fileKey] ? `/icons/animated/${fileKey}.json` : "";
};

const safeLordiconUrl = (settings: Record<string, unknown> = {}, icon?: string) => {
  const directAnimatedIcon = animatedIconUrl(icon);
  if (directAnimatedIcon) return directAnimatedIcon;

  if (settings.iconAnimation !== "lordicon") return "";
  const preset = String(settings.lordiconPreset || "auto");
  if (preset === "custom") {
    const customUrl = String(settings.lordiconUrl || "").trim();
    return LORDICON_URL_PATTERN.test(customUrl) ? customUrl : "";
  }
  if (preset !== "auto" && LORDICON_PRESETS[preset]) return LORDICON_PRESETS[preset];
  const normalizedIcon = String(icon || "").replace(/^lucide:/, "").replace(/-/g, "_");
  return LORDICON_PRESETS[normalizedIcon] || "";
};

const safeLordiconStateForTrigger = (
  settings: Record<string, unknown> = {},
  icon: string | undefined,
  trigger: string,
) => {
  const explicitState = cleanLordiconState(settings.lordiconState);
  if (explicitState) return explicitState;

  const stateType = trigger === "in" ? "intro" : trigger === "loop" ? "loop" : "hover";
  const animatedFileKey = getAnimatedIconFileKey(icon);
  if (animatedFileKey) {
    const states = LORDICON_STATES_BY_FILE[animatedFileKey];
    return states?.[stateType] || states?.hover || "";
  }

  const preset = String(settings.lordiconPreset || "auto");

  if (preset === "custom") {
    const customUrl = String(settings.lordiconUrl || "").trim();
    const localMatch = /^\/icons\/animated\/([a-z0-9-]+)\.json$/i.exec(customUrl);
    const states = localMatch ? LORDICON_STATES_BY_FILE[localMatch[1]] : undefined;
    return states?.[stateType] || states?.hover || "";
  }

  const normalizedIcon = preset !== "auto"
    ? preset
    : String(icon || "").replace(/^lucide:/, "").replace(/-/g, "_");

  if (stateType === "intro") return LORDICON_INTRO_STATES[normalizedIcon] || "";
  if (stateType === "loop") return LORDICON_LOOP_STATES[normalizedIcon] || LORDICON_HOVER_STATES[normalizedIcon] || "";
  return LORDICON_HOVER_STATES[normalizedIcon] || "";
};

const safeLordiconTrigger = (value: unknown) => {
  const trigger = String(value || "loop");
  if (trigger === "loop-on-hover") return "loop";
  return LORDICON_TRIGGER_VALUES.has(trigger) ? trigger : "loop";
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
  const src = safeLordiconUrl(settings, icon);

  useEffect(() => {
    if (!src) return;
    loadLordiconScript();
  }, [src]);

  if (!src) return <>{children}</>;

  const primary = String(settings?.lordiconPrimaryColor || color || "#111827");
  const secondary = String(settings?.lordiconSecondaryColor || primary);
  const trigger = safeLordiconTrigger(settings?.lordiconTrigger);
  const stroke = safeLordiconStroke(settings?.lordiconStroke);
  const state = safeLordiconStateForTrigger(settings, icon, trigger);
  const speed = clampNumber(settings?.lordiconSpeed, 1, 0.25, 3);
  const displaySize = clampNumber(settings?.lordiconSize, size, 8, 128);
  const displaySizeCss = scaledPx(displaySize) || `${displaySize}px`;

  const lordiconProps: Record<string, unknown> = {
    src,
    trigger,
    stroke,
    speed,
    loading: "lazy",
    colors: `primary:${primary},secondary:${secondary}`,
    className: "bp-lordicon",
    style: { width: displaySizeCss, height: displaySizeCss },
  };
  if (state) lordiconProps.state = state;

  return (
    <span
      className="bp-icon-stack"
      style={{ width: displaySizeCss, height: displaySizeCss }}
    >
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
  if (getAnimatedIconFileKey(icon)) {
    staticIcon = <span aria-hidden="true" />;
  } else if (icon.startsWith("/icons/") || icon.includes(".png")) {
    const path = icon.startsWith("/") ? icon : `/icons/${icon}`;
    staticIcon = (
      <img
        src={path}
        alt=""
        style={{
          width: scaledPx(size),
          height: scaledPx(size),
          objectFit: "contain",
          filter: icon.includes("colorable") ? `drop-shadow(0 0 0 ${color})` : "none",
        }}
      />
    );
  } else {
    const iconName = icon.startsWith("lucide:") ? icon.replace("lucide:", "").replace(/-/g, "_") : icon;
    const SelectedIcon = IconList[iconName] || IconList["package"];
    staticIcon = (
      <span className="bp-icon-static" style={{ color, width: scaledPx(size), height: scaledPx(size) }}>
        <SelectedIcon s={size} />
      </span>
    );
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
  countryCode: "US",
  countryName: "United States",
};

export function WidgetPreviewRenderer({ settings }: { settings: WidgetSettingsProps }) {
  const {
    customBlocks, blocks: legacyBlocks, textColor, iconColor, bgColor, borderColor, borderRadius,
    shadow,
    glassmorphism,
    padding = 16,
    bgGradient,
    showLocationSelector = true,
    locationPrefixText = DEFAULT_LOCATION_PREFIX_TEXT,
    showLocationFlag = true,
    locationRowAlignment = "right",
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
      .replace(/{COUNTRY_NAME}/g, PREVIEW_DATA.countryName)
      .replace(/{COUNTRY_FLAG}/g, PREVIEW_DATA.countryCode);
  };

  const renderLocationControl = () => {
    const alignment = normalizeLocationRowAlignment(locationRowAlignment);
    const justifyContent =
      alignment === "left" ? "flex-start" : alignment === "center" ? "center" : "flex-end";
    const prefixText = normalizeLocationPrefixText(locationPrefixText);

    return (
      <div
        className="bp-location-row"
        style={{
          display: "flex",
          justifyContent,
          marginTop: scaledPx(8),
        }}
      >
        <button type="button" className="bp-change-link" aria-label="Preview delivery country">
          {showLocationFlag !== false && (
            <span className="bp-country-flag">
              <img
                className="bp-country-flag-img"
                src={`https://flagcdn.com/${PREVIEW_DATA.countryCode.toLowerCase()}.svg`}
                alt={`${PREVIEW_DATA.countryName} flag`}
                loading="lazy"
              />
            </span>
          )}
          <span className="bp-country-link-text">
            <span className="bp-country-link-prefix">{prefixText}</span>
            <span className="bp-country-link-country">{PREVIEW_DATA.countryName}</span>
          </span>
        </button>
      </div>
    );
  };

  const blockIconColor = (s: any) => s.iconColor || s.blockIconColor || iconColor;

  const blockWrapperStyle = (s: any) => {
    const style: Record<string, string | number> = {};
    if (s.blockBgColor) style.background = s.blockBgColor;
    if (s.blockTextColor) style.color = s.blockTextColor;
    if (s.blockAlign && s.blockAlign !== "inherit") style.textAlign = s.blockAlign;
    if (s.blockPadding !== undefined) style.padding = scaledPx(Number(s.blockPadding) || 0) || "0";
    if (s.blockRadius !== undefined) {
      style.borderRadius = scaledPx(Number(s.blockRadius) || 0) || "0";
      style.overflow = "hidden";
    }
    if (s.blockMarginTop !== undefined) style.marginTop = scaledPx(Number(s.blockMarginTop) || 0) || "0";
    if (s.blockMarginBottom !== undefined) style.marginBottom = scaledPx(Number(s.blockMarginBottom) || 0) || "0";
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

  const ornamentWrapperStyle = (s: any) => {
    const placement = String(s.placement || "top-right");
    const offsetX = scaledPx(Number(s.offsetX ?? 0)) || "0px";
    const offsetY = scaledPx(Number(s.offsetY ?? 0)) || "0px";
    const style: Record<string, string | number> = {
      position: "absolute",
      width: "auto",
      pointerEvents: "none",
      zIndex: Number(s.zIndex ?? 2),
    };

    switch (placement) {
      case "top-left":
        style.left = offsetX;
        style.top = offsetY;
        break;
      case "top-center":
        style.left = "50%";
        style.top = offsetY;
        style.transform = "translateX(-50%)";
        break;
      case "center-left":
        style.left = offsetX;
        style.top = "50%";
        style.transform = "translateY(-50%)";
        break;
      case "center":
        style.left = "50%";
        style.top = "50%";
        style.transform = "translate(-50%, -50%)";
        break;
      case "center-right":
        style.right = offsetX;
        style.top = "50%";
        style.transform = "translateY(-50%)";
        break;
      case "bottom-left":
        style.left = offsetX;
        style.bottom = offsetY;
        break;
      case "bottom-center":
        style.left = "50%";
        style.bottom = offsetY;
        style.transform = "translateX(-50%)";
        break;
      case "bottom-right":
        style.right = offsetX;
        style.bottom = offsetY;
        break;
      default:
        style.right = offsetX;
        style.top = offsetY;
        break;
    }

    return style;
  };

  const render_header = (s: any) => {
    const isBannerType = s.styleType === 'title_banner';
    const hasIcon = Boolean(s.icon);
    const iconPosition = hasIcon && ['top', 'bottom', 'left', 'right'].includes(s.iconPosition)
      ? s.iconPosition
      : 'top';
    const isHorizontal = hasIcon && (iconPosition === 'left' || iconPosition === 'right');
    const mainAxisAlignment = s.align === 'left' ? 'flex-start' : s.align === 'right' ? 'flex-end' : 'center';
    const titleFontSize =
      s.titleFontSize !== undefined
        ? scaledPx(s.titleFontSize)
        : s.fontSize === 'sm'
          ? scaledPx(14)
          : s.fontSize === 'lg'
            ? scaledPx(20)
            : 'inherit';

    return (
      <div key={s.id} className={`bp-header ${isBannerType ? 'bp-header-banner' : ''}`} style={{
        background: isBannerType ? (s.bgColor || '#fde047') : (s.bgColor || 'transparent'),
        border: s.borderWidth ? `${s.borderWidth}px solid ${s.borderColor || borderColor}` : 'none',
        borderRadius: s.borderRadius !== undefined ? scaledPx(s.borderRadius) : (isBannerType ? scaledPx(8) : 0),
        color: isBannerType ? (s.textColor || '#000') : (s.textColor || 'inherit'),
        flexDirection: isHorizontal ? 'row' : 'column',
        alignItems: mainAxisAlignment,
        justifyContent: mainAxisAlignment,
        padding: s.padding !== undefined ? scaledPx(s.padding) : '',
        gap: s.gap !== undefined ? scaledPx(s.gap) : undefined,
        '--bp-size': scaledPx(s.iconSize || 24)
      } as any}>
        {(iconPosition === 'top' || iconPosition === 'left') && s.icon && <IconRenderer icon={s.icon} color={s.iconColor || s.blockIconColor || "inherit"} size={s.iconSize || 24} animation={s} />}
        <div style={{ display: 'flex', flexDirection: 'column', gap: s.textGap !== undefined ? scaledPx(s.textGap) : scaledPx(2), textAlign: s.align || 'center' }}>
           <div className="bp-text-label" style={{
             color: s.textColor || undefined,
             fontSize: titleFontSize,
             fontWeight: s.fontWeight || undefined,
           }}>{formatText(s.text)}</div>
           {s.subText && <div className="bp-text-sub" style={{ color: s.subTextColor || undefined, fontSize: s.subTextFontSize !== undefined ? scaledPx(s.subTextFontSize) : undefined }}>{formatText(s.subText)}</div>}
        </div>
        {(iconPosition === 'bottom' || iconPosition === 'right') && s.icon && <IconRenderer icon={s.icon} color={s.iconColor || s.blockIconColor || "inherit"} size={s.iconSize || 24} animation={s} />}
      </div>
    );
  };

  const render_steps = (s: any) => {
    const preset = s.preset || 'horizontal';
    const items = normalizeStepItems(s);
    const accent = blockIconColor(s);
    const usesDarkSurface = isDarkHex(bgColor) && (!s.bgColor || isDarkHex(s.bgColor));
    const baseStepIconSize = Number(s.iconSize || 24);
    const hasAnimatedStepIcon =
      s.iconAnimation === "lordicon" ||
      items.some((item) => Boolean(getAnimatedIconFileKey(item.icon)));
    const stepDotIconSize =
      hasAnimatedStepIcon && s.lordiconSize !== undefined
        ? Math.max(baseStepIconSize, clampNumber(s.lordiconSize, baseStepIconSize, 8, 128))
        : baseStepIconSize;

    const presetClass = `bp-steps-${preset.replace('_', '-')}`;
    
    return (
      <div key={s.id} className={`bp-steps ${presetClass}`} data-count={items.length} style={{ 
        '--bp-size': scaledPx(stepDotIconSize),
        '--bp-gap': scaledPx(s.itemGap || 16),
        '--bp-item-pad': scaledPx(s.padding || 0),
      } as any}>
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          const dotBg = item.dotColor || accent;
          const dotIsDark = hexLuminance(dotBg) !== null && isDarkHex(dotBg);
          const stepIconColor = item.iconColor || (dotIsDark ? '#fff' : textColor || '#111827');
          const stepIconAnimation = {
            ...s,
            lordiconPrimaryColor: stepIconColor,
            lordiconSecondaryColor: stepIconColor,
          };
          const usesItemSurface = ['boxed_cards', 'boxed_steps', 'split_segments', 'thick', 'chevron'].includes(preset);
          const stepBg = usesItemSurface ? item.bgColor || (usesDarkSurface ? 'rgba(255,255,255,0.06)' : undefined) : undefined;
          
          let itemClass = 'bp-timeline-item';
          if (preset === 'vertical') itemClass = 'bp-vertical-item';
          else if (preset === 'boxed_cards' || preset === 'boxed_steps') itemClass = 'bp-card';
          else if (preset === 'split_segments' || preset === 'thick' || preset === 'chevron') itemClass = 'bp-segment';

          const hasItemBorder = (preset === 'boxed_cards' || preset === 'boxed_steps' || preset === 'split_segments');
          const itemBorderColor = item.borderColor || (usesDarkSurface ? 'rgba(148,163,184,0.35)' : '#eee');
          const dotBorderColor = usesItemSurface ? (item.borderColor || dotBg) : dotBg;

          return (
            <div key={item.id || i} className={itemClass} style={{
              background: stepBg,
              padding: s.padding !== undefined ? scaledPx(s.padding) : undefined,
              borderRadius: s.borderRadius !== undefined ? scaledPx(s.borderRadius) : undefined,
              border: (s.borderWidth && hasItemBorder) ? `${s.borderWidth}px solid ${itemBorderColor}` : undefined
            }}>
              {!isLast && hasTimelineConnector(preset) && <div className="bp-timeline-connector" style={{ borderTopStyle: s.connectorStyle || 'dashed', borderTopColor: accent } as any} />}
              {!isLast && hasVerticalConnector(preset) && <div className="bp-vertical-connector" style={{ borderLeftStyle: s.connectorStyle || 'dashed', borderLeftColor: accent } as any} />}
              
              <div className="bp-timeline-dot" style={{
                background: dotBg,
                borderColor: dotBorderColor,
                borderWidth: s.dotBorderWidth !== undefined ? `${s.dotBorderWidth}px` : undefined,
              }}>
                <IconRenderer icon={item.icon} color={stepIconColor} size={s.iconSize || (preset === 'timeline_dots' ? 16 : 22)} animation={stepIconAnimation} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: scaledPx(2), textAlign: preset === 'vertical' ? 'left' : 'center' }}>
                <div className="bp-text-label" style={{ color: item.labelColor || (usesDarkSurface ? textColor : undefined), fontSize: s.labelFontSize !== undefined ? scaledPx(s.labelFontSize) : undefined }}>{formatText(item.label)}</div>
                <div className="bp-text-sub" style={{ color: item.subTextColor || (usesDarkSurface ? 'rgba(248,250,252,0.68)' : undefined), fontSize: s.subTextFontSize !== undefined ? scaledPx(s.subTextFontSize) : undefined }}>{formatText(item.subText)}</div>
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
      borderRadius: s.borderRadius !== undefined ? scaledPx(s.borderRadius) : undefined,
      padding: s.padding !== undefined ? scaledPairPx(s.padding, Math.round(Number(s.padding) * 1.2)) : undefined,
      fontSize: s.fontSize !== undefined ? scaledPx(s.fontSize) : undefined,
      gap: s.gap !== undefined ? scaledPx(s.gap) : undefined,
      '--bp-ic': s.color || s.blockIconColor || iconColor
    } as any}>
      <div className="bp-timer-dot" style={{
        display: 'block',
        width: s.dotSize !== undefined ? scaledPx(s.dotSize) : undefined,
        height: s.dotSize !== undefined ? scaledPx(s.dotSize) : undefined,
        flexBasis: s.dotSize !== undefined ? scaledPx(s.dotSize) : undefined,
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
        borderRadius: s.borderRadius !== undefined ? scaledPx(s.borderRadius) : undefined,
        padding: s.padding !== undefined ? scaledPairPx(s.padding, Math.round(Number(s.padding) * 1.33)) : undefined,
        gap: s.gap !== undefined ? scaledPx(s.gap) : undefined,
        fontSize: s.fontSize !== undefined ? scaledPx(s.fontSize) : undefined,
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
          padding: s.padding !== undefined ? scaledPx(s.padding) : undefined,
          borderRadius: s.borderRadius !== undefined ? scaledPx(s.borderRadius) : undefined,
          borderWidth: s.borderWidth !== undefined ? `${s.borderWidth}px` : undefined,
          gap: s.gap !== undefined ? scaledPx(s.gap) : undefined,
        }}
      >
        <div className="bp-promise-icon" style={{
          background: s.iconBgColor || undefined,
          width: s.iconBoxSize !== undefined ? scaledPx(s.iconBoxSize) : undefined,
          height: s.iconBoxSize !== undefined ? scaledPx(s.iconBoxSize) : undefined,
          flexBasis: s.iconBoxSize !== undefined ? scaledPx(s.iconBoxSize) : undefined,
          borderRadius: s.iconBoxRadius !== undefined ? scaledPx(s.iconBoxRadius) : undefined,
        }}>
          <IconRenderer icon={s.icon || "truck"} color={blockIconColor(s)} size={s.iconSize || 24} animation={s} />
        </div>
        <div className="bp-promise-body">
          <div className="bp-text-label" style={{ color: s.titleColor || s.textColor || undefined, fontSize: s.titleFontSize !== undefined ? scaledPx(s.titleFontSize) : undefined }}>{formatText(s.title || "Get it by {max_date}")}</div>
          {s.subtitle && <div className="bp-text-sub" style={{ color: s.subtitleColor || undefined, fontSize: s.subtitleFontSize !== undefined ? scaledPx(s.subtitleFontSize) : undefined }}>{formatText(s.subtitle)}</div>}
        </div>
        {s.badgeText && <div className="bp-promise-badge" style={{
          background: s.badgeBgColor || undefined,
          color: s.badgeTextColor || undefined,
          fontSize: s.badgeFontSize !== undefined ? scaledPx(s.badgeFontSize) : undefined,
          borderRadius: s.badgeRadius !== undefined ? scaledPx(s.badgeRadius) : undefined,
        }}>{formatText(s.badgeText)}</div>}
      </div>
    );
  };

  const render_policy_accordion = (s: any) => (
    <div key={s.id} className="bp-policy-list" style={{ gap: s.itemGap !== undefined ? scaledPx(s.itemGap) : undefined }}>
      {normalizePolicyItems(s).map((item, index) => (
        <details key={item.id} className="bp-policy-item" open={s.openFirst !== false && index === 0} style={{
          background: item.bgColor || undefined,
          borderColor: item.borderColor || undefined,
          borderWidth: s.borderWidth !== undefined ? `${s.borderWidth}px` : undefined,
          borderRadius: s.itemRadius !== undefined ? scaledPx(s.itemRadius) : undefined,
        }}>
          <summary className="bp-policy-summary" style={{ padding: s.itemPadding !== undefined ? scaledPairPx(s.itemPadding, Number(s.itemPadding) + 2) : undefined }}>
            <IconRenderer icon={item.icon || "shield"} color={item.iconColor || blockIconColor(s)} size={s.iconSize || 18} animation={s} />
            <span style={{ color: item.titleColor || undefined, fontSize: s.titleFontSize !== undefined ? scaledPx(s.titleFontSize) : undefined }}>{formatText(item.title)}</span>
          </summary>
          <div className="bp-policy-body" style={{ color: item.bodyColor || undefined, fontSize: s.bodyFontSize !== undefined ? scaledPx(s.bodyFontSize) : undefined }}>{formatText(item.body)}</div>
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
        <div key={block.id} className="bp-dual-info" style={{ gap: block.settings.columnGap !== undefined ? scaledPx(block.settings.columnGap) : undefined }}>
          <div className="bp-dual-card" style={{
            background: block.settings.leftBgColor || undefined,
            borderColor: block.settings.leftBorderColor || undefined,
            borderWidth: block.settings.borderWidth !== undefined ? `${block.settings.borderWidth}px` : undefined,
            borderRadius: block.settings.cardRadius !== undefined ? scaledPx(block.settings.cardRadius) : undefined,
            padding: block.settings.cardPadding !== undefined ? scaledPx(block.settings.cardPadding) : undefined,
            gap: block.settings.cardGap !== undefined ? scaledPx(block.settings.cardGap) : undefined,
          }}>
            <IconRenderer icon={block.settings.leftIcon || "monitor"} color={block.settings.leftIconColor || blockIconColor(block.settings)} size={block.settings.iconSize || 28} animation={block.settings} />
            <div className="bp-text-label" style={{ color: block.settings.leftTitleColor || undefined, fontSize: block.settings.titleFontSize !== undefined ? scaledPx(block.settings.titleFontSize) : undefined }}>{formatText(block.settings.leftTitle || "Online")}</div>
            <div className="bp-text-sub" style={{ color: block.settings.leftTextColor || undefined, fontSize: block.settings.textFontSize !== undefined ? scaledPx(block.settings.textFontSize) : undefined }}>{formatText(block.settings.leftText)}</div>
          </div>
          <div className="bp-dual-card" style={{
            background: block.settings.rightBgColor || undefined,
            borderColor: block.settings.rightBorderColor || undefined,
            borderWidth: block.settings.borderWidth !== undefined ? `${block.settings.borderWidth}px` : undefined,
            borderRadius: block.settings.cardRadius !== undefined ? scaledPx(block.settings.cardRadius) : undefined,
            padding: block.settings.cardPadding !== undefined ? scaledPx(block.settings.cardPadding) : undefined,
            gap: block.settings.cardGap !== undefined ? scaledPx(block.settings.cardGap) : undefined,
          }}>
            <IconRenderer icon={block.settings.rightIcon || "store"} color={block.settings.rightIconColor || blockIconColor(block.settings)} size={block.settings.iconSize || 28} animation={block.settings} />
            <div className="bp-text-label" style={{ color: block.settings.rightTitleColor || undefined, fontSize: block.settings.titleFontSize !== undefined ? scaledPx(block.settings.titleFontSize) : undefined }}>{formatText(block.settings.rightTitle || "In Store")}</div>
            <div className="bp-text-sub" style={{ color: block.settings.rightTextColor || undefined, fontSize: block.settings.textFontSize !== undefined ? scaledPx(block.settings.textFontSize) : undefined }}>{formatText(block.settings.rightText)}</div>
          </div>
        </div>
      ); break;
      case 'divider': content = <div key={block.id} className="bp-divider" style={{ display: 'block', height: scaledPx(block.settings.height, 1), background: block.settings.color || borderColor, margin: `${scaledPx(8)} 0` }} />; break;
      case 'spacer': content = <div key={block.id} className="bp-spacer" style={{ display: 'block', height: scaledPx(block.settings.height, 16) }} />; break;
      case 'progress': content = (
        <div key={block.id} style={{ padding: `${scaledPx(8)} 0` }}>
          <div className="bp-text-label" style={{ marginBottom: scaledPx(6), color: block.settings.labelColor || undefined, fontSize: block.settings.labelFontSize !== undefined ? scaledPx(block.settings.labelFontSize) : undefined }}>{formatText(block.settings.label)}</div>
          <div className="bp-progress-bar" style={{
            background: block.settings.trackColor || undefined,
            border: (block.settings.trackBorderWidth || block.settings.trackBorderColor) ? `${block.settings.trackBorderWidth || 1}px solid ${block.settings.trackBorderColor || borderColor}` : undefined,
            height: block.settings.height !== undefined ? scaledPx(block.settings.height) : undefined,
            borderRadius: block.settings.radius !== undefined ? scaledPx(block.settings.radius) : undefined,
          }}>
            <div className="bp-progress-fill" style={{
              width: `${block.settings.percentage || 75}%`,
              background: block.settings.fillStyle === 'gradient'
                ? `linear-gradient(90deg, ${block.settings.color || iconColor}, ${block.settings.gradientEndColor || '#818cf8'})`
                : block.settings.color || block.settings.blockIconColor || iconColor,
              borderRadius: block.settings.radius !== undefined ? scaledPx(block.settings.radius) : undefined,
            }} />
          </div>
        </div>
      ); break;
      case 'trust_badges': content = (
        <div key={block.id} className="bp-trust-row" style={{ gap: block.settings.rowGap !== undefined ? scaledPx(block.settings.rowGap) : undefined }}>
          {normalizeTrustBadges(block.settings).map((badge) => (
            <div key={badge.id} className="bp-trust-item" title={badge.label || badge.icon} style={{
              background: badge.bgColor || undefined,
              border: badge.borderColor ? `1px solid ${badge.borderColor}` : undefined,
              padding: block.settings.itemPadding !== undefined ? scaledPairPx(block.settings.itemPadding, Math.round(Number(block.settings.itemPadding) * 1.25)) : undefined,
              borderRadius: block.settings.itemRadius !== undefined ? scaledPx(block.settings.itemRadius) : undefined,
              gap: block.settings.itemGap !== undefined ? scaledPx(block.settings.itemGap) : undefined,
            }}>
              <IconRenderer icon={badge.icon} color={badge.iconColor || blockIconColor(block.settings)} size={block.settings.iconSize || 24} animation={block.settings} />
              {(badge.label || badge.subText) && (
                <span className="bp-trust-copy">
                  {badge.label && <span className="bp-text-label" style={{ color: badge.labelColor || undefined, fontSize: block.settings.labelFontSize !== undefined ? scaledPx(block.settings.labelFontSize) : undefined }}>{formatText(badge.label)}</span>}
                  {badge.subText && <span className="bp-text-sub" style={{ color: badge.subTextColor || undefined, fontSize: block.settings.subTextFontSize !== undefined ? scaledPx(block.settings.subTextFontSize) : undefined }}>{formatText(badge.subText)}</span>}
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
              width: scaledCssSize(block.settings.width, "auto"),
              height: scaledCssSize(block.settings.height, "auto"),
              objectFit: block.settings.objectFit || "contain",
              borderRadius: block.settings.borderRadius !== undefined ? scaledPx(block.settings.borderRadius) : undefined,
              border: block.settings.borderWidth ? `${block.settings.borderWidth}px solid ${block.settings.borderColor || borderColor}` : undefined,
              opacity: block.settings.opacity !== undefined ? Number(block.settings.opacity) / 100 : undefined,
            }}
          />
        </div>
      ) : null; break;
      case 'ornament': content = block.settings.url ? (
        <div key={block.id} className="bp-ornament" style={ornamentWrapperStyle(block.settings) as any}>
          <img
            src={resolveOrnamentSrc(block.settings.url)}
            alt=""
            style={{
              display: "block",
              width: scaledCssSize(block.settings.width, "72px"),
              height: scaledCssSize(block.settings.height, "auto"),
              objectFit: "contain",
              opacity: block.settings.opacity !== undefined ? Number(block.settings.opacity) / 100 : undefined,
              transform: block.settings.rotation !== undefined ? `rotate(${Number(block.settings.rotation) || 0}deg)` : undefined,
              transformOrigin: "center center",
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
    return block.type === 'ornament' ? content : wrapBlock(block, content);
  };

  return (
    <div className={`bp-widget bp-shadow-${shadow || 'none'} ${glassmorphism ? 'bp-glass' : ''}`} style={{
      '--bp-tc': textColor,
      '--bp-ic': iconColor,
      '--bp-bg': bgColor || '#fff',
      '--bp-bc': borderColor,
      '--bp-rad': scaledPx(borderRadius),
      '--bp-pad': scaledPx(padding),
      background: bgGradient || bgColor || '#fff',
      border: settings.borderWidth ? `${settings.borderWidth}px solid ${settings.borderColor || borderColor}` : 'none'
    } as any}>
      <div className="bp-container">
        {blocks.map(render_custom_block)}
      </div>
      {showLocationSelector !== false && renderLocationControl()}
    </div>
  );
}
