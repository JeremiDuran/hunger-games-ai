/**
 * Hunger Games AI — Narrative Storytelling Schemas
 * Layered validation for /api/narrative endpoint and AI prompt generation.
 */

import { z } from "zod";
import { NarrativeVoice } from "@/types/setup";
import {
  EventCategory,
  OutcomeType,
} from "@/lib/engine/types";

// ==========================================
// 1. Participant & Biometrics Schemas
// ==========================================

export const PARTICIPANT_ROLES = [
  "killer",
  "victim",
  "attacker",
  "defender",
  "ally",
  "scavenger",
  "witness",
  "solo",
] as const;

export type ParticipantRole = (typeof PARTICIPANT_ROLES)[number];

export const narrativeParticipantSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  district: z.number().int().min(1).max(24),
  survival: z.number().min(0).max(100).default(50),
  physicalTag: z.string().default("unscathed"),
  sanity: z.number().min(0).max(100).default(50),
  mentalTag: z.string().default("composed"),
  inventory: z.array(z.string()).default([]),
  role: z.enum(PARTICIPANT_ROLES).optional(),
});

export type NarrativeParticipant = z.infer<typeof narrativeParticipantSchema>;

// ==========================================
// 2. State Delta Schema
// ==========================================

export const narrativeStateDeltaSchema = z.object({
  fatalities: z.array(z.string()).default([]),
  healthChanges: z.record(z.string(), z.number()).default({}),
  sanityChanges: z.record(z.string(), z.number()).default({}),
  itemsGained: z.record(z.string(), z.array(z.string())).optional(),
  itemsLost: z.record(z.string(), z.array(z.string())).optional(),
  lootTransferred: z.record(z.string(), z.array(z.string())).optional(),
  itemsDestroyed: z.array(z.string()).optional(),
  narrativeNotes: z.string().optional(),
});

export type NarrativeStateDelta = z.infer<typeof narrativeStateDeltaSchema>;

// ==========================================
// 3. Thematic Context Schema
// ==========================================

export const narrativeThematicContextSchema = z.object({
  cornucopiaDescription: z.string().optional(),
  itemContested: z.string().optional(),
  itemDiscovered: z.string().optional(),
  npcName: z.string().optional(),
  hazardName: z.string().optional(),
  locationDescription: z.string().optional(),
  specialRulesTriggered: z.array(z.string()).optional(),
});

export type NarrativeThematicContext = z.infer<
  typeof narrativeThematicContextSchema
>;

// ==========================================
// 4. Full Narrative Request Schema
// ==========================================

export const NARRATIVE_VOICES = [
  "novel_cinematic",
  "capitol_broadcast",
  "gamemaker_log",
] as const satisfies readonly [NarrativeVoice, ...NarrativeVoice[]];

export const EVENT_CATEGORIES = [
  "combat",
  "forage",
  "hazard",
  "sponsor",
  "mutt",
  "social",
] as const satisfies readonly [EventCategory, ...EventCategory[]];

export const OUTCOME_TYPES = [
  "death",
  "wound",
  "loot",
  "flee",
  "alliance",
  "idle",
] as const satisfies readonly [OutcomeType, ...OutcomeType[]];

export const narrativeRequestSchema = z.object({
  simulationTitle: z.string().min(1).default("The Hunger Games"),
  arenaName: z.string().min(1).default("The Arena"),
  arenaLore: z.string().default(""),
  narrativeVoice: z.enum(NARRATIVE_VOICES).default("novel_cinematic"),
  eventCategory: z.enum(EVENT_CATEGORIES).default("combat"),
  outcomeType: z.enum(OUTCOME_TYPES).default("idle"),
  participants: z.array(narrativeParticipantSchema).min(1),
  stateDelta: narrativeStateDeltaSchema.default({
    fatalities: [],
    healthChanges: {},
    sanityChanges: {},
  }),
  thematicContext: narrativeThematicContextSchema.optional(),
  model: z.string().optional(),
});

export type NarrativeRequest = z.infer<typeof narrativeRequestSchema>;
