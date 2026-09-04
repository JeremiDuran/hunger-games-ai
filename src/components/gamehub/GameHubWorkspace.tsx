"use client";

import React, { useState } from "react";
import {
  Users,
  Trophy,
  Calendar,
  Package,
  ShieldAlert,
  Handshake,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useGameHub } from "@/lib/arena/use-game-hub";
import { BackgroundArenaHolo } from "@/components/setup/backgrounds/BackgroundArenaHolo";
import { GameHubHeader } from "./GameHubHeader";
import { GameHubVictorBanner } from "./GameHubVictorBanner";
import { GameHubTributesRoster } from "./GameHubTributesRoster";
import { GameHubLeaderboards } from "./GameHubLeaderboards";
import { GameHubCalendar } from "./GameHubCalendar";
import { GameHubItemsArsenal } from "./GameHubItemsArsenal";
import { GameHubNpcThreats } from "./GameHubNpcThreats";
import { GameHubAlliancesIntel } from "./GameHubAlliancesIntel";

interface GameHubWorkspaceProps {
  gameId: string;
}

type HubTab =
  | "tributes"
  | "leaderboards"
  | "calendar"
  | "items"
  | "mutts"
  | "alliances";

export function GameHubWorkspace({ gameId }: GameHubWorkspaceProps) {
  const t = useTranslations("gamehub");
  const [activeTab, setActiveTab] = useState<HubTab>("tributes");

  const {
    isLoading,
    loadError,
    game,
    tributes,
    tributesMap,
    victor,
    livingTributes,
    fallenTributes,
    leaderboards,
    calendarPhases,
    arenaItems,
    muttThreats,
    alliancesIntel,
    navigationRoutes,
  } = useGameHub(gameId);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground space-y-4">
        <BackgroundArenaHolo />
        <div className="relative z-10 flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <h2 className="text-sm font-mono uppercase tracking-widest text-muted-foreground">
            Connecting Capitol Tactical Telemetry...
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
            Capitol Telemetry Disconnected
          </h2>
          <p className="text-xs font-mono text-muted-foreground">
            {loadError || "Match record could not be loaded."}
          </p>
          <Link
            href="/lobby"
            className="inline-block px-4 py-2 clip-chamfer-xs bg-muted hover:bg-muted/80 text-foreground font-mono font-bold text-xs uppercase"
          >
            Return to Lobby
          </Link>
        </div>
      </div>
    );
  }

  const isFinished =
    game.status === "finished" || game.status === "archived";

  return (
    <div className="min-h-screen relative flex flex-col bg-background text-foreground transition-colors duration-500 selection:bg-primary selection:text-primary-foreground">
      {/* Visual Arena Holo Grid Background */}
      <BackgroundArenaHolo />

      {/* Top Tactical Broadcast Bar */}
      <GameHubHeader
        simulationTitle={game.title}
        arenaName={game.arena_name}
        status={game.status}
        liveRoute={navigationRoutes.liveRoute}
        isFinished={isFinished}
        setupRoute={navigationRoutes.setupRoute}
        lobbyRoute={navigationRoutes.lobbyRoute}
      />

      {/* Main Tactical Simulation Dossier */}
      <main
        id="main-content"
        className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 z-20 space-y-8"
      >
        {/* 1. If Game is Finished/Archived: Victor Banner Shown First */}
        {isFinished && victor && (
          <GameHubVictorBanner
            victor={victor}
            daysEndured={game.current_day}
          />
        )}

        {/* 2. Tactical Navigation Bar Tabs */}
        <nav
          aria-label="Tactical Hub Navigation"
          className="flex flex-wrap items-center gap-2 border-b border-border/80 pb-3"
        >
          <button
            type="button"
            onClick={() => setActiveTab("tributes")}
            className={`inline-flex items-center gap-2 px-3.5 py-2 clip-chamfer-xs font-mono text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
              activeTab === "tributes"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-card/70 hover:bg-card text-muted-foreground hover:text-foreground border border-border/80"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>{t("tabs.tributes")}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("leaderboards")}
            className={`inline-flex items-center gap-2 px-3.5 py-2 clip-chamfer-xs font-mono text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
              activeTab === "leaderboards"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-card/70 hover:bg-card text-muted-foreground hover:text-foreground border border-border/80"
            }`}
          >
            <Trophy className="h-3.5 w-3.5" />
            <span>{t("tabs.leaderboards")}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("calendar")}
            className={`inline-flex items-center gap-2 px-3.5 py-2 clip-chamfer-xs font-mono text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
              activeTab === "calendar"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-card/70 hover:bg-card text-muted-foreground hover:text-foreground border border-border/80"
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>{t("tabs.calendar")}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("items")}
            className={`inline-flex items-center gap-2 px-3.5 py-2 clip-chamfer-xs font-mono text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
              activeTab === "items"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-card/70 hover:bg-card text-muted-foreground hover:text-foreground border border-border/80"
            }`}
          >
            <Package className="h-3.5 w-3.5" />
            <span>{t("tabs.items")}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("mutts")}
            className={`inline-flex items-center gap-2 px-3.5 py-2 clip-chamfer-xs font-mono text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
              activeTab === "mutts"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-card/70 hover:bg-card text-muted-foreground hover:text-foreground border border-border/80"
            }`}
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>{t("tabs.mutts")}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("alliances")}
            className={`inline-flex items-center gap-2 px-3.5 py-2 clip-chamfer-xs font-mono text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
              activeTab === "alliances"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-card/70 hover:bg-card text-muted-foreground hover:text-foreground border border-border/80"
            }`}
          >
            <Handshake className="h-3.5 w-3.5" />
            <span>{t("tabs.alliances")}</span>
          </button>
        </nav>

        {/* 3. Active Tab View Content */}
        <section className="space-y-6">
          {activeTab === "tributes" && (
            <GameHubTributesRoster
              tributes={tributes}
              isFinished={isFinished}
              tributesMap={tributesMap}
            />
          )}

          {activeTab === "leaderboards" && (
            <GameHubLeaderboards leaderboards={leaderboards} />
          )}

          {activeTab === "calendar" && (
            <GameHubCalendar phases={calendarPhases} />
          )}

          {activeTab === "items" && (
            <GameHubItemsArsenal arenaItems={arenaItems} />
          )}

          {activeTab === "mutts" && (
            <GameHubNpcThreats
              arenaName={game.arena_name}
              muttThreats={muttThreats}
            />
          )}

          {activeTab === "alliances" && (
            <GameHubAlliancesIntel
              alliances={alliancesIntel.entries}
              districtSummaries={alliancesIntel.districtSummaries}
            />
          )}
        </section>
      </main>
    </div>
  );
}
