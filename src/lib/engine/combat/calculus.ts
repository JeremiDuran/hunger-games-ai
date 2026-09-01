/**
 * Hunger Games AI — Deterministic Combat Advantage Calculus
 * Evaluates combat ratings, win probabilities, weapon damage, armor mitigation,
 * and deterministic clash outcomes using seeded PRNG.
 */

import { PRNG } from "../prng";
import { EngineTribute, TributeStateDelta } from "../types";
import { CombatLethality } from "@/types/setup";
import { applyBiometricDelta, isTributeCriticallyInjured } from "../biometrics";
import {
  calculateWeaponBonus,
  calculateArmorMitigation,
  calculateToolBonus,
  getBestWeapon,
} from "../items/buffs";
import { dropInventoryOnDeath, stealItem, destroyItem } from "../items/lifecycle";
import {
  scaleDamageByLethality,
  getCriticalFatalProbability,
  getStandoffProbability,
} from "./lethality";

// ==========================================
// 1. Combat Power Formulas
// ==========================================

/**
 * Calculates raw, unequipped combat capability from physical and psychological biometrics.
 * Formula: (Survival * 0.6) + (Sanity * 0.4)
 */
export function calculateBaseCombatPower(tribute: EngineTribute): number {
  const survival = tribute.biometrics.survival;
  const sanity = tribute.biometrics.sanity;
  const rawPower = survival * 0.6 + sanity * 0.4;
  return Math.round(rawPower * 10) / 10;
}

export interface CombatPowerOptions {
  numericalMultiplier?: number;
  isAmbush?: boolean;
}

/**
 * Calculates total equipped combat power incorporating weapons, tools, conditions, and tactical stances.
 */
export function calculateTotalCombatPower(
  tribute: EngineTribute,
  options: CombatPowerOptions = {}
): number {
  const basePower = calculateBaseCombatPower(tribute);
  const bestWeapon = getBestWeapon(tribute.inventory);
  const weaponBonus = calculateWeaponBonus(bestWeapon);
  const toolBonus = calculateToolBonus(tribute.inventory);

  // Condition multipliers
  let conditionMultiplier = 1.0;
  if (tribute.biometrics.physicalTag === "critically_injured") {
    conditionMultiplier *= 0.7; // -30% power
  } else if (tribute.biometrics.physicalTag === "wounded") {
    conditionMultiplier *= 0.85; // -15% power
  }

  if (tribute.biometrics.mentalTag === "resolute") {
    conditionMultiplier *= 1.15; // +15% tactical focus
  } else if (
    tribute.biometrics.mentalTag === "delirious" ||
    tribute.biometrics.mentalTag === "manic"
  ) {
    conditionMultiplier *= 0.85; // -15% chaotic instability
  }

  const ambushMultiplier = options.isAmbush ? 1.25 : 1.0;
  const numericalMultiplier = options.numericalMultiplier ?? 1.0;

  const total =
    basePower *
    (1 + weaponBonus + toolBonus) *
    conditionMultiplier *
    ambushMultiplier *
    numericalMultiplier;

  return Math.max(1, Math.round(total * 10) / 10);
}

// ==========================================
// 2. 1v1 Clash Resolution
// ==========================================

export interface Clash1v1Result {
  victorId: string;
  loserId: string;
  isFatal: boolean;
  isStandoff: boolean;
  updatedVictor: EngineTribute;
  updatedLoser: EngineTribute;
  stateDeltas: Record<string, TributeStateDelta>;
  narrativeNotes: string;
}

export interface Clash1v1Context {
  prng: PRNG;
  lethality?: CombatLethality;
  isAmbush?: boolean;
}

export const COMBAT_POWER_EXPONENT = 1.5;

/**
 * Calculates win probability between two combatants using a Bradley-Terry power exponent curve.
 */
export function calculateWinProbability(powerA: number, powerB: number): number {
  if (powerA <= 0 && powerB <= 0) return 0.5;
  if (powerA <= 0) return 0;
  if (powerB <= 0) return 1;
  const expA = Math.pow(powerA, COMBAT_POWER_EXPONENT);
  const expB = Math.pow(powerB, COMBAT_POWER_EXPONENT);
  return expA / (expA + expB);
}

/**
 * Resolves a deterministic 1v1 clash between two tributes.
 */
