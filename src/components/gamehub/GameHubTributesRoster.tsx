"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import {
  Search,
  Users,
  Skull,
  Heart,
  Brain,
  Shield,
  Package,
  Award,
  Filter,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { EnrichedTribute } from "@/lib/arena/use-game-hub";

interface GameHubTributesRosterProps {
  tributes: EnrichedTribute[];
  isFinished: boolean;
  tributesMap: Map<string, EnrichedTribute>;
}

export function GameHubTributesRoster({
  tributes,
  isFinished,
  tributesMap,
}: GameHubTributesRosterProps) {
  const t = useTranslations("gamehub.tributes");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "alive" | "dead">("all");
  const [selectedDistrict, setSelectedDistrict] = useState<number | "all">("all");

  // Extract unique districts
  const districts = useMemo(() => {
    const set = new Set<number>();
    for (const t of tributes) {
      set.add(t.district);
    }
    return Array.from(set).sort((a, b) => a - b);
  }, [tributes]);

  // Filtered tributes
  const filteredTributes = useMemo(() => {
    return tributes.filter((tribute) => {
      // 1. Search Query filter (name or district)
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase();
        const matchesName = tribute.name.toLowerCase().includes(q);
        const matchesDistrict = `district ${tribute.district}`.includes(q);
        if (!matchesName && !matchesDistrict) return false;
      }

      // 2. Status filter
      if (statusFilter !== "all" && tribute.status !== statusFilter) {
        return false;
      }

      // 3. District filter
      if (selectedDistrict !== "all" && tribute.district !== selectedDistrict) {
        return false;
      }

      return true;
    });
  }, [tributes, searchQuery, statusFilter, selectedDistrict]);

  const livingCount = useMemo(
    () => tributes.filter((t) => t.status === "alive").length,
    [tributes]
  );
  const fallenCount = useMemo(
    () => tributes.filter((t) => t.status === "dead").length,
    [tributes]
  );

  const getConditionColor = (tag: string) => {
    switch (tag) {
      case "unscathed":
      case "resolute":
        return "text-emerald-400 border-emerald-500/40 bg-emerald-500/10";
      case "scratched":
      case "calm":
      case "composed":
      case "alert":
        return "text-blue-400 border-blue-500/40 bg-blue-500/10";
      case "bruised":
      case "anxious":
      case "shaken":
        return "text-amber-400 border-amber-500/40 bg-amber-500/10";
      case "wounded":
      case "paranoid":
      case "disturbed":
        return "text-orange-400 border-orange-500/40 bg-orange-500/10";
      case "critically_injured":
      case "delirious":
      case "manic":
      case "fatal":
      default:
        return "text-red-400 border-red-500/40 bg-red-500/10";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Description */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-serif font-black uppercase text-foreground">
            {isFinished ? t("finishedHeading") : t("title")}
          </h2>
          <p className="text-xs font-mono text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>

        {/* Filter / Search Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative min-w-[200px] sm:min-w-[240px]">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="w-full pl-8 pr-3 py-1.5 clip-chamfer-xs bg-card/80 border border-border text-xs font-mono placeholder:text-muted-foreground/60 text-foreground focus:outline-none focus:border-primary"
            />
          </div>

          {/* District Select */}
          <div className="relative">
            <select
              value={selectedDistrict}
              onChange={(e) =>
                setSelectedDistrict(
                  e.target.value === "all" ? "all" : Number(e.target.value)
                )
              }
              className="px-3 py-1.5 clip-chamfer-xs bg-card/80 border border-border text-xs font-mono text-foreground focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="all">{t("districtFilter")}</option>
              {districts.map((d) => (
                <option key={d} value={d}>
                  {t("districtFilterOption", { district: d })}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Filter Tabs for Status */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <button
          type="button"
          onClick={() => setStatusFilter("all")}
          className={`px-3 py-1 clip-chamfer-xs font-mono text-xs font-bold uppercase transition-colors cursor-pointer ${
            statusFilter === "all"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          {t("filterAll", { count: tributes.length })}
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("alive")}
          className={`inline-flex items-center gap-1.5 px-3 py-1 clip-chamfer-xs font-mono text-xs font-bold uppercase transition-colors cursor-pointer ${
            statusFilter === "alive"
              ? "bg-emerald-600 text-white"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          <Users className="h-3 w-3" />
          <span>{t("filterLiving", { count: livingCount })}</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("dead")}
          className={`inline-flex items-center gap-1.5 px-3 py-1 clip-chamfer-xs font-mono text-xs font-bold uppercase transition-colors cursor-pointer ${
            statusFilter === "dead"
              ? "bg-red-600 text-white"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          <Skull className="h-3 w-3" />
          <span>{t("filterFallen", { count: fallenCount })}</span>
        </button>
      </div>

      {/* Tributes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTributes.map((tribute) => {
          const isAlive = tribute.status === "alive";
          const alliancePartnerNames = tribute.alliancePartnerIds
            .map((id) => tributesMap.get(id)?.name)
            .filter(Boolean)
            .join(", ");

          return (
            <div
              key={tribute.id}
              className={`p-4 clip-chamfer-sm border transition-all ${
                isAlive
                  ? "bg-card/90 border-border/90 hover:border-primary/60 shadow-sm"
                  : "bg-card/40 border-border/40 opacity-75 grayscale-[20%]"
              }`}
            >
              {/* Card Top: Avatar + Name + District + Status */}
              <div className="flex items-start gap-3">
                <div className="relative shrink-0">
                  <div
                    className={`w-14 h-14 rounded-full overflow-hidden border p-0.5 ${
                      isAlive
                        ? "border-primary/60 bg-primary/10"
                        : "border-border bg-muted"
                    }`}
                  >
                    {tribute.avatarUrl ? (
                      <Image
                        src={tribute.avatarUrl}
                        alt={tribute.name}
                        width={56}
                        height={56}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-mono font-bold text-xs text-muted-foreground">
                        D{tribute.district}
                      </div>
                    )}
                  </div>

                  {/* Placement or Status Badge */}
                  {tribute.placement && (
                    <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-black uppercase bg-card border border-border shadow">
                      #{tribute.placement}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-mono uppercase font-bold text-primary truncate">
                      {t("card.district", { district: tribute.district })}
                    </span>

                    <span
                      className={`px-1.5 py-0.2 clip-chamfer-xs text-[9px] font-mono font-bold uppercase ${
                        isAlive
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/40"
                          : "bg-red-500/15 text-red-400 border border-red-500/40"
                      }`}
                    >
                      {isAlive ? t("card.alive") : t("card.fallen")}
                    </span>
                  </div>

                  <h3 className="text-sm font-serif font-bold uppercase text-foreground truncate mt-0.5">
                    {tribute.name}
                  </h3>

                  <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Skull className="h-3 w-3 text-red-400" />
                      {t("card.kills", { count: tribute.killCount })}
                    </span>

                    {alliancePartnerNames && (
                      <span className="inline-flex items-center gap-1 text-primary truncate">
                        <Shield className="h-3 w-3 shrink-0" />
                        <span className="truncate">{alliancePartnerNames}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Detailed Biometrics (Especially for Running Game) */}
              <div className="mt-4 pt-3 border-t border-border/60 space-y-2">
                {/* Survival Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Heart className="h-3 w-3 text-emerald-400" />
                      {t("card.survival")}
                    </span>
                    <span className="font-bold text-foreground">
                      {tribute.biometrics.survival}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-muted overflow-hidden clip-chamfer-xs">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${tribute.biometrics.survival}%` }}
                    />
                  </div>
                </div>

                {/* Sanity Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Brain className="h-3 w-3 text-blue-400" />
                      {t("card.sanity")}
                    </span>
                    <span className="font-bold text-foreground">
                      {tribute.biometrics.sanity}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-muted overflow-hidden clip-chamfer-xs">
                    <div
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${tribute.biometrics.sanity}%` }}
                    />
                  </div>
                </div>

                {/* Condition Pills */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span
                    className={`px-1.5 py-0.5 clip-chamfer-xs text-[9px] font-mono font-bold uppercase border ${getConditionColor(
                      tribute.biometrics.physicalTag
                    )}`}
                  >
                    {tribute.biometrics.physicalTag}
                  </span>

                  <span
                    className={`px-1.5 py-0.5 clip-chamfer-xs text-[9px] font-mono font-bold uppercase border ${getConditionColor(
                      tribute.biometrics.mentalTag
                    )}`}
                  >
                    {tribute.biometrics.mentalTag}
                  </span>
                </div>

                {/* Inventory Preview */}
                <div className="pt-2 flex items-center justify-between text-[10px] font-mono text-muted-foreground border-t border-border/40">
                  <span className="inline-flex items-center gap-1">
                    <Package className="h-3 w-3" />
                    {t("card.inventory")} ({tribute.inventory.length})
                  </span>

                  <span className="truncate max-w-[150px] text-foreground font-medium">
                    {tribute.inventory.length > 0
                      ? tribute.inventory
                          .map((i) => (typeof i === "string" ? i : i.name))
                          .slice(0, 2)
                          .join(", ") +
                        (tribute.inventory.length > 2 ? "..." : "")
                      : t("card.emptyInventory")}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredTributes.length === 0 && (
        <div className="p-8 clip-chamfer-md bg-card/60 border border-border text-center space-y-2">
          <p className="text-sm font-mono text-muted-foreground">
            {t("noTributesFound")}
          </p>
        </div>
      )}
    </div>
  );
}
