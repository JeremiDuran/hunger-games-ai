"use client";

import React, { useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  ShieldCheck,
  Trees,
  Users,
  Sliders,
  Check,
  AlertCircle,
  Edit3,
  Globe,
  UserCheck,
} from "lucide-react";
import { useSetup } from "@/lib/setup/setup-context";
import { useAuth } from "@/lib/auth/auth-context";

export function PreFlightSummaryCard() {
  const t = useTranslations("setup.rules.summary");
  const {
    arenaState,
    tributes,
    districtCount,
    rulesState,
    isArenaValid,
    isTributesValid,
    isLaunchReady,
    setActiveTab,
  } = useSetup();
  const { isPermanent } = useAuth();

  const handleEditArena = useCallback(() => {
    setActiveTab("arena");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [setActiveTab]);

  const handleEditTributes = useCallback(() => {
    setActiveTab("tributes");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [setActiveTab]);

  const activeHazardsCount = [
    arenaState.hazards.enableBloodbath,
    arenaState.hazards.enableMuttations,
    arenaState.hazards.enableDisasters,
    arenaState.hazards.enableSponsorDrops,
  ].filter(Boolean).length;

  return (
    <div className="p-6 sm:p-7 clip-chamfer-md bg-card/90 border-2 border-primary/50 space-y-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/70">
        <div className="flex items-center gap-3">
          <div className="p-2.5 clip-chamfer-xs bg-primary/15 border border-primary/40 text-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-serif font-bold uppercase tracking-wider text-foreground">
              {t("heading")}
            </h3>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">
              {t("subheading")}
            </p>
          </div>
        </div>

        <div>
          {isLaunchReady ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 clip-chamfer-xs bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs font-mono font-bold">
              <Check className="h-3.5 w-3.5" />
              <span>{t("allReady")}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 clip-chamfer-xs bg-amber-500/15 border border-amber-500/40 text-amber-400 text-xs font-mono font-bold">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>{t("incompleteWarning")}</span>
            </span>
          )}
        </div>
      </div>

      {/* 3 Subsystems Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Subsystem 1: Arena Protocol */}
        <div className="p-4 clip-chamfer-sm bg-background/80 border border-border/80 space-y-2.5 relative group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-primary uppercase">
              <Trees className="h-3.5 w-3.5" />
              <span>{t("arenaReady")}</span>
            </div>
            <button
              type="button"
              onClick={handleEditArena}
              className="text-[11px] font-mono text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="h-3 w-3" />
              <span>{t("editArena")}</span>
            </button>
          </div>

          <div>
            <p className="text-xs sm:text-sm font-serif font-bold text-foreground truncate">
              {arenaState.arenaName || "Custom Arena"}
            </p>
            <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
              {arenaState.simulationTitle}
            </p>
          </div>

          <div className="pt-1 flex items-center gap-1.5 flex-wrap text-[10px] font-mono text-muted-foreground">
            <span className="px-1.5 py-0.5 clip-chamfer-xs bg-muted/60 border border-border">
              {activeHazardsCount} Hazards Active
            </span>
            {isArenaValid ? (
              <span className="text-emerald-400 font-bold">● Valid</span>
            ) : (
              <span className="text-destructive font-bold">● Error</span>
            )}
          </div>
        </div>

        {/* Subsystem 2: Tribute Roster */}
        <div className="p-4 clip-chamfer-sm bg-background/80 border border-border/80 space-y-2.5 relative group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-primary uppercase">
              <Users className="h-3.5 w-3.5" />
              <span>{t("rosterReady")}</span>
            </div>
            <button
              type="button"
              onClick={handleEditTributes}
              className="text-[11px] font-mono text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="h-3 w-3" />
              <span>{t("editTributes")}</span>
            </button>
          </div>

          <div>
            <p className="text-xs sm:text-sm font-serif font-bold text-foreground">
              {tributes.length} Active Tributes
            </p>
            <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
              {districtCount} Districts Configured
            </p>
          </div>

          <div className="pt-1 flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
            <span className="px-1.5 py-0.5 clip-chamfer-xs bg-muted/60 border border-border">
              Cornucopia Ready
            </span>
            {isTributesValid ? (
              <span className="text-emerald-400 font-bold">● 100% Filled</span>
            ) : (
              <span className="text-destructive font-bold">● Incomplete</span>
            )}
          </div>
        </div>

        {/* Subsystem 3: Rules & Directives */}
        <div className="p-4 clip-chamfer-sm bg-background/80 border border-border/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-primary uppercase">
              <Sliders className="h-3.5 w-3.5" />
              <span>{t("rulesReady")}</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">
              ● Ready
            </span>
          </div>

          <div>
            <p className="text-xs sm:text-sm font-serif font-bold text-foreground capitalize">
              {rulesState.turnGranularity.replace(/_/g, " ")} Mode
            </p>
            <p className="text-[11px] font-mono text-muted-foreground mt-0.5 capitalize">
              {rulesState.combatLethality.replace(/_/g, " ")} • {rulesState.pacing} Pacing
            </p>
          </div>

          <div className="pt-1 flex flex-wrap items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
            <span className="px-1.5 py-0.5 clip-chamfer-xs bg-muted/60 border border-border capitalize">
              {rulesState.narrativeVoice.replace(/_/g, " ")}
            </span>
            {rulesState.enableMidGameFeast && (
              <span className="px-1.5 py-0.5 clip-chamfer-xs bg-yellow-500/15 border border-yellow-500/40 text-yellow-400 font-bold">
                Feast
              </span>
            )}
            {rulesState.enableSpecialEvents && (
              <span className="px-1.5 py-0.5 clip-chamfer-xs bg-red-500/15 border border-red-500/40 text-red-400 font-bold">
                Special Events
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Session / Storage Status Banner */}
      <div className="p-3.5 clip-chamfer-xs bg-background/60 border border-border/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs font-mono text-muted-foreground">
        <div className="flex items-center gap-2">
          {isPermanent ? (
            <>
              <UserCheck className="h-4 w-4 text-emerald-400" />
              <span className="text-foreground">{t("registeredNotice")}</span>
            </>
          ) : (
            <>
              <Globe className="h-4 w-4 text-primary" />
              <span>{t("guestNotice")}</span>
            </>
          )}
        </div>

        <div className="text-[10px] uppercase tracking-wider text-muted-foreground/80">
          Capitol Protocol v1.4
        </div>
      </div>
    </div>
  );
}
