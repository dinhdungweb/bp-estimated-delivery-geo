import React, { useState } from "react";
import { Modal, Tabs, TextField, Icon, Button, InlineStack, Box, Text, Bleed, Divider, Grid } from "@shopify/polaris";
import { SearchIcon, XIcon, CheckCircleIcon } from "@shopify/polaris-icons";

import { WidgetSettingsProps, IconList } from "./WidgetRenderer";

// Mock Icon Data
const ICONS_COLLECTION = [
  { id: "bag", category: "ordered", name: "Shopping Bag" },
  { id: "package", category: "ordered", name: "Package Box" },
  { id: "clock", category: "ordered", name: "Processing Time" },
  { id: "truck", category: "shipping", name: "Standard Shipping" },
  { id: "rocket", category: "shipping", name: "Express Delivery" },
  { id: "box", category: "shipping", name: "Item Box" },
  { id: "home", category: "delivery", name: "Doorstep Delivery" },
  { id: "check", category: "delivery", name: "Arrival Success" },
  { id: "star", category: "delivery", name: "Top Rated" },
  { id: "gift", category: "delivery", name: "Gift wrapping" },
  { id: "shield", category: "delivery", name: "Safe & Secure" },
  { id: "map_pin", category: "delivery", name: "Drop-off Point" },
  { id: "zap", category: "shipping", name: "Lightning Fast" },
  { id: "heart", category: "ordered", name: "Favorites" },
  { id: "calendar", category: "ordered", name: "Ship date" },
  { id: "globe", category: "delivery", name: "Global Shipping" },
];

const ANIMATED_ICONS = [
  { id: "truck", anim: "animate-bounce", name: "Bouncing Truck" },
  { id: "rocket", anim: "animate-pulse", name: "Pulsing Rocket" },
  { id: "package", anim: "hover:rotate-12 transition-transform", name: "Rotating Box" },
];

const IconPreview = ({ id, color = "#000", size = 32, className = "" }: { id: string, color?: string, size?: number, className?: string }) => {
  const IconComp = IconList[id] || IconList["package"];
  return (
    <div className={className}>
      <IconComp c={color} s={size} />
    </div>
  );
};

export interface IconLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (iconId: string) => void;
  currentIcon?: string;
}

export function IconLibraryModal({ isOpen, onClose, onSelect, currentIcon }: IconLibraryModalProps) {
  const [selectedTab, setSelectedTab] = useState(0);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [tempSelected, setTempSelected] = useState(currentIcon || "");

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
    onSelect(tempSelected);
    onClose();
  };

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
                   {["all", "ordered", "shipping", "delivery"].map(cat => (
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
                      onClick={() => setTempSelected(icon.id)}
                      className={`aspect-square rounded-lg border flex items-center justify-center cursor-pointer transition-all hover:scale-110 ${tempSelected === icon.id ? 'border-black bg-gray-50 shadow-sm' : 'border-gray-100 hover:border-gray-300'}`}
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
                      key={icon.id}
                      onClick={() => setTempSelected(icon.id)}
                      className={`p-6 rounded-xl border flex flex-col items-center gap-3 cursor-pointer transition-all ${tempSelected === icon.id ? 'border-black bg-gray-50' : 'border-gray-100 hover:border-gray-300'}`}
                    >
                       <div className={icon.anim}>
                         <IconPreview id={icon.id} size={48} />
                       </div>
                       <span className="text-[10px] text-gray-500">{icon.name}</span>
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
                  <IconPreview id={tempSelected} size={64} className={ANIMATED_ICONS.find(a => a.id === tempSelected)?.anim || ""} />
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
           
           <div className="text-center">
              <p className="font-bold text-gray-900">{tempSelected ? (ICONS_COLLECTION.find(i => i.id === tempSelected)?.name || "Animated Icon") : "Select an icon"}</p>
              <p className="text-xs text-gray-500 mt-1">This will be applied to your selected step.</p>
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
