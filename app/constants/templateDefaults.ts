import { WidgetSettingsProps } from "../components/WidgetRenderer";

export const TEMPLATE_DEFAULTS: Record<string, WidgetSettingsProps> = {
  // ═══════════════════════════════════════════════════════════════════════════
  // ORIGINAL WORKING TEMPLATES (Cleaned & Fixed)
  // ═══════════════════════════════════════════════════════════════════════════

  eco_delivery: {
    style: "custom",
    textColor: "#064e3b",
    iconColor: "#059669",
    bgColor: "#ffffff",
    borderColor: "#d1fae5",
    borderRadius: 12,
    padding: 16,
    customBlocks: [
      {
        id: "s1",
        type: "steps",
        settings: {
          preset: "split_segments",
          itemGap: 12,
          borderWidth: 1,
          step1Label: "Order On",
          step1SubText: "{order_date}",
          step1Icon: "monitor",
          step2Label: "Production",
          step2SubText: "{ship_date}",
          step2Icon: "rocket",
          step3Label: "Delivered",
          step3SubText: "{max_date}",
          step3Icon: "bag"
        }
      }
    ]
  },

  urgent_pulse: {
    style: "custom",
    textColor: "#7f1d1d",
    iconColor: "#ef4444",
    bgColor: "#ffffff",
    borderColor: "#fecaca",
    borderRadius: 12,
    padding: 16,
    customBlocks: [
      {
        id: "h1",
        type: "header",
        settings: {
          text: "Moment Meter. Time is Ticking Order in {countdown} to get delivery",
          align: "center",
          fontSize: "sm",
          textColor: "#991b1b",
          padding: 12
        }
      },
      {
        id: "s1",
        type: "steps",
        settings: {
          preset: "timeline_dots",
          connectorStyle: "solid",
          borderRadius: 50,
          itemGap: 12,
          borderWidth: 2,
          step1Label: "Confirmed",
          step1SubText: "{order_date}",
          step1Icon: "bag",
          step2Label: "Transit",
          step2SubText: "{ship_date}",
          step2Icon: "truck",
          step3Label: "Arrived",
          step3SubText: "{max_date}",
          step3Icon: "map_pin"
        }
      }
    ]
  },

  express_alert: {
    style: "custom",
    textColor: "#111827",
    iconColor: "#ef4444",
    bgColor: "#fff1f2",
    borderColor: "#fecaca",
    borderRadius: 12,
    padding: 16,
    customBlocks: [
      {
        id: "b1",
        type: "banner",
        settings: {
          text: "Place your order now before the sale ends!",
          type: "warning",
          icon: "clock",
          align: "center"
        }
      },
      {
        id: "s1",
        type: "steps",
        settings: {
          preset: "timeline_dots",
          connectorStyle: "solid",
          borderRadius: 50,
          itemGap: 12,
          borderWidth: 2,
          step1Label: "Ordered",
          step1SubText: "{order_date}",
          step1Icon: "bag",
          step2Label: "Shipped",
          step2SubText: "{ship_date}",
          step2Icon: "package",
          step3Label: "Delivered",
          step3SubText: "{max_date}",
          step3Icon: "map_pin"
        }
      }
    ]
  },

  global_trust: {
    style: "custom",
    textColor: "#334155",
    iconColor: "#4f46e5",
    bgColor: "#ffffff",
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 16,
    customBlocks: [
      {
        id: "h1",
        type: "header",
        settings: {
          text: "Free Shipping to {COUNTRY_FLAG} {COUNTRY_NAME}",
          fontSize: "sm",
          icon: "map_pin",
          align: "left",
          padding: 8
        }
      },
      {
        id: "h2",
        type: "header",
        settings: {
          text: "Order within next {countdown} for same day dispatch",
          fontSize: "sm",
          align: "left",
          padding: 8
        }
      },
      {
        id: "s1",
        type: "steps",
        settings: {
          preset: "timeline_dots",
          connectorStyle: "solid",
          borderRadius: 50,
          itemGap: 12,
          borderWidth: 2,
          step1Label: "Ordered",
          step1SubText: "{order_date}",
          step1Icon: "bag",
          step2Label: "Shipped",
          step2SubText: "{ship_date}",
          step2Icon: "package",
          step3Label: "Delivery",
          step3SubText: "{max_date}",
          step3Icon: "check_badge"
        }
      }
    ]
  },

  orange_blitz: {
    style: "custom",
    textColor: "#111827",
    iconColor: "#f97316",
    bgColor: "#ffffff",
    borderColor: "#fed7aa",
    borderRadius: 12,
    padding: 16,
    customBlocks: [
      {
        id: "h1",
        type: "header",
        settings: {
          text: "FREE & FAST DELIVERY",
          align: "center",
          styleType: "title_banner",
          bgColor: "#fb923c",
          textColor: "#ffffff",
          padding: 12
        }
      },
      {
        id: "h2",
        type: "header",
        settings: {
          text: "Estimated Delivery Date {min_date} to {max_date}",
          fontSize: "sm",
          align: "center",
          padding: 12
        }
      },
      {
        id: "s1",
        type: "steps",
        settings: {
          preset: "timeline_dots",
          connectorStyle: "solid",
          borderRadius: 50,
          itemGap: 12,
          borderWidth: 2,
          step1Label: "Order Now",
          step1SubText: "{order_date}",
          step1Icon: "clock",
          step2Label: "Ready to Ship",
          step2SubText: "{ship_date}",
          step2Icon: "package",
          step3Label: "At Your Door",
          step3SubText: "{max_date}",
          step3Icon: "map_pin"
        }
      }
    ]
  },

  dark_glassmorphism: {
    style: "custom",
    textColor: "#ffffff",
    iconColor: "#38bdf8",
    bgColor: "#0f172a",
    borderColor: "#334155",
    borderRadius: 16,
    padding: 16,
    glassmorphism: true,
    shadow: "none",
    bgGradient: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
    customBlocks: [
      {
        id: "h1",
        type: "header",
        settings: {
          text: "Premium Express Delivery",
          textColor: "#38bdf8",
          fontSize: "lg",
          icon: "rocket",
          padding: 12
        }
      },
      {
        id: "s1",
        type: "steps",
        settings: {
          preset: "boxed_cards",
          itemGap: 12,
          borderWidth: 1,
          step1Label: "Confirmed",
          step1SubText: "{order_date}",
          step1Icon: "check_badge",
          step2Label: "Transit",
          step2SubText: "{ship_date}",
          step2Icon: "truck",
          step3Label: "Delivery",
          step3SubText: "{max_date}",
          step3Icon: "shield"
        }
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NEW TEMPLATES FROM IMAGES (Unique & Working)
  // ═══════════════════════════════════════════════════════════════════════════

  simple_timeline: {
    style: "custom",
    textColor: "#374151",
    iconColor: "#f59e0b",
    bgColor: "#ffffff",
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 16,
    customBlocks: [
      {
        id: "h1",
        type: "header",
        settings: {
          text: "Estimated Delivery Date {min_date} to {max_date}",
          align: "center",
          fontSize: "sm",
          padding: 12
        }
      },
      {
        id: "s1",
        type: "steps",
        settings: {
          preset: "timeline_dots",
          connectorStyle: "solid",
          borderRadius: 50,
          itemGap: 16,
          borderWidth: 2,
          step1Label: "Order Confirmed",
          step1SubText: "{order_date}",
          step1Icon: "bag",
          step2Label: "Shipped",
          step2SubText: "{ship_date}",
          step2Icon: "truck",
          step3Label: "At Your Doorstep",
          step3SubText: "{max_date}",
          step3Icon: "map_pin"
        }
      }
    ]
  },

  boxed_cards_blue: {
    style: "custom",
    textColor: "#1e3a8a",
    iconColor: "#3b82f6",
    bgColor: "#dbeafe",
    borderColor: "#93c5fd",
    borderRadius: 12,
    padding: 16,
    customBlocks: [
      {
        id: "h1",
        type: "header",
        settings: {
          text: "Estimated Delivery Date {min_date} to {max_date}",
          align: "center",
          fontSize: "sm",
          padding: 12
        }
      },
      {
        id: "s1",
        type: "steps",
        settings: {
          preset: "boxed_cards",
          itemGap: 12,
          borderWidth: 1,
          step1Label: "Order Now",
          step1SubText: "{order_date}",
          step1Icon: "bag",
          step2Label: "Ready to Ship",
          step2SubText: "{ship_date}",
          step2Icon: "truck",
          step3Label: "At your Doorstep",
          step3SubText: "{max_date}",
          step3Icon: "map_pin"
        }
      }
    ]
  },

  estimate_shipping_period: {
    style: "custom",
    textColor: "#92400e",
    iconColor: "#f59e0b",
    bgColor: "#ffffff",
    borderColor: "#fde68a",
    borderRadius: 12,
    padding: 16,
    customBlocks: [
      {
        id: "h1",
        type: "header",
        settings: {
          text: "Estimate shipping period",
          align: "left",
          fontSize: "sm",
          padding: 8
        }
      },
      {
        id: "s1",
        type: "steps",
        settings: {
          preset: "timeline_dots",
          connectorStyle: "solid",
          borderRadius: 50,
          itemGap: 16,
          borderWidth: 2,
          step1Label: "Ordered",
          step1SubText: "today",
          step1Icon: "bag",
          step2Label: "Shipping",
          step2SubText: "1 to 2 days",
          step2Icon: "truck",
          step3Label: "Delivery",
          step3SubText: "3 to 5 days",
          step3Icon: "map_pin"
        }
      }
    ]
  },

  minimal_cart_truck: {
    style: "custom",
    textColor: "#374151",
    iconColor: "#6b7280",
    bgColor: "#ffffff",
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 16,
    customBlocks: [
      {
        id: "s1",
        type: "steps",
        settings: {
          preset: "timeline_dots",
          connectorStyle: "solid",
          borderRadius: 50,
          itemGap: 16,
          borderWidth: 2,
          step1Label: "Order Now",
          step1SubText: "{order_date}",
          step1Icon: "bag",
          step2Label: "Ships",
          step2SubText: "{ship_date}",
          step2Icon: "truck",
          step3Label: "At your Door",
          step3SubText: "{max_date}",
          step3Icon: "map_pin"
        }
      }
    ]
  },

  dark_urgency: {
    style: "custom",
    textColor: "#f9fafb",
    iconColor: "#ffffff",
    bgColor: "#1f2937",
    borderColor: "#374151",
    borderRadius: 12,
    padding: 16,
    customBlocks: [
      {
        id: "h1",
        type: "header",
        settings: {
          text: "🚚 Place your order now before the sale ends!",
          align: "left",
          fontSize: "sm",
          padding: 12
        }
      },
      {
        id: "s1",
        type: "steps",
        settings: {
          preset: "timeline_dots",
          connectorStyle: "solid",
          borderRadius: 50,
          itemGap: 12,
          borderWidth: 2,
          step1Label: "Order On",
          step1SubText: "{order_date}",
          step1Icon: "bag",
          step2Label: "Production",
          step2SubText: "{ship_date}",
          step2Icon: "rocket",
          step3Label: "Delivered",
          step3SubText: "{max_date}",
          step3Icon: "map_pin"
        }
      }
    ]
  },

  trust_info_list: {
    style: "custom",
    textColor: "#374151",
    iconColor: "#f59e0b",
    bgColor: "#ffffff",
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 16,
    customBlocks: [
      {
        id: "h1",
        type: "header",
        settings: {
          text: "📦 Free Shipping to {COUNTRY_FLAG} {COUNTRY_NAME}",
          align: "left",
          fontSize: "sm",
          padding: 8
        }
      },
      {
        id: "h2",
        type: "header",
        settings: {
          text: "⏰ Order within next {countdown} for same day dispatch",
          align: "left",
          fontSize: "sm",
          padding: 8
        }
      },
      {
        id: "h3",
        type: "header",
        settings: {
          text: "🚚 Receive your order : {min_date} to {max_date}",
          align: "left",
          fontSize: "sm",
          padding: 8
        }
      },
      {
        id: "s1",
        type: "steps",
        settings: {
          preset: "timeline_dots",
          connectorStyle: "solid",
          borderRadius: 50,
          itemGap: 12,
          borderWidth: 2,
          step1Label: "Ordered",
          step1SubText: "{order_date}",
          step1Icon: "bag",
          step2Label: "Shipped",
          step2SubText: "{ship_date}",
          step2Icon: "truck",
          step3Label: "Delivered",
          step3SubText: "{max_date}",
          step3Icon: "map_pin"
        }
      }
    ]
  },

  vertical_yellow: {
    style: "custom",
    textColor: "#713f12",
    iconColor: "#f59e0b",
    bgColor: "#fef3c7",
    borderColor: "#fde68a",
    borderRadius: 12,
    padding: 16,
    customBlocks: [
      {
        id: "h1",
        type: "header",
        settings: {
          text: "📦 Estimated Delivery Date {min_date} to {max_date}",
          align: "left",
          fontSize: "sm",
          padding: 12
        }
      },
      {
        id: "s1",
        type: "steps",
        settings: {
          preset: "vertical",
          connectorStyle: "solid",
          borderRadius: 50,
          itemGap: 16,
          padding: 12,
          iconSize: 22,
          borderWidth: 2,
          step1Label: "Order successfully placed.",
          step1SubText: "{order_date}",
          step1Icon: "bag",
          step2Label: "Your order will be shipped.",
          step2SubText: "{ship_date}",
          step2Icon: "truck",
          step3Label: "It will arrive at your address.",
          step3SubText: "{max_date}",
          step3Icon: "map_pin"
        }
      }
    ]
  },

  vertical_orange: {
    style: "custom",
    textColor: "#1f2937",
    iconColor: "#f59e0b",
    bgColor: "#ffffff",
    borderColor: "#f3f4f6",
    borderRadius: 12,
    padding: 16,
    customBlocks: [
      {
        id: "h1",
        type: "header",
        settings: {
          text: "📦 Estimated Delivery Date {min_date} to {max_date}",
          align: "left",
          fontSize: "sm",
          icon: "package",
          padding: 12
        }
      },
      {
        id: "s1",
        type: "steps",
        settings: {
          preset: "vertical",
          connectorStyle: "solid",
          borderRadius: 50,
          itemGap: 16,
          padding: 12,
          iconSize: 22,
          borderWidth: 2,
          step1Label: "Ordered",
          step1SubText: "Order successfully placed.",
          step1Icon: "bag",
          step2Label: "Dispatched",
          step2SubText: "Your order will be dispatched.",
          step2Icon: "truck",
          step3Label: "Arrived",
          step3SubText: "It will arrive at your address.",
          step3Icon: "map_pin"
        }
      }
    ]
  },

  green_order_now: {
    style: "custom",
    textColor: "#14532d",
    iconColor: "#22c55e",
    bgColor: "#f0fdf4",
    borderColor: "#bbf7d0",
    borderRadius: 12,
    padding: 16,
    customBlocks: [
      {
        id: "h1",
        type: "header",
        settings: {
          text: "📦 Order now Delivery between : {min_date} - {max_date}",
          align: "left",
          fontSize: "sm",
          icon: "rocket",
          padding: 12
        }
      },
      {
        id: "s1",
        type: "steps",
        settings: {
          preset: "timeline_dots",
          connectorStyle: "solid",
          borderRadius: 50,
          itemGap: 12,
          borderWidth: 2,
          step1Label: "Order On",
          step1SubText: "{order_date}",
          step1Icon: "bag",
          step2Label: "Production",
          step2SubText: "{ship_date}",
          step2Icon: "rocket",
          step3Label: "Delivered",
          step3SubText: "{max_date}",
          step3Icon: "box"
        }
      }
    ]
  },

  red_moment_meter: {
    style: "custom",
    textColor: "#7f1d1d",
    iconColor: "#ef4444",
    bgColor: "#fee2e2",
    borderColor: "#fca5a5",
    borderRadius: 12,
    padding: 16,
    customBlocks: [
      {
        id: "h1",
        type: "header",
        settings: {
          text: "Moment Meter. Time is Ticking",
          align: "center",
          fontSize: "sm",
          padding: 8
        }
      },
      {
        id: "h2",
        type: "header",
        settings: {
          text: "Order in {countdown} to get delivery between",
          align: "center",
          fontSize: "sm",
          padding: 8
        }
      },
      {
        id: "s1",
        type: "steps",
        settings: {
          preset: "timeline_dots",
          connectorStyle: "dashed",
          borderRadius: 50,
          itemGap: 12,
          borderWidth: 2,
          step1Label: "Order On",
          step1SubText: "{order_date}",
          step1Icon: "heart",
          step2Label: "Production",
          step2SubText: "{ship_date}",
          step2Icon: "truck",
          step3Label: "Delivered",
          step3SubText: "{max_date}",
          step3Icon: "map_pin"
        }
      }
    ]
  },

  blue_gradient: {
    style: "custom",
    textColor: "#1e3a8a",
    iconColor: "#3b82f6",
    bgColor: "#dbeafe",
    borderColor: "#93c5fd",
    borderRadius: 12,
    padding: 16,
    customBlocks: [
      {
        id: "h1",
        type: "header",
        settings: {
          text: "Estimated Delivery Date {min_date} to {max_date}",
          align: "center",
          fontSize: "sm",
          padding: 12
        }
      },
      {
        id: "s1",
        type: "steps",
        settings: {
          preset: "boxed_cards",
          itemGap: 12,
          borderWidth: 1,
          iconSize: 28,
          step1Label: "Order Now",
          step1SubText: "{order_date}",
          step1Icon: "bag",
          step2Label: "Shipped",
          step2SubText: "{ship_date}",
          step2Icon: "truck",
          step3Label: "At Your Doorstep",
          step3SubText: "{max_date}",
          step3Icon: "map_pin"
        }
      }
    ]
  },

  blue_boxed_steps: {
    style: "custom",
    textColor: "#1e3a8a",
    iconColor: "#3b82f6",
    bgColor: "#bfdbfe",
    borderColor: "#93c5fd",
    borderRadius: 12,
    padding: 16,
    customBlocks: [
      {
        id: "h1",
        type: "header",
        settings: {
          text: "Receive your order : {min_date} to {max_date}",
          align: "center",
          fontSize: "sm",
          padding: 12
        }
      },
      {
        id: "s1",
        type: "steps",
        settings: {
          preset: "boxed_cards",
          itemGap: 12,
          borderWidth: 1,
          step1Label: "Order Now",
          step1SubText: "{order_date}",
          step1Icon: "bag",
          step2Label: "Ready to Ship",
          step2SubText: "{ship_date}",
          step2Icon: "truck",
          step3Label: "At your Doorstep",
          step3SubText: "{max_date}",
          step3Icon: "map_pin"
        }
      }
    ]
  },

  yellow_progress: {
    style: "custom",
    textColor: "#713f12",
    iconColor: "#3b82f6",
    bgColor: "#fef3c7",
    borderColor: "#fde68a",
    borderRadius: 12,
    padding: 16,
    customBlocks: [
      {
        id: "h1",
        type: "header",
        settings: {
          text: "Estimated Delivery Date {min_date} to {max_date}",
          align: "center",
          fontSize: "sm",
          padding: 12
        }
      },
      {
        id: "p1",
        type: "progress",
        settings: {
          label: "Delivery Progress",
          percentage: 33,
          color: "#3b82f6"
        }
      },
      {
        id: "s1",
        type: "steps",
        settings: {
          preset: "timeline_dots",
          connectorStyle: "solid",
          borderRadius: 50,
          itemGap: 16,
          borderWidth: 2,
          step1Label: "Ordered",
          step1SubText: "{order_date}",
          step1Icon: "bag",
          step2Label: "",
          step2SubText: "",
          step2Icon: "box",
          step3Label: "",
          step3SubText: "",
          step3Icon: "truck"
        }
      }
    ]
  },

  dual_cards: {
    style: "custom",
    textColor: "#0f172a",
    iconColor: "#0284c7",
    bgColor: "#ffffff",
    borderColor: "#cbd5e1",
    borderRadius: 12,
    padding: 16,
    customBlocks: [
      {
        id: "d1",
        type: "dual_info",
        settings: {
          leftTitle: "Online",
          leftText: "Expected Delivery on or before {min_date}",
          leftIcon: "monitor",
          rightTitle: "In Store",
          rightText: "Estimated arrival into store on before {max_date}",
          rightIcon: "store"
        }
      }
    ]
  },
};
