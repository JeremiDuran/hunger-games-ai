"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  Users,
  Search,
  Filter,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useSetup } from "@/lib/setup/setup-context";
import { TributeCard } from "./TributeCard";
import { TributeEditorModal } from "./TributeEditorModal";
import { TributeControlsBar } from "./TributePresetSelector";
import { TributeGender } from "@/types/setup";

export function TributeRoster() {
  const t = useTranslations("setup.tributes");
  const {
    tributes,
    totalTributes,
    tributesPerDistrict,
    districtCount,
    isTributesValid,
    tributeErrors,
  } = useSetup();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDistrictFilter, setSelectedDistrictFilter] = useState<number | null>(null);
  const [selectedGenderFilter, setSelectedGenderFilter] = useState<TributeGender | "all">("all");
  const [editingTributeId, setEditingTributeId] = useState<string | null>(null);

  // Filter tributes based on search and selected filters
  const filteredTributes = useMemo(() => {
    return tributes.filter((tribute) => {
      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = tribute.name.toLowerCase().includes(query);
        const matchesDistrict = `district ${tribute.district}`.includes(query);
        const matchesPersonality = tribute.personality.toLowerCase().includes(query);
        const matchesPhysical = tribute.physicalAspect.toLowerCase().includes(query);
        if (!matchesName && !matchesDistrict && !matchesPersonality && !matchesPhysical) return false;
      }

      // District Filter
      if (selectedDistrictFilter !== null && tribute.district !== selectedDistrictFilter) {
        return false;
      }

      // Gender Filter
      if (selectedGenderFilter !== "all" && tribute.gender !== selectedGenderFilter) {
        return false;
      }

      return true;
    });
  }, [tributes, searchQuery, selectedDistrictFilter, selectedGenderFilter]);

  // Group filtered tributes by district
  const districtGroups = useMemo(() => {
    const map = new Map<number, typeof tributes>();
    for (let d = 1; d <= districtCount; d++) {
      map.set(d, []);
    }
    for (const tribute of filteredTributes) {
      const group = map.get(tribute.district);
      if (group) {
        group.push(tribute);
      }
    }
    return Array.from(map.entries()).filter(([, list]) => list.length > 0);
  }, [filteredTributes, districtCount]);

  const totalInvalidCount = useMemo(() => {
    return Object.keys(tributeErrors).length;
  }, [tributeErrors]);

  // Dynamic responsive grid classes based on tributes per district
  const gridClasses = useMemo(() => {
    switch (tributesPerDistrict) {
      case 4:
        return "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5";
      case 3:
        return "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5";
      case 2:
      default:
        return "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-3.5";
    }
  }, [tributesPerDistrict]);

  // Active editing tribute details
  const activeEditingIndex = useMemo(() => {
    if (!editingTributeId) return -1;
    return tributes.findIndex((t) => t.id === editingTributeId);
  }, [editingTributeId, tributes]);

  const activeTribute = useMemo(() => {
    if (activeEditingIndex === -1) return null;
    return tributes[activeEditingIndex] || null;
  }, [activeEditingIndex, tributes]);

  const slotIndexInDistrict = useMemo(() => {
    if (!activeTribute) return 1;
    const districtTributes = tributes.filter((t) => t.district === activeTribute.district);
    const idx = districtTributes.findIndex((t) => t.id === activeTribute.id);
    return idx >= 0 ? idx + 1 : 1;
  }, [activeTribute, tributes]);

  const handleOpenEditor = useCallback((id: string) => {
    setEditingTributeId(id);
  }, []);

  const handleCloseEditor = useCallback(() => {
    setEditingTributeId(null);
  }, []);

  const handleNavigatePrev = useCallback(() => {
    if (activeEditingIndex > 0) {
      setEditingTributeId(tributes[activeEditingIndex - 1].id);
    }
  }, [activeEditingIndex, tributes]);

  const handleNavigateNext = useCallback(() => {
    if (activeEditingIndex >= 0 && activeEditingIndex < tributes.length - 1) {
      setEditingTributeId(tributes[activeEditingIndex + 1].id);
    }
  }, [activeEditingIndex, tributes]);

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Stats */}
      <div className="p-4 sm:p-6 clip-chamfer-md bg-card/90 border border-border/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 clip-chamfer-xs bg-primary/10 border border-primary/30 text-primary">
              <Users className="h-4 w-4" />
            </span>
            <h2 className="text-lg sm:text-xl font-mono font-black tracking-wider uppercase text-foreground">
              {t("rosterTitle")}
            </h2>
          </div>
          <p className="text-xs text-muted-foreground font-mono mt-1">
            {t("rosterSubtitle", { count: totalTributes, districts: districtCount })}
          </p>
        </div>

        {/* Readiness Badge */}
        <div className="flex items-center gap-2">
          {isTributesValid ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 clip-chamfer-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{t("allValid")}</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 clip-chamfer-xs bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold uppercase tracking-wider">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>{t("invalidWarning", { count: totalInvalidCount })}</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Top Agnostic Controls Bar */}
      <TributeControlsBar />

      {/* 3. Search & Filter Bar */}
      <div className="p-3.5 clip-chamfer-sm bg-card/80 border border-border flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full pl-9 pr-3.5 py-1.5 clip-chamfer-xs bg-background/90 text-xs font-mono text-foreground placeholder:text-muted-foreground/50 border border-border focus:border-primary focus:outline-none"
          />
          <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* District Quick-Jump & Gender Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-start md:justify-end">
          {/* Gender Filter Buttons */}
          <div className="inline-flex items-center p-0.5 clip-chamfer-xs bg-muted/40 border border-border">
            <button
              type="button"
              onClick={() => setSelectedGenderFilter("all")}
              className={`px-2 py-1 clip-chamfer-xs text-[10px] font-mono font-bold uppercase transition-colors cursor-pointer ${
                selectedGenderFilter === "all"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("filterAll")}
            </button>
            <button
              type="button"
              onClick={() => setSelectedGenderFilter("female")}
              className={`px-2 py-1 clip-chamfer-xs text-[10px] font-mono font-bold uppercase transition-colors cursor-pointer ${
                selectedGenderFilter === "female"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("genderFemale")}
            </button>
            <button
              type="button"
              onClick={() => setSelectedGenderFilter("male")}
              className={`px-2 py-1 clip-chamfer-xs text-[10px] font-mono font-bold uppercase transition-colors cursor-pointer ${
                selectedGenderFilter === "male"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("genderMale")}
            </button>
          </div>

          {/* District Filter Dropdown */}
          <div className="relative">
            <select
              value={selectedDistrictFilter !== null ? selectedDistrictFilter : "all"}
              onChange={(e) =>
                setSelectedDistrictFilter(
                  e.target.value === "all" ? null : parseInt(e.target.value, 10)
                )
              }
              aria-label={t("filterDistrictLabel")}
              className="appearance-none px-3 py-1.5 pr-8 clip-chamfer-xs bg-background text-xs font-mono font-semibold text-foreground border border-border focus:border-primary focus:outline-none cursor-pointer"
            >
              <option value="all">{t("allDistrictsOption")}</option>
              {Array.from({ length: districtCount }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  {t("districtHeading", { number: d })}
                </option>
              ))}
            </select>
            <Filter className="h-3 w-3 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* 4. District Groups & Tribute Cards Grid */}
      <div className="space-y-8">
        {districtGroups.map(([districtNum, groupTributes]) => (
          <section
            key={districtNum}
            aria-labelledby={`district-heading-${districtNum}`}
            className="space-y-3"
          >
            {/* Agnostic District Group Header */}
            <div className="flex items-center justify-between px-3.5 py-2.5 clip-chamfer-xs bg-card/60 border border-border/60 backdrop-blur-xs">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-primary" aria-hidden="true" />
                <h3
                  id={`district-heading-${districtNum}`}
                  className="text-xs sm:text-sm font-mono font-black uppercase tracking-wider text-foreground"
                >
                  {t("districtHeading", { number: districtNum })}
                </h3>
              </div>

              <span className="text-[10px] font-mono text-primary font-bold uppercase tracking-widest bg-primary/10 px-2 py-0.5 clip-chamfer-xs border border-primary/20">
                {t("tributesCountBadge", { count: groupTributes.length })}
              </span>
            </div>

            {/* Dynamic Grid of Compact Tribute Cards */}
            <div className={gridClasses}>
              {groupTributes.map((tribute, idx) => (
                <TributeCard
                  key={tribute.id}
                  tribute={tribute}
                  indexInDistrict={idx + 1}
                  onEdit={handleOpenEditor}
                />
              ))}
            </div>
          </section>
        ))}

        {districtGroups.length === 0 && (
          <div className="p-12 text-center clip-chamfer-md bg-card/40 border border-dashed border-border text-muted-foreground font-mono text-xs">
            <p>{t("noMatchesFound")}</p>
          </div>
        )}
      </div>

      {/* 5. Holographic Tribute Dossier Editor Modal */}
      <TributeEditorModal
        tribute={activeTribute}
        isOpen={Boolean(editingTributeId && activeTribute)}
        onClose={handleCloseEditor}
        onNavigatePrev={handleNavigatePrev}
        onNavigateNext={handleNavigateNext}
        hasPrev={activeEditingIndex > 0}
        hasNext={activeEditingIndex >= 0 && activeEditingIndex < tributes.length - 1}
        currentIndex={activeEditingIndex >= 0 ? activeEditingIndex : 0}
        totalCount={tributes.length}
        slotIndexInDistrict={slotIndexInDistrict}
      />
    </div>
  );
}
