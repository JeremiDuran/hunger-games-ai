"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Sliders, Sparkles } from "lucide-react";
import { TurnGranularitySelector } from "./TurnGranularitySelector";
import { GamemakerDirectives } from "./GamemakerDirectives";
import { NarrativeVoiceSelector } from "./NarrativeVoiceSelector";
import { PreFlightSummaryCard } from "./PreFlightSummaryCard";

export function RulesPacingWorkspace() {
  const t = useTranslations("setup.rules");

  return (
    <div className="space-y-10 w-full animate-fadeIn">
      {/* Section Header */}
      <div className="space-y-1 pb-4 border-b border-border/70">
        <div className="flex items-center gap-2 text-primary">
          <Sliders className="h-5 w-5" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider">
            Step 3 of 3 • Directives & Protocol
          </span>
        </div>
        <h2 className="text-xl sm:text-2xl font-serif font-bold uppercase tracking-wider text-foreground">
          {t("title")}
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground font-sans max-w-2xl">
          {t("subtitle")}
        </p>
      </div>

      {/* 1. Simulation Granularity & Turn Pacing */}
      <section aria-labelledby="section-granularity" className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3
            id="section-granularity"
            className="text-base font-serif font-bold uppercase tracking-wider text-foreground"
          >
            {t("granularityHeading")}
          </h3>
        </div>
        <div className="p-5 sm:p-6 clip-chamfer-md bg-card/85 border border-border/80 shadow-xs">
          <TurnGranularitySelector />
        </div>
      </section>

      {/* 2. Gamemaker Directives & Combat Rules */}
      <section aria-labelledby="section-directives" className="space-y-4">
        <GamemakerDirectives />
      </section>

      {/* 3. AI Narrative Storytelling Persona */}
      <section aria-labelledby="section-voice" className="space-y-4">
        <div className="p-5 sm:p-6 clip-chamfer-md bg-card/85 border border-border/80 shadow-xs">
          <NarrativeVoiceSelector />
        </div>
      </section>

      {/* 4. Pre-Flight Readiness Summary Card */}
      <section aria-labelledby="section-preflight" className="pt-4">
        <PreFlightSummaryCard />
      </section>
    </div>
  );
}
