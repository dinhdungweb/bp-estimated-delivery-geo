import type { BlockConfig, WidgetSettingsProps } from "../lib/delivery";
import { ORNAMENT_ASSETS } from "../lib/ornamentAssets";

const ANIMATED_ICON_SETTINGS = {
  lordiconTrigger: "loop",
  lordiconStroke: "regular",
  lordiconSpeed: 1,
  lordiconSize: 28,
} as const;

type Palette = {
  text: string;
  muted: string;
  bg: string;
  surface: string;
  surfaceAlt: string;
  surfaceThird: string;
  border: string;
  borderSoft: string;
  accent: string;
  accent2: string;
  accent3: string;
  onAccent: string;
};

type StepSeed = {
  id?: string;
  label: string;
  subText: string;
  icon: string;
  bgColor?: string;
  dotColor?: string;
  iconColor?: string;
  labelColor?: string;
  subTextColor?: string;
  borderColor?: string;
};

type TrustSeed = {
  id?: string;
  icon: string;
  label: string;
  subText?: string;
  bgColor?: string;
  borderColor?: string;
  iconColor?: string;
  labelColor?: string;
  subTextColor?: string;
};

type PolicySeed = {
  id?: string;
  title: string;
  body: string;
  icon: string;
  bgColor?: string;
  borderColor?: string;
  iconColor?: string;
  titleColor?: string;
  bodyColor?: string;
};

const palette = (
  text: string,
  muted: string,
  bg: string,
  surface: string,
  surfaceAlt: string,
  surfaceThird: string,
  border: string,
  borderSoft: string,
  accent: string,
  accent2: string,
  accent3: string,
  onAccent = "#ffffff",
): Palette => ({
  text,
  muted,
  bg,
  surface,
  surfaceAlt,
  surfaceThird,
  border,
  borderSoft,
  accent,
  accent2,
  accent3,
  onAccent,
});

const block = (
  id: string,
  type: BlockConfig["type"],
  settings: Record<string, unknown>,
): BlockConfig => ({ id, type, settings });

const stepItems = (p: Palette, items: StepSeed[]) => {
  const stepBgColor = p.surfaceAlt || p.surface;
  const stepBorderColor = p.borderSoft || p.border;

  return items.map((item, index) => ({
    id: item.id || `step-${index + 1}`,
    label: item.label,
    subText: item.subText,
    icon: item.icon,
    bgColor: item.bgColor || stepBgColor,
    dotColor: item.dotColor || p.accent,
    iconColor: item.iconColor || p.onAccent,
    labelColor: item.labelColor || p.text,
    subTextColor: item.subTextColor || p.muted,
    borderColor: item.borderColor || stepBorderColor,
  }));
};

const trustBadges = (p: Palette, badges: TrustSeed[]) => {
  const badgeBgColor = p.surfaceAlt || p.surface;
  const badgeBorderColor = p.borderSoft || p.border;

  return badges.map((badge, index) => ({
    id: badge.id || `trust-${index + 1}`,
    icon: badge.icon,
    label: badge.label,
    subText: badge.subText || "",
    bgColor: badge.bgColor || badgeBgColor,
    borderColor: badge.borderColor || badgeBorderColor,
    iconColor: badge.iconColor || p.accent,
    labelColor: badge.labelColor || p.text,
    subTextColor: badge.subTextColor || p.muted,
  }));
};

const policyItems = (p: Palette, items: PolicySeed[]) => {
  const itemBgColor = p.surface;
  const itemBorderColor = p.borderSoft || p.border;

  return items.map((item, index) => ({
    id: item.id || `policy-${index + 1}`,
    title: item.title,
    body: item.body,
    icon: item.icon,
    bgColor: item.bgColor || itemBgColor,
    borderColor: item.borderColor || itemBorderColor,
    iconColor: item.iconColor || p.accent,
    titleColor: item.titleColor || p.text,
    bodyColor: item.bodyColor || p.muted,
  }));
};

const header = (
  id: string,
  p: Palette,
  settings: {
    text: string;
    subText?: string;
    icon?: string;
    align?: "left" | "center" | "right";
    iconPosition?: "top" | "bottom" | "left" | "right";
    bgColor?: string;
    borderColor?: string;
    animated?: boolean;
  } & Record<string, unknown>,
) => {
  const {
    text,
    subText,
    icon,
    iconPosition,
    align,
    bgColor,
    borderColor,
    animated,
    ...overrides
  } = settings;

  return block(id, "header", {
    text,
    subText: subText || "",
    icon: icon === undefined ? "truck" : icon,
    iconPosition: icon ? iconPosition || "left" : "top",
    align: align || "center",
    fontWeight: "700",
    titleFontSize: 15,
    subTextFontSize: 12,
    textGap: 3,
    iconSize: 24,
    padding: 12,
    borderRadius: 14,
    borderWidth: 0,
    textColor: p.text,
    subTextColor: p.muted,
    iconColor: p.accent,
    bgColor: bgColor || p.surface,
    borderColor: borderColor || p.borderSoft,
    ...overrides,
    ...(animated
      ? {
          ...ANIMATED_ICON_SETTINGS,
          lordiconPrimaryColor: p.accent,
          lordiconSecondaryColor: p.accent,
        }
      : {}),
  });
};

const banner = (
  id: string,
  p: Palette,
  text: string,
  icon = "shield",
  type: "info" | "success" | "warning" | "error" = "info",
  settings: Record<string, unknown> = {},
) =>
  block(id, "banner", {
    text,
    icon,
    type,
    styleType: "solid",
    align: "left",
    bgColor: p.surfaceAlt,
    textColor: p.text,
    iconColor: p.accent,
    borderColor: p.borderSoft,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    gap: 10,
    fontSize: 13,
    fontWeight: "600",
    ...settings,
  });

const timer = (
  id: string,
  p: Palette,
  text = "Order in {countdown} for the next dispatch",
  settings: Record<string, unknown> = {},
) =>
  block(id, "timer", {
    text,
    bgColor: p.surfaceAlt,
    color: p.accent,
    textColor: p.text,
    borderColor: p.borderSoft,
    borderWidth: 1,
    borderRadius: 999,
    dotSize: 8,
    padding: 9,
    gap: 9,
    fontSize: 13,
    fontWeight: "700",
    ...settings,
  });

const progress = (
  id: string,
  p: Palette,
  label: string,
  percentage: number,
  settings: Record<string, unknown> = {},
) =>
  block(id, "progress", {
    label,
    percentage,
    fillStyle: "solid",
    labelColor: p.text,
    trackColor: p.surfaceAlt,
    color: p.accent,
    gradientEndColor: p.accent,
    trackBorderColor: p.borderSoft,
    trackBorderWidth: 1,
    labelFontSize: 13,
    height: 8,
    radius: 999,
    ...settings,
  });

