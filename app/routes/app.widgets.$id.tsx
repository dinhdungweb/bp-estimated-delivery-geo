import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import type { Prisma } from "@prisma/client";
import { useLoaderData, useSubmit, useNavigation, useNavigate, useActionData, data as routerData } from "react-router";
import React, { useState, useCallback, useEffect } from "react";
import { 
  Page, 
  Button, 
  InlineStack, 
  BlockStack, 
  Box, 
  Text, 
  Icon, 
  Tabs,
  TextField,
  Select,
  RangeSlider,
  Badge,
  Divider,
  EmptyState,
  Layout,
  Card,
  Popover
} from "@shopify/polaris";
import { 
  PlusIcon, 
  SaveIcon, 
  ChevronLeftIcon, 
  MobileIcon, 
  DesktopIcon,
  ProductIcon,
  LayoutColumns2Icon,
  DuplicateIcon,
  DeleteIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ViewIcon
} from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { WidgetPreviewRenderer } from "../components/WidgetRenderer";
import { IconLibraryModal } from "../components/IconLibraryModal";
import type { IconLibrarySelection } from "../components/IconLibraryModal";
import { TEMPLATE_DEFAULTS } from "../constants/templateDefaults";
import {
  buildFallbackBlocks,
  normalizeCountries,
  normalizePolicyItems,
  normalizeProductIds,
  normalizeStepItems,
  normalizeTags,
  normalizeTrustBadges,
  parseBlockConfigs,
  parseJsonArrayField,
} from "../lib/delivery";
import type { BlockType, PolicyItemConfig, StepItemConfig, TrustBadgeConfig, WidgetStyleId } from "../lib/delivery";
import {
  createTemplatePalette,
  hydrateBlockStyleSamples,
  samplePolicyItemColors,
  sampleStepColors,
  sampleTrustBadgeColors,
  stripGeneratedStyleSamples,
} from "../lib/widgetStyleSamples";
import type { TemplatePalette } from "../lib/widgetStyleSamples";
import Chrome from '@uiw/react-color-chrome';
import { createPortal } from "react-dom";

// ─── Reusable Elite Pro Color Picker (Genuine Chrome Style) ──────────────────
const normalizeColorInput = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const clean = trimmed.replace(/^#+/, "");
  return /^[0-9a-f]{3,8}$/i.test(clean) ? `#${clean}` : trimmed;
};

const colorInputValue = (value: string) => value.trim().replace(/^#+/, "");

const ColorField = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => {
  const [active, setActive] = useState(false);
  const [pickerPos, setPickerPos] = useState({ top: 0, left: 0 });
  const containerRef = React.useRef<HTMLDivElement>(null);
  const normalizedColor = normalizeColorInput(value);
  const pickerColor = /^#[0-9a-f]{3,8}$/i.test(normalizedColor) ? normalizedColor : '#000000';
  
  const toggleActive = useCallback(() => {
    if (!active && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const pickerHeight = 260; 
      const windowHeight = window.innerHeight;
      const spaceBelow = windowHeight - rect.bottom;
      
      let topPos = rect.bottom + 6;
      if (spaceBelow < pickerHeight && rect.top > pickerHeight) {
        topPos = rect.top - pickerHeight - 6;
      }

      setPickerPos({
        top: topPos,
        left: rect.left + rect.width - 225
      });
    }
    setActive((prev) => !prev);
  }, [active]);

  const activator = (
    <div 
      ref={containerRef}
      onClick={toggleActive}
      style={{ 
        width: '32px', height: '32px', borderRadius: '4px', overflow: 'hidden', 
        border: '1px solid #e1e3e5', cursor: 'pointer',
        background: pickerColor, transition: 'all 0.2s',
        boxShadow: active ? '0 0 0 2px #008060, 0 4px 12px rgba(0,0,0,0.1)' : 'none'
      }} 
    />
  );

  return (
    <BlockStack gap="100">
      <Text variant="bodySm" as="p">{label}</Text>
      <InlineStack gap="200" blockAlign="center">
        <div style={{ flex: 1 }}>
          <TextField
            label={label}
            labelHidden
            value={colorInputValue(value)}
            onChange={(nextValue) => onChange(normalizeColorInput(nextValue))}
            autoComplete="off"
            prefix="#"
          />
        </div>
        <div style={{ position: 'relative' }}>
          {activator}
          {active && createPortal(
            <>
              <div 
                onClick={() => setActive(false)} 
                style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }} 
              />
              <div style={{ 
                position: 'fixed', 
                top: `${pickerPos.top}px`, 
                left: `${pickerPos.left}px`, 
                zIndex: 10000,
                boxShadow: '0 12px 30px rgba(0,0,0,0.3)',
                borderRadius: '8px', overflow: 'hidden'
              }}>
                <Chrome 
                  color={pickerColor} 
                  onChange={(color: any) => onChange(normalizeColorInput(color.hexa))} 
                />
              </div>
            </>,
            document.body
          )}
        </div>
      </InlineStack>
    </BlockStack>
  );
};

// ─── Loader ──────────────────────────────────────────────────────────────────
const createEditorId = (prefix: string) => {
  const uuid = globalThis.crypto?.randomUUID?.();
  return uuid ? `${prefix}-${uuid}` : `${prefix}-${Date.now()}`;
};

const defaultStepItems = (palette: TemplatePalette): StepItemConfig[] => [
  { id: createEditorId("step"), label: "Order now", subText: "{order_date}", icon: "bag", ...sampleStepColors(palette, 0) },
  { id: createEditorId("step"), label: "Ships", subText: "{ship_date}", icon: "package", ...sampleStepColors(palette, 1) },
  { id: createEditorId("step"), label: "Delivered", subText: "{max_date}", icon: "map_pin", ...sampleStepColors(palette, 2) },
];

const defaultTrustBadges = (palette: TemplatePalette): TrustBadgeConfig[] => [
  { id: createEditorId("trust"), icon: "shield", label: "Tracked", subText: "Updates included", ...sampleTrustBadgeColors(palette, 0) },
  { id: createEditorId("trust"), icon: "check_badge", label: "Reliable", subText: "Clear ETA", ...sampleTrustBadgeColors(palette, 1) },
  { id: createEditorId("trust"), icon: "truck", label: "Fast dispatch", subText: "Ships soon", ...sampleTrustBadgeColors(palette, 2) },
];

const defaultPolicyItems = (palette: TemplatePalette): PolicyItemConfig[] => [
  {
    id: createEditorId("policy"),
    title: "Shipping & delivery",
    body: "Orders are prepared quickly and shipped with tracking when available.",
    icon: "truck",
    ...samplePolicyItemColors(palette, 0),
  },
  {
    id: createEditorId("policy"),
    title: "Returns",
    body: "Easy returns are available according to store policy.",
    icon: "shield",
    ...samplePolicyItemColors(palette, 1),
  },
];

const blockLabels: Record<string, string> = {
  header: "Header",
  promise_card: "Promise Card",
  steps: "Steps",
  timer: "Countdown Timer",
  banner: "Banner",
  trust_badges: "Trust Badges",
  policy_accordion: "Policy Accordion",
  progress: "Progress Bar",
  image: "Image",
  spacer: "Spacer",
  divider: "Divider",
  dual_info: "Dual Info",
  html: "HTML",
  policy: "Policy",
};

const lordiconPresetOptions = [
  { label: "Auto from current icon", value: "auto" },
  { label: "Shopping cart", value: "cart" },
  { label: "Shopping bag", value: "bag" },
  { label: "Package / box", value: "package" },
  { label: "Delivery truck", value: "truck" },
  { label: "Map pin", value: "map_pin" },
  { label: "Home", value: "home" },
  { label: "Shield", value: "shield" },
  { label: "Clock", value: "clock" },
  { label: "Rocket", value: "rocket" },
  { label: "Heart", value: "heart" },
  { label: "Store", value: "store" },
  { label: "Online order", value: "monitor" },
  { label: "Promo tag", value: "tag" },
  { label: "Custom URL", value: "custom" },
];

const lordiconTriggerOptions = [
  { label: "Loop", value: "loop" },
  { label: "Loop on hover", value: "loop-on-hover" },
  { label: "Hover", value: "hover" },
  { label: "Click", value: "click" },
  { label: "Intro", value: "in" },
  { label: "Boomerang", value: "boomerang" },
  { label: "Morph", value: "morph" },
  { label: "Sequence", value: "sequence" },
];

const lordiconStrokeOptions = [
  { label: "Light", value: "light" },
  { label: "Regular", value: "regular" },
  { label: "Bold", value: "bold" },
];

const getBlockLabel = (type: string) =>
  blockLabels[type] ||
  type
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const widgetId = params.id;
  const url = new URL(request.url);
  const templateId = url.searchParams.get("template");
  
  if (widgetId === "new") {
    // Return default data based on template
    const defaultData =
      TEMPLATE_DEFAULTS[templateId as WidgetStyleId] || TEMPLATE_DEFAULTS.eco_delivery;
    return routerData({ 
      widget: {
        id: "new",
        name: `New Widget (${templateId || 'General'})`,
        isActive: true,
        isDefault: false,
        widgetStyle: defaultData.style,
        customBlocks: defaultData.customBlocks?.length
          ? defaultData.customBlocks
          : buildFallbackBlocks(defaultData),
        textColor: defaultData.textColor || "#000000",
        iconColor: defaultData.iconColor || "#0033cc",
        bgColor: defaultData.bgColor || "#ffffff",
        borderColor: defaultData.borderColor || "#e5e7eb",
        borderRadius: defaultData.borderRadius || 10,
        shadow: defaultData.shadow || "none",
        glassmorphism: defaultData.glassmorphism || false,
        padding: defaultData.padding ?? 16,
        bgGradient: defaultData.bgGradient || "",
        showTimeline: defaultData.showTimeline ?? true,
        targetCountries: [],
        targetProducts: [],
        targetTags: [],
      } 
    });
  }

  const widget = await prisma.widget.findFirst({
    where: { id: widgetId, shop: session.shop },
  });

  if (!widget) throw new Error("Widget not found");

  return routerData({ widget });
};

