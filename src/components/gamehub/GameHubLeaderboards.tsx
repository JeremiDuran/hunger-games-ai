"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Trophy, Skull, Heart, Brain, Package, Swords, Medal } from "lucide-react";
import { useTranslations } from "next-intl";
import { LeaderboardEntry } from "@/lib/arena/use-game-hub";

interface GameHubLeaderboardsProps {
  leaderboards: {
    kills: LeaderboardEntry[];
    survival: LeaderboardEntry[];
    sanity: LeaderboardEntry[];
    scavenger: LeaderboardEntry[];
    combat: LeaderboardEntry[];
  };
}

export function GameHubLeaderboards({
  leaderboards,
}: GameHubLeaderboardsProps) {
  const t = useTranslations("gamehub.leaderboards");

  const [activeCategory, setActiveCategory] = useState<
    "kills" | "survival" | "sanity" | "scavenger" | "combat"
  >("kills");

  const currentList = leaderboards[activeCategory] || [];
  const topThree = currentList.slice(0, 3);
  const remaining = currentList.slice(3);

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "kills":
        return <Skull className="h-4 w-4 text-red-400" />;
      case "survival":
        return <Heart className="h-4 w-4 text-emerald-400" />;
      case "sanity":
        return <Brain className="h-4 w-4 text-blue-400" />;
      case "scavenger":
        return <Package className="h-4 w-4 text-amber-400" />;
      case "combat":
      default:
        return <Swords className="h-4 w-4 text-purple-400" />;
    }
  };

  const getPodiumBadge = (rank: number) => {
    if (rank === 1) {
      return {
        label: "1ST",
        color: "border-amber-400 bg-amber-500/15 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.25)]",
        icon: <Trophy className="h-5 w-5 text-amber-400" />,
      };
    }
    if (rank === 2) {
      return {
        label: "2ND",
        color: "border-slate-300 bg-slate-400/15 text-slate-200 shadow-[0_0_12px_rgba(203,213,225,0.2)]",
        icon: <Medal className="h-5 w-5 text-slate-300" />,
      };
    }
    return {
      label: "3RD",
      color: "border-amber-700 bg-amber-800/20 text-amber-600 shadow-[0_0_10px_rgba(180,83,9,0.15)]",
      icon: <Medal className="h-5 w-5 text-amber-700" />,
    };
  };

  return (
    <div className="space-y-6">
      {/* Title & Category Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-serif font-black uppercase text-foreground">
            {t("title")}
          </h2>
          <p className="text-xs font-mono text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>

        {/* Category Switchers */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 clip-chamfer-xs bg-muted/60 border border-border">
          <button
            type="button"
            onClick={() => setActiveCategory("kills")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 clip-chamfer-xs text-xs font-mono font-bold uppercase transition-colors cursor-pointer ${
              activeCategory === "kills"
                ? "bg-card text-foreground shadow-sm border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Skull className="h-3.5 w-3.5 text-red-400" />
            <span>{t("tabKills")}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory("survival")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 clip-chamfer-xs text-xs font-mono font-bold uppercase transition-colors cursor-pointer ${
              activeCategory === "survival"
                ? "bg-card text-foreground shadow-sm border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Heart className="h-3.5 w-3.5 text-emerald-400" />
            <span>{t("tabSurvival")}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory("sanity")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 clip-chamfer-xs text-xs font-mono font-bold uppercase transition-colors cursor-pointer ${
              activeCategory === "sanity"
                ? "bg-card text-foreground shadow-sm border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Brain className="h-3.5 w-3.5 text-blue-400" />
            <span>{t("tabSanity")}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory("scavenger")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 clip-chamfer-xs text-xs font-mono font-bold uppercase transition-colors cursor-pointer ${
              activeCategory === "scavenger"
                ? "bg-card text-foreground shadow-sm border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Package className="h-3.5 w-3.5 text-amber-400" />
            <span>{t("tabScavenger")}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory("combat")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 clip-chamfer-xs text-xs font-mono font-bold uppercase transition-colors cursor-pointer ${
              activeCategory === "combat"
                ? "bg-card text-foreground shadow-sm border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Swords className="h-3.5 w-3.5 text-purple-400" />
            <span>{t("tabCombat")}</span>
          </button>
        </div>
      </div>

      {/* Top 3 Podium Cards */}
      {topThree.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {topThree.map((entry) => {
            const podium = getPodiumBadge(entry.rank);
            const isAlive = entry.tribute.status === "alive";

            return (
              <div
                key={entry.tribute.id}
                className={`p-5 clip-chamfer-md border relative overflow-hidden flex flex-col items-center text-center space-y-3 ${podium.color}`}
              >
                <div className="flex items-center gap-2">
                  {podium.icon}
                  <span className="font-mono font-black text-sm tracking-wider">
                    {podium.label} PLACE
                  </span>
                </div>

                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-current p-0.5 bg-background">
                  {entry.tribute.avatarUrl ? (
                    <Image
                      src={entry.tribute.avatarUrl}
                      alt={entry.tribute.name}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-mono font-bold text-sm text-muted-foreground">
                      D{entry.tribute.district}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-base font-serif font-black uppercase text-foreground leading-tight">
                    {entry.tribute.name}
                  </h3>
                  <span className="text-[11px] font-mono text-muted-foreground">
                    District {entry.tribute.district} •{" "}
                    {isAlive ? "ALIVE" : "FALLEN"}
                  </span>
                </div>

                <div className="px-3 py-1 clip-chamfer-xs bg-background/90 border border-current/40 text-sm font-mono font-black text-foreground">
                  {entry.formattedScore}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full Rankings Table */}
      <div className="border border-border/80 clip-chamfer-sm overflow-hidden bg-card/85">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-muted/70 border-b border-border text-muted-foreground font-bold uppercase">
            <tr>
              <th className="py-2.5 px-4 w-16 text-center">{t("rank")}</th>
              <th className="py-2.5 px-4">{t("tribute")}</th>
              <th className="py-2.5 px-4 w-28">{t("district")}</th>
              <th className="py-2.5 px-4 w-28">{t("status")}</th>
              <th className="py-2.5 px-4 w-36 text-right">{t("score")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {remaining.map((entry) => {
              const isAlive = entry.tribute.status === "alive";

              return (
                <tr
                  key={entry.tribute.id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <td className="py-2.5 px-4 text-center font-bold text-muted-foreground">
                    #{entry.rank}
                  </td>
                  <td className="py-2.5 px-4 font-serif font-bold uppercase text-foreground">
                    {entry.tribute.name}
                  </td>
                  <td className="py-2.5 px-4 text-muted-foreground">
                    District {entry.tribute.district}
                  </td>
                  <td className="py-2.5 px-4">
                    <span
                      className={`px-2 py-0.5 clip-chamfer-xs text-[9px] font-bold uppercase ${
                        isAlive
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/40"
                          : "bg-red-500/15 text-red-400 border border-red-500/40"
                      }`}
                    >
                      {isAlive ? "ALIVE" : "FALLEN"}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right font-black text-primary">
                    {entry.formattedScore}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {currentList.length === 0 && (
          <div className="p-8 text-center text-muted-foreground text-xs font-mono">
            {t("empty")}
          </div>
        )}
      </div>
    </div>
  );
}
