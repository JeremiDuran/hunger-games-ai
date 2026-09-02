/**
 * Hunger Games AI — Bloodbath Phase Resolver (Day 0 Cornucopia Clash vs Fleeing)
 * Procedural resolution of the opening horn rush, peripheral scavenging, and perimeter escapes.
 */

import { BasePhaseResolver, PhaseContext, PhaseResolutionOutput } from "./types";
import {
  EngineTribute,
  EngineEventOutcome,
  TributeStateDelta,
  ItemCategory,
} from "../types";
import { CAREER_DISTRICTS, syncDegradedAlliances } from "../alliances";
import {
  BLOODBATH_CAREER_RUSH_PROBABILITY,
  BLOODBATH_STANDARD_RUSH_PROBABILITY,
  BLOODBATH_SCARED_FLEE_THRESHOLD,
  BLOODBATH_CAREER_SWEEP_CHANCE,
} from "../constants";
import { synthesizeItem } from "../items/synthesizer";
import {
  resolveBloodbathHornClash,
  resolveBloodbathCareerSweep,
} from "../combat/phase-calculus";
import { applyBiometricDelta } from "../biometrics";
import { claimItem } from "../items/lifecycle";
import { synthesizeCornucopiaDescription } from "@/lib/ai";

export type BloodbathTactic = "rush_horn" | "scavenge_periphery" | "flee_wilderness";

interface TributeBloodbathAssignment {
  tribute: EngineTribute;
  tactic: BloodbathTactic;
}

export class BloodbathResolver implements BasePhaseResolver {
  readonly phaseType = "bloodbath" as const;

