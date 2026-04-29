import { createElement, useEffect, useState } from "react";
import { Modal, Tabs, TextField, Icon, Button, Box } from "@shopify/polaris";
import { SearchIcon, CheckCircleIcon } from "@shopify/polaris-icons";

import { IconList } from "./WidgetRenderer";
import {
  ANIMATED_ICONS,
  getAnimatedIconByIconId,
  makeAnimatedIconId,
} from "../lib/lordiconPresets";

const PREMIUM_VECTOR_ICONS = [
  { id: "bag", category: "premium", name: "Premium Order Bag" },
  { id: "cart", category: "premium", name: "Checkout Cart" },
  { id: "package", category: "premium", name: "Parcel Box" },
  { id: "box", category: "premium", name: "Package Case" },
  { id: "truck", category: "premium", name: "Delivery Truck" },
  { id: "scooter", category: "premium", name: "Local Courier" },
  { id: "plane", category: "premium", name: "Air Shipment" },
  { id: "warehouse", category: "premium", name: "Fulfillment Hub" },
  { id: "map_pin", category: "premium", name: "Delivery Pin" },
  { id: "route", category: "premium", name: "Route Tracking" },
  { id: "home", category: "premium", name: "Delivered Home" },
  { id: "shield", category: "premium", name: "Protected Delivery" },
  { id: "check_badge", category: "premium", name: "Verified Check" },
  { id: "clock", category: "premium", name: "Cutoff Timer" },
  { id: "calendar", category: "premium", name: "Delivery Date" },
  { id: "rocket", category: "premium", name: "Express Dispatch" },
  { id: "heart", category: "premium", name: "Care Promise" },
  { id: "store", category: "premium", name: "Store Pickup" },
  { id: "monitor", category: "premium", name: "Online Order" },
  { id: "tag", category: "premium", name: "Promo Tag" },
  { id: "sparkles", category: "premium", name: "Premium Promise" },
];

