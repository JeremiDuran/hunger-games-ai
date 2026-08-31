"use client";

import React, { useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  Eraser,
  RotateCcw,
  Layers,
  Users,
  ChevronDown,
} from "lucide-react";
import { useSetup } from "@/lib/setup/setup-context";
import { TributesPerDistrict } from "@/types/setup";
import {
  MIN_TOTAL_TRIBUTES,
  MAX_TOTAL_TRIBUTES,
  TRIBUTES_PER_DISTRICT_OPTIONS,
} from "@/config/tribute-presets";

// Generate all valid total tribute counts between 12 and 48 that are multiples of two
const VALID_TOTAL_COUNTS: number[] = [];
for (let i = MIN_TOTAL_TRIBUTES; i <= MAX_TOTAL_TRIBUTES; i += 2) {
  VALID_TOTAL_COUNTS.push(i);
}

export function TributeControlsBar() {
  const t = useTranslations("setup.tributes");
  const {
    totalTributes,
    tributesPerDistrict,
    setTotalTributes,
    setTributesPerDistrict,
    clearAllTributes,
    resetTributesToDefault,
  } = useSetup();

  const handleTotalChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const parsed = parseInt(e.target.value, 10);
      if (!isNaN(parsed) && parsed >= MIN_TOTAL_TRIBUTES && parsed <= MAX_TOTAL_TRIBUTES && parsed % 2 === 0) {
        setTotalTributes(parsed);
      }
    },
    [setTotalTributes]
  );

  const handlePerDistrictChange = useCallback(
    (count: TributesPerDistrict) => {
      setTributesPerDistrict(count);
    },
    [setTributesPerDistrict]
  );

  // Quick preset shortcuts for common capacities
  const quickCapacityOptions = useMemo(() => [12, 24, 36, 48], []);

  return (
    <div className="w-full p-4 sm:p-5 clip-chamfer-md bg-card/90 border border-border/80 shadow-xs flex flex-col xl:flex-row xl:items-center justify-between gap-5">
      {/* Left: Total Tributes & Smart Tributes-per-District Selector */}
      <div className="flex flex-wrap items-center gap-4 sm:gap-6">
        {/* Total Tributes Selector */}
        <div className="space-y-1.5">
          <label
            htmlFor="total-tributes-select"
            className="text-[11px] font-mono font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"
          >
            <Users className="h-3.5 w-3.5 text-primary" />
            <span>{t("totalTributesLabel")}</span>
          </label>

          <div className="flex items-center gap-2">
            <div className="relative min-w-[72px]">
              <select
                id="total-tributes-select"
                value={totalTributes}
                onChange={handleTotalChange}
                aria-label={t("totalTributesLabel")}
                className="w-full appearance-none px-3 py-2 pr-7 clip-chamfer-xs bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary text-xs font-mono font-bold text-foreground transition-colors cursor-pointer"
              >
                {VALID_TOTAL_COUNTS.map((count) => (
                  <option key={count} value={count}>
                    {count}
                  </option>
                ))}
              </select>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                <ChevronDown className="h-3.5 w-3.5" />
              </div>
            </div>

            {/* Quick shortcut chips */}
            <div className="hidden sm:inline-flex items-center p-0.5 clip-chamfer-xs bg-muted/40 border border-border">
              {quickCapacityOptions.map((cap) => (
                <button
                  key={cap}
                  type="button"
                  onClick={() => setTotalTributes(cap)}
                  className={`px-2.5 py-1 clip-chamfer-xs text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                    totalTributes === cap
                      ? "bg-primary text-primary-foreground shadow-xs font-black"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {cap}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Smart Tributes Per District Segmented Switcher */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-primary" />
            <span>{t("tributesPerDistrictLabel")}</span>
          </label>

          <div className="inline-flex items-center p-1 clip-chamfer-xs bg-muted/40 border border-border gap-1">
            {TRIBUTES_PER_DISTRICT_OPTIONS.map((count) => {
              const isDivisible = totalTributes % count === 0;
              const isSelected = tributesPerDistrict === count && isDivisible;
              const calculatedDistricts = isDivisible ? totalTributes / count : 0;

              return (
                <button
                  key={count}
                  type="button"
                  disabled={!isDivisible}
                  onClick={() => handlePerDistrictChange(count)}
                  title={
                    isDivisible
                      ? `${count} per district (${calculatedDistricts} districts)`
                      : t("notDivisibleHint", { total: totalTributes, count })
                  }
                  className={`px-3 py-1.5 clip-chamfer-xs text-[11px] font-mono font-bold uppercase transition-all flex items-center justify-center ${
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-xs font-black"
                      : isDivisible
                      ? "text-muted-foreground hover:text-foreground hover:bg-background/80 cursor-pointer"
                      : "opacity-30 text-muted-foreground/50 cursor-not-allowed line-through"
                  }`}
                >
                  <span>{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right: Roster Actions (Clear Form, Reset to Canon) */}
      <div className="flex flex-wrap items-center gap-2.5 pt-2 xl:pt-0 border-t xl:border-t-0 border-border/40 justify-start xl:justify-end">
        {/* Clear Form */}
        <button
          type="button"
          onClick={clearAllTributes}
          title={t("clearRoster")}
          aria-label={t("clearRoster")}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 clip-chamfer-xs bg-muted/40 hover:bg-muted/80 text-muted-foreground hover:text-foreground border border-border text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer"
        >
          <Eraser className="h-3.5 w-3.5" />
          <span>{t("clearRoster")}</span>
        </button>

        {/* Reset to Canon 74th */}
        <button
          type="button"
          onClick={resetTributesToDefault}
          title={t("resetCanon")}
          aria-label={t("resetCanon")}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 clip-chamfer-xs bg-muted/40 hover:bg-muted/80 text-muted-foreground hover:text-foreground border border-border text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>{t("resetCanon")}</span>
        </button>
      </div>
    </div>
  );
}

// Alias for backwards compatibility
export const TributePresetSelector = TributeControlsBar;
