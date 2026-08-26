"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useTranslations } from "next-intl";
import { Shield, Sparkles, ArrowRight, Check } from "lucide-react";
import { SetupProvider, useSetup } from "@/lib/setup/setup-context";
import { SetupHeaderNav } from "@/components/setup/SetupHeaderNav";
import { ArenaPresetSelector } from "@/components/setup/ArenaPresetSelector";
import { ArenaForm } from "@/components/setup/ArenaForm";
import { BackgroundConstellation } from "@/components/landing/backgrounds/BackgroundConstellation";
import { ThemeSidePanel } from "@/components/disclaimer/ThemeSidePanel";
import { AuthStatusBadge } from "@/components/auth/AuthStatusBadge";
import { useThemeEngine } from "@/lib/theme-context";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP);
}

function SetupStagingContent() {
  const t = useTranslations("setup");
  const containerRef = useRef<HTMLDivElement>(null);
  const { activeTab, arenaState } = useSetup();
  const { activePalette } = useThemeEngine();

  useGSAP(
    () => {
      const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (prefersReducedMotion) {
        gsap.set([".setup-hero", ".setup-presets", ".setup-form", ".setup-footer"], {
          opacity: 1,
          y: 0,
        });
        return;
      }

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.fromTo(
        ".setup-hero",
        { opacity: 0, y: -15 },
        { opacity: 1, y: 0, duration: 0.5 }
      )
        .fromTo(
          ".setup-presets",
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.5 },
          "-=0.2"
        )
        .fromTo(
          ".setup-form",
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.6 },
          "-=0.2"
        )
        .fromTo(
          ".setup-footer",
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.4 },
          "-=0.2"
        );
    },
    { scope: containerRef, dependencies: [] }
  );

  return (
    <div
      ref={containerRef}
      className="min-h-screen relative flex flex-col justify-between overflow-x-hidden bg-background text-foreground transition-colors duration-500 selection:bg-primary selection:text-primary-foreground"
    >
      {/* Background Ambience */}
      <BackgroundConstellation />

      {/* Floating Theme & Language Selector */}
      <ThemeSidePanel />

      {/* Persistent Top Navigation Bar */}
      <SetupHeaderNav />

      {/* Main Workspace Container */}
      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 z-20 outline-none space-y-10"
      >
        {/* Hero Header */}
        <div className="setup-hero pb-4 border-b border-border/60">
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-black tracking-wider uppercase text-foreground">
              {t("header.title")}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground font-light max-w-2xl">
              {t("header.subtitle")}
            </p>
          </div>
        </div>

        {/* Section 1: Presets Loader */}
        <div className="setup-presets">
          <ArenaPresetSelector />
        </div>

        {/* Section 2: Interactive Arena & Biome Form */}
        <div className="setup-form">
          <ArenaForm />
        </div>

        {/* Pre-Flight Staging Footer Bar */}
        <div className="setup-footer sticky bottom-4 z-30 w-full p-4 sm:p-5 clip-chamfer-md bg-card/95 backdrop-blur-md border-2 border-primary/60 shadow-[0_0_30px_var(--theme-glow),0_10px_30px_rgba(0,0,0,0.5)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 clip-chamfer-xs bg-primary/15 border border-primary/40 text-primary hidden sm:block">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">
                  {arenaState.simulationTitle || "The 74th Annual Hunger Games"}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 clip-chamfer-xs border border-emerald-500/30">
                  <Check className="h-3 w-3" />
                  Ready
                </span>
              </div>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">
                Arena Codename: <strong className="text-primary">{arenaState.arenaName || "Custom Arena"}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            style={{
              background: `linear-gradient(to right, ${activePalette.accentHex}, ${activePalette.highlightHex})`,
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 clip-chamfer-sm text-black font-mono font-bold text-xs sm:text-sm tracking-wider uppercase border border-yellow-300 shadow-[0_0_20px_var(--theme-glow),0_4px_0_rgba(0,0,0,0.3)] hover:brightness-110 active:translate-y-0.5 active:shadow-none transition-all duration-200 cursor-pointer"
          >
            <span>{t("header.nextStep")}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </main>
    </div>
  );
}

export default function SetupPage() {
  return (
    <SetupProvider>
      <SetupStagingContent />
    </SetupProvider>
  );
}
