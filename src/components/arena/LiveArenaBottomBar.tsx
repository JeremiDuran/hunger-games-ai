"use client";

import React from "react";
import { ArrowLeft, ArrowRight, FastForward, Play, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

interface LiveArenaBottomBarProps {
  canGoPrevPhase: boolean;
  canGoNextPhase: boolean;
  isViewingPastPhase: boolean;
  isCurrentPhaseComplete: boolean;
  isEventActionReady: boolean;
  isSimulating: boolean;
  isStreaming: boolean;
  currentEventNumber: number;
  totalEventsCount: number;
  onPrevPhase: () => void;
  onNextPhase: () => void;
  onNextEvent: () => void;
  onAdvanceSimulation: () => void;
}

export function LiveArenaBottomBar({
  canGoPrevPhase,
  canGoNextPhase,
  isViewingPastPhase,
  isCurrentPhaseComplete,
  isEventActionReady,
  isSimulating,
  isStreaming,
  currentEventNumber,
  totalEventsCount,
  onPrevPhase,
  onNextPhase,
  onNextEvent,
  onAdvanceSimulation,
}: LiveArenaBottomBarProps) {
  const t = useTranslations("arena.bottomBar");

  return (
    <div className="sticky bottom-0 z-30 w-full bg-card/95 backdrop-blur-md border-t border-border/80 px-4 py-3 shadow-[0_-5px_25px_rgba(0,0,0,0.5)]">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
        {/* Previous Phase Button */}
        <button
          type="button"
          onClick={onPrevPhase}
          disabled={!canGoPrevPhase || isSimulating}
          className="px-3.5 sm:px-4 py-2.5 clip-chamfer-xs bg-muted/60 hover:bg-muted text-foreground disabled:opacity-40 disabled:cursor-not-allowed border border-border font-mono font-bold text-xs sm:text-sm uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">{t("prevPhase")}</span>
        </button>

        {/* Central Action Zone */}
        <div className="flex items-center gap-2">
          {isViewingPastPhase ? (
            /* When reviewing a past phase: Next Phase view stepper */
            <button
              type="button"
              onClick={onNextPhase}
              disabled={!canGoNextPhase}
              className="px-6 py-2.5 clip-chamfer-xs bg-primary text-black font-mono font-bold text-xs sm:text-sm uppercase tracking-wider transition-all hover:brightness-110 active:translate-y-0.5 cursor-pointer flex items-center gap-2 shadow-[0_0_15px_var(--theme-glow)]"
            >
              <span>{t("nextPhase")}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : !isCurrentPhaseComplete ? (
            /* Live Phase Event-by-Event Stepper */
            <button
              type="button"
              onClick={onNextEvent}
              disabled={!isEventActionReady || isSimulating || isStreaming}
              className={`px-6 sm:px-8 py-2.5 sm:py-3 clip-chamfer-xs font-mono font-black text-xs sm:text-sm uppercase tracking-wider transition-all flex items-center gap-2.5 ${
                isEventActionReady && !isStreaming && !isSimulating
                  ? "bg-primary text-black hover:brightness-115 active:translate-y-0.5 cursor-pointer shadow-[0_0_25px_var(--theme-glow)]"
                  : "bg-muted text-muted-foreground border border-border cursor-not-allowed opacity-60"
              }`}
            >
              {isStreaming ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span>{t("streamingNarrative")}</span>
                </>
              ) : (
                <>
                  <span>
                    {t("nextEvent", {
                      current: Math.min(currentEventNumber + 1, totalEventsCount),
                      total: totalEventsCount,
                    })}
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          ) : (
            /* All events completed in active phase -> Advance Simulation CTA */
            <button
              type="button"
              onClick={onAdvanceSimulation}
              disabled={isSimulating}
              className="px-6 sm:px-8 py-2.5 sm:py-3 clip-chamfer-xs bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-mono font-black text-xs sm:text-sm uppercase tracking-wider shadow-[0_0_30px_rgba(245,158,11,0.4)] hover:brightness-110 active:translate-y-0.5 transition-all cursor-pointer flex items-center gap-2"
            >
              {isSimulating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{t("simulatingNextRound")}</span>
                </>
              ) : (
                <>
                  <FastForward className="h-4 w-4 fill-black" />
                  <span>{t("advanceSimulation")}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          )}
        </div>

        {/* Right Info / Forward Stepper */}
        <div className="flex items-center gap-2">
          {isViewingPastPhase ? (
            <span className="text-[11px] font-mono text-muted-foreground uppercase hidden sm:inline">
              ARCHIVED REVIEW
            </span>
          ) : (
            <div className="text-right">
              <span className="text-[10px] font-mono text-muted-foreground block">
                {t("eventsProgress", {
                  revealed: Math.min(currentEventNumber + 1, totalEventsCount),
                  total: totalEventsCount,
                })}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
