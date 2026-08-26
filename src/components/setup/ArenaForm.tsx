"use client";

import React, { useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  Compass,
  Sparkles,
  MapPin,
  FileText,
  Skull,
  Crosshair,
  CloudLightning,
  Gift,
  Check,
  Info,
} from "lucide-react";
import { useSetup } from "@/lib/setup/setup-context";

export function ArenaForm() {
  const t = useTranslations("setup.arena");
  const { arenaState, updateArena } = useSetup();

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateArena({ simulationTitle: e.target.value });
    },
    [updateArena]
  );

  const handleArenaNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateArena({ arenaName: e.target.value });
    },
    [updateArena]
  );

  const handleDescriptionChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      updateArena({ arenaDescription: e.target.value });
    },
    [updateArena]
  );

  const handleHazardToggle = useCallback(
    (hazardKey: keyof typeof arenaState.hazards) => {
      updateArena({
        hazards: {
          ...arenaState.hazards,
          [hazardKey]: !arenaState.hazards[hazardKey],
        },
      });
    },
    [arenaState.hazards, updateArena]
  );

  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className="w-full space-y-8"
      noValidate
    >
      {/* ===================================================================
          1. SIMULATION & ARENA IDENTITY
          =================================================================== */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <h2 className="text-base sm:text-lg font-serif font-bold text-foreground uppercase tracking-wider">
            {t("identityHeading")}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5 sm:p-6 clip-chamfer-md bg-card/85 border border-border/80 shadow-xs">
          {/* Simulation Title */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="simulation-title-input"
                className="text-xs font-mono font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5"
              >
                <Compass className="h-3.5 w-3.5 text-primary" />
                <span>{t("customTitle")}</span>
              </label>
              <span className="text-[10px] font-mono text-muted-foreground">
                {arenaState.simulationTitle.length}/80
              </span>
            </div>
            <input
              id="simulation-title-input"
              type="text"
              maxLength={80}
              value={arenaState.simulationTitle}
              onChange={handleTitleChange}
              placeholder={t("customTitlePlaceholder")}
              className="w-full px-3.5 py-2.5 clip-chamfer-xs bg-background/90 border border-border focus:border-primary focus:ring-1 focus:ring-primary text-sm font-serif font-bold text-foreground placeholder:text-muted-foreground/60 transition-colors"
            />
            <p className="text-[11px] text-muted-foreground font-light flex items-center gap-1">
              <Info className="h-3 w-3 shrink-0 text-primary/70" />
              <span>{t("customTitleHelp")}</span>
            </p>
          </div>

          {/* Custom Arena Name */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="arena-name-input"
                className="text-xs font-mono font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5"
              >
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span>{t("arenaNameLabel")}</span>
              </label>
              <span className="text-[10px] font-mono text-muted-foreground">
                {arenaState.arenaName.length}/80
              </span>
            </div>
            <input
              id="arena-name-input"
              type="text"
              maxLength={80}
              value={arenaState.arenaName}
              onChange={handleArenaNameChange}
              placeholder={t("arenaNamePlaceholder")}
              className="w-full px-3.5 py-2.5 clip-chamfer-xs bg-background/90 border border-border focus:border-primary focus:ring-1 focus:ring-primary text-sm font-serif font-bold text-foreground placeholder:text-muted-foreground/60 transition-colors"
            />
            <p className="text-[11px] text-muted-foreground font-light flex items-center gap-1">
              <Info className="h-3 w-3 shrink-0 text-primary/70" />
              <span>Broadcasted as the primary arena codename across Panem.</span>
            </p>
          </div>
        </div>
      </div>

      {/* ===================================================================
          2. ENVIRONMENTAL LORE & ATMOSPHERIC DETAILS (FOR LLM STORYTELLER)
          =================================================================== */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <h2 className="text-base sm:text-lg font-serif font-bold text-foreground uppercase tracking-wider">
              {t("descLabel")}
            </h2>
          </div>
          <span className="text-[11px] font-mono text-muted-foreground">
            {arenaState.arenaDescription.length}/1200
          </span>
        </div>

        <div className="p-5 sm:p-6 clip-chamfer-md bg-card/85 border border-border/80 shadow-xs space-y-3">
          <textarea
            id="arena-desc-input"
            rows={5}
            maxLength={1200}
            value={arenaState.arenaDescription}
            onChange={handleDescriptionChange}
            placeholder={t("descPlaceholder")}
            className="w-full px-3.5 py-3 clip-chamfer-xs bg-background/90 border border-border focus:border-primary focus:ring-1 focus:ring-primary text-xs sm:text-sm font-sans leading-relaxed text-foreground placeholder:text-muted-foreground/60 transition-colors resize-y min-h-[120px]"
          />

          <div className="p-3 clip-chamfer-xs bg-primary/10 border border-primary/30 flex items-start gap-2.5 text-xs text-muted-foreground leading-relaxed">
            <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <span>{t("descHelp")}</span>
          </div>
        </div>
      </div>

      {/* ===================================================================
          3. ENVIRONMENTAL HAZARD MATRIX
          =================================================================== */}
      <div className="space-y-4">
        <div>
          <h2 className="text-base sm:text-lg font-serif font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
            <Skull className="h-4 w-4 text-primary" />
            <span>{t("hazardsHeading")}</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("hazardsSubheading")}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Bloodbath */}
          <div
            onClick={() => handleHazardToggle("enableBloodbath")}
            className={`p-4 clip-chamfer-sm border transition-all duration-200 cursor-pointer flex items-start gap-3.5 select-none ${
              arenaState.hazards.enableBloodbath
                ? "bg-card border-primary/80 shadow-xs"
                : "bg-card/40 border-border/50 opacity-70"
            }`}
          >
            <div
              className={`mt-0.5 p-2 clip-chamfer-xs transition-colors ${
                arenaState.hazards.enableBloodbath
                  ? "bg-red-500/20 text-red-400 border border-red-500/40"
                  : "bg-muted text-muted-foreground border border-border"
              }`}
            >
              <Crosshair className="h-4 w-4" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-serif font-bold text-foreground">
                  {t("hazards.bloodbath")}
                </span>
                <div
                  className={`h-4 w-4 rounded-xs border flex items-center justify-center transition-colors ${
                    arenaState.hazards.enableBloodbath
                      ? "bg-primary border-primary text-black"
                      : "border-border bg-background"
                  }`}
                >
                  {arenaState.hazards.enableBloodbath && (
                    <Check className="h-3 w-3 stroke-[3]" />
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t("hazards.bloodbathDesc")}
              </p>
            </div>
          </div>

          {/* Muttations */}
          <div
            onClick={() => handleHazardToggle("enableMuttations")}
            className={`p-4 clip-chamfer-sm border transition-all duration-200 cursor-pointer flex items-start gap-3.5 select-none ${
              arenaState.hazards.enableMuttations
                ? "bg-card border-primary/80 shadow-xs"
                : "bg-card/40 border-border/50 opacity-70"
            }`}
          >
            <div
              className={`mt-0.5 p-2 clip-chamfer-xs transition-colors ${
                arenaState.hazards.enableMuttations
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                  : "bg-muted text-muted-foreground border border-border"
              }`}
            >
              <Skull className="h-4 w-4" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-serif font-bold text-foreground">
                  {t("hazards.muttations")}
                </span>
                <div
                  className={`h-4 w-4 rounded-xs border flex items-center justify-center transition-colors ${
                    arenaState.hazards.enableMuttations
                      ? "bg-primary border-primary text-black"
                      : "border-border bg-background"
                  }`}
                >
                  {arenaState.hazards.enableMuttations && (
                    <Check className="h-3 w-3 stroke-[3]" />
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t("hazards.muttationsDesc")}
              </p>
            </div>
          </div>

          {/* Disasters */}
          <div
            onClick={() => handleHazardToggle("enableDisasters")}
            className={`p-4 clip-chamfer-sm border transition-all duration-200 cursor-pointer flex items-start gap-3.5 select-none ${
              arenaState.hazards.enableDisasters
                ? "bg-card border-primary/80 shadow-xs"
                : "bg-card/40 border-border/50 opacity-70"
            }`}
          >
            <div
              className={`mt-0.5 p-2 clip-chamfer-xs transition-colors ${
                arenaState.hazards.enableDisasters
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40"
                  : "bg-muted text-muted-foreground border border-border"
              }`}
            >
              <CloudLightning className="h-4 w-4" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-serif font-bold text-foreground">
                  {t("hazards.disasters")}
                </span>
                <div
                  className={`h-4 w-4 rounded-xs border flex items-center justify-center transition-colors ${
                    arenaState.hazards.enableDisasters
                      ? "bg-primary border-primary text-black"
                      : "border-border bg-background"
                  }`}
                >
                  {arenaState.hazards.enableDisasters && (
                    <Check className="h-3 w-3 stroke-[3]" />
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t("hazards.disastersDesc")}
              </p>
            </div>
          </div>

          {/* Sponsor Drops */}
          <div
            onClick={() => handleHazardToggle("enableSponsorDrops")}
            className={`p-4 clip-chamfer-sm border transition-all duration-200 cursor-pointer flex items-start gap-3.5 select-none ${
              arenaState.hazards.enableSponsorDrops
                ? "bg-card border-primary/80 shadow-xs"
                : "bg-card/40 border-border/50 opacity-70"
            }`}
          >
            <div
              className={`mt-0.5 p-2 clip-chamfer-xs transition-colors ${
                arenaState.hazards.enableSponsorDrops
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                  : "bg-muted text-muted-foreground border border-border"
              }`}
            >
              <Gift className="h-4 w-4" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-serif font-bold text-foreground">
                  {t("hazards.sponsorDrops")}
                </span>
                <div
                  className={`h-4 w-4 rounded-xs border flex items-center justify-center transition-colors ${
                    arenaState.hazards.enableSponsorDrops
                      ? "bg-primary border-primary text-black"
                      : "border-border bg-background"
                  }`}
                >
                  {arenaState.hazards.enableSponsorDrops && (
                    <Check className="h-3 w-3 stroke-[3]" />
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t("hazards.sponsorDropsDesc")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
