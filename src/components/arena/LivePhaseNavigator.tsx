"use client";

import React from "react";
import { Tables } from "@/types/database";
import { Skull } from "lucide-react";
import { useTranslations } from "next-intl";

export type GamePhaseDbRow = Tables<"game_phases">;

interface LivePhaseNavigatorProps {
  phases: GamePhaseDbRow[];
  selectedPhaseId: string | null;
  activeLivePhaseId: string | null;
  onSelectPhase: (phaseId: string) => void;
}

export function LivePhaseNavigator({
  phases,
  selectedPhaseId,
  activeLivePhaseId,
  onSelectPhase,
}: LivePhaseNavigatorProps) {
  const t = useTranslations("arena.navigator");

  const formatPillLabel = (phase: GamePhaseDbRow): string => {
    switch (phase.phase_type.toLowerCase()) {
      case "bloodbath":
        return "BB";
      case "day":
        return `${phase.day_number} D`;
      case "night":
        return `${phase.day_number} N`;
      case "feast":
        return `${phase.day_number} F`;
      default:
        return `${phase.day_number} P`;
    }
  };

  return (
    <nav
      aria-label={t("ariaLabel")}
      className="w-full md:w-20 shrink-0 md:sticky md:top-24 max-h-[calc(100vh-8rem)] flex md:flex-col items-center gap-2 overflow-x-auto md:overflow-y-auto p-2 bg-card/60 backdrop-blur-xs border border-border/70 clip-chamfer-sm"
    >
      <div className="hidden md:block text-[9px] font-mono font-bold uppercase text-muted-foreground/70 tracking-widest text-center mb-1">
        {t("title")}
      </div>

      <div className="flex md:flex-col items-center gap-2 w-full">
        {phases.map((phase) => {
          const isSelected = phase.id === selectedPhaseId;
          const isLive = phase.id === activeLivePhaseId;
          const hasCasualties =
            phase.fallen_tribute_ids && phase.fallen_tribute_ids.length > 0;
          const pillLabel = formatPillLabel(phase);

          return (
            <button
              key={phase.id}
              type="button"
              onClick={() => onSelectPhase(phase.id)}
              aria-current={isSelected ? "page" : undefined}
              className={`relative group w-14 h-12 md:w-full md:h-14 clip-chamfer-xs border font-mono font-bold text-xs sm:text-sm tracking-wider flex flex-col items-center justify-center transition-all cursor-pointer ${
                isSelected
                  ? "bg-primary text-black border-primary shadow-[0_0_15px_var(--theme-glow)] scale-105"
                  : "bg-background/80 hover:bg-card text-foreground border-border hover:border-primary/50"
              }`}
            >
              {/* Phase Acronym */}
              <span>{pillLabel}</span>

              {/* Casualty Marker (Skull or red dot) */}
              {hasCasualties && (
                <span
                  title={`${phase.fallen_tribute_ids?.length} casualty in this phase`}
                  className={`absolute top-1 right-1 flex items-center gap-0.5 text-[10px] ${
                    isSelected ? "text-red-950 font-black" : "text-red-500"
                  }`}
                >
                  <Skull className="h-3 w-3" />
                </span>
              )}

              {/* Live Active Phase Indicator */}
              {isLive && (
                <span className="inline-flex items-center gap-1 text-[8px] font-bold tracking-tighter uppercase mt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className={isSelected ? "text-black font-black" : "text-emerald-400"}>
                    LIVE
                  </span>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
