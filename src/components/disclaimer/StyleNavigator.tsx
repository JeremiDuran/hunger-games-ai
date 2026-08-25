"use client";

import React from "react";
import {
  Sun,
  Moon,
  Monitor,
  BookOpen,
  Radio,
  Sparkles,
  Flame,
  Feather,
  Crown,
  Shield,
  Layers,
} from "lucide-react";
import { useThemeEngine } from "@/lib/theme-context";

const BOOK_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "the-hunger-games": Crown,
  "catching-fire": Flame,
  "mockingjay": Feather,
  "songbirds-snakes": Shield,
  "sunrise-reaping": Sparkles,
};

export function StyleNavigator() {
  const {
    colorMode,
    resolvedMode,
    setColorMode,
    activePalette,
    availablePalettes,
    setPalette,
  } = useThemeEngine();

  const ActiveIcon = BOOK_ICONS[activePalette.id] || BookOpen;

  return (
    <header className="w-full max-w-5xl mx-auto pt-6 px-4 flex flex-col gap-3.5 z-30 relative">
      {/* Top HUD Status & Theme Identity Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card/95 border-2 border-primary/60 p-3.5 clip-chamfer-md shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
        {/* Left: Active Book Edition Identity */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div
            className="flex h-11 w-11 items-center justify-center clip-chamfer-sm text-black shadow-md shrink-0 border border-white/40 transition-all duration-300"
            style={{ backgroundColor: activePalette.accentHex }}
          >
            <ActiveIcon className="h-6 w-6 fill-current" />
          </div>
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-serif font-bold tracking-widest uppercase text-foreground">
                {activePalette.bookTitle || "Gilded Insurgent HUD"}
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/40 text-[9px] font-mono font-bold uppercase">
                <Radio className="h-2.5 w-2.5 animate-pulse" />
                {activePalette.codename}
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground font-mono truncate max-w-xs sm:max-w-md">
              {activePalette.tagline}
            </span>
          </div>
        </div>

        {/* Right: Color Mode Switcher */}
        <div className="flex items-center gap-1 bg-muted/60 border border-border p-1 clip-chamfer-xs self-end sm:self-auto shrink-0">
          {(["system", "light", "dark"] as const).map((mode) => {
            const isActive = colorMode === mode;
            return (
              <button
                key={mode}
                type="button"
                onClick={() => setColorMode(mode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 clip-chamfer-xs text-xs font-medium transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-primary text-primary-foreground font-bold shadow-md scale-102"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
                title={`Switch to ${mode} mode`}
              >
                {mode === "system" && <Monitor className="h-3.5 w-3.5" />}
                {mode === "light" && <Sun className="h-3.5 w-3.5" />}
                {mode === "dark" && <Moon className="h-3.5 w-3.5" />}
                <span className="capitalize hidden sm:inline">{mode}</span>
                {mode === "system" && (
                  <span className="text-[9px] opacity-70">
                    ({resolvedMode})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Book Edition Navigation Bar (5 Official Hunger Games Books in Dark Mode) */}
      <nav
        aria-label="Official Book Edition Palette Selector"
        className="w-full flex items-center gap-2 p-2 clip-chamfer-md border-2 border-primary/50 bg-card/90 shadow-lg overflow-x-auto scrollbar-none"
      >
        <div className="hidden xl:flex items-center gap-1.5 px-3 text-[11px] font-mono text-muted-foreground shrink-0 border-r border-border">
          <BookOpen className="h-4 w-4 text-primary animate-pulse" />
          <span className="font-bold uppercase tracking-wider">
            {resolvedMode === "dark" ? "Book Editions:" : "Light Editions:"}
          </span>
        </div>

        <div className="flex items-center gap-2 w-full justify-between sm:justify-start">
          {availablePalettes.map((palette) => {
            const isSelected = palette.id === activePalette.id;
            const Icon = BOOK_ICONS[palette.id] || BookOpen;

            return (
              <button
                key={palette.id}
                type="button"
                onClick={() => setPalette(palette.id)}
                className={`group flex-1 sm:flex-initial flex items-center gap-2.5 px-3.5 py-2 clip-chamfer-sm text-xs transition-all duration-200 cursor-pointer whitespace-nowrap border ${
                  isSelected
                    ? "bg-primary/20 border-primary text-foreground font-bold shadow-[0_0_16px_var(--theme-glow)] scale-[1.02]"
                    : "bg-muted/40 border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/80 hover:border-border"
                }`}
              >
                {/* 2-Color Swatch Preview Ring */}
                <div className="relative flex items-center justify-center h-5 w-5 shrink-0">
                  <div
                    className="absolute inset-0 rounded-full border border-black/40 shadow-xs"
                    style={{ backgroundColor: palette.bgHex }}
                  />
                  <div
                    className="absolute inset-1 rounded-full border border-white/30 shadow-xs"
                    style={{ backgroundColor: palette.accentHex }}
                  />
                </div>

                <div className="flex flex-col text-left">
                  <div className="flex items-center gap-1">
                    {palette.bookNumber && (
                      <span className="text-[9px] font-mono font-bold px-1 rounded bg-muted text-foreground/80">
                        VOL. {palette.bookNumber}
                      </span>
                    )}
                    <span className="text-xs font-semibold leading-tight">
                      {palette.bookTitle || palette.name}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono text-primary uppercase font-bold tracking-tight opacity-90">
                    {palette.codename.split("//")[1]?.trim() || palette.codename}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
