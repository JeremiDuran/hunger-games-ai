"use client";

import React from "react";
import { Link } from "@/i18n/navigation";
import {
  Calendar,
  Flame,
  Sun,
  Moon,
  UtensilsCrossed,
  Skull,
  Radio,
  ExternalLink,
  Play,
  Zap,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { EnrichedPhase } from "@/lib/arena/use-game-hub";

interface GameHubCalendarProps {
  phases: EnrichedPhase[];
}

export function GameHubCalendar({ phases }: GameHubCalendarProps) {
  const t = useTranslations("gamehub.calendar");

  // Group phases by dayNumber
  const phasesByDay = React.useMemo(() => {
    const map = new Map<number, EnrichedPhase[]>();
    for (const phase of phases) {
      const list = map.get(phase.dayNumber) || [];
      list.push(phase);
      map.set(phase.dayNumber, list);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a - b);
  }, [phases]);

  const getPhaseIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "bloodbath":
        return <Flame className="h-4 w-4 text-red-500" />;
      case "night":
        return <Moon className="h-4 w-4 text-blue-400" />;
      case "feast":
        return <UtensilsCrossed className="h-4 w-4 text-amber-400" />;
      case "cataclysm":
      case "npc_overload":
      case "arena_event":
        return <Zap className="h-4 w-4 text-purple-400" />;
      case "day":
      default:
        return <Sun className="h-4 w-4 text-amber-500" />;
    }
  };

  const getPhaseName = (type: string) => {
    switch (type.toLowerCase()) {
      case "bloodbath":
        return t("phaseBloodbath");
      case "night":
        return t("phaseNight");
      case "feast":
        return t("phaseFeast");
      case "cataclysm":
        return t("phaseCataclysm");
      case "npc_overload":
        return t("phaseNpcOverload");
      case "arena_event":
        return t("phaseArenaEvent");
      case "day":
      default:
        return t("phaseDay");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-serif font-black uppercase text-foreground">
          {t("title")}
        </h2>
        <p className="text-xs font-mono text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>

      {/* Calendar Timeline Grid */}
      <div className="space-y-6">
        {phasesByDay.map(([dayNumber, dayPhases]) => {
          const totalDayCasualties = dayPhases.reduce(
            (acc, p) => acc + p.casualtyCount,
            0
          );

          return (
            <div
              key={dayNumber}
              className="p-5 clip-chamfer-md bg-card/80 border border-border/80 space-y-4 shadow-sm"
            >
              {/* Day Heading Bar */}
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <h3 className="font-serif font-black text-base sm:text-lg uppercase text-foreground">
                    {dayNumber === 0
                      ? t("dayZero")
                      : t("dayHeading", { day: dayNumber })}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  {totalDayCasualties > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 clip-chamfer-xs bg-red-500/15 text-red-400 border border-red-500/30 text-xs font-mono font-bold">
                      <Skull className="h-3 w-3" />
                      {t("casualties", { count: totalDayCasualties })}
                    </span>
                  )}
                </div>
              </div>

              {/* Day Phase Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {dayPhases.map((phase) => {
                  return (
                    <div
                      key={phase.id}
                      className={`p-4 clip-chamfer-xs border transition-all flex flex-col justify-between gap-3 ${
                        phase.isLive
                          ? "bg-primary/5 border-primary/60 shadow-[0_0_15px_rgba(234,179,8,0.1)]"
                          : "bg-background/80 border-border hover:border-border/90"
                      }`}
                    >
                      <div className="space-y-2">
                        {/* Status badge & Icon */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            {getPhaseIcon(phase.phaseType)}
                            <span className="font-serif font-bold text-sm uppercase text-foreground">
                              {getPhaseName(phase.phaseType)}
                            </span>
                          </div>

                          {phase.isLive ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 clip-chamfer-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 text-[10px] font-mono font-bold uppercase animate-pulse">
                              <Radio className="h-2.5 w-2.5" />
                              {t("currentBadge")}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 clip-chamfer-xs bg-muted text-muted-foreground text-[10px] font-mono font-bold uppercase">
                              {t("completedBadge")}
                            </span>
                          )}
                        </div>

                        {/* Metrics: Casualties & Encounters */}
                        <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground pt-1">
                          <span className="inline-flex items-center gap-1">
                            <Skull className="h-3 w-3 text-red-400" />
                            {t("casualties", { count: phase.casualtyCount })}
                          </span>

                          <span>•</span>

                          <span>{t("encounters", { count: phase.eventCount })}</span>
                        </div>
                      </div>

                      {/* Direct Phase Jump CTA */}
                      <Link
                        href={phase.jumpUrl}
                        className={`w-full inline-flex items-center justify-center gap-2 py-2 px-3 clip-chamfer-xs font-mono font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer ${
                          phase.isLive
                            ? "bg-primary text-primary-foreground hover:bg-primary/90"
                            : "bg-muted/70 hover:bg-muted text-foreground hover:text-primary border border-border"
                        }`}
                      >
                        <Play className="h-3 w-3 fill-current" />
                        <span>{t("watchPhase")}</span>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