const steps = (
  id: string,
  p: Palette,
  preset: "timeline_dots" | "boxed_cards" | "boxed_steps" | "split_segments" | "vertical" | "thick" | "chevron",
  items: StepSeed[],
  settings: Record<string, unknown> = {},
) => {
  const isTimeline = preset === "timeline_dots";
  return block(id, "steps", {
    preset,
    connectorStyle: "solid",
    itemGap: isTimeline ? 10 : 8,
    padding: isTimeline ? 0 : 10,
    borderRadius: isTimeline ? 999 : 12,
    borderWidth: isTimeline ? 0 : 1,
    iconSize: isTimeline ? 17 : 20,
    labelFontSize: 13,
    subTextFontSize: 11,
    dotBorderWidth: 1,
    items: stepItems(p, items),
    ...settings,
  });
};

const promise = (
  id: string,
  p: Palette,
  title: string,
  subtitle: string,
  badgeText: string,
  icon = "truck",
  tone: "success" | "info" | "warning" | "premium" = "info",
  settings: Record<string, unknown> = {},
) =>
  block(id, "promise_card", {
    title,
    subtitle,
    badgeText,
    icon,
    tone,
    align: "left",
    bgColor: p.surface,
    borderColor: p.borderSoft,
    titleColor: p.text,
    subtitleColor: p.muted,
    iconColor: p.onAccent,
    iconBgColor: p.accent,
    badgeBgColor: p.surfaceAlt,
    badgeTextColor: p.accent,
    borderWidth: 1,
    borderRadius: 14,
    padding: 13,
    gap: 12,
    iconSize: 23,
    iconBoxSize: 40,
    iconBoxRadius: 12,
    titleFontSize: 14,
    subtitleFontSize: 12,
    badgeFontSize: 11,
    badgeRadius: 999,
    ...settings,
  });

const trust = (
  id: string,
  p: Palette,
  badges: TrustSeed[],
  settings: Record<string, unknown> = {},
) =>
  block(id, "trust_badges", {
    badges: trustBadges(p, badges),
    rowGap: 8,
    itemPadding: 7,
    itemRadius: 999,
    itemGap: 7,
    iconSize: 17,
    labelFontSize: 12,
    subTextFontSize: 10,
    ...settings,
  });

const policy = (
  id: string,
  p: Palette,
  items: PolicySeed[],
  settings: Record<string, unknown> = {},
) =>
  block(id, "policy_accordion", {
    openFirst: true,
    items: policyItems(p, items),
    itemRadius: 12,
    itemPadding: 10,
    itemGap: 8,
    iconSize: 17,
    titleFontSize: 13,
    bodyFontSize: 12,
    borderWidth: 1,
    ...settings,
  });

const dual = (
  id: string,
  p: Palette,
  left: { title: string; text: string; icon: string },
  right: { title: string; text: string; icon: string },
  settings: Record<string, unknown> = {},
) =>
  block(id, "dual_info", {
    leftTitle: left.title,
    leftText: left.text,
    leftIcon: left.icon,
    leftBgColor: p.surfaceAlt || p.surface,
    leftBorderColor: p.borderSoft,
    leftIconColor: p.accent,
    leftTitleColor: p.text,
    leftTextColor: p.muted,
    rightTitle: right.title,
    rightText: right.text,
    rightIcon: right.icon,
    rightBgColor: p.surfaceAlt || p.surface,
    rightBorderColor: p.borderSoft,
    rightIconColor: p.accent,
    rightTitleColor: p.text,
    rightTextColor: p.muted,
    borderWidth: 1,
    cardRadius: 12,
    cardPadding: 12,
    cardGap: 6,
    columnGap: 8,
    iconSize: 24,
    titleFontSize: 13,
    textFontSize: 11,
    ...settings,
  });

const divider = (id: string, p: Palette) =>
  block(id, "divider", { height: 1, color: p.borderSoft });

const image = (
  id: string,
  url: string,
  settings: Record<string, unknown> = {},
) =>
  block(id, "image", {
    url,
    align: "center",
    width: "100%",
    height: "90px",
    objectFit: "cover",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    opacity: 100,
    ...settings,
  });

const ornament = (
  id: string,
  url: string,
  settings: Record<string, unknown> = {},
) =>
  block(id, "ornament", {
    url,
    placement: "top-right",
    width: "72px",
    height: "auto",
    offsetX: 8,
    offsetY: 8,
    rotation: 0,
    opacity: 100,
    zIndex: 2,
    ...settings,
  });

const journey = (icons: [string, string, string] = ["cart", "package", "home"]): StepSeed[] => [
  { label: "Ordered", subText: "{order_date}", icon: icons[0] },
  { label: "Ships", subText: "{ship_date}", icon: icons[1] },
  { label: "Arrives", subText: "{max_date}", icon: icons[2] },
];

const animatedJourney = (
  icons: [string, string, string] = ["animated:cart", "animated:package-box", "animated:location-pin"],
): StepSeed[] => [
  { label: "Ordered", subText: "{order_date}", icon: icons[0] },
  { label: "Packed", subText: "{ship_date}", icon: icons[1] },
  { label: "Delivered", subText: "{max_date}", icon: icons[2] },
];

const makeTemplate = (
  p: Palette,
  customBlocks: BlockConfig[],
  overrides: Partial<WidgetSettingsProps> = {},
): WidgetSettingsProps => ({
  style: "custom",
  textColor: p.text,
  iconColor: p.accent,
  bgColor: p.bg,
  borderColor: p.border,
  borderRadius: 14,
  padding: 14,
  shadow: "none",
  glassmorphism: false,
  bgGradient: "",
  showTimeline: true,
  ...overrides,
  customBlocks,
});

