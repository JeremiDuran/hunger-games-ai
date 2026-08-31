"use client";

import React, { useRef, useCallback, useEffect } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useTranslations } from "next-intl";
import { Sparkles, ArrowRight, ArrowLeft, Check, AlertCircle, ShieldCheck } from "lucide-react";
import { SetupProvider, useSetup } from "@/lib/setup/setup-context";
import { SetupHeaderNav } from "@/components/setup/SetupHeaderNav";
import { ArenaPresetSelector } from "@/components/setup/ArenaPresetSelector";
import { ArenaForm } from "@/components/setup/ArenaForm";
import { TributeRoster } from "@/components/setup/tributes/TributeRoster";
import { BackgroundArenaHolo } from "@/components/setup/backgrounds/BackgroundArenaHolo";
import { ThemeSidePanel } from "@/components/disclaimer/ThemeSidePanel";
import { useThemeEngine } from "@/lib/theme-context";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP);
}

function SetupStagingContent() {
  const t = useTranslations("setup");
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    activeTab,
    setActiveTab,
    arenaState,
    tributes,
    districtCount,
    isArenaValid,
    isTributesValid,
    validateArenaStep,
    validateTributesStep,
  } = useSetup();
  const { activePalette } = useThemeEngine();

  useGSAP(
    () => {
      const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (prefersReducedMotion) {
        gsap.set([".setup-hero", ".setup-body", ".setup-footer"], {
          opacity: 1,
          y: 0,
        });
        return;
      }

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.fromTo(
        ".setup-hero",
        { opacity: 0, y: -15 },
        { opacity: 1, y: 0, duration: 0.4, clearProps: "transform" }
      )
        .fromTo(
          ".setup-body",
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.5, clearProps: "transform" },
          "-=0.1"
        )
        .fromTo(
          ".setup-footer",
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.4, clearProps: "transform" },
          "-=0.2"
        );
    },
    { scope: containerRef, dependencies: [activeTab] }
  );

  const handleProceed = useCallback(() => {
    if (activeTab === "arena") {
      const isValid = validateArenaStep();
      if (!isValid) {
        const firstInvalidInput = document.querySelector<HTMLElement>('[aria-invalid="true"]');
        if (firstInvalidInput) {
          firstInvalidInput.focus();
          firstInvalidInput.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        return;
      }
      setActiveTab("tributes");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (activeTab === "tributes") {
      const isArenaOk = validateArenaStep();
      if (!isArenaOk) {
        setActiveTab("arena");
        return;
      }

      const isTributesOk = validateTributesStep();
      if (!isTributesOk) {
        const firstInvalidInput = document.querySelector<HTMLElement>('[aria-invalid="true"]');
        if (firstInvalidInput) {
          firstInvalidInput.focus();
          firstInvalidInput.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        return;
      }
      setActiveTab("rules");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [activeTab, validateArenaStep, validateTributesStep, setActiveTab]);

  const handlePrevious = useCallback(() => {
    if (activeTab === "tributes") {
      setActiveTab("arena");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (activeTab === "rules") {
      setActiveTab("tributes");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [activeTab, setActiveTab]);

  // Keyboard shortcut Ctrl+Enter / Cmd+Enter to proceed
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleProceed();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleProceed]);

  const currentStepReady =
    activeTab === "arena" ? isArenaValid : activeTab === "tributes" ? isTributesValid : isArenaValid && isTributesValid;

  return (
    <div
      ref={containerRef}
      className="min-h-screen relative flex flex-col justify-between overflow-x-clip bg-background text-foreground transition-colors duration-500 selection:bg-primary selection:text-primary-foreground"
    >
      {/* Flavorful Holographic Arena Background */}
      <BackgroundArenaHolo />

      {/* Floating Theme & Language Selector */}
      <ThemeSidePanel />

      {/* Persistent Top Navigation Bar */}
      <SetupHeaderNav />

      {/* Main Workspace Container */}
      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 z-20 outline-none space-y-8"
      >
        {/* Hero Header */}
        <div className="setup-hero pb-2 border-b border-border/60">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-black tracking-wider uppercase text-foreground">
            {t("header.title")}
          </h1>
        </div>

        {/* Dynamic Body Content according to activeTab */}
        <div className="setup-body space-y-8">
          {activeTab === "arena" && (
            <>
              {/* Section 1: Presets Loader */}
              <div className="setup-presets">
                <ArenaPresetSelector />
              </div>

              {/* Section 2: Interactive Arena & Lore Form */}
              <div className="setup-form">
                <ArenaForm />
              </div>
            </>
          )}

          {activeTab === "tributes" && (
            <div>
              <TributeRoster />
            </div>
          )}

          {activeTab === "rules" && (
            <div className="p-8 clip-chamfer-md bg-card/90 border-2 border-primary/40 space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-3 clip-chamfer-xs bg-primary/10 border border-primary/40 text-primary">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-mono font-bold uppercase tracking-wider text-foreground">
                    Launch Protocol & Pre-Flight Review
                  </h2>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">
                    Subsystem review for {arenaState.simulationTitle}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 clip-chamfer-sm bg-background/80 border border-border space-y-2">
                  <span className="text-[11px] font-mono uppercase text-muted-foreground block font-bold">
                    Arena Specification
                  </span>
                  <p className="text-sm font-mono font-bold text-foreground">
                    {arenaState.arenaName}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono line-clamp-3">
                    {arenaState.arenaDescription}
                  </p>
                </div>

                <div className="p-4 clip-chamfer-sm bg-background/80 border border-border space-y-2">
                  <span className="text-[11px] font-mono uppercase text-muted-foreground block font-bold">
                    Tribute Roster Capacity
                  </span>
                  <p className="text-sm font-mono font-bold text-foreground">
                    {tributes.length} Active Tributes ({districtCount} Districts)
                  </p>
                  <p className="text-xs text-emerald-400 font-mono">
                    All slots verified and ready for Cornucopia deployment.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pre-Flight Staging Footer Bar */}
        <div className="setup-footer sticky bottom-4 z-30 w-full p-4 sm:p-5 clip-chamfer-md bg-card/95 backdrop-blur-md border-2 border-primary/60 shadow-[0_0_30px_var(--theme-glow),0_10px_30px_rgba(0,0,0,0.5)] flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Status Label */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="p-2 clip-chamfer-xs bg-primary/15 border border-primary/40 text-primary hidden sm:block">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">
                  {arenaState.simulationTitle || "The 74th Annual Hunger Games"}
                </span>
                {currentStepReady ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 clip-chamfer-xs border border-emerald-500/30">
                    <Check className="h-3 w-3" />
                    {t("status.ready")}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 clip-chamfer-xs border border-amber-500/30">
                    <AlertCircle className="h-3 w-3" />
                    {t("status.validationError")}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">
                {activeTab === "arena" ? (
                  <>
                    Arena: <strong className="text-primary">{arenaState.arenaName || "Custom Arena"}</strong>
                  </>
                ) : (
                  <>
                    Roster: <strong className="text-primary">{tributes.length} Tributes</strong> ({districtCount} Districts)
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            {activeTab !== "arena" && (
              <button
                type="button"
                onClick={handlePrevious}
                className="px-4 py-3.5 clip-chamfer-sm bg-muted/50 hover:bg-muted/80 text-foreground font-mono font-bold text-xs sm:text-sm tracking-wider uppercase border border-border transition-colors cursor-pointer inline-flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>{activeTab === "tributes" ? t("header.previousStep") : t("header.previousStepTributes")}</span>
              </button>
            )}

            {activeTab !== "rules" ? (
              <button
                type="button"
                onClick={handleProceed}
                style={{
                  background: `linear-gradient(to right, ${activePalette.accentHex}, ${activePalette.highlightHex})`,
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 clip-chamfer-sm text-black font-mono font-bold text-xs sm:text-sm tracking-wider uppercase border border-yellow-300 shadow-[0_0_20px_var(--theme-glow),0_4px_0_rgba(0,0,0,0.3)] hover:brightness-110 active:translate-y-0.5 active:shadow-none transition-all duration-200 cursor-pointer"
              >
                <span>{activeTab === "arena" ? t("header.nextStepTributes") : t("header.nextStepRules")}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : null}
          </div>
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
