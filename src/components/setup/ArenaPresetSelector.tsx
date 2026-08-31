"use client";

import React, { useCallback } from "react";
import { useTranslations } from "next-intl";
import { Sparkles, ChevronDown, BookOpen, Settings2 } from "lucide-react";
import { ARENA_PRESETS } from "@/config/arena-presets";
import { useSetup } from "@/lib/setup/setup-context";

export function ArenaPresetSelector() {
  const t = useTranslations("setup.arena");
  const { selectedPresetId, applyPresetById, gameStatus } = useSetup();
  const isEditable = gameStatus === "setup" || gameStatus === "archived";

  const handleSelectChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const presetId = e.target.value;
      if (presetId) {
        applyPresetById(presetId);
      }
    },
    [applyPresetById]
  );

  const activePreset = ARENA_PRESETS.find((p) => p.id === selectedPresetId);

  return (
    <div className="w-full p-3.5 sm:p-4 clip-chamfer-sm bg-card/90 border border-border/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      {/* Label and description */}
      <div className="flex items-center gap-2.5">
        <div className="p-2 clip-chamfer-xs bg-primary/10 border border-primary/30 text-primary">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <label
            htmlFor="arena-preset-select"
            className="text-xs font-mono font-bold uppercase tracking-wider text-foreground block cursor-pointer"
          >
            {t("presetDropdownLabel")}
          </label>
          <span className="text-[11px] text-muted-foreground font-light">
            {t("presetDropdownHelp")}
          </span>
        </div>
      </div>

      {/* Compact Dropdown & Tag */}
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <div className="relative flex-1 sm:w-72 lg:w-80">
          <select
            id="arena-preset-select"
            value={selectedPresetId || "custom"}
            onChange={handleSelectChange}
            disabled={!isEditable}
            className="w-full appearance-none px-3.5 py-2 pr-9 clip-chamfer-xs bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary text-xs font-mono font-semibold text-foreground transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <option value="custom" disabled={Boolean(selectedPresetId)}>
              {t("customPresetOption")}
            </option>
            {ARENA_PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
            <ChevronDown className="h-3.5 w-3.5" />
          </div>
        </div>

        {/* Dynamic Status Tag */}
        <div className="hidden md:inline-flex items-center gap-1 px-2.5 py-1.5 clip-chamfer-xs bg-muted/60 border border-border text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground shrink-0">
          {activePreset ? (
            <>
              <BookOpen className="h-3 w-3 text-primary" />
              <span>{activePreset.tag}</span>
            </>
          ) : (
            <>
              <Settings2 className="h-3 w-3 text-amber-400" />
              <span>{t("customTag")}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
