"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useSetup } from "@/lib/setup/setup-context";
import { TributeCard } from "./TributeCard";
import { TributeEditorModal } from "./TributeEditorModal";
import { TributeControlsBar } from "./TributePresetSelector";

export function TributeRoster() {
  const t = useTranslations("setup.tributes");
  const {
    tributes,
    tributesPerDistrict,
    districtCount,
  } = useSetup();

  const [editingTributeId, setEditingTributeId] = useState<string | null>(null);

  // Group tributes directly by district
  const districtGroups = useMemo(() => {
    const map = new Map<number, typeof tributes>();
    for (let d = 1; d <= districtCount; d++) {
      map.set(d, []);
    }
    for (const tribute of tributes) {
      const group = map.get(tribute.district);
      if (group) {
        group.push(tribute);
      }
    }
    return Array.from(map.entries()).filter(([, list]) => list.length > 0);
  }, [tributes, districtCount]);

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
      {/* 1. Top Agnostic Controls Bar */}
      <TributeControlsBar />

      {/* 2. District Groups & Tribute Cards Grid */}
      <div className="space-y-8">
        {districtGroups.map(([districtNum, groupTributes]) => (
          <section
            key={districtNum}
            aria-labelledby={`district-heading-${districtNum}`}
            className="space-y-3"
          >
            {/* District Group Header */}
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

            {/* Dynamic Grid of Tribute Cards */}
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

      {/* 3. Holographic Tribute Dossier Editor Modal */}
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
