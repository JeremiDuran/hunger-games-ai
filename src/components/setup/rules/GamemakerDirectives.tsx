"use client";

import React, { useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  Swords,
  Users2,
  Gift,
  Skull,
  CloudLightning,
  Crown,
  Sparkles,
  Check,
  PlusCircle,
  UtensilsCrossed,
} from "lucide-react";
import { useSetup } from "@/lib/setup/setup-context";
import {
  CombatLethality,
  AllianceDynamic,
  SponsorGenerosity,
  MuttationTiming,
  DisasterFrequency,
  VictoryCondition,
} from "@/types/setup";

export function GamemakerDirectives() {
  const t = useTranslations("setup.rules");
  const { rulesState, updateRules, arenaState, enableHazardInArena } = useSetup();

  const handleLethalitySelect = useCallback(
    (combatLethality: CombatLethality) => {
      updateRules({ combatLethality });
    },
    [updateRules]
  );

  const handleAllianceSelect = useCallback(
    (allianceDynamic: AllianceDynamic) => {
      updateRules({ allianceDynamic });
    },
    [updateRules]
  );

  const handleFeastToggle = useCallback(() => {
    updateRules({ enableMidGameFeast: !rulesState.enableMidGameFeast });
  }, [rulesState.enableMidGameFeast, updateRules]);

  const handleSponsorSelect = useCallback(
    (sponsorGenerosity: SponsorGenerosity) => {
      updateRules({ sponsorGenerosity });
    },
    [updateRules]
  );

  const handleMuttationSelect = useCallback(
    (muttationTiming: MuttationTiming) => {
      updateRules({ muttationTiming });
    },
    [updateRules]
  );

  const handleDisasterSelect = useCallback(
    (disasterFrequency: DisasterFrequency) => {
      updateRules({ disasterFrequency });
    },
    [updateRules]
  );

  const handleVictorySelect = useCallback(
    (victoryCondition: VictoryCondition) => {
      updateRules({ victoryCondition });
    },
    [updateRules]
  );

  const hasSponsorDrops = arenaState.hazards.enableSponsorDrops;
  const hasMuttations = arenaState.hazards.enableMuttations;
  const hasDisasters = arenaState.hazards.enableDisasters;

  const lethalityOptions: { id: CombatLethality; title: string; desc: string }[] = [
    {
      id: "balanced",
      title: t("combat.balanced"),
      desc: t("combat.balancedDesc"),
    },
    {
      id: "high_bloodbath",
      title: t("combat.highBloodbath"),
      desc: t("combat.highBloodbathDesc"),
    },
    {
      id: "gritty_survival",
      title: t("combat.grittySurvival"),
      desc: t("combat.grittySurvivalDesc"),
    },
  ];

  const allianceOptions: { id: AllianceDynamic; title: string; desc: string }[] = [
    {
      id: "dynamic_pacts",
      title: t("alliances.dynamicPacts"),
      desc: t("alliances.dynamicPactsDesc"),
    },
    {
      id: "lone_wolves",
      title: t("alliances.loneWolves"),
      desc: t("alliances.loneWolvesDesc"),
    },
    {
      id: "career_pack",
      title: t("alliances.careerPack"),
      desc: t("alliances.careerPackDesc"),
    },
  ];

  const sponsorOptions: { id: SponsorGenerosity; title: string; desc: string }[] = [
    {
      id: "standard",
      title: t("hazardsBound.sponsorStandard"),
      desc: t("hazardsBound.sponsorStandardDesc"),
    },
    {
      id: "abundance",
      title: t("hazardsBound.sponsorAbundance"),
      desc: t("hazardsBound.sponsorAbundanceDesc"),
    },
    {
      id: "famine",
      title: t("hazardsBound.sponsorFamine"),
      desc: t("hazardsBound.sponsorFamineDesc"),
    },
  ];

  const muttationOptions: { id: MuttationTiming; title: string; desc: string }[] = [
    {
      id: "climax_only",
      title: t("hazardsBound.muttationClimax"),
      desc: t("hazardsBound.muttationClimaxDesc"),
    },
    {
      id: "night_stalkers",
      title: t("hazardsBound.muttationNight"),
      desc: t("hazardsBound.muttationNightDesc"),
    },
  ];

  const disasterOptions: { id: DisasterFrequency; title: string; desc: string }[] = [
    {
      id: "moderate",
      title: t("hazardsBound.disasterModerate"),
      desc: t("hazardsBound.disasterModerateDesc"),
    },
    {
      id: "frequent",
      title: t("hazardsBound.disasterFrequent"),
      desc: t("hazardsBound.disasterFrequentDesc"),
    },
    {
      id: "reactive_only",
      title: t("hazardsBound.disasterReactive"),
      desc: t("hazardsBound.disasterReactiveDesc"),
    },
  ];

  const victoryOptions: { id: VictoryCondition; title: string; desc: string }[] = [
    {
      id: "sole_victor",
      title: t("victory.soleVictor"),
      desc: t("victory.soleVictorDesc"),
    },
    {
      id: "district_duo_twist",
      title: t("victory.districtDuo"),
      desc: t("victory.districtDuoDesc"),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
          <Swords className="h-4 w-4 text-primary" />
          <span>{t("directivesHeading")}</span>
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {t("directivesSubheading")}
        </p>
      </div>

      {/* Grid of Directives */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* 1. Combat Lethality */}
        <div className="p-4 sm:p-5 clip-chamfer-sm bg-card/85 border border-border/80 space-y-3">
          <div className="flex items-center gap-2 text-foreground font-serif font-bold text-sm">
            <Swords className="h-4 w-4 text-red-400" />
            <span>{t("combat.title")}</span>
          </div>

          <div className="space-y-2">
            {lethalityOptions.map((opt) => {
              const isSelected = rulesState.combatLethality === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleLethalitySelect(opt.id)}
                  className={`w-full text-left p-3 clip-chamfer-xs border transition-all duration-150 cursor-pointer flex items-start justify-between gap-3 ${
                    isSelected
                      ? "bg-primary/10 border-primary text-foreground ring-1 ring-primary/30"
                      : "bg-background/60 border-border/60 hover:bg-background/90 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div>
                    <span className="text-xs font-serif font-bold block text-foreground">
                      {opt.title}
                    </span>
                    <span className="text-[11px] text-muted-foreground leading-relaxed block mt-0.5">
                      {opt.desc}
                    </span>
                  </div>
                  <div
                    className={`mt-0.5 h-3.5 w-3.5 shrink-0 rounded-xs border flex items-center justify-center ${
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

        {/* 2. Alliance & Betrayal Dynamics */}
        <div className="p-4 sm:p-5 clip-chamfer-sm bg-card/85 border border-border/80 space-y-3">
          <div className="flex items-center gap-2 text-foreground font-serif font-bold text-sm">
            <Users2 className="h-4 w-4 text-amber-400" />
            <span>{t("alliances.title")}</span>
          </div>

          <div className="space-y-2">
            {allianceOptions.map((opt) => {
              const isSelected = rulesState.allianceDynamic === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleAllianceSelect(opt.id)}
                  className={`w-full text-left p-3 clip-chamfer-xs border transition-all duration-150 cursor-pointer flex items-start justify-between gap-3 ${
                    isSelected
                      ? "bg-primary/10 border-primary text-foreground ring-1 ring-primary/30"
                      : "bg-background/60 border-border/60 hover:bg-background/90 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div>
                    <span className="text-xs font-serif font-bold block text-foreground">
                      {opt.title}
                    </span>
                    <span className="text-[11px] text-muted-foreground leading-relaxed block mt-0.5">
                      {opt.desc}
                    </span>
                  </div>
                  <div
                    className={`mt-0.5 h-3.5 w-3.5 shrink-0 rounded-xs border flex items-center justify-center ${
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

        {/* 3. Sponsor Drop Generosity (Bound to enableSponsorDrops) */}
        <div
          className={`p-4 sm:p-5 clip-chamfer-sm border space-y-3 transition-opacity ${
            hasSponsorDrops
              ? "bg-card/85 border-border/80 opacity-100"
              : "bg-card/40 border-border/40 opacity-60"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-foreground font-serif font-bold text-sm">
              <Gift className="h-4 w-4 text-emerald-400" />
              <span>{t("hazardsBound.sponsorTitle")}</span>
            </div>
            {!hasSponsorDrops && (
              <button
                type="button"
                onClick={() => enableHazardInArena("enableSponsorDrops")}
                className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-primary hover:underline cursor-pointer"
              >
                <PlusCircle className="h-3 w-3" />
                <span>{t("hazardsBound.enableShortcut")}</span>
              </button>
            )}
          </div>

          {hasSponsorDrops ? (
            <div className="space-y-2">
              {sponsorOptions.map((opt) => {
                const isSelected = rulesState.sponsorGenerosity === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSponsorSelect(opt.id)}
                    className={`w-full text-left p-3 clip-chamfer-xs border transition-all duration-150 cursor-pointer flex items-start justify-between gap-3 ${
                      isSelected
                        ? "bg-primary/10 border-primary text-foreground ring-1 ring-primary/30"
                        : "bg-background/60 border-border/60 hover:bg-background/90 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <div>
                      <span className="text-xs font-serif font-bold block text-foreground">
                        {opt.title}
                      </span>
                      <span className="text-[11px] text-muted-foreground leading-relaxed block mt-0.5">
                        {opt.desc}
                      </span>
                    </div>
                    <div
                      className={`mt-0.5 h-3.5 w-3.5 shrink-0 rounded-xs border flex items-center justify-center ${
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
          ) : (
            <div className="p-3 clip-chamfer-xs bg-muted/40 border border-border text-xs text-muted-foreground font-mono">
              {t("hazardsBound.inactiveInArena")} (Step 1)
            </div>
          )}
        </div>

        {/* 4. Gamemaker Muttations Behavior (Bound to enableMuttations) */}
        <div
          className={`p-4 sm:p-5 clip-chamfer-sm border space-y-3 transition-opacity ${
            hasMuttations
              ? "bg-card/85 border-border/80 opacity-100"
              : "bg-card/40 border-border/40 opacity-60"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-foreground font-serif font-bold text-sm">
              <Skull className="h-4 w-4 text-amber-500" />
              <span>{t("hazardsBound.muttationTitle")}</span>
            </div>
            {!hasMuttations && (
              <button
                type="button"
                onClick={() => enableHazardInArena("enableMuttations")}
                className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-primary hover:underline cursor-pointer"
              >
                <PlusCircle className="h-3 w-3" />
                <span>{t("hazardsBound.enableShortcut")}</span>
              </button>
            )}
          </div>

          {hasMuttations ? (
            <div className="space-y-2">
              {muttationOptions.map((opt) => {
                const isSelected = rulesState.muttationTiming === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleMuttationSelect(opt.id)}
                    className={`w-full text-left p-3 clip-chamfer-xs border transition-all duration-150 cursor-pointer flex items-start justify-between gap-3 ${
                      isSelected
                        ? "bg-primary/10 border-primary text-foreground ring-1 ring-primary/30"
                        : "bg-background/60 border-border/60 hover:bg-background/90 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <div>
                      <span className="text-xs font-serif font-bold block text-foreground">
                        {opt.title}
                      </span>
                      <span className="text-[11px] text-muted-foreground leading-relaxed block mt-0.5">
                        {opt.desc}
                      </span>
                    </div>
                    <div
                      className={`mt-0.5 h-3.5 w-3.5 shrink-0 rounded-xs border flex items-center justify-center ${
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
          ) : (
            <div className="p-3 clip-chamfer-xs bg-muted/40 border border-border text-xs text-muted-foreground font-mono">
              {t("hazardsBound.inactiveInArena")} (Step 1)
            </div>
          )}
        </div>

        {/* 5. Environmental Disasters Frequency (Bound to enableDisasters) */}
        <div
          className={`p-4 sm:p-5 clip-chamfer-sm border space-y-3 transition-opacity ${
            hasDisasters
              ? "bg-card/85 border-border/80 opacity-100"
              : "bg-card/40 border-border/40 opacity-60"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-foreground font-serif font-bold text-sm">
              <CloudLightning className="h-4 w-4 text-cyan-400" />
              <span>{t("hazardsBound.disasterTitle")}</span>
            </div>
            {!hasDisasters && (
              <button
                type="button"
                onClick={() => enableHazardInArena("enableDisasters")}
                className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-primary hover:underline cursor-pointer"
              >
                <PlusCircle className="h-3 w-3" />
                <span>{t("hazardsBound.enableShortcut")}</span>
              </button>
            )}
          </div>

          {hasDisasters ? (
            <div className="space-y-2">
              {disasterOptions.map((opt) => {
                const isSelected = rulesState.disasterFrequency === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleDisasterSelect(opt.id)}
                    className={`w-full text-left p-3 clip-chamfer-xs border transition-all duration-150 cursor-pointer flex items-start justify-between gap-3 ${
                      isSelected
                        ? "bg-primary/10 border-primary text-foreground ring-1 ring-primary/30"
                        : "bg-background/60 border-border/60 hover:bg-background/90 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <div>
                      <span className="text-xs font-serif font-bold block text-foreground">
                        {opt.title}
                      </span>
                      <span className="text-[11px] text-muted-foreground leading-relaxed block mt-0.5">
                        {opt.desc}
                      </span>
                    </div>
                    <div
                      className={`mt-0.5 h-3.5 w-3.5 shrink-0 rounded-xs border flex items-center justify-center ${
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
          ) : (
            <div className="p-3 clip-chamfer-xs bg-muted/40 border border-border text-xs text-muted-foreground font-mono">
              {t("hazardsBound.inactiveInArena")} (Step 1)
            </div>
          )}
        </div>

        {/* 6. Mid-Game Cornucopia Feast Toggle */}
        <div
          onClick={handleFeastToggle}
          className={`p-4 sm:p-5 clip-chamfer-sm border transition-all duration-200 cursor-pointer flex items-start gap-3.5 select-none ${
            rulesState.enableMidGameFeast
              ? "bg-card/85 border-primary/80 shadow-xs"
              : "bg-card/40 border-border/50 opacity-70"
          }`}
        >
          <div
            className={`mt-0.5 p-2 clip-chamfer-xs transition-colors ${
              rulesState.enableMidGameFeast
                ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/40"
                : "bg-muted text-muted-foreground border border-border"
            }`}
          >
            <UtensilsCrossed className="h-4 w-4" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-serif font-bold text-foreground">
                {t("feast.title")}
              </span>
              <div
                className={`h-4 w-4 rounded-xs border flex items-center justify-center transition-colors ${
                  rulesState.enableMidGameFeast
                    ? "bg-primary border-primary text-black"
                    : "border-border bg-background"
                }`}
              >
                {rulesState.enableMidGameFeast && <Check className="h-3 w-3 stroke-[3]" />}
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t("feast.desc")}
            </p>
          </div>
        </div>
      </div>

      {/* 7. Victory Condition Twist */}
      <div className="p-4 sm:p-5 clip-chamfer-sm bg-card/85 border border-border/80 space-y-3">
        <div className="flex items-center gap-2 text-foreground font-serif font-bold text-sm">
          <Crown className="h-4 w-4 text-primary" />
          <span>{t("victoryHeading")}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {victoryOptions.map((opt) => {
            const isSelected = rulesState.victoryCondition === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleVictorySelect(opt.id)}
                className={`w-full text-left p-3.5 clip-chamfer-xs border transition-all duration-150 cursor-pointer flex items-start justify-between gap-3 ${
                  isSelected
                    ? "bg-primary/10 border-primary text-foreground ring-1 ring-primary/40 shadow-xs"
                    : "bg-background/60 border-border/60 hover:bg-background/90 text-muted-foreground hover:text-foreground"
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <Sparkles className={`h-3 w-3 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                    <span className="text-xs font-serif font-bold text-foreground">
                      {opt.title}
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground leading-relaxed block mt-1">
                    {opt.desc}
                  </span>
                </div>
                <div
                  className={`mt-0.5 h-3.5 w-3.5 shrink-0 rounded-xs border flex items-center justify-center ${
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
