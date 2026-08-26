"use client";

import React, { useEffect, useRef, useState, useTransition } from "react";
import {
  Palette,
  X,
  Sun,
  Moon,
  Monitor,
  Check,
  Flame,
  Feather,
  Crown,
  Shield,
  Sparkles,
  Globe,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useThemeEngine, type VisualId, type ColorMode } from "@/lib/theme-context";

const VISUAL_ICONS: Record<VisualId, LucideIcon> = {
  mockingjay: Crown,
  fire: Flame,
  revolt: Feather,
  serpent: Shield,
  reaping: Sparkles,
};

export function ThemeSidePanel() {
  const t = useTranslations("theme");
  const currentLocale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  const {
    colorMode,
    resolvedMode,
    setColorMode,
    selectedVisualId,
    setSelectedVisualId,
    availablePalettes,
    activePalette,
  } = useThemeEngine();

  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const handleLanguageChange = (newLocale: "en" | "es") => {
    if (newLocale === currentLocale) return;
    startTransition(() => {
      router.replace(pathname, { locale: newLocale });
    });
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isOpen &&
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const translatedPaletteName = (id: string, defaultName: string) => {
    try {
      return t(`palettes.${id}` as never);
    } catch {
      return defaultName;
    }
  };

  return (
    <>
      {/* Palette Toggle Trigger Button — Icon Only with tooltip */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        title={t("title")}
        aria-label={t("title")}
        aria-expanded={isOpen}
        aria-controls="theme-side-panel"
        className="fixed top-4 right-4 z-40 flex items-center justify-center h-10 w-10 clip-chamfer-xs bg-card/90 border border-primary/60 text-foreground backdrop-blur-md shadow-[0_0_20px_var(--theme-glow),0_4px_12px_rgba(0,0,0,0.4)] hover:bg-muted/80 hover:border-primary transition-all duration-200 cursor-pointer active:scale-95"
      >
        <Palette className="h-4 w-4 text-primary animate-pulse" />
      </button>

      {/* Backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 transition-opacity duration-300"
          aria-hidden="true"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Side Panel Drawer */}
      <aside
        id="theme-side-panel"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={t("title")}
        className={`fixed top-0 right-0 h-full bg-card/95 border-l-2 border-primary/50 text-card-foreground shadow-[0_0_40px_var(--theme-glow),-10px_0_30px_rgba(0,0,0,0.5)] z-50 flex flex-col backdrop-blur-md transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        } w-72 sm:w-80 md:w-20`}
      >
        {/* ===================================================================
            DESKTOP COMPACT VIEW (Icon-only with hover titles)
            =================================================================== */}
        <div className="hidden md:flex flex-col items-center justify-between h-full py-4 px-2 space-y-4">
          {/* Top: Close Button */}
          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              title="Close panel"
              aria-label="Close appearance panel"
              className="h-8 w-8 flex items-center justify-center clip-chamfer-xs text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="w-8 h-px bg-border/80" />
          </div>

          {/* Middle: Language + Visual Themes + Color Modes */}
          <div className="flex flex-col items-center gap-4 my-auto">
            {/* Language Switcher Icons */}
            <div className="flex flex-col items-center gap-1 p-1 clip-chamfer-xs bg-muted/60 border border-border">
              {(["en", "es"] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  title={t(`languages.${lang}` as never)}
                  onClick={() => handleLanguageChange(lang)}
                  className={`h-7 w-7 flex items-center justify-center clip-chamfer-xs text-[10px] font-mono uppercase font-bold transition-all duration-150 cursor-pointer ${
                    currentLocale === lang
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>

            <div className="w-8 h-px bg-border/80" />

            {/* Color Mode Icons */}
            <div className="flex flex-col items-center gap-1.5 p-1 clip-chamfer-xs bg-muted/60 border border-border">
              {(
                [
                  { id: "system", labelKey: "modes.system", icon: Monitor },
                  { id: "light", labelKey: "modes.light", icon: Sun },
                  { id: "dark", labelKey: "modes.dark", icon: Moon },
                ] as const
              ).map((mode) => {
                const Icon = mode.icon;
                const isActive = colorMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    title={t(mode.labelKey as never)}
                    onClick={() => setColorMode(mode.id as ColorMode)}
                    className={`h-7 w-7 flex items-center justify-center clip-chamfer-xs transition-all duration-150 cursor-pointer ${
                      isActive
                        ? "bg-primary text-primary-foreground font-bold shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </button>
                );
              })}
            </div>

            <div className="w-8 h-px bg-border/80" />

            {/* Visual Themes Swatches */}
            <div className="flex flex-col items-center gap-2">
              {availablePalettes.map((palette) => {
                const isSelected = palette.id === selectedVisualId;
                const Icon = VISUAL_ICONS[palette.id] || Crown;
                const palName = translatedPaletteName(palette.id, palette.name);

                return (
                  <button
                    key={palette.id}
                    type="button"
                    title={palName}
                    onClick={() => setSelectedVisualId(palette.id)}
                    className={`relative group h-9 w-9 flex items-center justify-center clip-chamfer-xs border transition-all duration-150 cursor-pointer ${
                      isSelected
                        ? "border-primary bg-primary/20 shadow-[0_0_12px_var(--theme-glow)] scale-105"
                        : "border-border/60 bg-muted/40 hover:border-border hover:bg-muted/80"
                    }`}
                  >
                    <div
                      className="h-5 w-5 rounded-full border border-white/20 flex items-center justify-center transition-transform group-hover:scale-110"
                      style={{ backgroundColor: palette.accentHex }}
                    >
                      <Icon className="h-3 w-3 text-black" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom: Active Indicator */}
          <div
            className="h-8 w-8 flex items-center justify-center clip-chamfer-xs border border-primary/40 bg-muted/40"
            title={t("current", {
              theme: translatedPaletteName(activePalette.id, activePalette.name),
              mode: t(`modes.${resolvedMode}` as never),
            })}
          >
            <Palette className="h-3.5 w-3.5 text-primary" />
          </div>
        </div>

        {/* ===================================================================
            MOBILE / TABLET VIEW (Full readable labels for touch devices)
            =================================================================== */}
        <div className="flex md:hidden flex-col h-full">
          {/* Panel Header */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-serif font-bold tracking-widest uppercase text-foreground">
                {t("title")}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close appearance panel"
              className="p-1.5 clip-chamfer-xs text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Panel Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Language Selector */}
            <section className="space-y-2.5">
              <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-primary" />
                <span>{t("language")}</span>
              </span>
              <div className="grid grid-cols-2 gap-2 p-1 clip-chamfer-xs bg-muted/60 border border-border">
                {(["en", "es"] as const).map((lang) => {
                  const isActive = currentLocale === lang;
                  return (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => handleLanguageChange(lang)}
                      className={`py-2 px-3 clip-chamfer-xs text-xs font-mono font-bold uppercase transition-all duration-150 cursor-pointer ${
                        isActive
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                      }`}
                    >
                      {t(`languages.${lang}` as never)}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Mode Selector */}
            <section className="space-y-2.5">
              <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-muted-foreground block">
                {t("colorMode")}
              </span>
              <div className="grid grid-cols-3 gap-1.5 p-1 clip-chamfer-xs bg-muted/60 border border-border">
                {(
                  [
                    { id: "system", labelKey: "modes.system", icon: Monitor },
                    { id: "light", labelKey: "modes.light", icon: Sun },
                    { id: "dark", labelKey: "modes.dark", icon: Moon },
                  ] as const
                ).map((mode) => {
                  const Icon = mode.icon;
                  const isActive = colorMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setColorMode(mode.id as ColorMode)}
                      className={`flex flex-col items-center justify-center gap-1 py-2 px-1 clip-chamfer-xs text-xs font-mono transition-all duration-150 cursor-pointer ${
                        isActive
                          ? "bg-primary text-primary-foreground font-bold shadow-sm"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span className="text-[10px]">
                        {t(mode.labelKey as never)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Visual Theme Selector */}
            <section className="space-y-2.5">
              <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-muted-foreground block">
                {t("visualTheme")}
              </span>
              <div className="space-y-2">
                {availablePalettes.map((palette) => {
                  const isSelected = palette.id === selectedVisualId;
                  const Icon = VISUAL_ICONS[palette.id] || Crown;
                  const palName = translatedPaletteName(
                    palette.id,
                    palette.name
                  );

                  return (
                    <button
                      key={palette.id}
                      type="button"
                      onClick={() => setSelectedVisualId(palette.id)}
                      className={`w-full flex items-center justify-between p-3 clip-chamfer-sm text-left border transition-all duration-150 cursor-pointer ${
                        isSelected
                          ? "bg-primary/15 border-primary shadow-[0_0_15px_var(--theme-glow)]"
                          : "bg-muted/40 border-border/60 hover:bg-muted/80 hover:border-border"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="h-6 w-6 rounded-full border border-white/20 flex items-center justify-center shrink-0"
                          style={{ backgroundColor: palette.accentHex }}
                        >
                          <Icon className="h-3.5 w-3.5 text-black" />
                        </div>

                        <span
                          className={`text-xs font-serif font-bold tracking-wider capitalize ${
                            isSelected ? "text-primary" : "text-foreground"
                          }`}
                        >
                          {palName}
                        </span>
                      </div>

                      {isSelected && (
                        <Check className="h-4 w-4 text-primary font-bold" />
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          </div>

          {/* Panel Footer */}
          <div className="p-3 border-t border-border bg-muted/30 text-center">
            <p className="text-[10px] font-mono text-muted-foreground">
              {t("current", {
                theme: translatedPaletteName(
                  activePalette.id,
                  activePalette.name
                ),
                mode: t(`modes.${resolvedMode}` as never),
              })}
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
