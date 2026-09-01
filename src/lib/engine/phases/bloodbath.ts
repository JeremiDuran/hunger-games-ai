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
} from "../constants";
import { synthesizeItem } from "../items/synthesizer";
import { resolve1v1Clash } from "../combat/calculus";
import { applyBiometricDelta } from "../biometrics";
import { claimItem } from "../items/lifecycle";

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

    // 2. Resolve Horn Rush Clashes (Contested High-Tier Items & Fatal Clashes)
    const shuffledRushers = prng.shuffle([...rushers]);

    while (shuffledRushers.length > 0) {
      if (shuffledRushers.length === 1) {
        // Lone uncontested rusher loots a high-tier weapon/crate
        const luckyTribute = updatedTributes.get(shuffledRushers.pop()!.id)!;
        const weapon = synthesizeItem({
          arenaDescription,
          arenaName,
          category: "weapon",
          tier: "rare",
          prng,
        });

        const updated = claimItem(weapon, luckyTribute);
        updatedTributes.set(updated.id, updated);

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
            itemContested: weapon.name,
            locationDescription: "At the mouth of the Cornucopia horn.",
          },
        });
      } else {
        // 2 or more rushers clash over a high-tier item
        const t1 = updatedTributes.get(shuffledRushers.pop()!.id)!;
        const t2 = updatedTributes.get(shuffledRushers.pop()!.id)!;

        // Spawn a contested weapon at the horn
        const contestedItem = synthesizeItem({
          arenaDescription,
          arenaName,
          category: "weapon",
          tier: prng.pickWeighted(["uncommon", "rare", "legendary"], [40, 45, 15]),
          prng,
        });

        // Give t1 the contested weapon initially to test armed clash or resolve clash
        const clashResult = resolve1v1Clash(t1, t2, {
          prng,
          lethality: settings.combatLethality,
        });

        let updatedVictor = clashResult.updatedVictor;
        const updatedLoser = clashResult.updatedLoser;

        // Victor loots the contested item from the Cornucopia
        updatedVictor = claimItem(contestedItem, updatedVictor);
        updatedTributes.set(updatedVictor.id, updatedVictor);
        updatedTributes.set(updatedLoser.id, updatedLoser);

        const stateDeltas = { ...clashResult.stateDeltas };
        if (stateDeltas[updatedVictor.id]) {
          stateDeltas[updatedVictor.id].itemsGained = [
            ...(stateDeltas[updatedVictor.id].itemsGained ?? []),
            contestedItem.name,
          ];
        }

        if (clashResult.isFatal) {
          fallenTributeIds.push(updatedLoser.id);
        }

        events.push({
          eventId: `event-${gameId.slice(0, 6)}-bb-${eventCounter}`,
          eventOrder: eventCounter++,
          eventCategory: "combat",
          outcomeType: clashResult.isFatal ? "death" : clashResult.isStandoff ? "idle" : "wound",
          tributeIds: [t1.id, t2.id],
          killerIds: clashResult.isFatal ? [updatedVictor.id] : null,
          victimIds: clashResult.isFatal ? [updatedLoser.id] : null,
          stateDeltas,
          thematicContext: {
            itemContested: contestedItem.name,
            locationDescription: "Contesting weapons at the Cornucopia horn.",
          },
        });
      }
    }

    // 3. Resolve Peripheral Scavenging (Common tools, food, canteens, minor scuffles)
    const shuffledScavengers = prng.shuffle([...scavengers]);

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
          itemContested: lootedItem.name,
          locationDescription: "Along the outer periphery of the Cornucopia circle.",
        },
      });
    }

    // 4. Resolve Perimeter Fleers (Immediate safe sprint into the wilderness)
    for (const fleer of fleers) {
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
