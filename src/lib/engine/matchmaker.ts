/**
 * Hunger Games AI — Dynamic Slot-Based Partitioner & Matchmaker
 * Partitions alive tributes into narrative encounters of 1 to 4 tributes and 0 to 2 NPCs.
 * Enforces strict mathematical coverage invariants and the Dual Alliance Model.
 */

import { PRNG } from "./prng";
import {
  EngineTribute,
  EngineAlliance,
  EncounterSlotFormation,
  EncounterType,
  NPCCombatant,
  EventCategory,
  MatchmakerContext,
  MatchmakerPartitionResult,
} from "./types";
import {
  getTributeAlliance,
  calculateTributeAffinity,
  SPONTANEOUS_TRUCE_AFFINITY_THRESHOLD,
} from "./alliances";
import {
  MAX_TRIBUTE_SLOTS_PER_EVENT,
  MAX_NPC_SLOTS_PER_EVENT,
  CLIMAX_MUTTATION_TRIGGER_COUNT,
  SAME_DISTRICT_TRUCE_PROBABILITY,
  CROSS_DISTRICT_TRUCE_PROBABILITY,
} from "./constants";

// ==========================================
// NPC & Hazard Catalog
// ==========================================

const SAMPLE_MUTTS: readonly Omit<NPCCombatant, "id">[] = [
  { name: "Tracker Jacker Swarm", type: "mutt", threatLevel: "moderate" },
  { name: "Carnivorous Wolf Mutt", type: "mutt", threatLevel: "lethal" },
  { name: "Sewer Stalker Reptilian Mutt", type: "mutt", threatLevel: "lethal" },
  { name: "Golden Mandrill Pack", type: "mutt", threatLevel: "moderate" },
  { name: "Venomous Tree Viper", type: "beast", threatLevel: "minor" },
];

const SAMPLE_HAZARDS: readonly Omit<NPCCombatant, "id">[] = [
  { name: "Corrosive Acid Fog", type: "hazard", threatLevel: "lethal" },
  { name: "Capitol Wildfire Wall", type: "hazard", threatLevel: "moderate" },
  { name: "Flash Tsunami Surge", type: "hazard", threatLevel: "lethal" },
  { name: "Crevasse Ice Collapse", type: "hazard", threatLevel: "minor" },
  { name: "Toxic Smog Eruption", type: "hazard", threatLevel: "moderate" },
];

// ==========================================
// Core Matchmaker Implementation
// ==========================================

/**
 * Main entry point: Partitions all alive tributes into valid slot encounters for a given phase.
 */
export function partitionTributesIntoEncounters(
  context: MatchmakerContext
): MatchmakerPartitionResult {
  const {
    gameId,
    dayNumber,
    phaseType,
    aliveTributes,
    alliances,
    settings,
    prng,
  } = context;

  // Filter strictly to alive tributes
  const activeTributes = aliveTributes.filter((t) => t.status === "alive");

  if (activeTributes.length === 0) {
    return { encounters: [], unmatchedTributes: [] };
  }

  // Edge case: Sole survivor
  if (activeTributes.length === 1) {
    const victor = activeTributes[0];
    const victorEncounter: EncounterSlotFormation = {
      id: `encounter-${gameId.slice(0, 6)}-p${dayNumber}-1`,
      encounterOrder: 1,
      formationType: "solo_rest",
      category: "social",
      tributeIds: [victor.id],
      npcs: [],
      factions: [
        {
          id: `faction-${victor.id.slice(0, 8)}`,
          name: victor.name,
          tributeIds: [victor.id],
        },
      ],
      thematicContext: {
        locationDescription: "Standing alone over the arena grounds as the lone survivor.",
      },
    };
    return {
      encounters: [victorEncounter],
      unmatchedTributes: [],
    };
  }

  // 1. Group alive tributes by active alliance clusters vs lone individuals
  const { allianceClusters, loneTributes } = extractTributeClusters(
    activeTributes,
    alliances
  );

  // 2. Generate target slot partition sizes (composed of 1, 2, 3, 4) summing to activeTributes.length
  const partitionSizes = generatePartitionSizes(
    activeTributes.length,
    allianceClusters,
    phaseType,
    prng
  );

  // 3. Allocate tribute groups to match partition sizes
  const tributeGroups = allocateTributesToPartitions(
    partitionSizes,
    allianceClusters,
    loneTributes,
    prng
  );

  // 4. Construct encounter formations with factions, encounter types, and NPCs
  let encounterIndex = 1;
  const encounters: EncounterSlotFormation[] = [];

  for (const group of tributeGroups) {
    const formation = buildEncounterFormation({
      group,
      encounterOrder: encounterIndex++,
      gameId,
      dayNumber,
      phaseType,
      totalAliveCount: activeTributes.length,
      alliances,
      settings,
      prng,
    });
    encounters.push(formation);
  }

  // Safety check for unmatched tributes
  const matchedIds = new Set(encounters.flatMap((e) => e.tributeIds));
  const unmatchedTributes = activeTributes.filter((t) => !matchedIds.has(t.id));

  return {
    encounters,
    unmatchedTributes,
  };
}

