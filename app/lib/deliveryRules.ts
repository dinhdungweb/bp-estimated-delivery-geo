import {
  DEFAULT_SHIPPING_MESSAGE,
  type InventoryStatus,
  isAllCountriesCode,
  normalizeCutoffTime,
  normalizeDateLocale,
  normalizeHolidayDates,
  normalizeCollectionIds,
  normalizeCountry,
  normalizeProductIds,
  normalizeRuleInventoryStatus,
  normalizeTags,
  normalizeTimerSeconds,
  normalizeTimeZone,
  normalizeVisibilityMode,
  type VisibilityMode,
} from "./delivery";

export type RulePayload =
  | {
      ruleName: string;
      countryCode: string;
      widgetId: string;
      targetProducts: string[];
      targetCollections: string[];
      targetTags: string[];
      inventoryStatus: InventoryStatus;
      minDays: number;
      maxDays: number;
      processingDays: number;
      shippingMessage: string;
      cutoffEnabled: boolean;
      cutoffTime: string;
      cutoffTimezone: string;
      holidayDates: string[];
      visibilityMode: VisibilityMode;
      timerSeconds: number;
      dateLocale: string;
      isActive: boolean;
    }
  | { error: string };

const COUNTRY_LABELS: Record<string, string> = {
  AD: "Andorra",
  AE: "United Arab Emirates",
  AF: "Afghanistan",
  AG: "Antigua & Barbuda",
  AI: "Anguilla",
  AL: "Albania",
  AM: "Armenia",
  AO: "Angola",
  AR: "Argentina",
  AS: "American Samoa",
  AT: "Austria",
  AU: "Australia",
  AW: "Aruba",
  AX: "Aland Islands",
  AZ: "Azerbaijan",
  BA: "Bosnia & Herzegovina",
  BB: "Barbados",
  BD: "Bangladesh",
  BE: "Belgium",
  BF: "Burkina Faso",
  BG: "Bulgaria",
  BH: "Bahrain",
  BI: "Burundi",
  BJ: "Benin",
  BL: "Saint Barthelemy",
  BM: "Bermuda",
  BN: "Brunei",
  BO: "Bolivia",
  BQ: "Caribbean Netherlands",
  BR: "Brazil",
  BS: "Bahamas",
  BT: "Bhutan",
  BW: "Botswana",
  BY: "Belarus",
  BZ: "Belize",
  CA: "Canada",
  CC: "Cocos (Keeling) Islands",
  CD: "Congo - Kinshasa",
  CF: "Central African Republic",
  CG: "Congo - Brazzaville",
  CH: "Switzerland",
  CI: "Cote d'Ivoire",
  CK: "Cook Islands",
  CL: "Chile",
  CM: "Cameroon",
  CN: "China",
  CO: "Colombia",
  CR: "Costa Rica",
  CU: "Cuba",
  CV: "Cape Verde",
  CW: "Curacao",
  CX: "Christmas Island",
  CY: "Cyprus",
  CZ: "Czechia",
  DE: "Germany",
  DJ: "Djibouti",
  DK: "Denmark",
  DM: "Dominica",
  DO: "Dominican Republic",
  DZ: "Algeria",
  EC: "Ecuador",
  EE: "Estonia",
  EG: "Egypt",
  ER: "Eritrea",
  ES: "Spain",
  ET: "Ethiopia",
  FI: "Finland",
  FJ: "Fiji",
  FK: "Falkland Islands",
  FM: "Micronesia",
  FO: "Faroe Islands",
  FR: "France",
  GA: "Gabon",
  GB: "United Kingdom",
  GD: "Grenada",
  GE: "Georgia",
  GF: "French Guiana",
  GG: "Guernsey",
  GH: "Ghana",
  GI: "Gibraltar",
  GL: "Greenland",
  GM: "Gambia",
  GN: "Guinea",
  GP: "Guadeloupe",
  GQ: "Equatorial Guinea",
  GR: "Greece",
  GS: "South Georgia & South Sandwich Islands",
  GT: "Guatemala",
  GU: "Guam",
  GW: "Guinea-Bissau",
  GY: "Guyana",
  HK: "Hong Kong SAR",
  HN: "Honduras",
  HR: "Croatia",
  HT: "Haiti",
  HU: "Hungary",
  ID: "Indonesia",
  IE: "Ireland",
  IL: "Israel",
  IM: "Isle of Man",
  IN: "India",
  IO: "British Indian Ocean Territory",
  IQ: "Iraq",
  IR: "Iran",
  IS: "Iceland",
  IT: "Italy",
  JE: "Jersey",
  JM: "Jamaica",
  JO: "Jordan",
  JP: "Japan",
  KE: "Kenya",
  KG: "Kyrgyzstan",
  KH: "Cambodia",
  KI: "Kiribati",
  KM: "Comoros",
  KN: "Saint Kitts & Nevis",
  KR: "South Korea",
  KW: "Kuwait",
  KY: "Cayman Islands",
  KZ: "Kazakhstan",
  LA: "Laos",
  LB: "Lebanon",
  LC: "Saint Lucia",
  LI: "Liechtenstein",
  LK: "Sri Lanka",
  LR: "Liberia",
  LS: "Lesotho",
  LT: "Lithuania",
  LU: "Luxembourg",
  LV: "Latvia",
  LY: "Libya",
  MA: "Morocco",
  MC: "Monaco",
  MD: "Moldova",
  ME: "Montenegro",
  MF: "Saint Martin",
  MG: "Madagascar",
  MH: "Marshall Islands",
  MK: "North Macedonia",
  ML: "Mali",
  MM: "Myanmar",
  MN: "Mongolia",
  MO: "Macao SAR",
  MP: "Northern Mariana Islands",
  MQ: "Martinique",
  MR: "Mauritania",
  MS: "Montserrat",
  MT: "Malta",
  MU: "Mauritius",
  MV: "Maldives",
  MW: "Malawi",
  MX: "Mexico",
  MY: "Malaysia",
  MZ: "Mozambique",
  NA: "Namibia",
  NC: "New Caledonia",
  NE: "Niger",
  NG: "Nigeria",
  NI: "Nicaragua",
  NL: "Netherlands",
  NO: "Norway",
  NP: "Nepal",
  NR: "Nauru",
  NU: "Niue",
  NZ: "New Zealand",
  OM: "Oman",
  PA: "Panama",
  PE: "Peru",
  PF: "French Polynesia",
  PG: "Papua New Guinea",
  PH: "Philippines",
  PK: "Pakistan",
  PL: "Poland",
  PM: "Saint Pierre & Miquelon",
  PN: "Pitcairn Islands",
  PR: "Puerto Rico",
  PS: "Palestinian Territories",
  PT: "Portugal",
  PW: "Palau",
  PY: "Paraguay",
  QA: "Qatar",
  RE: "Reunion",
  RO: "Romania",
  RS: "Serbia",
  RU: "Russia",
  RW: "Rwanda",
  SA: "Saudi Arabia",
  SB: "Solomon Islands",
  SC: "Seychelles",
  SD: "Sudan",
  SE: "Sweden",
  SG: "Singapore",
  SH: "Saint Helena",
  SI: "Slovenia",
  SJ: "Svalbard & Jan Mayen",
  SK: "Slovakia",
  SL: "Sierra Leone",
  SM: "San Marino",
  SN: "Senegal",
  SO: "Somalia",
  SR: "Suriname",
  SS: "South Sudan",
  ST: "Sao Tome & Principe",
  SV: "El Salvador",
  SX: "Sint Maarten",
  SY: "Syria",
  SZ: "Eswatini",
  TC: "Turks & Caicos Islands",
  TD: "Chad",
  TG: "Togo",
  TH: "Thailand",
  TJ: "Tajikistan",
  TK: "Tokelau",
  TM: "Turkmenistan",
  TN: "Tunisia",
  TO: "Tonga",
  TR: "Turkey",
  TT: "Trinidad & Tobago",
  TV: "Tuvalu",
  TW: "Taiwan",
  TZ: "Tanzania",
  UA: "Ukraine",
  UG: "Uganda",
  US: "United States",
  UY: "Uruguay",
  UZ: "Uzbekistan",
  VA: "Vatican City",
  VC: "Saint Vincent & Grenadines",
  VE: "Venezuela",
  VG: "British Virgin Islands",
  VI: "U.S. Virgin Islands",
  VN: "Vietnam",
  VU: "Vanuatu",
  WF: "Wallis & Futuna",
  WS: "Samoa",
  YE: "Yemen",
  YT: "Mayotte",
  ZA: "South Africa",
  ZM: "Zambia",
  ZW: "Zimbabwe",
};

