import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
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
import { TEMPLATE_DEFAULTS } from "../constants/templateDefaults";
import type { WidgetStyleId } from "../components/WidgetRenderer";
import Chrome from '@uiw/react-color-chrome';
import { createPortal } from "react-dom";

// ─── Reusable Elite Pro Color Picker (Genuine Chrome Style) ──────────────────
const ColorField = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => {
  const [active, setActive] = useState(false);
  const [pickerPos, setPickerPos] = useState({ top: 0, left: 0 });
  const containerRef = React.useRef<HTMLDivElement>(null);
  
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
        background: value || '#000000', transition: 'all 0.2s',
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
            label={label} labelHidden value={value} onChange={onChange} autoComplete="off" prefix="#" 
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
                  color={value || '#000000'} 
                  onChange={(color: any) => onChange(color.hexa)} 
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
export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const widgetId = params.id;
  const url = new URL(request.url);
  const templateId = url.searchParams.get("template");
  
  if (widgetId === "new") {
    // Return default data based on template
    const defaultData = TEMPLATE_DEFAULTS[templateId as WidgetStyleId] || TEMPLATE_DEFAULTS.clean_horizontal;
    return routerData({ 
      widget: {
        id: "new",
        name: `New Widget (${templateId || 'General'})`,
        isActive: true,
        widgetStyle: defaultData.style,
        customBlocks: defaultData.customBlocks,
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
        targetTags: [],
      } 
    });
  }

  const result: any[] = await prisma.$queryRaw`SELECT * FROM "Widget" WHERE id = ${widgetId} AND shop = ${session.shop} LIMIT 1`;

  if (!result || result.length === 0) throw new Error("Widget not found");

  return routerData({ widget: result[0] });
};