// ==========================================
// Helper: Cluster Extraction
// ==========================================

interface TributeClusters {
  allianceClusters: EngineTribute[][];
  loneTributes: EngineTribute[];
}

function extractTributeClusters(
  aliveTributes: EngineTribute[],
  alliances: Map<string, EngineAlliance>
): TributeClusters {
  const allianceMap = new Map<string, EngineTribute[]>();
  const loneTributes: EngineTribute[] = [];
  const assigned = new Set<string>();

  for (const tribute of aliveTributes) {
    const alliance = getTributeAlliance(alliances, tribute.id);
    if (alliance && alliance.status === "active") {
      const list = allianceMap.get(alliance.id) ?? [];
      list.push(tribute);
      allianceMap.set(alliance.id, list);
      assigned.add(tribute.id);
    }
  }

  // Separate alliances with >= 2 alive members from degraded ones (1 member left)
  const allianceClusters: EngineTribute[][] = [];
  for (const [, members] of allianceMap.entries()) {
    if (members.length >= 2) {
      // Split giant clusters (>4) into sub-teams of max 4
      if (members.length > MAX_TRIBUTE_SLOTS_PER_EVENT) {
        allianceClusters.push(members.slice(0, MAX_TRIBUTE_SLOTS_PER_EVENT));
        allianceClusters.push(members.slice(MAX_TRIBUTE_SLOTS_PER_EVENT));
      } else {
        allianceClusters.push(members);
      }
    } else if (members.length === 1) {
      loneTributes.push(members[0]);
    }
  }

  for (const tribute of aliveTributes) {
    if (!assigned.has(tribute.id)) {
      loneTributes.push(tribute);
    }
  }

  return { allianceClusters, loneTributes };
}

// ==========================================
// Helper: Partition Size Generation
// ==========================================

/**
 * Computes an array of partition sizes summing to `totalCount` where each size in [1..4].
 * Takes alliance cluster sizes into account for optimal cohesion.
 */
export function generatePartitionSizes(
  totalCount: number,
  allianceClusters: EngineTribute[][],
  phaseType: string,
  prng: PRNG
): number[] {
  if (totalCount <= 0) return [];
  if (totalCount === 1) return [1];
  if (totalCount === 2) return [2];
  if (totalCount === 3) return [3];
  if (totalCount === 4) {
    // 4 can be a single 4-tribute clash or two 2-tribute duels
    return prng.nextBoolean(0.65) ? [4] : [2, 2];
  }

  const sizes: number[] = [];
  let remaining = totalCount;

  // Prioritize cluster sizes from active alliances first
  for (const cluster of allianceClusters) {
    const size = Math.min(cluster.length, MAX_TRIBUTE_SLOTS_PER_EVENT);
    if (remaining >= size && size >= 2) {
      sizes.push(size);
      remaining -= size;
    }
  }

  // Partition the remaining tributes dynamically
  while (remaining > 0) {
    if (remaining === 1) {
      // Avoid isolated size 1 by merging into an existing size 2 or 3 if possible
      const indexToExpand = sizes.findIndex((s) => s < MAX_TRIBUTE_SLOTS_PER_EVENT);
      if (indexToExpand !== -1) {
        sizes[indexToExpand] += 1;
        remaining -= 1;
      } else {
        sizes.push(1);
        remaining -= 1;
      }
      break;
    }

    if (remaining === 2) {
      sizes.push(2);
      remaining -= 2;
      break;
    }

    if (remaining === 3) {
      sizes.push(3);
      remaining -= 3;
      break;
    }

    if (remaining === 4) {
      const choice = prng.nextBoolean(0.5) ? [4] : [2, 2];
      sizes.push(...choice);
      remaining -= 4;
      break;
    }

    if (remaining === 5) {
      sizes.push(3, 2);
      remaining -= 5;
      break;
    }

    // For remaining >= 6, choose between 4, 3, or 2 based on phase
    const candidateSizes = phaseType === "bloodbath" || phaseType === "feast"
      ? [4, 4, 3, 2] // More multi-clashes in cornucopia/feast
      : [4, 3, 2, 2];

    const pick = prng.pickOne(candidateSizes);
    const chosenSize = Math.min(pick, remaining - 2); // ensure at least 2 remaining
    const finalSize = Math.max(2, Math.min(MAX_TRIBUTE_SLOTS_PER_EVENT, chosenSize));

    sizes.push(finalSize);
    remaining -= finalSize;
  }

  return sizes;
}

