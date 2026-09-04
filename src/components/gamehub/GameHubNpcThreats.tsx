"use client";

import React, { useState } from "react";
import { Zap, Skull, ShieldAlert, Crosshair, Biohazard } from "lucide-react";
import { useTranslations } from "next-intl";
import { MuttClashRecord } from "@/lib/arena/use-game-hub";

interface GameHubNpcThreatsProps {
  arenaName: string;
  muttThreats: {
    encountered: MuttClashRecord[];
    catalog: Array<{ name: string; description: string }>;
  };
}

export function GameHubNpcThreats({
  arenaName,
  muttThreats,
}: GameHubNpcThreatsProps) {
  const t = useTranslations("gamehub.mutts");

  const [activeTab, setActiveTab] = useState<"encountered" | "catalog">(
    "encountered"
  );

  return (
    <div className="space-y-6">
      {/* Title & Section Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-serif font-black uppercase text-foreground">
            {t("title")}
          </h2>
          <p className="text-xs font-mono text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>

        {/* Section Tabs */}
        <div className="flex items-center gap-1.5 p-1 clip-chamfer-xs bg-muted/60 border border-border">
          <button
            type="button"
            onClick={() => setActiveTab("encountered")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 clip-chamfer-xs text-xs font-mono font-bold uppercase transition-colors cursor-pointer ${
              activeTab === "encountered"
                ? "bg-card text-foreground shadow-sm border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ShieldAlert className="h-3.5 w-3.5 text-red-400" />
            <span>{t("encounteredTab")}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("catalog")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 clip-chamfer-xs text-xs font-mono font-bold uppercase transition-colors cursor-pointer ${
              activeTab === "catalog"
                ? "bg-card text-foreground shadow-sm border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Biohazard className="h-3.5 w-3.5 text-amber-400" />
            <span>{t("catalogTab")}</span>
          </button>
        </div>
      </div>

      {/* Encountered Threats History */}
      {activeTab === "encountered" && (
        <div className="space-y-3.5">
          {muttThreats.encountered.map((rec, idx) => (
            <div
              key={idx}
              className="p-4 clip-chamfer-xs bg-card/85 border border-red-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 clip-chamfer-xs bg-red-500/15 border border-red-500/40 text-red-400 font-mono font-bold text-[9px] uppercase">
                    {rec.phaseName}
                  </span>
                  <h3 className="font-serif font-black text-sm uppercase text-foreground">
                    {rec.npcName}
                  </h3>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                  <Crosshair className="h-3 w-3 text-primary" />
                  <span>
                    {t("threatTargets")}:{" "}
                    <span className="text-foreground font-medium">
                      {rec.targetTributeNames.join(", ") || "None recorded"}
                    </span>
                  </span>
                </div>
              </div>

              {rec.casualtyCount > 0 && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 clip-chamfer-xs bg-red-500/20 text-red-300 border border-red-500/50 text-xs font-mono font-black self-start sm:self-auto">
                  <Skull className="h-3.5 w-3.5" />
                  <span>{t("lethalEncounters", { count: rec.casualtyCount })}</span>
                </div>
              )}
            </div>
          ))}

          {muttThreats.encountered.length === 0 && (
            <div className="p-8 text-center text-muted-foreground text-xs font-mono bg-card/60 clip-chamfer-md border border-border">
              {t("noMuttsEncountered")}
            </div>
          )}
        </div>
      )}

      {/* Capitol Engineered Mutts Catalog */}
      {activeTab === "catalog" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {muttThreats.catalog.map((mutt, idx) => (
            <div
              key={idx}
              className="p-4 clip-chamfer-sm bg-card/80 border border-border space-y-2 hover:border-amber-500/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-1.5 text-xs font-serif font-black uppercase text-amber-400">
                  <Biohazard className="h-4 w-4" />
                  <span>{mutt.name}</span>
                </div>

                <span className="text-[9px] font-mono uppercase text-muted-foreground">
                  CLASS IV BIO-WEAPON
                </span>
              </div>

              <p className="text-xs font-mono text-muted-foreground leading-relaxed">
                {mutt.description}
              </p>

              <div className="pt-2 border-t border-border/50 text-[10px] font-mono text-primary">
                {t("threatOrigin", { arenaName })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
