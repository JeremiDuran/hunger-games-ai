"use client";

import React, { useState, memo } from "react";
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
  index,
  onSelect,
}: {
  tribute: TributeData;
  index: number;
  onSelect?: (id: string) => void;
}) {
  const { tributeErrors } = useSetup();
  const [imgError, setImgError] = useState(false);

  const errors = tributeErrors[tribute.id] || {};
  const hasError = Boolean(errors.name) || !tribute.name.trim();
  const displayName = tribute.name.trim() || `Tribute ${index + 1}`;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect?.(tribute.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect?.(tribute.id);
        }
      }}
      title={`District ${tribute.district}: ${displayName}`}
      aria-label={`District ${tribute.district}: ${displayName}${hasError ? " (Incomplete)" : ""}`}
      className={`group relative flex flex-col items-center p-1.5 sm:p-2 clip-chamfer-xs bg-card/80 hover:bg-card/95 border transition-all duration-200 cursor-pointer select-none ${
        hasError
          ? "border-destructive/70 bg-destructive/10 shadow-[0_0_10px_rgba(239,68,68,0.2)]"
          : "border-border/70 hover:border-primary/80 hover:shadow-[0_0_15px_var(--theme-glow)]"
      }`}
    >
      {/* Top District Tag & Status Pip */}
      <div className="w-full flex items-center justify-between gap-1 mb-1 px-0.5">
        <span className="text-[9px] sm:text-[10px] font-mono font-bold text-primary tracking-tighter">
          D{tribute.district}
        </span>
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            hasError ? "bg-destructive animate-pulse" : "bg-emerald-400"
          }`}
          aria-hidden="true"
        />
      </div>

      {/* Holographic Avatar Thumbnail */}
      <div className="relative w-12 h-14 sm:w-14 sm:h-16 md:w-16 md:h-18 clip-chamfer-xs bg-background/90 border border-border/80 group-hover:border-primary/60 overflow-hidden flex items-center justify-center transition-colors">
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
          <div className="flex flex-col items-center justify-center text-muted-foreground/50 group-hover:text-primary/70 transition-colors">
            <User className="h-6 w-6 sm:h-7 sm:w-7" />
          </div>
        )}

        {/* Hover Highlight Overlay */}
        <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

        {/* Error Warning Badge */}
        {hasError && (
          <div className="absolute bottom-0.5 right-0.5 p-0.5 bg-destructive text-destructive-foreground rounded-full">
            <AlertCircle className="h-2.5 w-2.5" />
          </div>
        )}
      </div>

      {/* Compact Tribute Name */}
      <span
        className={`mt-1.5 w-full text-center text-[10px] sm:text-[11px] font-mono font-medium truncate px-0.5 ${
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
  const count = tributes.length;

  // Compute dynamic grid layout classes based on roster capacity
  const gridClasses =
    count <= 16
      ? "grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 sm:gap-2.5"
      : count <= 24
      ? "grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-1.5 sm:gap-2"
      : "grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 xl:grid-cols-12 gap-1.5 sm:gap-2";

  return (
    <div className="w-full space-y-3">
      {/* Dynamic formation grid */}
      <div className={gridClasses}>
        {tributes.map((tribute, idx) => (
          <CompactTributePod
            key={tribute.id}
            tribute={tribute}
            index={idx}
            onSelect={onSelectTribute}
          />
        ))}
      </div>
    </div>
  );
}