const countryGroup = (name: string, codes: string[]) => ({
  name,
  countries: codes.map((value) => ({ value, label: COUNTRY_LABELS[value] || value })),
});

export const RULE_COUNTRY_GROUPS = [
  countryGroup("North America", ["BM", "CA", "GL", "MX", "PM", "US"]),
  countryGroup("Central America & Caribbean", [
    "AG", "AI", "AW", "BB", "BL", "BQ", "BS", "BZ", "CR", "CU", "CW", "DM",
    "DO", "GD", "GP", "GT", "HN", "HT", "JM", "KN", "KY", "LC", "MF", "MQ",
    "MS", "NI", "PA", "PR", "SV", "SX", "TC", "TT", "VC", "VG", "VI",
  ]),
  countryGroup("South America", [
    "AR", "BO", "BR", "CL", "CO", "EC", "FK", "GF", "GS", "GY", "PY", "PE",
    "SR", "UY", "VE",
  ]),
  countryGroup("Europe", [
    "AD", "AL", "AT", "AX", "BA", "BE", "BG", "BY", "CH", "CY", "CZ", "DE",
    "DK", "EE", "ES", "FI", "FO", "FR", "GB", "GG", "GI", "GR", "HR", "HU",
    "IE", "IM", "IS", "IT", "JE", "LI", "LT", "LU", "LV", "MC", "MD", "ME",
    "MK", "MT", "NL", "NO", "PL", "PT", "RO", "RS", "RU", "SE", "SI", "SJ",
    "SK", "SM", "UA", "VA",
  ]),
  countryGroup("Asia", [
    "AF", "AM", "AZ", "BD", "BN", "BT", "CN", "GE", "HK", "ID", "IN", "IO",
    "JP", "KG", "KH", "KR", "KZ", "LA", "LK", "MM", "MN", "MO", "MV", "MY",
    "NP", "PH", "PK", "SG", "TH", "TJ", "TM", "TW", "UZ", "VN",
  ]),
  countryGroup("Middle East", [
    "AE", "BH", "IL", "IQ", "IR", "JO", "KW", "LB", "OM", "PS", "QA", "SA",
    "SY", "TR", "YE",
  ]),
  countryGroup("Africa", [
    "AO", "BF", "BI", "BJ", "BW", "CD", "CF", "CG", "CI", "CM", "CV", "DJ",
    "DZ", "EG", "ER", "ET", "GA", "GH", "GM", "GN", "GQ", "GW", "KE", "KM",
    "LR", "LS", "LY", "MA", "MG", "ML", "MR", "MU", "MW", "MZ", "NA", "NE",
    "NG", "RE", "RW", "SC", "SD", "SH", "SL", "SN", "SO", "SS", "ST", "SZ",
    "TD", "TG", "TN", "TZ", "UG", "YT", "ZA", "ZM", "ZW",
  ]),
  countryGroup("Oceania", [
    "AS", "AU", "CC", "CK", "CX", "FJ", "FM", "GU", "KI", "MH", "MP", "NC",
    "NR", "NU", "NZ", "PF", "PG", "PN", "PW", "SB", "TK", "TO", "TV", "VU",
    "WF", "WS",
  ]),
];