// Collection of premium vector icons and legacy PNG icons.
const ICONS_COLLECTION = [
  ...PREMIUM_VECTOR_ICONS,

  // Delivery (21 icons)
  { id: "/icons/delivery/cash-pin-map.png", category: "delivery", name: "Cash Pin Map" },
  { id: "/icons/delivery/compass-arrow.png", category: "delivery", name: "Compass Arrow" },
  { id: "/icons/delivery/earth-2.png", category: "delivery", name: "World Map" },
  { id: "/icons/delivery/house-1.png", category: "delivery", name: "Home" },
  { id: "/icons/delivery/house-chimney-smoke.png", category: "delivery", name: "Cottage" },
  { id: "/icons/delivery/house-home-building-2.png", category: "delivery", name: "Building" },
  { id: "/icons/delivery/maps-pin-1.png", category: "delivery", name: "Map Pin Red" },
  { id: "/icons/delivery/maps-pin-2.png", category: "delivery", name: "Map Pin Blue" },
  { id: "/icons/delivery/navigation-car-pin-1.png", category: "delivery", name: "Car Navigation" },
  { id: "/icons/delivery/pin-location-1.png", category: "delivery", name: "Location Finder" },
  { id: "/icons/delivery/real-estate-location-house-pin-1.png", category: "delivery", name: "House Finder 1" },
  { id: "/icons/delivery/real-estate-location-house-pin.png", category: "delivery", name: "House Finder 2" },
  { id: "/icons/delivery/style-one-pin-home.png", category: "delivery", name: "Modern Home Pin" },
  { id: "/icons/delivery/style-one-pin.png", category: "delivery", name: "Generic Pin" },
  { id: "/icons/delivery/style-three-pin-barn-1.png", category: "delivery", name: "Barn Pin" },
  { id: "/icons/delivery/style-three-pin-shelter.png", category: "delivery", name: "Shelter Pin" },
  { id: "/icons/delivery/style-three-pin-trailer.png", category: "delivery", name: "Trailer Pin" },
  { id: "/icons/delivery/style-three-style-pin-empty.png", category: "delivery", name: "Empty Pin" },
  { id: "/icons/delivery/style-two-pin-marker.png", category: "delivery", name: "Marker Pin" },
  { id: "/icons/delivery/sync-location.png", category: "delivery", name: "Sync Tracking" },
  { id: "/icons/delivery/trekking-map.png", category: "delivery", name: "Trekking Map" },

  // Shipping (18 icons)
  { id: "/icons/shipped/delivery-truck-2.png", category: "shipping", name: "Small Delivery Truck" },
  { id: "/icons/shipped/delivery-truck-3.png", category: "shipping", name: "Flatbed Truck" },
  { id: "/icons/shipped/delivery-truck-4.png", category: "shipping", name: "Logistics Truck" },
  { id: "/icons/shipped/delivery-truck-5.png", category: "shipping", name: "Quick Delivery Truck" },
  { id: "/icons/shipped/delivery-truck-cargo.png", category: "shipping", name: "Heavy Cargo Truck" },
  { id: "/icons/shipped/delivery-truck.png", category: "shipping", name: "Standard Truck" },
  { id: "/icons/shipped/shipment-box.png", category: "shipping", name: "Parcel Box" },
  { id: "/icons/shipped/shipment-check.png", category: "shipping", name: "Verified Shipment" },
  { id: "/icons/shipped/shipment-fragile.png", category: "shipping", name: "Fragile Shipment" },
  { id: "/icons/shipped/shipment-in-transit.png", category: "shipping", name: "In Transit" },
  { id: "/icons/shipped/shipment-next.png", category: "shipping", name: "Next Day Shipment" },
  { id: "/icons/shipped/shipment-plane.png", category: "shipping", name: "Air Cargo" },
  { id: "/icons/shipped/shipment-truck-1.png", category: "shipping", name: "Delivery Van" },
  { id: "/icons/shipped/shipment-truck.png", category: "shipping", name: "Courier Truck" },
  { id: "/icons/shipped/shipment-upload.png", category: "shipping", name: "Export Shipment" },
  { id: "/icons/shipped/truck-cargo.png", category: "shipping", name: "Freight Truck" },
  { id: "/icons/shipped/warehouse-cart-worker.png", category: "shipping", name: "Warehouse Worker" },
  { id: "/icons/shipped/warehouse-package-box.png", category: "shipping", name: "Sorting Hub" },

  // Ordered (23 icons)
  { id: "/icons/ordered/bag-handle.png", category: "ordered", name: "Handbag" },
  { id: "/icons/ordered/baggage-cart-2.png", category: "ordered", name: "Shopping Cart" },
  { id: "/icons/ordered/baggage.png", category: "ordered", name: "Baggage" },
  { id: "/icons/ordered/pets-paw-bag.png", category: "ordered", name: "Pet Shopping" },
  { id: "/icons/ordered/products-briefcase.png", category: "ordered", name: "Business Order" },
  { id: "/icons/ordered/products-purse-1.png", category: "ordered", name: "Invoice Wallet" },
  { id: "/icons/ordered/products-purse-2.png", category: "ordered", name: "Small Purse" },
  { id: "/icons/ordered/products-purse.png", category: "ordered", name: "Retail Purse" },
  { id: "/icons/ordered/recycling-bag-1.png", category: "ordered", name: "Eco Bag Light" },
  { id: "/icons/ordered/recycling-bag.png", category: "ordered", name: "Recycling Bag" },
  { id: "/icons/ordered/shopping-bag-barcode-1.png", category: "ordered", name: "Digital Bag" },
  { id: "/icons/ordered/shopping-bag-barcode.png", category: "ordered", name: "Barcode Shopping" },
  { id: "/icons/ordered/shopping-bag-check.png", category: "ordered", name: "Order Done" },
  { id: "/icons/ordered/shopping-bag-download.png", category: "ordered", name: "Order Download" },
  { id: "/icons/ordered/shopping-bag-fire.png", category: "ordered", name: "Hot Order" },
  { id: "/icons/ordered/shopping-bag-heart.png", category: "ordered", name: "Wishlist Bag" },
  { id: "/icons/ordered/shopping-bag-play.png", category: "ordered", name: "Video Shopping" },
  { id: "/icons/ordered/shopping-bag-purse-barcode.png", category: "ordered", name: "Retail Checkout" },
  { id: "/icons/ordered/shopping-bag-smile.png", category: "ordered", name: "Happy Shopping" },
  { id: "/icons/ordered/shopping-bag-smiley.png", category: "ordered", name: "Satisfaction Bag" },
  { id: "/icons/ordered/shopping-bag-tag-1.png", category: "ordered", name: "On Sale Bag" },
  { id: "/icons/ordered/shopping-bag-tag.png", category: "ordered", name: "Price Tag Bag" },
  { id: "/icons/ordered/shopping-basket-smile-1.png", category: "ordered", name: "Smile Basket" },
];

