"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Tables } from "@/types/database";
import { parseDbTributeStats, parseDbInventory } from "@/lib/engine/adapters";
import { EngineItem, ItemCategory, ItemTier } from "@/lib/engine/items/types";
import { createPRNG } from "@/lib/engine/prng";
import { synthesizeItem } from "@/lib/engine/items/synthesizer";
import {
  synthesizeNpcBatchFromDescription,
} from "@/lib/engine/thematics/npc-generator";
import { TributeBiometrics } from "@/lib/engine/types";

export type GameDbRow = Tables<"games">;
export type TributeDbRow = Tables<"tributes">;
export type GameAllianceDbRow = Tables<"game_alliances">;
export type GamePhaseDbRow = Tables<"game_phases"> & {
  game_phase_events?: Tables<"game_phase_events">[];
};
export type GameEventDbRow = Tables<"game_phase_events">;

export interface EnrichedTribute {
  id: string;
  name: string;
  district: number;
  gender: string;
  avatarUrl: string | null;
  status: "alive" | "dead";
  killCount: number;
  placement: number | null;
  deathPhaseId: string | null;
  personality: string;
  physicalAspect: string;
  biometrics: TributeBiometrics;
  inventory: (EngineItem | string)[];
  alliancePartnerIds: string[];
}

export interface EnrichedPhase {
  id: string;
  dayNumber: number;
  phaseType: string;
  phaseOrder: number;
  status: string;
  casualtyCount: number;
  eventCount: number;
  isLive: boolean;
  jumpUrl: string;
}

export interface LeaderboardEntry {
  rank: number;
  tribute: EnrichedTribute;
  score: number;
  formattedScore: string;
}

export interface HistoricalItemMovement {
  id: string;
  itemName: string;
  action: "gained" | "lost" | "consumed" | "destroyed";
  tributeName: string;
  district: number;
  phaseName: string;
}

export interface MuttClashRecord {
  npcName: string;
  description?: string;
  casualtyCount: number;
  targetTributeNames: string[];
  phaseName: string;
}

export interface AllianceIntelEntry {
  id: string;
  status: "active" | "dissolved" | "betrayed";
  memberTributes: EnrichedTribute[];
  formedPhaseName: string;
  dissolvedPhaseName?: string;
  betrayedByTributeName?: string;
}

export interface DistrictSummary {
  district: number;
  total: number;
  alive: number;
  fallen: number;
  totalKills: number;
  isEliminated: boolean;
}

