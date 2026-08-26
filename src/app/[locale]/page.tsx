"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Sword, Keyboard } from "lucide-react";
import { useTranslations } from "next-intl";
import { useThemeEngine } from "@/lib/theme-context";
import { useA11y } from "@/lib/a11y/a11y-context";
import { ThemeSidePanel } from "@/components/disclaimer/ThemeSidePanel";
import { BackgroundConstellation } from "@/components/landing/backgrounds/BackgroundConstellation";
import { AuthActionCards } from "@/components/landing/AuthActionCards";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP);
}

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { activePalette } = useThemeEngine();
  const { openShortcutsModal } = useA11y();
  const t = useTranslations("landing");

  // Entrance animations using GSAP with prefers-reduced-motion safety
  useGSAP(
    () => {
      const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (prefersReducedMotion) {
        gsap.set(
          [
            ".hero-badge",
            ".hero-title",
            ".hero-subtitle",
            ".hero-cards",
            ".hero-footer",
          ],
          { opacity: 1, y: 0, scale: 1 }
        );
        return;
      }

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.fromTo(
        ".hero-badge",
        { opacity: 0, y: -15 },
        { opacity: 1, y: 0, duration: 0.5 }
      )
        .fromTo(
          ".hero-title",
          { opacity: 0, y: 25, scale: 0.96 },
          { opacity: 1, y: 0, scale: 1, duration: 0.7 },
          "-=0.2"
        )
        .fromTo(
          ".hero-subtitle",
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.5 },
          "-=0.3"
        )
        .fromTo(
          ".hero-cards",
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.6 },
          "-=0.2"
        )
        .fromTo(
          ".hero-footer",
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
      {/* GSAP Panem District Constellation Background */}
      <BackgroundConstellation />

      {/* Floating Theme, Visual Palette & Language Selector */}
      <ThemeSidePanel />

      {/* Main Hero Container */}
      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 w-full flex flex-col items-center justify-center px-4 sm:px-6 py-12 lg:py-16 z-20 outline-none"
      >
        <div className="w-full max-w-5xl mx-auto flex flex-col items-center text-center">
          {/* Thematic Hero Badge */}
          <div className="hero-badge inline-flex items-center gap-2 px-4 py-1.5 clip-chamfer-xs bg-primary/15 border border-primary/50 text-primary text-xs font-mono font-bold tracking-widest uppercase mb-4 shadow-[0_0_15px_var(--theme-glow)]">
            <Sword className="h-3.5 w-3.5 text-primary" />
            <span>{t("heroBadge")}</span>
          </div>

          {/* Monumental Hero Title */}
          <h1
            className="hero-title text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-black tracking-wider uppercase text-transparent bg-clip-text text-shadow-gold mb-3 transition-all duration-300"
            style={{
              backgroundImage: `linear-gradient(to right, ${activePalette.accentHex}, #ffffff, ${activePalette.highlightHex})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {t("heroTitle")}
          </h1>

          {/* Punchy Lore Subtitle */}
          <p className="hero-subtitle max-w-2xl text-xs sm:text-sm md:text-base text-muted-foreground font-light leading-relaxed mb-8 sm:mb-10">
            {t("heroSubtitle")}
          </p>

          {/* Streamlined Dual Onboarding Cards */}
          <div className="hero-cards w-full">
            <AuthActionCards />
          </div>
        </div>
      </main>

      {/* Clean Capitol Footer with A11y Shortcut Trigger */}
      <footer className="hero-footer w-full flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono text-muted-foreground py-4 px-6 z-20 border-t border-border/40 bg-background/60 backdrop-blur-xs">
        <p>{t("footer")}</p>
        <button
          type="button"
          onClick={openShortcutsModal}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 clip-chamfer-xs bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60 hover:border-primary/50 transition-colors cursor-pointer text-[11px]"
        >
          <Keyboard className="h-3.5 w-3.5 text-primary" />
          <span>{t("directives")}</span>
          <kbd className="px-1 py-0.2 rounded bg-background border border-border text-[10px] font-bold">
            ?
          </kbd>
        </button>
      </footer>
    </div>
  );
}