const P = {
  flash: palette("#3f1212", "#7f1d1d", "#fff8f6", "#ffffff", "#fff1f2", "#fff7ed", "#fecdd3", "#ffe4e6", "#ef4444", "#fb923c", "#991b1b"),
  soft: palette("#0f172a", "#64748b", "#f8fbff", "#ffffff", "#eef6ff", "#ecfeff", "#bfdbfe", "#dbeafe", "#2563eb", "#0891b2", "#0f766e"),
  priority: palette("#2f1e08", "#7c2d12", "#fffaf0", "#ffffff", "#fff7ed", "#fffbeb", "#fed7aa", "#ffedd5", "#f97316", "#d97706", "#0f766e"),
  red: palette("#3f1212", "#8f1d1d", "#fff5f5", "#ffffff", "#fef2f2", "#fff7ed", "#fecaca", "#fee2e2", "#dc2626", "#f97316", "#7f1d1d"),
  yellow: palette("#32240a", "#854d0e", "#fffdf2", "#ffffff", "#fef3c7", "#f7fee7", "#fde68a", "#fef3c7", "#eab308", "#65a30d", "#0f766e", "#111827"),
  fashion: palette("#3b1430", "#85586f", "#fff8fb", "#ffffff", "#fdf2f8", "#fff7ed", "#fbcfe8", "#fce7f3", "#db2777", "#b45309", "#7c3aed"),
  furniture: palette("#1f2a24", "#647067", "#fbfaf7", "#ffffff", "#f1f5ef", "#fff7ed", "#d9e3d6", "#edf3ea", "#2f855a", "#b45309", "#4b5563"),
  electronics: palette("#061b2b", "#475569", "#f5fbff", "#ffffff", "#ecfeff", "#eef2ff", "#bae6fd", "#dbeafe", "#0284c7", "#4f46e5", "#0f172a"),
  beauty: palette("#3b1d4a", "#7e527e", "#fff8fb", "#ffffff", "#fdf2f8", "#f5f3ff", "#fbcfe8", "#ede9fe", "#c026d3", "#e11d48", "#7c3aed"),
  eco: palette("#052e26", "#53746b", "#f6fdf9", "#ffffff", "#ecfdf5", "#f0fdfa", "#bbf7d0", "#d1fae5", "#059669", "#0f766e", "#2563eb"),
  premium: palette("#171717", "#57534e", "#fafaf9", "#ffffff", "#fef3c7", "#f5f5f4", "#d6d3d1", "#e7e5e4", "#fbbf24", "#fbbf24", "#fbbf24", "#111827"),
  process: palette("#111827", "#64748b", "#ffffff", "#ffffff", "#eff6ff", "#f8fafc", "#cbd5e1", "#e2e8f0", "#2563eb", "#0f766e", "#9333ea"),
  darkGold: palette("#f8fafc", "#cbd5e1", "#0f172a", "#111827", "#1e293b", "#2b2115", "#475569", "#334155", "#fbbf24", "#94a3b8", "#f59e0b", "#111827"),
  darkCyan: palette("#e6faff", "#94a3b8", "#06141f", "#0b1f2a", "#102a36", "#0f172a", "#164e63", "#1e3a4a", "#22d3ee", "#818cf8", "#38bdf8", "#06141f"),
  darkRed: palette("#fff1f2", "#fecdd3", "#19090d", "#251016", "#35131d", "#1f1117", "#7f1d1d", "#4c1d24", "#fb7185", "#f97316", "#facc15", "#19090d"),
  light: palette("#111827", "#6b7280", "#ffffff", "#ffffff", "#f9fafb", "#f3f4f6", "#d1d5db", "#e5e7eb", "#111827", "#2563eb", "#0f766e"),
  blue: palette("#0f172a", "#475569", "#f8fbff", "#ffffff", "#eff6ff", "#ecfeff", "#bfdbfe", "#dbeafe", "#2563eb", "#0891b2", "#0f766e"),
  info: palette("#0f172a", "#64748b", "#f8fafc", "#ffffff", "#ecfeff", "#f0fdfa", "#cbd5e1", "#e2e8f0", "#0891b2", "#2563eb", "#16a34a"),
  holiday: palette("#3b0a12", "#7f1d1d", "#fffaf3", "#ffffff", "#fff7ed", "#f0fdf4", "#d7c8a6", "#efe7d5", "#b91c1c", "#5f7f57", "#d6a354"),
  summer: palette("#083344", "#0f766e", "#f6fffb", "#ffffff", "#ecfeff", "#fefce8", "#99f6e4", "#ccfbf1", "#0d9488", "#eab308", "#0284c7"),
  orange: palette("#431407", "#9a3412", "#fffaf5", "#ffffff", "#fff7ed", "#fef3c7", "#fed7aa", "#ffedd5", "#ea580c", "#ca8a04", "#0f766e"),
  green: palette("#052e16", "#4b6355", "#f7fdf9", "#ffffff", "#ecfdf5", "#f0fdfa", "#bbf7d0", "#dcfce7", "#16a34a", "#0f766e", "#2563eb"),
  valentine: palette("#6c1b38", "#9f5670", "#fff7fb", "#ffffff", "#fff1f5", "#fff4f8", "#fecdd9", "#ffe4ec", "#e85d75", "#f59bb2", "#f06292"),
  newYear: palette("#f8edc5", "#d4c48d", "#0d1a45", "#12204f", "#16275c", "#112a65", "#233b7a", "#1a3169", "#d8b45a", "#f0c35c", "#e7d9a2", "#0d1a45"),
  spring: palette("#395c33", "#78906b", "#fffdf8", "#ffffff", "#f8fff2", "#fff7fb", "#dcedc8", "#eef8df", "#7aa85a", "#f4a4be", "#f5c66d"),
  halloween: palette("#4a3f84", "#7d74b1", "#faf7ff", "#ffffff", "#f3eeff", "#fff8f3", "#dcd2ff", "#ece6ff", "#6b5ca5", "#f28c38", "#8b5cf6"),
  gift: palette("#4f6336", "#7d8a65", "#fffdf7", "#ffffff", "#faf8ef", "#f7f4e8", "#dfe6c7", "#efefdc", "#94a35f", "#d5a44b", "#7c8b4e"),
};

const animatedSettings = (p: Palette) => ({
  ...ANIMATED_ICON_SETTINGS,
});

