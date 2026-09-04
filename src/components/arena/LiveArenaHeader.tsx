"use client";

import React from "react";
import { Link } from "@/i18n/navigation";
import { Shield, Sun, Moon, UtensilsCrossed, Flame, Zap, ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";

interface LiveArenaHeaderProps {
  simulationTitle: string;
  arenaName: string;
  dayNumber: number;
  phaseType: string;
  status: string;
}

export function LiveArenaHeader({
  simulationTitle,
  arenaName,
  dayNumber,
  phaseType,
  status,
}: LiveArenaHeaderProps) {
  const t = useTranslations("arena.header");

  const getPhaseBadge = (type: string) => {
    switch (type.toLowerCase()) {
      case "bloodbath":
        return {
          icon: <Flame className="h-3.5 w-3.5 text-red-500 fill-red-500" />,
          label: t("phases.bloodbath"),
          className: "bg-red-500/15 border-red-500/50 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.25)]",
        };
      case "night":
        return {
          icon: <Moon className="h-3.5 w-3.5 text-blue-400 fill-blue-400/50" />,
          label: t("phases.night"),
          className: "bg-blue-500/15 border-blue-500/50 text-blue-300 shadow-[0_0_12px_rgba(59,130,246,0.25)]",
        };
      case "feast":
        return {
          icon: <UtensilsCrossed className="h-3.5 w-3.5 text-yellow-400" />,
          label: t("phases.feast"),
          className: "bg-yellow-500/15 border-yellow-500/50 text-yellow-300 shadow-[0_0_12px_rgba(234,179,8,0.25)]",
        };
      case "day":
      default:
        return {
          icon: <Sun className="h-3.5 w-3.5 text-amber-400" />,
          label: t("phases.day"),
          className: "bg-amber-500/15 border-amber-500/50 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.25)]",
        };
    }
  };

  const badge = getPhaseBadge(phaseType);

  return (
    <header className="w-full bg-card/85 backdrop-blur-md border-b border-border/80 px-4 sm:px-6 py-4 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left Column: Return to Lobby + Simulation Title + Arena Codename */}
        <div className="flex items-center gap-3">
          <Link
            href="/lobby"
            title="Return to Gamemaker Hub"
            className="h-8 w-8 rounded-full bg-muted/60 hover:bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg md:text-xl font-serif font-black tracking-wider uppercase text-foreground leading-tight">
                {simulationTitle || "The 74th Annual Hunger Games"}
              </h1>
              {status === "finished" && (
                <span className="px-2 py-0.5 clip-chamfer-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold uppercase">
                  CONCLUDED
                </span>
              )}
            </div>
            <p className="text-xs font-mono text-primary font-medium tracking-wide">
              {arenaName || "Verdant Woodlands & Golden Cornucopia"}
            </p>
          </div>
        </div>

        {/* Right Column: Day Number + Phase Badge */}
        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          {/* Day Number Pill */}
          <div className="px-3 py-1 clip-chamfer-xs bg-background/90 border border-border text-foreground font-mono font-bold text-xs sm:text-sm tracking-wider uppercase">
            {dayNumber === 0 ? "DAY 0" : `DAY ${dayNumber}`}
          </div>

          {/* Phase Badge */}
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 clip-chamfer-xs border text-xs sm:text-sm font-mono font-bold uppercase tracking-wider ${badge.className}`}
          >
            {badge.icon}
            <span>{badge.label}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
