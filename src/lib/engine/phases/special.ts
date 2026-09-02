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
import {
  CATACLYSM_BASE_DAMAGE,
  CATACLYSM_DAMAGE_MULTIPLIER,
} from "../constants";
import {
  synthesizeArenaCataclysm,
  synthesizeThemedArenaNpcs,
} from "../thematics/arena-synthesizer";
import { synthesizeNpcBatchFromDescription } from "../thematics/npc-generator";

// ==========================================
// 1. Themed NPC Overload Resolver
// ==========================================

/**
 * NPC Overload Phase: Synthesizes an in-memory batch of themed apex predators/mutts
 * tailored to the arena description. Every single encounter in this phase is guaranteed
 * to feature these themed beasts.
 */
export class NpcOverloadResolver implements BasePhaseResolver {
  readonly phaseType = "npc_overload" as const;

  resolvePhase(context: PhaseContext): PhaseResolutionOutput {
    const {
      gameId,
      allTributes,
      alliances,
      settings,
      prng,
      arenaName,
      arenaDescription,
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

    // 1. Synthesize themed batch of mutts in memory for this phase
    const existingNames = (settings.customNpcs ?? []).map((n) => n.name);
    const themedNpcBatch = synthesizeNpcBatchFromDescription({
      arenaName,
      arenaDescription,
      prng,
      count: 4,
      existingNames,
    });

    // Save batch to settings.customNpcs so they persist and can recur in future phases
    if (!settings.customNpcs) {
      settings.customNpcs = [];
    }
    for (const item of themedNpcBatch) {
      if (!settings.customNpcs.some((c) => c.name === item.name)) {
        settings.customNpcs.push(item);
      }
    }

    // 2. Partition living tributes into groups of 1 to 4
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
        // 1 tribute remaining: attach to previous group if small, else solo
        if (groups.length > 0 && groups[0].length < 4) {
          groups[0].push(shuffled.pop()!);
        } else {
          groups.push([shuffled.pop()!]);
        }
      }
    }

    // 3. Resolve each encounter against a themed NPC from the batch
    for (const group of groups) {
      const npc = prng.pickOne(themedNpcBatch);
      const threatLevel = prng.pickWeighted(["moderate", "lethal"], [50, 50]) as "moderate" | "lethal";

      const swarmResult = resolveMuttationSwarm(
        group,
        { name: npc.name, threatLevel, powerMultiplier: 1.25 },
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
          npcName: npc.name,
          locationDescription: npc.description
            ? `[ARENA MUTTATION OVERLOAD]: ${npc.name} (${npc.description}) converges aggressively upon the sector!`
            : `[ARENA MUTTATION OVERLOAD]: An apex pack of ${npc.name} converges aggressively upon the sector!`,
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
// 2. Themed Arena Cataclysm Resolver
// ==========================================

/**
 * Cataclysm Phase: An arena-wide environmental disaster tailored to the arena description
 * sweeps across the map with elevated lethality. Every tribute must navigate the hazard;
 * tools and armor mitigate damage.
 */
export class CataclysmResolver implements BasePhaseResolver {
  readonly phaseType = "cataclysm" as const;

  resolvePhase(context: PhaseContext): PhaseResolutionOutput {
    const {
      gameId,
      allTributes,
      alliances,
      prng,
      arenaName,
      arenaDescription,
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

    // 1. Procedurally synthesize arena disaster from arena lore
    const cataclysm = synthesizeArenaCataclysm({
      arenaName,
      arenaDescription,
      prng,
    });

    // 2. Resolve all living tributes with elevated Cataclysm damage
    const cataclysmBaseDamage = Math.round(CATACLYSM_BASE_DAMAGE * CATACLYSM_DAMAGE_MULTIPLIER);
    const hazardResult = resolveArenaHazardAoE(
      livingTributes,
      {
        name: cataclysm.name,
        description: cataclysm.description,
        baseDamage: cataclysmBaseDamage,
      },
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
          hazardName: cataclysm.name,
          locationDescription: `[ARENA CATACLYSM]: ${cataclysm.name} sweeps the sector. ${cataclysm.description}`,
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
    // Alternate between Cataclysm or NPC Overload
    const chooseCataclysm = context.prng.nextBoolean(0.5);
    if (chooseCataclysm) {
      const cataclysm = new CataclysmResolver();
      return cataclysm.resolvePhase(context);
    } else {
      const npcOverload = new NpcOverloadResolver();
      return npcOverload.resolvePhase(context);
    }
  }
}
