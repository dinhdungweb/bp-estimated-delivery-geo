import type { BlockConfig } from "./delivery";
import { normalizePolicyItems, normalizeStepItems, normalizeTrustBadges } from "./delivery";

export type TemplateColorSource = {
  textColor?: string | null;
  iconColor?: string | null;
  bgColor?: string | null;
  borderColor?: string | null;
};

const normalizeColorInput = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const clean = trimmed.replace(/^#+/, "");
  return /^[0-9a-f]{3,8}$/i.test(clean) ? `#${clean}` : trimmed;
};

const expandHex = (value: string) => {
  const hex = normalizeColorInput(value);
  if (!/^#[0-9a-f]{3,8}$/i.test(hex)) return "";
  const clean = hex.slice(1);
  if (clean.length === 3) {
    return `#${clean.split("").map((char) => `${char}${char}`).join("")}`;
  }
  return `#${clean.slice(0, 6)}`;
};

const hexToRgb = (value: string) => {
  const hex = expandHex(value);
  if (!hex) return null;
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
};

const rgbToHex = ({ r, g, b }: { r: number; g: number; b: number }) =>
  `#${[r, g, b].map((part) => Math.round(part).toString(16).padStart(2, "0")).join("")}`;

const mixHex = (from: string, to: string, weight: number) => {
  const a = hexToRgb(from);
  const b = hexToRgb(to);
  if (!a || !b) return expandHex(from) || expandHex(to) || "#000000";
  const clamped = Math.min(1, Math.max(0, weight));
  return rgbToHex({
    r: a.r + (b.r - a.r) * clamped,
    g: a.g + (b.g - a.g) * clamped,
    b: a.b + (b.b - a.b) * clamped,
  });
};

const luminance = (value: string) => {
  const rgb = hexToRgb(value);
  if (!rgb) return 1;
  const linear = [rgb.r, rgb.g, rgb.b].map((part) => {
    const channel = part / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
};

export const createTemplatePalette = (source: TemplateColorSource) => {
  const text = expandHex(source.textColor || "") || "#111827";
  const accent = expandHex(source.iconColor || "") || text;
  const bg = expandHex(source.bgColor || "") || "#ffffff";
  const border = expandHex(source.borderColor || "") || mixHex(bg, accent, 0.22);
  const muted = mixHex(text, bg, luminance(bg) < 0.35 ? 0.35 : 0.45);
  const accentDark = mixHex(accent, text, 0.24);
  const secondaryAccent = mixHex(accent, text, 0.36);
  const tertiaryAccent = mixHex(accent, border, 0.42);

  return {
    text,
    accent,
    bg,
    border,
    muted,
    onAccent: luminance(accent) < 0.45 ? "#ffffff" : "#111827",
    accentSoft: mixHex(bg, accent, 0.12),
    accentSofter: mixHex(bg, accent, 0.07),
    accentBorder: mixHex(border, accent, 0.28),
    accentDark,
    secondaryAccent,
    tertiaryAccent,
    secondarySoft: mixHex(bg, secondaryAccent, 0.11),
    secondaryBorder: mixHex(border, secondaryAccent, 0.24),
  };
};

export type TemplatePalette = ReturnType<typeof createTemplatePalette>;

const sampleAccent = (palette: TemplatePalette, index: number) =>
  [palette.accent, palette.secondaryAccent, palette.tertiaryAccent][index % 3];

const sampleSoftBackground = (palette: TemplatePalette, index: number) =>
  mixHex(palette.bg, sampleAccent(palette, index), 0.09 + (index % 3) * 0.025);

export const sampleStepColors = (palette: TemplatePalette, index: number) => {
  const accent = sampleAccent(palette, index);
  return {
    bgColor: sampleSoftBackground(palette, index),
    dotColor: accent,
    iconColor: luminance(accent) < 0.45 ? "#ffffff" : palette.text,
    labelColor: palette.text,
    subTextColor: palette.muted,
    borderColor: mixHex(palette.border, accent, 0.28),
  };
};

export const sampleTrustBadgeColors = (palette: TemplatePalette, index: number) => {
  const accent = sampleAccent(palette, index);
  return {
    bgColor: sampleSoftBackground(palette, index),
    borderColor: mixHex(palette.border, accent, 0.24),
    iconColor: accent,
    labelColor: palette.text,
    subTextColor: palette.muted,
  };
};

export const samplePolicyItemColors = (palette: TemplatePalette, index: number) => {
  const accent = sampleAccent(palette, index);
  return {
    bgColor: sampleSoftBackground(palette, index),
    borderColor: mixHex(palette.border, accent, 0.24),
    iconColor: accent,
    titleColor: palette.text,
    bodyColor: palette.muted,
  };
};

const componentStyleSamples = (palette: TemplatePalette): Record<string, Record<string, unknown>> => ({
  header: {
    textColor: palette.text,
    subTextColor: palette.muted,
    iconColor: palette.accent,
    bgColor: palette.accentSofter,
    borderColor: palette.accentBorder,
    borderWidth: 1,
    borderRadius: 14,
  },
  promise_card: {
    bgColor: palette.accentSoft,
    borderColor: palette.accentBorder,
    titleColor: palette.text,
    subtitleColor: palette.muted,
    iconColor: palette.onAccent,
    iconBgColor: palette.accent,
    badgeBgColor: palette.bg,
    badgeTextColor: palette.accentDark,
    borderWidth: 1,
    borderRadius: 16,
  },
  timer: {
    bgColor: palette.accentSofter,
    color: palette.accent,
    textColor: palette.text,
    borderColor: palette.accentBorder,
    borderWidth: 0,
  },
  banner: {
    bgColor: palette.accentSoft,
    textColor: palette.text,
    iconColor: palette.accent,
    borderColor: palette.accentBorder,
    borderWidth: 1,
  },
  progress: {
    labelColor: palette.text,
    trackColor: mixHex(palette.bg, palette.border, 0.72),
    color: palette.accent,
    trackBorderColor: palette.border,
    fillStyle: "gradient",
    gradientEndColor: palette.secondaryAccent,
  },
  dual_info: {
    leftBgColor: palette.accentSoft,
    leftBorderColor: palette.accentBorder,
    leftIconColor: palette.accent,
    leftTitleColor: palette.text,
    leftTextColor: palette.muted,
    rightBgColor: palette.secondarySoft,
    rightBorderColor: palette.secondaryBorder,
    rightIconColor: palette.secondaryAccent,
    rightTitleColor: palette.text,
    rightTextColor: palette.muted,
    borderWidth: 1,
  },
  image: {
    borderColor: palette.border,
    borderWidth: 1,
    borderRadius: 12,
  },
  divider: {
    color: palette.border,
  },
});

const legacyGeneratedColorValues = new Set(
  [
    "#0f172a",
    "#083344",
    "#64748b",
    "#0d9488",
    "#0f766e",
    "#ecfeff",
    "#99f6e4",
    "#ecfdf5",
    "#86efac",
    "#064e3b",
    "#047857",
    "#eff6ff",
    "#bfdbfe",
    "#2563eb",
    "#1e3a8a",
    "#fff7ed",
    "#fed7aa",
    "#ea580c",
    "#9a3412",
    "#f8fafc",
    "#e2e8f0",
    "#16a34a",
    "#14532d",
    "#15803d",
    "#c2410c",
    "#134e4a",
    "#cbd5e1",
  ].map((value) => value.toLowerCase()),
);

const isLegacyGeneratedColor = (value: unknown) =>
  typeof value === "string" && legacyGeneratedColorValues.has(value.trim().toLowerCase());

const fillBlankStyleValues = <T extends object>(settings: T, samples: Record<string, unknown>): T => {
  const next = Object.assign({}, settings) as Record<string, unknown>;
  for (const [key, value] of Object.entries(samples)) {
    if (next[key] === undefined || next[key] === null || next[key] === "" || isLegacyGeneratedColor(next[key])) {
      next[key] = value;
    }
  }
  return next as T;
};

const isMatchingGeneratedValue = (value: unknown, sample: unknown) => {
  if (typeof value === "string" && typeof sample === "string") {
    const valueHex = expandHex(value);
    const sampleHex = expandHex(sample);
    if (valueHex && sampleHex) return valueHex.toLowerCase() === sampleHex.toLowerCase();
    return value.trim().toLowerCase() === sample.trim().toLowerCase();
  }
  return value === sample;
};

const stripMatchingSamples = <T extends object>(
  settings: T,
  samples: Record<string, unknown>,
  extraGeneratedValues: Record<string, unknown[]> = {},
): T => {
  const next = Object.assign({}, settings) as Record<string, unknown>;
  for (const [key, sample] of Object.entries(samples)) {
    const value = next[key];
    const extraValues = extraGeneratedValues[key] || [];
    if (
      isMatchingGeneratedValue(value, sample) ||
      extraValues.some((extra) => isMatchingGeneratedValue(value, extra)) ||
      isLegacyGeneratedColor(value)
    ) {
      delete next[key];
    }
  }
  return next as T;
};

export const hydrateBlockStyleSamples = (block: BlockConfig, palette: TemplatePalette): BlockConfig => {
  const samples = componentStyleSamples(palette)[block.type] || {};
  const settings = fillBlankStyleValues(
    { ...(block.settings || {}) },
    samples,
  );

  if (
    block.type === "timer" &&
    Number(settings.borderWidth) === 1 &&
    (isLegacyGeneratedColor(settings.borderColor) || settings.borderColor === samples.borderColor)
  ) {
    settings.borderWidth = 0;
  }

  if (block.type === "steps") {
    settings.items = normalizeStepItems(settings).map((item, index) =>
      fillBlankStyleValues(item, sampleStepColors(palette, index)),
    );
  }

  if (block.type === "trust_badges") {
    settings.badges = normalizeTrustBadges(settings).map((badge, index) =>
      fillBlankStyleValues(badge, sampleTrustBadgeColors(palette, index)),
    );
  }

  if (block.type === "policy_accordion") {
    settings.items = normalizePolicyItems(settings).map((item, index) =>
      fillBlankStyleValues(item, samplePolicyItemColors(palette, index)),
    );
  }

  return { ...block, settings };
};

export const stripGeneratedStyleSamples = (block: BlockConfig, palette: TemplatePalette): BlockConfig => {
  const samples = componentStyleSamples(palette)[block.type] || {};
  const settings = stripMatchingSamples(
    { ...(block.settings || {}) },
    samples,
    block.type === "timer" ? { borderWidth: [1] } : {},
  ) as Record<string, unknown>;

  if (block.type === "steps") {
    settings.items = normalizeStepItems(settings).map((item, index) =>
      stripMatchingSamples(item, sampleStepColors(palette, index)),
    );
  }

  if (block.type === "trust_badges") {
    settings.badges = normalizeTrustBadges(settings).map((badge, index) =>
      stripMatchingSamples(badge, sampleTrustBadgeColors(palette, index)),
    );
  }

  if (block.type === "policy_accordion") {
    settings.items = normalizePolicyItems(settings).map((item, index) =>
      stripMatchingSamples(item, samplePolicyItemColors(palette, index)),
    );
  }

  return { ...block, settings };
};

export const hydrateBlocksForTemplate = (
  blocks: BlockConfig[] | undefined,
  source: TemplateColorSource,
) => {
  const palette = createTemplatePalette(source);
  return (blocks || []).map((block) => hydrateBlockStyleSamples(block, palette));
};
