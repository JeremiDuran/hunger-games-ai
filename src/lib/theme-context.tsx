"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";

export type ColorMode = "system" | "light" | "dark";

export type BookId =
  | "the-hunger-games"
  | "catching-fire"
  | "mockingjay"
  | "songbirds-snakes"
  | "sunrise-reaping";

export interface PaletteVariables {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
  themeGlow: string;
  themeSurface: string;
  themeSurfaceBorder: string;
}

export interface PaletteInfo {
  id: BookId;
  bookNumber: number;
  name: string;
  bookTitle: string;
  codename: string;
  tone: "dark" | "light";
  tagline: string;
  description: string;
  bgHex: string;
  cardHex: string;
  accentHex: string;
  highlightHex: string;
  borderHex: string;
  vars: PaletteVariables;
}

/* ==========================================================================
   5 OFFICIAL BOOK PALETTES — DARK EDITIONS
   ========================================================================== */
export const BOOK_PALETTES_DARK: Record<BookId, PaletteInfo> = {
  "the-hunger-games": {
    id: "the-hunger-games",
    bookNumber: 1,
    bookTitle: "The Hunger Games",
    name: "Book 1 • The Hunger Games",
    codename: "VOL. 01 // MOCKINGJAY PIN",
    tone: "dark",
    tagline: "Matte Obsidian Black, Classic Mockingjay Gold & Crimson Bloodline",
    description: "The 74th Hunger Games. Iconic deep matte carbon-black background with the shimmering golden Mockingjay arrow pin and crimson accent.",
    bgHex: "#0c0c0d",
    cardHex: "#161618",
    accentHex: "#F59E0B",
    highlightHex: "#EF4444",
    borderHex: "#f59e0b",
    vars: {
      background: "#0c0c0d",
      foreground: "#f7f7f8",
      card: "#161618",
      cardForeground: "#f7f7f8",
      popover: "#1c1c20",
      popoverForeground: "#f7f7f8",
      primary: "#F59E0B",
      primaryForeground: "#0c0c0d",
      secondary: "#26262a",
      secondaryForeground: "#f7f7f8",
      muted: "#222226",
      mutedForeground: "#a8a8b2",
      accent: "#EF4444",
      accentForeground: "#ffffff",
      destructive: "#dc2626",
      destructiveForeground: "#ffffff",
      border: "#f59e0bcc",
      input: "#26262b",
      ring: "#F59E0B",
      themeGlow: "rgba(245, 158, 11, 0.45)",
      themeSurface: "rgba(12, 12, 13, 0.96)",
      themeSurfaceBorder: "rgba(245, 158, 11, 0.65)",
    },
  },
  "catching-fire": {
    id: "catching-fire",
    bookNumber: 2,
    bookTitle: "Catching Fire",
    name: "Book 2 • Catching Fire",
    codename: "VOL. 02 // QUARTER QUELL",
    tone: "dark",
    tagline: "Deep Smoldering Crimson, Blazing Phoenix Orange & Molten Gold",
    description: "The 75th Hunger Games / Quarter Quell. Deep blood-ember charcoal, vivid ignite orange flares, and incendiary gold halos.",
    bgHex: "#140707",
    cardHex: "#220c0c",
    accentHex: "#F97316",
    highlightHex: "#E11D48",
    borderHex: "#f97316",
    vars: {
      background: "#140707",
      foreground: "#fff5f5",
      card: "#220c0c",
      cardForeground: "#fff5f5",
      popover: "#2d1010",
      popoverForeground: "#fff5f5",
      primary: "#F97316",
      primaryForeground: "#0f0404",
      secondary: "#381414",
      secondaryForeground: "#fff5f5",
      muted: "#2e1111",
      mutedForeground: "#d19494",
      accent: "#E11D48",
      accentForeground: "#ffffff",
      destructive: "#be123c",
      destructiveForeground: "#ffffff",
      border: "#f97316cc",
      input: "#321212",
      ring: "#F97316",
      themeGlow: "rgba(249, 115, 22, 0.5)",
      themeSurface: "rgba(20, 7, 7, 0.96)",
      themeSurfaceBorder: "rgba(249, 115, 22, 0.65)",
    },
  },
  "mockingjay": {
    id: "mockingjay",
    bookNumber: 3,
    bookTitle: "Mockingjay",
    name: "Book 3 • Mockingjay",
    codename: "VOL. 03 // REBEL CARRIER",
    tone: "dark",
    tagline: "District 13 Slate Navy, Cerulean Wings & Rebel Sky Blue",
    description: "The Panem Revolution. High-altitude steel navy depths with radiant cerulean blue signals and airborne mockingjay wings.",
    bgHex: "#070e18",
    cardHex: "#0f1c2e",
    accentHex: "#38BDF8",
    highlightHex: "#60A5FA",
    borderHex: "#38bdf8",
    vars: {
      background: "#070e18",
      foreground: "#f0f8ff",
      card: "#0f1c2e",
      cardForeground: "#f0f8ff",
      popover: "#15273e",
      popoverForeground: "#f0f8ff",
      primary: "#38BDF8",
      primaryForeground: "#040910",
      secondary: "#19314e",
      secondaryForeground: "#f0f8ff",
      muted: "#13253b",
      mutedForeground: "#8bb6dc",
      accent: "#60A5FA",
      accentForeground: "#040910",
      destructive: "#f43f5e",
      destructiveForeground: "#ffffff",
      border: "#38bdf8cc",
      input: "#172d47",
      ring: "#38BDF8",
      themeGlow: "rgba(56, 189, 248, 0.45)",
      themeSurface: "rgba(7, 14, 24, 0.96)",
      themeSurfaceBorder: "rgba(56, 189, 248, 0.65)",
    },
  },
  "songbirds-snakes": {
    id: "songbirds-snakes",
    bookNumber: 4,
    bookTitle: "The Ballad of Songbirds & Snakes",
    name: "Book 4 • Songbirds & Snakes",
    codename: "VOL. 04 // CAPITOL ACADEMY",
    tone: "dark",
    tagline: "Capitol Academy Emerald, Imperial Gold & Coiled Serpent Green",
    description: "The 10th Hunger Games. Opulent dark Capitol academy forest emerald paired with antique Coriolanus gold and serpentine bronze.",
    bgHex: "#05130b",
    cardHex: "#0c2417",
    accentHex: "#22C55E",
    highlightHex: "#EAB308",
    borderHex: "#22c55e",
    vars: {
      background: "#05130b",
      foreground: "#f2fcf5",
      card: "#0c2417",
      cardForeground: "#f2fcf5",
      popover: "#113221",
      popoverForeground: "#f2fcf5",
      primary: "#22C55E",
      primaryForeground: "#030d07",
      secondary: "#17412b",
      secondaryForeground: "#f2fcf5",
      muted: "#103322",
      mutedForeground: "#86caa2",
      accent: "#EAB308",
      accentForeground: "#030d07",
      destructive: "#ef4444",
      destructiveForeground: "#ffffff",
      border: "#22c55ecc",
      input: "#143a26",
      ring: "#22C55E",
      themeGlow: "rgba(34, 197, 94, 0.45)",
      themeSurface: "rgba(5, 19, 11, 0.96)",
      themeSurfaceBorder: "rgba(34, 197, 94, 0.65)",
    },
  },
  "sunrise-reaping": {
    id: "sunrise-reaping",
    bookNumber: 5,
    bookTitle: "Sunrise on the Reaping",
    name: "Book 5 • Sunrise on the Reaping",
    codename: "VOL. 05 // 50TH QUELL",
    tone: "dark",
    tagline: "Midnight Royal Reaping Violet & Golden Sunburst Crown",
    description: "The 50th Hunger Games / Haymitch's Quell. Deep midnight royal amethyst velvet illuminated by radiant solar sunburst gold.",
    bgHex: "#0f071a",
    cardHex: "#1c0f2e",
    accentHex: "#A855F7",
    highlightHex: "#FBBF24",
    borderHex: "#a855f7",
    vars: {
      background: "#0f071a",
      foreground: "#faf5ff",
      card: "#1c0f2e",
      cardForeground: "#faf5ff",
      popover: "#26153e",
      popoverForeground: "#faf5ff",
      primary: "#A855F7",
      primaryForeground: "#08030e",
      secondary: "#321b52",
      secondaryForeground: "#faf5ff",
      muted: "#26153d",
      mutedForeground: "#c3a0e6",
      accent: "#FBBF24",
      accentForeground: "#08030e",
      destructive: "#e11d48",
      destructiveForeground: "#ffffff",
      border: "#a855f7cc",
      input: "#2b1746",
      ring: "#A855F7",
      themeGlow: "rgba(168, 85, 247, 0.5)",
      themeSurface: "rgba(15, 7, 26, 0.96)",
      themeSurfaceBorder: "rgba(168, 85, 247, 0.65)",
    },
  },
};

