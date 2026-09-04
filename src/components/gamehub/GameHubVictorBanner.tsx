"use client";

import React from "react";
import Image from "next/image";
import { Award, Trophy, Skull, Calendar, Heart, Brain, Package } from "lucide-react";
import { useTranslations } from "next-intl";
import { EnrichedTribute } from "@/lib/arena/use-game-hub";

interface GameHubVictorBannerProps {
  victor: EnrichedTribute;
  daysEndured: number;
}

export function GameHubVictorBanner({
  victor,
  daysEndured,
}: GameHubVictorBannerProps) {
  const t = useTranslations("gamehub.victorBanner");

  return (
    <section
      aria-label={t("heading")}
      className="w-full relative overflow-hidden clip-chamfer-md border-2 border-amber-500/60 bg-gradient-to-br from-amber-950/40 via-card/95 to-amber-900/20 p-5 sm:p-7 shadow-[0_0_30px_rgba(245,158,11,0.15)]"
    >
      {/* Background Gold Ambient Glow */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6">
        {/* Left: Victor Avatar with Gold Laurel Border */}
        <div className="relative shrink-0">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 border-amber-400 p-1 bg-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.3)] flex items-center justify-center">
            {victor.avatarUrl ? (
              <Image
                src={victor.avatarUrl}
                alt={victor.name}
                width={112}
                height={112}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <Trophy className="h-12 w-12 text-amber-400" />
            )}
          </div>

          {/* Gold Laurel Icon Badge */}
          <div className="absolute -bottom-2 -right-1 bg-amber-500 text-amber-950 p-1.5 rounded-full border border-amber-300 shadow-md">
            <Award className="h-4 w-4" />
          </div>
        </div>

        {/* Center: Victor Names, Proclamation & Lore */}
        <div className="flex-1 text-center md:text-left space-y-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 clip-chamfer-xs bg-amber-500/20 text-amber-300 border border-amber-400/50 text-[10px] font-mono font-bold uppercase tracking-widest">
              <Trophy className="h-3 w-3" />
              <span>{t("heading")}</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-serif font-black tracking-wide uppercase text-foreground">
              {victor.name}
            </h2>

            <p className="text-xs sm:text-sm font-mono text-amber-400/90 font-semibold tracking-wide">
              {t("district", { district: victor.district })} • {t("victorOf")}
            </p>
          </div>

          <p className="text-xs font-mono text-muted-foreground max-w-2xl leading-relaxed">
            {victor.personality
              ? `"${victor.personality}"`
              : t("subtitle")}
          </p>

          {/* Quick Metrics Pills */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 clip-chamfer-xs bg-background/80 border border-border text-xs font-mono">
              <Skull className="h-3.5 w-3.5 text-red-400" />
              <span className="font-bold text-foreground">
                {t("kills", { count: victor.killCount })}
              </span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 clip-chamfer-xs bg-background/80 border border-border text-xs font-mono">
              <Calendar className="h-3.5 w-3.5 text-amber-400" />
              <span className="font-bold text-foreground">
                {t("days", { count: Math.max(1, daysEndured) })}
              </span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 clip-chamfer-xs bg-background/80 border border-border text-xs font-mono">
              <Heart className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-muted-foreground">{t("health")}:</span>
              <span className="font-bold text-emerald-400">
                {victor.biometrics.survival}%
              </span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 clip-chamfer-xs bg-background/80 border border-border text-xs font-mono">
              <Brain className="h-3.5 w-3.5 text-blue-400" />
              <span className="text-muted-foreground">{t("sanity")}:</span>
              <span className="font-bold text-blue-400">
                {victor.biometrics.sanity}%
              </span>
            </div>
          </div>
        </div>

        {/* Right: Final Loadout Manifest */}
        <div className="w-full md:w-56 shrink-0 p-3.5 clip-chamfer-xs bg-background/70 border border-amber-500/30 space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase text-amber-400">
            <Package className="h-3.5 w-3.5" />
            <span>{t("inventory")}</span>
          </div>

          <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
            {victor.inventory.length > 0 ? (
              victor.inventory.map((item, idx) => {
                const itemName = typeof item === "string" ? item : item.name;
                return (
                  <div
                    key={idx}
                    className="text-[11px] font-mono px-2 py-1 clip-chamfer-xs bg-card border border-border/80 text-foreground truncate"
                    title={itemName}
                  >
                    • {itemName}
                  </div>
                );
              })
            ) : (
              <p className="text-[10px] font-mono text-muted-foreground italic">
                {t("emptyInventory")}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
