/**
 * Hunger Games AI — AI Storyteller Payload Serializer
 * Pure transformation from procedural EngineEventOutcome to validated NarrativeRequest for /api/narrative.
 */

import { NarrativeVoice } from "@/types/setup";
import {
  EngineEventOutcome,
  EngineTribute,
  EventCategory,
  OutcomeType,
} from "./types";
import {
  NarrativeRequest,
  NarrativeParticipant,
  NarrativeStateDelta,
  NarrativeThematicContext,
  ParticipantRole,
  narrativeRequestSchema,
} from "@/lib/schemas/narrative";

export interface NarrativeSerializationContext {
  simulationTitle: string;
  arenaName: string;
  arenaDescription: string;
  narrativeVoice: NarrativeVoice;
  tributes: Map<string, EngineTribute> | Record<string, EngineTribute>;
}

/**
 * Helper to get an EngineTribute from either a Map or Record by ID.
 */
function getTribute(
  tributes: Map<string, EngineTribute> | Record<string, EngineTribute>,
  id: string
): EngineTribute | undefined {
  if (tributes instanceof Map) {
    return tributes.get(id);
  }
  return tributes[id];
}

/**
 * Computes the narrative participant role based on event category, killer/victim arrays, and slot position.
 */
export function computeParticipantRole(
  tributeId: string,
  event: EngineEventOutcome,
  participantIndex: number,
  totalParticipants: number
): ParticipantRole {
  // 1. Explicit Killer or Victim roles
  if (event.killerIds && event.killerIds.includes(tributeId)) {
    return "killer";
  }
  if (event.victimIds && event.victimIds.includes(tributeId)) {
    return "victim";
  }

  // 2. Solo encounter
  if (totalParticipants === 1) {
    return event.eventCategory === "forage" ? "scavenger" : "solo";
  }

  // 3. Social / Alliance encounter
  if (event.eventCategory === "social") {
    return "ally";
  }

  // 4. Foraging encounter
  if (event.eventCategory === "forage") {
    return "scavenger";
  }

  // 5. Combat encounter roles by order
  if (event.eventCategory === "combat") {
    if (participantIndex === 0) return "attacker";
    if (participantIndex === 1) return "defender";
    return "witness";
  }

  // 6. Default fallback
  return participantIndex === 0 ? "attacker" : "defender";
}

/**
 * Serializes a raw procedural event outcome into a validated NarrativeRequest for the AI Storyteller.
 */