export const TEMPLATE_DEFAULTS: Record<string, WidgetSettingsProps> = {
  animated_flash_sale: makeTemplate(P.flash, [
    timer("afs-timer", P.flash, "Express dispatch closes in {countdown}"),
    banner("afs-banner", P.flash, "Order now for delivery between {min_date} and {max_date}.", "tag", "error"),
    steps("afs-steps", P.flash, "split_segments", animatedJourney(["animated:promo-tag", "animated:express-dispatch", "animated:home-delivery"]), animatedSettings(P.flash)),
    trust("afs-trust", P.flash, [
      { icon: "animated:protected", label: "ETA locked" },
      { icon: "animated:delivery-truck", label: "Fast lane" },
    ], animatedSettings(P.flash)),
  ]),

  animated_soft_pulse: makeTemplate(P.soft, [
    header("asp-head", P.soft, {
      text: "Calm delivery estimate",
      subText: "A clear window with live movement cues.",
      icon: "animated:delivery-truck",
      animated: true,
    }),
    progress("asp-progress", P.soft, "Route confidence", 64),
    steps("asp-steps", P.soft, "timeline_dots", animatedJourney(), {
      ...animatedSettings(P.soft),
      connectorStyle: "solid",
      itemGap: 12,
    }),
    trust("asp-trust", P.soft, [
      { icon: "animated:protected", label: "Tracked" },
      { icon: "animated:location-pin", label: "{COUNTRY_NAME}" },
    ], animatedSettings(P.soft)),
  ]),

  animated_countdown_priority: makeTemplate(P.priority, [
    timer("acp-timer", P.priority, "Priority window closes in {countdown}"),
    progress("acp-progress", P.priority, "Dispatch queue", 82),
    steps("acp-steps", P.priority, "split_segments", animatedJourney(["animated:cutoff-timer", "animated:package-box", "animated:delivery-truck"]), animatedSettings(P.priority)),
    trust("acp-trust", P.priority, [
      { icon: "animated:protected", label: "Protected" },
      { icon: "animated:location-pin", label: "Localized" },
    ], animatedSettings(P.priority)),
  ]),

  urgent_pulse: makeTemplate(P.red, [
    timer("up-timer", P.red, "Order in {countdown} to keep this delivery window"),
    steps("up-steps", P.red, "timeline_dots", animatedJourney(["animated:cart", "animated:express-dispatch", "animated:location-pin"]), {
      ...animatedSettings(P.red),
      connectorStyle: "dashed",
    }),
    banner("up-banner", P.red, "Estimated delivery {min_date} - {max_date}.", "clock", "warning"),
  ]),

  red_moment_meter: makeTemplate(P.red, [
    header("rmm-head", P.red, {
      text: "Moment meter",
      subText: "Time-sensitive dispatch for today's orders.",
      icon: "animated:cutoff-timer",
      align: "center",
      iconPosition: "top",
      animated: true,
    }),
    progress("rmm-progress", P.red, "Cutoff progress", 74),
    steps("rmm-steps", P.red, "timeline_dots", animatedJourney(["animated:online-order", "animated:delivery-truck", "animated:home-delivery"]), animatedSettings(P.red)),
  ]),

  yellow_progress: makeTemplate(P.yellow, [
    banner("yp-banner", P.yellow, "Bright delivery tracking for high-visibility product pages.", "calendar", "warning"),
    progress("yp-progress", P.yellow, "Packing progress", 68),
    steps("yp-steps", P.yellow, "split_segments", journey(["cart", "package", "map_pin"])),
  ]),

  fashion_boutique_eta: makeTemplate(P.fashion, [
    header("fbe-head", P.fashion, {
      text: "Boutique delivery",
      subText: "Prepared with care and delivered between {min_date} and {max_date}.",
      icon: "bag",
      iconPosition: "top",
      align: "center",
      styleType: "title_banner",
      bgColor: "#fff1f6",
      borderColor: "#fbcfe8",
      textColor: "#831843",
      subTextColor: "#85586f",
      iconColor: "#db2777",
      titleFontSize: 22,
      subTextFontSize: 12,
      fontWeight: "900",
      padding: 16,
      borderRadius: 16,
    }),
    image("fbe-image", "/fashion-sample.png", {
      height: "96px",
      borderColor: P.fashion.borderSoft,
    }),
    promise("fbe-promise", P.fashion, "Styled, packed, and on the way", "Ships by {ship_date} with boutique handling.", "Boutique care", "sparkles", "premium"),
    steps("fbe-steps", P.fashion, "boxed_cards", journey(["bag", "package", "home"])),
  ], { bgColor: "#fff8fb", borderColor: "#fbcfe8", shadow: "sm" }),

  furniture_room_delivery: makeTemplate(P.furniture, [
    promise("frd-promise", P.furniture, "Room-ready delivery estimate", "Large-item handling scheduled for arrival by {max_date}.", "Home ready", "home", "success"),
    dual("frd-dual", P.furniture,
      { title: "Warehouse prep", text: "Checked and packed by {ship_date}.", icon: "warehouse" },
      { title: "Carrier window", text: "Delivery estimate {min_date} - {max_date}.", icon: "truck" },
    ),
    steps("frd-steps", P.furniture, "split_segments", journey(["cart", "warehouse", "home"])),
  ]),

  electronics_express_lane: makeTemplate(P.electronics, [
    header("eel-head", P.electronics, {
      text: "Tech express lane",
      subText: "Fast dispatch with secure electronic tracking.",
      icon: "monitor",
      iconPosition: "left",
      align: "left",
      styleType: "title_banner",
      bgColor: "#061b2b",
      borderColor: "#123b56",
      textColor: "#ffffff",
      subTextColor: "#bae6fd",
      iconColor: "#0284c7",
      titleFontSize: 19,
      subTextFontSize: 12,
      padding: 14,
      borderRadius: 12,
      gap: 12,
    }),
    progress("eel-progress", P.electronics, "Carrier sync", 72, {
      fillStyle: "gradient",
      color: "#0284c7",
      gradientEndColor: "#0284c7",
      trackColor: "#e0f2fe",
    }),
    steps("eel-steps", P.electronics, "thick", journey(["monitor", "package", "truck"]), {
      iconSize: 24,
      padding: 12,
      borderRadius: 12,
    }),
    trust("eel-trust", P.electronics, [
      { icon: "shield", label: "Secure pack", bgColor: "#ecfeff", iconColor: "#0284c7" },
      { icon: "check_badge", label: "Verified ETA", bgColor: "#ecfeff", iconColor: "#0284c7" },
    ]),
  ], { bgColor: "#f5fbff", borderColor: "#bae6fd", shadow: "sm" }),

  beauty_care_delivery: makeTemplate(P.beauty, [
    header("bcd-head", P.beauty, {
      text: "Beauty care delivery",
      subText: "Packed gently and delivered between {min_date} and {max_date}.",
      icon: "heart",
    }),
    promise("bcd-promise", P.beauty, "Careful packing included", "Your order is prepared by {ship_date}.", "Care pack", "heart", "premium"),
    steps("bcd-steps", P.beauty, "boxed_cards", journey(["bag", "sparkles", "home"])),
    trust("bcd-trust", P.beauty, [
      { icon: "shield", label: "Protected" },
      { icon: "truck", label: "Tracked" },
    ]),
  ]),

  eco_delivery: makeTemplate(P.eco, [
    header("eco-head", P.eco, {
      text: "Eco-conscious delivery",
      subText: "A cleaner delivery promise for {COUNTRY_NAME}.",
      icon: "map_pin",
    }),
    steps("eco-steps", P.eco, "split_segments", journey(["cart", "package", "home"])),
    trust("eco-trust", P.eco, [
      { icon: "check_badge", label: "Efficient route" },
      { icon: "shield", label: "Clear ETA" },
    ]),
  ]),

  process_compact_tracker: makeTemplate(P.process, [
    header("pct-head", P.process, {
      text: "Delivery timeline",
      subText: "Compact order status for product pages.",
      icon: "truck",
      iconPosition: "top",
    }),
    steps("pct-steps", P.process, "timeline_dots", journey(["cart", "package", "map_pin"]), {
      itemGap: 8,
      labelFontSize: 12,
      subTextFontSize: 10,
    }),
    divider("pct-divider", P.process),
  ], { padding: 12 }),

  process_vertical_story: makeTemplate(P.process, [
    header("pvs-head", P.process, {
      text: "Order journey",
      subText: "Every step from checkout to doorstep.",
      icon: "route",
      iconPosition: "top",
    }),
    steps("pvs-steps", P.process, "vertical", [
      { label: "Order received", subText: "Confirmed on {order_date}", icon: "cart" },
      { label: "Packing started", subText: "Ready by {ship_date}", icon: "package" },
      { label: "Out for delivery", subText: "Expected {min_date} - {max_date}", icon: "truck" },
    ], { itemGap: 12, padding: 10 }),
    banner("pvs-banner", P.process, "Dates update automatically by delivery rule.", "calendar", "info"),
  ]),

  simple_timeline: makeTemplate(P.light, [
    header("st-head", P.light, {
      text: "Estimated delivery",
      subText: "{min_date} - {max_date}",
      icon: "calendar",
      align: "center",
      iconPosition: "top",
    }),
    steps("st-steps", P.light, "timeline_dots", journey(["cart", "truck", "home"])),
  ]),

  boxed_cards_blue: makeTemplate(P.blue, [
    header("bcb-head", P.blue, {
      text: "Delivery dates at a glance",
      subText: "A structured three-step order flow.",
      icon: "truck",
      iconPosition: "top",
    }),
    steps("bcb-steps", P.blue, "boxed_cards", journey(["cart", "package", "map_pin"])),
    trust("bcb-trust", P.blue, [
      { icon: "check_badge", label: "Clear dates" },
      { icon: "shield", label: "Tracked" },
    ]),
  ]),

  dual_cards: makeTemplate(P.process, [
    header("dc-head", P.process, {
      text: "Delivery options",
      subText: "Online dispatch and store-ready context.",
      icon: "store",
      iconPosition: "top",
    }),
    dual("dc-dual", P.process,
      { title: "Online order", text: "Ships by {ship_date}.", icon: "monitor" },
      { title: "Store promise", text: "Delivery estimate {min_date} - {max_date}.", icon: "store" },
    ),
    steps("dc-steps", P.process, "timeline_dots", journey(["cart", "truck", "home"])),
  ]),

  process_split_fulfillment: makeTemplate(P.eco, [
    header("psf-head", P.eco, {
      text: "Fulfillment timeline",
      subText: "Warehouse and carrier milestones in one view.",
      icon: "route",
      iconPosition: "top",
    }),
    dual("psf-dual", P.eco,
      { title: "Warehouse", text: "Ready to ship on {ship_date}.", icon: "warehouse" },
      { title: "Carrier", text: "Arrival window {min_date} - {max_date}.", icon: "truck" },
    ),
    progress("psf-progress", P.eco, "Fulfillment confidence", 68),
    steps("psf-steps", P.eco, "thick", journey(["cart", "package", "map_pin"])),
  ]),

  dark_luxury_tracker: makeTemplate(P.darkGold, [
    promise("dlt-promise", P.darkGold, "Luxury delivery tracking", "Premium handling with arrival by {max_date}.", "Priority", "sparkles", "premium"),
    steps("dlt-steps", P.darkGold, "boxed_cards", journey(["bag", "shield", "home"])),
    trust("dlt-trust", P.darkGold, [
      { icon: "shield", label: "Insured" },
      { icon: "check_badge", label: "Signature ready" },
    ]),
  ]),

  dark_neon_route: makeTemplate(P.darkCyan, [
    timer("dnr-timer", P.darkCyan, "Route window updates in {countdown}"),
    progress("dnr-progress", P.darkCyan, "Carrier route sync", 76),
    steps("dnr-steps", P.darkCyan, "timeline_dots", journey(["monitor", "rocket", "map_pin"])),
    banner("dnr-banner", P.darkCyan, "Live delivery estimate for {COUNTRY_NAME}.", "route", "info"),
  ]),

  dark_glassmorphism: makeTemplate(P.darkCyan, [
    header("dg-head", P.darkCyan, {
      text: "Premium dark ETA",
      subText: "Flat dark interface with clear delivery milestones.",
      icon: "shield",
    }),
    promise("dg-promise", P.darkCyan, "Delivery window confirmed", "Expected between {min_date} and {max_date}.", "Confirmed", "check_badge", "info"),
    steps("dg-steps", P.darkCyan, "boxed_cards", journey(["cart", "truck", "home"])),
  ]),

  dark_urgency: makeTemplate(P.darkRed, [
    banner("du-banner", P.darkRed, "Place your order before the sale window closes.", "tag", "error"),
    timer("du-timer", P.darkRed, "Sale delivery window ends in {countdown}"),
    steps("du-steps", P.darkRed, "timeline_dots", journey(["cart", "package", "home"])),
  ]),

  dark_command_route: makeTemplate(P.darkCyan, [
    banner("dcr-banner", P.darkCyan, "Route command active for {COUNTRY_NAME}.", "route", "info"),
    progress("dcr-progress", P.darkCyan, "Carrier sync", 76),
    steps("dcr-steps", P.darkCyan, "boxed_cards", journey(["monitor", "rocket", "map_pin"])),
    trust("dcr-trust", P.darkCyan, [
      { icon: "shield", label: "Secure" },
      { icon: "check_badge", label: "Live ETA" },
    ]),
  ]),

  light_clean_eta: makeTemplate(P.light, [
    header("lce-head", P.light, {
      text: "Clean delivery estimate",
      subText: "Arrives between {min_date} and {max_date}.",
      icon: "truck",
    }),
    divider("lce-divider", P.light),
    steps("lce-steps", P.light, "timeline_dots", journey(["cart", "package", "home"])),
  ]),

  light_card_steps: makeTemplate(P.light, [
    header("lcs-head", P.light, {
      text: "Delivery steps",
      subText: "Neutral cards for a quiet storefront.",
      icon: "calendar",
    }),
    steps("lcs-steps", P.light, "boxed_cards", journey(["cart", "truck", "home"])),
  ]),

  minimal_cart_truck: makeTemplate(P.light, [
    steps("mct-steps", P.light, "timeline_dots", journey(["cart", "truck", "home"]), {
      itemGap: 12,
      labelFontSize: 12,
      subTextFontSize: 10,
    }),
  ], { padding: 12 }),

  blue_boxed_steps: makeTemplate(P.blue, [
    header("bbs-head", P.blue, {
      text: "Blue boxed delivery",
      subText: "Estimated delivery {min_date} - {max_date}.",
      icon: "package",
    }),
    banner("bbs-banner", P.blue, "Dates are calculated from your delivery rule.", "calendar", "info"),
    steps("bbs-steps", P.blue, "split_segments", journey(["cart", "package", "map_pin"])),
  ]),

  light_concierge_eta: makeTemplate(P.blue, [
    promise("lceta-promise", P.blue, "Concierge delivery estimate", "Expected between {min_date} and {max_date}.", "Clear ETA", "sparkles", "info"),
    policy("lceta-policy", P.blue, [
      { title: "Dispatch promise", body: "Orders are prepared by {ship_date} before carrier handoff.", icon: "package" },
      { title: "Delivery coverage", body: "This estimate is localized for {COUNTRY_NAME}.", icon: "map_pin" },
    ]),
  ]),

  informative_geo_trust: makeTemplate(P.info, [
    header("igt-head", P.info, {
      text: "Shipping to {COUNTRY_FLAG} {COUNTRY_NAME}",
      subText: "Delivery estimate updates by selected country.",
      icon: "map_pin",
    }),
    dual("igt-dual", P.info,
      { title: "Local estimate", text: "Arrival {min_date} - {max_date}.", icon: "map_pin" },
      { title: "Dispatch", text: "Ships by {ship_date}.", icon: "truck" },
    ),
    trust("igt-trust", P.info, [
      { icon: "shield", label: "Country-aware" },
      { icon: "check_badge", label: "Reliable" },
    ]),
  ]),

  informative_dispatch_stack: makeTemplate(P.info, [
    header("ids-head", P.info, {
      text: "Dispatch stack",
      subText: "Key delivery details for informed shoppers.",
      icon: "warehouse",
    }),
    progress("ids-progress", P.info, "Dispatch readiness", 70),
    dual("ids-dual", P.info,
      { title: "Cutoff", text: "Order within {countdown}.", icon: "clock" },
      { title: "Carrier", text: "Delivery {min_date} - {max_date}.", icon: "truck" },
    ),
    steps("ids-steps", P.info, "timeline_dots", journey(["cart", "package", "home"])),
  ]),

  trust_info_list: makeTemplate(P.info, [
    header("til-head", P.info, {
      text: "Free shipping to {COUNTRY_FLAG} {COUNTRY_NAME}",
      subText: "Order within {countdown} for same day dispatch.",
      icon: "shield",
    }),
    banner("til-banner", P.info, "Receive your order between {min_date} and {max_date}.", "calendar", "success"),
    trust("til-trust", P.info, [
      { icon: "truck", label: "Tracked", subText: "Updates included" },
      { icon: "check_badge", label: "Clear dates", subText: "No guesswork" },
      { icon: "shield", label: "Protected", subText: "Packed safely" },
    ]),
  ]),

  global_trust: makeTemplate(P.blue, [
    header("gt-head", P.blue, {
      text: "Global delivery promise",
      subText: "Free shipping to {COUNTRY_FLAG} {COUNTRY_NAME}.",
      icon: "map_pin",
    }),
    steps("gt-steps", P.blue, "timeline_dots", journey(["cart", "plane", "home"])),
    policy("gt-policy", P.blue, [
      { title: "International estimate", body: "Dates are calculated for the selected delivery country.", icon: "map_pin" },
    ]),
  ]),

  informative_checkout_assurance: makeTemplate(P.info, [
    header("ica-head", P.info, {
      text: "Checkout delivery assurance",
      subText: "All key delivery facts in one compact block.",
      icon: "shield",
    }),
    banner("ica-banner", P.info, "Ships by {ship_date}. Delivered {min_date} - {max_date}.", "calendar", "info"),
    trust("ica-trust", P.info, [
      { icon: "truck", label: "Tracked", subText: "Updates included" },
      { icon: "check_badge", label: "Reliable", subText: "Clear dates" },
    ]),
    policy("ica-policy", P.info, [
      { title: "Country-aware estimate", body: "Dates update based on selected delivery country.", icon: "map_pin" },
    ], { openFirst: false }),
  ]),

  seasonal_holiday_gift: makeTemplate(P.holiday, [
    ornament("shg-ornament-branch", ORNAMENT_ASSETS.holidayBranch, {
      placement: "top-left",
      width: "46px",
      offsetX: 10,
      offsetY: 8,
      zIndex: 2,
    }),
    ornament("shg-ornament-gift", ORNAMENT_ASSETS.holidayGift, {
      placement: "top-right",
      width: "48px",
      offsetX: 10,
      offsetY: 8,
      rotation: 8,
      zIndex: 2,
    }),
    ornament("shg-ornament-stars", ORNAMENT_ASSETS.twinkles, {
      placement: "top-center",
      width: "34px",
      offsetY: 6,
      opacity: 26,
      zIndex: 1,
    }),
    header("shg-head", P.holiday, {
      text: "Holiday delivery window",
      subText: "Order now for arrival by {max_date}",
      icon: "",
      align: "center",
      bgColor: "transparent",
      borderColor: "#eadfc7",
      borderWidth: 0,
      textColor: "#b5343f",
      subTextColor: "#6b6471",
      titleFontSize: 20,
      subTextFontSize: 13,
      fontWeight: "800",
      padding: 16,
      borderRadius: 18,
    }),
    steps("shg-steps", P.holiday, "timeline_dots", [
      { label: "Gift ordered", subText: "{order_date}", icon: "bag", dotColor: "#f9fbf3", iconColor: "#7b8d64", labelColor: "#5a6548", subTextColor: "#8b8879" },
      { label: "Wrapped", subText: "{ship_date}", icon: "package", dotColor: "#f9fbf3", iconColor: "#7b8d64", labelColor: "#5a6548", subTextColor: "#8b8879" },
      { label: "Delivered", subText: "{max_date}", icon: "truck", dotColor: "#f9fbf3", iconColor: "#7b8d64", labelColor: "#5a6548", subTextColor: "#8b8879" },
    ], {
      connectorStyle: "dashed",
      iconSize: 24,
      dotBorderWidth: 2,
      itemGap: 16,
      labelFontSize: 12,
      subTextFontSize: 10,
    }),
  ], { bgColor: "#fffdf8", borderColor: "#efe6d3", borderRadius: 20, padding: 16, shadow: "sm" }),

  seasonal_summer_fresh: makeTemplate(P.summer, [
    ornament("ssf-ornament-leaf", ORNAMENT_ASSETS.summerLeaf, {
      placement: "top-left",
      width: "48px",
      offsetX: 10,
      offsetY: 8,
      opacity: 90,
      zIndex: 2,
    }),
    ornament("ssf-ornament-sun", ORNAMENT_ASSETS.summerSun, {
      placement: "top-right",
      width: "44px",
      offsetX: 10,
      offsetY: 8,
      zIndex: 2,
    }),
    ornament("ssf-ornament-stars", ORNAMENT_ASSETS.twinkles, {
      placement: "top-center",
      width: "34px",
      offsetY: 6,
      opacity: 24,
      zIndex: 1,
    }),
    header("ssf-head", P.summer, {
      text: "Summer fresh shipping",
      subText: "Estimated delivery by {max_date}",
      icon: "",
      align: "center",
      bgColor: "transparent",
      borderColor: "#9fe3db",
      borderWidth: 0,
      textColor: "#148684",
      subTextColor: "#5b6b78",
      titleFontSize: 20,
      subTextFontSize: 13,
      fontWeight: "800",
      padding: 15,
      borderRadius: 18,
    }),
    steps("ssf-steps", P.summer, "timeline_dots", [
      { label: "Order placed", subText: "{order_date}", icon: "sparkles", dotColor: "#f0fffd", iconColor: "#0f8f88", labelColor: "#27707a", subTextColor: "#7c8c93" },
      { label: "On its way", subText: "{ship_date}", icon: "package", dotColor: "#f0fffd", iconColor: "#0f8f88", labelColor: "#27707a", subTextColor: "#7c8c93" },
      { label: "Delivered", subText: "{max_date}", icon: "map_pin", dotColor: "#f0fffd", iconColor: "#0f8f88", labelColor: "#27707a", subTextColor: "#7c8c93" },
    ], {
      connectorStyle: "solid",
      iconSize: 24,
      dotBorderWidth: 2,
      itemGap: 16,
      labelFontSize: 14,
      subTextFontSize: 10,
    }),
  ], { bgColor: "#f6fffb", borderColor: "#d5f2ec", borderRadius: 20, padding: 16, shadow: "sm" }),

  orange_blitz: makeTemplate(P.darkGold, [
    ornament("ob-ornament-confetti", ORNAMENT_ASSETS.goldRibbons, {
      placement: "top-left",
      width: "44px",
      offsetX: 10,
      offsetY: 8,
      opacity: 88,
      zIndex: 1,
    }),
    ornament("ob-ornament-stars", ORNAMENT_ASSETS.goldRibbons, {
      placement: "top-right",
      width: "44px",
      offsetX: 10,
      offsetY: 8,
      rotation: 180,
      opacity: 88,
      zIndex: 1,
    }),
    header("ob-head", P.darkGold, {
      text: "Black Friday ETA",
      subText: "Order today, get it by {max_date}",
      icon: "",
      align: "center",
      bgColor: "transparent",
      borderColor: "#3d3f46",
      borderWidth: 0,
      textColor: "#e6c978",
      subTextColor: "#f3ead0",
      titleFontSize: 20,
      subTextFontSize: 13,
      fontWeight: "800",
      padding: 16,
      borderRadius: 18,
    }),
    steps("ob-steps", P.darkGold, "timeline_dots", [
      { label: "Order placed", subText: "{order_date}", icon: "cart", dotColor: "#1f2126", iconColor: "#e6c978", labelColor: "#f8f2dc", subTextColor: "#c7ccd6" },
      { label: "In transit", subText: "{ship_date}", icon: "truck", dotColor: "#1f2126", iconColor: "#e6c978", labelColor: "#f8f2dc", subTextColor: "#c7ccd6" },
      { label: "Delivered", subText: "{max_date}", icon: "package", dotColor: "#1f2126", iconColor: "#e6c978", labelColor: "#f8f2dc", subTextColor: "#c7ccd6" },
    ], {
      connectorStyle: "dashed",
      iconSize: 24,
      itemGap: 18,
      labelFontSize: 12,
      subTextFontSize: 10,
    }),
  ], { textColor: "#f8f2dc", iconColor: "#e6c978", bgColor: "#1b1c21", borderColor: "#3d3f46", borderRadius: 20, padding: 16, shadow: "sm" }),

  seasonal_sale_window: makeTemplate(P.valentine, [
    ornament("ssw-ornament-left", ORNAMENT_ASSETS.valentineHearts, {
      placement: "top-left",
      width: "46px",
      offsetX: 10,
      offsetY: 8,
      opacity: 92,
      zIndex: 2,
    }),
    ornament("ssw-ornament-right", ORNAMENT_ASSETS.valentineGift, {
      placement: "top-right",
      width: "46px",
      offsetX: 10,
      offsetY: 8,
      zIndex: 2,
    }),
    ornament("ssw-ornament-stars", ORNAMENT_ASSETS.twinkles, {
      placement: "top-center",
      width: "34px",
      offsetY: 6,
      opacity: 24,
      zIndex: 1,
    }),
    header("ssw-head", P.valentine, {
      text: "Valentine gift ETA",
      subText: "Order by {order_date} for delivery by {max_date}",
      icon: "",
      align: "center",
      bgColor: "transparent",
      borderColor: "#f7c7d6",
      borderWidth: 0,
      textColor: "#d95774",
      subTextColor: "#7b6b76",
      titleFontSize: 20,
      subTextFontSize: 13,
      fontWeight: "800",
      padding: 16,
      borderRadius: 18,
    }),
    steps("ssw-steps", P.valentine, "timeline_dots", [
      { label: "Order placed", subText: "{order_date}", icon: "heart", dotColor: "#fff8fb", iconColor: "#e46b8b", labelColor: "#9c5467", subTextColor: "#8c7a83" },
      { label: "On its way", subText: "{ship_date}", icon: "package", dotColor: "#fff8fb", iconColor: "#e46b8b", labelColor: "#9c5467", subTextColor: "#8c7a83" },
      { label: "Delivered", subText: "{max_date}", icon: "heart", dotColor: "#fff8fb", iconColor: "#e46b8b", labelColor: "#9c5467", subTextColor: "#8c7a83" },
    ], {
      connectorStyle: "dashed",
      iconSize: 24,
      itemGap: 16,
      labelFontSize: 12,
      subTextFontSize: 10,
    }),
  ], { bgColor: "#fff8fb", borderColor: "#f8d7e1", borderRadius: 20, padding: 16, shadow: "sm" }),

  seasonal_new_year_delivery: makeTemplate(P.newYear, [
    ornament("sny-fireworks-left", ORNAMENT_ASSETS.fireworksGold, {
      placement: "top-left",
      width: "50px",
      offsetX: 10,
      offsetY: 8,
      opacity: 84,
      zIndex: 1,
    }),
    ornament("sny-fireworks-right", ORNAMENT_ASSETS.fireworksGold, {
      placement: "top-right",
      width: "50px",
      offsetX: 10,
      offsetY: 8,
      rotation: 180,
      opacity: 84,
      zIndex: 1,
    }),
    header("sny-head", P.newYear, {
      text: "New Year delivery",
      subText: "Ring in the new year on time",
      icon: "",
      align: "center",
      bgColor: "transparent",
      borderColor: "#274180",
      borderWidth: 0,
      textColor: "#f0cf74",
      subTextColor: "#f8eec6",
      titleFontSize: 20,
      subTextFontSize: 13,
      fontWeight: "800",
      padding: 16,
      borderRadius: 18,
    }),
    steps("sny-steps", P.newYear, "timeline_dots", [
      { label: "Order placed", subText: "{order_date}", icon: "sparkles", dotColor: "#12214f", iconColor: "#efcd72", labelColor: "#f8f1d7", subTextColor: "#d3d5df" },
      { label: "In transit", subText: "{ship_date}", icon: "truck", dotColor: "#12214f", iconColor: "#efcd72", labelColor: "#f8f1d7", subTextColor: "#d3d5df" },
      { label: "Delivered", subText: "{max_date}", icon: "home", dotColor: "#12214f", iconColor: "#efcd72", labelColor: "#f8f1d7", subTextColor: "#d3d5df" },
    ], {
      connectorStyle: "solid",
      iconSize: 24,
      itemGap: 16,
      labelFontSize: 12,
      subTextFontSize: 10,
    }),
  ], { textColor: "#f8f1d7", iconColor: "#efcd72", bgColor: "#0f1d49", borderColor: "#284077", borderRadius: 20, padding: 16, shadow: "sm" }),

  green_order_now: makeTemplate(P.spring, [
    ornament("gon-ornament-leaf", ORNAMENT_ASSETS.summerLeaf, {
      placement: "top-left",
      width: "46px",
      offsetX: 10,
      offsetY: 8,
      opacity: 84,
      zIndex: 1,
    }),
    ornament("gon-ornament-bloom", ORNAMENT_ASSETS.springBloom, {
      placement: "top-right",
      width: "44px",
      offsetX: 10,
      offsetY: 8,
      zIndex: 2,
    }),
    header("gon-head", P.spring, {
      text: "Spring sale ETA",
      subText: "Fresh finds, fast delivery by {max_date}",
      icon: "",
      align: "center",
      bgColor: "transparent",
      borderColor: "#dceccf",
      borderWidth: 0,
      textColor: "#5f8f49",
      subTextColor: "#6c7b69",
      titleFontSize: 20,
      subTextFontSize: 13,
      fontWeight: "800",
      padding: 16,
      borderRadius: 18,
    }),
    steps("gon-steps", P.spring, "timeline_dots", [
      { label: "Order placed", subText: "{order_date}", icon: "bag", dotColor: "#f6fff0", iconColor: "#7aa85a", labelColor: "#5f8052", subTextColor: "#8b8d7e" },
      { label: "On its way", subText: "{ship_date}", icon: "truck", dotColor: "#f6fff0", iconColor: "#7aa85a", labelColor: "#5f8052", subTextColor: "#8b8d7e" },
      { label: "Delivered", subText: "{max_date}", icon: "heart", dotColor: "#fff7fb", iconColor: "#f09ab7", labelColor: "#5f8052", subTextColor: "#8b8d7e" },
    ], {
      connectorStyle: "solid",
      iconSize: 24,
      itemGap: 16,
      labelFontSize: 12,
      subTextFontSize: 10,
    }),
  ], { bgColor: "#fffef9", borderColor: "#e6efda", borderRadius: 20, padding: 16, shadow: "sm" }),

  seasonal_halloween_shipping: makeTemplate(P.halloween, [
    ornament("shs-bats", ORNAMENT_ASSETS.halloweenBats, {
      placement: "top-left",
      width: "46px",
      offsetX: 10,
      offsetY: 8,
      zIndex: 2,
    }),
    ornament("shs-web", ORNAMENT_ASSETS.spiderWeb, {
      placement: "top-right",
      width: "44px",
      offsetX: 10,
      offsetY: 8,
      opacity: 86,
      zIndex: 1,
    }),
    header("shs-head", P.halloween, {
      text: "Halloween shipping",
      subText: "Spooktacular delivery by {max_date}",
      icon: "",
      align: "center",
      bgColor: "transparent",
      borderColor: "#d9d2fb",
      borderWidth: 0,
      textColor: "#5b529c",
      subTextColor: "#7a7496",
      titleFontSize: 20,
      subTextFontSize: 13,
      fontWeight: "800",
      padding: 16,
      borderRadius: 18,
    }),
    steps("shs-steps", P.halloween, "timeline_dots", [
      { label: "Order placed", subText: "{order_date}", icon: "cart", dotColor: "#f4f1ff", iconColor: "#6b5ca5", labelColor: "#5d567a", subTextColor: "#8a839d" },
      { label: "In transit", subText: "{ship_date}", icon: "home", dotColor: "#f4f1ff", iconColor: "#6b5ca5", labelColor: "#5d567a", subTextColor: "#8a839d" },
      { label: "Delivered", subText: "{max_date}", icon: "package", dotColor: "#f4f1ff", iconColor: "#6b5ca5", labelColor: "#5d567a", subTextColor: "#8a839d" },
    ], {
      connectorStyle: "solid",
      iconSize: 24,
      itemGap: 16,
      labelFontSize: 12,
      subTextFontSize: 10,
    }),
  ], { bgColor: "#fbf9ff", borderColor: "#e3ddff", borderRadius: 20, padding: 16, shadow: "sm" }),

  seasonal_gift_ready: makeTemplate(P.gift, [
    ornament("sgr-branch", ORNAMENT_ASSETS.summerLeaf, {
      placement: "top-left",
      width: "46px",
      offsetX: 10,
      offsetY: 8,
      opacity: 80,
      zIndex: 1,
    }),
    ornament("sgr-gift", ORNAMENT_ASSETS.giftBoxOlive, {
      placement: "top-right",
      width: "46px",
      offsetX: 10,
      offsetY: 8,
      zIndex: 2,
    }),
    header("sgr-head", P.gift, {
      text: "Gift ready",
      subText: "Thoughtful gifts, delivered on time",
      icon: "",
      align: "center",
      bgColor: "transparent",
      borderColor: "#e3e4cf",
      borderWidth: 0,
      textColor: "#6c8450",
      subTextColor: "#727568",
      titleFontSize: 20,
      subTextFontSize: 13,
      fontWeight: "800",
      padding: 16,
      borderRadius: 18,
    }),
    steps("sgr-steps", P.gift, "timeline_dots", [
      { label: "Order placed", subText: "{order_date}", icon: "bag", dotColor: "#faf9ef", iconColor: "#94a35f", labelColor: "#6b7159", subTextColor: "#8c8d80" },
      { label: "Packed", subText: "{ship_date}", icon: "package", dotColor: "#faf9ef", iconColor: "#94a35f", labelColor: "#6b7159", subTextColor: "#8c8d80" },
      { label: "Delivered", subText: "{max_date}", icon: "truck", dotColor: "#faf9ef", iconColor: "#94a35f", labelColor: "#6b7159", subTextColor: "#8c8d80" },
    ], {
      connectorStyle: "solid",
      iconSize: 24,
      itemGap: 16,
      labelFontSize: 12,
      subTextFontSize: 10,
    }),
  ], { bgColor: "#fffef8", borderColor: "#ebe8d8", borderRadius: 20, padding: 16, shadow: "sm" }),

  express_alert: makeTemplate(P.red, [
    banner("ea-banner", P.red, "Place your order now before the sale ends.", "clock", "error"),
    steps("ea-steps", P.red, "timeline_dots", journey(["cart", "package", "map_pin"])),
  ]),

  estimate_shipping_period: makeTemplate(P.yellow, [
    header("esp-head", P.yellow, {
      text: "Estimate shipping period",
      subText: "Simple date ranges for each milestone.",
      icon: "calendar",
    }),
    steps("esp-steps", P.yellow, "timeline_dots", [
      { label: "Ordered", subText: "today", icon: "cart" },
      { label: "Shipping", subText: "1 to 2 days", icon: "truck" },
      { label: "Delivery", subText: "3 to 5 days", icon: "map_pin" },
    ]),
  ]),

  vertical_yellow: makeTemplate(P.yellow, [
    header("vy-head", P.yellow, {
      text: "Estimated delivery date",
      subText: "{min_date} to {max_date}",
      icon: "calendar",
    }),
    steps("vy-steps", P.yellow, "vertical", [
      { label: "Order successfully placed", subText: "{order_date}", icon: "cart" },
      { label: "Order will be shipped", subText: "{ship_date}", icon: "truck" },
      { label: "Arrives at your address", subText: "{max_date}", icon: "map_pin" },
    ]),
  ]),

  vertical_orange: makeTemplate(P.orange, [
    header("vo-head", P.orange, {
      text: "Estimated delivery date",
      subText: "{min_date} to {max_date}",
      icon: "package",
    }),
    steps("vo-steps", P.orange, "vertical", [
      { label: "Ordered", subText: "Order successfully placed.", icon: "cart" },
      { label: "Dispatched", subText: "Your order will be dispatched.", icon: "truck" },
      { label: "Arrived", subText: "It will arrive at your address.", icon: "map_pin" },
    ]),
  ]),

  blue_gradient: makeTemplate(P.blue, [
    header("bg-head", P.blue, {
      text: "Estimated delivery",
      subText: "{min_date} to {max_date}",
      icon: "truck",
    }),
    steps("bg-steps", P.blue, "boxed_cards", journey(["cart", "package", "map_pin"])),
  ]),
};