  resolvePhase(context: PhaseContext): PhaseResolutionOutput {
    const {
      gameId,
      aliveTributes,
      allTributes,
      alliances,
      settings,
      prng,
      arenaName,
      arenaDescription,
    } = context;

    const cornucopiaDescription =
      context.cornucopiaDescription ||
      synthesizeCornucopiaDescription(arenaName, arenaDescription);

    const updatedTributes = new Map<string, EngineTribute>(allTributes);
    const updatedAlliances = new Map(alliances);
    const fallenTributeIds: string[] = [];
    const events: EngineEventOutcome[] = [];
    let eventCounter = 1;

    // 1. Assign opening tactic for each alive tribute
    const assignments: TributeBloodbathAssignment[] = aliveTributes.map((tribute) => {
      const isCareer = (CAREER_DISTRICTS as readonly number[]).includes(tribute.district);
      const isScared = tribute.biometrics.sanity < BLOODBATH_SCARED_FLEE_THRESHOLD;

      let tactic: BloodbathTactic;

      if (isCareer) {
        tactic = prng.nextBoolean(BLOODBATH_CAREER_RUSH_PROBABILITY)
          ? "rush_horn"
          : "scavenge_periphery";
      } else if (isScared) {
        tactic = prng.nextBoolean(0.8) ? "flee_wilderness" : "scavenge_periphery";
      } else {
        const rushProb =
          settings.combatLethality === "high_bloodbath"
            ? BLOODBATH_STANDARD_RUSH_PROBABILITY + 0.2
            : settings.combatLethality === "gritty_survival"
            ? BLOODBATH_STANDARD_RUSH_PROBABILITY - 0.2
            : BLOODBATH_STANDARD_RUSH_PROBABILITY;

        if (prng.nextBoolean(rushProb)) {
          tactic = "rush_horn";
        } else if (prng.nextBoolean(0.6)) {
          tactic = "scavenge_periphery";
        } else {
          tactic = "flee_wilderness";
        }
      }

      return { tribute, tactic };
    });

    const rushers = assignments.filter((a) => a.tactic === "rush_horn").map((a) => a.tribute);
    const scavengers = assignments
      .filter((a) => a.tactic === "scavenge_periphery")
      .map((a) => a.tribute);
    const fleers = assignments
      .filter((a) => a.tactic === "flee_wilderness")
      .map((a) => a.tribute);

    // 2. Resolve Horn Rush Clashes (Contested High-Tier Items & Fatal Weapon Strikes)
    const shuffledRushers = prng.shuffle([...rushers]);
    const armedHornVictors: EngineTribute[] = [];

    while (shuffledRushers.length > 0) {
      if (shuffledRushers.length === 1) {
        // Lone uncontested rusher loots a common weapon/crate from the horn
        const luckyTribute = updatedTributes.get(shuffledRushers.pop()!.id)!;
        const weapon = synthesizeItem({
          arenaDescription,
          arenaName,
          category: "weapon",
          tier: "common",
          prng,
        });

        const updated = claimItem(weapon, luckyTribute);
        updatedTributes.set(updated.id, updated);
        armedHornVictors.push(updated);

        const stateDelta: Record<string, TributeStateDelta> = {
          [updated.id]: {
            tributeId: updated.id,
            survivalDelta: 0,
            sanityDelta: 5,
            itemsGained: [weapon.name],
            narrativeNotes: `${updated.name} secured a ${weapon.name} from the Cornucopia horn and retreated.`,
          },
        };

        events.push({
          eventId: `event-${gameId.slice(0, 6)}-bb-${eventCounter}`,
          eventOrder: eventCounter++,
          eventCategory: "forage",
          outcomeType: "loot",
          tributeIds: [updated.id],
          killerIds: null,
          victimIds: null,
          stateDeltas: stateDelta,
          thematicContext: {
            cornucopiaDescription,
            itemContested: weapon.name,
            locationDescription: "At the mouth of the Cornucopia horn.",
          },
        });
      } else {
        // 2 or more rushers clash over a common weapon at the horn
        const t1 = updatedTributes.get(shuffledRushers.pop()!.id)!;
        const t2 = updatedTributes.get(shuffledRushers.pop()!.id)!;

        // Spawn a contested common weapon at the horn
        const contestedItem = synthesizeItem({
          arenaDescription,
          arenaName,
          category: "weapon",
          tier: "common",
          prng,
        });

        // Specialized Bloodbath Horn Clash calculus: Victor wields weapon during strike
        const clashResult = resolveBloodbathHornClash(t1, t2, contestedItem, {
          prng,
          lethality: settings.combatLethality,
        });

        updatedTributes.set(clashResult.updatedVictor.id, clashResult.updatedVictor);
        updatedTributes.set(clashResult.updatedLoser.id, clashResult.updatedLoser);

        if (clashResult.isFatal) {
          fallenTributeIds.push(clashResult.updatedLoser.id);
        }

        armedHornVictors.push(clashResult.updatedVictor);

        events.push({
          eventId: `event-${gameId.slice(0, 6)}-bb-${eventCounter}`,
          eventOrder: eventCounter++,
          eventCategory: "combat",
          outcomeType: clashResult.isFatal ? "death" : clashResult.isStandoff ? "idle" : "wound",
          tributeIds: [t1.id, t2.id],
          killerIds: clashResult.isFatal ? [clashResult.updatedVictor.id] : null,
          victimIds: clashResult.isFatal ? [clashResult.updatedLoser.id] : null,
          stateDeltas: clashResult.stateDeltas,
          thematicContext: {
            cornucopiaDescription,
            itemContested: contestedItem.name,
            locationDescription: "Contesting weapons at the Cornucopia horn.",
          },
        });
      }
    }

    // 3. Career Sweep Wave: Armed Career victors hunt vulnerable scavengers or fleers
    const careerHunters = armedHornVictors.filter(
      (v) => (CAREER_DISTRICTS as readonly number[]).includes(v.district) && v.status === "alive"
    );

    const remainingVulnerableIds = new Set([
      ...scavengers.map((s) => s.id),
      ...fleers.map((f) => f.id),
    ]);

    for (const hunter of careerHunters) {
      if (remainingVulnerableIds.size === 0) break;
      if (!prng.nextBoolean(BLOODBATH_CAREER_SWEEP_CHANCE)) continue;

      const currentHunter = updatedTributes.get(hunter.id);
      if (!currentHunter || currentHunter.status !== "alive") continue;

      const targetId = prng.pickOne(Array.from(remainingVulnerableIds));
      remainingVulnerableIds.delete(targetId);

      const target = updatedTributes.get(targetId);
      if (!target || target.status !== "alive") continue;

      // Execute Career perimeter sweep ambush
      const sweepResult = resolveBloodbathCareerSweep(currentHunter, target, {
        prng,
        lethality: settings.combatLethality,
      });

      updatedTributes.set(sweepResult.updatedVictor.id, sweepResult.updatedVictor);
      updatedTributes.set(sweepResult.updatedLoser.id, sweepResult.updatedLoser);

      if (sweepResult.isFatal) {
        fallenTributeIds.push(sweepResult.updatedLoser.id);
      }

      events.push({
        eventId: `event-${gameId.slice(0, 6)}-bb-${eventCounter}`,
        eventOrder: eventCounter++,
        eventCategory: "combat",
        outcomeType: sweepResult.isFatal ? "death" : "wound",
        tributeIds: [currentHunter.id, target.id],
        killerIds: sweepResult.isFatal ? [sweepResult.updatedVictor.id] : null,
        victimIds: sweepResult.isFatal ? [sweepResult.updatedLoser.id] : null,
        stateDeltas: sweepResult.stateDeltas,
        thematicContext: {
          cornucopiaDescription,
          locationDescription: "Along the bloodied Cornucopia perimeter as tributes attempt to flee.",
        },
      });
    }

    // 4. Resolve Peripheral Scavenging (for remaining alive scavengers)
    const activeScavengers = scavengers.filter((s) => {
      const current = updatedTributes.get(s.id);
      return current && current.status === "alive" && remainingVulnerableIds.has(s.id);
    });

    const shuffledScavengers = prng.shuffle([...activeScavengers]);

    while (shuffledScavengers.length > 0) {
      const current = updatedTributes.get(shuffledScavengers.pop()!.id)!;
      const lootCategory = prng.pickWeighted(
        ["sustenance", "medical", "tool", "weapon"],
        [40, 25, 25, 10]
      ) as ItemCategory;
      const lootedItem = synthesizeItem({
        arenaDescription,
        arenaName,
        category: lootCategory,
        tier: "common",
        prng,
      });

      const updated = claimItem(lootedItem, current);
      updatedTributes.set(updated.id, updated);

      const stateDelta: Record<string, TributeStateDelta> = {
        [updated.id]: {
          tributeId: updated.id,
          survivalDelta: 0,
          sanityDelta: 0,
          itemsGained: [lootedItem.name],
          narrativeNotes: `${updated.name} grabbed a ${lootedItem.name} from the outer perimeter and escaped.`,
        },
      };

      events.push({
        eventId: `event-${gameId.slice(0, 6)}-bb-${eventCounter}`,
        eventOrder: eventCounter++,
        eventCategory: "forage",
        outcomeType: "loot",
        tributeIds: [updated.id],
        killerIds: null,
        victimIds: null,
        stateDeltas: stateDelta,
        thematicContext: {
          cornucopiaDescription,
          itemContested: lootedItem.name,
          locationDescription: "Along the outer periphery of the Cornucopia circle.",
        },
      });
    }

    // 5. Resolve Perimeter Fleers (for remaining alive fleers)
    const activeFleers = fleers.filter((f) => {
      const current = updatedTributes.get(f.id);
      return current && current.status === "alive" && remainingVulnerableIds.has(f.id);
    });

    for (const fleer of activeFleers) {
      const current = updatedTributes.get(fleer.id)!;
      // Minor sanity loss from sheer terror of the gong
      const updated = applyBiometricDelta(current, { sanityDelta: -5 });
      updatedTributes.set(updated.id, updated);

      const stateDelta: Record<string, TributeStateDelta> = {
        [updated.id]: {
          tributeId: updated.id,
          survivalDelta: 0,
          sanityDelta: -5,
          narrativeNotes: `${updated.name} stepped off the pedestal and sprinted immediately away into the wilderness.`,
        },
      };

      events.push({
        eventId: `event-${gameId.slice(0, 6)}-bb-${eventCounter}`,
        eventOrder: eventCounter++,
        eventCategory: "social",
        outcomeType: "flee",
        tributeIds: [updated.id],
        killerIds: null,
        victimIds: null,
        stateDeltas: stateDelta,
        thematicContext: {
          cornucopiaDescription,
          locationDescription: "Fleeing into the dense tree line away from the Cornucopia.",
        },
      });
    }

    const finalAlliances = syncDegradedAlliances(
      updatedAlliances,
      updatedTributes,
      `phase-${gameId.slice(0, 6)}-bb`
    );

    return {
      events,
      fallenTributeIds,
      updatedTributes,
      updatedAlliances: finalAlliances,
    };
  }
}
