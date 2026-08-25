"use client";

import React, { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ThemeProvider, useThemeEngine } from "@/lib/theme-context";
import { StyleNavigator } from "@/components/disclaimer/StyleNavigator";
import { DisclaimerCard } from "@/components/disclaimer/DisclaimerCard";
import { ThemePreviewShowcase } from "@/components/disclaimer/ThemePreviewShowcase";

// Register GSAP plugins
if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP);
}

function DisclaimerPageContent() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showcaseOpen, setShowcaseOpen] = useState(true);
  const { activePalette } = useThemeEngine();

  // Entrance animations using GSAP
  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.from(".gsap-header", {
        y: -25,
        opacity: 0,
        duration: 0.7,
      })
        .from(
          ".gsap-card",
          {
            y: 35,
            opacity: 0,
            duration: 0.9,
            scale: 0.97,
          },
          "-=0.4"
        )
        .from(
          ".gsap-showcase",
          {
            y: 25,
            opacity: 0,
            duration: 0.7,
          },
          "-=0.3"
        );
    },
    { scope: containerRef, dependencies: [] }
  );

  return (
    <div
      ref={containerRef}
      className="min-h-screen relative flex flex-col justify-between overflow-x-hidden bg-background text-foreground transition-colors duration-500 pb-20 selection:bg-primary selection:text-primary-foreground"
    >
      {/* Dynamic Background Glows and Atmospheric Vignette */}
      <div
        className="fixed inset-0 pointer-events-none transition-all duration-700 -z-10 opacity-40"
        style={{
          background: `radial-gradient(circle at 50% 20%, ${activePalette.accentHex}25 0%, transparent 70%)`,
        }}
      />

      {/* Style & Palette Controls */}
      <div className="gsap-header">
        <StyleNavigator />
      </div>

      {/* Main Content Area: Disclaimer Card & Gilded HUD Component Lab */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 flex flex-col items-center justify-center z-20">
        <div className="gsap-card w-full">
          <DisclaimerCard
            showcaseOpen={showcaseOpen}
            onToggleShowcase={() => setShowcaseOpen((prev) => !prev)}
          />
        </div>

        {showcaseOpen && (
          <div className="gsap-showcase w-full">
            <ThemePreviewShowcase />
          </div>
        )}
      </main>

      {/* Footer Branding */}
      <footer className="w-full text-center text-[11px] font-mono text-muted-foreground py-4 z-20">
        <p>
          Hunger Games AI Simulator • Non-Commercial Fan Project • Gilded Insurgent HUD Theme
        </p>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <ThemeProvider>
      <DisclaimerPageContent />
    </ThemeProvider>
  );
}
