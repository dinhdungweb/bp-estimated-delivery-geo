export interface LordiconLibraryIcon {
  id: string;
  fileKey: string;
  name: string;
  src: string;
  hoverState: string;
  introState: string;
  loopState?: string;
}

const animatedIconPath = (fileName: string) => `/icons/animated/${fileName}.json`;

const animatedIcon = (
  id: string,
  fileKey: string,
  name: string,
  hoverState: string,
  introState: string,
  loopState?: string,
): LordiconLibraryIcon => ({
  id,
  fileKey,
  name,
  src: animatedIconPath(fileKey),
  hoverState,
  introState,
  loopState,
});

export const ANIMATED_ICONS: LordiconLibraryIcon[] = [
  animatedIcon("cart", "cart", "Shopping Cart", "hover-jump", "in-reveal"),
  animatedIcon("bag", "shopping-bag", "Shopping Bag", "hover-pinch", "in-reveal", "loop-cycle"),
  animatedIcon("package", "package-box", "Package Box", "hover-squeeze", "in-reveal"),
  animatedIcon("truck", "delivery-truck", "Delivery Truck", "hover-pinch", "in-reveal", "loop-cycle"),
  animatedIcon("map_pin", "location-pin", "Location Pin", "hover-jump", "in-jump", "loop-roll"),
  animatedIcon("home", "home-delivery", "Home Delivery", "hover-3d-roll", "in-reveal", "loop-3d-roll"),
  animatedIcon("clock", "cutoff-timer", "Cutoff Timer", "hover-pinch", "in-reveal", "loop-cycle"),
  animatedIcon("rocket", "express-dispatch", "Express Dispatch", "hover-flying", "in-flying", "loop-flying"),
  animatedIcon("shield", "protected", "Protected", "hover-click", "in-reveal"),
  animatedIcon("heart", "care-promise", "Care Promise", "hover-pinch", "in-reveal", "loop-cycle"),
  animatedIcon("store", "store-pickup", "Store Pickup", "hover-pinch", "in-reveal"),
  animatedIcon("monitor", "online-order", "Online Order", "hover-popup", "in-reveal"),
  animatedIcon("tag", "promo-tag", "Promo Tag", "hover-pinch", "in-reveal"),
];

const srcById = ANIMATED_ICONS.reduce<Record<string, string>>((acc, icon) => {
  acc[icon.id] = icon.src;
  return acc;
}, {});

export const LORDICON_PRESETS: Record<string, string> = {
  ...srcById,
  box: srcById.package,
  scooter: srcById.truck,
  plane: srcById.rocket,
  warehouse: srcById.store,
  route: srcById.map_pin,
  check_badge: srcById.shield,
  calendar: srcById.clock,
  sparkles: srcById.rocket,
};

const hoverStateById = ANIMATED_ICONS.reduce<Record<string, string>>((acc, icon) => {
  acc[icon.id] = icon.hoverState;
  return acc;
}, {});

const introStateById = ANIMATED_ICONS.reduce<Record<string, string>>((acc, icon) => {
  acc[icon.id] = icon.introState;
  return acc;
}, {});

const loopStateById = ANIMATED_ICONS.reduce<Record<string, string>>((acc, icon) => {
  if (icon.loopState) acc[icon.id] = icon.loopState;
  return acc;
}, {});

export const LORDICON_HOVER_STATES: Record<string, string> = {
  ...hoverStateById,
  box: hoverStateById.package,
  scooter: hoverStateById.truck,
  plane: hoverStateById.rocket,
  warehouse: hoverStateById.store,
  route: hoverStateById.map_pin,
  check_badge: hoverStateById.shield,
  calendar: hoverStateById.clock,
  sparkles: hoverStateById.rocket,
};

export const LORDICON_INTRO_STATES: Record<string, string> = {
  ...introStateById,
  box: introStateById.package,
  scooter: introStateById.truck,
  plane: introStateById.rocket,
  warehouse: introStateById.store,
  route: introStateById.map_pin,
  check_badge: introStateById.shield,
  calendar: introStateById.clock,
  sparkles: introStateById.rocket,
};

export const LORDICON_LOOP_STATES: Record<string, string> = {
  ...loopStateById,
  scooter: loopStateById.truck,
  plane: loopStateById.rocket,
  route: loopStateById.map_pin,
  calendar: loopStateById.clock,
  sparkles: loopStateById.rocket,
};

export const LORDICON_STATES_BY_FILE: Record<string, { hover: string; intro: string; loop?: string }> =
  ANIMATED_ICONS.reduce<Record<string, { hover: string; intro: string; loop?: string }>>((acc, icon) => {
    acc[icon.fileKey] = {
      hover: icon.hoverState,
      intro: icon.introState,
      loop: icon.loopState,
    };
    return acc;
  }, {});

export const LORDICON_URL_PATTERN = /^(?:\/icons\/animated\/[a-z0-9-]+\.json|https:\/\/cdn\.lordicon\.com\/[a-z0-9-]+\.json)$/i;
