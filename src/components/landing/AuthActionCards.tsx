"use client";

import React from "react";
import Link from "next/link";
import { UserPlus, Play, Sparkles, Flame, ArrowRight } from "lucide-react";
import { useThemeEngine } from "@/lib/theme-context";

interface AuthActionCardsProps {
  className?: string;
}

export function AuthActionCards({ className = "" }: AuthActionCardsProps) {
  const { activePalette } = useThemeEngine();

  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 w-full max-w-4xl mx-auto ${className}`}
    >
      {/* ===================================================================
          CARD 1: CREATE YOUR ACCOUNT (Cloud Citizen Access)
          =================================================================== */}
      <div className="relative group flex flex-col justify-between p-6 sm:p-8 clip-chamfer-md border-2 border-primary/70 bg-card/90 backdrop-blur-md shadow-[0_0_25px_var(--theme-glow),0_20px_50px_rgba(0,0,0,0.5)] hover:border-primary hover:shadow-[0_0_35px_var(--theme-glow)] transition-all duration-300">
        {/* Top Decorative Indicator */}
        <div
          className="absolute top-0 inset-x-0 h-1.5 transition-all duration-500 rounded-t"
          style={{
            background: `linear-gradient(to right, ${activePalette.accentHex}, ${activePalette.highlightHex})`,
          }}
        />

        <div className="space-y-4 mb-6">
          {/* Card Badge Header */}
          <div className="flex items-center justify-between gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 clip-chamfer-xs bg-primary/15 border border-primary/50 text-primary text-xs font-mono font-bold uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>Full Capitol Access</span>
            </div>
            <span className="text-[11px] font-mono text-muted-foreground uppercase">
              Free Tier • Cloud Sync
            </span>
          </div>

          {/* Title & Description */}
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-foreground tracking-wide">
            Create Your Account
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Secure persistent Capitol citizenship. Save game chronicles, build
            bespoke tribute rosters, and unlock permanent archives.
          </p>
        </div>

        {/* CTA Button */}
        <Link
          href="/login"
          style={{
            background: `linear-gradient(to right, ${activePalette.accentHex}, ${activePalette.highlightHex})`,
          }}
          className="w-full flex items-center justify-center gap-2 py-3.5 px-6 clip-chamfer-sm text-black font-mono font-bold text-xs sm:text-sm tracking-wider uppercase border border-yellow-300 shadow-[0_0_20px_var(--theme-glow),0_4px_0_rgba(0,0,0,0.3)] hover:brightness-110 active:translate-y-0.5 active:shadow-none transition-all duration-200 cursor-pointer"
        >
          <UserPlus className="h-4 w-4" />
          <span>APPLY AS GAMEMAKER</span>
          <ArrowRight className="h-4 w-4 ml-1" />
        </Link>
      </div>

      {/* ===================================================================
          CARD 2: CONTINUE AS GUEST (Zero-Friction Fast Play)
          =================================================================== */}
      <div className="relative group flex flex-col justify-between p-6 sm:p-8 clip-chamfer-md border-2 border-border/70 bg-card/75 backdrop-blur-md shadow-[0_15px_40px_rgba(0,0,0,0.4)] hover:border-primary/50 hover:bg-card/85 transition-all duration-300">
        {/* Top Decorative Indicator */}
        <div className="absolute top-0 inset-x-0 h-1 bg-border/60 rounded-t" />

        <div className="space-y-4 mb-6">
          {/* Card Badge Header */}
          <div className="flex items-center justify-between gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 clip-chamfer-xs bg-muted/60 border border-border text-muted-foreground text-xs font-mono font-bold uppercase tracking-wider">
              <Flame className="h-3.5 w-3.5 text-primary" />
              <span>Instant Simulation</span>
            </div>
            <span className="text-[11px] font-mono text-muted-foreground uppercase">
              Zero Login Required
            </span>
          </div>

          {/* Title & Description */}
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-foreground tracking-wide">
            Continue as Guest
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Jump directly into the arena without registering. Configure your
            first Hunger Games and experience autonomous procedural combat.
          </p>
        </div>

        {/* CTA Button */}
        <Link
          href="/setup"
          className="w-full flex items-center justify-center gap-2 py-3.5 px-6 clip-chamfer-sm bg-muted/80 hover:bg-primary/20 text-foreground font-mono font-bold text-xs sm:text-sm tracking-wider uppercase border border-border hover:border-primary shadow-sm hover:shadow-[0_0_20px_var(--theme-glow)] active:translate-y-0.5 transition-all duration-200 cursor-pointer"
        >
          <Play className="h-4 w-4 text-primary" />
          <span>EXPLORE LOCAL REGISTRIES</span>
          <ArrowRight className="h-4 w-4 ml-1" />
        </Link>
      </div>
    </div>
  );
}
