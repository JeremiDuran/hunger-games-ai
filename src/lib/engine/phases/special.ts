/**
 * Hunger Games AI — Special Interstitial Phase Resolvers
 * Generic, extensible phase resolvers for Arena Cataclysms, NPC Overloads, and Gamemaker Events.
 */

import { BasePhaseResolver, PhaseContext, PhaseResolutionOutput } from "./types";
import {
  EngineTribute,
  EngineEventOutcome,
} from "../types";
import {
  resolveArenaHazardAoE,
  resolveMuttationSwarm,
} from "../combat/phase-calculus";

// ==========================================
// 1. Generic NPC Overload Resolver
// ==========================================

/**
 * NPC Overload Phase: Every single encounter in this phase is guaranteed
 * to feature 1 to 2 hostile NPCs (mutts, beasts, mechanical drones, apex predators).
 */
export class NpcOverloadResolver implements BasePhaseResolver {
  readonly phaseType = "npc_overload" as const;

  resolvePhase(context: PhaseContext): PhaseResolutionOutput {
    const {
      gameId,
      allTributes,
      alliances,
      prng,
    } = context;

    const updatedTributes = new Map<string, EngineTribute>(allTributes);
    const updatedAlliances = new Map(alliances);
    const fallenTributeIds: string[] = [];
    const events: EngineEventOutcome[] = [];
    let eventCounter = 1;

    const livingTributes = Array.from(updatedTributes.values()).filter(
      (t) => t.status === "alive"
    );

    if (livingTributes.length === 0) {
      return { events, fallenTributeIds, updatedTributes, updatedAlliances };
    }

    // Partition living tributes into groups of 1 to 4
    const shuffled = prng.shuffle([...livingTributes]);
    const groups: EngineTribute[][] = [];

    while (shuffled.length > 0) {
      if (shuffled.length >= 4) {
        groups.push([shuffled.pop()!, shuffled.pop()!, shuffled.pop()!, shuffled.pop()!]);
      } else if (shuffled.length === 3) {
        groups.push([shuffled.pop()!, shuffled.pop()!, shuffled.pop()!]);
      } else if (shuffled.length === 2) {
        groups.push([shuffled.pop()!, shuffled.pop()!]);
      } else {
        // 1 tribute remaining
        if (groups.length > 0 && groups[0].length < 4) {
          groups[0].push(shuffled.pop()!);
        } else {
          groups.push([shuffled.pop()!]);
        }
      }
    }

    // Resolve each group against a guaranteed hostile NPC encounter
    for (const group of groups) {
      const npcNames = [
        "Capitol Alpha Predator Mutt",
        "Swarms of Carnivorous Hornets",
        "Armored Mechanical Stalker Drones",
        "Venomous Shadow Reptiles",
        "Genetically Engineered Frost Beasts",
      ];
      const npcName = prng.pickOne(npcNames);
      const threatLevel = prng.pickWeighted(["moderate", "lethal"], [60, 40]) as "moderate" | "lethal";

      const swarmResult = resolveMuttationSwarm(
        group,
        { name: npcName, threatLevel, powerMultiplier: 1.1 },
        { prng }
      );

      for (const [id, updated] of swarmResult.updatedTributes) {
        updatedTributes.set(id, updated);
      }

      if (swarmResult.fallenTributeIds.length > 0) {
        fallenTributeIds.push(...swarmResult.fallenTributeIds);
      }

      events.push({
        eventId: `event-${gameId.slice(0, 6)}-npcoverload-${eventCounter++}`,
        eventOrder: eventCounter,
        eventCategory: "mutt",
        outcomeType: swarmResult.fallenTributeIds.length > 0 ? "death" : "wound",
        tributeIds: group.map((t) => t.id),
        killerIds: null,
        victimIds: swarmResult.fallenTributeIds.length > 0 ? swarmResult.fallenTributeIds : null,
        stateDeltas: swarmResult.stateDeltas,
        thematicContext: {
          npcName,
          locationDescription: `An overwhelming swarm of ${npcName} ambushes the tributes simultaneously!`,
        },
      });
    }

    return {
      events,
      fallenTributeIds,
      updatedTributes,
      updatedAlliances,
    };
  }
}

// ==========================================
// 2. Arena Cataclysm Resolver
// ==========================================

/**
 * Cataclysm Phase: An arena-wide environmental disaster sweeps across the entire map
 * (e.g. Flash Tidal Surge, Corrosive Acid Fog, Wildfire Wall).
 * Every tribute must navigate the hazard; tools and armor mitigate damage.
 */
export class CataclysmResolver implements BasePhaseResolver {
  readonly phaseType = "cataclysm" as const;

  resolvePhase(context: PhaseContext): PhaseResolutionOutput {
    const {
      gameId,
      allTributes,
      alliances,
      prng,
    } = context;

    const updatedTributes = new Map<string, EngineTribute>(allTributes);
    const updatedAlliances = new Map(alliances);
    const fallenTributeIds: string[] = [];
    const events: EngineEventOutcome[] = [];
    let eventCounter = 1;

    const livingTributes = Array.from(updatedTributes.values()).filter(
      (t) => t.status === "alive"
    );

    if (livingTributes.length === 0) {
      return { events, fallenTributeIds, updatedTributes, updatedAlliances };
    }

    const disasterNames = [
      "Corrosive Acid Fog Wave",
      "Massive Arena Wildfire Wall",
      "Flash Tidal Surge Cataclysm",
      "Toxic Smog Eruption",
      "Sub-Zero Flash Blizzard",
    ];
    const disasterName = prng.pickOne(disasterNames);

    // Resolve all living tributes with Arena Hazard AoE calculus
    const hazardResult = resolveArenaHazardAoE(
      livingTributes,
      { name: disasterName, description: `Caught in the center of ${disasterName}` },
      { prng }
    );

    for (const [id, updated] of hazardResult.updatedTributes) {
      updatedTributes.set(id, updated);
    }

    if (hazardResult.fallenTributeIds.length > 0) {
      fallenTributeIds.push(...hazardResult.fallenTributeIds);
    }

    for (const tribute of livingTributes) {
      const delta = hazardResult.stateDeltas[tribute.id];
      const isDead = delta?.isFatal ?? false;

      events.push({
        eventId: `event-${gameId.slice(0, 6)}-cataclysm-${eventCounter++}`,
        eventOrder: eventCounter,
        eventCategory: "hazard",
        outcomeType: isDead ? "death" : "wound",
        tributeIds: [tribute.id],
        killerIds: null,
        victimIds: isDead ? [tribute.id] : null,
        stateDeltas: {
          [tribute.id]: delta,
        },
        thematicContext: {
          hazardName: disasterName,
          locationDescription: `Caught in the center of the ${disasterName}.`,
        },
      });
    }

    return {
      events,
      fallenTributeIds,
      updatedTributes,
      updatedAlliances,
    };
  }
}

// ==========================================
// 3. Generic Arena Event Resolver
// ==========================================

export class ArenaEventResolver implements BasePhaseResolver {
  readonly phaseType = "arena_event" as const;

  resolvePhase(context: PhaseContext): PhaseResolutionOutput {
    // Delegates to Cataclysm by default
    const cataclysm = new CataclysmResolver();
    return cataclysm.resolvePhase(context);
  }
}
