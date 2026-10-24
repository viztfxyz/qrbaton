import {
  siAirtel,
  siBigbasket,
  siBookmyshow,
  siDunzo,
  siJio,
  siMcdonalds,
  siNetflix,
  siSpotify,
  siStarbucks,
  siSwiggy,
  siUber,
  siZomato,
} from "simple-icons";

/** Merchant tile: brand background plus either a glyph (simple-icons path) or a short wordmark. */
export interface Brand {
  bg: string;
  fg: string;
  /** 24×24 SVG path. */
  path?: string;
  /** Wordmark segments, each with its own colour (e.g. blinkit's black "blink" + green "it"). */
  word?: [text: string, color: string][];
}

const glyph = (icon: { hex: string; path: string }, fg = "#ffffff"): Brand => ({ bg: `#${icon.hex}`, fg, path: icon.path });

const BRANDS: Record<string, Brand> = {
  blinkit: { bg: "#F8CB46", fg: "#000000", word: [["blink", "#000000"], ["it", "#0C831F"]] },
  zepto: { bg: "#3C006B", fg: "#ffffff", word: [["zepto", "#ffffff"]] },
  swiggy: glyph(siSwiggy),
  instamart: glyph(siSwiggy),
  zomato: glyph(siZomato),
  bigbasket: glyph(siBigbasket, "#000000"),
  dunzo: glyph(siDunzo),
  uber: glyph(siUber),
  bookmyshow: glyph(siBookmyshow),
  airtel: glyph(siAirtel),
  jio: glyph(siJio),
  mcdonalds: glyph(siMcdonalds, "#DA291C"),
  starbucks: glyph(siStarbucks),
  netflix: glyph(siNetflix),
  spotify: glyph(siSpotify, "#000000"),
  amazon: { bg: "#131921", fg: "#ffffff", word: [["amazon", "#ffffff"]] },
  flipkart: { bg: "#2874F0", fg: "#ffffff", word: [["Flipkart", "#ffffff"]] },
  myntra: { bg: "#ffffff", fg: "#FF3F6C", word: [["Myntra", "#FF3F6C"]] },
};

/** Known brand for a merchant or payee name, matched loosely ("Swiggy Instamart", "Zomato Ltd"). */
export function findBrand(name: string | undefined): Brand | null {
  const n = (name ?? "").toLowerCase().replace(/[^a-z]/g, "");
  if (!n) return null;
  if (BRANDS[n]) return BRANDS[n];
  const key = Object.keys(BRANDS).find((k) => n.includes(k));
  return key ? BRANDS[key] : null;
}