const LORDICON_SCRIPT_ID = "bp-lordicon-player";
const LORDICON_SCRIPT_SRC = "https://cdn.lordicon.com/lordicon.js";

const loadLordiconScript = () => {
  if (typeof document === "undefined") return;
  if (document.getElementById(LORDICON_SCRIPT_ID)) return;
  const script = document.createElement("script");
  script.id = LORDICON_SCRIPT_ID;
  script.src = LORDICON_SCRIPT_SRC;
  script.async = true;
  document.head.appendChild(script);
};

const LordiconPreview = ({ src, size = 48 }: { src: string; size?: number }) => {
  useEffect(() => {
    loadLordiconScript();
  }, []);

  return (
    <span
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size, lineHeight: 0 }}
    >
      {createElement("lord-icon" as any, {
        src,
        trigger: "loop",
        stroke: "regular",
        loading: "lazy",
        colors: "primary:#111827,secondary:#64748b",
        style: {
          width: `${size}px`,
          height: `${size}px`,
        },
      })}
    </span>
  );
};

const IconPreview = ({ id, color = "#000", size = 32, className = "" }: { id: string, color?: string, size?: number, className?: string }) => {
  if (id.startsWith("/icons/") || id.includes(".png")) {
    return (
      <img 
        src={id} 
        alt="" 
        key={id} // Force re-render on change
        style={{ width: size, height: size, objectFit: 'contain', display: 'block' }} 
        className={className} 
      />
    );
  }
  const IconComp = IconList[id] || IconList["package"];
  return (
    <div className={className} style={{ color }}>
      <IconComp s={size} />
    </div>
  );
};

export interface IconLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (selection: IconLibrarySelection) => void;
  currentIcon?: string;
}

export interface IconLibrarySelection {
  iconId: string;
  animated: boolean;
}