export function useGameHub(gameId: string) {
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [game, setGame] = useState<GameDbRow | null>(null);
  const [rawTributes, setRawTributes] = useState<TributeDbRow[]>([]);
  const [rawAlliances, setRawAlliances] = useState<GameAllianceDbRow[]>([]);
  const [rawPhases, setRawPhases] = useState<GamePhaseDbRow[]>([]);

  // 1. Fetch Game Telemetry
  const loadHubData = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError(null);

      const res = await fetch(`/api/game/${gameId}`);
      if (!res.ok) {
        throw new Error("Failed to connect to Capitol telemetry");
      }

      const data = await res.json();
      setGame(data.game);
      setRawTributes(data.tributes || []);
      setRawAlliances(data.alliances || []);

      const sortedPhases: GamePhaseDbRow[] = (data.phases || []).sort(
        (a: GamePhaseDbRow, b: GamePhaseDbRow) => a.phase_order - b.phase_order
      );
      setRawPhases(sortedPhases);
    } catch (err) {
      console.error("[useGameHub] Telemetry error:", err);
      setLoadError(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setIsLoading(false);
    }
  }, [gameId]);

  useEffect(() => {
    loadHubData();
  }, [loadHubData]);

  // Map phases by id for quick lookup
  const phaseMap = useMemo(() => {
    const map = new Map<string, GamePhaseDbRow>();
    for (const p of rawPhases) {
      map.set(p.id, p);
    }
    return map;
  }, [rawPhases]);

  // Alliance partners lookup by tributeId
  const tributeAlliancePartners = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const a of rawAlliances) {
      if (a.status === "active") {
        for (const tId of a.tribute_ids) {
          const partners = a.tribute_ids.filter((id) => id !== tId);
          map.set(tId, [...(map.get(tId) || []), ...partners]);
        }
      }
    }
    return map;
  }, [rawAlliances]);

  // 2. Enriched Tributes Roster
  const tributes = useMemo<EnrichedTribute[]>(() => {
    return rawTributes.map((row) => {
      const biometrics = parseDbTributeStats(row.stats);
      const inventory = parseDbInventory(row.inventory);
      const alliancePartnerIds = tributeAlliancePartners.get(row.id) || [];

      return {
        id: row.id,
        name: row.name,
        district: row.district,
        gender: row.gender,
        avatarUrl: row.avatar_url,
        status: row.status,
        killCount: row.kill_count,
        placement: row.placement,
        deathPhaseId: row.death_phase_id,
        personality: row.personality ?? "",
        physicalAspect: row.physical_aspect ?? "",
        biometrics,
        inventory,
        alliancePartnerIds,
      };
    });
  }, [rawTributes, tributeAlliancePartners]);

  const tributesMap = useMemo(() => {
    const map = new Map<string, EnrichedTribute>();
    for (const t of tributes) {
      map.set(t.id, t);
    }
    return map;
  }, [tributes]);

  // 3. Victor Candidate
  const victor = useMemo<EnrichedTribute | null>(() => {
    if (!game) return null;
    if (game.winner_id) {
      return tributesMap.get(game.winner_id) || null;
    }
    // Fallback: If status is finished and exactly 1 alive tribute exists
    if (game.status === "finished" || game.status === "archived") {
      const living = tributes.filter((t) => t.status === "alive");
      if (living.length === 1) return living[0];
      const rankOne = tributes.find((t) => t.placement === 1);
      if (rankOne) return rankOne;
    }
    return null;
  }, [game, tributes, tributesMap]);

  // 4. Living vs Fallen
  const livingTributes = useMemo(
    () => tributes.filter((t) => t.status === "alive"),
    [tributes]
  );
  const fallenTributes = useMemo(
    () =>
      tributes
        .filter((t) => t.status === "dead")
        .sort((a, b) => (a.placement ?? 99) - (b.placement ?? 99)),
    [tributes]
  );

  // 5. Leaderboards
  const leaderboards = useMemo(() => {
    // 1. Most Lethal (Kills)
    const killsSorted = [...tributes].sort((a, b) => b.killCount - a.killCount);
    const killsLeaderboard: LeaderboardEntry[] = killsSorted.map((t, idx) => ({
      rank: idx + 1,
      tribute: t,
      score: t.killCount,
      formattedScore: `${t.killCount} Kills`,
    }));

    // 2. Highest Vitality (Survival HP)
    const survivalSorted = [...tributes].sort(
      (a, b) => b.biometrics.survival - a.biometrics.survival
    );
    const survivalLeaderboard: LeaderboardEntry[] = survivalSorted.map((t, idx) => ({
      rank: idx + 1,
      tribute: t,
      score: t.biometrics.survival,
      formattedScore: `${t.biometrics.survival}% HP`,
    }));

    // 3. Resolute Sanity
    const sanitySorted = [...tributes].sort(
      (a, b) => b.biometrics.sanity - a.biometrics.sanity
    );
    const sanityLeaderboard: LeaderboardEntry[] = sanitySorted.map((t, idx) => ({
      rank: idx + 1,
      tribute: t,
      score: t.biometrics.sanity,
      formattedScore: `${t.biometrics.sanity}%`,
    }));

    // 4. Master Scavenger (Items in inventory)
    const scavengerSorted = [...tributes].sort(
      (a, b) => b.inventory.length - a.inventory.length
    );
    const scavengerLeaderboard: LeaderboardEntry[] = scavengerSorted.map((t, idx) => ({
      rank: idx + 1,
      tribute: t,
      score: t.inventory.length,
      formattedScore: `${t.inventory.length} Items`,
    }));

    // 5. Combat Veterans (Count encounters in events)
    const combatCounts = new Map<string, number>();
    for (const p of rawPhases) {
      for (const ev of p.game_phase_events || []) {
        for (const tId of ev.tribute_ids || []) {
          combatCounts.set(tId, (combatCounts.get(tId) || 0) + 1);
        }
      }
    }
    const combatSorted = [...tributes].sort(
      (a, b) => (combatCounts.get(b.id) || 0) - (combatCounts.get(a.id) || 0)
    );
    const combatLeaderboard: LeaderboardEntry[] = combatSorted.map((t, idx) => {
      const count = combatCounts.get(t.id) || 0;
      return {
        rank: idx + 1,
        tribute: t,
        score: count,
        formattedScore: `${count} Clashes`,
      };
    });

    return {
      kills: killsLeaderboard,
      survival: survivalLeaderboard,
      sanity: sanityLeaderboard,
      scavenger: scavengerLeaderboard,
      combat: combatLeaderboard,
    };
  }, [tributes, rawPhases]);

  // 6. Chronological Phase Calendar
  const calendarPhases = useMemo<EnrichedPhase[]>(() => {
    if (!rawPhases || rawPhases.length === 0) return [];
    const latestPhaseId = rawPhases[rawPhases.length - 1].id;

    return rawPhases.map((phase) => ({
      id: phase.id,
      dayNumber: phase.day_number,
      phaseType: phase.phase_type,
      phaseOrder: phase.phase_order,
      status: phase.status,
      casualtyCount: phase.fallen_tribute_ids?.length || 0,
      eventCount: phase.game_phase_events?.length || 0,
      isLive: Boolean(
        game?.status === "in_progress" && phase.id === latestPhaseId
      ),
      jumpUrl: `/game/${gameId}?phaseId=${phase.id}`,
    }));
  }, [rawPhases, game?.status, gameId]);

  // 7. Arena Items Manifesto
  const arenaItems = useMemo(() => {
    // 1. Active tribute loadouts
    const activeLoadouts: Array<{
      item: EngineItem | string;
      heldBy: EnrichedTribute;
    }> = [];

    for (const t of tributes) {
      if (t.status === "alive") {
        for (const itm of t.inventory) {
          activeLoadouts.push({ item: itm, heldBy: t });
        }
      }
    }

    // 2. Historical item movements extracted from state_delta
    const history: HistoricalItemMovement[] = [];
    for (const p of rawPhases) {
      const phaseLabel =
        p.phase_type === "bloodbath"
          ? "Bloodbath"
          : `Day ${p.day_number} ${p.phase_type.toUpperCase()}`;

      for (const ev of p.game_phase_events || []) {
        const deltaMap = (ev.state_delta || {}) as Record<string, any>;
        for (const [tId, delta] of Object.entries(deltaMap)) {
          const trib = tributesMap.get(tId);
          if (!trib) continue;

          for (const itm of delta.itemsGained || []) {
            const name = typeof itm === "string" ? itm : itm.name;
            history.push({
              id: `${ev.id}-gained-${name}`,
              itemName: name,
              action: "gained",
              tributeName: trib.name,
              district: trib.district,
              phaseName: phaseLabel,
            });
          }

          for (const itm of delta.itemsLost || []) {
            const name = typeof itm === "string" ? itm : itm.name;
            history.push({
              id: `${ev.id}-lost-${name}`,
              itemName: name,
              action: "lost",
              tributeName: trib.name,
              district: trib.district,
              phaseName: phaseLabel,
            });
          }

          for (const itm of delta.itemsConsumed || []) {
            const name = typeof itm === "string" ? itm : itm.name;
            history.push({
              id: `${ev.id}-consumed-${name}`,
              itemName: name,
              action: "consumed",
              tributeName: trib.name,
              district: trib.district,
              phaseName: phaseLabel,
            });
          }

          for (const itm of delta.itemsDestroyed || []) {
            const name = typeof itm === "string" ? itm : itm.name;
            history.push({
              id: `${ev.id}-destroyed-${name}`,
              itemName: name,
              action: "destroyed",
              tributeName: trib.name,
              district: trib.district,
              phaseName: phaseLabel,
            });
          }
        }
      }
    }

    // 3. Thematic Arena Arsenal Cache (synthesized matching arena lore)
    const thematicCache: EngineItem[] = [];
    if (game) {
      const prng = createPRNG(42);
      const categories: ItemCategory[] = [
        "weapon",
        "armor",
        "medical",
        "sustenance",
        "tool",
      ];
      const tiers: ItemTier[] = ["common", "uncommon", "rare", "legendary"];

      for (const cat of categories) {
        for (const tier of tiers) {
          thematicCache.push(
            synthesizeItem({
              arenaName: game.arena_name,
              arenaDescription: game.arena_description,
              category: cat,
              tier: tier,
              prng,
            })
          );
        }
      }
    }

    return {
      activeLoadouts,
      history,
      thematicCache,
    };
  }, [tributes, rawPhases, tributesMap, game]);

  // 8. Mutts & Threats Telemetry
  const muttThreats = useMemo(() => {
    const encountered: MuttClashRecord[] = [];

    for (const p of rawPhases) {
      const phaseLabel =
        p.phase_type === "bloodbath"
          ? "Bloodbath"
          : `Day ${p.day_number} ${p.phase_type.toUpperCase()}`;

      for (const ev of p.game_phase_events || []) {
        if (ev.event_category === "mutt" || ev.event_category === "hazard") {
          const deltaMap = (ev.state_delta || {}) as Record<string, any>;
          const victims: string[] = [];
          let casualties = 0;

          for (const [tId, delta] of Object.entries(deltaMap)) {
            const trib = tributesMap.get(tId);
            if (trib) {
              victims.push(trib.name);
              if (delta.isFatal) casualties++;
            }
          }

          const npcName =
            ev.event_category === "mutt"
              ? "Capitol Bio-Engineered Muttation"
              : "Arena Environmental Cataclysm";

          encountered.push({
            npcName,
            casualtyCount: casualties,
            targetTributeNames: victims,
            phaseName: phaseLabel,
          });
        }
      }
    }

    let catalog: Array<{ name: string; description: string }> = [];
    if (game) {
      const prng = createPRNG(99);
      catalog = synthesizeNpcBatchFromDescription({
        arenaName: game.arena_name,
        arenaDescription: game.arena_description,
        prng,
        count: 5,
      });
    }

    return {
      encountered,
      catalog,
    };
  }, [rawPhases, tributesMap, game]);

  // 9. Alliances Intel & District Telemetry
  const alliancesIntel = useMemo(() => {
    const entries: AllianceIntelEntry[] = rawAlliances.map((a) => {
      const members = a.tribute_ids
        .map((id) => tributesMap.get(id))
        .filter((t): t is EnrichedTribute => Boolean(t));

      const formedPhase = a.formed_phase_id
        ? phaseMap.get(a.formed_phase_id)
        : null;
      const dissolvedPhase = a.dissolved_phase_id
        ? phaseMap.get(a.dissolved_phase_id)
        : null;
      const betrayedBy = a.betrayed_by_tribute_id
        ? tributesMap.get(a.betrayed_by_tribute_id)?.name
        : undefined;

      const formedPhaseName = formedPhase
        ? formedPhase.phase_type === "bloodbath"
          ? "Bloodbath"
          : `Day ${formedPhase.day_number} ${formedPhase.phase_type.toUpperCase()}`
        : "Initial Setup";

      const dissolvedPhaseName = dissolvedPhase
        ? dissolvedPhase.phase_type === "bloodbath"
          ? "Bloodbath"
          : `Day ${dissolvedPhase.day_number} ${dissolvedPhase.phase_type.toUpperCase()}`
        : undefined;

      return {
        id: a.id,
        status: (a.status as "active" | "dissolved" | "betrayed") || "active",
        memberTributes: members,
        formedPhaseName,
        dissolvedPhaseName,
        betrayedByTributeName: betrayedBy,
      };
    });

    const districtsMap = new Map<
      number,
      { total: number; alive: number; fallen: number; totalKills: number }
    >();

    for (const t of tributes) {
      const current = districtsMap.get(t.district) || {
        total: 0,
        alive: 0,
        fallen: 0,
        totalKills: 0,
      };
      current.total++;
      if (t.status === "alive") {
        current.alive++;
      } else {
        current.fallen++;
      }
      current.totalKills += t.killCount;
      districtsMap.set(t.district, current);
    }

    const districtSummaries: DistrictSummary[] = Array.from(
      districtsMap.entries()
    )
      .sort(([a], [b]) => a - b)
      .map(([district, data]) => ({
        district,
        total: data.total,
        alive: data.alive,
        fallen: data.fallen,
        totalKills: data.totalKills,
        isEliminated: data.alive === 0,
      }));

    return {
      entries,
      districtSummaries,
    };
  }, [rawAlliances, tributesMap, phaseMap, tributes]);

  // 10. Smart Navigation Routes
  const navigationRoutes = useMemo(() => {
    const isFinished =
      game?.status === "finished" || game?.status === "archived";
    const firstPhaseId = rawPhases.length > 0 ? rawPhases[0].id : null;
    const latestPhaseId =
      rawPhases.length > 0 ? rawPhases[rawPhases.length - 1].id : null;

    // If finished, route to start (Day 0 / Bloodbath). If running, route to latest phase
    const liveRoute = isFinished
      ? firstPhaseId
        ? `/game/${gameId}?phaseId=${firstPhaseId}`
        : `/game/${gameId}`
      : latestPhaseId
      ? `/game/${gameId}?phaseId=${latestPhaseId}`
      : `/game/${gameId}`;

    return {
      liveRoute,
      isFinished,
      setupRoute: "/setup",
      lobbyRoute: "/lobby",
    };
  }, [game?.status, rawPhases, gameId]);

  return {
    isLoading,
    loadError,
    game,
    tributes,
    tributesMap,
    victor,
    livingTributes,
    fallenTributes,
    leaderboards,
    calendarPhases,
    arenaItems,
    muttThreats,
    alliancesIntel,
    navigationRoutes,
    reload: loadHubData,
  };
}
