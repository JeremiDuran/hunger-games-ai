/**
 * Hunger Games AI — Day Phase Resolver (Scouting, Foraging, Skirmishes, Sponsor Drops)
 * Procedural daytime resolution using slot-based encounter matchmaking and dynamic branches.
 */

import { BasePhaseResolver, PhaseContext, PhaseResolutionOutput } from "./types";
import {
  EngineTribute,
  EngineEventOutcome,
  TributeStateDelta,
  EncounterSlotFormation,
  EngineAlliance,
  EngineGameSettings,
  ItemCategory,
  ItemTier,
} from "../types";
import { PRNG } from "../prng";
import { partitionTributesIntoEncounters } from "../matchmaker";
import { synthesizeItem } from "../items/synthesizer";
import { resolve1v1Clash, resolvePvEClash } from "../combat/calculus";
import { applyBiometricDelta } from "../biometrics";
import { claimItem, consumeItem } from "../items/lifecycle";
import {
  calculateTributeAffinity,
  createAlliance,
  getTributeAlliance,
  canJoinAlliance,
  recruitTributeToAlliance,
  betrayAlliance,
  evaluateAllianceStrain,
  syncDegradedAlliances,
} from "../alliances";
import {
  SPONSOR_PROBABILITY_FAMINE,
  SPONSOR_PROBABILITY_STANDARD,
  SPONSOR_PROBABILITY_ABUNDANCE,
  MAX_SPONSOR_DROPS_PER_DAY_STANDARD,
  MAX_SPONSOR_DROPS_PER_DAY_ABUNDANCE,
} from "../constants";

