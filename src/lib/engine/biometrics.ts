/**
 * Hunger Games AI — Biometric State Machine & Tag Evaluator
 * Pure functions for managing Survival (0-100) and Sanity (0-100) gauges and qualitative condition tags.
 */

import {
  MIN_BIOMETRIC,
  MAX_BIOMETRIC,
  BASELINE_BIOMETRIC,
  MIN_SURVIVAL,
  MAX_SURVIVAL,
  MIN_SANITY,
  MAX_SANITY,
  SURVIVAL_PRIME_THRESHOLD,
  SURVIVAL_SCRATCHED_THRESHOLD,
  SURVIVAL_WOUNDED_THRESHOLD,
  SURVIVAL_FATAL_THRESHOLD,
  SANITY_RESOLUTE_THRESHOLD,
  SANITY_COMPOSED_THRESHOLD,
  SANITY_ANXIOUS_THRESHOLD,
  SANITY_PARANOID_THRESHOLD,
  SANITY_BETRAYAL_THRESHOLD,
  SANITY_TACTICAL_THRESHOLD,
} from "./constants";
import {
  PhysicalConditionTag,
  MentalConditionTag,
  TributeBiometrics,
  EngineTribute,
} from "./types";

/**
 * Clamps a survival score strictly between MIN_SURVIVAL (1) and MAX_SURVIVAL (100).
 * Survival never reaches 0 — low survival tributes are subjected to hazard death events instead.
 */
export function clampSurvival(value: number): number {
  if (Number.isNaN(value)) return BASELINE_BIOMETRIC;
  const clamped = Math.max(MIN_SURVIVAL, Math.min(MAX_SURVIVAL, value));
  return Math.round(clamped * 10) / 10;
}

/**
 * Clamps a sanity score strictly between MIN_SANITY (0) and MAX_SANITY (100).
 */
export function clampSanity(value: number): number {
  if (Number.isNaN(value)) return BASELINE_BIOMETRIC;
  const clamped = Math.max(MIN_SANITY, Math.min(MAX_SANITY, value));
  return Math.round(clamped * 10) / 10;
}

/**
 * Clamps a biometric value strictly between MIN_BIOMETRIC (0) and MAX_BIOMETRIC (100).
 * Rounds to 1 decimal place to prevent floating-point precision artifacts.
 */
export function clampBiometric(value: number): number {
  if (Number.isNaN(value)) return BASELINE_BIOMETRIC;
  const clamped = Math.max(MIN_BIOMETRIC, Math.min(MAX_BIOMETRIC, value));
  return Math.round(clamped * 10) / 10;
}

/**
 * Evaluates the qualitative physical condition tag from the survival score.
 */
export function evaluatePhysicalTag(survival: number): PhysicalConditionTag {
  if (survival <= SURVIVAL_FATAL_THRESHOLD) {
    return "fatal";
  }
  if (survival >= SURVIVAL_PRIME_THRESHOLD) {
    return "unscathed";
  }
  if (survival >= SURVIVAL_SCRATCHED_THRESHOLD) {
    return "scratched";
  }
  if (survival >= SURVIVAL_WOUNDED_THRESHOLD) {
    return "wounded";
  }
  return "critically_injured";
}

/**
 * Evaluates the qualitative psychological condition tag from the sanity score.
 */
export function evaluateMentalTag(sanity: number): MentalConditionTag {
  if (sanity >= SANITY_RESOLUTE_THRESHOLD) {
    return "resolute";
  }
  if (sanity >= SANITY_COMPOSED_THRESHOLD) {
    return "composed";
  }
  if (sanity >= SANITY_ANXIOUS_THRESHOLD) {
    return "anxious";
  }
  if (sanity >= SANITY_PARANOID_THRESHOLD) {
    return "paranoid";
  }
  return "manic";
}

/**
 * Creates default biometrics for a tribute entering the arena (50 Survival, 50 Sanity).
 */
export function createInitialBiometrics(): TributeBiometrics {
  return {
    survival: BASELINE_BIOMETRIC,
    sanity: BASELINE_BIOMETRIC,
    physicalTag: "unscathed",
    mentalTag: "composed",
  };
}

export interface BiometricDeltaApplication {
  survivalDelta?: number;
  sanityDelta?: number;
  overridePhysicalTag?: PhysicalConditionTag;
  overrideMentalTag?: MentalConditionTag;
}

/**
 * Pure function to apply a biometric delta to a tribute and return the updated immutable clone.
 * Enforces procedural philosophy: Survival is strictly clamped between 1 and 100 (never drops to 0).
 * Status is never changed to 'dead' here; tributes only fall in explicit narrated events (combat, hazards, etc.).
 */
export function applyBiometricDelta(
  tribute: EngineTribute,
  delta: BiometricDeltaApplication
): EngineTribute {
  const currentSurvival = tribute.biometrics.survival;
  const currentSanity = tribute.biometrics.sanity;

  const rawNewSurvival = currentSurvival + (delta.survivalDelta ?? 0);
  const rawNewSanity = currentSanity + (delta.sanityDelta ?? 0);

  const newSurvival = clampSurvival(rawNewSurvival);
  const newSanity = clampSanity(rawNewSanity);

  const physicalTag =
    delta.overridePhysicalTag ?? evaluatePhysicalTag(newSurvival);

  const mentalTag =
    delta.overrideMentalTag ?? evaluateMentalTag(newSanity);

  const newBiometrics: TributeBiometrics = {
    survival: newSurvival,
    sanity: newSanity,
    physicalTag,
    mentalTag,
  };

  return {
    ...tribute,
    biometrics: newBiometrics,
  };
}

// ==========================================
// Behavioral Condition Predicates
// ==========================================

export function isTributeFatal(survival: number): boolean {
  return survival <= SURVIVAL_FATAL_THRESHOLD;
}

export function isTributeCriticallyInjured(survival: number): boolean {
  return survival > SURVIVAL_FATAL_THRESHOLD && survival < SURVIVAL_WOUNDED_THRESHOLD;
}

/**
 * Checks if a tribute's sanity has deteriorated below the betrayal threshold (<25).
 */
export function isTributeParanoid(sanity: number): boolean {
  return sanity < SANITY_BETRAYAL_THRESHOLD;
}

/**
 * Checks if a tribute's sanity is in extreme manic breakdown (<15).
 */
export function isTributeManic(sanity: number): boolean {
  return sanity < SANITY_PARANOID_THRESHOLD;
}

/**
 * Checks if a tribute's sanity is high enough (>75) for resolute tactical composure.
 */
export function isTributeTacticallyResolute(sanity: number): boolean {
  return sanity >= SANITY_TACTICAL_THRESHOLD;
}