// ─── Action ──────────────────────────────────────────────────────────────────
export const action = async ({ params, request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const id = params.id;
  const name = String(formData.get("name"));
  const isActive = formData.get("isActive") === "true";
  const widgetStyle = String(formData.get("widgetStyle"));
  const customBlocksRaw = parseJsonArrayField(formData.get("customBlocks"));
  const textColor = String(formData.get("textColor"));
  const iconColor = String(formData.get("iconColor"));
  const bgColor = String(formData.get("bgColor"));
  const borderColor = String(formData.get("borderColor"));
  const borderRadius = parseInt(String(formData.get("borderRadius")) || "10");
  const shadow = String(formData.get("shadow"));
  const glassmorphism = formData.get("glassmorphism") === "true";
  const padding = parseInt(String(formData.get("padding")) || "16");
  const bgGradient = String(formData.get("bgGradient"));
  const showTimeline = formData.get("showTimeline") === "true";
  const targetCountriesRaw = parseJsonArrayField(formData.get("targetCountries"));
  const targetProductsRaw = parseJsonArrayField(formData.get("targetProducts"));
  const targetTagsRaw = parseJsonArrayField(formData.get("targetTags"));

  if (!customBlocksRaw || !targetCountriesRaw || !targetProductsRaw || !targetTagsRaw) {
    return routerData({ error: "Invalid widget payload" }, { status: 400 });
  }

  const customBlocks = parseBlockConfigs(customBlocksRaw);
  const targetCountries = normalizeCountries(targetCountriesRaw);
  const targetProducts = normalizeProductIds(targetProductsRaw);
  const targetTags = normalizeTags(targetTagsRaw);

  const data = {
    shop: session.shop,
    name,
    isActive,
    widgetStyle,
    customBlocks: customBlocks as unknown as Prisma.InputJsonValue,
    textColor,
    iconColor,
    bgColor,
    borderColor,
    borderRadius,
    shadow,
    glassmorphism,
    padding,
    bgGradient,
    showTimeline,
    targetCountries: targetCountries as Prisma.InputJsonValue,
    targetProducts: targetProducts as Prisma.InputJsonValue,
    targetTags: targetTags as Prisma.InputJsonValue,
  };

  if (id === "new") {
    const newWidget = await prisma.widget.create({ data });
    return routerData({ success: true, newId: newWidget.id });
  }

  await prisma.widget.updateMany({
    where: { id, shop: session.shop },
    data,
  });

  return routerData({ success: true });
};

export default function VisualBuilderStudio() {
  const { widget } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const submit = useSubmit();
  const navigation = useNavigation();
  const actionData = useActionData<any>();
  const isSaving = navigation.state === "submitting";

  useEffect(() => {
    if (actionData?.success && actionData?.newId) {
      navigate(`/app/widgets/${actionData.newId}`, { replace: true });
    }
  }, [actionData, navigate]);

  // --- States ---
  const [name, setName] = useState(widget.name);
  const [activeTab, setActiveTab] = useState(0);
  const [previewMode, setPreviewMode] = useState<'mobile' | 'desktop'>('mobile');
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  
  const [widgetStyle] = useState(widget.widgetStyle || "custom");
  const [textColor, setTextColor] = useState(widget.textColor || "#000000");
  const [iconColor, setIconColor] = useState(widget.iconColor || "#0033cc");
  const [bgColor, setBgColor] = useState(widget.bgColor || "#ffffff");
  const [borderColor, setBorderColor] = useState(widget.borderColor || "#e5e7eb");
  const [borderRadius, setBorderRadius] = useState(widget.borderRadius ?? 10);
  const [shadow, setShadow] = useState(widget.shadow || "none");
  const [glassmorphism, setGlassmorphism] = useState(widget.glassmorphism ?? false);
  const [padding, setPadding] = useState(widget.padding ?? 16);
  const [bgGradient, setBgGradient] = useState(widget.bgGradient || "");
  const [showTimeline, setShowTimeline] = useState(widget.showTimeline ?? true);
  const [isActive] = useState(widget.isActive);
  const [isDefault] = useState(widget.isDefault);
  const templatePalette = createTemplatePalette({ textColor, iconColor, bgColor, borderColor });

  const [blocks, setBlocks] = useState<any[]>(() =>
    parseBlockConfigs(widget.customBlocks).map((block) =>
      block.id.startsWith("block-") ? block : stripGeneratedStyleSamples(block, templatePalette),
    ),
  );
  const [targetCountries, setTargetCountries] = useState<string[]>(
    normalizeCountries(widget.targetCountries),
  );
  const [targetProducts, setTargetProducts] = useState<string[]>(
    normalizeProductIds(widget.targetProducts),
  );
  const [targetTags, setTargetTags] = useState<string[]>(
    normalizeTags(widget.targetTags),
  );
  const [iconPickerTarget, setIconPickerTarget] = useState<{ blockId?: string; field?: string; open: boolean }>({ open: false });

  const handleSave = useCallback(() => {
    const formData = new FormData();
    formData.append("name", name);
    formData.append("isActive", String(isActive));
    formData.append("isDefault", String(isDefault));
    formData.append("widgetStyle", widgetStyle);
    formData.append("customBlocks", JSON.stringify(blocks));
    formData.append("textColor", textColor);
    formData.append("iconColor", iconColor);
    formData.append("bgColor", bgColor);
    formData.append("borderColor", borderColor);
    formData.append("borderRadius", String(borderRadius));
    formData.append("shadow", shadow);
    formData.append("glassmorphism", String(glassmorphism));
    formData.append("padding", String(padding));
    formData.append("bgGradient", bgGradient);
    formData.append("showTimeline", String(showTimeline));
    formData.append("policyText", "");
    formData.append("targetCountries", JSON.stringify(targetCountries));
    formData.append("targetProducts", JSON.stringify(targetProducts));
    formData.append("targetTags", JSON.stringify(targetTags));
    
    submit(formData, { method: "post" });
  }, [name, isActive, isDefault, widgetStyle, blocks, textColor, iconColor, bgColor, borderColor, borderRadius, shadow, glassmorphism, padding, bgGradient, showTimeline, targetCountries, targetProducts, targetTags, submit]);

  const addBlock = (type: string) => {
    const id = createEditorId("block");
    const defaultSettings: any = {};
    if (type === 'steps') {
      defaultSettings.preset = "timeline_dots";
      defaultSettings.borderRadius = 12;
      defaultSettings.itemGap = 16;
      defaultSettings.padding = 16;
      defaultSettings.iconSize = 24;
      defaultSettings.borderWidth = 1;
      defaultSettings.items = defaultStepItems(templatePalette);
    }
    if (type === 'promise_card') {
      defaultSettings.title = "Get it by {max_date}";
      defaultSettings.subtitle = "Order today for estimated delivery between {min_date} and {max_date}.";
      defaultSettings.badgeText = "Tracked";
      defaultSettings.icon = "truck";
      defaultSettings.tone = "success";
      defaultSettings.align = "left";
    }
    if (type === 'policy_accordion') {
      defaultSettings.openFirst = true;
      defaultSettings.items = defaultPolicyItems(templatePalette);
    }
    if (type === 'trust_badges') {
      defaultSettings.badges = defaultTrustBadges(templatePalette);
    }
    if (type === 'timer') {
      defaultSettings.text = "Order in {countdown}";
      defaultSettings.animate = true;
    }
    if (type === 'header') {
      defaultSettings.text = "Estimated delivery";
      defaultSettings.subText = "Order today for delivery between {min_date} and {max_date}.";
      defaultSettings.icon = "truck";
      defaultSettings.iconPosition = "left";
      defaultSettings.align = "left";
      defaultSettings.fontSize = "md";
      defaultSettings.fontWeight = "700";
      defaultSettings.padding = 12;
      defaultSettings.iconSize = 24;
    }
    if (type === 'banner') {
      defaultSettings.type = "info";
      defaultSettings.styleType = "solid";
      defaultSettings.align = "left";
      defaultSettings.icon = "shield";
      defaultSettings.text = "Tracked shipping with clear delivery updates.";
    }
    if (type === 'progress') {
      defaultSettings.label = "Route prepared";
      defaultSettings.percentage = 70;
      defaultSettings.color = templatePalette.accent;
    }
    if (type === 'dual_info') {
      defaultSettings.leftIcon = "truck";
      defaultSettings.leftTitle = "Fast dispatch";
      defaultSettings.leftText = "Packed and handed to carrier by {ship_date}.";
      defaultSettings.rightIcon = "map_pin";
      defaultSettings.rightTitle = "Delivery window";
      defaultSettings.rightText = "Estimated arrival {min_date} - {max_date}.";
    }
    if (type === 'image') {
      defaultSettings.url = "/sample-product.png";
      defaultSettings.align = "center";
      defaultSettings.height = "120px";
    }
    if (type === 'divider') {
      defaultSettings.height = 1;
      defaultSettings.color = borderColor;
    }
    if (type === 'spacer') {
      defaultSettings.height = 16;
    }
    setBlocks([...blocks, hydrateBlockStyleSamples({ id, type: type as BlockType, settings: defaultSettings }, templatePalette)]);
    setActiveBlockId(id);
    setActiveTab(0);
  };

  const removeBlock = (id: string) => {
    setBlocks(blocks.filter(b => b.id !== id));
    if (activeBlockId === id) setActiveBlockId(null);
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const newBlocks = [...blocks];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= blocks.length) return;
    [newBlocks[index], newBlocks[target]] = [newBlocks[target], newBlocks[index]];
    setBlocks(newBlocks);
  };

  const updateBlockSettings = (id: string, newSettings: any) => {
    setBlocks((currentBlocks) =>
      currentBlocks.map(b => b.id === id ? { ...b, settings: { ...b.settings, ...newSettings } } : b),
    );
  };

  const getBlockSettings = (blockId: string) =>
    blocks.find((b) => b.id === blockId)?.settings || {};

  const updateStepItem = (blockId: string, itemId: string, patch: Partial<StepItemConfig>) => {
    const items = normalizeStepItems(getBlockSettings(blockId)).map((item) =>
      item.id === itemId ? { ...item, ...patch } : item,
    );
    updateBlockSettings(blockId, { items });
  };

  const addStepItem = (blockId: string) => {
    const items = normalizeStepItems(getBlockSettings(blockId));
    if (items.length >= 6) return;
    updateBlockSettings(blockId, {
      items: [
        ...items,
        {
          id: createEditorId("step"),
          label: "New step",
          subText: "{max_date}",
          icon: "package",
          ...sampleStepColors(templatePalette, items.length),
        },
      ],
    });
  };

  const removeStepItem = (blockId: string, itemId: string) => {
    const items = normalizeStepItems(getBlockSettings(blockId));
    if (items.length <= 2) return;
    updateBlockSettings(blockId, { items: items.filter((item) => item.id !== itemId) });
  };

  const moveStepItem = (blockId: string, index: number, direction: "up" | "down") => {
    const items = normalizeStepItems(getBlockSettings(blockId));
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= items.length) return;
    [items[index], items[target]] = [items[target], items[index]];
    updateBlockSettings(blockId, { items });
  };

  const updateTrustBadge = (blockId: string, badgeId: string, patch: Partial<TrustBadgeConfig>) => {
    const badges = normalizeTrustBadges(getBlockSettings(blockId)).map((badge) =>
      badge.id === badgeId ? { ...badge, ...patch } : badge,
    );
    updateBlockSettings(blockId, { badges });
  };

  const addTrustBadge = (blockId: string) => {
    const badges = normalizeTrustBadges(getBlockSettings(blockId));
    if (badges.length >= 8) return;
    updateBlockSettings(blockId, {
      badges: [
        ...badges,
        {
          id: createEditorId("trust"),
          icon: "shield",
          label: "Trust badge",
          subText: "Helpful detail",
          ...sampleTrustBadgeColors(templatePalette, badges.length),
        },
      ],
    });
  };

  const removeTrustBadge = (blockId: string, badgeId: string) => {
    const badges = normalizeTrustBadges(getBlockSettings(blockId));
    if (badges.length <= 1) return;
    updateBlockSettings(blockId, { badges: badges.filter((badge) => badge.id !== badgeId) });
  };

  const moveTrustBadge = (blockId: string, index: number, direction: "up" | "down") => {
    const badges = normalizeTrustBadges(getBlockSettings(blockId));
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= badges.length) return;
    [badges[index], badges[target]] = [badges[target], badges[index]];
    updateBlockSettings(blockId, { badges });
  };

  const updatePolicyItem = (blockId: string, itemId: string, patch: Partial<PolicyItemConfig>) => {
    const items = normalizePolicyItems(getBlockSettings(blockId)).map((item) =>
      item.id === itemId ? { ...item, ...patch } : item,
    );
    updateBlockSettings(blockId, { items });
  };

  const addPolicyItem = (blockId: string) => {
    const items = normalizePolicyItems(getBlockSettings(blockId));
    if (items.length >= 5) return;
    updateBlockSettings(blockId, {
      items: [
        ...items,
        {
          id: createEditorId("policy"),
          title: "Policy item",
          body: "Add a short customer-facing policy detail.",
          icon: "shield",
          ...samplePolicyItemColors(templatePalette, items.length),
        },
      ],
    });
  };

  const removePolicyItem = (blockId: string, itemId: string) => {
    const items = normalizePolicyItems(getBlockSettings(blockId));
    if (items.length <= 1) return;
    updateBlockSettings(blockId, { items: items.filter((item) => item.id !== itemId) });
  };

  const movePolicyItem = (blockId: string, index: number, direction: "up" | "down") => {
    const items = normalizePolicyItems(getBlockSettings(blockId));
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= items.length) return;
    [items[index], items[target]] = [items[target], items[index]];
    updateBlockSettings(blockId, { items });
  };

  const getActiveBlock = () => blocks.find(b => b.id === activeBlockId);

  const renderBlockEditor = () => {
    const activeBlock = getActiveBlock();
    if (!activeBlock) {
      return (
        <EmptyState
          heading="No block selected"
          image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
        >
          <Text as="p">Click on a block in the layers list or in the preview to edit its properties.</Text>
        </EmptyState>
      );
    }

    const { type, settings: s, id } = activeBlock;
    const stepUsesConnector = type === "steps" && (s.preset === "timeline_dots" || s.preset === "vertical");

    return (
      <BlockStack gap="400">
        <InlineStack align="space-between">
          <Text variant="headingMd" as="h3">Edit {getBlockLabel(type)}</Text>
          <Button variant="tertiary" tone="critical" icon={DeleteIcon} onClick={() => removeBlock(id)} />
        </InlineStack>
        
        <Divider />

        {type === 'header' && (
          <BlockStack gap="300">
            <TextField label="Text Content" value={s.text || ""} onChange={(v) => updateBlockSettings(id, { text: v })} autoComplete="off" multiline={2} />
            <TextField label="Sub-text" value={s.subText || ""} onChange={(v) => updateBlockSettings(id, { subText: v })} autoComplete="off" />
            <InlineStack gap="200">
               <div style={{ flex: 1 }}><Select label="Font Size" options={[{label:'Small',value:'sm'},{label:'Medium',value:'md'},{label:'Large',value:'lg'}]} value={s.fontSize || 'md'} onChange={(v) => updateBlockSettings(id, { fontSize: v })} /></div>
               <div style={{ flex: 1 }}><Select label="Weight" options={[{label:'Normal',value:'400'},{label:'Bold',value:'700'},{label:'Black',value:'900'}]} value={s.fontWeight || '700'} onChange={(v) => updateBlockSettings(id, { fontWeight: v })} /></div>
            </InlineStack>
            <RangeSlider label="Title Size" min={10} max={32} value={Number(s.titleFontSize ?? 14)} onChange={(v) => updateBlockSettings(id, { titleFontSize: Number(v) })} output />
            <RangeSlider label="Sub-text Size" min={9} max={24} value={Number(s.subTextFontSize ?? 12)} onChange={(v) => updateBlockSettings(id, { subTextFontSize: Number(v) })} output />
            <RangeSlider label="Text Gap" min={0} max={24} value={Number(s.textGap ?? 2)} onChange={(v) => updateBlockSettings(id, { textGap: Number(v) })} output />
            <InlineStack gap="200">
               <div style={{ flex: 1 }}><Select label="Alignment" options={[{label:'Left',value:'left'},{label:'Center',value:'center'},{label:'Right',value:'right'}]} value={s.align || 'center'} onChange={(v) => updateBlockSettings(id, { align: v })} /></div>
               <div style={{ flex: 1 }}><Select label="Icon Position" options={[{label:'Top',value:'top'},{label:'Bottom',value:'bottom'},{label:'Left',value:'left'},{label:'Right',value:'right'}]} value={s.iconPosition || 'top'} onChange={(v) => updateBlockSettings(id, { iconPosition: v })} /></div>
            </InlineStack>
            <Divider />
            <Text variant="bodySm" fontWeight="bold" as="p">Part Colors</Text>
            <ColorField label="Title Color" value={s.textColor || ""} onChange={(v) => updateBlockSettings(id, { textColor: v })} />
            <ColorField label="Sub-text Color" value={s.subTextColor || ""} onChange={(v) => updateBlockSettings(id, { subTextColor: v })} />
            <ColorField label="Icon Color" value={s.iconColor || ""} onChange={(v) => updateBlockSettings(id, { iconColor: v })} />
            <ColorField label="Background Fill" value={s.bgColor || ""} onChange={(v) => updateBlockSettings(id, { bgColor: v })} />
            <Divider />
            <Text variant="bodySm" fontWeight="bold" as="p">Shapes & Visuals</Text>
            <RangeSlider label="Icon Size" min={12} max={48} value={s.iconSize ?? 24} onChange={(v) => updateBlockSettings(id, { iconSize: v })} output />
            <RangeSlider label="Border Width" min={0} max={10} value={s.borderWidth ?? 0} onChange={(v) => updateBlockSettings(id, { borderWidth: v })} output />
            <RangeSlider label="Padding" min={0} max={40} value={s.padding ?? 8} onChange={(v) => updateBlockSettings(id, { padding: v })} output />
            <RangeSlider label="Rounding" min={0} max={100} value={s.borderRadius ?? 0} onChange={(v) => updateBlockSettings(id, { borderRadius: v })} output />
            <ColorField label="Border Color Override" value={s.borderColor || ""} onChange={(v) => updateBlockSettings(id, { borderColor: v })} />
            <Button onClick={() => setIconPickerTarget({ blockId: id, field: "icon", open: true })}>
              {s.icon ? `Change Icon: ${s.icon}` : 'Add Icon to Header'}
            </Button>
          </BlockStack>
        )}

        {type === 'steps' && (
          <BlockStack gap="400">
            {!s.preset ? (
              <BlockStack gap="400">
                <Text variant="bodyMd" as="p" tone="subdued">Choose a starting design for your steps:</Text>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {[
                    { id: 'timeline_dots', name: 'Standard Line', icon: ViewIcon },
                    { id: 'chevron', name: 'Elite Arrows', icon: ArrowUpIcon },
                    { id: 'split_segments', name: 'Premium Blocks', icon: LayoutColumns2Icon },
                    { id: 'boxed_cards', name: 'Boxed Cards', icon: DuplicateIcon },
                    { id: 'vertical', name: 'Vertical List', icon: ProductIcon },
                  ].map(p => (
                    <div 
                      key={p.id}
                      onClick={() => updateBlockSettings(id, { preset: p.id })}
                      style={{ 
                        cursor: 'pointer', padding: '16px', border: s.preset === p.id ? `2px solid ${iconColor}` : '1px solid #e1e3e5', 
                        borderRadius: '12px', textAlign: 'center', background: s.preset === p.id ? `${iconColor}05` : 'white',
                        transition: 'all 0.2s'
                      }}
                    >
                      <Icon source={p.icon} tone={s.preset === p.id ? 'caution' : 'base'} />
                      <Box paddingBlockStart="200">
                        <Text variant="bodySm" fontWeight="bold" as="p">{p.name}</Text>
                      </Box>
                    </div>
                  ))}
                </div>
              </BlockStack>
            ) : (
              <BlockStack gap="400">
                 <InlineStack align="space-between" blockAlign="center">
                    <Button variant="tertiary" onClick={() => updateBlockSettings(id, { preset: null })}>← Change Preset</Button>
                    <InlineStack gap="200">
                      <div style={{ width: '80px' }}>
                        <Select 
                          label="Decor" labelHidden
                          options={[{label:'None',value:'none'},{label:'❤️',value:'heart'},{label:'🚚',value:'truck'}]} 
                          value={s.decorator || 'none'} 
                          onChange={(v) => updateBlockSettings(id, { decorator: v })} 
                        />
                      </div>
                      {stepUsesConnector && (
                        <div style={{ width: '80px' }}>
                          <Select 
                            label="Line" labelHidden 
                            options={[{label:'Solid',value:'solid'},{label:'Dash',value:'dashed'},{label:'Dot',value:'dotted'}]} 
                            value={s.connectorStyle || 'solid'} 
                            onChange={(v) => updateBlockSettings(id, { connectorStyle: v })} 
                          />
                        </div>
                      )}
                    </InlineStack>
                  </InlineStack>
                  <Divider />
                  <Text variant="bodySm" fontWeight="bold" as="p">Visual Styling</Text>
                  <BlockStack gap="400">
                    <div style={{ touchAction: 'none' }}>
                      <RangeSlider 
                        label="Icon Size" min={12} max={48} 
                        value={Number(s.iconSize ?? 24)} 
                        onChange={(v) => updateBlockSettings(id, { iconSize: v })} 
                        output 
                      />
                    </div>
                    <div style={{ touchAction: 'none' }}>
                      <RangeSlider 
                        label="Item Radius" min={0} max={100} 
                        value={Number(s.borderRadius ?? 12)} 
                        onChange={(v) => updateBlockSettings(id, { borderRadius: v })} 
                        output 
                      />
                    </div>
                    <div style={{ touchAction: 'none', userSelect: 'none' }}>
                      <RangeSlider 
                        label="Border Thickness" min={0} max={20} step={0.5}
                        value={Number(s.borderWidth ?? 1)} 
                        onChange={(v) => updateBlockSettings(id, { borderWidth: Number(v) })} 
                        output 
                      />
                    </div>
                    <div style={{ touchAction: 'none' }}>
                      <RangeSlider 
                        label="Steps Spacing" min={0} max={40} 
                        value={Number(s.itemGap ?? 0)} 
                        onChange={(v) => updateBlockSettings(id, { itemGap: v })} 
                        output 
                      />
                    </div>
                    <div style={{ touchAction: 'none' }}>
                      <RangeSlider 
                        label="Item Padding" min={0} max={40} 
                        value={Number(s.padding ?? 16)} 
                        onChange={(v) => updateBlockSettings(id, { padding: v })} 
                        output 
                      />
                    </div>
                    <RangeSlider label="Label Size" min={10} max={24} value={Number(s.labelFontSize ?? 14)} onChange={(v) => updateBlockSettings(id, { labelFontSize: Number(v) })} output />
                    <RangeSlider label="Sub-text Size" min={9} max={20} value={Number(s.subTextFontSize ?? 12)} onChange={(v) => updateBlockSettings(id, { subTextFontSize: Number(v) })} output />
                    <RangeSlider label="Dot Border Width" min={0} max={8} value={Number(s.dotBorderWidth ?? 2)} onChange={(v) => updateBlockSettings(id, { dotBorderWidth: Number(v) })} output />
                  </BlockStack>
                  <Divider />
                
                {normalizeStepItems(s).map((item, index, items) => (
                  <div key={item.id} style={{ position: 'relative', zIndex: items.length - index }}>
                    <Card padding="300">
                      <BlockStack gap="200">
                        <InlineStack align="space-between" blockAlign="center">
                          <Text variant="bodySm" fontWeight="bold" as="p">Step {index + 1}</Text>
                          <InlineStack gap="100">
                            <Button icon={ArrowUpIcon} variant="tertiary" size="micro" disabled={index === 0} onClick={() => moveStepItem(id, index, "up")} />
                            <Button icon={ArrowDownIcon} variant="tertiary" size="micro" disabled={index === items.length - 1} onClick={() => moveStepItem(id, index, "down")} />
                            <Button icon={DeleteIcon} variant="tertiary" tone="critical" size="micro" disabled={items.length <= 2} onClick={() => removeStepItem(id, item.id)} />
                          </InlineStack>
                        </InlineStack>
                        <TextField
                          label="Label"
                          value={item.label}
                          onChange={(v) => updateStepItem(id, item.id, { label: v })}
                          autoComplete="off"
                        />
                        <TextField
                          label="Sub-text"
                          value={item.subText}
                          onChange={(v) => updateStepItem(id, item.id, { subText: v })}
                          autoComplete="off"
                        />
                        <Button onClick={() => setIconPickerTarget({ blockId: id, field: `stepItem:${item.id}`, open: true })}>
                          {item.icon ? `Icon: ${item.icon}` : 'Pick Icon'}
                        </Button>
                        <ColorField label="Step Background" value={item.bgColor || ""} onChange={(v) => updateStepItem(id, item.id, { bgColor: v })} />
                        <ColorField label="Dot Background" value={item.dotColor || ""} onChange={(v) => updateStepItem(id, item.id, { dotColor: v })} />
                        <ColorField label="Icon Color" value={item.iconColor || ""} onChange={(v) => updateStepItem(id, item.id, { iconColor: v })} />
                        <ColorField label="Label Color" value={item.labelColor || ""} onChange={(v) => updateStepItem(id, item.id, { labelColor: v })} />
                        <ColorField label="Sub-text Color" value={item.subTextColor || ""} onChange={(v) => updateStepItem(id, item.id, { subTextColor: v })} />
                        <ColorField label="Border Color" value={item.borderColor || ""} onChange={(v) => updateStepItem(id, item.id, { borderColor: v })} />
                      </BlockStack>
                    </Card>
                  </div>
                ))}
                <Button icon={PlusIcon} onClick={() => addStepItem(id)} disabled={normalizeStepItems(s).length >= 6}>
                  Add step
                </Button>
              </BlockStack>
            )}
          </BlockStack>
        )}

        {type === 'promise_card' && (
          <BlockStack gap="300">
            <TextField label="Title" value={s.title || ""} onChange={(v) => updateBlockSettings(id, { title: v })} autoComplete="off" />
            <TextField label="Subtitle" value={s.subtitle || ""} onChange={(v) => updateBlockSettings(id, { subtitle: v })} autoComplete="off" multiline={2} />
            <TextField label="Badge text" value={s.badgeText || ""} onChange={(v) => updateBlockSettings(id, { badgeText: v })} autoComplete="off" />
            <InlineStack gap="200">
              <div style={{ flex: 1 }}>
                <Select
                  label="Tone"
                  options={[
                    { label: "Success", value: "success" },
                    { label: "Info", value: "info" },
                    { label: "Warning", value: "warning" },
                    { label: "Premium", value: "premium" },
                  ]}
                  value={s.tone || "success"}
                  onChange={(v) => updateBlockSettings(id, { tone: v })}
                />
              </div>
              <div style={{ flex: 1 }}>
                <Select
                  label="Alignment"
                  options={[
                    { label: "Left", value: "left" },
                    { label: "Center", value: "center" },
                    { label: "Right", value: "right" },
                  ]}
                  value={s.align || "left"}
                  onChange={(v) => updateBlockSettings(id, { align: v })}
                />
              </div>
            </InlineStack>
            <Button onClick={() => setIconPickerTarget({ blockId: id, field: "icon", open: true })}>
              {s.icon ? `Icon: ${s.icon}` : "Pick Icon"}
            </Button>
            <ColorField label="Background" value={s.bgColor || ""} onChange={(v) => updateBlockSettings(id, { bgColor: v })} />
            <ColorField label="Border" value={s.borderColor || ""} onChange={(v) => updateBlockSettings(id, { borderColor: v })} />
            <ColorField label="Title Color" value={s.titleColor || s.textColor || ""} onChange={(v) => updateBlockSettings(id, { titleColor: v })} />
            <ColorField label="Subtitle Color" value={s.subtitleColor || ""} onChange={(v) => updateBlockSettings(id, { subtitleColor: v })} />
            <ColorField label="Icon" value={s.iconColor || ""} onChange={(v) => updateBlockSettings(id, { iconColor: v })} />
            <ColorField label="Icon Background" value={s.iconBgColor || ""} onChange={(v) => updateBlockSettings(id, { iconBgColor: v })} />
            <ColorField label="Badge Background" value={s.badgeBgColor || ""} onChange={(v) => updateBlockSettings(id, { badgeBgColor: v })} />
            <ColorField label="Badge Text" value={s.badgeTextColor || ""} onChange={(v) => updateBlockSettings(id, { badgeTextColor: v })} />
            <RangeSlider label="Icon Size" min={12} max={48} value={Number(s.iconSize ?? 24)} onChange={(v) => updateBlockSettings(id, { iconSize: Number(v) })} output />
            <RangeSlider label="Icon Box Size" min={28} max={72} value={Number(s.iconBoxSize ?? 42)} onChange={(v) => updateBlockSettings(id, { iconBoxSize: Number(v) })} output />
            <RangeSlider label="Icon Box Radius" min={0} max={80} value={Number(s.iconBoxRadius ?? 40)} onChange={(v) => updateBlockSettings(id, { iconBoxRadius: Number(v) })} output />
            <RangeSlider label="Title Size" min={10} max={26} value={Number(s.titleFontSize ?? 14)} onChange={(v) => updateBlockSettings(id, { titleFontSize: Number(v) })} output />
            <RangeSlider label="Subtitle Size" min={9} max={20} value={Number(s.subtitleFontSize ?? 12)} onChange={(v) => updateBlockSettings(id, { subtitleFontSize: Number(v) })} output />
            <RangeSlider label="Badge Size" min={9} max={18} value={Number(s.badgeFontSize ?? 11)} onChange={(v) => updateBlockSettings(id, { badgeFontSize: Number(v) })} output />
            <RangeSlider label="Badge Radius" min={0} max={80} value={Number(s.badgeRadius ?? 32)} onChange={(v) => updateBlockSettings(id, { badgeRadius: Number(v) })} output />
            <RangeSlider label="Gap" min={0} max={28} value={Number(s.gap ?? 12)} onChange={(v) => updateBlockSettings(id, { gap: Number(v) })} output />
            <RangeSlider label="Border Width" min={0} max={8} value={Number(s.borderWidth ?? 1)} onChange={(v) => updateBlockSettings(id, { borderWidth: Number(v) })} output />
            <RangeSlider label="Card Padding" min={8} max={40} value={Number(s.padding ?? 14)} onChange={(v) => updateBlockSettings(id, { padding: Number(v) })} output />
            <RangeSlider label="Card Radius" min={0} max={40} value={Number(s.borderRadius ?? 14)} onChange={(v) => updateBlockSettings(id, { borderRadius: Number(v) })} output />
          </BlockStack>
        )}

        {type === 'timer' && (
           <BlockStack gap="300">
              <TextField label="Remaining Text" value={s.text || ""} onChange={(v) => updateBlockSettings(id, { text: v })} autoComplete="off" />
              <ColorField label="Timer Background" value={s.bgColor || ""} onChange={(v) => updateBlockSettings(id, { bgColor: v })} />
              <ColorField label="Dot Color" value={s.color || iconColor} onChange={(v) => updateBlockSettings(id, { color: v })} />
              <ColorField label="Text Color" value={s.textColor || ""} onChange={(v) => updateBlockSettings(id, { textColor: v })} />
              <ColorField label="Border Color" value={s.borderColor || ""} onChange={(v) => updateBlockSettings(id, { borderColor: v })} />
              <RangeSlider label="Dot Size" min={6} max={24} value={Number(s.dotSize ?? 9)} onChange={(v) => updateBlockSettings(id, { dotSize: Number(v) })} output />
              <RangeSlider label="Text Size" min={10} max={24} value={Number(s.fontSize ?? 13)} onChange={(v) => updateBlockSettings(id, { fontSize: Number(v) })} output />
              <Select label="Text Weight" options={[{label:'Normal',value:'400'},{label:'Medium',value:'500'},{label:'Bold',value:'700'}]} value={String(s.fontWeight || '500')} onChange={(v) => updateBlockSettings(id, { fontWeight: v })} />
              <RangeSlider label="Padding" min={4} max={32} value={Number(s.padding ?? 10)} onChange={(v) => updateBlockSettings(id, { padding: Number(v) })} output />
              <RangeSlider label="Radius" min={0} max={40} value={Number(s.borderRadius ?? 12)} onChange={(v) => updateBlockSettings(id, { borderRadius: Number(v) })} output />
              <RangeSlider label="Gap" min={0} max={24} value={Number(s.gap ?? 10)} onChange={(v) => updateBlockSettings(id, { gap: Number(v) })} output />
              <RangeSlider label="Border Width" min={0} max={8} value={Number(s.borderWidth ?? 0)} onChange={(v) => updateBlockSettings(id, { borderWidth: Number(v) })} output />
              <InlineStack align="space-between" blockAlign="center">
                 <Text variant="bodyMd" as="p">Pulse Animation</Text>
                 <Button variant="secondary" pressed={s.animate !== false} onClick={() => updateBlockSettings(id, { animate: s.animate === false })}>
                   {s.animate !== false ? 'Enabled' : 'Disabled'}
                 </Button>
              </InlineStack>
           </BlockStack>
        )}

        {type === 'banner' && (
           <BlockStack gap="300">
              <Select label="Theme" options={[{label:'Info',value:'info'},{label:'Success',value:'success'},{label:'Warning',value:'warning'},{label:'Error',value:'error'}]} value={s.type || 'info'} onChange={(v) => updateBlockSettings(id, { type: v })} />
              <Select label="Style" options={[{label:'Light Solid',value:'solid'},{label:'Gradient',value:'gradient'},{label:'Outline',value:'outline'}]} value={s.styleType || 'solid'} onChange={(v) => updateBlockSettings(id, { styleType: v })} />
              <Select label="Alignment" options={[{label:'Left',value:'left'},{label:'Center',value:'center'}]} value={s.align || 'left'} onChange={(v) => updateBlockSettings(id, { align: v })} />
              <TextField label="Message" value={s.text || ""} onChange={(v) => updateBlockSettings(id, { text: v })} autoComplete="off" />
              <Button onClick={() => setIconPickerTarget({ blockId: id, field: "icon", open: true })}>
                {s.icon ? `Icon: ${s.icon}` : 'Select Icon'}
              </Button>
              <ColorField label="Background Override" value={s.bgColor || ""} onChange={(v) => updateBlockSettings(id, { bgColor: v })} />
              <ColorField label="Text Color" value={s.textColor || ""} onChange={(v) => updateBlockSettings(id, { textColor: v })} />
              <ColorField label="Icon Color" value={s.iconColor || ""} onChange={(v) => updateBlockSettings(id, { iconColor: v })} />
              <ColorField label="Border Color" value={s.borderColor || ""} onChange={(v) => updateBlockSettings(id, { borderColor: v })} />
              <RangeSlider label="Icon Size" min={12} max={40} value={Number(s.iconSize ?? 20)} onChange={(v) => updateBlockSettings(id, { iconSize: Number(v) })} output />
              <RangeSlider label="Text Size" min={10} max={24} value={Number(s.fontSize ?? 14)} onChange={(v) => updateBlockSettings(id, { fontSize: Number(v) })} output />
              <Select label="Text Weight" options={[{label:'Normal',value:'400'},{label:'Medium',value:'500'},{label:'Bold',value:'700'}]} value={String(s.fontWeight || '400')} onChange={(v) => updateBlockSettings(id, { fontWeight: v })} />
              <RangeSlider label="Padding" min={6} max={32} value={Number(s.padding ?? 12)} onChange={(v) => updateBlockSettings(id, { padding: Number(v) })} output />
              <RangeSlider label="Radius" min={0} max={32} value={Number(s.borderRadius ?? 12)} onChange={(v) => updateBlockSettings(id, { borderRadius: Number(v) })} output />
              <RangeSlider label="Gap" min={0} max={24} value={Number(s.gap ?? 12)} onChange={(v) => updateBlockSettings(id, { gap: Number(v) })} output />
              <RangeSlider label="Border Width" min={0} max={8} value={Number(s.borderWidth ?? 1)} onChange={(v) => updateBlockSettings(id, { borderWidth: Number(v) })} output />
           </BlockStack>
        )}

        {type === 'policy_accordion' && (
          <BlockStack gap="300">
            <InlineStack align="space-between" blockAlign="center">
              <Text variant="bodyMd" as="p">Open first item</Text>
              <Button variant="secondary" pressed={s.openFirst !== false} onClick={() => updateBlockSettings(id, { openFirst: s.openFirst === false })}>
                {s.openFirst !== false ? "Enabled" : "Disabled"}
              </Button>
            </InlineStack>
            <Divider />
            {normalizePolicyItems(s).map((item, index, items) => (
              <Card key={item.id} padding="300">
                <BlockStack gap="200">
                  <InlineStack align="space-between" blockAlign="center">
                    <Text variant="bodySm" fontWeight="bold" as="p">Policy {index + 1}</Text>
                    <InlineStack gap="100">
                      <Button icon={ArrowUpIcon} variant="tertiary" size="micro" disabled={index === 0} onClick={() => movePolicyItem(id, index, "up")} />
                      <Button icon={ArrowDownIcon} variant="tertiary" size="micro" disabled={index === items.length - 1} onClick={() => movePolicyItem(id, index, "down")} />
                      <Button icon={DeleteIcon} variant="tertiary" tone="critical" size="micro" disabled={items.length <= 1} onClick={() => removePolicyItem(id, item.id)} />
                    </InlineStack>
                  </InlineStack>
                  <TextField label="Title" value={item.title} onChange={(v) => updatePolicyItem(id, item.id, { title: v })} autoComplete="off" />
                  <TextField label="Body" value={item.body} onChange={(v) => updatePolicyItem(id, item.id, { body: v })} autoComplete="off" multiline={3} />
                  <Button onClick={() => setIconPickerTarget({ blockId: id, field: `policyItem:${item.id}`, open: true })}>
                    {item.icon ? `Icon: ${item.icon}` : "Pick Icon"}
                  </Button>
                  <ColorField label="Item Background" value={item.bgColor || ""} onChange={(v) => updatePolicyItem(id, item.id, { bgColor: v })} />
                  <ColorField label="Item Border" value={item.borderColor || ""} onChange={(v) => updatePolicyItem(id, item.id, { borderColor: v })} />
                  <ColorField label="Icon Color" value={item.iconColor || ""} onChange={(v) => updatePolicyItem(id, item.id, { iconColor: v })} />
                  <ColorField label="Title Color" value={item.titleColor || ""} onChange={(v) => updatePolicyItem(id, item.id, { titleColor: v })} />
                  <ColorField label="Body Color" value={item.bodyColor || ""} onChange={(v) => updatePolicyItem(id, item.id, { bodyColor: v })} />
                </BlockStack>
              </Card>
            ))}
            <Button icon={PlusIcon} onClick={() => addPolicyItem(id)} disabled={normalizePolicyItems(s).length >= 5}>
              Add policy item
            </Button>
            <RangeSlider label="Item Radius" min={0} max={32} value={Number(s.itemRadius ?? 12)} onChange={(v) => updateBlockSettings(id, { itemRadius: Number(v) })} output />
            <RangeSlider label="Item Padding" min={8} max={28} value={Number(s.itemPadding ?? 12)} onChange={(v) => updateBlockSettings(id, { itemPadding: Number(v) })} output />
            <RangeSlider label="Icon Size" min={10} max={32} value={Number(s.iconSize ?? 18)} onChange={(v) => updateBlockSettings(id, { iconSize: Number(v) })} output />
            <RangeSlider label="Title Size" min={10} max={22} value={Number(s.titleFontSize ?? 13)} onChange={(v) => updateBlockSettings(id, { titleFontSize: Number(v) })} output />
            <RangeSlider label="Body Size" min={9} max={18} value={Number(s.bodyFontSize ?? 12)} onChange={(v) => updateBlockSettings(id, { bodyFontSize: Number(v) })} output />
            <RangeSlider label="Item Gap" min={4} max={24} value={Number(s.itemGap ?? 8)} onChange={(v) => updateBlockSettings(id, { itemGap: Number(v) })} output />
            <RangeSlider label="Border Width" min={0} max={8} value={Number(s.borderWidth ?? 1)} onChange={(v) => updateBlockSettings(id, { borderWidth: Number(v) })} output />
          </BlockStack>
        )}

        {type === 'dual_info' && (
           <BlockStack gap="400">
              <Card padding="300">
                 <BlockStack gap="200">
                    <Text variant="bodySm" fontWeight="bold" as="p">Left Column</Text>
                    <TextField label="Title" value={s.leftTitle || ""} onChange={(v) => updateBlockSettings(id, { leftTitle: v })} autoComplete="off" />
                    <TextField label="Text" value={s.leftText || ""} onChange={(v) => updateBlockSettings(id, { leftText: v })} autoComplete="off" multiline={2} />
                    <Button onClick={() => setIconPickerTarget({ blockId: id, field: "leftIcon", open: true })}>Icon: {s.leftIcon || 'monitor'}</Button>
                    <ColorField label="Card Background" value={s.leftBgColor || ""} onChange={(v) => updateBlockSettings(id, { leftBgColor: v })} />
                    <ColorField label="Title Color" value={s.leftTitleColor || ""} onChange={(v) => updateBlockSettings(id, { leftTitleColor: v })} />
                    <ColorField label="Text Color" value={s.leftTextColor || ""} onChange={(v) => updateBlockSettings(id, { leftTextColor: v })} />
                    <ColorField label="Icon Color" value={s.leftIconColor || ""} onChange={(v) => updateBlockSettings(id, { leftIconColor: v })} />
                    <ColorField label="Border Color" value={s.leftBorderColor || ""} onChange={(v) => updateBlockSettings(id, { leftBorderColor: v })} />
                 </BlockStack>
              </Card>
              <Card padding="300">
                 <BlockStack gap="200">
                    <Text variant="bodySm" fontWeight="bold" as="p">Right Column</Text>
                    <TextField label="Title" value={s.rightTitle || ""} onChange={(v) => updateBlockSettings(id, { rightTitle: v })} autoComplete="off" />
                    <TextField label="Text" value={s.rightText || ""} onChange={(v) => updateBlockSettings(id, { rightText: v })} autoComplete="off" multiline={2} />
                    <Button onClick={() => setIconPickerTarget({ blockId: id, field: "rightIcon", open: true })}>Icon: {s.rightIcon || 'store'}</Button>
                    <ColorField label="Card Background" value={s.rightBgColor || ""} onChange={(v) => updateBlockSettings(id, { rightBgColor: v })} />
                    <ColorField label="Title Color" value={s.rightTitleColor || ""} onChange={(v) => updateBlockSettings(id, { rightTitleColor: v })} />
                    <ColorField label="Text Color" value={s.rightTextColor || ""} onChange={(v) => updateBlockSettings(id, { rightTextColor: v })} />
                    <ColorField label="Icon Color" value={s.rightIconColor || ""} onChange={(v) => updateBlockSettings(id, { rightIconColor: v })} />
                    <ColorField label="Border Color" value={s.rightBorderColor || ""} onChange={(v) => updateBlockSettings(id, { rightBorderColor: v })} />
                 </BlockStack>
              </Card>
              <RangeSlider label="Card Radius" min={0} max={32} value={Number(s.cardRadius ?? 16)} onChange={(v) => updateBlockSettings(id, { cardRadius: Number(v) })} output />
              <RangeSlider label="Card Padding" min={8} max={36} value={Number(s.cardPadding ?? 20)} onChange={(v) => updateBlockSettings(id, { cardPadding: Number(v) })} output />
              <RangeSlider label="Icon Size" min={12} max={48} value={Number(s.iconSize ?? 28)} onChange={(v) => updateBlockSettings(id, { iconSize: Number(v) })} output />
              <RangeSlider label="Title Size" min={10} max={24} value={Number(s.titleFontSize ?? 14)} onChange={(v) => updateBlockSettings(id, { titleFontSize: Number(v) })} output />
              <RangeSlider label="Text Size" min={9} max={20} value={Number(s.textFontSize ?? 12)} onChange={(v) => updateBlockSettings(id, { textFontSize: Number(v) })} output />
              <RangeSlider label="Column Gap" min={4} max={32} value={Number(s.columnGap ?? 16)} onChange={(v) => updateBlockSettings(id, { columnGap: Number(v) })} output />
              <RangeSlider label="Card Gap" min={0} max={24} value={Number(s.cardGap ?? 8)} onChange={(v) => updateBlockSettings(id, { cardGap: Number(v) })} output />
              <RangeSlider label="Border Width" min={0} max={8} value={Number(s.borderWidth ?? 1)} onChange={(v) => updateBlockSettings(id, { borderWidth: Number(v) })} output />
           </BlockStack>
        )}

        {type === 'progress' && (
           <BlockStack gap="300">
              <TextField label="Label" value={s.label || ""} onChange={(v) => updateBlockSettings(id, { label: v })} autoComplete="off" />
              <RangeSlider label="Progress Percentage" min={0} max={100} value={s.percentage || 75} onChange={(v) => updateBlockSettings(id, { percentage: v })} output />
              <ColorField label="Label Color" value={s.labelColor || ""} onChange={(v) => updateBlockSettings(id, { labelColor: v })} />
              <ColorField label="Track Color" value={s.trackColor || ""} onChange={(v) => updateBlockSettings(id, { trackColor: v })} />
              <ColorField label="Fill Color" value={s.color || iconColor} onChange={(v) => updateBlockSettings(id, { color: v })} />
              <ColorField label="Track Border" value={s.trackBorderColor || ""} onChange={(v) => updateBlockSettings(id, { trackBorderColor: v })} />
              <Select label="Fill Style" options={[{label:'Solid',value:'solid'},{label:'Gradient',value:'gradient'}]} value={s.fillStyle || 'solid'} onChange={(v) => updateBlockSettings(id, { fillStyle: v })} />
              <ColorField label="Fill Gradient End" value={s.gradientEndColor || ""} onChange={(v) => updateBlockSettings(id, { gradientEndColor: v })} />
              <RangeSlider label="Label Size" min={10} max={24} value={Number(s.labelFontSize ?? 14)} onChange={(v) => updateBlockSettings(id, { labelFontSize: Number(v) })} output />
              <RangeSlider label="Track Height" min={4} max={24} value={Number(s.height ?? 10)} onChange={(v) => updateBlockSettings(id, { height: Number(v) })} output />
              <RangeSlider label="Track Radius" min={0} max={24} value={Number(s.radius ?? 20)} onChange={(v) => updateBlockSettings(id, { radius: Number(v) })} output />
              <RangeSlider label="Track Border Width" min={0} max={8} value={Number(s.trackBorderWidth ?? 0)} onChange={(v) => updateBlockSettings(id, { trackBorderWidth: Number(v) })} output />
           </BlockStack>
        )}

        {type === 'trust_badges' && (
          <BlockStack gap="300">
            {normalizeTrustBadges(s).map((badge, index, badges) => (
              <Card key={badge.id} padding="300">
                <BlockStack gap="200">
                  <InlineStack align="space-between" blockAlign="center">
                    <Text variant="bodySm" fontWeight="bold" as="p">Badge {index + 1}</Text>
                    <InlineStack gap="100">
                      <Button icon={ArrowUpIcon} variant="tertiary" size="micro" disabled={index === 0} onClick={() => moveTrustBadge(id, index, "up")} />
                      <Button icon={ArrowDownIcon} variant="tertiary" size="micro" disabled={index === badges.length - 1} onClick={() => moveTrustBadge(id, index, "down")} />
                      <Button icon={DeleteIcon} variant="tertiary" tone="critical" size="micro" disabled={badges.length <= 1} onClick={() => removeTrustBadge(id, badge.id)} />
                    </InlineStack>
                  </InlineStack>
                  <TextField label="Label" value={badge.label} onChange={(v) => updateTrustBadge(id, badge.id, { label: v })} autoComplete="off" />
                  <TextField label="Sub-text" value={badge.subText} onChange={(v) => updateTrustBadge(id, badge.id, { subText: v })} autoComplete="off" />
                  <Button onClick={() => setIconPickerTarget({ blockId: id, field: `trustBadge:${badge.id}`, open: true })}>
                    {badge.icon ? `Icon: ${badge.icon}` : "Pick Icon"}
                  </Button>
                  <ColorField label="Badge Background" value={badge.bgColor || ""} onChange={(v) => updateTrustBadge(id, badge.id, { bgColor: v })} />
                  <ColorField label="Badge Border" value={badge.borderColor || ""} onChange={(v) => updateTrustBadge(id, badge.id, { borderColor: v })} />
                  <ColorField label="Icon Color" value={badge.iconColor || ""} onChange={(v) => updateTrustBadge(id, badge.id, { iconColor: v })} />
                  <ColorField label="Label Color" value={badge.labelColor || ""} onChange={(v) => updateTrustBadge(id, badge.id, { labelColor: v })} />
                  <ColorField label="Sub-text Color" value={badge.subTextColor || ""} onChange={(v) => updateTrustBadge(id, badge.id, { subTextColor: v })} />
                </BlockStack>
              </Card>
            ))}
            <Button icon={PlusIcon} onClick={() => addTrustBadge(id)} disabled={normalizeTrustBadges(s).length >= 8}>
              Add trust badge
            </Button>
            <RangeSlider label="Badge Icon Size" min={12} max={40} value={Number(s.iconSize ?? 24)} onChange={(v) => updateBlockSettings(id, { iconSize: Number(v) })} output />
            <RangeSlider label="Badge Padding" min={4} max={24} value={Number(s.itemPadding ?? 8)} onChange={(v) => updateBlockSettings(id, { itemPadding: Number(v) })} output />
            <RangeSlider label="Badge Radius" min={0} max={80} value={Number(s.itemRadius ?? 32)} onChange={(v) => updateBlockSettings(id, { itemRadius: Number(v) })} output />
            <RangeSlider label="Badge Gap" min={0} max={20} value={Number(s.itemGap ?? 8)} onChange={(v) => updateBlockSettings(id, { itemGap: Number(v) })} output />
            <RangeSlider label="Label Size" min={10} max={22} value={Number(s.labelFontSize ?? 14)} onChange={(v) => updateBlockSettings(id, { labelFontSize: Number(v) })} output />
            <RangeSlider label="Sub-text Size" min={9} max={18} value={Number(s.subTextFontSize ?? 12)} onChange={(v) => updateBlockSettings(id, { subTextFontSize: Number(v) })} output />
            <RangeSlider label="Row Gap" min={0} max={28} value={Number(s.rowGap ?? 12)} onChange={(v) => updateBlockSettings(id, { rowGap: Number(v) })} output />
          </BlockStack>
        )}

        {type === 'html' && (
           <BlockStack gap="300">
              <TextField label="HTML Code" value={s.code || ""} onChange={(v) => updateBlockSettings(id, { code: v })} autoComplete="off" multiline={5} />
           </BlockStack>
        )}

        {type === 'image' && (
           <BlockStack gap="300">
              <TextField label="Image URL" value={s.url || ""} onChange={(v) => updateBlockSettings(id, { url: v })} autoComplete="off" />
              <Select label="Alignment" options={[{label:'Left',value:'left'},{label:'Center',value:'center'},{label:'Right',value:'right'}]} value={s.align || 'center'} onChange={(v) => updateBlockSettings(id, { align: v })} />
              <TextField label="Height (px/auto)" value={s.height || 'auto'} onChange={(v) => updateBlockSettings(id, { height: v })} autoComplete="off" />
              <TextField label="Width (px/%/auto)" value={s.width || 'auto'} onChange={(v) => updateBlockSettings(id, { width: v })} autoComplete="off" />
              <ColorField label="Border Color" value={s.borderColor || ""} onChange={(v) => updateBlockSettings(id, { borderColor: v })} />
              <RangeSlider label="Border Width" min={0} max={10} value={Number(s.borderWidth ?? 0)} onChange={(v) => updateBlockSettings(id, { borderWidth: Number(v) })} output />
              <RangeSlider label="Image Radius" min={0} max={48} value={Number(s.borderRadius ?? 0)} onChange={(v) => updateBlockSettings(id, { borderRadius: Number(v) })} output />
              <Select label="Object Fit" options={[{label:'Contain',value:'contain'},{label:'Cover',value:'cover'},{label:'Fill',value:'fill'}]} value={s.objectFit || 'contain'} onChange={(v) => updateBlockSettings(id, { objectFit: v })} />
              <RangeSlider label="Opacity" min={20} max={100} value={Number(s.opacity ?? 100)} onChange={(v) => updateBlockSettings(id, { opacity: Number(v) })} output />
           </BlockStack>
        )}

        {type === 'divider' && (
           <BlockStack gap="300">
              <RangeSlider label="Height" min={1} max={10} value={s.height || 1} onChange={(v) => updateBlockSettings(id, { height: v })} output />
              <ColorField label="Color" value={s.color || borderColor} onChange={(v) => updateBlockSettings(id, { color: v })} />
           </BlockStack>
        )}

        {type === 'spacer' && (
           <RangeSlider label="Height" min={2} max={100} step={2} value={s.height || 16} onChange={(v) => updateBlockSettings(id, { height: v })} output />
        )}
      </BlockStack>
    );
  };

  const renderAnimationPanel = () => {
    const activeBlock = getActiveBlock();
    if (!activeBlock) {
      return (
        <EmptyState
          heading="No block selected"
          image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
        >
          <Text as="p">Select a layer first.</Text>
        </EmptyState>
      );
    }

    const { id, type, settings: s } = activeBlock;
    const enabled = s.iconAnimation === "lordicon";
    const enableLordicon = () => {
      updateBlockSettings(id, {
        iconAnimation: "lordicon",
        lordiconPreset: s.lordiconPreset || "auto",
        lordiconTrigger: s.lordiconTrigger || "loop",
        lordiconStroke: s.lordiconStroke || "regular",
        lordiconSpeed: Number(s.lordiconSpeed ?? 1),
        lordiconSize: Number(s.lordiconSize ?? s.iconSize ?? 32),
        lordiconPrimaryColor: s.lordiconPrimaryColor || iconColor,
        lordiconSecondaryColor: s.lordiconSecondaryColor || textColor,
      });
    };

    return (
      <BlockStack gap="400">
        <InlineStack align="space-between" blockAlign="center">
          <BlockStack gap="100">
            <Text variant="bodySm" tone="subdued" as="p">SELECTED LAYER</Text>
            <Text variant="headingMd" as="h3">{getBlockLabel(type)}</Text>
          </BlockStack>
          <Button
            variant="secondary"
            pressed={enabled}
            onClick={() => enabled ? updateBlockSettings(id, { iconAnimation: "none" }) : enableLordicon()}
          >
            {enabled ? "Lordicon On" : "Enable Lordicon"}
          </Button>
        </InlineStack>

        <Divider />

        {enabled ? (
          <BlockStack gap="300">
            <Select
              label="Lordicon Source"
              options={lordiconPresetOptions}
              value={s.lordiconPreset || "auto"}
              onChange={(v) => updateBlockSettings(id, { lordiconPreset: v })}
            />
            {s.lordiconPreset === "custom" && (
              <TextField
                label="Lordicon JSON URL"
                value={s.lordiconUrl || ""}
                onChange={(v) => updateBlockSettings(id, { lordiconUrl: v })}
                autoComplete="off"
                placeholder="/icons/animated/delivery-truck.json"
                helpText="Allowed: local /icons/animated/*.json or https://cdn.lordicon.com/*.json"
              />
            )}

            <InlineStack gap="200">
              <div style={{ flex: 1 }}>
                <Select
                  label="Trigger"
                  options={lordiconTriggerOptions}
                  value={s.lordiconTrigger === "loop-on-hover" ? "loop" : s.lordiconTrigger || "loop"}
                  onChange={(v) => updateBlockSettings(id, { lordiconTrigger: v })}
                />
              </div>
              <div style={{ flex: 1 }}>
                <Select
                  label="Stroke"
                  options={lordiconStrokeOptions}
                  value={s.lordiconStroke || "regular"}
                  onChange={(v) => updateBlockSettings(id, { lordiconStroke: v })}
                />
              </div>
            </InlineStack>

            <TextField
              label="Animation State"
              value={s.lordiconState || ""}
              onChange={(v) => updateBlockSettings(id, { lordiconState: v })}
              autoComplete="off"
              placeholder="Optional, e.g. hover-pinch"
            />

            <RangeSlider
              label="Animation Size"
              min={12}
              max={96}
              value={Number(s.lordiconSize ?? s.iconSize ?? 32)}
              onChange={(v) => updateBlockSettings(id, { lordiconSize: Number(v) })}
              output
            />
            <RangeSlider
              label="Playback Speed"
              min={0.25}
              max={3}
              step={0.25}
              value={Number(s.lordiconSpeed ?? 1)}
              onChange={(v) => updateBlockSettings(id, { lordiconSpeed: Number(v) })}
              output
            />

            <ColorField label="Primary Color" value={s.lordiconPrimaryColor || iconColor} onChange={(v) => updateBlockSettings(id, { lordiconPrimaryColor: v })} />
            <ColorField label="Secondary Color" value={s.lordiconSecondaryColor || textColor} onChange={(v) => updateBlockSettings(id, { lordiconSecondaryColor: v })} />

            <InlineStack align="space-between" blockAlign="center">
              <Text variant="bodyMd" as="p">Keep static icon visible</Text>
              <Button
                variant="secondary"
                pressed={s.lordiconKeepStatic === true}
                onClick={() => updateBlockSettings(id, { lordiconKeepStatic: s.lordiconKeepStatic !== true })}
              >
                {s.lordiconKeepStatic === true ? "Enabled" : "Disabled"}
              </Button>
            </InlineStack>
          </BlockStack>
        ) : (
          <Box padding="400" background="bg-fill-secondary" borderRadius="200">
            <Text variant="bodySm" tone="subdued" alignment="center" as="p">
              Lordicon is off for this component.
            </Text>
          </Box>
        )}
      </BlockStack>
    );
  };

  const tabs = [
    { id: 'layers', content: 'Layers', accessibilityLabel: 'Layers' },
    { id: 'style', content: 'Global Style', accessibilityLabel: 'Style' },
    { id: 'rules', content: 'Display Rules', accessibilityLabel: 'Rules' },
    { id: 'animation', content: 'Animation', accessibilityLabel: 'Animation' },
  ];

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f6f6f7' }}>
      
      {/* ─── STUDIO HEADER ─────────────────────────────────────────────────── */}
      <Box padding="300" background="bg-surface" borderBlockEndWidth="025" borderColor="border">
        <InlineStack align="space-between" blockAlign="center">
          <InlineStack gap="300" blockAlign="center">
            <Button icon={ChevronLeftIcon} variant="tertiary" onClick={() => navigate("/app/widgets")} />
            <Box width="1px" minHeight="24px" background="bg-fill-tertiary" />
            <div style={{ width: 250 }}>
              <TextField 
                label="Widget Name" labelHidden value={name} onChange={setName} autoComplete="off"
                placeholder="Untitled Widget"
              />
            </div>
            {isDefault && <Badge tone="info">Default</Badge>}
          </InlineStack>

          <InlineStack gap="300">
            <Box background="bg-fill-secondary" padding="100" borderRadius="200">
              <InlineStack gap="100">
                <Button 
                  icon={MobileIcon} variant={previewMode === 'mobile' ? 'secondary' : 'tertiary'} 
                  onClick={() => setPreviewMode('mobile')} 
                />
                <Button 
                  icon={DesktopIcon} variant={previewMode === 'desktop' ? 'secondary' : 'tertiary'} 
                  onClick={() => setPreviewMode('desktop')} 
                />
              </InlineStack>
            </Box>
            <Button variant="primary" icon={SaveIcon} onClick={() => handleSave()} loading={isSaving}>Save Studio</Button>
          </InlineStack>
        </InlineStack>
      </Box>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* ─── LEFT SIDEBAR (Library & Hierarchy) ─────────────────────────────── */}
        <div style={{ width: 300, background: 'white', borderRight: '1px solid #e1e3e5', display: 'flex', flexDirection: 'column' }}>
          <Tabs tabs={tabs} selected={activeTab} onSelect={setActiveTab} />
          
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
            {activeTab === 0 && (
              <BlockStack gap="400">
                <Text variant="bodySm" fontWeight="bold" tone="subdued" as="p">WIDGET LAYERS</Text>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {blocks.length === 0 ? (
                    <Box padding="400" background="bg-fill-secondary" borderRadius="200">
                      <Text variant="bodySm" tone="subdued" alignment="center" as="p">No blocks added yet.</Text>
                    </Box>
                  ) : (
                    blocks.map((b, i) => (
                      <div 
                        key={b.id} 
                        onClick={() => setActiveBlockId(b.id)}
                        style={{
                          padding: '10px 12px', borderRadius: '8px', 
                          border: `1px solid ${activeBlockId === b.id ? '#008060' : '#e1e3e5'}`,
                          background: activeBlockId === b.id ? '#f0fdf4' : 'white',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
                        }}
                      >
                        <Icon source={ProductIcon} tone={activeBlockId === b.id ? 'success' : 'subdued'} />
                        <div style={{ flex: 1 }}>
                          <Text variant="bodySm" fontWeight={activeBlockId === b.id ? 'bold' : 'regular'} as="p">
                            {getBlockLabel(b.type)}
                          </Text>
                        </div>
                        <div style={{ display: 'flex', gap: '4px' }}>
                           <Button icon={ArrowUpIcon} variant="tertiary" size="micro" disabled={i===0} onClick={() => moveBlock(i, 'up')} />
                           <Button icon={ArrowDownIcon} variant="tertiary" size="micro" disabled={i===blocks.length-1} onClick={() => moveBlock(i, 'down')} />
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <Divider />
                <Text variant="bodySm" fontWeight="bold" tone="subdued" as="p">ADD COMPONENTS</Text>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                   {['header', 'promise_card', 'steps', 'timer', 'banner', 'trust_badges', 'policy_accordion', 'progress', 'image', 'spacer', 'divider', 'dual_info'].map(t => (
                     <Button key={t} onClick={() => addBlock(t)} icon={PlusIcon} textAlign="left">
                        {getBlockLabel(t)}
                     </Button>
                   ))}
                </div>
              </BlockStack>
            )}

            {activeTab === 1 && (
              <BlockStack gap="400">
                <BlockStack gap="300">
                   <Text variant="bodySm" fontWeight="bold" tone="subdued" as="p">VISUAL PROPERTIES</Text>
                   <Select label="Widget Shadow" options={[{label:'None',value:'none'},{label:'Small',value:'sm'},{label:'Medium',value:'md'},{label:'Large',value:'lg'},{label:'Extra Large',value:'xl'}]} value={shadow} onChange={setShadow} />
                   <RangeSlider label="Edge Rounding" min={0} max={40} value={borderRadius} onChange={(value) => setBorderRadius(Number(value))} output />
                   <RangeSlider label="Container Padding" min={0} max={60} step={4} value={padding} onChange={(value) => setPadding(Number(value))} output />
                   <InlineStack align="space-between" blockAlign="center">
                      <Text variant="bodyMd" as="p">Glassmorphism Blur</Text>
                      <Button variant="secondary" pressed={glassmorphism} onClick={() => setGlassmorphism(!glassmorphism)}>
                        {glassmorphism ? 'Enabled' : 'Disabled'}
                      </Button>
                   </InlineStack>
                </BlockStack>

                <Divider />
                <BlockStack gap="300">
                   <Text variant="bodySm" fontWeight="bold" tone="subdued" as="p">COLORS & GRADIENTS</Text>
                   <ColorField label="Text Color" value={textColor} onChange={setTextColor} />
                   <ColorField label="Icon Accent" value={iconColor} onChange={setIconColor} />
                   <ColorField label="Background Fill" value={bgColor} onChange={setBgColor} />
                   <TextField label="Custom Gradient" value={bgGradient} onChange={setBgGradient} autoComplete="off" placeholder="linear-gradient(...)" />
                </BlockStack>
              </BlockStack>
            )}

            {activeTab === 2 && (
              <BlockStack gap="400">
                <Text variant="bodySm" fontWeight="bold" tone="subdued" as="p">WIDGET RULES</Text>
                <Box padding="400" background="bg-fill-info-secondary" borderRadius="200">
                  <Text as="p">These rules determine when this specific widget will be displayed.</Text>
                </Box>
                <BlockStack gap="300">
                   <TextField label="Target Countries (ISO Codes)" value={targetCountries.join(", ")} onChange={(v) => setTargetCountries(v.split(",").map(s => s.trim().toUpperCase()))} autoComplete="off" placeholder="US, VN, CA" helpText="Empty = All countries" />
                   <TextField label="Target Product IDs" value={targetProducts.join(", ")} onChange={(v) => setTargetProducts(v.split(",").map(s => s.trim()))} autoComplete="off" placeholder="1234567890, gid://shopify/Product/1234567890" helpText="Optional. Product-specific widgets take priority over country and tag rules." />
                   <TextField label="Target Product Tags" value={targetTags.join(", ")} onChange={(v) => setTargetTags(v.split(",").map(s => s.trim()))} autoComplete="off" placeholder="VIP, New, Pre-order" helpText="Empty = All products" />
                </BlockStack>
              </BlockStack>
            )}

            {activeTab === 3 && renderAnimationPanel()}
          </div>
        </div>

        {/* ─── CENTER CANVAS ────────────────────────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', background: '#edeeef', overflow: 'hidden', position: 'relative' }}>
          <div style={{
            width: previewMode === 'mobile' ? 375 : '100%',
            maxWidth: previewMode === 'desktop' ? 1000 : 375,
            height: previewMode === 'mobile' ? 667 : 'fit-content',
            background: 'white',
            borderRadius: previewMode === 'mobile' ? '32px' : '12px',
            border: '1px solid #e1e3e5',
            boxShadow: 'none',
            overflowY: 'auto',
            padding: previewMode === 'mobile' ? '24px' : '24px',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative'
          }}>
             <div onClick={() => setActiveBlockId(null)}>
                <WidgetPreviewRenderer 
                   settings={{
                     style: "custom",
                     blocks: blocks,
                     textColor, iconColor, bgColor, borderColor, borderRadius,
                     shadow: shadow as any, glassmorphism, padding, bgGradient, showTimeline,
                     step1Label: "Order", step1SubText: "Today", step1Icon: "bag",
                     step2Label: "Ship", step2SubText: "Tomorrow", step2Icon: "truck",
                     step3Label: "Delivery", step3SubText: "Friday", step3Icon: "home",
                   }}
                />
             </div>
          </div>
          <div style={{ position: 'absolute', bottom: 20, right: 20 }}>
             <Badge tone="info">Live Preview Mode</Badge>
          </div>
        </div>

        {/* ─── RIGHT SIDEBAR (Inspector) ─────────────────────────────────────── */}
        <div style={{ width: 320, background: 'white', borderLeft: '1px solid #e1e3e5', padding: '16px', overflowY: 'auto' }}>
           {renderBlockEditor()}
        </div>
      </div>

      <IconLibraryModal 
        isOpen={iconPickerTarget.open}
        onClose={() => setIconPickerTarget({ open: false })}
        onSelect={(selection: IconLibrarySelection) => {
           if (iconPickerTarget.blockId) {
             const field = iconPickerTarget.field || 'icon';
             const blockSettings = getBlockSettings(iconPickerTarget.blockId);
             if (field.startsWith("stepItem:")) {
               updateStepItem(iconPickerTarget.blockId, field.slice("stepItem:".length), { icon: selection.iconId });
             } else if (field.startsWith("trustBadge:")) {
               updateTrustBadge(iconPickerTarget.blockId, field.slice("trustBadge:".length), { icon: selection.iconId });
             } else if (field.startsWith("policyItem:")) {
               updatePolicyItem(iconPickerTarget.blockId, field.slice("policyItem:".length), { icon: selection.iconId });
             } else {
               updateBlockSettings(iconPickerTarget.blockId, { [field]: selection.iconId });
             }

             updateBlockSettings(iconPickerTarget.blockId, selection.animated
               ? {
                   iconAnimation: "lordicon",
                   lordiconPreset: "auto",
                   lordiconUrl: "",
                   lordiconState: "",
                   lordiconKeepStatic: false,
                   lordiconTrigger: "loop",
                   lordiconStroke: blockSettings.lordiconStroke || "regular",
                   lordiconSpeed: Number(blockSettings.lordiconSpeed ?? 1),
                   lordiconSize: Number(blockSettings.lordiconSize ?? blockSettings.iconSize ?? 32),
                   lordiconPrimaryColor: blockSettings.lordiconPrimaryColor || iconColor,
                   lordiconSecondaryColor: blockSettings.lordiconSecondaryColor || textColor,
                 }
               : { iconAnimation: "none" });
           }
           setIconPickerTarget({ open: false });
        }}
      />
    </div>
  );
}