// ==========================================
// Helper: Allocate Tributes to Partitions
// ==========================================

function allocateTributesToPartitions(
  partitionSizes: number[],
  allianceClusters: EngineTribute[][],
  loneTributes: EngineTribute[],
  prng: PRNG
): EngineTribute[][] {
  const groups: EngineTribute[][] = [];
  const clusterPool = [...allianceClusters];
  const lonePool = prng.shuffle([...loneTributes]);

  for (const targetSize of partitionSizes) {
    const currentGroup: EngineTribute[] = [];

    // Check if we can fit an intact alliance cluster
    const clusterIndex = clusterPool.findIndex(
      (c) => c.length > 0 && c.length <= targetSize
    );

    if (clusterIndex !== -1) {
      const cluster = clusterPool[clusterIndex];
      currentGroup.push(...cluster);
      clusterPool.splice(clusterIndex, 1);
    }

    // Fill remaining slots with lone tributes or remaining partial clusters
    while (currentGroup.length < targetSize) {
      if (lonePool.length > 0) {
        currentGroup.push(lonePool.pop()!);
      } else if (clusterPool.length > 0) {
        const nextCluster = clusterPool[0];
        if (nextCluster.length > 0) {
          currentGroup.push(nextCluster.pop()!);
          if (nextCluster.length === 0) {
            clusterPool.shift();
          }
        }
      } else {
        break;
      }
    }

    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }
  }

  // Drain any leftovers into existing groups that have room
  while (lonePool.length > 0) {
    const leftover = lonePool.pop()!;
    const expandableGroup = groups.find(
      (g) => g.length < MAX_TRIBUTE_SLOTS_PER_EVENT
    );
    if (expandableGroup) {
      expandableGroup.push(leftover);
    } else {
      groups.push([leftover]);
    }
  }

  for (const remainingCluster of clusterPool) {
    while (remainingCluster.length > 0) {
      const leftover = remainingCluster.pop()!;
      const expandableGroup = groups.find(
        (g) => g.length < MAX_TRIBUTE_SLOTS_PER_EVENT
      );
      if (expandableGroup) {
        expandableGroup.push(leftover);
      } else {
        groups.push([leftover]);
      }
    }
  }

  return groups;
}

// ==========================================
// Helper: Encounter Formation Builder
// ==========================================

interface BuildFormationParams {
  group: EngineTribute[];
  encounterOrder: number;
  gameId: string;
  dayNumber: number;
  phaseType: string;
  totalAliveCount: number;
  alliances: Map<string, EngineAlliance>;
  settings: MatchmakerContext["settings"];
  prng: PRNG;
}