/* ==========================================================================
   5 OFFICIAL BOOK PALETTES — LIGHT EDITIONS (HIGH CONTRAST CURATED)
   ========================================================================== */
export const BOOK_PALETTES_LIGHT: Record<BookId, PaletteInfo> = {
  "the-hunger-games": {
    id: "the-hunger-games",
    bookNumber: 1,
    bookTitle: "The Hunger Games",
    name: "Book 1 • The Hunger Games",
    codename: "VOL. 01 // PLATINUM MOCKINGJAY",
    tone: "light",
    tagline: "Stark Platinum White, Radiant Mockingjay Gold & Crimson Ink",
    description: "Light Edition of The Hunger Games. Pure crisp white & silver canvas with stark jet-black typography, brilliant imperial Mockingjay gold, and crimson insignia.",
    bgHex: "#f8f9fa",
    cardHex: "#ffffff",
    accentHex: "#CA8A04",
    highlightHex: "#DC2626",
    borderHex: "#ca8a04",
    vars: {
      background: "#f8f9fa",
      foreground: "#09090b",
      card: "#ffffff",
      cardForeground: "#09090b",
      popover: "#ffffff",
      popoverForeground: "#09090b",
      primary: "#CA8A04",
      primaryForeground: "#ffffff",
      secondary: "#f1f3f5",
      secondaryForeground: "#09090b",
      muted: "#e9ecef",
      mutedForeground: "#495057",
      accent: "#DC2626",
      accentForeground: "#ffffff",
      destructive: "#dc2626",
      destructiveForeground: "#ffffff",
      border: "rgba(202, 138, 4, 0.7)",
      input: "#dee2e6",
      ring: "#CA8A04",
      themeGlow: "rgba(202, 138, 4, 0.3)",
      themeSurface: "rgba(255, 255, 255, 0.98)",
      themeSurfaceBorder: "rgba(202, 138, 4, 0.65)",
    },
  },
  "catching-fire": {
    id: "catching-fire",
    bookNumber: 2,
    bookTitle: "Catching Fire",
    name: "Book 2 • Catching Fire",
    codename: "VOL. 02 // SUNBAKED PHOENIX",
    tone: "light",
    tagline: "Warm Sunbaked Canvas, Incendiary Flame Orange & Rose Crimson",
    description: "Light Edition of Catching Fire. Warm peach-ivory canvas with high-contrast espresso text, bold fiery orange accents, and blazing rose-crimson trim.",
    bgHex: "#faefe8",
    cardHex: "#fff9f5",
    accentHex: "#C2410C",
    highlightHex: "#BE123C",
    borderHex: "#c2410c",
    vars: {
      background: "#faefe8",
      foreground: "#1a0d08",
      card: "#fff9f5",
      cardForeground: "#1a0d08",
      popover: "#ffffff",
      popoverForeground: "#1a0d08",
      primary: "#C2410C",
      primaryForeground: "#ffffff",
      secondary: "#f3ddd2",
      secondaryForeground: "#1a0d08",
      muted: "#f0d6c9",
      mutedForeground: "#6b4334",
      accent: "#BE123C",
      accentForeground: "#ffffff",
      destructive: "#9f1239",
      destructiveForeground: "#ffffff",
      border: "rgba(194, 65, 12, 0.65)",
      input: "#eecfbf",
      ring: "#C2410C",
      themeGlow: "rgba(194, 65, 12, 0.3)",
      themeSurface: "rgba(255, 249, 245, 0.98)",
      themeSurfaceBorder: "rgba(194, 65, 12, 0.6)",
    },
  },
  "mockingjay": {
    id: "mockingjay",
    bookNumber: 3,
    bookTitle: "Mockingjay",
    name: "Book 3 • Mockingjay",
    codename: "VOL. 03 // SKY IN REVOLT",
    tone: "light",
    tagline: "Rebellion Sky Mist, Deep Cerulean Blue & High-Altitude Slate",
    description: "Light Edition of Mockingjay. Crisp atmospheric sky-blue backing with dark navy-slate readability, vivid cerulean blue, and cobalt wings.",
    bgHex: "#eff6fb",
    cardHex: "#ffffff",
    accentHex: "#0284C7",
    highlightHex: "#2563EB",
    borderHex: "#0284c7",
    vars: {
      background: "#eff6fb",
      foreground: "#081321",
      card: "#ffffff",
      cardForeground: "#081321",
      popover: "#ffffff",
      popoverForeground: "#081321",
      primary: "#0284C7",
      primaryForeground: "#ffffff",
      secondary: "#daeaf5",
      secondaryForeground: "#081321",
      muted: "#d3e5f2",
      mutedForeground: "#3a5775",
      accent: "#2563EB",
      accentForeground: "#ffffff",
      destructive: "#e11d48",
      destructiveForeground: "#ffffff",
      border: "rgba(2, 132, 199, 0.65)",
      input: "#cde1f0",
      ring: "#0284C7",
      themeGlow: "rgba(2, 132, 199, 0.3)",
      themeSurface: "rgba(255, 255, 255, 0.98)",
      themeSurfaceBorder: "rgba(2, 132, 199, 0.6)",
    },
  },
  "songbirds-snakes": {
    id: "songbirds-snakes",
    bookNumber: 4,
    bookTitle: "The Ballad of Songbirds & Snakes",
    name: "Book 4 • Songbirds & Snakes",
    codename: "VOL. 04 // ACADEMY VELLUM",
    tone: "light",
    tagline: "Botanical Academy Vellum, Deep Forest Emerald & Serpent Gold",
    description: "Light Edition of Songbirds & Snakes. Pale botanical mint parchment with crisp deep forest ink, rich Academy emerald, and antique Coriolanus gold.",
    bgHex: "#eef7f0",
    cardHex: "#fafefb",
    accentHex: "#15803D",
    highlightHex: "#B45309",
    borderHex: "#15803d",
    vars: {
      background: "#eef7f0",
      foreground: "#06160c",
      card: "#fafefb",
      cardForeground: "#06160c",
      popover: "#ffffff",
      popoverForeground: "#06160c",
      primary: "#15803D",
      primaryForeground: "#ffffff",
      secondary: "#d9eddE",
      secondaryForeground: "#06160c",
      muted: "#d2e9d8",
      mutedForeground: "#355940",
      accent: "#B45309",
      accentForeground: "#ffffff",
      destructive: "#dc2626",
      destructiveForeground: "#ffffff",
      border: "rgba(21, 128, 61, 0.65)",
      input: "#cae4d1",
      ring: "#15803D",
      themeGlow: "rgba(21, 128, 61, 0.3)",
      themeSurface: "rgba(250, 254, 251, 0.98)",
      themeSurfaceBorder: "rgba(21, 128, 61, 0.6)",
    },
  },
  "sunrise-reaping": {
    id: "sunrise-reaping",
    bookNumber: 5,
    bookTitle: "Sunrise on the Reaping",
    name: "Book 5 • Sunrise on the Reaping",
    codename: "VOL. 05 // DAWN AMETHYST",
    tone: "light",
    tagline: "Lavender Dawn Alabaster, Imperial Royal Violet & Sunburst Gold",
    description: "Light Edition of Sunrise on the Reaping. Luminous dawn lavender alabaster with deep royal midnight violet ink, rich imperial purple, and solar flare gold.",
    bgHex: "#f5eefa",
    cardHex: "#fcf9ff",
    accentHex: "#7E22CE",
    highlightHex: "#D97706",
    borderHex: "#7e22ce",
    vars: {
      background: "#f5eefa",
      foreground: "#140621",
      card: "#fcf9ff",
      cardForeground: "#140621",
      popover: "#ffffff",
      popoverForeground: "#140621",
      primary: "#7E22CE",
      primaryForeground: "#ffffff",
      secondary: "#ebddf4",
      secondaryForeground: "#140621",
      muted: "#e4d3f0",
      mutedForeground: "#583870",
      accent: "#D97706",
      accentForeground: "#ffffff",
      destructive: "#be123c",
      destructiveForeground: "#ffffff",
      border: "rgba(126, 34, 206, 0.65)",
      input: "#ddc9eb",
      ring: "#7E22CE",
      themeGlow: "rgba(126, 34, 206, 0.3)",
      themeSurface: "rgba(252, 249, 255, 0.98)",
      themeSurfaceBorder: "rgba(126, 34, 206, 0.6)",
    },
  },
};