export const RULE_COUNTRIES = RULE_COUNTRY_GROUPS.flatMap((group) => group.countries);

export const RULE_DEFAULT_MESSAGE = DEFAULT_SHIPPING_MESSAGE;

export function parseNonNegativeInt(value: FormDataEntryValue | null, fallback: number): number | null {
  const parsed = Number.parseInt(String(value ?? fallback), 10);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 365) return null;
  return parsed;
}

export function getRuleCountryLabel(code: string) {
  if (isAllCountriesCode(code)) return "All countries";
  return RULE_COUNTRIES.find((country) => country.value === code)?.label ?? code;
}

export function isRuleCountryCode(code: string) {
  return isAllCountriesCode(code) || /^[A-Z]{2}$/.test(code);
}

export function daysLabel(value: number) {
  return value === 1 ? "1 day" : `${value} days`;
}

export function previewRuleMessage(message: string) {
  return message
    .replaceAll("{order_date}", "Apr 28")
    .replaceAll("{ship_date}", "Apr 29")
    .replaceAll("{min_date}", "May 2")
    .replaceAll("{max_date}", "May 6");
}

export function csvList(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function jsonStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export function sameStringArray(left: string[], right: string[]) {
  if (left.length !== right.length) return false;
  const leftSorted = [...left].sort();
  const rightSorted = [...right].sort();
  return leftSorted.every((value, index) => value === rightSorted[index]);
}

export function readRulePayload(formData: FormData): RulePayload {
  const ruleName = String(formData.get("ruleName") || "Delivery rule").trim();
  const countryCode = normalizeCountry(formData.get("countryCode"));
  const widgetId = String(formData.get("widgetId") || "").trim();
  const targetProducts = normalizeProductIds(csvList(formData.get("targetProducts")));
  const targetCollections = normalizeCollectionIds(csvList(formData.get("targetCollections")));
  const targetTags = normalizeTags(csvList(formData.get("targetTags")));
  const inventoryStatus = normalizeRuleInventoryStatus(formData.get("inventoryStatus"));
  const minDays = parseNonNegativeInt(formData.get("minDays"), 3);
  const maxDays = parseNonNegativeInt(formData.get("maxDays"), 7);
  const processingDays = parseNonNegativeInt(formData.get("processingDays"), 1);
  const shippingMessage = String(formData.get("shippingMessage") || RULE_DEFAULT_MESSAGE).trim();
  const cutoffEnabled = String(formData.get("cutoffEnabled") ?? "false") === "true";
  const cutoffTime = normalizeCutoffTime(formData.get("cutoffTime"));
  const cutoffTimezone = normalizeTimeZone(formData.get("cutoffTimezone"));
  const holidayDates = normalizeHolidayDates(formData.get("holidayDates"));
  const visibilityMode = normalizeVisibilityMode(formData.get("visibilityMode"));
  const timerSeconds = normalizeTimerSeconds(formData.get("timerSeconds"));
  const dateLocale = normalizeDateLocale(formData.get("dateLocale"));
  const isActive = String(formData.get("isActive") ?? "true") === "true";

  if (!isRuleCountryCode(countryCode)) {
    return { error: "Invalid country code." };
  }

  if (ruleName.length === 0 || ruleName.length > 120) {
    return { error: "Rule name must be between 1 and 120 characters." };
  }

  if (!widgetId) {
    return { error: "Choose a design for this rule." };
  }

  if (minDays === null || maxDays === null || processingDays === null) {
    return { error: "Delivery days must be whole numbers between 0 and 365." };
  }

  if (minDays > maxDays) {
    return { error: "Min delivery days cannot be greater than max delivery days." };
  }

  if (shippingMessage.length === 0 || shippingMessage.length > 500) {
    return { error: "Shipping message must be between 1 and 500 characters." };
  }

  return {
    ruleName,
    countryCode,
    widgetId,
    targetProducts,
    targetCollections,
    targetTags,
    inventoryStatus,
    minDays,
    maxDays,
    processingDays,
    shippingMessage,
    cutoffEnabled,
    cutoffTime,
    cutoffTimezone,
    holidayDates,
    visibilityMode,
    timerSeconds,
    dateLocale,
    isActive,
  };
}