export function IconLibraryModal({ isOpen, onClose, onSelect, currentIcon }: IconLibraryModalProps) {
  const [selectedTab, setSelectedTab] = useState(0);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [tempSelected, setTempSelected] = useState(currentIcon || "");
  const selectedAnimatedIcon = getAnimatedIconByIconId(tempSelected);

  useEffect(() => {
    if (!isOpen) return;
    setTempSelected(currentIcon || "");
  }, [currentIcon, isOpen]);

  const tabs = [
    { id: "icons", content: "Icons" },
    { id: "animated", content: "Animated Icons" },
    { id: "upload", content: "Upload Icon" },
  ];

  const filteredIcons = ICONS_COLLECTION.filter(icon => {
    const matchesCategory = filter === "all" || icon.category === filter;
    const matchesSearch = icon.name.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleApply = () => {
    onSelect({
      iconId: tempSelected,
      animated: Boolean(selectedAnimatedIcon),
    });
    onClose();
  };

  const selectStaticIcon = (iconId: string) => {
    setTempSelected(iconId);
  };

  const selectAnimatedIcon = (fileKey: string) => {
    setTempSelected(makeAnimatedIconId(fileKey));
  };

  const iconDisplayName =
    (selectedAnimatedIcon ? `Animated ${selectedAnimatedIcon.name}` : "") ||
    ICONS_COLLECTION.find(i => i.id === tempSelected)?.name ||
    "Icon";

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Icon Library"
      size="large"
    >
      <div className="flex h-[600px]">
        {/* Left Side: Navigation & Grid */}
        <div className="flex-1 flex flex-col border-r border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <Tabs tabs={tabs} selected={selectedTab} onSelect={setSelectedTab} />
          </div>

          {selectedTab === 0 && (
            <>
              <div className="p-4 space-y-4">
                <div className="flex gap-2">
                   {["all", "premium", "ordered", "shipping", "delivery"].map(cat => (
                     <button
                       key={cat}
                       onClick={() => setFilter(cat)}
                       className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filter === cat ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                     >
                       {cat.charAt(0).toUpperCase() + cat.slice(1)}
                     </button>
                   ))}
                </div>
                <TextField
                  label=""
                  placeholder="Search icons..."
                  value={search}
                  onChange={setSearch}
                  autoComplete="off"
                  prefix={<Icon source={SearchIcon} />}
                />
              </div>

              <div className="flex-1 p-4 overflow-y-auto overflow-x-hidden">
                <div className="grid grid-cols-6 gap-4">
                  {filteredIcons.map(icon => (
                    <div
                      key={icon.id}
                      onClick={() => selectStaticIcon(icon.id)}
                      className={`aspect-square rounded-lg border flex items-center justify-center cursor-pointer transition-colors ${tempSelected === icon.id ? 'border-black bg-gray-50 shadow-sm' : 'border-gray-100 hover:border-gray-300'}`}
                    >
                       <IconPreview id={icon.id} size={28} />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {selectedTab === 1 && (
            <div className="flex-1 p-4 overflow-y-auto">
               <div className="grid grid-cols-4 gap-6">
                  {ANIMATED_ICONS.map(icon => (
                    <div
                      key={icon.fileKey}
                      onClick={() => selectAnimatedIcon(icon.fileKey)}
                      className={`p-6 rounded-xl border flex flex-col items-center gap-3 cursor-pointer transition-all ${tempSelected === makeAnimatedIconId(icon.fileKey) ? 'border-black bg-gray-50' : 'border-gray-100 hover:border-gray-300'}`}
                    >
                       <div className="w-14 h-14 flex items-center justify-center">
                         <LordiconPreview src={icon.src} size={52} />
                       </div>
                       <span className="text-[10px] text-gray-500">Animated {icon.name}</span>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {selectedTab === 2 && (
            <div className="flex-1 p-12 flex flex-col items-center justify-center gap-6">
               <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                  <span className="text-gray-400 text-sm">SVG / PNG</span>
               </div>
               <div className="text-center max-w-xs">
                 <p className="font-bold text-gray-900">Upload your own icon</p>
                 <p className="text-sm text-gray-500 mt-1">Recommended size 64x64px. Support SVG, PNG or JPG files.</p>
               </div>
               <Button>Choose File</Button>
            </div>
          )}
        </div>

        {/* Right Side: Preview & Action */}
        <div className="w-72 bg-gray-50 p-8 flex flex-col items-center justify-center gap-8">
           <div className="relative">
             <div className="w-32 h-32 rounded-3xl bg-white shadow-xl flex items-center justify-center border border-gray-100 overflow-hidden">
                {tempSelected ? (
                  selectedAnimatedIcon ? (
                    <LordiconPreview src={selectedAnimatedIcon.src} size={72} />
                  ) : (
                    <IconPreview id={tempSelected} size={64} />
                  )
                ) : (
                  <span className="text-gray-300">Preview</span>
                )}
             </div>
             {tempSelected && (
               <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white shadow-lg">
                  <Icon source={CheckCircleIcon} />
               </div>
             )}
           </div>
           
           <div className="w-full text-center space-y-4">
              <div>
                <p className="font-bold text-gray-900">{tempSelected ? iconDisplayName : "Select an icon"}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {selectedAnimatedIcon ? "This is a separate animated icon." : "This is a static icon."}
                </p>
              </div>
           </div>

           <div className="w-full mt-auto">
             <Button variant="primary" fullWidth size="large" onClick={handleApply} disabled={!tempSelected}>Apply Icon</Button>
             <Box paddingBlockStart="200">
               <Button fullWidth onClick={onClose}>Cancel</Button>
             </Box>
           </div>
        </div>
      </div>
    </Modal>
  );
}