// ─── Action ──────────────────────────────────────────────────────────────────
export const action = async ({ params, request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const id = params.id;
  const name = String(formData.get("name"));
  const isActive = formData.get("isActive") === "true";
  const widgetStyle = String(formData.get("widgetStyle"));
  const customBlocks = String(formData.get("customBlocks"));
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
  const targetCountries = String(formData.get("targetCountries"));
  const targetTags = String(formData.get("targetTags"));

  const data = {
    shop: session.shop,
    name,
    isActive,
    widgetStyle,
    customBlocks: JSON.parse(customBlocks),
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
    targetCountries: JSON.parse(targetCountries),
    targetTags: JSON.parse(targetTags),
  };

  if (id === "new") {
    const newWidget = await (prisma as any).widget.create({ data });
    return routerData({ success: true, newId: newWidget.id });
  }

  await prisma.$executeRaw`
    UPDATE "Widget" 
    SET 
      name = ${name}, 
      "isActive" = ${isActive}, 
      "widgetStyle" = ${widgetStyle}, 
      "customBlocks" = ${customBlocks}::jsonb,
      "textColor" = ${textColor},
      "iconColor" = ${iconColor},
      "bgColor" = ${bgColor},
      "borderColor" = ${borderColor},
      "borderRadius" = ${borderRadius},
      shadow = ${shadow},
      glassmorphism = ${glassmorphism},
      padding = ${padding},
      "bgGradient" = ${bgGradient},
      "showTimeline" = ${showTimeline},
      "targetCountries" = ${targetCountries}::jsonb,
      "targetTags" = ${targetTags}::jsonb,
      "updatedAt" = NOW()
    WHERE id = ${id} AND shop = ${session.shop}
  `;

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

  const [blocks, setBlocks] = useState<any[]>(Array.isArray(widget.customBlocks) ? widget.customBlocks : []);
  const [targetCountries, setTargetCountries] = useState<string[]>(Array.isArray(widget.targetCountries) ? widget.targetCountries as string[] : []);
  const [targetTags, setTargetTags] = useState<string[]>(Array.isArray(widget.targetTags) ? widget.targetTags as string[] : []);
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
    formData.append("targetTags", JSON.stringify(targetTags));
    
    submit(formData, { method: "post" });
  }, [name, isActive, isDefault, widgetStyle, blocks, textColor, iconColor, bgColor, borderColor, borderRadius, shadow, glassmorphism, padding, bgGradient, showTimeline, targetCountries, targetTags, submit]);

  const addBlock = (type: string) => {
    const id = `b${Date.now()}`;
    const defaultSettings: any = {};
    if (type === 'steps') {
      defaultSettings.borderRadius = 12;
      defaultSettings.itemGap = 16;
      defaultSettings.padding = 16;
      defaultSettings.iconSize = 24;
      defaultSettings.borderWidth = 1;
    }
    if (type === 'header') {
      defaultSettings.padding = 12;
      defaultSettings.iconSize = 24;
    }
    setBlocks([...blocks, { id, type, settings: defaultSettings }]);
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
    setBlocks(blocks.map(b => b.id === id ? { ...b, settings: { ...b.settings, ...newSettings } } : b));
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

    return (
      <BlockStack gap="400">
        <InlineStack align="space-between">
          <Text variant="headingMd" as="h3">Edit {type.replace('_',' ')}</Text>
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
            <InlineStack gap="200">
               <div style={{ flex: 1 }}><Select label="Alignment" options={[{label:'Left',value:'left'},{label:'Center',value:'center'},{label:'Right',value:'right'}]} value={s.align || 'center'} onChange={(v) => updateBlockSettings(id, { align: v })} /></div>
               <div style={{ flex: 1 }}><Select label="Icon Position" options={[{label:'Top',value:'top'},{label:'Bottom',value:'bottom'},{label:'Left',value:'left'},{label:'Right',value:'right'}]} value={s.iconPosition || 'top'} onChange={(v) => updateBlockSettings(id, { iconPosition: v })} /></div>
            </InlineStack>
            <Divider />
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
                      <div style={{ width: '80px' }}>
                        <Select 
                          label="Line" labelHidden 
                          options={[{label:'Solid',value:'solid'},{label:'Dash',value:'dashed'},{label:'Dot',value:'dotted'}]} 
                          value={s.connectorStyle || 'solid'} 
                          onChange={(v) => updateBlockSettings(id, { connectorStyle: v })} 
                        />
                      </div>
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
                        label="Inner Gap" min={0} max={40} 
                        value={Number(s.padding ?? 16)} 
                        onChange={(v) => updateBlockSettings(id, { padding: v })} 
                        output 
                      />
                    </div>
                  </BlockStack>
                  <Divider />
                
                {[1, 2, 3].map(num => (
                  <div key={num} style={{ position: 'relative', zIndex: 4 - num }}>
                    <Card padding="300">
                      <BlockStack gap="200">
                        <Text variant="bodySm" fontWeight="bold" as="p">Step {num}</Text>
                        <TextField 
                          label="Label" 
                          value={s[`step${num}Label`] || (num === 1 ? 'Order' : num === 2 ? 'Ship' : 'Delivery')} 
                          onChange={(v) => updateBlockSettings(id, { [`step${num}Label`]: v })} 
                          autoComplete="off" 
                        />
                        <TextField 
                          label="Sub-text" 
                          value={s[`step${num}SubText`] || (num === 1 ? 'Today' : num === 2 ? 'Tomorrow' : 'Friday')} 
                          onChange={(v) => updateBlockSettings(id, { [`step${num}SubText`]: v })} 
                          autoComplete="off" 
                        />
                        <Button onClick={() => setIconPickerTarget({ blockId: id, field: `step${num}Icon`, open: true })}>
                          {s[`step${num}Icon`] ? `Icon: ${s[`step${num}Icon`]}` : 'Pick Icon'}
                        </Button>
                        <ColorField label="Step Background" value={s[`step${num}Bg`] || ""} onChange={(v) => updateBlockSettings(id, { [`step${num}Bg`]: v })} />
                      </BlockStack>
                    </Card>
                  </div>
                ))}
              </BlockStack>
            )}
          </BlockStack>
        )}

        {type === 'timer' && (
           <BlockStack gap="300">
              <TextField label="Remaining Text" value={s.text || ""} onChange={(v) => updateBlockSettings(id, { text: v })} autoComplete="off" />
              <ColorField label="Pulse Color" value={s.color || iconColor} onChange={(v) => updateBlockSettings(id, { color: v })} />
              <ColorField label="Text Color Override" value={s.textColor || ""} onChange={(v) => updateBlockSettings(id, { textColor: v })} />
              <TextField label="Timer Format" value={s.timerFormat || "{countdown}"} onChange={(v) => updateBlockSettings(id, { timerFormat: v })} autoComplete="off" helpText="Placeholders: {countdown}" />
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
                 </BlockStack>
              </Card>
              <Card padding="300">
                 <BlockStack gap="200">
                    <Text variant="bodySm" fontWeight="bold" as="p">Right Column</Text>
                    <TextField label="Title" value={s.rightTitle || ""} onChange={(v) => updateBlockSettings(id, { rightTitle: v })} autoComplete="off" />
                    <TextField label="Text" value={s.rightText || ""} onChange={(v) => updateBlockSettings(id, { rightText: v })} autoComplete="off" multiline={2} />
                    <Button onClick={() => setIconPickerTarget({ blockId: id, field: "rightIcon", open: true })}>Icon: {s.rightIcon || 'store'}</Button>
                 </BlockStack>
              </Card>
           </BlockStack>
        )}

        {type === 'progress' && (
           <BlockStack gap="300">
              <TextField label="Label" value={s.label || ""} onChange={(v) => updateBlockSettings(id, { label: v })} autoComplete="off" />
              <RangeSlider label="Progress Percentage" min={0} max={100} value={s.percentage || 75} onChange={(v) => updateBlockSettings(id, { percentage: v })} output />
              <ColorField label="Bar Color" value={s.color || iconColor} onChange={(v) => updateBlockSettings(id, { color: v })} />
           </BlockStack>
        )}

        {type === 'trust_badges' && (
           <BlockStack gap="300">
              <Text variant="bodyMd" as="p">Badge Selection:</Text>
              <InlineStack gap="200">
                 {['shield', 'check', 'star', 'package', 'truck', 'gift'].map(b => (
                    <div key={b} onClick={() => {
                         const cur = s.badges || ['shield', 'check', 'star'];
                         const next = cur.includes(b) ? cur.filter((x:any) => x !== b) : [...cur, b];
                         updateBlockSettings(id, { badges: next });
                    }} style={{ cursor: 'pointer' }}>
                       <Badge tone={(s.badges || []).includes(b) ? 'success' : undefined}>{b}</Badge>
                    </div>
                 ))}
              </InlineStack>
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

  const tabs = [
    { id: 'layers', content: 'Layers', accessibilityLabel: 'Layers' },
    { id: 'style', content: 'Global Style', accessibilityLabel: 'Style' },
    { id: 'rules', content: 'Display Rules', accessibilityLabel: 'Rules' },
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
                            {b.type.charAt(0).toUpperCase() + b.type.slice(1)}
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
                   {['header', 'steps', 'timer', 'banner', 'trust_badges', 'progress', 'html', 'image', 'spacer', 'divider', 'dual_info'].map(t => (
                     <Button key={t} onClick={() => addBlock(t)} icon={PlusIcon} textAlign="left">
                        {t.replace('_',' ')}
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
                   <RangeSlider label="Edge Rounding" min={0} max={40} value={borderRadius} onChange={setBorderRadius} output />
                   <RangeSlider label="Container Padding" min={0} max={60} step={4} value={padding} onChange={setPadding} output />
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
                   <TextField label="Target Product Tags" value={targetTags.join(", ")} onChange={(v) => setTargetTags(v.split(",").map(s => s.trim()))} autoComplete="off" placeholder="VIP, New, Pre-order" helpText="Empty = All products" />
                </BlockStack>
              </BlockStack>
            )}
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
        onSelect={(icon: any) => {
           if (iconPickerTarget.blockId) {
             const field = iconPickerTarget.field || 'icon';
             updateBlockSettings(iconPickerTarget.blockId, { [field]: icon });
           }
           setIconPickerTarget({ open: false });
        }}
      />
    </div>
  );
}
