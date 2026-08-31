"use client";

import React, { useState, memo, useMemo } from "react";
import Image from "next/image";
import { User, AlertCircle } from "lucide-react";
import { TributeData } from "@/types/setup";
import { useSetup } from "@/lib/setup/setup-context";

interface CompactTributeFormationProps {
  tributes: TributeData[];
  onSelectTribute?: (tributeId: string) => void;
}

const CompactTributePod = memo(function CompactTributePod({
  tribute,
  indexInDistrict,
  onSelect,
}: {
  tribute: TributeData;
  indexInDistrict: number;
  onSelect?: (id: string) => void;
}) {
  const { tributeErrors } = useSetup();
  const [imgError, setImgError] = useState(false);

  const errors = tributeErrors[tribute.id] || {};
  const hasError = Boolean(errors.name) || !tribute.name.trim();
  const displayName = tribute.name.trim() || `Tribute #${indexInDistrict + 1}`;

  const isInteractive = Boolean(onSelect);

  return (
    <div
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={() => onSelect?.(tribute.id)}
      onKeyDown={(e) => {
        if (isInteractive && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onSelect?.(tribute.id);
        }
      }}
      title={`District ${tribute.district}: ${displayName}`}
      aria-label={`District ${tribute.district}: ${displayName}${hasError ? " (Incomplete)" : ""}`}
      className={`group relative flex flex-col items-center p-1 sm:p-1.5 clip-chamfer-xs bg-background/90 hover:bg-card border transition-all duration-200 select-none ${
        isInteractive ? "cursor-pointer" : "cursor-default"
      } ${
        hasError
          ? "border-destructive/70 bg-destructive/10 shadow-[0_0_10px_rgba(239,68,68,0.2)]"
          : "border-border/70 hover:border-primary/80 hover:shadow-[0_0_12px_var(--theme-glow)]"
      }`}
    >
      {/* Holographic Avatar Thumbnail */}
      <div className="relative w-full aspect-4/5 clip-chamfer-xs bg-muted/40 border border-border/70 group-hover:border-primary/60 overflow-hidden flex items-center justify-center transition-colors">
        {tribute.avatarUrl && !imgError ? (
          <Image
            src={tribute.avatarUrl}
            alt={displayName}
            fill
            sizes="(max-width: 640px) 48px, (max-width: 768px) 56px, 64px"
            className="object-cover object-top transition-transform duration-300 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-muted-foreground/45 group-hover:text-primary/70 transition-colors">
            <User className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
        )}

        {/* Hover Highlight Overlay */}
        <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

        {/* Validation Status Pip / Warning */}
        <div className="absolute top-1 right-1">
          <span
            className={`block h-1.5 w-1.5 rounded-full ${
              hasError ? "bg-destructive animate-pulse" : "bg-emerald-400 shadow-[0_0_4px_#10b981]"
            }`}
            aria-hidden="true"
          />
        </div>

        {hasError && (
          <div className="absolute bottom-0.5 right-0.5 p-0.5 bg-destructive text-destructive-foreground rounded-full">
            <AlertCircle className="h-2.5 w-2.5" />
          </div>
        )}
      </div>

      {/* Compact Tribute Name */}
      <span
        className={`mt-1 w-full text-center text-[10px] sm:text-[11px] font-mono font-medium truncate px-0.5 ${
          hasError ? "text-destructive font-bold" : "text-foreground group-hover:text-primary"
        }`}
      >
        {displayName}
      </span>
    </div>
  );
});

export function CompactTributeFormation({
  tributes,
  onSelectTribute,
}: CompactTributeFormationProps) {
  // Group tributes by district number
  const districtGroups = useMemo(() => {
    const map = new Map<number, TributeData[]>();
    for (const t of tributes) {
      const currentList = map.get(t.district) || [];
      currentList.push(t);
      map.set(t.district, currentList);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a - b);
  }, [tributes]);

  const totalDistricts = districtGroups.length;
  const tributesPerDistrict = districtGroups[0]?.[1]?.length || 2;

  // Compute responsive outer grid columns based on district count
  const outerGridClasses =
    totalDistricts <= 4
      ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3"
      : totalDistricts <= 6
      ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-2.5"
      : totalDistricts <= 12
      ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-2.5"
      : "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2";

  // Compute inner district grid layout for 2, 3, or 4 tributes
  const innerGridClasses =
    tributesPerDistrict === 2
      ? "grid grid-cols-2 gap-1.5"
      : tributesPerDistrict === 3
      ? "grid grid-cols-3 gap-1"
      : "grid grid-cols-2 sm:grid-cols-2 gap-1.5";

  return (
    <div className="w-full space-y-3">
      {/* Outer district container grid */}
      <div className={outerGridClasses}>
        {districtGroups.map(([districtNum, groupTributes]) => (
          <div
            key={`district-${districtNum}`}
            className="p-2 sm:p-2.5 clip-chamfer-xs bg-card/95 border border-border/80 hover:border-primary/50 transition-colors flex flex-col justify-between space-y-2 shadow-xs"
          >
            {/* District Header */}
            <div className="flex items-center">
              <span className="text-[10px] sm:text-[11px] font-mono font-black uppercase tracking-wider text-primary">
                District {districtNum}
              </span>
            </div>

            {/* Inner District Tributes Sub-Grid */}
            <div className={innerGridClasses}>
              {groupTributes.map((tribute, idx) => (
                <CompactTributePod
                  key={tribute.id}
                  tribute={tribute}
                  indexInDistrict={idx}
                  onSelect={onSelectTribute}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
