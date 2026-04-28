import type { WidgetSettingsProps } from "../lib/delivery";

export const TEMPLATE_DEFAULTS: Record<string, WidgetSettingsProps> = {
  // -------------------------------------------------------------------------
  // ORIGINAL WORKING TEMPLATES (Cleaned & Fixed)
  // -------------------------------------------------------------------------

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
          step3Icon: "cart"
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
          step1Icon: "cart",
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
          step1Icon: "cart",
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
          step1Icon: "cart",
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

  // -------------------------------------------------------------------------
  // NEW TEMPLATES FROM IMAGES (Unique & Working)
  // -------------------------------------------------------------------------

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
          step1Icon: "cart",
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
          step1Icon: "cart",
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
          step1Icon: "cart",
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
          step1Icon: "cart",
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
          text: "Place your order now before the sale ends!",
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
          step1Icon: "cart",
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
          text: "Free Shipping to {COUNTRY_FLAG} {COUNTRY_NAME}",
          align: "left",
          fontSize: "sm",
          padding: 8
        }
      },
      {
        id: "h2",
        type: "header",
        settings: {
          text: "Order within next {countdown} for same day dispatch",
          align: "left",
          fontSize: "sm",
          padding: 8
        }
      },
      {
        id: "h3",
        type: "header",
        settings: {
          text: "Receive your order: {min_date} to {max_date}",
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
          step1Icon: "cart",
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
          text: "Estimated Delivery Date {min_date} to {max_date}",
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
          step1Icon: "cart",
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
          text: "Estimated Delivery Date {min_date} to {max_date}",
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
          step1Icon: "cart",
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
          text: "Order now. Delivery between {min_date} - {max_date}",
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
          step1Icon: "cart",
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
          step1Icon: "cart",
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
          step1Icon: "cart",
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
          step1Icon: "cart",
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

  animated_flash_sale: {
    style: "custom",
    textColor: "#3b0a0a",
    iconColor: "#ef4444",
    bgColor: "#fff7ed",
    borderColor: "#fecaca",
    borderRadius: 14,
    padding: 14,
    shadow: "sm",
    customBlocks: [
      {
        id: "afs-timer",
        type: "timer",
        settings: {
          text: "Order in {countdown} to lock this delivery window",
          bgColor: "#fee2e2",
          textColor: "#7f1d1d",
          color: "#ef4444"
        }
      },
      {
        id: "afs-steps",
        type: "steps",
        settings: {
          preset: "timeline_dots",
          connectorStyle: "solid",
          itemGap: 12,
          iconSize: 18,
          borderWidth: 2,
          step1Label: "Order today",
          step1SubText: "{order_date}",
          step1Icon: "clock",
          step2Label: "Priority pack",
          step2SubText: "{ship_date}",
          step2Icon: "rocket",
          step3Label: "Delivered",
          step3SubText: "{max_date}",
          step3Icon: "map_pin"
        }
      }
    ]
  },

  animated_soft_pulse: {
    style: "custom",
    textColor: "#0f172a",
    iconColor: "#2563eb",
    bgColor: "#eff6ff",
    borderColor: "#bfdbfe",
    borderRadius: 16,
    padding: 16,
    bgGradient: "linear-gradient(135deg, #eff6ff 0%, #ffffff 50%, #ecfeff 100%)",
    customBlocks: [
      {
        id: "asp-head",
        type: "header",
        settings: {
          text: "Live delivery estimate",
          subText: "{min_date} - {max_date}",
          align: "center",
          fontSize: "lg",
          icon: "truck",
          iconPosition: "top",
          iconSize: 28,
          padding: 8
        }
      },
      {
        id: "asp-progress",
        type: "progress",
        settings: {
          label: "Dispatch capacity",
          percentage: 72,
          color: "#2563eb"
        }
      },
      {
        id: "asp-steps",
        type: "steps",
        settings: {
          preset: "split_segments",
          itemGap: 8,
          borderRadius: 10,
          borderWidth: 1,
          step1Label: "Order",
          step1SubText: "{order_date}",
          step1Icon: "cart",
          step2Label: "Ship",
          step2SubText: "{ship_date}",
          step2Icon: "truck",
          step3Label: "Arrive",
          step3SubText: "{max_date}",
          step3Icon: "check_badge"
        }
      }
    ]
  },

  fashion_boutique_eta: {
    style: "custom",
    textColor: "#171717",
    iconColor: "#be185d",
    bgColor: "#fff1f2",
    borderColor: "#fecdd3",
    borderRadius: 14,
    padding: 16,
    customBlocks: [
      {
        id: "fbe-banner",
        type: "header",
        settings: {
          text: "Boutique delivery",
          subText: "Styled, packed, and delivered by {max_date}",
          styleType: "title_banner",
          bgColor: "#f9a8d4",
          textColor: "#500724",
          align: "center",
          padding: 14
        }
      },
      {
        id: "fbe-steps",
        type: "steps",
        settings: {
          preset: "boxed_cards",
          itemGap: 10,
          borderRadius: 12,
          borderWidth: 1,
          step1Label: "Order received",
          step1SubText: "{order_date}",
          step1Icon: "cart",
          step2Label: "Packed with care",
          step2SubText: "{ship_date}",
          step2Icon: "package",
          step3Label: "At your door",
          step3SubText: "{max_date}",
          step3Icon: "heart"
        }
      }
    ]
  },

  furniture_room_delivery: {
    style: "custom",
    textColor: "#1f2937",
    iconColor: "#92400e",
    bgColor: "#fffbeb",
    borderColor: "#fde68a",
    borderRadius: 14,
    padding: 16,
    customBlocks: [
      {
        id: "frd-head",
        type: "header",
        settings: {
          text: "Room-ready delivery",
          subText: "Estimated arrival {min_date} - {max_date}",
          align: "left",
          fontSize: "lg",
          icon: "store",
          iconPosition: "left",
          iconSize: 26,
          padding: 8
        }
      },
      {
        id: "frd-steps",
        type: "steps",
        settings: {
          preset: "vertical",
          connectorStyle: "solid",
          itemGap: 14,
          iconSize: 20,
          borderWidth: 2,
          step1Label: "Order confirmed",
          step1SubText: "{order_date}",
          step1Icon: "check_badge",
          step2Label: "Prepared for freight",
          step2SubText: "{ship_date}",
          step2Icon: "box",
          step3Label: "Delivered to address",
          step3SubText: "{max_date}",
          step3Icon: "truck"
        }
      }
    ]
  },

  electronics_express_lane: {
    style: "custom",
    textColor: "#0f172a",
    iconColor: "#0ea5e9",
    bgColor: "#f8fafc",
    borderColor: "#bae6fd",
    borderRadius: 12,
    padding: 14,
    customBlocks: [
      {
        id: "eel-head",
        type: "banner",
        settings: {
          text: "Express dispatch available for this item",
          type: "info",
          icon: "rocket",
          align: "left"
        }
      },
      {
        id: "eel-steps",
        type: "steps",
        settings: {
          preset: "chevron",
          itemGap: 0,
          iconSize: 18,
          step1Bg: "#e0f2fe",
          step2Bg: "#dbeafe",
          step3Bg: "#cffafe",
          step1Label: "Checkout",
          step1SubText: "{order_date}",
          step1Icon: "monitor",
          step2Label: "Fulfilled",
          step2SubText: "{ship_date}",
          step2Icon: "package",
          step3Label: "Delivered",
          step3SubText: "{max_date}",
          step3Icon: "truck"
        }
      }
    ]
  },

  beauty_care_delivery: {
    style: "custom",
    textColor: "#431407",
    iconColor: "#ea580c",
    bgColor: "#fff7ed",
    borderColor: "#fed7aa",
    borderRadius: 18,
    padding: 16,
    customBlocks: [
      {
        id: "bcd-head",
        type: "header",
        settings: {
          text: "Carefully packed beauty order",
          subText: "Arrives between {min_date} and {max_date}",
          align: "center",
          fontSize: "sm",
          icon: "heart",
          iconPosition: "top",
          iconSize: 24,
          padding: 8
        }
      },
      {
        id: "bcd-steps",
        type: "steps",
        settings: {
          preset: "boxed_steps",
          itemGap: 10,
          borderRadius: 14,
          borderWidth: 1,
          step1Label: "Order",
          step1SubText: "{order_date}",
          step1Icon: "cart",
          step2Label: "Wrapped",
          step2SubText: "{ship_date}",
          step2Icon: "package",
          step3Label: "Enjoy",
          step3SubText: "{max_date}",
          step3Icon: "heart"
        }
      }
    ]
  },

  process_compact_tracker: {
    style: "custom",
    textColor: "#111827",
    iconColor: "#16a34a",
    bgColor: "#ffffff",
    borderColor: "#dcfce7",
    borderRadius: 12,
    padding: 14,
    customBlocks: [
      {
        id: "pct-head",
        type: "header",
        settings: {
          text: "Order today. Delivery {min_date} - {max_date}",
          align: "center",
          fontSize: "sm",
          padding: 6
        }
      },
      {
        id: "pct-steps",
        type: "steps",
        settings: {
          preset: "thick",
          itemGap: 8,
          borderRadius: 10,
          borderWidth: 1,
          step1Bg: "#ecfdf5",
          step2Bg: "#f0fdf4",
          step3Bg: "#f7fee7",
          step1Label: "Placed",
          step1SubText: "{order_date}",
          step1Icon: "cart",
          step2Label: "Packed",
          step2SubText: "{ship_date}",
          step2Icon: "box",
          step3Label: "Delivered",
          step3SubText: "{max_date}",
          step3Icon: "check_badge"
        }
      }
    ]
  },

  process_vertical_story: {
    style: "custom",
    textColor: "#0f172a",
    iconColor: "#7c3aed",
    bgColor: "#faf5ff",
    borderColor: "#ddd6fe",
    borderRadius: 14,
    padding: 16,
    customBlocks: [
      {
        id: "pvs-head",
        type: "header",
        settings: {
          text: "Your order journey",
          subText: "Live estimate: {min_date} - {max_date}",
          align: "left",
          fontSize: "lg",
          padding: 6
        }
      },
      {
        id: "pvs-steps",
        type: "steps",
        settings: {
          preset: "vertical",
          connectorStyle: "dashed",
          itemGap: 16,
          iconSize: 22,
          borderWidth: 2,
          step1Label: "Order is confirmed",
          step1SubText: "{order_date}",
          step1Icon: "cart",
          step2Label: "Warehouse prepares parcel",
          step2SubText: "{ship_date}",
          step2Icon: "package",
          step3Label: "Courier arrives",
          step3SubText: "{max_date}",
          step3Icon: "map_pin"
        }
      }
    ]
  },

  dark_luxury_tracker: {
    style: "custom",
    textColor: "#f8fafc",
    iconColor: "#facc15",
    bgColor: "#111827",
    borderColor: "#374151",
    borderRadius: 16,
    padding: 16,
    shadow: "premium",
    bgGradient: "linear-gradient(135deg, #111827 0%, #020617 100%)",
    customBlocks: [
      {
        id: "dlt-head",
        type: "header",
        settings: {
          text: "Premium tracked delivery",
          subText: "Expected by {max_date}",
          align: "center",
          fontSize: "lg",
          icon: "shield",
          iconPosition: "top",
          iconSize: 26,
          padding: 8,
          textColor: "#f8fafc"
        }
      },
      {
        id: "dlt-steps",
        type: "steps",
        settings: {
          preset: "boxed_cards",
          itemGap: 10,
          borderRadius: 12,
          borderWidth: 1,
          step1Bg: "rgba(255,255,255,0.08)",
          step2Bg: "rgba(255,255,255,0.08)",
          step3Bg: "rgba(255,255,255,0.08)",
          step1Label: "Confirmed",
          step1SubText: "{order_date}",
          step1Icon: "check_badge",
          step2Label: "Insured ship",
          step2SubText: "{ship_date}",
          step2Icon: "truck",
          step3Label: "Signature",
          step3SubText: "{max_date}",
          step3Icon: "shield"
        }
      }
    ]
  },

  dark_neon_route: {
    style: "custom",
    textColor: "#e0f2fe",
    iconColor: "#22d3ee",
    bgColor: "#082f49",
    borderColor: "#0e7490",
    borderRadius: 16,
    padding: 16,
    bgGradient: "linear-gradient(135deg, #082f49 0%, #172554 100%)",
    customBlocks: [
      {
        id: "dnr-timer",
        type: "timer",
        settings: {
          text: "Fast lane closes in {countdown}",
          bgColor: "rgba(34,211,238,0.14)",
          textColor: "#e0f2fe",
          color: "#22d3ee"
        }
      },
      {
        id: "dnr-steps",
        type: "steps",
        settings: {
          preset: "timeline_dots",
          connectorStyle: "solid",
          itemGap: 14,
          iconSize: 18,
          borderWidth: 2,
          step1Label: "Signal",
          step1SubText: "{order_date}",
          step1Icon: "monitor",
          step2Label: "Route",
          step2SubText: "{ship_date}",
          step2Icon: "rocket",
          step3Label: "Drop-off",
          step3SubText: "{max_date}",
          step3Icon: "map_pin"
        }
      }
    ]
  },

  light_clean_eta: {
    style: "custom",
    textColor: "#111827",
    iconColor: "#111827",
    bgColor: "#ffffff",
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 14,
    customBlocks: [
      {
        id: "lce-head",
        type: "header",
        settings: {
          text: "Estimated delivery",
          subText: "{min_date} - {max_date}",
          align: "left",
          fontSize: "sm",
          padding: 4
        }
      },
      {
        id: "lce-divider",
        type: "divider",
        settings: {
          height: 1,
          color: "#e5e7eb"
        }
      },
      {
        id: "lce-steps",
        type: "steps",
        settings: {
          preset: "timeline_dots",
          connectorStyle: "solid",
          itemGap: 12,
          iconSize: 16,
          borderWidth: 1,
          step1Label: "Order",
          step1SubText: "{order_date}",
          step1Icon: "cart",
          step2Label: "Ship",
          step2SubText: "{ship_date}",
          step2Icon: "truck",
          step3Label: "Arrive",
          step3SubText: "{max_date}",
          step3Icon: "map_pin"
        }
      }
    ]
  },

  light_card_steps: {
    style: "custom",
    textColor: "#1e293b",
    iconColor: "#475569",
    bgColor: "#f8fafc",
    borderColor: "#cbd5e1",
    borderRadius: 14,
    padding: 16,
    customBlocks: [
      {
        id: "lcs-head",
        type: "header",
        settings: {
          text: "Delivery window",
          subText: "Receive it from {min_date} to {max_date}",
          align: "center",
          fontSize: "sm",
          padding: 8
        }
      },
      {
        id: "lcs-steps",
        type: "steps",
        settings: {
          preset: "boxed_cards",
          itemGap: 10,
          borderRadius: 10,
          borderWidth: 1,
          step1Label: "Order",
          step1SubText: "{order_date}",
          step1Icon: "cart",
          step2Label: "Ready",
          step2SubText: "{ship_date}",
          step2Icon: "box",
          step3Label: "Home",
          step3SubText: "{max_date}",
          step3Icon: "store"
        }
      }
    ]
  },

  informative_geo_trust: {
    style: "custom",
    textColor: "#164e63",
    iconColor: "#0891b2",
    bgColor: "#ecfeff",
    borderColor: "#a5f3fc",
    borderRadius: 14,
    padding: 16,
    customBlocks: [
      {
        id: "igt-country",
        type: "banner",
        settings: {
          text: "Shipping to {COUNTRY_NAME}: delivery from {min_date} to {max_date}",
          type: "success",
          icon: "map_pin",
          align: "left"
        }
      },
      {
        id: "igt-info",
        type: "dual_info",
        settings: {
          leftTitle: "Dispatch",
          leftText: "Leaves warehouse on {ship_date}",
          leftIcon: "package",
          rightTitle: "Coverage",
          rightText: "Tracked delivery to {COUNTRY_NAME}",
          rightIcon: "shield"
        }
      }
    ]
  },

  informative_dispatch_stack: {
    style: "custom",
    textColor: "#334155",
    iconColor: "#4f46e5",
    bgColor: "#ffffff",
    borderColor: "#ddd6fe",
    borderRadius: 14,
    padding: 16,
    customBlocks: [
      {
        id: "ids-head",
        type: "header",
        settings: {
          text: "Delivery details",
          subText: "Transparent dates before checkout",
          align: "left",
          fontSize: "lg",
          padding: 4
        }
      },
      {
        id: "ids-b1",
        type: "banner",
        settings: {
          text: "Order date: {order_date}",
          type: "info",
          icon: "cart",
          align: "left"
        }
      },
      {
        id: "ids-b2",
        type: "banner",
        settings: {
          text: "Ships from warehouse: {ship_date}",
          type: "warning",
          icon: "package",
          align: "left"
        }
      },
      {
        id: "ids-b3",
        type: "banner",
        settings: {
          text: "Estimated arrival: {min_date} - {max_date}",
          type: "success",
          icon: "truck",
          align: "left"
        }
      }
    ]
  },

  seasonal_holiday_gift: {
    style: "custom",
    textColor: "#14532d",
    iconColor: "#dc2626",
    bgColor: "#f0fdf4",
    borderColor: "#bbf7d0",
    borderRadius: 16,
    padding: 16,
    bgGradient: "linear-gradient(135deg, #f0fdf4 0%, #ffffff 45%, #fee2e2 100%)",
    customBlocks: [
      {
        id: "shg-head",
        type: "header",
        settings: {
          text: "Holiday delivery window",
          subText: "Order now for arrival by {max_date}",
          styleType: "title_banner",
          bgColor: "#dc2626",
          textColor: "#ffffff",
          align: "center",
          padding: 14
        }
      },
      {
        id: "shg-steps",
        type: "steps",
        settings: {
          preset: "timeline_dots",
          connectorStyle: "dashed",
          itemGap: 12,
          iconSize: 18,
          borderWidth: 2,
          step1Label: "Gift ordered",
          step1SubText: "{order_date}",
          step1Icon: "heart",
          step2Label: "Wrapped",
          step2SubText: "{ship_date}",
          step2Icon: "package",
          step3Label: "Delivered",
          step3SubText: "{max_date}",
          step3Icon: "store"
        }
      }
    ]
  },

  seasonal_summer_fresh: {
    style: "custom",
    textColor: "#064e3b",
    iconColor: "#0d9488",
    bgColor: "#f0fdfa",
    borderColor: "#99f6e4",
    borderRadius: 18,
    padding: 16,
    bgGradient: "linear-gradient(135deg, #f0fdfa 0%, #ecfeff 55%, #fef9c3 100%)",
    customBlocks: [
      {
        id: "ssf-head",
        type: "header",
        settings: {
          text: "Fresh summer shipping",
          subText: "Arrives between {min_date} and {max_date}",
          align: "center",
          fontSize: "lg",
          icon: "scooter",
          iconPosition: "top",
          iconSize: 28,
          padding: 8
        }
      },
      {
        id: "ssf-progress",
        type: "progress",
        settings: {
          label: "Route prepared",
          percentage: 58,
          color: "#0d9488"
        }
      },
      {
        id: "ssf-steps",
        type: "steps",
        settings: {
          preset: "split_segments",
          itemGap: 8,
          borderRadius: 12,
          borderWidth: 1,
          step1Label: "Order",
          step1SubText: "{order_date}",
          step1Icon: "cart",
          step2Label: "Packed",
          step2SubText: "{ship_date}",
          step2Icon: "box",
          step3Label: "Delivered",
          step3SubText: "{max_date}",
          step3Icon: "scooter"
        }
      }
    ]
  },
};
