/**
 * Hunger Games AI — Combat Lethality Calculator & Factor Evaluator
 * Pure mathematical functions for scaling combat damage, fatality checks,
 * and standoff probabilities based on the Gamemaker CombatLethality setting.
 */

import { CombatLethality } from "@/types/setup";
import { LETHALITY_FACTORS } from "../constants";

export interface LethalityProfile {
  damageMultiplier: number;
  criticalFatalProbability: number;
  standoffProbability: number;
}

/**
 * Returns the exact lethality profile for a given CombatLethality setting.
 */
export function getLethalityProfile(
  lethality: CombatLethality = "balanced"
): LethalityProfile {
  return LETHALITY_FACTORS[lethality] ?? LETHALITY_FACTORS.balanced;
}

/**
 * Scales raw combat damage based on the active lethality setting.
 */
export function scaleDamageByLethality(
  baseDamage: number,
  lethality: CombatLethality = "balanced"
): number {
  const profile = getLethalityProfile(lethality);
  return Math.max(1, Math.round(baseDamage * profile.damageMultiplier));
}

/**
 * Returns the fatality probability when a combatant enters critical injury.
 */
export function getCriticalFatalProbability(
  lethality: CombatLethality = "balanced"
): number {
  return getLethalityProfile(lethality).criticalFatalProbability;
}

/**
 * Returns the probability that evenly matched combatants choose a tense standoff.
 */
export function getStandoffProbability(
  lethality: CombatLethality = "balanced"
): number {
  return getLethalityProfile(lethality).standoffProbability;
}