export function resolve1v1Clash(
  tributeA: EngineTribute,
  tributeB: EngineTribute,
  context: Clash1v1Context
): Clash1v1Result {
  const { prng, lethality = "balanced", isAmbush = false } = context;

  const powerA = calculateTotalCombatPower(tributeA, { isAmbush });
  const powerB = calculateTotalCombatPower(tributeB);

  // 1. Calculate win probability
  const probA = calculateWinProbability(powerA, powerB);
  const aWins = prng.nextFloat() < probA;

  const victor = aWins ? tributeA : tributeB;
  const loser = aWins ? tributeB : tributeA;
  const victorPower = aWins ? powerA : powerB;
  const loserPower = aWins ? powerB : powerA;

  const victorWeapon = getBestWeapon(victor.inventory);
  const loserArmorMitigation = calculateArmorMitigation(loser.inventory);
  const victorArmorMitigation = calculateArmorMitigation(victor.inventory);

  // 2. Check for peaceful standoff (only if power gap is tiny and both have sanity > 40)
  const powerRatio = victorPower / loserPower;
  const standoffProb = getStandoffProbability(lethality);
  if (
    powerRatio < 1.15 &&
    victor.biometrics.sanity >= 40 &&
    loser.biometrics.sanity >= 40 &&
    prng.nextBoolean(standoffProb)
  ) {
    return {
      victorId: victor.id,
      loserId: loser.id,
      isFatal: false,
      isStandoff: true,
      updatedVictor: victor,
      updatedLoser: loser,
      stateDeltas: {},
      narrativeNotes: `${tributeA.name} and ${tributeB.name} reached a tense standoff and backed away.`,
    };
  }

  // 3. Calculate damage dealt to loser
  const weaponDamageBase = victorWeapon ? 30 + (victorWeapon.tier === "legendary" ? 25 : victorWeapon.tier === "rare" ? 15 : 5) : 20;
  const rawDamageToLoser = Math.round(weaponDamageBase * (victorPower / loserPower));
  const mitigatedDamageToLoser = Math.max(10, Math.round(rawDamageToLoser * (1 - loserArmorMitigation)));
  const finalDamageToLoser = scaleDamageByLethality(mitigatedDamageToLoser, lethality);

  // Minor scratch counter-damage to victor
  const rawDamageToVictor = Math.round(10 * (loserPower / victorPower));
  const finalDamageToVictor = Math.max(0, Math.round(rawDamageToVictor * (1 - victorArmorMitigation)));

  // 4. Fatality evaluation
  const remainingLoserSurvival = loser.biometrics.survival - finalDamageToLoser;
  const criticalFatalProb = getCriticalFatalProbability(lethality);

  const isFatal =
    remainingLoserSurvival <= 0 ||
    (isTributeCriticallyInjured(remainingLoserSurvival) && prng.nextBoolean(criticalFatalProb));

  // 5. Apply state changes
  let updatedVictor = applyBiometricDelta(victor, {
    survivalDelta: -finalDamageToVictor,
    sanityDelta: isFatal ? 10 : 5, // Triumph boost
  });

  if (isFatal) {
    updatedVictor = { ...updatedVictor, killCount: updatedVictor.killCount + 1 };
  }

  let updatedLoser = applyBiometricDelta(loser, {
    survivalDelta: isFatal ? -loser.biometrics.survival : -finalDamageToLoser,
    sanityDelta: -25, // Fear & shock
  });

  const stateDeltas: Record<string, TributeStateDelta> = {
    [victor.id]: {
      tributeId: victor.id,
      survivalDelta: -finalDamageToVictor,
      sanityDelta: isFatal ? 10 : 5,
      itemsGained: [],
      itemsLost: [],
    },
    [loser.id]: {
      tributeId: loser.id,
      survivalDelta: isFatal ? -loser.biometrics.survival : -finalDamageToLoser,
      sanityDelta: -25,
      isFatal,
      killerId: isFatal ? victor.id : undefined,
      itemsGained: [],
      itemsLost: [],
    },
  };

  // 6. Item lifecycle events during combat
  if (isFatal) {
    // Victor loots dropped items from dead victim
    const lootResult = dropInventoryOnDeath(updatedLoser, updatedVictor);
    updatedLoser = lootResult.updatedVictim;
    if (lootResult.updatedLooter) {
      updatedVictor = lootResult.updatedLooter;
    }
    stateDeltas[victor.id].itemsGained = lootResult.lootedItems.map((i) => i.name);
    stateDeltas[loser.id].itemsLost = lootResult.droppedItems.map((i) => i.name);
  } else {
    // Non-fatal: Chance of weapon breaking (10%) or being disarmed/stolen (15%)
    if (loser.inventory.length > 0 && prng.nextBoolean(0.15)) {
      const targetItem = loser.inventory[0];
      const targetId = typeof targetItem === "string" ? targetItem : targetItem.id;
      const stealResult = stealItem(targetId, updatedLoser, updatedVictor);
      if (stealResult.stolenItem) {
        updatedLoser = stealResult.updatedFrom;
        updatedVictor = stealResult.updatedTo;
        stateDeltas[victor.id].itemsGained = [stealResult.stolenItem.name];
        stateDeltas[loser.id].itemsLost = [stealResult.stolenItem.name];
      }
    } else if (victorWeapon && prng.nextBoolean(0.08)) {
      // Victor weapon shatters
      const destroyResult = destroyItem(victorWeapon.id, updatedVictor);
      if (destroyResult.removedItem) {
        updatedVictor = destroyResult.updatedTribute;
        stateDeltas[victor.id].itemsDestroyed = [destroyResult.removedItem.name];
      }
    }
  }

  return {
    victorId: victor.id,
    loserId: loser.id,
    isFatal,
    isStandoff: false,
    updatedVictor,
    updatedLoser,
    stateDeltas,
    narrativeNotes: isFatal
      ? `${victor.name} dealt a fatal strike to ${loser.name}.`
      : `${victor.name} wounded ${loser.name}, forcing them to retreat.`,
  };
}

