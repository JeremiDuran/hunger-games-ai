"use client";

import React from "react";
import { Users, Shield, ShieldAlert, HeartCrack, Flame, Crosshair } from "lucide-react";
import { useTranslations } from "next-intl";
import { AllianceIntelEntry, DistrictSummary } from "@/lib/arena/use-game-hub";

interface GameHubAlliancesIntelProps {
  alliances: AllianceIntelEntry[];
  districtSummaries: DistrictSummary[];
}

export function GameHubAlliancesIntel({
  alliances,
  districtSummaries,
}: GameHubAlliancesIntelProps) {
  const t = useTranslations("gamehub.alliances");

  const activeAlliances = alliances.filter((a) => a.status === "active");
  const inactiveAlliances = alliances.filter((a) => a.status !== "active");

  const getAllianceBadge = (status: string) => {
    switch (status) {
      case "active":
        return {
          label: t("statusActive"),
          icon: <Shield className="h-3 w-3 text-emerald-400" />,
          color: "bg-emerald-500/15 border-emerald-500/40 text-emerald-300",
        };
      case "betrayed":
        return {
          label: t("statusBetrayed"),
          icon: <HeartCrack className="h-3 w-3 text-red-400" />,
          color: "bg-red-500/15 border-red-500/40 text-red-300",
        };
      case "dissolved":
      default:
        return {
          label: t("statusDissolved"),
          icon: <ShieldAlert className="h-3 w-3 text-muted-foreground" />,
          color: "bg-muted border-border text-muted-foreground",
        };
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Alliances Pacts & Betrayals */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-serif font-black uppercase text-foreground">
            {t("title")}
          </h2>
          <p className="text-xs font-mono text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {alliances.map((alliance) => {
            const badge = getAllianceBadge(alliance.status);
            const memberNames = alliance.memberTributes
              .map((m) => `${m.name} (D${m.district})`)
              .join(", ");

            return (
              <div
                key={alliance.id}
                className="p-4 clip-chamfer-xs bg-card/85 border border-border space-y-3 shadow-sm hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 clip-chamfer-xs border text-[10px] font-mono font-bold uppercase ${badge.color}`}
                  >
                    {badge.icon}
                    <span>{badge.label}</span>
                  </div>

                  <span className="text-[10px] font-mono text-muted-foreground">
                    {t("formedIn", { phase: alliance.formedPhaseName })}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-mono text-muted-foreground block">
                    {t("members", { names: memberNames || "Classified" })}
                  </span>

                  {alliance.dissolvedPhaseName && (
                    <span className="text-[11px] font-mono text-muted-foreground block">
                      {t("dissolvedIn", { phase: alliance.dissolvedPhaseName })}
                    </span>
                  )}

                  {alliance.betrayedByTributeName && (
                    <div className="p-2 clip-chamfer-xs bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono font-bold flex items-center gap-1.5">
                      <HeartCrack className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        {t("betrayedBy", {
                          name: alliance.betrayedByTributeName,
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {alliances.length === 0 && (
            <div className="col-span-full p-8 text-center text-muted-foreground text-xs font-mono bg-card/60 clip-chamfer-md border border-border">
              {t("noAlliances")}
            </div>
          )}
        </div>
      </div>

      {/* 2. District Survival & Casualty Telemetry */}
      <div className="space-y-4 pt-4 border-t border-border/80">
        <div>
          <h3 className="text-lg sm:text-xl font-serif font-black uppercase text-foreground">
            {t("districtStanding")}
          </h3>
          <p className="text-xs font-mono text-muted-foreground">
            Real-time attrition rates and total confirmed kills by district
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {districtSummaries.map((dist) => {
            const survivalRate =
              dist.total > 0 ? (dist.alive / dist.total) * 100 : 0;

            return (
              <div
                key={dist.district}
                className={`p-3.5 clip-chamfer-xs border transition-colors ${
                  dist.isEliminated
                    ? "bg-card/40 border-border/40 opacity-70"
                    : "bg-card/85 border-border hover:border-primary/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-serif font-black text-sm uppercase text-foreground">
                    District {dist.district}
                  </span>

                  <span
                    className={`px-1.5 py-0.5 clip-chamfer-xs text-[9px] font-mono font-bold uppercase ${
                      dist.isEliminated
                        ? "bg-red-500/15 text-red-400 border border-red-500/30"
                        : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                    }`}
                  >
                    {dist.isEliminated
                      ? t("districtEliminated")
                      : t("districtActive")}
                  </span>
                </div>

                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-muted-foreground">
                      {t("livingOutOf", {
                        alive: dist.alive,
                        total: dist.total,
                      })}
                    </span>
                    <span className="text-primary font-bold">
                      {dist.totalKills} Kills
                    </span>
                  </div>

                  <div className="h-1.5 w-full bg-muted overflow-hidden clip-chamfer-xs">
                    <div
                      className={`h-full transition-all duration-300 ${
                        dist.isEliminated ? "bg-red-500" : "bg-emerald-500"
                      }`}
                      style={{ width: `${survivalRate}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
