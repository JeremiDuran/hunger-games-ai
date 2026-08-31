"use client";

import React, { useCallback } from "react";
import { useTranslations } from "next-intl";
import { Play, FastForward, Film, Clock, Zap, Check } from "lucide-react";
import { useSetup } from "@/lib/setup/setup-context";
import { TurnGranularity, GamePacing } from "@/types/setup";

export function TurnGranularitySelector() {
  const t = useTranslations("setup.rules");
  const { rulesState, updateRules } = useSetup();

  const handleGranularitySelect = useCallback(
    (granularity: TurnGranularity) => {
      updateRules({ turnGranularity: granularity });
    },
    [updateRules]
  );

  const handlePacingSelect = useCallback(
    (pacing: GamePacing) => {
      updateRules({ pacing });
    },
    [updateRules]
  );

  const granularityOptions: {
    id: TurnGranularity;
    title: string;
    description: string;
    icon: React.ElementType;
    badge?: string;
  }[] = [
    {
      id: "event_by_event",
      title: t("turnGranularity.eventByEvent"),
      description: t("turnGranularity.eventByEventDesc"),
      icon: Play,
      badge: "DEFAULT",
    },
    {
      id: "full_phase",
      title: t("turnGranularity.fullPhase"),
      description: t("turnGranularity.fullPhaseDesc"),
      icon: FastForward,
    },
    {
      id: "autoplay",
      title: t("turnGranularity.autoplay"),
      description: t("turnGranularity.autoplayDesc"),
      icon: Film,
    },
  ];

  const pacingOptions: {
    id: GamePacing;
    title: string;
    description: string;
    icon: React.ElementType;
    badge?: string;
  }[] = [
    {
      id: "cinematic",
      title: t("pacingSpeed.cinematic"),
      description: t("pacingSpeed.cinematicDesc"),
      icon: Film,
      badge: "CINEMATIC",
    },
    {
      id: "normal",
      title: t("pacingSpeed.normal"),
      description: t("pacingSpeed.normalDesc"),
      icon: Clock,
    },
    {
      id: "instant",
      title: t("pacingSpeed.instant"),
      description: t("pacingSpeed.instantDesc"),
      icon: Zap,
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Turn Granularity Mode */}
      <div className="space-y-3">
        <div>
          <label className="text-xs font-mono font-bold uppercase tracking-wider text-foreground block">
            {t("turnGranularity.title")}
          </label>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("granularitySubheading")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {granularityOptions.map((opt) => {
            const isSelected = rulesState.turnGranularity === opt.id;
            const Icon = opt.icon;

            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleGranularitySelect(opt.id)}
                className={`p-4 text-left clip-chamfer-sm border transition-all duration-200 cursor-pointer flex flex-col justify-between select-none ${
                  isSelected
                    ? "bg-card border-primary/90 shadow-[0_0_15px_var(--theme-glow),0_2px_8px_rgba(0,0,0,0.3)] ring-1 ring-primary/40"
                    : "bg-card/40 border-border/70 hover:border-primary/40 hover:bg-card/70 opacity-80 hover:opacity-100"
                }`}
              >
                <div className="space-y-2.5 w-full">
                  <div className="flex items-center justify-between">
                    <div
                      className={`p-2 clip-chamfer-xs transition-colors ${
                        isSelected
                          ? "bg-primary/20 text-primary border border-primary/40"
                          : "bg-muted text-muted-foreground border border-border"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>

                    <div className="flex items-center gap-1.5">
                      {opt.badge && (
                        <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 clip-chamfer-xs bg-muted/80 text-muted-foreground border border-border/80">
                          {opt.badge}
                        </span>
                      )}
                      <div
                        className={`h-4 w-4 rounded-xs border flex items-center justify-center transition-colors ${
                          isSelected
                            ? "bg-primary border-primary text-black"
                            : "border-border bg-background"
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className="text-xs sm:text-sm font-serif font-bold text-foreground block">
                      {opt.title}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {opt.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Narrative Streaming Speed */}
      <div className="space-y-3 pt-2">
        <label className="text-xs font-mono font-bold uppercase tracking-wider text-foreground block">
          {t("pacingSpeed.title")}
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {pacingOptions.map((opt) => {
            const isSelected = rulesState.pacing === opt.id;
            const Icon = opt.icon;

            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handlePacingSelect(opt.id)}
                className={`p-3.5 text-left clip-chamfer-xs border transition-all duration-200 cursor-pointer flex items-center justify-between select-none ${
                  isSelected
                    ? "bg-card border-primary/80 shadow-xs ring-1 ring-primary/30"
                    : "bg-card/30 border-border/60 hover:border-primary/40 hover:bg-card/60 opacity-80 hover:opacity-100"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-1.5 clip-chamfer-xs ${
                      isSelected
                        ? "bg-primary/20 text-primary border border-primary/40"
                        : "bg-muted text-muted-foreground border border-border"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-serif font-bold text-foreground block">
                      {opt.title}
                    </span>
                    <span className="text-[11px] text-muted-foreground block line-clamp-1">
                      {opt.description}
                    </span>
                  </div>
                </div>

                <div
                  className={`h-3.5 w-3.5 shrink-0 ml-2 rounded-xs border flex items-center justify-center transition-colors ${
                    isSelected
                      ? "bg-primary border-primary text-black"
                      : "border-border bg-background"
                  }`}
                >
                  {isSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