export class DayPhaseResolver implements BasePhaseResolver {
  readonly phaseType = "day" as const;

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
    } = context;

    const updatedTributes = new Map<string, EngineTribute>(allTributes);
    const updatedAlliances = new Map(alliances);
    const fallenTributeIds: string[] = [];
    const events: EngineEventOutcome[] = [];
    let eventCounter = 1;

    // Filter alive tributes at start of phase
    const aliveList = Array.from(updatedTributes.values()).filter(
      (t) => t.status === "alive"
    );

    if (aliveList.length === 0) {
      return { events, fallenTributeIds, updatedTributes, updatedAlliances };
    }

    // 1. Partition alive tributes into dynamic slot encounters
    const partition = partitionTributesIntoEncounters({
      gameId,
      dayNumber,
      phaseType: "day",
      aliveTributes: aliveList,
      alliances: updatedAlliances,
      settings,
      prng,
      arenaName,
      arenaDescription,
    });

    // 2. Resolve each slot encounter
    for (const encounter of partition.encounters) {
      const outcome = this.resolveDayEncounter({
        encounter,
        updatedTributes,
        updatedAlliances,
        fallenTributeIds,
        eventCounter: eventCounter++,
        gameId,
        dayNumber,
        settings,
        prng,
        arenaName,
        arenaDescription,
      });

      if (outcome) {
        events.push(outcome);
      }
    }

    // 3. Roll for Daytime Sponsor Drops (rare Capitol gifts)
    if (settings.enableSponsorDrops) {
      const sponsorProb =
        settings.sponsorGenerosity === "abundance"
          ? SPONSOR_PROBABILITY_ABUNDANCE
          : settings.sponsorGenerosity === "famine"
          ? SPONSOR_PROBABILITY_FAMINE
          : SPONSOR_PROBABILITY_STANDARD;

      const maxDrops =
        settings.sponsorGenerosity === "abundance"
          ? MAX_SPONSOR_DROPS_PER_DAY_ABUNDANCE
          : MAX_SPONSOR_DROPS_PER_DAY_STANDARD;

      let dropsAwarded = 0;
      const livingTributes = prng.shuffle(
        Array.from(updatedTributes.values()).filter((t) => t.status === "alive")
      );

      for (const tribute of livingTributes) {
        if (dropsAwarded >= maxDrops) break;

        // Desperate or severely injured tributes attract extra Capitol sponsor sympathy
        const isDesperate =
          tribute.biometrics.survival < 40 ||
          tribute.biometrics.physicalTag === "critically_injured" ||
          tribute.biometrics.physicalTag === "wounded";
        const effectiveProb = isDesperate ? sponsorProb * 1.5 : sponsorProb;

        if (prng.nextBoolean(effectiveProb)) {
          const sponsorEvent = this.resolveSponsorDrop({
            tribute,
            eventOrder: eventCounter++,
            gameId,
            prng,
            arenaName,
            arenaDescription,
            updatedTributes,
          });

          if (sponsorEvent) {
            events.push(sponsorEvent);
            dropsAwarded++;
          }
        }
      }
    }

    const finalAlliances = syncDegradedAlliances(
      updatedAlliances,
      updatedTributes,
      `phase-${gameId.slice(0, 6)}-d${dayNumber}`
    );

    return {
      events,
      fallenTributeIds,
      updatedTributes,
      updatedAlliances: finalAlliances,
    };
  }

  private resolveDayEncounter(params: {
    encounter: EncounterSlotFormation;
    updatedTributes: Map<string, EngineTribute>;
    updatedAlliances: Map<string, EngineAlliance>;
    fallenTributeIds: string[];
    eventCounter: number;
    gameId: string;
    dayNumber: number;
    settings: EngineGameSettings;
    prng: PRNG;
    arenaName: string;
    arenaDescription: string;
  }): EngineEventOutcome | null {
    const {
      encounter,
      updatedTributes,
      updatedAlliances,
      fallenTributeIds,
      eventCounter,
      gameId,
      dayNumber,
      settings,
      prng,
      arenaName,
      arenaDescription,
    } = params;

    const participants = encounter.tributeIds
      .map((id) => updatedTributes.get(id))
      .filter((t): t is EngineTribute => t !== undefined && t.status === "alive");

    if (participants.length === 0) return null;

    // -------------------------------------------------------------
    // Branch A: Solo Encounters (1 Tribute)
    // -------------------------------------------------------------
    if (participants.length === 1) {
      const tribute = participants[0];

      if (encounter.formationType === "solo_pve" && encounter.npcs.length > 0) {
        const npc = encounter.npcs[0];
        const pveResult = resolvePvEClash(
          [tribute],
          { name: npc.name, power: 45, threatLevel: npc.threatLevel },
          { prng }
        );

        for (const [id, updated] of pveResult.updatedTributes) {
          updatedTributes.set(id, updated);
        }
        fallenTributeIds.push(...pveResult.fallenTributeIds);

        return {
          eventId: `event-${gameId.slice(0, 6)}-d-${eventCounter}`,
          eventOrder: eventCounter,
          eventCategory: npc.type === "mutt" ? "mutt" : "hazard",
          outcomeType: pveResult.fallenTributeIds.length > 0 ? "death" : "wound",
          tributeIds: [tribute.id],
          killerIds: null,
          victimIds: pveResult.fallenTributeIds.length > 0 ? pveResult.fallenTributeIds : null,
          stateDeltas: pveResult.stateDeltas,
          thematicContext: {
            npcName: npc.name,
            locationDescription: npc.description
              ? `Navigating territory near ${npc.name}: ${npc.description}`
              : `Navigating territory near ${npc.name}.`,
          },
        };
      }

      if (encounter.formationType === "solo_forage") {
        const isSuccess = prng.nextBoolean(0.7);
        if (isSuccess) {
          const loot = synthesizeItem({
            arenaDescription,
            arenaName,
            category: prng.pickWeighted(["sustenance", "medical", "tool"], [50, 30, 20]),
            tier: "common",
            prng,
          });

          let updated = claimItem(loot, tribute);
          // Eating fresh food restores survival
          updated = applyBiometricDelta(updated, { survivalDelta: 10, sanityDelta: 5 });
          updatedTributes.set(updated.id, updated);

          return {
            eventId: `event-${gameId.slice(0, 6)}-d-${eventCounter}`,
            eventOrder: eventCounter,
            eventCategory: "forage",
            outcomeType: "loot",
            tributeIds: [tribute.id],
            killerIds: null,
            victimIds: null,
            stateDeltas: {
              [tribute.id]: {
                tributeId: tribute.id,
                survivalDelta: 10,
                sanityDelta: 5,
                itemsGained: [loot.name],
                narrativeNotes: `${tribute.name} foraged and secured ${loot.name}.`,
              },
            },
            thematicContext: {
              itemDiscovered: loot.name,
              locationDescription: "Searching the underbrush for survival resources.",
            },
          };
        }

        // Foraging mishap
        const updated = applyBiometricDelta(tribute, { survivalDelta: -8, sanityDelta: -5 });
        updatedTributes.set(updated.id, updated);

        return {
          eventId: `event-${gameId.slice(0, 6)}-d-${eventCounter}`,
          eventOrder: eventCounter,
          eventCategory: "forage",
          outcomeType: "wound",
          tributeIds: [tribute.id],
          killerIds: null,
          victimIds: null,
          stateDeltas: {
            [tribute.id]: {
              tributeId: tribute.id,
              survivalDelta: -8,
              sanityDelta: -5,
              narrativeNotes: `${tribute.name} suffered a mishap while foraging in rough terrain.`,
            },
          },
          thematicContext: {
            locationDescription: "Struggling through thorny briers and unstable ground.",
          },
        };
      }

      if (encounter.formationType === "solo_mishap") {
        const hazardDamage = prng.nextInt(15, 30);
        // Procedural fatality: Survival influences the probability of failing to survive the mishap
        const survivalVulnerability = (100 - tribute.biometrics.survival) / 100;
        const mishapFatalProb = Math.min(0.65, 0.10 + survivalVulnerability * 0.45);
        const isFatal = prng.nextBoolean(mishapFatalProb);

        const updated: EngineTribute = {
          ...applyBiometricDelta(tribute, {
            survivalDelta: isFatal ? -(tribute.biometrics.survival - 1) : -hazardDamage,
            sanityDelta: -20,
            overridePhysicalTag: isFatal ? "fatal" : undefined,
          }),
          status: isFatal ? "dead" : tribute.status,
        };

        updatedTributes.set(updated.id, updated);
        if (isFatal) {
          fallenTributeIds.push(tribute.id);
        }

        return {
          eventId: `event-${gameId.slice(0, 6)}-d-${eventCounter}`,
          eventOrder: eventCounter,
          eventCategory: "hazard",
          outcomeType: isFatal ? "death" : "wound",
          tributeIds: [tribute.id],
          killerIds: null,
          victimIds: isFatal ? [tribute.id] : null,
          stateDeltas: {
            [tribute.id]: {
              tributeId: tribute.id,
              survivalDelta: isFatal ? -(tribute.biometrics.survival - 1) : -hazardDamage,
              sanityDelta: -20,
              isFatal,
              narrativeNotes: isFatal
                ? `${tribute.name} was caught in a lethal arena hazard trap and succumbed to their injuries.`
                : `${tribute.name} triggered an environmental hazard in the arena and sustained severe injuries.`,
            },
          },
          thematicContext: {
            locationDescription: "Trapped amidst dangerous arena machinery, crumbling terrain, and environmental hazards.",
          },
        };
      }

      // Default solo rest
      const updated = applyBiometricDelta(tribute, { survivalDelta: 5, sanityDelta: 8 });
      updatedTributes.set(updated.id, updated);

      return {
        eventId: `event-${gameId.slice(0, 6)}-d-${eventCounter}`,
        eventOrder: eventCounter,
        eventCategory: "social",
        outcomeType: "idle",
        tributeIds: [tribute.id],
        killerIds: null,
        victimIds: null,
        stateDeltas: {
          [tribute.id]: {
            tributeId: tribute.id,
            survivalDelta: 5,
            sanityDelta: 8,
            narrativeNotes: `${tribute.name} found a secure perch and rested quietly.`,
          },
        },
        thematicContext: {
          locationDescription: "Concealed in a secluded shelter.",
        },
      };
    }

    // -------------------------------------------------------------
    // Branch B: Duo Formations (2 Tributes)
    // -------------------------------------------------------------
    if (participants.length === 2) {
      const [t1, t2] = participants;

      if (encounter.formationType === "coop_pve_2" && encounter.npcs.length > 0) {
        const npc = encounter.npcs[0];
        const pveResult = resolvePvEClash(
          [t1, t2],
          { name: npc.name, power: 65, threatLevel: npc.threatLevel },
          { prng }
        );

        for (const [id, updated] of pveResult.updatedTributes) {
          updatedTributes.set(id, updated);
        }
        fallenTributeIds.push(...pveResult.fallenTributeIds);

        return {
          eventId: `event-${gameId.slice(0, 6)}-d-${eventCounter}`,
          eventOrder: eventCounter,
          eventCategory: npc.type === "mutt" ? "mutt" : "hazard",
          outcomeType: pveResult.fallenTributeIds.length > 0 ? "death" : "wound",
          tributeIds: [t1.id, t2.id],
          killerIds: null,
          victimIds: pveResult.fallenTributeIds.length > 0 ? pveResult.fallenTributeIds : null,
          stateDeltas: pveResult.stateDeltas,
          thematicContext: {
            npcName: npc.name,
            locationDescription: npc.description
              ? `Fighting together against ${npc.name}: ${npc.description}`
              : `Fighting together against ${npc.name}.`,
          },
        };
      }

      if (encounter.formationType === "allied_camp_2") {
        const alliance = getTributeAlliance(updatedAlliances, t1.id);
        if (alliance) {
          const livingCount = Array.from(updatedTributes.values()).filter((t) => t.status === "alive").length;
          const strain = evaluateAllianceStrain(alliance, updatedTributes, livingCount, { settings, prng });

          if (strain.shouldBetray && strain.potentialBetrayerId && prng.nextBoolean(0.65)) {
            const betrayer = updatedTributes.get(strain.potentialBetrayerId)!;
            const victim = betrayer.id === t1.id ? t2 : t1;

            const clash = resolve1v1Clash(betrayer, victim, {
              prng,
              lethality: settings.combatLethality,
              isAmbush: true,
            });

            updatedTributes.set(clash.updatedVictor.id, clash.updatedVictor);
            updatedTributes.set(clash.updatedLoser.id, clash.updatedLoser);

            if (clash.isFatal) {
              fallenTributeIds.push(clash.updatedLoser.id);
            }

            const updatedAlliance = betrayAlliance(
              alliance,
              betrayer.id,
              `phase-${gameId.slice(0, 6)}-d${dayNumber}`
            );
            updatedAlliances.set(updatedAlliance.id, updatedAlliance);

            return {
              eventId: `event-${gameId.slice(0, 6)}-d-${eventCounter}`,
              eventOrder: eventCounter,
              eventCategory: "social",
              outcomeType: clash.isFatal ? "death" : "wound",
              tributeIds: [betrayer.id, victim.id],
              killerIds: clash.isFatal ? [betrayer.id] : null,
              victimIds: clash.isFatal ? [victim.id] : null,
              stateDeltas: clash.stateDeltas,
              thematicContext: {
                locationDescription: `${betrayer.name} betrayed and struck down ${victim.name} during daytime scouting.`,
              },
            };
          }
        }

        const up1 = applyBiometricDelta(t1, { sanityDelta: 10 });
        const up2 = applyBiometricDelta(t2, { sanityDelta: 10 });
        updatedTributes.set(up1.id, up1);
        updatedTributes.set(up2.id, up2);

        return {
          eventId: `event-${gameId.slice(0, 6)}-d-${eventCounter}`,
          eventOrder: eventCounter,
          eventCategory: "social",
          outcomeType: "idle",
          tributeIds: [t1.id, t2.id],
          killerIds: null,
          victimIds: null,
          stateDeltas: {
            [t1.id]: { tributeId: t1.id, survivalDelta: 0, sanityDelta: 10 },
            [t2.id]: { tributeId: t2.id, survivalDelta: 0, sanityDelta: 10 },
          },
          thematicContext: {
            locationDescription: "Allies scouting together in relative safety.",
          },
        };
      }

      if (encounter.formationType === "peaceful_encounter_2") {
        const affinity = calculateTributeAffinity(t1, t2);
        const existingA1 = getTributeAlliance(updatedAlliances, t1.id);
        const existingA2 = getTributeAlliance(updatedAlliances, t2.id);
        const totalAlive = Array.from(updatedTributes.values()).filter((t) => t.status === "alive").length;

        // Case 1: Both unallied -> form new duo if affinity is high
        if (!existingA1 && !existingA2 && affinity >= 50 && prng.nextBoolean(0.65)) {
          const allianceName =
            t1.district === t2.district ? `District ${t1.district} Duo` : "Survival Pact";
          const newAlliance = createAlliance(gameId, [t1.id, t2.id], null, undefined, allianceName);
          updatedAlliances.set(newAlliance.id, newAlliance);

          const up1 = applyBiometricDelta(t1, { sanityDelta: 15 });
          const up2 = applyBiometricDelta(t2, { sanityDelta: 15 });
          updatedTributes.set(up1.id, up1);
          updatedTributes.set(up2.id, up2);

          return {
            eventId: `event-${gameId.slice(0, 6)}-d-${eventCounter}`,
            eventOrder: eventCounter,
            eventCategory: "social",
            outcomeType: "alliance",
            tributeIds: [t1.id, t2.id],
            killerIds: null,
            victimIds: null,
            stateDeltas: {
              [t1.id]: { tributeId: t1.id, survivalDelta: 0, sanityDelta: 15 },
              [t2.id]: { tributeId: t2.id, survivalDelta: 0, sanityDelta: 15 },
            },
            thematicContext: {
              locationDescription: `${t1.name} and ${t2.name} agreed to form a mutual survival pact.`,
            },
          };
        }

        // Case 2: T1 allied, T2 unallied -> recruit T2 into T1's alliance if permitted by size limits
        if (existingA1 && !existingA2 && canJoinAlliance(existingA1, t2, totalAlive) && affinity >= 60 && prng.nextBoolean(0.5)) {
          const expandedAlliance = recruitTributeToAlliance(existingA1, t2.id);
          updatedAlliances.set(expandedAlliance.id, expandedAlliance);

          const up2 = applyBiometricDelta(t2, { sanityDelta: 15 });
          updatedTributes.set(up2.id, up2);

          return {
            eventId: `event-${gameId.slice(0, 6)}-d-${eventCounter}`,
            eventOrder: eventCounter,
            eventCategory: "social",
            outcomeType: "alliance",
            tributeIds: [t1.id, t2.id],
            killerIds: null,
            victimIds: null,
            stateDeltas: {
              [t2.id]: { tributeId: t2.id, survivalDelta: 0, sanityDelta: 15 },
            },
            thematicContext: {
              locationDescription: `${t2.name} was recruited into ${t1.name}'s alliance (${existingA1.name ?? "Pack"}).`,
            },
          };
        }

        return {
          eventId: `event-${gameId.slice(0, 6)}-d-${eventCounter}`,
          eventOrder: eventCounter,
          eventCategory: "social",
          outcomeType: "idle",
          tributeIds: [t1.id, t2.id],
          killerIds: null,
          victimIds: null,
          stateDeltas: {},
          thematicContext: {
            locationDescription: `${t1.name} and ${t2.name} crossed paths and cautiously separated without violence.`,
          },
        };
      }

      // Default 1v1 duel
      const clash = resolve1v1Clash(t1, t2, {
        prng,
        lethality: settings.combatLethality,
      });

      updatedTributes.set(clash.updatedVictor.id, clash.updatedVictor);
      updatedTributes.set(clash.updatedLoser.id, clash.updatedLoser);

      if (clash.isFatal) {
        fallenTributeIds.push(clash.updatedLoser.id);
      }

      return {
        eventId: `event-${gameId.slice(0, 6)}-d-${eventCounter}`,
        eventOrder: eventCounter,
        eventCategory: "combat",
        outcomeType: clash.isFatal ? "death" : clash.isStandoff ? "idle" : "wound",
        tributeIds: [t1.id, t2.id],
        killerIds: clash.isFatal ? [clash.victorId] : null,
        victimIds: clash.isFatal ? [clash.loserId] : null,
        stateDeltas: clash.stateDeltas,
        thematicContext: {
          locationDescription: clash.narrativeNotes,
        },
      };
    }

    // -------------------------------------------------------------
    // Branch C: Multi-Tribute Formations (3 or 4 Tributes)
    // -------------------------------------------------------------
    if (encounter.npcs.length > 0) {
      const npc = encounter.npcs[0];
      const pveResult = resolvePvEClash(
        participants,
        { name: npc.name, power: 80, threatLevel: npc.threatLevel },
        { prng }
      );

      for (const [id, updated] of pveResult.updatedTributes) {
        updatedTributes.set(id, updated);
      }
      fallenTributeIds.push(...pveResult.fallenTributeIds);

      return {
        eventId: `event-${gameId.slice(0, 6)}-d-${eventCounter}`,
        eventOrder: eventCounter,
        eventCategory: npc.type === "mutt" ? "mutt" : "hazard",
        outcomeType: pveResult.fallenTributeIds.length > 0 ? "death" : "wound",
        tributeIds: participants.map((p) => p.id),
        killerIds: null,
        victimIds: pveResult.fallenTributeIds.length > 0 ? pveResult.fallenTributeIds : null,
        stateDeltas: pveResult.stateDeltas,
        thematicContext: {
          npcName: npc.name,
          locationDescription: npc.description
            ? `Multi-tribute confrontation against ${npc.name}: ${npc.description}`
            : `Multi-tribute confrontation against ${npc.name}.`,
        },
      };
    }

    // Multi-tribute PvP clash: Pick primary attacker and defender
    const shuffled = prng.shuffle([...participants]);
    const primaryA = shuffled[0];
    const primaryB = shuffled[1];

    const multiClash = resolve1v1Clash(primaryA, primaryB, {
      prng,
      lethality: settings.combatLethality,
    });

    updatedTributes.set(multiClash.updatedVictor.id, multiClash.updatedVictor);
    updatedTributes.set(multiClash.updatedLoser.id, multiClash.updatedLoser);

    if (multiClash.isFatal) {
      fallenTributeIds.push(multiClash.updatedLoser.id);
    }

    // Other bystander participants suffer tension / adrenaline
    const bystanderDeltas: Record<string, TributeStateDelta> = {};
    for (let i = 2; i < shuffled.length; i++) {
      const bystander = shuffled[i];
      const updated = applyBiometricDelta(bystander, { sanityDelta: -5 });
      updatedTributes.set(updated.id, updated);
      bystanderDeltas[bystander.id] = {
        tributeId: bystander.id,
        survivalDelta: 0,
        sanityDelta: -5,
      };
    }

    return {
      eventId: `event-${gameId.slice(0, 6)}-d-${eventCounter}`,
      eventOrder: eventCounter,
      eventCategory: "combat",
      outcomeType: multiClash.isFatal ? "death" : "wound",
      tributeIds: participants.map((p) => p.id),
      killerIds: multiClash.isFatal ? [multiClash.victorId] : null,
      victimIds: multiClash.isFatal ? [multiClash.loserId] : null,
      stateDeltas: { ...multiClash.stateDeltas, ...bystanderDeltas },
      thematicContext: {
        locationDescription: `Multi-tribute arena clash involving ${participants.map((p) => p.name).join(", ")}.`,
      },
    };
  }

  private resolveSponsorDrop(params: {
    tribute: EngineTribute;
    eventOrder: number;
    gameId: string;
    prng: PRNG;
    arenaName: string;
    arenaDescription: string;
    updatedTributes: Map<string, EngineTribute>;
  }): EngineEventOutcome | null {
    const {
      tribute,
      eventOrder,
      gameId,
      prng,
      arenaName,
      arenaDescription,
      updatedTributes,
    } = params;

    const needsMedical =
      tribute.biometrics.survival < 40 ||
      tribute.biometrics.physicalTag === "critically_injured" ||
      tribute.biometrics.physicalTag === "wounded";

    const sponsorCategory: ItemCategory = needsMedical
      ? "medical"
      : (prng.pickWeighted(["sustenance", "weapon", "armor", "tool"], [40, 25, 20, 15]) as ItemCategory);

    const tier: ItemTier = prng.pickWeighted(["uncommon", "rare", "legendary"], [60, 30, 10]) as ItemTier;

    const sponsorItem = synthesizeItem({
      arenaDescription,
      arenaName,
      category: sponsorCategory,
      tier,
      prng,
    });

    let updated = claimItem(sponsorItem, tribute);

    // If medical or sustenance, auto-consume if injured
    let recoveryNotes = "";
    const isConsumed = (sponsorCategory === "medical" || sponsorCategory === "sustenance") && needsMedical;
    if (isConsumed) {
      const consumeResult = consumeItem(sponsorItem.id, updated);
      updated = consumeResult.updatedTribute;
      recoveryNotes = ` (+${consumeResult.recoveryDelta.survivalDelta} Survival)`;
    }

    updatedTributes.set(updated.id, updated);

    return {
      eventId: `event-${gameId.slice(0, 6)}-sponsor-${eventOrder}`,
      eventOrder,
      eventCategory: "sponsor",
      outcomeType: "loot",
      tributeIds: [tribute.id],
      killerIds: null,
      victimIds: null,
      stateDeltas: {
        [tribute.id]: {
          tributeId: tribute.id,
          survivalDelta: updated.biometrics.survival - tribute.biometrics.survival,
          sanityDelta: 10,
          itemsGained: [sponsorItem.name],
          itemsConsumed: isConsumed ? [sponsorItem.name] : undefined,
          narrativeNotes: `A silver Capitol parachute drifted down delivering ${sponsorItem.name} to ${tribute.name}${recoveryNotes}.`,
        },
      },
      thematicContext: {
        itemDiscovered: sponsorItem.name,
        locationDescription: "A silver sponsor parachute landing from above.",
      },
    };
  }
}