// ==========================================
// 3. PvE (Mutt / Hazard) Resolution
// ==========================================

export interface PvEClashResult {
  isBeastSlain: boolean;
  fallenTributeIds: string[];
  updatedTributes: Map<string, EngineTribute>;
  stateDeltas: Record<string, TributeStateDelta>;
  narrativeNotes: string;
}

export function resolvePvEClash(
  tributes: EngineTribute[],
  beastThreat: { name: string; power: number; threatLevel: "minor" | "moderate" | "lethal" },
  context: { prng: PRNG }
): PvEClashResult {
  const { prng } = context;
  const combinedTributePower = tributes.reduce(
    (sum, t) => sum + calculateTotalCombatPower(t),
    0
  );

  const probVictory = combinedTributePower / (combinedTributePower + beastThreat.power);
  const tributesWin = prng.nextFloat() < probVictory;

  const updatedTributes = new Map<string, EngineTribute>();
  const stateDeltas: Record<string, TributeStateDelta> = {};
  const fallenTributeIds: string[] = [];

  for (const tribute of tributes) {
    const armorMitigation = calculateArmorMitigation(tribute.inventory);
    const baseDamage = tributesWin
      ? (beastThreat.threatLevel === "lethal" ? 25 : 10)
      : (beastThreat.threatLevel === "lethal" ? 60 : 30);

    const damage = Math.max(5, Math.round(baseDamage * (1 - armorMitigation)));
    const remainingSurvival = tribute.biometrics.survival - damage;
    const isFatal = remainingSurvival <= 0;

    const updated = applyBiometricDelta(tribute, {
      survivalDelta: isFatal ? -tribute.biometrics.survival : -damage,
      sanityDelta: tributesWin ? 10 : -20,
    });

    updatedTributes.set(tribute.id, updated);
    if (isFatal) {
      fallenTributeIds.push(tribute.id);
    }

    stateDeltas[tribute.id] = {
      tributeId: tribute.id,
      survivalDelta: isFatal ? -tribute.biometrics.survival : -damage,
      sanityDelta: tributesWin ? 10 : -20,
      isFatal,
    };
  }

  return {
    isBeastSlain: tributesWin,
    fallenTributeIds,
    updatedTributes,
    stateDeltas,
    narrativeNotes: tributesWin
      ? `${tributes.map((t) => t.name).join(" and ")} defeated ${beastThreat.name}.`
      : `${beastThreat.name} overwhelmed ${tributes.map((t) => t.name).join(" and ")}.`,
  };
}