export const BOOK_LIST_DARK = Object.values(BOOK_PALETTES_DARK);
export const BOOK_LIST_LIGHT = Object.values(BOOK_PALETTES_LIGHT);

interface ThemeContextType {
  colorMode: ColorMode;
  resolvedMode: "light" | "dark";
  setColorMode: (mode: ColorMode) => void;
  toggleColorMode: () => void;
  selectedBookId: BookId;
  setSelectedBookId: (id: BookId) => void;
  activePalette: PaletteInfo;
  availablePalettes: PaletteInfo[];
  setPalette: (id: BookId) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_COLOR_MODE_KEY = "hg_color_mode_v8";
const STORAGE_BOOK_ID_KEY = "hg_selected_book_v8";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [colorMode, setColorModeState] = useState<ColorMode>("dark");
  const [selectedBookId, setSelectedBookIdState] = useState<BookId>("the-hunger-games");
  const [systemIsDark, setSystemIsDark] = useState<boolean>(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const storedMode = localStorage.getItem(STORAGE_COLOR_MODE_KEY) as ColorMode | null;
      if (storedMode && (storedMode === "system" || storedMode === "light" || storedMode === "dark")) {
        setColorModeState(storedMode);
      }
      const storedBookId = localStorage.getItem(STORAGE_BOOK_ID_KEY) as BookId | null;
      if (storedBookId && storedBookId in BOOK_PALETTES_DARK) {
        setSelectedBookIdState(storedBookId);
      }
    } catch {
      // Storage unavailable
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemIsDark(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setSystemIsDark(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const resolvedMode: "light" | "dark" =
    colorMode === "system" ? (systemIsDark ? "dark" : "light") : colorMode;

  const setSelectedBookId = useCallback((id: BookId) => {
    setSelectedBookIdState(id);
    try {
      localStorage.setItem(STORAGE_BOOK_ID_KEY, id);
    } catch {
      // Storage unavailable
    }
  }, []);

  const setPalette = setSelectedBookId;

  const setColorMode = useCallback((mode: ColorMode) => {
    setColorModeState(mode);
    try {
      localStorage.setItem(STORAGE_COLOR_MODE_KEY, mode);
    } catch {
      // Storage unavailable
    }
  }, []);

  const toggleColorMode = useCallback(() => {
    setColorModeState((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(STORAGE_COLOR_MODE_KEY, next);
      } catch {
        // Storage unavailable
      }
      return next;
    });
  }, []);

  const activePalette =
    resolvedMode === "dark"
      ? BOOK_PALETTES_DARK[selectedBookId] || BOOK_PALETTES_DARK["the-hunger-games"]
      : BOOK_PALETTES_LIGHT[selectedBookId] || BOOK_PALETTES_LIGHT["the-hunger-games"];

  const availablePalettes =
    resolvedMode === "dark" ? BOOK_LIST_DARK : BOOK_LIST_LIGHT;

  // Direct, guaranteed injection of CSS custom properties into :root
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-archetype", "vanguard");
    root.setAttribute("data-palette", activePalette.id);
    root.setAttribute("data-theme-mode", resolvedMode);

    if (resolvedMode === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.remove("dark");
      root.classList.add("light");
    }

    // Direct inline CSS variable injection on document.documentElement for 100% immediate reactivity
    const v = activePalette.vars;
    root.style.setProperty("--background", v.background);
    root.style.setProperty("--foreground", v.foreground);
    root.style.setProperty("--card", v.card);
    root.style.setProperty("--card-foreground", v.cardForeground);
    root.style.setProperty("--popover", v.popover);
    root.style.setProperty("--popover-foreground", v.popoverForeground);
    root.style.setProperty("--primary", v.primary);
    root.style.setProperty("--primary-foreground", v.primaryForeground);
    root.style.setProperty("--secondary", v.secondary);
    root.style.setProperty("--secondary-foreground", v.secondaryForeground);
    root.style.setProperty("--muted", v.muted);
    root.style.setProperty("--muted-foreground", v.mutedForeground);
    root.style.setProperty("--accent", v.accent);
    root.style.setProperty("--accent-foreground", v.accentForeground);
    root.style.setProperty("--destructive", v.destructive);
    root.style.setProperty("--destructive-foreground", v.destructiveForeground);
    root.style.setProperty("--border", v.border);
    root.style.setProperty("--input", v.input);
    root.style.setProperty("--ring", v.ring);
    root.style.setProperty("--theme-glow", v.themeGlow);
    root.style.setProperty("--theme-surface", v.themeSurface);
    root.style.setProperty("--theme-surface-border", v.themeSurfaceBorder);
  }, [resolvedMode, activePalette]);

  return (
    <ThemeContext.Provider
      value={{
        colorMode,
        resolvedMode: mounted ? resolvedMode : "dark",
        setColorMode,
        toggleColorMode,
        selectedBookId,
        setSelectedBookId,
        activePalette,
        availablePalettes,
        setPalette,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeEngine() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemeEngine must be used within a ThemeProvider");
  }
  return context;
}
