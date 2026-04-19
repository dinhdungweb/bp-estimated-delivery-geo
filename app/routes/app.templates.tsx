/**
 * BP: Estimated Delivery & Geo — Widget Template Builder
 * Copyright © 2025 BluePeaks. All rights reserved.
 */
import type { ActionFunctionArgs } from "react-router";
import { useSubmit, data as routerData, redirect } from "react-router";
import { WidgetPreviewRenderer, WidgetStyleId } from "../components/WidgetRenderer";
import { TEMPLATE_DEFAULTS } from "../constants/templateDefaults";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

// ─── Action ──────────────────────────────────────────────────────────────────
export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const templateId = formData.get("templateId") as string;

  if (!templateId || !TEMPLATE_DEFAULTS[templateId as WidgetStyleId]) {
    return routerData({ error: "Invalid template" }, { status: 400 });
  }

  const def = TEMPLATE_DEFAULTS[templateId as WidgetStyleId];

  // Tìm widget mặc định của shop
  const defaultWidget = await prisma.widget.findFirst({
    where: { shop: session.shop, isDefault: true }
  });

  const widgetData = {
    widgetStyle: "custom",
    customBlocks: def.customBlocks as any,
    textColor: def.textColor || "#000000",
    iconColor: def.iconColor || "#0033cc",
    bgColor: def.bgColor || "#ffffff",
    borderColor: def.borderColor || "#e5e7eb",
    borderRadius: def.borderRadius || 10,
    shadow: def.shadow || "none",
    glassmorphism: def.glassmorphism || false,
    padding: def.padding ?? 16,
    bgGradient: def.bgGradient || "",
    updatedAt: new Date(),
  };

  if (defaultWidget) {
    await prisma.widget.update({
      where: { id: defaultWidget.id },
      data: widgetData
    });
  } else {
    await prisma.widget.create({
      data: {
        shop: session.shop,
        name: "Main Widget",
        isDefault: true,
        isActive: true,
        ...widgetData
      }
    });
  }

  return redirect("/app/settings");
};

// ─── Templates Data ────────────────────────────────────────────────────────
const WIDGET_TEMPLATES = [
  {
    name: "Eco Delivery",
    description: "Eco-friendly design with modern icons and split segments.",
    style: "eco_delivery" as const,
  },
  {
    name: "Urgent Pulse",
    description: "Emphasize urgency with countdown timer and timeline.",
    style: "urgent_pulse" as const,
  },
  {
    name: "Express Alert",
    description: "Emergency alert design with pink-red tones.",
    style: "express_alert" as const,
  },
  {
    name: "Global Trust",
    description: "Trust badges and international shipping information.",
    style: "global_trust" as const,
  },
  {
    name: "Orange Blitz",
    description: "Bold orange timeline with free shipping banner.",
    style: "orange_blitz" as const,
  },
  {
    name: "Dark Glassmorphism",
    description: "Futuristic dark background with frosted glass effect.",
    style: "dark_glassmorphism" as const,
  },
  {
    name: "Simple Timeline",
    description: "Clean minimal timeline with orange accents.",
    style: "simple_timeline" as const,
  },
  {
    name: "Blue Boxed Cards",
    description: "Light blue background with boxed card steps.",
    style: "boxed_cards_blue" as const,
  },
  {
    name: "Shipping Period",
    description: "Warm orange/yellow theme showing shipping timeline.",
    style: "estimate_shipping_period" as const,
  },
  {
    name: "Minimal Cart",
    description: "Ultra-minimal with simple cart, truck, door icons.",
    style: "minimal_cart_truck" as const,
  },
  {
    name: "Dark Urgency",
    description: "Premium dark background with urgency message.",
    style: "dark_urgency" as const,
  },
  {
    name: "Trust Info List",
    description: "Comprehensive delivery info with multiple trust signals.",
    style: "trust_info_list" as const,
  },
  {
    name: "Vertical Yellow",
    description: "Warm yellow card with vertical timeline layout.",
    style: "vertical_yellow" as const,
  },
  {
    name: "Vertical Orange",
    description: "Vertical layout with orange dot accents.",
    style: "vertical_orange" as const,
  },
  {
    name: "Green Order Now",
    description: "Eco-friendly green banner with timeline.",
    style: "green_order_now" as const,
  },
  {
    name: "Red Moment Meter",
    description: "Urgency red theme with dotted connector.",
    style: "red_moment_meter" as const,
  },
  {
    name: "Blue Gradient",
    description: "Bold blue gradient with large icons.",
    style: "blue_gradient" as const,
  },
  {
    name: "Blue Boxed Steps",
    description: "Structured blue boxed steps.",
    style: "blue_boxed_steps" as const,
  },
  {
    name: "Yellow Progress",
    description: "Yellow background with blue progress bar.",
    style: "yellow_progress" as const,
  },
  {
    name: "Dual Cards",
    description: "Two-column layout for Online vs In-store delivery.",
    style: "dual_cards" as const,
  },
];

export default function TemplateBuilder() {
  const submit = useSubmit();

  const handleUseTemplate = (template: typeof WIDGET_TEMPLATES[0]) => {
    submit(
      { templateId: template.style, templateName: template.name },
      { method: "post" }
    );
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1a1a1a', marginBottom: '8px' }}>
          Professional Widget Templates
        </h1>
        <p style={{ color: '#666', fontSize: '16px' }}>
          Choose a pre-designed template to boost your store conversion. Everything is customizable.
        </p>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(2, 1fr)', 
        gap: '24px' 
      }}>
        {WIDGET_TEMPLATES.map((tpl) => (
          <div 
            key={tpl.style} 
            style={{ 
              background: 'white', 
              borderRadius: '16px', 
              border: '1px solid #e5e7eb',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div style={{ padding: '24px', background: '#f9fafb', flex: 1, display: 'flex', alignItems: 'center' }}>
               <WidgetPreviewRenderer
                 settings={{ 
                   ...TEMPLATE_DEFAULTS[tpl.style as WidgetStyleId], 
                   shadow: 'none' 
                 }}
               />
            </div>
            
            <div style={{ padding: '20px', borderTop: '1px solid #f3f4f6' }}>
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', marginBottom: '4px' }}>{tpl.name}</h3>
                <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.4' }}>{tpl.description}</p>
              </div>
              <button
                onClick={() => handleUseTemplate(tpl)}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: '#008060',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Use This Template
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
