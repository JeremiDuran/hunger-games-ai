"use client";

import React, { useState, memo } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  User,
  AlertCircle,
  Edit3,
  Sparkles,
} from "lucide-react";
import { TributeData, TributeGender } from "@/types/setup";
import { useSetup } from "@/lib/setup/setup-context";

interface TributeCardProps {
  tribute: TributeData;
  indexInDistrict: number;
  onEdit: (tributeId: string) => void;
}

const GENDER_LABEL_KEYS: Record<TributeGender, string> = {
  female: "genderFemale",
  male: "genderMale",
  non_binary: "genderNonBinary",
  unspecified: "genderUnspecified",
};

export const TributeCard = memo(function TributeCard({
  tribute,
  indexInDistrict,
  onEdit,
}: TributeCardProps) {
  const t = useTranslations("setup.tributes");
  const { tributeErrors, tributesTouched } = useSetup();
  const [imageError, setImageError] = useState(false);

  const errors = tributeErrors[tribute.id] || {};
  const isTouched = tributesTouched[tribute.id] || false;
  const hasNameError = (isTouched || tribute.name.length > 0) && Boolean(errors.name);
  const isNameEmpty = !tribute.name.trim();
  const hasLore = Boolean(tribute.personality.trim() || tribute.physicalAspect.trim());

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onEdit(tribute.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onEdit(tribute.id);
        }
      }}
      aria-label={`${t("editTribute")}: ${tribute.name || t("unnamedTribute")}, District ${tribute.district} Slot ${indexInDistrict}`}
      className={`group relative p-4 clip-chamfer-md bg-card/85 backdrop-blur-sm border transition-all duration-300 cursor-pointer flex flex-col justify-between select-none ${
        hasNameError || (isTouched && isNameEmpty)
          ? "border-red-500/80 shadow-[0_0_15px_rgba(239,68,68,0.25)] bg-red-950/10"
          : "border-border/80 hover:border-primary/80 hover:shadow-[0_0_20px_var(--theme-glow)] hover:bg-card/95"
      }`}
    >
      {/* Corner Capitol Accent Marker */}
      <div className="absolute top-0 right-0 w-3 h-3 bg-primary/30 group-hover:bg-primary/70 transition-colors clip-chamfer-xs pointer-events-none" />

      {/* Top Meta Bar */}
      <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-border/50">
        <div className="flex items-center gap-1.5">
          <span
            className={`h-2 w-2 rounded-full ${
              hasNameError || (isTouched && isNameEmpty)
                ? "bg-red-500 animate-pulse"
                : "bg-primary group-hover:shadow-[0_0_8px_var(--theme-glow)]"
            }`}
            aria-hidden="true"
          />
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
            {t("districtSlot", { district: tribute.district, slot: indexInDistrict })}
          </span>
        </div>

        {/* Validation Warning or Lore Indicator */}
        <div className="flex items-center gap-1">
          {hasNameError ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-red-400 bg-red-500/10 px-1.5 py-0.5 clip-chamfer-xs border border-red-500/30">
              <AlertCircle className="h-3 w-3 shrink-0" />
              <span>INVALID</span>
            </span>
          ) : hasLore ? (
            <span className="inline-flex items-center gap-1 text-[9px] font-mono text-primary/80 bg-primary/10 px-1.5 py-0.5 clip-chamfer-xs border border-primary/20">
              <Sparkles className="h-2.5 w-2.5 shrink-0" />
              <span>{t("loreConfigured")}</span>
            </span>
          ) : null}
        </div>
      </div>

      {/* Main Identity Layout: Portrait + Details */}
      <div className="flex items-center gap-3.5">
        {/* Holographic Portrait Thumbnail */}
        <div className="relative shrink-0 w-16 h-20 sm:w-18 sm:h-22 clip-chamfer-xs bg-background/90 border border-border group-hover:border-primary/50 overflow-hidden flex items-center justify-center shadow-inner transition-colors">
          {tribute.avatarUrl && !imageError ? (
            <Image
              src={tribute.avatarUrl}
              alt={tribute.name || "Tribute Portrait"}
              fill
              sizes="72px"
              className="object-cover object-top transition-transform duration-300 group-hover:scale-105"
              onError={() => setImageError(true)}
              unoptimized
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-1 text-center text-muted-foreground/50">
              <User className="h-7 w-7 text-primary/30 group-hover:text-primary/60 transition-colors" />
              <span className="text-[8px] font-mono uppercase tracking-tight mt-0.5">
                {t("noPortrait")}
              </span>
            </div>
          )}
        </div>

        {/* Name and Tags */}
        <div className="flex-1 min-w-0 space-y-1.5">
          {/* Tribute Name */}
          <div>
            <h4
              className={`font-mono font-bold text-sm tracking-wide truncate ${
                isNameEmpty
                  ? "text-muted-foreground/60 italic text-xs"
                  : "text-foreground group-hover:text-primary transition-colors"
              }`}
            >
              {tribute.name.trim() || t("unnamedTribute")}
            </h4>
          </div>

          {/* Badges: Gender + District */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-block text-[10px] font-mono font-semibold px-2 py-0.5 clip-chamfer-xs bg-muted/40 text-muted-foreground border border-border group-hover:border-border/80">
              {t(GENDER_LABEL_KEYS[tribute.gender])}
            </span>

            <span className="inline-block text-[10px] font-mono text-muted-foreground/70">
              D{tribute.district}
            </span>
          </div>

          {/* Backstory snippet / Lore preview if exists */}
          {tribute.personality ? (
            <p className="text-[11px] font-mono text-muted-foreground line-clamp-1 italic">
              &quot;{tribute.personality}&quot;
            </p>
          ) : tribute.physicalAspect ? (
            <p className="text-[11px] font-mono text-muted-foreground line-clamp-1">
              {tribute.physicalAspect}
            </p>
          ) : null}
        </div>
      </div>

      {/* Bottom CTA Action Strip */}
      <div className="mt-3 pt-2.5 border-t border-border/40 flex items-center justify-between">
        <span className="text-[10px] font-mono text-muted-foreground group-hover:text-foreground transition-colors">
          {t("clickToEdit")}
        </span>

        <span className="inline-flex items-center gap-1 px-2 py-1 clip-chamfer-xs bg-primary/10 group-hover:bg-primary text-primary group-hover:text-primary-foreground font-mono font-bold text-[10px] uppercase tracking-wider border border-primary/30 group-hover:border-primary transition-all duration-200">
          <Edit3 className="h-3 w-3" />
          <span>{t("editDossier")}</span>
        </span>
      </div>
    </div>
  );
});
