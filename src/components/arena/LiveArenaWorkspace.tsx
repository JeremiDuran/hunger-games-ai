"use client";

import React, { useEffect } from "react";
import { Link } from "@/i18n/navigation";
import { Shield, ExternalLink, Loader2, AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useLiveArena } from "@/lib/arena/use-live-arena";
import { LiveArenaHeader } from "./LiveArenaHeader";
import { LivePhaseNavigator } from "./LivePhaseNavigator";
import { LiveArenaBottomBar } from "./LiveArenaBottomBar";
import { ArenaEventCard } from "./ArenaEventCard";
import { BackgroundArenaHolo } from "@/components/setup/backgrounds/BackgroundArenaHolo";

interface LiveArenaWorkspaceProps {
  gameId: string;
  initialPhaseId?: string;
}

export function LiveArenaWorkspace({ gameId, initialPhaseId }: LiveArenaWorkspaceProps) {
  const t = useTranslations("arena");
  const {
    isLoading,
    loadError,
    game,
    tributes,
    tributesMap,
    phases,
    selectedPhase,
    selectedPhaseId,
    activeLivePhaseId,
    selectedPhaseEvents,
    currentEventIndex,
    currentEvent,
    narrativesMap,
    pacing,
    isViewingPastPhase,
    isCurrentEventComplete,
    isCurrentPhaseComplete,
    isStreaming,
    isSimulating,
    canGoPrevPhase,
    canGoNextPhase,
    handleNextEvent,
    handleAdvanceSimulation,
    handlePrevPhase,
    handleNextPhase,
    handleSelectPhase,
  } = useLiveArena(gameId, initialPhaseId);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when user is typing in form inputs
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        if (isCurrentPhaseComplete) {
          handleAdvanceSimulation();
        } else if (isCurrentEventComplete && !isStreaming) {
          handleNextEvent();
        }
      } else if (e.key === "ArrowLeft" && canGoPrevPhase) {
        e.preventDefault();
        handlePrevPhase();
      } else if (e.key === "ArrowRight" && canGoNextPhase) {
        e.preventDefault();
        handleNextPhase();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isCurrentPhaseComplete,
    isCurrentEventComplete,
    isStreaming,
    canGoPrevPhase,
    canGoNextPhase,
    handleNextEvent,
    handleAdvanceSimulation,
    handlePrevPhase,
    handleNextPhase,
  ]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground space-y-4">
        <BackgroundArenaHolo />
        <div className="relative z-10 flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <h2 className="text-sm font-mono uppercase tracking-widest text-muted-foreground">
            {t("status.connectingTelemetry")}
          </h2>
        </div>
      </div>
    );
  }

  if (loadError || !game) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground space-y-4 p-4">
        <BackgroundArenaHolo />
        <div className="relative z-10 max-w-md w-full p-6 clip-chamfer-md bg-card/90 border border-destructive/60 text-center space-y-4">
          <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
          <h2 className="text-lg font-serif font-bold uppercase text-foreground">
            {t("status.telemetryError")}
          </h2>
          <p className="text-xs font-mono text-muted-foreground">
            {loadError || "Game could not be located in Capitol registries."}
          </p>
          <Link
            href="/lobby"
            className="inline-block px-4 py-2 clip-chamfer-xs bg-muted hover:bg-muted/80 text-foreground font-mono font-bold text-xs uppercase"
          >
            {t("status.returnLobby")}
          </Link>
        </div>
      </div>
    );
  }

  // Visible events in current phase:
  // - In past phases: show all events.
  // - In active live phase: show events up to currentEventIndex!
  const visibleEvents = isViewingPastPhase
    ? selectedPhaseEvents
    : selectedPhaseEvents.slice(0, currentEventIndex + 1);

  return (
    <div className="min-h-screen relative flex flex-col justify-between overflow-x-clip bg-background text-foreground transition-colors duration-500 selection:bg-primary selection:text-primary-foreground">
      {/* Visual Arena Holo Grid Background */}
      <BackgroundArenaHolo />

      {/* Top Broadcast Bar */}
      <LiveArenaHeader
        simulationTitle={game.title}
        arenaName={game.arena_name}
        dayNumber={selectedPhase?.day_number ?? game.current_day}
        phaseType={selectedPhase?.phase_type ?? game.current_phase_type}
        status={game.status}
      />

      {/* Main Tactical Simulation Viewport */}
      <main
        id="main-content"
        className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 z-20 flex flex-col md:flex-row items-start gap-6"
      >
        {/* Left Scrollable Phase Navigator Rail */}
        <LivePhaseNavigator
          phases={phases}
          selectedPhaseId={selectedPhaseId}
          activeLivePhaseId={activeLivePhaseId}
          onSelectPhase={handleSelectPhase}
        />

        {/* Central Arena Event Stack (Phase Events Feed) */}
        <div className="flex-1 w-full max-w-3xl mx-auto space-y-6">
          {/* Phase Banner / State Header */}
          <div className="flex items-center justify-between px-1">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
                {isViewingPastPhase ? t("feed.pastPhaseArchive") : t("feed.activePhaseBroadcast")}
              </span>
              <h2 className="text-lg sm:text-xl font-serif font-black uppercase text-foreground">
                {selectedPhase?.phase_type === "bloodbath"
                  ? "The Opening Bloodbath"
                  : `Day ${selectedPhase?.day_number ?? 0} ${
                      selectedPhase?.phase_type.toUpperCase() || "PHASE"
                    }`}
              </h2>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-mono text-muted-foreground uppercase block">
                {t("feed.encounters")}
              </span>
              <span className="text-xs font-mono font-bold text-foreground">
                {visibleEvents.length} / {selectedPhaseEvents.length}
              </span>
            </div>
          </div>

          {/* Render Event Cards */}
          <div className="space-y-6">
            {visibleEvents.map((event, idx) => {
              const narrative = narrativesMap[event.id];
              const isCurrent = !isViewingPastPhase && idx === currentEventIndex;

              return (
                <ArenaEventCard
                  key={event.id}
                  event={event}
                  tributesMap={tributesMap}
                  narrativeText={narrative?.text || event.narrative_text || ""}
                  narrativeStatus={narrative?.status || (event.narrative_text ? "complete" : "idle")}
                  pacing={pacing}
                  isCurrentEvent={isCurrent}
                />
              );
            })}

            {visibleEvents.length === 0 && (
              <div className="p-8 clip-chamfer-md bg-card/60 border border-border text-center space-y-2">
                <p className="text-sm font-mono text-muted-foreground">
                  {t("feed.noEvents")}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Action Zone: "Go to Gamehub" + Telemetry Counter */}
        <aside className="w-full md:w-64 shrink-0 space-y-4 md:sticky md:top-24">
          {/* Game Hub Navigation Card */}
          <div className="p-4 clip-chamfer-md bg-card/85 border border-border/80 space-y-4 shadow-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-primary text-xs font-mono font-bold uppercase">
                <Shield className="h-3.5 w-3.5" />
                <span>{t("hub.title")}</span>
              </div>
              <p className="text-[11px] font-mono text-muted-foreground">
                {t("hub.desc")}
              </p>
            </div>

            {/* Go to Gamehub CTA */}
            <Link
              href={`/game/${gameId}/hub`}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-3 clip-chamfer-xs bg-muted/80 hover:bg-muted text-foreground hover:text-primary border border-border font-mono font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              <span>{t("hub.cta")}</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </aside>
      </main>

      {/* Bottom Phase Navigation Bar */}
      <LiveArenaBottomBar
        canGoPrevPhase={canGoPrevPhase}
        canGoNextPhase={canGoNextPhase}
        isViewingPastPhase={isViewingPastPhase}
        isCurrentPhaseComplete={isCurrentPhaseComplete}
        isEventActionReady={isCurrentEventComplete}
        isSimulating={isSimulating}
        isStreaming={isStreaming}
        currentEventNumber={currentEventIndex}
        totalEventsCount={selectedPhaseEvents.length}
        onPrevPhase={handlePrevPhase}
        onNextPhase={handleNextPhase}
        onNextEvent={handleNextEvent}
        onAdvanceSimulation={handleAdvanceSimulation}
      />
    </div>
  );
}
