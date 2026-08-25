"use client";

import React, { useEffect, useRef, useState } from "react";
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
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useThemeEngine, type VisualId, type ColorMode } from "@/lib/theme-context";

const VISUAL_ICONS: Record<VisualId, LucideIcon> = {
  mockingjay: Crown,
  fire: Flame,
  revolt: Feather,
  serpent: Shield,
  reaping: Sparkles,
};

export function ThemeSidePanel() {
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

  return (
    <>
      {/* Palette Toggle Trigger Button — Icon Only with tooltip */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        title="Theme & Appearance"
        aria-label="Customize theme and appearance"
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

      {/* Side Panel Drawer: Compact icon dock on Desktop, Full panel on Mobile/Tablet */}
      <aside
        id="theme-side-panel"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Theme and Appearance Settings"
        className={`fixed top-0 right-0 h-full bg-card/95 border-l-2 border-primary/50 text-card-foreground shadow-[0_0_40px_var(--theme-glow),-10px_0_30px_rgba(0,0,0,0.5)] z-50 flex flex-col backdrop-blur-md transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        } w-72 sm:w-80 md:w-16`}
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

          {/* Middle: Visual Themes + Color Modes */}
          <div className="flex flex-col items-center gap-5 my-auto">
            {/* Color Mode Icons */}
            <div className="flex flex-col items-center gap-1.5 p-1 clip-chamfer-xs bg-muted/60 border border-border">
              {(
                [
                  { id: "system", label: "System Mode", icon: Monitor },
                  { id: "light", label: "Light Mode", icon: Sun },
                  { id: "dark", label: "Dark Mode", icon: Moon },
                ] as const
              ).map((mode) => {
                const Icon = mode.icon;
                const isActive = colorMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    title={mode.label}
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

            {/* Visual Themes Swatches (Order: mockingjay, fire, revolt, serpent, reaping) */}
            <div className="flex flex-col items-center gap-2">
              {availablePalettes.map((palette) => {
                const isSelected = palette.id === selectedVisualId;
                const Icon = VISUAL_ICONS[palette.id] || Crown;

                return (
                  <button
                    key={palette.id}
                    type="button"
                    title={palette.name}
                    onClick={() => setSelectedVisualId(palette.id)}
                    className={`relative group h-9 w-9 flex items-center justify-center clip-chamfer-xs border transition-all duration-150 cursor-pointer ${
                      isSelected
                        ? "border-primary bg-primary/20 shadow-[0_0_12px_var(--theme-glow)] scale-105"
                        : "border-border/60 bg-muted/40 hover:border-border hover:bg-muted/80"
                    }`}
                  >
                    {/* Swatch indicator circle */}
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

          {/* Bottom: Active Theme Indicator */}
          <div
            className="h-8 w-8 flex items-center justify-center clip-chamfer-xs border border-primary/40 bg-muted/40"
            title={`Active: ${activePalette.name} (${resolvedMode})`}
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
                Appearance
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
            {/* Mode Selector */}
            <section className="space-y-2.5">
              <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-muted-foreground block">
                Color Mode
              </span>
              <div className="grid grid-cols-3 gap-1.5 p-1 clip-chamfer-xs bg-muted/60 border border-border">
                {(
                  [
                    { id: "system", label: "System", icon: Monitor },
                    { id: "light", label: "Light", icon: Sun },
                    { id: "dark", label: "Dark", icon: Moon },
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
                      <span className="text-[10px]">{mode.label}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Visual Theme Selector */}
            <section className="space-y-2.5">
              <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-muted-foreground block">
                Visual Theme
              </span>
              <div className="space-y-2">
                {availablePalettes.map((palette) => {
                  const isSelected = palette.id === selectedVisualId;
                  const Icon = VISUAL_ICONS[palette.id] || Crown;

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
                          {palette.name}
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
              Current: <span className="text-primary font-bold">{activePalette.name}</span> ({resolvedMode})
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