export function serializeEventToNarrativePayload(
  event: EngineEventOutcome,
  context: NarrativeSerializationContext
): NarrativeRequest {
  const { simulationTitle, arenaName, arenaDescription, narrativeVoice, tributes } = context;

  // 1. Assemble participating tributes
  const participants: NarrativeParticipant[] = [];

  for (let i = 0; i < event.tributeIds.length; i++) {
    const id = event.tributeIds[i];
    const tribute = getTribute(tributes, id);

    if (tribute) {
      const role = computeParticipantRole(id, event, i, event.tributeIds.length);
      const inventoryStrings = tribute.inventory.map((item) =>
        typeof item === "string" ? item : item.name
      );

      participants.push({
        id: tribute.id,
        name: tribute.name,
        district: tribute.district,
        survival: tribute.biometrics.survival,
        physicalTag: tribute.biometrics.physicalTag,
        sanity: tribute.biometrics.sanity,
        mentalTag: tribute.biometrics.mentalTag,
        inventory: inventoryStrings,
        role,
      });
    }
  }

  // If no matching participants found (e.g. mock or special event), provide graceful dummy
  if (participants.length === 0) {
    participants.push({
      id: "unknown-tribute",
      name: "Tribute",
      district: 1,
      survival: 50,
      physicalTag: "unscathed",
      sanity: 50,
      mentalTag: "composed",
      inventory: [],
      role: "solo",
    });
  }

  // 2. Extract State Deltas
  const fatalities: string[] = [];
  const healthChanges: Record<string, number> = {};
  const sanityChanges: Record<string, number> = {};
  const itemsGained: Record<string, string[]> = {};
  const itemsLost: Record<string, string[]> = {};
  const lootTransferred: Record<string, string[]> = {};
  const itemsDestroyed: string[] = [];
  const notesList: string[] = [];

  for (const [tributeId, delta] of Object.entries(event.stateDeltas)) {
    if (delta.isFatal) {
      fatalities.push(tributeId);
    }
    if (delta.survivalDelta !== 0) {
      healthChanges[tributeId] = delta.survivalDelta;
    }
    if (delta.sanityDelta !== 0) {
      sanityChanges[tributeId] = delta.sanityDelta;
    }
    if (delta.itemsGained && delta.itemsGained.length > 0) {
      itemsGained[tributeId] = delta.itemsGained.map((it) =>
        typeof it === "string" ? it : it.name
      );
    }
    if (delta.itemsLost && delta.itemsLost.length > 0) {
      itemsLost[tributeId] = delta.itemsLost.map((it) =>
        typeof it === "string" ? it : it.name
      );
    }
    if (delta.itemsDestroyed && delta.itemsDestroyed.length > 0) {
      itemsDestroyed.push(
        ...delta.itemsDestroyed.map((it) => (typeof it === "string" ? it : it.name))
      );
    }
    if (delta.narrativeNotes) {
      notesList.push(delta.narrativeNotes);
    }
  }

  // Ensure victims in death outcome are included in fatalities
  if (event.outcomeType === "death" && event.victimIds) {
    for (const vId of event.victimIds) {
      if (!fatalities.includes(vId)) {
        fatalities.push(vId);
      }
    }
  }

  const stateDelta: NarrativeStateDelta = {
    fatalities,
    healthChanges,
    sanityChanges,
    ...(Object.keys(itemsGained).length > 0 ? { itemsGained } : {}),
    ...(Object.keys(itemsLost).length > 0 ? { itemsLost } : {}),
    ...(Object.keys(lootTransferred).length > 0 ? { lootTransferred } : {}),
    ...(itemsDestroyed.length > 0 ? { itemsDestroyed } : {}),
    ...(notesList.length > 0 ? { narrativeNotes: notesList.join(" ") } : {}),
  };

  // 3. Assemble Thematic Context
  let thematicContext: NarrativeThematicContext | undefined = undefined;
  if (event.thematicContext) {
    thematicContext = {
      ...(event.thematicContext.itemContested
        ? { itemContested: event.thematicContext.itemContested }
        : {}),
      ...(event.thematicContext.itemDiscovered
        ? { itemDiscovered: event.thematicContext.itemDiscovered }
        : {}),
      ...(event.thematicContext.npcName
        ? { npcName: event.thematicContext.npcName }
        : {}),
      ...(event.thematicContext.hazardName
        ? { hazardName: event.thematicContext.hazardName }
        : {}),
      ...(event.thematicContext.locationDescription
        ? { locationDescription: event.thematicContext.locationDescription }
        : {}),
      ...(event.thematicContext.specialRulesTriggered
        ? { specialRulesTriggered: event.thematicContext.specialRulesTriggered }
        : {}),
    };
  }

  // 4. Construct raw request payload
  const rawPayload: NarrativeRequest = {
    simulationTitle: simulationTitle.trim() || "The Hunger Games",
    arenaName: arenaName.trim() || "The Arena",
    arenaLore: arenaDescription.trim(),
    narrativeVoice,
    eventCategory: event.eventCategory as EventCategory,
    outcomeType: event.outcomeType as OutcomeType,
    participants,
    stateDelta,
    ...(thematicContext ? { thematicContext } : {}),
  };

  // 5. Layered validation defense
  return narrativeRequestSchema.parse(rawPayload);
}
