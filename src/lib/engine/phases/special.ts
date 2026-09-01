/**
 * Hunger Games AI — Special Interstitial Phase Resolvers
 * Generic, extensible phase resolvers for Arena Cataclysms, NPC Overloads, and Gamemaker Events.
 */

import { BasePhaseResolver, PhaseContext, PhaseResolutionOutput } from "./types";
import {
  EngineTribute,
  EngineEventOutcome,
} from "../types";
import { resolvePvEClash } from "../combat/calculus";
import { applyBiometricDelta } from "../biometrics";
import { getBestArmor, getBestTool } from "../items/buffs";

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
      const npcPower = group.length * 35 + (threatLevel === "lethal" ? 30 : 15);

      const pveResult = resolvePvEClash(
        group,
        { name: npcName, power: npcPower, threatLevel },
        { prng }
      );

      for (const [id, updated] of pveResult.updatedTributes) {
        updatedTributes.set(id, updated);
      }

      if (pveResult.fallenTributeIds.length > 0) {
        fallenTributeIds.push(...pveResult.fallenTributeIds);
      }

      events.push({
        eventId: `event-${gameId.slice(0, 6)}-npcoverload-${eventCounter++}`,
        eventOrder: eventCounter,
        eventCategory: "mutt",
        outcomeType: pveResult.fallenTributeIds.length > 0 ? "death" : "wound",
        tributeIds: group.map((t) => t.id),
        killerIds: null,
        victimIds: pveResult.fallenTributeIds.length > 0 ? pveResult.fallenTributeIds : null,
        stateDeltas: pveResult.stateDeltas,
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

    // Each tribute or allied group deals with the cataclysm
    for (const tribute of livingTributes) {
      const hasArmor = getBestArmor(tribute.inventory) !== null;
      const hasTool = getBestTool(tribute.inventory) !== null;

      const baseDamage = prng.nextInt(20, 45);
      const mitigation = hasArmor && hasTool ? 0.6 : hasArmor || hasTool ? 0.35 : 0;
      const damage = Math.max(5, Math.round(baseDamage * (1 - mitigation)));

      const updated = applyBiometricDelta(tribute, {
        survivalDelta: -damage,
        sanityDelta: -15,
      });

      updatedTributes.set(updated.id, updated);

      if (updated.status === "dead") {
        fallenTributeIds.push(updated.id);
      }

      events.push({
        eventId: `event-${gameId.slice(0, 6)}-cataclysm-${eventCounter++}`,
        eventOrder: eventCounter,
        eventCategory: "hazard",
        outcomeType: updated.status === "dead" ? "death" : "wound",
        tributeIds: [tribute.id],
        killerIds: null,
        victimIds: updated.status === "dead" ? [tribute.id] : null,
        stateDeltas: {
          [tribute.id]: {
            tributeId: tribute.id,
            survivalDelta: -damage,
            sanityDelta: -15,
            narrativeNotes: `${tribute.name} fought through the devastating ${disasterName}${mitigation > 0 ? " using equipped gear for protection" : ""}.`,
          },
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
