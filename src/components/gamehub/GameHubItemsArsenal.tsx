"use client";

import React, { useState } from "react";
import {
  Package,
  Shield,
  Sword,
  HeartPulse,
  Apple,
  Wrench,
  Sparkles,
  History,
  Archive,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { EngineItem, ItemCategory, ItemTier } from "@/lib/engine/items/types";
import { EnrichedTribute, HistoricalItemMovement } from "@/lib/arena/use-game-hub";

interface GameHubItemsArsenalProps {
  arenaItems: {
    activeLoadouts: Array<{
      item: EngineItem | string;
      heldBy: EnrichedTribute;
    }>;
    history: HistoricalItemMovement[];
    thematicCache: EngineItem[];
  };
}

export function GameHubItemsArsenal({ arenaItems }: GameHubItemsArsenalProps) {
  const t = useTranslations("gamehub.items");

  const [activeTab, setActiveTab] = useState<"active" | "history" | "cache">(
    "active"
  );

  const getItemCategoryIcon = (cat?: string) => {
    switch (cat?.toLowerCase()) {
      case "weapon":
        return <Sword className="h-3.5 w-3.5 text-red-400" />;
      case "armor":
        return <Shield className="h-3.5 w-3.5 text-blue-400" />;
      case "medical":
        return <HeartPulse className="h-3.5 w-3.5 text-emerald-400" />;
      case "sustenance":
        return <Apple className="h-3.5 w-3.5 text-amber-400" />;
      case "tool":
      default:
        return <Wrench className="h-3.5 w-3.5 text-purple-400" />;
    }
  };

  const getItemTierBadge = (tier?: string) => {
    switch (tier?.toLowerCase()) {
      case "legendary":
        return "border-amber-400 bg-amber-500/15 text-amber-300";
      case "rare":
        return "border-purple-400 bg-purple-500/15 text-purple-300";
      case "uncommon":
        return "border-blue-400 bg-blue-500/15 text-blue-300";
      case "common":
      default:
        return "border-border bg-muted/60 text-muted-foreground";
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "gained":
        return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
      case "lost":
      case "stolen":
        return "text-amber-400 bg-amber-500/10 border-amber-500/30";
      case "destroyed":
      default:
        return "text-red-400 bg-red-500/10 border-red-500/30";
    }
  };

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
            onClick={() => setActiveTab("active")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 clip-chamfer-xs text-xs font-mono font-bold uppercase transition-colors cursor-pointer ${
              activeTab === "active"
                ? "bg-card text-foreground shadow-sm border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Package className="h-3.5 w-3.5 text-primary" />
            <span>{t("activeTab")}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 clip-chamfer-xs text-xs font-mono font-bold uppercase transition-colors cursor-pointer ${
              activeTab === "history"
                ? "bg-card text-foreground shadow-sm border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <History className="h-3.5 w-3.5 text-blue-400" />
            <span>{t("historyTab")}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("cache")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 clip-chamfer-xs text-xs font-mono font-bold uppercase transition-colors cursor-pointer ${
              activeTab === "cache"
                ? "bg-card text-foreground shadow-sm border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Archive className="h-3.5 w-3.5 text-amber-400" />
            <span>{t("cacheTab")}</span>
          </button>
        </div>
      </div>

      {/* Active Tribute Loadouts */}
      {activeTab === "active" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {arenaItems.activeLoadouts.map((entry, idx) => {
            const itemName =
              typeof entry.item === "string" ? entry.item : entry.item.name;
            const category =
              typeof entry.item === "string" ? undefined : entry.item.category;
            const tier =
              typeof entry.item === "string" ? "common" : entry.item.tier || "common";

            return (
              <div
                key={idx}
                className="p-4 clip-chamfer-xs bg-card/85 border border-border flex flex-col justify-between gap-3 shadow-sm hover:border-primary/50 transition-colors"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 clip-chamfer-xs border text-[9px] font-mono font-bold uppercase ${getItemTierBadge(
                        tier
                      )}`}
                    >
                      {getItemCategoryIcon(category)}
                      <span>{tier}</span>
                    </span>

                    <span className="text-[10px] font-mono text-primary font-bold">
                      {t("districtLabel", { district: entry.heldBy.district })}
                    </span>
                  </div>

                  <h3 className="text-sm font-serif font-bold uppercase text-foreground leading-snug">
                    {itemName}
                  </h3>
                </div>

                <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                  <span>{t("heldBy", { name: entry.heldBy.name })}</span>
                  <span className="text-emerald-400 font-bold uppercase text-[10px]">
                    IN HAND
                  </span>
                </div>
              </div>
            );
          })}

          {arenaItems.activeLoadouts.length === 0 && (
            <div className="col-span-full p-8 text-center text-muted-foreground text-xs font-mono bg-card/60 clip-chamfer-md border border-border">
              {t("noItems")}
            </div>
          )}
        </div>
      )}

      {/* Historical Loot & Clash Movements */}
      {activeTab === "history" && (
        <div className="border border-border/80 clip-chamfer-sm overflow-hidden bg-card/85">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-muted/70 border-b border-border text-muted-foreground font-bold uppercase">
              <tr>
                <th className="py-2.5 px-4">Event Phase</th>
                <th className="py-2.5 px-4">Action</th>
                <th className="py-2.5 px-4">Item Name</th>
                <th className="py-2.5 px-4">Tribute</th>
                <th className="py-2.5 px-4">District</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {arenaItems.history.map((h) => (
                <tr key={h.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-2.5 px-4 font-medium text-foreground">
                    {h.phaseName}
                  </td>
                  <td className="py-2.5 px-4">
                    <span
                      className={`px-2 py-0.5 clip-chamfer-xs text-[9px] font-bold uppercase border ${getActionColor(
                        h.action
                      )}`}
                    >
                      {h.action}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 font-serif font-bold text-foreground">
                    {h.itemName}
                  </td>
                  <td className="py-2.5 px-4 text-muted-foreground">
                    {h.tributeName}
                  </td>
                  <td className="py-2.5 px-4 text-muted-foreground">
                    District {h.district}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {arenaItems.history.length === 0 && (
            <div className="p-8 text-center text-muted-foreground text-xs font-mono">
              {t("noItems")}
            </div>
          )}
        </div>
      )}

      {/* Arena Thematic Arsenal Cache */}
      {activeTab === "cache" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {arenaItems.thematicCache.map((item) => (
            <div
              key={item.id}
              className="p-3.5 clip-chamfer-xs bg-card/80 border border-border space-y-2 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 clip-chamfer-xs border text-[9px] font-mono font-bold uppercase ${getItemTierBadge(
                    item.tier
                  )}`}
                >
                  {getItemCategoryIcon(item.category)}
                  <span>{item.tier}</span>
                </span>

                <span className="text-[9px] font-mono uppercase text-muted-foreground">
                  {item.category}
                </span>
              </div>

              <h4 className="text-xs font-serif font-bold uppercase text-foreground leading-snug">
                {item.name}
              </h4>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
