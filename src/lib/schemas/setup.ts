import { z } from "zod";
import { ArenaSetupState, GamePacing } from "@/types/setup";

/**
 * Validation schema for the Arena & Environment Protocol (Step 1 of Setup)
 * Follows strict database length and non-empty string constraints with i18n message keys.
 */
export const arenaSetupSchema = z.object({
  simulationTitle: z
    .string()
    .trim()
    .min(3, { message: "titleMin" })
    .max(80, { message: "titleMax" }),
  arenaName: z
    .string()
    .trim()
    .min(3, { message: "arenaNameMin" })
    .max(80, { message: "arenaNameMax" }),
  arenaDescription: z
    .string()
    .trim()
    .min(10, { message: "descMin" })
    .max(1200, { message: "descMax" }),
  hazards: z.object({
    enableBloodbath: z.boolean(),
    enableMuttations: z.boolean(),
    enableDisasters: z.boolean(),
    enableSponsorDrops: z.boolean(),
  }),
  pacing: z
    .enum(["instant", "normal", "cinematic"] as const satisfies readonly [GamePacing, ...GamePacing[]])
    .default("cinematic"),
});

export type ArenaSetupSchemaType = z.infer<typeof arenaSetupSchema>;

export type ArenaFieldErrorMap = Partial<{
  simulationTitle: string;
  arenaName: string;
  arenaDescription: string;
  hazards: string;
  pacing: string;
}>;

/**
 * Validates arena setup state and returns formatted field-level error messages.
 */
export function validateArenaFields(state: ArenaSetupState): {
  isValid: boolean;
  errors: ArenaFieldErrorMap;
} {
  const result = arenaSetupSchema.safeParse(state);

  if (result.success) {
    return { isValid: true, errors: {} };
  }

  const errors: ArenaFieldErrorMap = {};
  for (const issue of result.error.issues) {
    const fieldKey = issue.path[0] as keyof ArenaSetupState;
    if (fieldKey && !errors[fieldKey]) {
      errors[fieldKey] = issue.message;
    }
  }

  return { isValid: false, errors };
}

/**
 * Converts camelCase React Arena State into snake_case Supabase `public.games` table insert payload.
 * Provides 100% database schema parity with NOT NULL, JSONB settings, and column constraints.
 */
export function toGameDbPayload(
  arenaState: ArenaSetupState,
  userId: string,
  tributeCount: number = 24
) {
  const validated = arenaSetupSchema.parse(arenaState);

  return {
    user_id: userId,
    title: validated.simulationTitle,
    arena_name: validated.arenaName,
    arena_description: validated.arenaDescription,
    settings: {
      enable_bloodbath: validated.hazards.enableBloodbath,
      enable_muttations: validated.hazards.enableMuttations,
      enable_disasters: validated.hazards.enableDisasters,
      enable_sponsor_drops: validated.hazards.enableSponsorDrops,
      pacing: validated.pacing,
    },
    tribute_count: tributeCount,
    status: "setup" as const,
  };
}

/**
 * Safe parser for sessionStorage drafts to prevent runtime hydration exceptions from corrupt storage.
 */
export function safeParseArenaDraft(raw: unknown): ArenaSetupState | null {
  if (!raw || typeof raw !== "object") return null;
  const result = arenaSetupSchema.safeParse(raw);
  return result.success ? result.data : null;
}

import { TributeData, TributeGender, TributesSetupState } from "@/types/setup";

/**
 * Validation schema for an individual Tribute.
 * Adheres strictly to the Supabase database schema constraints (VARCHAR(280), ENUMs, District 1..24).
 */
export const tributeSchema = z.object({
  id: z.string().min(1),
  name: z
    .string()
    .trim()
    .min(2, { message: "nameMin" })
    .max(60, { message: "nameMax" }),
  district: z.number().int().min(1).max(24),
  gender: z.enum(["male", "female", "non_binary", "unspecified"] as const satisfies readonly [
    TributeGender,
    ...TributeGender[]
  ]),
  personality: z
    .string()
    .trim()
    .max(280, { message: "personalityMax" })
    .default(""),
  physicalAspect: z
    .string()
    .trim()
    .max(280, { message: "physicalMax" })
    .default(""),
  avatarUrl: z.string().nullable().default(null),
});

export const tributesSetupSchema = z.object({
  totalTributes: z.number().int().min(12).max(48),
  tributesPerDistrict: z.union([z.literal(2), z.literal(3), z.literal(4)]),
  districtCount: z.number().int().min(1).max(24),
  tributes: z.array(tributeSchema),
});

export type TributeFieldErrorMap = Record<
  string, // tribute id
  Partial<Record<keyof TributeData, string>>
>;

/**
 * Validates an entire roster of tributes and returns field-level error messages per tribute ID.
 */
export function validateTributesFields(
  tributes: TributeData[],
  expectedCount?: number
): {
  isValid: boolean;
  errors: TributeFieldErrorMap;
} {
  const errors: TributeFieldErrorMap = {};
  let isValid = true;

  if (expectedCount !== undefined && tributes.length !== expectedCount) {
    isValid = false;
  }

  for (const tribute of tributes) {
    const result = tributeSchema.safeParse(tribute);
    if (!result.success) {
      isValid = false;
      const tributeErrors: Partial<Record<keyof TributeData, string>> = {};
      for (const issue of result.error.issues) {
        const fieldKey = issue.path[0] as keyof TributeData;
        if (fieldKey && !tributeErrors[fieldKey]) {
          tributeErrors[fieldKey] = issue.message;
        }
      }
      errors[tribute.id] = tributeErrors;
    }
  }

  return { isValid, errors };
}

/**
 * Converts React TributeData list into Supabase `public.tributes` table insert payloads.
 */
export function toTributesDbPayload(tributes: TributeData[], gameId: string) {
  return tributes.map((t) => {
    const validated = tributeSchema.parse(t);
    return {
      game_id: gameId,
      name: validated.name,
      district: validated.district,
      gender: validated.gender,
      personality: validated.personality || "",
      physical_aspect: validated.physicalAspect || "",
      avatar_url: validated.avatarUrl || null,
      status: "alive" as const,
      kill_count: 0,
      stats: { health: 100, strength: 50, agility: 50, intelligence: 50 },
      inventory: [],
    };
  });
}

/**
 * Safe parser for sessionStorage / localStorage tributes draft with legacy migration fallback.
 */
export function safeParseTributesDraft(raw: unknown): TributesSetupState | null {
  if (!raw || typeof raw !== "object") return null;

  // Direct schema parse
  const directResult = tributesSetupSchema.safeParse(raw);
  if (directResult.success) {
    return directResult.data;
  }

  // Legacy draft compatibility fallback
  const legacyDraft = raw as Record<string, unknown>;
  if (Array.isArray(legacyDraft.tributes) && legacyDraft.tributes.length >= 12) {
    const validTributes = legacyDraft.tributes
      .map((t) => {
        const parsed = tributeSchema.safeParse(t);
        return parsed.success ? parsed.data : null;
      })
      .filter((t): t is TributeData => t !== null);

    if (validTributes.length >= 12 && validTributes.length <= 48) {
      const perDistrict = (legacyDraft.tributesPerDistrict === 3 || legacyDraft.tributesPerDistrict === 4)
        ? (legacyDraft.tributesPerDistrict as 3 | 4)
        : 2;
      const total = validTributes.length;
      const districtCount = Math.ceil(total / perDistrict);

      return {
        totalTributes: total,
        tributesPerDistrict: perDistrict,
        districtCount,
        tributes: validTributes,
      };
    }
  }

  return null;
}

