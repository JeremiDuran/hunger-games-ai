/**
 * Hunger Games AI — Night Phase Resolver (Camps, Hypothermia, Night Mutts, Fallen Anthem)
 * Procedural night cycle evaluating encampments, environmental exposure, nocturnal threats, and anthem recaps.
 */

import { BasePhaseResolver, PhaseContext, PhaseResolutionOutput } from "./types";
import {
  EngineTribute,
  EngineEventOutcome,
  TributeStateDelta,
  EngineAlliance,
  CustomNPC,
} from "../types";
import { synthesizeSingleNpcFromDescription } from "../thematics/npc-generator";
import {
  NIGHT_CAMP_SANITY_RECOVERY,
} from "../constants";
import {
  getTributeAlliance,
  evaluateAllianceStrain,
  betrayAlliance,
  dissolveAlliance,
  syncDegradedAlliances,
} from "../alliances";
import { resolvePvEClash } from "../combat/calculus";
import {
  resolveNightAmbush,
  resolveNightExposure,
} from "../combat/phase-calculus";
import { applyBiometricDelta } from "../biometrics";

export class NightPhaseResolver implements BasePhaseResolver {
  readonly phaseType = "night" as const;

  resolvePhase(context: PhaseContext): PhaseResolutionOutput {
    const {
      gameId,
      dayNumber,
      allTributes,
      alliances,
      settings,
      prng,
      arenaName,
      arenaDescription,
      priorFallenTributeIds = [],
    } = context;

    const updatedTributes = new Map<string, EngineTribute>(allTributes);
    const updatedAlliances = new Map<string, EngineAlliance>(alliances);
    const fallenTributeIds: string[] = [...priorFallenTributeIds];
    const newlyFallenThisNight: string[] = [];
    const events: EngineEventOutcome[] = [];
    let eventCounter = 1;

    const livingTributes = Array.from(updatedTributes.values()).filter(
      (t) => t.status === "alive"
    );

    if (livingTributes.length === 0) {
      return { events, fallenTributeIds, updatedTributes, updatedAlliances };
    }

    // 1. Group tributes by active alliances vs lone individuals
    const processedTributeIds = new Set<string>();

    for (const tribute of livingTributes) {
      if (processedTributeIds.has(tribute.id)) continue;

      const alliance = getTributeAlliance(updatedAlliances, tribute.id);

      if (alliance && alliance.status === "active") {
        const allyMembers = alliance.tributeIds
          .map((id) => updatedTributes.get(id))
          .filter((t): t is EngineTribute => t !== undefined && t.status === "alive");

        if (allyMembers.length >= 2) {
          // Check for Alliance Strain / Betrayal before settling into camp
          const strain = evaluateAllianceStrain(
            alliance,
            updatedTributes,
            livingTributes.length,
            { settings, prng }
          );

          if (strain.shouldBetray && strain.potentialBetrayerId && prng.nextBoolean(0.75)) {
            // Betrayal clash in the camp: Stealth nocturnal ambush
            const betrayer = updatedTributes.get(strain.potentialBetrayerId)!;
            const victimId =
              strain.potentialVictimId ??
              allyMembers.find((m) => m.id !== betrayer.id)?.id;
            const victim = victimId ? updatedTributes.get(victimId) : undefined;

            if (victim) {
              const betrayalClash = resolveNightAmbush(betrayer, victim, {
                prng,
                lethality: settings.combatLethality,
              });

              updatedTributes.set(betrayalClash.updatedVictor.id, betrayalClash.updatedVictor);
              updatedTributes.set(betrayalClash.updatedLoser.id, betrayalClash.updatedLoser);

              if (betrayalClash.isFatal) {
                fallenTributeIds.push(betrayalClash.updatedLoser.id);
                newlyFallenThisNight.push(betrayalClash.updatedLoser.id);
              }

              // Update alliance status to betrayed
              const updatedAlliance = betrayAlliance(
                alliance,
                betrayer.id,
                `phase-${gameId.slice(0, 6)}-d${dayNumber}`
              );
              updatedAlliances.set(updatedAlliance.id, updatedAlliance);

              const reasonText =
                strain.reason === "paranoid_breakdown"
                  ? `Overcome with paranoid terror, ${betrayer.name} ambushed ${victim.name} in the dark.`
                  : `${betrayer.name} ruthlessly struck down ${victim.name} in a cold endgame betrayal.`;

              events.push({
                eventId: `event-${gameId.slice(0, 6)}-night-${eventCounter++}`,
                eventOrder: eventCounter,
                eventCategory: "social",
                outcomeType: betrayalClash.isFatal ? "death" : "wound",
                tributeIds: [betrayer.id, victim.id],
                killerIds: betrayalClash.isFatal ? [betrayer.id] : null,
                victimIds: betrayalClash.isFatal ? [victim.id] : null,
                stateDeltas: betrayalClash.stateDeltas,
                thematicContext: {
                  locationDescription: reasonText,
                },
              });

              allyMembers.forEach((m) => processedTributeIds.add(m.id));
              continue;
            }
          }

          if (strain.shouldDissolve && strain.reason === "peaceful_drift") {
            // Peaceful dissolution due to low cohesion / irreconcilable friction
            const updatedAlliance = dissolveAlliance(
              alliance,
              `phase-${gameId.slice(0, 6)}-d${dayNumber}`
            );
            updatedAlliances.set(updatedAlliance.id, updatedAlliance);

            events.push({
              eventId: `event-${gameId.slice(0, 6)}-night-${eventCounter++}`,
              eventOrder: eventCounter,
              eventCategory: "social",
              outcomeType: "idle",
              tributeIds: allyMembers.map((m) => m.id),
              killerIds: null,
              victimIds: null,
              stateDeltas: {},
              thematicContext: {
                locationDescription: `Tensions and mutual distrust reached a breaking point. ${allyMembers.map((m) => m.name).join(" and ")} dissolved their alliance and parted ways into the dark.`,
              },
            });

            allyMembers.forEach((m) => processedTributeIds.add(m.id));
            continue;
          }

          // Peaceful allied camp: Warmth, security, sanity recovery
          const campDeltas: Record<string, TributeStateDelta> = {};
          for (const member of allyMembers) {
            const updated = applyBiometricDelta(member, {
              sanityDelta: NIGHT_CAMP_SANITY_RECOVERY,
            });
            updatedTributes.set(updated.id, updated);
            campDeltas[member.id] = {
              tributeId: member.id,
              survivalDelta: 0,
              sanityDelta: NIGHT_CAMP_SANITY_RECOVERY,
              narrativeNotes: `${member.name} shared guard duty with allies and rested safely.`,
            };
            processedTributeIds.add(member.id);
          }

          events.push({
            eventId: `event-${gameId.slice(0, 6)}-night-${eventCounter++}`,
            eventOrder: eventCounter,
            eventCategory: "social",
            outcomeType: "idle",
            tributeIds: allyMembers.map((m) => m.id),
            killerIds: null,
            victimIds: null,
            stateDeltas: campDeltas,
            thematicContext: {
              locationDescription: "Around a sheltered campfire in the dark.",
            },
          });
          continue;
        }
      }

      // -------------------------------------------------------------
      // Lone Tribute Night Resolution (Exposure, Cold, Night Stalkers)
      // -------------------------------------------------------------
      processedTributeIds.add(tribute.id);

      // Check for Night Mutt Stalker Attack
      const canMuttAttack =
        settings.enableMuttations &&
        (settings.muttationTiming === "night_stalkers" || livingTributes.length <= 3);

      if (canMuttAttack && prng.nextBoolean(0.2)) {
        let mutt: CustomNPC;
        const customNpcs = settings.customNpcs ?? [];
        if (customNpcs.length > 0 && prng.nextBoolean(0.5)) {
          mutt = prng.pickOne(customNpcs);
        } else {
          mutt = synthesizeSingleNpcFromDescription({
            arenaName,
            arenaDescription,
            prng,
            existingNames: customNpcs.map((n) => n.name),
          });
          if (!settings.customNpcs) settings.customNpcs = [];
          settings.customNpcs.push(mutt);
        }

        const stalkerResult = resolvePvEClash(
          [tribute],
          { name: mutt.name, power: 50, threatLevel: "moderate" },
          { prng }
        );

        for (const [id, updated] of stalkerResult.updatedTributes) {
          updatedTributes.set(id, updated);
        }

        if (stalkerResult.fallenTributeIds.length > 0) {
          fallenTributeIds.push(...stalkerResult.fallenTributeIds);
          newlyFallenThisNight.push(...stalkerResult.fallenTributeIds);
        }

        events.push({
          eventId: `event-${gameId.slice(0, 6)}-night-${eventCounter++}`,
          eventOrder: eventCounter,
          eventCategory: "mutt",
          outcomeType: stalkerResult.fallenTributeIds.length > 0 ? "death" : "wound",
          tributeIds: [tribute.id],
          killerIds: null,
          victimIds: stalkerResult.fallenTributeIds.length > 0 ? stalkerResult.fallenTributeIds : null,
          stateDeltas: stalkerResult.stateDeltas,
          thematicContext: {
            npcName: mutt.name,
            locationDescription: mutt.description
              ? `Stalked in the pitch darkness by ${mutt.name}: ${mutt.description}`
              : `Stalked by ${mutt.name} in pitch darkness.`,
          },
        });
        continue;
      }

      // Environmental Exposure / Cold Evaluation using specialized Night Exposure calculus
      const exposureResult = resolveNightExposure(tribute, {
        prng,
        isCampedWithAllies: false,
      });

      updatedTributes.set(exposureResult.updatedTribute.id, exposureResult.updatedTribute);

      if (exposureResult.isFatal) {
        fallenTributeIds.push(exposureResult.updatedTribute.id);
        newlyFallenThisNight.push(exposureResult.updatedTribute.id);
      }

      events.push({
        eventId: `event-${gameId.slice(0, 6)}-night-${eventCounter++}`,
        eventOrder: eventCounter,
        eventCategory: "hazard",
        outcomeType: exposureResult.isFatal ? "death" : "wound",
        tributeIds: [tribute.id],
        killerIds: null,
        victimIds: exposureResult.isFatal ? [tribute.id] : null,
        stateDeltas: {
          [tribute.id]: exposureResult.stateDelta,
        },
        thematicContext: {
          locationDescription: "Huddled in the bitter cold darkness.",
        },
      });
    }

    // 2. The Fallen Anthem Event (Capitol Anthem Broadcast)
    const fallenToday = Array.from(new Set(fallenTributeIds));
    const fallenTodayNames = fallenToday
      .map((id) => allTributes.get(id)?.name)
      .filter(Boolean);

    events.push({
      eventId: `event-${gameId.slice(0, 6)}-anthem-${eventCounter++}`,
      eventOrder: eventCounter,
      eventCategory: "social",
      outcomeType: "idle",
      tributeIds: fallenToday,
      killerIds: null,
      victimIds: null,
      stateDeltas: {},
      thematicContext: {
        locationDescription:
          fallenToday.length > 0
            ? `The Capitol anthem blares across the sky as the faces of ${fallenTodayNames.join(", ")} appear in the stars.`
            : "The Capitol anthem plays in the night sky. No tributes fell today.",
        specialRulesTriggered: ["fallen_anthem_broadcast"],
      },
    });

    const finalAlliances = syncDegradedAlliances(
      updatedAlliances,
      updatedTributes,
      `phase-${gameId.slice(0, 6)}-d${dayNumber}`
    );

    return {
      events,
      fallenTributeIds: fallenToday,
      updatedTributes,
      updatedAlliances: finalAlliances,
    };
  }
}
