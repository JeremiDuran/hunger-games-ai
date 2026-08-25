"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ThemeProvider, useThemeEngine } from "@/lib/theme-context";
import { ThemeSidePanel } from "@/components/disclaimer/ThemeSidePanel";
import { DisclaimerCard } from "@/components/disclaimer/DisclaimerCard";

// Register GSAP plugins
if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP);
}

function DisclaimerPageContent() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { activePalette } = useThemeEngine();

  // Entrance animations using GSAP
  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.from(".gsap-card", {
        y: 30,
        opacity: 0,
        duration: 0.8,
        scale: 0.98,
      }).from(
        ".gsap-footer",
        {
          opacity: 0,
          y: 10,
          duration: 0.6,
        },
        "-=0.3"
      );
    },
    { scope: containerRef, dependencies: [] }
  );

  return (
    <div
      ref={containerRef}
      className="min-h-screen relative flex flex-col justify-between overflow-x-hidden bg-background text-foreground transition-colors duration-500 selection:bg-primary selection:text-primary-foreground"
    >
      {/* Dynamic Background Atmospheric Glow */}
      <div
        className="fixed inset-0 pointer-events-none transition-all duration-700 -z-10 opacity-35"
        style={{
          background: `radial-gradient(circle at 50% 30%, ${activePalette.accentHex}25 0%, transparent 70%)`,
        }}
      />

      {/* Floating Side Theme Selector */}
      <ThemeSidePanel />

      {/* Main Content Area: Disclaimer Notice */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-12 flex flex-col items-center justify-center z-20">
        <div className="gsap-card w-full">
          <DisclaimerCard />
        </div>
      </main>

      {/* Footer Branding */}
      <footer className="gsap-footer w-full text-center text-xs font-mono text-muted-foreground py-6 px-4 z-20 border-t border-border/40">
        <p>
          Hunger Games AI Simulator • Non-Commercial Fan Project
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
