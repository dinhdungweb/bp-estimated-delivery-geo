const ornamentImage = (fileName: string) => `/ornaments/${fileName}`;

export const ORNAMENT_ASSETS = {
  holidayBranch: ornamentImage("holiday-branch.svg"),
  holidayGift: ornamentImage("holiday-gift.svg"),
  twinkles: ornamentImage("twinkles.svg"),
  summerLeaf: ornamentImage("summer-leaf.svg"),
  summerSun: ornamentImage("summer-sun.svg"),
  saleConfetti: ornamentImage("gold-ribbons.svg"),
  goldRibbons: ornamentImage("gold-ribbons.svg"),
  valentineHearts: ornamentImage("valentine-hearts.svg"),
  valentineGift: ornamentImage("valentine-gift.svg"),
  fireworksGold: ornamentImage("new-year-fireworks.svg"),
  springBloom: ornamentImage("spring-bloom.svg"),
  halloweenBats: ornamentImage("halloween-bats.svg"),
  spiderWeb: ornamentImage("spider-web.svg"),
  giftBoxOlive: ornamentImage("holiday-gift.svg"),
} as const;

export type OrnamentAssetId = keyof typeof ORNAMENT_ASSETS;

export const ORNAMENT_ASSET_OPTIONS: { label: string; value: OrnamentAssetId }[] = [
  { label: "Holiday Branch", value: "holidayBranch" },
  { label: "Holiday Gift", value: "holidayGift" },
  { label: "Twinkles", value: "twinkles" },
  { label: "Summer Leaf", value: "summerLeaf" },
  { label: "Summer Sun", value: "summerSun" },
  { label: "Sale Confetti", value: "saleConfetti" },
  { label: "Gold Ribbons", value: "goldRibbons" },
  { label: "Valentine Hearts", value: "valentineHearts" },
  { label: "Valentine Gift", value: "valentineGift" },
  { label: "Fireworks Gold", value: "fireworksGold" },
  { label: "Spring Bloom", value: "springBloom" },
  { label: "Halloween Bats", value: "halloweenBats" },
  { label: "Spider Web", value: "spiderWeb" },
  { label: "Gift Box Olive", value: "giftBoxOlive" },
];