function buildEncounterFormation(params: BuildFormationParams): EncounterSlotFormation {
  const {
    group,
    encounterOrder,
    gameId,
    dayNumber,
    phaseType,
    totalAliveCount,
    alliances,
    prng,
  } = params;

  const count = group.length;
  const tributeIds = group.map((t) => t.id);
  const npcs = evaluateNPCGeneration(params);

  // Group by formal alliances within the encounter
  const allianceGroups = new Map<string, EngineTribute[]>();
  const unallied: EngineTribute[] = [];

  for (const t of group) {
    const alliance = getTributeAlliance(alliances, t.id);
    if (alliance && alliance.status === "active") {
      const list = allianceGroups.get(alliance.id) ?? [];
      list.push(t);
      allianceGroups.set(alliance.id, list);
    } else {
      unallied.push(t);
    }
  }

  const activePactList = Array.from(allianceGroups.values());

  // -------------------------------------------------------------
  // 1. SOLO FORMATIONS (1 Tribute)
  // -------------------------------------------------------------
  if (count === 1) {
    const tribute = group[0];
    const hasNpc = npcs.length > 0;
    const formationType: EncounterType = hasNpc
      ? "solo_pve"
      : prng.pickWeighted(
          ["solo_forage", "solo_rest", "solo_mishap"],
          [50, 35, 15]
        ) as EncounterType;

    const category: EventCategory = hasNpc
      ? (npcs[0].type === "mutt" ? "mutt" : "hazard")
      : formationType === "solo_forage"
      ? "forage"
      : "social";

    return {
      id: `enc-${gameId.slice(0, 6)}-d${dayNumber}-${encounterOrder}`,
      encounterOrder,
      formationType,
      category,
      tributeIds,
      npcs,
      factions: [
        {
          id: `faction-${tribute.id.slice(0, 8)}`,
          name: tribute.name,
          tributeIds: [tribute.id],
        },
      ],
      thematicContext: {
        locationDescription: hasNpc
          ? `Ambushed by ${npcs[0].name} in the wilderness.`
          : `Navigating the arena grounds in isolation.`,
      },
    };
  }

  // -------------------------------------------------------------
  // 2. DUO FORMATIONS (2 Tributes)
  // -------------------------------------------------------------
  if (count === 2) {
    const [t1, t2] = group;
    const areFormalAllies = activePactList.length === 1 && activePactList[0].length === 2;
    const hasNpc = npcs.length > 0;

    if (areFormalAllies) {
      if (hasNpc) {
        return {
          id: `enc-${gameId.slice(0, 6)}-d${dayNumber}-${encounterOrder}`,
          encounterOrder,
          formationType: "coop_pve_2",
          category: npcs[0].type === "mutt" ? "mutt" : "hazard",
          tributeIds,
          npcs,
          factions: [
            {
              id: `faction-allied-${t1.id.slice(0, 4)}-${t2.id.slice(0, 4)}`,
              name: `Allied Duo (${t1.name} & ${t2.name})`,
              tributeIds: [t1.id, t2.id],
            },
          ],
          thematicContext: {
            locationDescription: `Cooperating against ${npcs[0].name}.`,
          },
        };
      }

      return {
        id: `enc-${gameId.slice(0, 6)}-d${dayNumber}-${encounterOrder}`,
        encounterOrder,
        formationType: "allied_camp_2",
        category: "social",
        tributeIds,
        npcs: [],
        factions: [
          {
            id: `faction-allied-${t1.id.slice(0, 4)}-${t2.id.slice(0, 4)}`,
            name: `Allied Camp (${t1.name} & ${t2.name})`,
            tributeIds: [t1.id, t2.id],
          },
        ],
        thematicContext: {
          locationDescription: "Sharing campfire warmth and strategic supplies.",
        },
      };
    }

    // Unallied duo
    const affinity = calculateTributeAffinity(t1, t2);
    const isSameDistrict = t1.district === t2.district;

    // Check for peaceful encounter / truce
    if (
      affinity >= SPONTANEOUS_TRUCE_AFFINITY_THRESHOLD &&
      prng.nextBoolean(isSameDistrict ? SAME_DISTRICT_TRUCE_PROBABILITY : CROSS_DISTRICT_TRUCE_PROBABILITY)
    ) {
      return {
        id: `enc-${gameId.slice(0, 6)}-d${dayNumber}-${encounterOrder}`,
        encounterOrder,
        formationType: "peaceful_encounter_2",
        category: "social",
        tributeIds,
        npcs,
        factions: [
          {
            id: `faction-${t1.id.slice(0, 6)}`,
            name: t1.name,
            tributeIds: [t1.id],
          },
          {
            id: `faction-${t2.id.slice(0, 6)}`,
            name: t2.name,
            tributeIds: [t2.id],
          },
        ],
        thematicContext: {
          locationDescription: `Tense peaceful encounter between District ${t1.district} and District ${t2.district}.`,
        },
      };
    }

    const formationType: EncounterType = prng.nextBoolean(0.7) ? "duel_1v1" : "standoff_1v1";
    return {
      id: `enc-${gameId.slice(0, 6)}-d${dayNumber}-${encounterOrder}`,
      encounterOrder,
      formationType,
      category: "combat",
      tributeIds,
      npcs,
      factions: [
        {
          id: `faction-${t1.id.slice(0, 6)}`,
          name: t1.name,
          tributeIds: [t1.id],
        },
        {
          id: `faction-${t2.id.slice(0, 6)}`,
          name: t2.name,
          tributeIds: [t2.id],
        },
      ],
      thematicContext: {
        locationDescription: `Hostile confrontation in the arena.`,
      },
    };
  }

  // -------------------------------------------------------------
  // 3. TRIO FORMATIONS (3 Tributes)
  // -------------------------------------------------------------
  if (count === 3) {
    const hasNpc = npcs.length > 0;

    // Case 3A: Formal 3-person allied pack
    if (activePactList.length === 1 && activePactList[0].length === 3) {
      const formationType: EncounterType = hasNpc ? "coop_pve_3" : "allied_camp_3";
      return {
        id: `enc-${gameId.slice(0, 6)}-d${dayNumber}-${encounterOrder}`,
        encounterOrder,
        formationType,
        category: hasNpc ? (npcs[0].type === "mutt" ? "mutt" : "hazard") : "social",
        tributeIds,
        npcs,
        factions: [
          {
            id: `faction-pack-${tributeIds[0].slice(0, 6)}`,
            name: `Allied Pack`,
            tributeIds,
          },
        ],
      };
    }

    // Case 3B: Formal 2-person allied pack vs 1 solo
    if (activePactList.length === 1 && activePactList[0].length === 2) {
      const pack = activePactList[0];
      const solo = unallied[0];
      return {
        id: `enc-${gameId.slice(0, 6)}-d${dayNumber}-${encounterOrder}`,
        encounterOrder,
        formationType: "ambush_1v2",
        category: "combat",
        tributeIds,
        npcs,
        factions: [
          {
            id: `faction-pack-${pack[0].id.slice(0, 4)}`,
            name: `Hunting Pack (${pack[0].name} & ${pack[1].name})`,
            tributeIds: [pack[0].id, pack[1].id],
          },
          {
            id: `faction-solo-${solo.id.slice(0, 6)}`,
            name: solo.name,
            tributeIds: [solo.id],
          },
        ],
        thematicContext: {
          locationDescription: `Asymmetric pack ambush against ${solo.name}.`,
        },
      };
    }

    // Case 3C: 3 Unallied Tributes -> Evaluate Spontaneous Truce vs 1v1v1 FFA
    const [t1, t2, t3] = group;
    const aff12 = calculateTributeAffinity(t1, t2);
    const aff13 = calculateTributeAffinity(t1, t3);
    const aff23 = calculateTributeAffinity(t2, t3);

    // If two unallied tributes share high affinity (e.g. same district), roll for spontaneous gang-up
    if (aff12 >= SPONTANEOUS_TRUCE_AFFINITY_THRESHOLD && aff12 > aff13 && aff12 > aff23 && prng.nextBoolean(0.75)) {
      return {
        id: `enc-${gameId.slice(0, 6)}-d${dayNumber}-${encounterOrder}`,
        encounterOrder,
        formationType: "spontaneous_truce_1v2",
        category: "combat",
        tributeIds,
        npcs,
        factions: [
          {
            id: `faction-truce-${t1.id.slice(0, 4)}-${t2.id.slice(0, 4)}`,
            name: `Temporary Truce (${t1.name} & ${t2.name})`,
            tributeIds: [t1.id, t2.id],
            isSpontaneousTruce: true,
          },
          {
            id: `faction-target-${t3.id.slice(0, 6)}`,
            name: t3.name,
            tributeIds: [t3.id],
          },
        ],
        thematicContext: {
          locationDescription: `${t1.name} and ${t2.name} temporarily gang up on ${t3.name}.`,
        },
      };
    }

    // Default 3-Way FFA
    return {
      id: `enc-${gameId.slice(0, 6)}-d${dayNumber}-${encounterOrder}`,
      encounterOrder,
      formationType: "ffa_3way",
      category: "combat",
      tributeIds,
      npcs,
      factions: [
        { id: `f-${t1.id.slice(0, 6)}`, name: t1.name, tributeIds: [t1.id] },
        { id: `f-${t2.id.slice(0, 6)}`, name: t2.name, tributeIds: [t2.id] },
        { id: `f-${t3.id.slice(0, 6)}`, name: t3.name, tributeIds: [t3.id] },
      ],
      thematicContext: {
        locationDescription: "Three-way chaotic skirmish in the open arena.",
      },
    };
  }

  // -------------------------------------------------------------
  // 4. QUAD FORMATIONS (4 Tributes)
  // -------------------------------------------------------------
  const [t1, t2, t3, t4] = group;
  const hasNpc = npcs.length > 0;

  // Case 4A: 2 Allied Duos -> 2v2 Squad War
  if (activePactList.length === 2 && activePactList[0].length === 2 && activePactList[1].length === 2) {
    const duoA = activePactList[0];
    const duoB = activePactList[1];
    return {
      id: `enc-${gameId.slice(0, 6)}-d${dayNumber}-${encounterOrder}`,
      encounterOrder,
      formationType: "squad_war_2v2",
      category: "combat",
      tributeIds,
      npcs,
      factions: [
        {
          id: `faction-duo-a`,
          name: `Squad A (${duoA[0].name} & ${duoA[1].name})`,
          tributeIds: [duoA[0].id, duoA[1].id],
        },
        {
          id: `faction-duo-b`,
          name: `Squad B (${duoB[0].name} & ${duoB[1].name})`,
          tributeIds: [duoB[0].id, duoB[1].id],
        },
      ],
      thematicContext: {
        locationDescription: "Two distinct alliances clash in a 2v2 squad war.",
      },
    };
  }

  // Case 4B: 1 Allied Trio + 1 Solo -> 1v3 Desperate Stand
  if (activePactList.length === 1 && activePactList[0].length === 3) {
    const pack = activePactList[0];
    const solo = unallied[0];
    return {
      id: `enc-${gameId.slice(0, 6)}-d${dayNumber}-${encounterOrder}`,
      encounterOrder,
      formationType: "stand_1v3",
      category: "combat",
      tributeIds,
      npcs,
      factions: [
        {
          id: `faction-trio-pack`,
          name: `3-Tribute Hunting Pack`,
          tributeIds: pack.map((p) => p.id),
        },
        {
          id: `faction-solo-${solo.id.slice(0, 6)}`,
          name: solo.name,
          tributeIds: [solo.id],
        },
      ],
      thematicContext: {
        locationDescription: `${solo.name} makes a desperate stand against a 3-person hunting pack.`,
      },
    };
  }

  // Case 4C: 1 Allied Duo + 2 Unallied -> 2v1v1 Asymmetric FFA or 2v2 Truce
  if (activePactList.length === 1 && activePactList[0].length === 2) {
    const duo = activePactList[0];
    const [u1, u2] = unallied;
    return {
      id: `enc-${gameId.slice(0, 6)}-d${dayNumber}-${encounterOrder}`,
      encounterOrder,
      formationType: "asymmetric_2v1v1",
      category: "combat",
      tributeIds,
      npcs,
      factions: [
        {
          id: `faction-duo`,
          name: `Allied Duo (${duo[0].name} & ${duo[1].name})`,
          tributeIds: [duo[0].id, duo[1].id],
        },
        {
          id: `faction-${u1.id.slice(0, 6)}`,
          name: u1.name,
          tributeIds: [u1.id],
        },
        {
          id: `faction-${u2.id.slice(0, 6)}`,
          name: u2.name,
          tributeIds: [u2.id],
        },
      ],
      thematicContext: {
        locationDescription: `Allied duo ambushes two scattered solo tributes.`,
      },
    };
  }

  // Case 4D: 4 Unallied Tributes -> 4-Way FFA (or Squad PvE if mutt climax)
  if (hasNpc && totalAliveCount <= CLIMAX_MUTTATION_TRIGGER_COUNT) {
    return {
      id: `enc-${gameId.slice(0, 6)}-d${dayNumber}-${encounterOrder}`,
      encounterOrder,
      formationType: "squad_pve_4way",
      category: "mutt",
      tributeIds,
      npcs,
      factions: [
        {
          id: `faction-climax-survivors`,
          name: `Surviving Tributes Truce`,
          tributeIds,
        },
      ],
      thematicContext: {
        locationDescription: `Final showdown against Gamemaker Mutts.`,
      },
    };
  }

  return {
    id: `enc-${gameId.slice(0, 6)}-d${dayNumber}-${encounterOrder}`,
    encounterOrder,
    formationType: phaseType === "bloodbath" ? "bloodbath_horn_clash" : "ffa_4way",
    category: "combat",
    tributeIds,
    npcs,
    factions: [
      { id: `f-${t1.id.slice(0, 6)}`, name: t1.name, tributeIds: [t1.id] },
      { id: `f-${t2.id.slice(0, 6)}`, name: t2.name, tributeIds: [t2.id] },
      { id: `f-${t3.id.slice(0, 6)}`, name: t3.name, tributeIds: [t3.id] },
      { id: `f-${t4.id.slice(0, 6)}`, name: t4.name, tributeIds: [t4.id] },
    ],
    thematicContext: {
      locationDescription: phaseType === "bloodbath"
        ? "Violent four-way scramble around the Cornucopia horn."
        : "Four-way chaotic free-for-all clash.",
    },
  };
}

