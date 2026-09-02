"use client";

import React, { useCallback, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import {
  Trees,
  Users,
  Sliders,
  Flame,
  ArrowRight,
  Edit3,
  AlertCircle,
  Zap,
  Radio,
  Skull,
  Award,
  BookOpen,
  Home,
  ChevronDown,
  ChevronUp,
  UtensilsCrossed,
  CloudLightning,
} from "lucide-react";
import { useSetup } from "@/lib/setup/setup-context";
import { useAuth } from "@/lib/auth/auth-context";
import { useThemeEngine } from "@/lib/theme-context";
import { CompactTributeFormation } from "./CompactTributeFormation";
import { toGameDbPayload, toTributesDbPayload } from "@/lib/schemas/setup";

interface SetupSummaryWorkspaceProps {
  onLaunch?: () => void;
}

export function SetupSummaryWorkspace({ onLaunch }: SetupSummaryWorkspaceProps) {
  const t = useTranslations("setup.summary");
  const tArena = useTranslations("setup.arena");
  const {
    arenaState,
    tributes,
    districtCount,
    rulesState,
    isArenaValid,
    isTributesValid,
    isLaunchReady,
    gameStatus,
    setActiveTab,
    validateArenaStep,
    validateTributesStep,
  } = useSetup();
  const { isPermanent, user } = useAuth();
  const { activePalette } = useThemeEngine();
  const [isLaunching, setIsLaunching] = useState(false);
  const [showLore, setShowLore] = useState(false);
  const isEditable = gameStatus === "setup" || gameStatus === "archived";

  const handleEditArena = useCallback(() => {
    setActiveTab("arena");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [setActiveTab]);

  const handleEditTributes = useCallback(() => {
    setActiveTab("tributes");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [setActiveTab]);

  const handleEditRules = useCallback(() => {
    setActiveTab("rules");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [setActiveTab]);

  const handleLaunchClick = useCallback(() => {
    const isArenaOk = validateArenaStep();
    if (!isArenaOk) {
      setActiveTab("arena");
      return;
    }

    const isTributesOk = validateTributesStep();
    if (!isTributesOk) {
      setActiveTab("tributes");
      return;
    }

    setIsLaunching(true);

    try {
      // Serialize game setup and tribute payload into local staging
      const gamePayload = toGameDbPayload(arenaState, user?.id || "guest-session-id", tributes.length, rulesState);
      const tributesPayload = toTributesDbPayload(tributes, "local-game-session");

      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(
          "hg_active_game_ready",
          JSON.stringify({
            game: gamePayload,
            tributes: tributesPayload,
            launchedAt: new Date().toISOString(),
          })
        );
      }

      if (onLaunch) {
        onLaunch();
      }

      // Smooth feedback
      setTimeout(() => {
        setIsLaunching(false);
      }, 900);
    } catch {
      setIsLaunching(false);
    }
  }, [arenaState, user, tributes, rulesState, validateArenaStep, validateTributesStep, setActiveTab, onLaunch]);

  const activeHazardsList = [
    {
      key: "bloodbath",
      label: tArena("hazards.bloodbath"),
      active: arenaState.hazards.enableBloodbath,
    },
    {
      key: "muttations",
      label: tArena("hazards.muttations"),
      active: arenaState.hazards.enableMuttations,
    },
    {
      key: "disasters",
      label: tArena("hazards.disasters"),
      active: arenaState.hazards.enableDisasters,
    },
    {
      key: "sponsorDrops",
      label: tArena("hazards.sponsorDrops"),
      active: arenaState.hazards.enableSponsorDrops,
    },
  ];

  return (
    <div className="space-y-8 w-full animate-fadeIn pb-12">
      {/* Central Command Hub Header */}
      <div className="setup-hero space-y-1 pb-4 border-b border-border/70">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-black tracking-wider uppercase text-foreground">
          {t("title")}
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground font-sans max-w-2xl">
          {t("subtitle")}
        </p>
      </div>

      {/* Validation Warning Alert if any step is incomplete */}
      {!isLaunchReady && isEditable && (
        <div className="p-4 clip-chamfer-sm bg-destructive/15 border-2 border-destructive/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-destructive-foreground">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
            <span className="text-xs sm:text-sm font-mono font-bold text-foreground">
              {t("validationErrorBanner")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!isArenaValid && (
              <button
                type="button"
                onClick={handleEditArena}
                className="px-2.5 py-1 text-xs font-mono font-bold uppercase clip-chamfer-xs bg-destructive text-destructive-foreground hover:brightness-110 cursor-pointer"
              >
                Fix Arena
              </button>
            )}
            {!isTributesValid && (
              <button
                type="button"
                onClick={handleEditTributes}
                className="px-2.5 py-1 text-xs font-mono font-bold uppercase clip-chamfer-xs bg-destructive text-destructive-foreground hover:brightness-110 cursor-pointer"
              >
                Fix Roster
              </button>
            )}
          </div>
        </div>
      )}

      {/* 1. Simulation & Arena Environmental Parameters Card */}
      <section
        aria-labelledby="section-arena-summary"
        className="p-5 sm:p-6 clip-chamfer-md bg-card/85 border border-border/80 space-y-5 shadow-xs"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
          <div className="flex items-center gap-2.5 text-primary">
            <Trees className="h-4 w-4" />
            <h3
              id="section-arena-summary"
              className="text-sm sm:text-base font-serif font-bold uppercase tracking-wider text-foreground"
            >
              {t("arenaHeading")}
            </h3>
          </div>
          {isEditable && (
            <button
              type="button"
              onClick={handleEditArena}
              className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-muted-foreground hover:text-primary transition-colors cursor-pointer self-start sm:self-auto"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>{t("editArena")}</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Simulation & Arena Name */}
          <div className="space-y-1 p-3.5 clip-chamfer-xs bg-background/80 border border-border/70">
            <span className="text-[10px] font-mono font-bold uppercase text-muted-foreground tracking-wider">
              {t("simulationTitleLabel")}
            </span>
            <p className="text-sm sm:text-base font-serif font-bold text-foreground">
              {arenaState.simulationTitle || "The 74th Annual Hunger Games"}
            </p>
          </div>

          <div className="space-y-1 p-3.5 clip-chamfer-xs bg-background/80 border border-border/70">
            <span className="text-[10px] font-mono font-bold uppercase text-muted-foreground tracking-wider">
              {t("arenaNameLabel")}
            </span>
            <p className="text-sm sm:text-base font-serif font-bold text-primary">
              {arenaState.arenaName || "Verdant Woodlands & Golden Cornucopia"}
            </p>
          </div>
        </div>

        {/* Environmental Lore (Toggable, default hidden) */}
        {arenaState.arenaDescription && (
          <div className="space-y-2 pt-1 border-t border-border/40">
            <button
              type="button"
              onClick={() => setShowLore((prev) => !prev)}
              className="inline-flex items-center gap-2 text-xs font-mono font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer py-1"
            >
              {showLore ? (
                <ChevronUp className="h-3.5 w-3.5 text-primary" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-primary" />
              )}
              <span>{showLore ? t("hideLore") : t("viewLore")}</span>
            </button>

            {showLore && (
              <div className="space-y-1.5 p-3.5 clip-chamfer-xs bg-background/60 border border-border/60 animate-fadeIn">
                <span className="text-[10px] font-mono font-bold uppercase text-muted-foreground tracking-wider">
                  {t("loreLabel")}
                </span>
                <p className="text-xs sm:text-sm text-foreground/90 font-sans leading-relaxed">
                  {arenaState.arenaDescription}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Active Hazards Matrix */}
        <div className="space-y-2">
          <span className="text-[10px] font-mono font-bold uppercase text-muted-foreground tracking-wider">
            {t("activeHazardsLabel")}
          </span>
          <div className="flex flex-wrap gap-2">
            {activeHazardsList.map((hazard) => (
              <span
                key={hazard.key}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 clip-chamfer-xs text-xs font-mono ${
                  hazard.active
                    ? "bg-primary/15 border border-primary/40 text-foreground font-bold"
                    : "bg-muted/30 border border-border/40 text-muted-foreground/60 line-through"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    hazard.active ? "bg-primary" : "bg-muted-foreground/40"
                  }`}
                />
                <span>{hazard.label}</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 2. Compact Tribute Formation Card */}
      <section
        aria-labelledby="section-tributes-summary"
        className="p-5 sm:p-6 clip-chamfer-md bg-card/85 border border-border/80 space-y-4 shadow-xs"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
          <div className="flex items-center gap-2.5 text-primary">
            <Users className="h-4 w-4" />
            <div>
              <h3
                id="section-tributes-summary"
                className="text-sm sm:text-base font-serif font-bold uppercase tracking-wider text-foreground"
              >
                {t("tributesHeading")}
              </h3>
              <p className="text-xs font-mono text-muted-foreground">
                {t("tributesSubtitle", { count: tributes.length, districts: districtCount })}
              </p>
            </div>
          </div>
          {isEditable && (
            <button
              type="button"
              onClick={handleEditTributes}
              className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-muted-foreground hover:text-primary transition-colors cursor-pointer self-start sm:self-auto"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>{t("editTributes")}</span>
            </button>
          )}
        </div>

        {/* Dynamic Compact Tribute Formation Grid */}
        <CompactTributeFormation
          tributes={tributes}
          onSelectTribute={isEditable ? () => handleEditTributes() : undefined}
        />
      </section>

      {/* 3. Simulation Rules & Storytelling Directives Card */}
      <section
        aria-labelledby="section-rules-summary"
        className="p-5 sm:p-6 clip-chamfer-md bg-card/85 border border-border/80 space-y-4 shadow-xs"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
          <div className="flex items-center gap-2.5 text-primary">
            <Sliders className="h-4 w-4" />
            <h3
              id="section-rules-summary"
              className="text-sm sm:text-base font-serif font-bold uppercase tracking-wider text-foreground"
            >
              {t("rulesHeading")}
            </h3>
          </div>
          {isEditable && (
            <button
              type="button"
              onClick={handleEditRules}
              className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-muted-foreground hover:text-primary transition-colors cursor-pointer self-start sm:self-auto"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>{t("editRules")}</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {/* Turn Mode */}
          <div className="p-3 clip-chamfer-xs bg-background/80 border border-border/70 space-y-1">
            <div className="flex items-center gap-1 text-primary">
              <Zap className="h-3.5 w-3.5" />
              <span className="text-[10px] font-mono font-bold uppercase text-muted-foreground">
                {t("turnMode")}
              </span>
            </div>
            <p className="text-xs font-mono font-bold text-foreground capitalize">
              {rulesState.turnGranularity.replace(/_/g, " ")}
            </p>
          </div>

          {/* Streaming Pacing */}
          <div className="p-3 clip-chamfer-xs bg-background/80 border border-border/70 space-y-1">
            <div className="flex items-center gap-1 text-primary">
              <Radio className="h-3.5 w-3.5" />
              <span className="text-[10px] font-mono font-bold uppercase text-muted-foreground">
                {t("pacingSpeed")}
              </span>
            </div>
            <p className="text-xs font-mono font-bold text-foreground capitalize">
              {rulesState.pacing} Pacing
            </p>
          </div>

          {/* Combat Lethality */}
          <div className="p-3 clip-chamfer-xs bg-background/80 border border-border/70 space-y-1">
            <div className="flex items-center gap-1 text-primary">
              <Skull className="h-3.5 w-3.5" />
              <span className="text-[10px] font-mono font-bold uppercase text-muted-foreground">
                {t("combatLethality")}
              </span>
            </div>
            <p className="text-xs font-mono font-bold text-foreground capitalize">
              {rulesState.combatLethality.replace(/_/g, " ")}
            </p>
          </div>

          {/* Alliance Dynamic */}
          <div className="p-3 clip-chamfer-xs bg-background/80 border border-border/70 space-y-1">
            <div className="flex items-center gap-1 text-primary">
              <Users className="h-3.5 w-3.5" />
              <span className="text-[10px] font-mono font-bold uppercase text-muted-foreground">
                {t("alliances")}
              </span>
            </div>
            <p className="text-xs font-mono font-bold text-foreground capitalize">
              {rulesState.allianceDynamic.replace(/_/g, " ")}
            </p>
          </div>

          {/* AI Narrative Voice */}
          <div className="p-3 clip-chamfer-xs bg-background/80 border border-border/70 space-y-1">
            <div className="flex items-center gap-1 text-primary">
              <BookOpen className="h-3.5 w-3.5" />
              <span className="text-[10px] font-mono font-bold uppercase text-muted-foreground">
                {t("narrativeVoice")}
              </span>
            </div>
            <p className="text-xs font-mono font-bold text-foreground capitalize">
              {rulesState.narrativeVoice.replace(/_/g, " ")}
            </p>
          </div>

          {/* Victory Condition */}
          <div className="p-3 clip-chamfer-xs bg-background/80 border border-border/70 space-y-1">
            <div className="flex items-center gap-1 text-primary">
              <Award className="h-3.5 w-3.5" />
              <span className="text-[10px] font-mono font-bold uppercase text-muted-foreground">
                {t("victoryCondition")}
              </span>
            </div>
            <p className="text-xs font-mono font-bold text-foreground capitalize">
              {rulesState.victoryCondition.replace(/_/g, " ")}
            </p>
          </div>

          {/* Mid-Game Feast */}
          <div className="p-3 clip-chamfer-xs bg-background/80 border border-border/70 space-y-1">
            <div className="flex items-center gap-1 text-yellow-400">
              <UtensilsCrossed className="h-3.5 w-3.5" />
              <span className="text-[10px] font-mono font-bold uppercase text-muted-foreground">
                {t("feastLabel")}
              </span>
            </div>
            <p
              className={`text-xs font-mono font-bold ${
                rulesState.enableMidGameFeast ? "text-yellow-400" : "text-muted-foreground"
              }`}
            >
              {rulesState.enableMidGameFeast ? t("feastActive") : t("feastInactive")}
            </p>
          </div>

          {/* Special Events */}
          <div className="p-3 clip-chamfer-xs bg-background/80 border border-border/70 space-y-1">
            <div className="flex items-center gap-1 text-red-400">
              <CloudLightning className="h-3.5 w-3.5" />
              <span className="text-[10px] font-mono font-bold uppercase text-muted-foreground">
                {t("specialEventsLabel")}
              </span>
            </div>
            <p
              className={`text-xs font-mono font-bold ${
                rulesState.enableSpecialEvents ? "text-red-400" : "text-muted-foreground"
              }`}
            >
              {rulesState.enableSpecialEvents ? t("specialEventsActive") : t("specialEventsInactive")}
            </p>
          </div>
        </div>
      </section>

      {/* 4. Centered Command Action Zone at the Bottom */}
      <div className="pt-6 flex flex-col items-center justify-center space-y-4">
        {/* Main Launch Button */}
        <button
          type="button"
          onClick={handleLaunchClick}
          disabled={!isLaunchReady || isLaunching}
          style={{
            background: `linear-gradient(to right, ${activePalette.accentHex}, ${activePalette.highlightHex})`,
          }}
          className={`w-full max-w-lg inline-flex items-center justify-center gap-3 px-8 py-4 sm:py-5 clip-chamfer-md text-black font-mono font-black text-sm sm:text-base tracking-wider uppercase border border-yellow-300 shadow-[0_0_35px_var(--theme-glow),0_6px_0_rgba(0,0,0,0.35)] transition-all duration-300 ${
            isLaunchReady && !isLaunching
              ? "hover:brightness-115 hover:scale-[1.02] active:translate-y-1 active:shadow-none cursor-pointer"
              : "opacity-60 cursor-not-allowed"
          }`}
        >
          <Flame className="h-5 w-5 fill-black text-black" />
          <span>{isLaunching ? t("launchingProgress") : t("launchGameCta")}</span>
          <ArrowRight className="h-5 w-5 text-black" />
        </button>

        {/* Registered User: Return to Gamemaker Lobby */}
        {isPermanent && (
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-mono font-bold tracking-wider uppercase text-muted-foreground hover:text-primary transition-colors px-4 py-2 clip-chamfer-xs bg-muted/40 hover:bg-muted/80 border border-border"
          >
            <Home className="h-3.5 w-3.5" />
            <span>{t("returnLobbyCta")}</span>
          </Link>
        )}
      </div>
    </div>
  );
}
