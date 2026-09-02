/**
 * Hunger Games AI — Feast Phase Resolver (Cornucopia Supply Call)
 * Procedural resolution of the mid-game Cornucopia Feast, district backpacks, and desperate clashes.
 */

import { BasePhaseResolver, PhaseContext, PhaseResolutionOutput } from "./types";
import {
  EngineTribute,
  EngineEventOutcome,
  TributeStateDelta,
} from "../types";
import {
  FEAST_DESPERATE_SURVIVAL_THRESHOLD,
  FEAST_DESPERATE_ATTENDANCE_PROBABILITY,
  FEAST_STANDARD_ATTENDANCE_PROBABILITY,
} from "../constants";
import { synthesizeItem } from "../items/synthesizer";
import { resolveFeastDuel } from "../combat/phase-calculus";
import { claimItem, consumeItem } from "../items/lifecycle";
import { syncDegradedAlliances } from "../alliances";

export class FeastPhaseResolver implements BasePhaseResolver {
  readonly phaseType = "feast" as const;

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

    // 1. Evaluate Feast Attendance Motivation
    const attendees: EngineTribute[] = [];
    const abstainers: EngineTribute[] = [];

    for (const tribute of livingTributes) {
      const isDesperate =
        tribute.biometrics.survival < FEAST_DESPERATE_SURVIVAL_THRESHOLD ||
        tribute.biometrics.physicalTag === "critically_injured" ||
        tribute.biometrics.physicalTag === "wounded";

      const attendProb = isDesperate
        ? FEAST_DESPERATE_ATTENDANCE_PROBABILITY
        : FEAST_STANDARD_ATTENDANCE_PROBABILITY;

      if (prng.nextBoolean(attendProb)) {
        attendees.push(tribute);
      } else {
        abstainers.push(tribute);
      }
    }

    // 2. Resolve Abstainers (Safely in hiding, avoiding the Cornucopia bloodbath)
    for (const abstainer of abstainers) {
      const stateDelta: Record<string, TributeStateDelta> = {
        [abstainer.id]: {
          tributeId: abstainer.id,
          survivalDelta: 0,
          sanityDelta: 5,
          narrativeNotes: `${abstainer.name} decided the Feast was too dangerous and stayed hidden in the woods.`,
        },
      };

      events.push({
        eventId: `event-${gameId.slice(0, 6)}-feast-${eventCounter++}`,
        eventOrder: eventCounter,
        eventCategory: "social",
        outcomeType: "idle",
        tributeIds: [abstainer.id],
        killerIds: null,
        victimIds: null,
        stateDeltas: stateDelta,
        thematicContext: {
          locationDescription: "Concealed safely away from the Feast invitation.",
        },
      });
    }

    // 3. Resolve Attendees at the Cornucopia Table
    const shuffledAttendees = prng.shuffle([...attendees]);

    while (shuffledAttendees.length > 0) {
      if (shuffledAttendees.length === 1) {
        // Lone uncontested attendee secures their District Backpack!
        const attendee = updatedTributes.get(shuffledAttendees.pop()!.id)!;
        const backpackLoot = synthesizeItem({
          arenaDescription,
          arenaName,
          category: attendee.biometrics.survival < 50 ? "medical" : "weapon",
          tier: "legendary",
          prng,
        });

        let updated = claimItem(backpackLoot, attendee);
        if (backpackLoot.category === "medical" || backpackLoot.category === "sustenance") {
          const consumed = consumeItem(backpackLoot.id, updated);
          updated = consumed.updatedTribute;
        }

        updatedTributes.set(updated.id, updated);

        const delta = updated.biometrics.survival - attendee.biometrics.survival;
        const stateDelta: Record<string, TributeStateDelta> = {
          [updated.id]: {
            tributeId: updated.id,
            survivalDelta: delta,
            sanityDelta: 15,
            itemsGained: [backpackLoot.name],
            narrativeNotes: `${updated.name} sprinted to the Cornucopia table, grabbed the District ${updated.district} backpack containing ${backpackLoot.name}, and escaped.`,
          },
        };

        events.push({
          eventId: `event-${gameId.slice(0, 6)}-feast-${eventCounter++}`,
          eventOrder: eventCounter,
          eventCategory: "forage",
          outcomeType: "loot",
          tributeIds: [updated.id],
          killerIds: null,
          victimIds: null,
          stateDeltas: stateDelta,
          thematicContext: {
            itemContested: backpackLoot.name,
            locationDescription: "At the Cornucopia feast table.",
          },
        });
      } else {
        // 2 or more attendees clash fiercely over the feast backpacks
        const t1 = updatedTributes.get(shuffledAttendees.pop()!.id)!;
        const t2 = updatedTributes.get(shuffledAttendees.pop()!.id)!;

        const backpackItem = synthesizeItem({
          arenaDescription,
          arenaName,
          category: prng.pickWeighted(["medical", "weapon", "armor"], [50, 30, 20]),
          tier: "legendary",
          prng,
        });

        const duelResult = resolveFeastDuel(t1, t2, backpackItem, {
          prng,
          lethality: settings.combatLethality,
        });

        updatedTributes.set(duelResult.updatedVictor.id, duelResult.updatedVictor);
        updatedTributes.set(duelResult.updatedLoser.id, duelResult.updatedLoser);

        if (duelResult.isFatal) {
          fallenTributeIds.push(duelResult.updatedLoser.id);
        }

        events.push({
          eventId: `event-${gameId.slice(0, 6)}-feast-${eventCounter++}`,
          eventOrder: eventCounter,
          eventCategory: "combat",
          outcomeType: duelResult.isFatal ? "death" : "wound",
          tributeIds: [t1.id, t2.id],
          killerIds: duelResult.isFatal ? [duelResult.updatedVictor.id] : null,
          victimIds: duelResult.isFatal ? [duelResult.updatedLoser.id] : null,
          stateDeltas: duelResult.stateDeltas,
          thematicContext: {
            itemContested: backpackItem.name,
            locationDescription: `Fighting violently over the Feast backpacks on the Cornucopia table.`,
          },
        });
      }
    }

    const finalAlliances = syncDegradedAlliances(
      updatedAlliances,
      updatedTributes,
      `phase-${gameId.slice(0, 6)}-feast`
    );

    return {
      events,
      fallenTributeIds,
      updatedTributes,
      updatedAlliances: finalAlliances,
    };
  }
}