// ==========================================
// Helper: NPC Generation Evaluation
// ==========================================

function evaluateNPCGeneration(params: BuildFormationParams): NPCCombatant[] {
  const { phaseType, totalAliveCount, settings, prng } = params;

  if (!settings.enableMuttations && !settings.enableDisasters) {
    return [];
  }

  const npcs: NPCCombatant[] = [];

  // 1. Climax Muttation Check (<= 3 alive tributes and climax_only setting)
  if (
    settings.enableMuttations &&
    settings.muttationTiming === "climax_only" &&
    totalAliveCount <= CLIMAX_MUTTATION_TRIGGER_COUNT
  ) {
    const sample = prng.pickOne(SAMPLE_MUTTS);
    npcs.push({
      id: `npc-climax-${prng.nextInt(100, 999)}`,
      name: `Alpha ${sample.name}`,
      type: "mutt",
      threatLevel: "lethal",
    });
    return npcs;
  }

  // 2. Night Stalkers Muttation (boosted chance at night)
  if (
    settings.enableMuttations &&
    (settings.muttationTiming === "night_stalkers" || phaseType === "night")
  ) {
    const muttProb = phaseType === "night" ? 0.45 : 0.15;
    if (prng.nextBoolean(muttProb)) {
      const sample = prng.pickOne(SAMPLE_MUTTS);
      npcs.push({
        id: `npc-mutt-${prng.nextInt(100, 999)}`,
        name: sample.name,
        type: sample.type,
        threatLevel: sample.threatLevel,
      });
    }
  }

  // 3. Disaster / Environmental Hazard Check
  if (settings.enableDisasters && npcs.length < MAX_NPC_SLOTS_PER_EVENT) {
    const disasterChance =
      settings.disasterFrequency === "frequent"
        ? 0.35
        : settings.disasterFrequency === "moderate"
        ? 0.15
        : 0.05;

    if (prng.nextBoolean(disasterChance)) {
      const sample = prng.pickOne(SAMPLE_HAZARDS);
      npcs.push({
        id: `npc-hazard-${prng.nextInt(100, 999)}`,
        name: sample.name,
        type: "hazard",
        threatLevel: sample.threatLevel,
      });
    }
  }

  return npcs.slice(0, MAX_NPC_SLOTS_PER_EVENT);
}
