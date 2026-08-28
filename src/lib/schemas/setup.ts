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
