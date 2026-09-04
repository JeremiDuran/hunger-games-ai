/**
 * Hunger Games AI — Phase-Specific Combat & Event Calculus
 * Specialized mathematical resolvers for Bloodbath Horn Clashes, Career Sweeps,
 * Daylight Skirmishes, Night Ambushes, Feast Duels, and Arena Hazards / Mutts.
 */

import { PRNG } from "../prng";
import { EngineTribute, TributeStateDelta } from "../types";
import { CombatLethality } from "@/types/setup";
import { EngineItem } from "../items/types";
import { applyBiometricDelta, isTributeCriticallyInjured } from "../biometrics";
import {
  calculateWeaponBonus,
  calculateArmorMitigation,
  calculateToolBonus,
  getBestWeapon,
  getBestArmor,
} from "../items/buffs";
import { claimItem, consumeItem, dropInventoryOnDeath, stealItem, destroyItem } from "../items/lifecycle";
import {
  calculateTotalCombatPower,
  calculateWinProbability,
  resolve1v1Clash,
  Clash1v1Result,
} from "./calculus";
import {
  scaleDamageByLethality,
  getCriticalFatalProbability,
  getStandoffProbability,
} from "./lethality";
import {
  BLOODBATH_CHAOS_DAMAGE_MULTIPLIER,
  BLOODBATH_CONTESTED_WEAPON_BASE_DAMAGE,
  FEAST_LETHALITY_MULTIPLIER,
  NIGHT_AMBUSH_CRITICAL_FATAL_BONUS,
  NIGHT_AMBUSH_POWER_MULTIPLIER,
  HAZARD_BASE_AOE_DAMAGE,
  HAZARD_AGILITY_EVASION_SURVIVAL_THRESHOLD,
  MUTT_SWARM_POWER_PER_MEMBER,
  NIGHT_CAMP_SANITY_RECOVERY,
  NIGHT_LONE_EXPOSURE_SURVIVAL_PENALTY,
  NIGHT_LONE_ISOLATION_SANITY_PENALTY,
} from "../constants";

// ==========================================
// 1. Bloodbath Horn Rush & Career Sweep Calculus
// ==========================================

export interface BloodbathHornClashResult {
  victorId: string;
  loserId: string;
  isFatal: boolean;
  isStandoff: boolean;
  updatedVictor: EngineTribute;
  updatedLoser: EngineTribute;
  claimedWeapon: EngineItem;
  stateDeltas: Record<string, TributeStateDelta>;
  narrativeNotes: string;
}

/**
 * Resolves a high-stakes, chaotic horn rush clash over a contested weapon at the Cornucopia mouth.
 * Unlike generic clashes, the victor snatches the contested weapon FIRST and strikes with it
 * during the opening melee, delivering lethal weapon damage.
 */
export function resolveBloodbathHornClash(
  tributeA: EngineTribute,
  tributeB: EngineTribute,
  contestedWeapon: EngineItem,
  context: { prng: PRNG; lethality?: CombatLethality }
): BloodbathHornClashResult {
  const { prng, lethality = "balanced" } = context;

  const powerA = calculateTotalCombatPower(tributeA);
  const powerB = calculateTotalCombatPower(tributeB);

  // 1. Determine who wins the race to seize the weapon
  const probA = calculateWinProbability(powerA, powerB);
  const aWinsWeapon = prng.nextFloat() < probA;

  const rawVictor = aWinsWeapon ? tributeA : tributeB;
  const rawLoser = aWinsWeapon ? tributeB : tributeA;
  const victorPower = aWinsWeapon ? powerA : powerB;
  const loserPower = aWinsWeapon ? powerB : powerA;

  // 2. Victor immediately wields the contested weapon
  let updatedVictor = claimItem(contestedWeapon, rawVictor);

  // 3. Standoff check (rare during chaotic horn rush)
  const standoffProb = getStandoffProbability(lethality) * 0.4; // Horn rush is too frantic for easy standoffs
  if (
    victorPower / loserPower < 1.15 &&
    rawVictor.biometrics.sanity >= 45 &&
    rawLoser.biometrics.sanity >= 45 &&
    prng.nextBoolean(standoffProb)
  ) {
    return {
      victorId: updatedVictor.id,
      loserId: rawLoser.id,
      isFatal: false,
      isStandoff: true,
      updatedVictor,
      updatedLoser: rawLoser,
      claimedWeapon: contestedWeapon,
      stateDeltas: {
        [updatedVictor.id]: {
          tributeId: updatedVictor.id,
          survivalDelta: 0,
          sanityDelta: 5,
          itemsGained: [contestedWeapon.name],
          narrativeNotes: `${updatedVictor.name} seized the ${contestedWeapon.name} as ${rawLoser.name} backed away into the chaos.`,
        },
      },
      narrativeNotes: `${rawVictor.name} and ${rawLoser.name} clashed for the ${contestedWeapon.name} but disengaged.`,
    };
  }

  // 4. Calculate lethal strike damage using the contested weapon
  const weaponBonus = calculateWeaponBonus(contestedWeapon);
  const weaponTierDamage =
    contestedWeapon.tier === "legendary" ? 30 : contestedWeapon.tier === "rare" ? 20 : 10;
  const baseDamage = (BLOODBATH_CONTESTED_WEAPON_BASE_DAMAGE + weaponTierDamage) * (1 + weaponBonus);
  const scaledDamage = Math.round(baseDamage * BLOODBATH_CHAOS_DAMAGE_MULTIPLIER * (victorPower / loserPower));
  const finalDamageToLoser = scaleDamageByLethality(scaledDamage, lethality);

  // Minor retaliatory scratch to victor (cannot be fatal - capped to leave at least 1 survival)
  const rawDamageToVictor = Math.round(10 * (loserPower / victorPower));
  const finalDamageToVictor = Math.min(
    Math.max(0, rawDamageToVictor),
    Math.max(0, updatedVictor.biometrics.survival - 1)
  );

  // 5. Evaluate Bloodbath fatality
  // Procedural Philosophy: Survival and gear influence probability rather than directly triggering death
  const baseFatalProb = getCriticalFatalProbability(lethality) + 0.25;
  const powerFactor = Math.min(2.0, Math.max(0.6, victorPower / loserPower));
  const survivalVulnerability = (100 - rawLoser.biometrics.survival) / 100;
  const weaponLethality =
    contestedWeapon.tier === "legendary" ? 0.25 : contestedWeapon.tier === "rare" ? 0.15 : 0.05;

  const fatalProb = Math.min(
    0.90,
    (baseFatalProb + weaponLethality) * powerFactor * (1 + survivalVulnerability)
  );
  const isFatal = prng.nextBoolean(fatalProb);

  // 6. Update victor and loser state
  updatedVictor = applyBiometricDelta(updatedVictor, {
    survivalDelta: -finalDamageToVictor,
    sanityDelta: isFatal ? 12 : 6,
  });

  if (isFatal) {
    updatedVictor = { ...updatedVictor, killCount: updatedVictor.killCount + 1, status: "alive" };
  }

  let updatedLoser: EngineTribute = {
    ...applyBiometricDelta(rawLoser, {
      survivalDelta: isFatal ? -(rawLoser.biometrics.survival - 1) : -finalDamageToLoser,
      sanityDelta: -30,
      overridePhysicalTag: isFatal ? "fatal" : undefined,
    }),
    status: isFatal ? "dead" : rawLoser.status,
  };

  const stateDeltas: Record<string, TributeStateDelta> = {
    [updatedVictor.id]: {
      tributeId: updatedVictor.id,
      survivalDelta: -finalDamageToVictor,
      sanityDelta: isFatal ? 12 : 6,
      itemsGained: [contestedWeapon.name],
    },
    [updatedLoser.id]: {
      tributeId: updatedLoser.id,
      survivalDelta: isFatal ? -(rawLoser.biometrics.survival - 1) : -finalDamageToLoser,
      sanityDelta: -30,
      isFatal,
      killerId: isFatal ? updatedVictor.id : undefined,
    },
  };

  if (isFatal) {
    const lootResult = dropInventoryOnDeath(updatedLoser, updatedVictor);
    updatedLoser = lootResult.updatedVictim;
    if (lootResult.updatedLooter) {
      updatedVictor = lootResult.updatedLooter;
    }
  }

  return {
    victorId: updatedVictor.id,
    loserId: updatedLoser.id,
    isFatal,
    isStandoff: false,
    updatedVictor,
    updatedLoser,
    claimedWeapon: contestedWeapon,
    stateDeltas,
    narrativeNotes: isFatal
      ? `${updatedVictor.name} seized the ${contestedWeapon.name} and struck down ${rawLoser.name} at the Cornucopia horn.`
      : `${updatedVictor.name} snatched the ${contestedWeapon.name} and wounded ${rawLoser.name}, driving them back into the fray.`,
  };
}

/**
 * Resolves an armed Career hunter sweeping the Cornucopia perimeter and ambushing a fleeing or scavenging tribute.
 */
export function resolveBloodbathCareerSweep(
  hunter: EngineTribute,
  target: EngineTribute,
  context: { prng: PRNG; lethality?: CombatLethality }
): Clash1v1Result {
  const { prng, lethality = "balanced" } = context;

  // Hunter attacks with surprise and equipped weapon advantage
  const hunterPower = calculateTotalCombatPower(hunter, { isAmbush: true });
  const targetPower = calculateTotalCombatPower(target);

  const probHunter = calculateWinProbability(hunterPower, targetPower);
  const hunterWins = prng.nextFloat() < probHunter;

  const victor = hunterWins ? hunter : target;
  const loser = hunterWins ? target : hunter;
  const victorPower = hunterWins ? hunterPower : targetPower;
  const loserPower = hunterWins ? targetPower : hunterPower;

  const victorWeapon = getBestWeapon(victor.inventory);
  const weaponDamageBase = victorWeapon ? 40 : 20;
  const rawDamage = Math.round(weaponDamageBase * (victorPower / loserPower) * 1.3);
  const finalDamageToLoser = scaleDamageByLethality(rawDamage, lethality);
  // Minor retaliatory scratch to victor (cannot be fatal - capped to leave at least 1 survival)
  const rawDamageToVictor = Math.round(8 * (loserPower / victorPower));
  const finalDamageToVictor = Math.min(
    Math.max(0, rawDamageToVictor),
    Math.max(0, victor.biometrics.survival - 1)
  );

  // Procedural Philosophy: Survival influences fatality probability rather than directly triggering death
  const baseFatalProb = getCriticalFatalProbability(lethality) + (hunterWins ? 0.25 : 0.1);
  const powerFactor = Math.min(2.0, Math.max(0.6, victorPower / loserPower));
  const sweepSurvivalVulnerability = (100 - loser.biometrics.survival) / 100;

  const fatalProb = Math.min(
    0.90,
    baseFatalProb * powerFactor * (1 + sweepSurvivalVulnerability)
  );
  const isFatal = prng.nextBoolean(fatalProb);

  let updatedVictor = applyBiometricDelta(victor, {
    survivalDelta: -finalDamageToVictor,
    sanityDelta: isFatal ? 10 : 5,
  });

  if (isFatal) {
    updatedVictor = { ...updatedVictor, killCount: updatedVictor.killCount + 1, status: "alive" };
  }

  let updatedLoser: EngineTribute = {
    ...applyBiometricDelta(loser, {
      survivalDelta: isFatal ? -(loser.biometrics.survival - 1) : -finalDamageToLoser,
      sanityDelta: -25,
      overridePhysicalTag: isFatal ? "fatal" : undefined,
    }),
    status: isFatal ? "dead" : loser.status,
  };

  const stateDeltas: Record<string, TributeStateDelta> = {
    [victor.id]: {
      tributeId: victor.id,
      survivalDelta: -finalDamageToVictor,
      sanityDelta: isFatal ? 10 : 5,
    },
    [loser.id]: {
      tributeId: loser.id,
      survivalDelta: isFatal ? -(loser.biometrics.survival - 1) : -finalDamageToLoser,
      sanityDelta: -25,
      isFatal,
      killerId: isFatal ? victor.id : undefined,
    },
  };

  if (isFatal) {
    const lootResult = dropInventoryOnDeath(updatedLoser, updatedVictor);
    updatedLoser = lootResult.updatedVictim;
    if (lootResult.updatedLooter) {
      updatedVictor = lootResult.updatedLooter;
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
      ? `${victor.name} chased down and killed ${loser.name} along the Cornucopia perimeter.`
      : `${victor.name} ambushed ${loser.name}, but ${loser.name} broke free and fled.`,
  };
}

// ==========================================
// 2. Day Phase Skirmish Calculus
// ==========================================

export function resolveDaySkirmish(
  tributeA: EngineTribute,
  tributeB: EngineTribute,
  context: { prng: PRNG; lethality?: CombatLethality; isAmbush?: boolean }
): Clash1v1Result {
  return resolve1v1Clash(tributeA, tributeB, context);
}

// ==========================================
// 3. Night Phase Ambush & Exposure Calculus
// ==========================================

export function resolveNightAmbush(
  attacker: EngineTribute,
  sleepingDefender: EngineTribute,
  context: { prng: PRNG; lethality?: CombatLethality }
): Clash1v1Result {
  const { prng, lethality = "balanced" } = context;

  const attackerPower = calculateTotalCombatPower(attacker, {
    isAmbush: true,
    numericalMultiplier: NIGHT_AMBUSH_POWER_MULTIPLIER,
  });
  // Sleeping defender has -40% reaction power
  const defenderPower = Math.max(5, calculateTotalCombatPower(sleepingDefender) * 0.6);

  const probAttacker = calculateWinProbability(attackerPower, defenderPower);
  const attackerWins = prng.nextFloat() < probAttacker;

  const victor = attackerWins ? attacker : sleepingDefender;
  const loser = attackerWins ? sleepingDefender : attacker;
  const victorPower = attackerWins ? attackerPower : defenderPower;
  const loserPower = attackerWins ? defenderPower : attackerPower;

  const victorWeapon = getBestWeapon(victor.inventory);
  const weaponDamageBase = victorWeapon ? 45 : 25;
  const rawDamage = Math.round(weaponDamageBase * (victorPower / loserPower) * 1.35);
  const finalDamage = scaleDamageByLethality(rawDamage, lethality);

  // Procedural Philosophy: Survival influences fatality probability rather than directly triggering death
  const baseFatalProb = getCriticalFatalProbability(lethality) + NIGHT_AMBUSH_CRITICAL_FATAL_BONUS;
  const powerFactor = Math.min(2.0, Math.max(0.6, victorPower / loserPower));
  const betrayalSurvivalVulnerability = (100 - loser.biometrics.survival) / 100;

  const fatalProb = Math.min(0.85, baseFatalProb * powerFactor * (1 + betrayalSurvivalVulnerability));
  const isFatal = prng.nextBoolean(fatalProb);

  let updatedVictor = applyBiometricDelta(victor, {
    survivalDelta: 0,
    sanityDelta: isFatal ? 10 : 5,
  });

  if (isFatal) {
    updatedVictor = { ...updatedVictor, killCount: updatedVictor.killCount + 1, status: "alive" };
  }

  let updatedLoser: EngineTribute = {
    ...applyBiometricDelta(loser, {
      survivalDelta: isFatal ? -(loser.biometrics.survival - 1) : -finalDamage,
      sanityDelta: -30,
      overridePhysicalTag: isFatal ? "fatal" : undefined,
    }),
    status: isFatal ? "dead" : loser.status,
  };

  const stateDeltas: Record<string, TributeStateDelta> = {
    [victor.id]: {
      tributeId: victor.id,
      survivalDelta: 0,
      sanityDelta: isFatal ? 10 : 5,
    },
    [loser.id]: {
      tributeId: loser.id,
      survivalDelta: isFatal ? -(loser.biometrics.survival - 1) : -finalDamage,
      sanityDelta: -30,
      isFatal,
      killerId: isFatal ? victor.id : undefined,
    },
  };

  if (isFatal) {
    const lootResult = dropInventoryOnDeath(updatedLoser, updatedVictor);
    updatedLoser = lootResult.updatedVictim;
    if (lootResult.updatedLooter) {
      updatedVictor = lootResult.updatedLooter;
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
      ? `${victor.name} ambushed ${loser.name} in their sleep, delivering a fatal strike in the dark.`
      : `${victor.name} launched a nocturnal ambush on ${loser.name}, but ${loser.name} managed to wake and escape into the darkness.`,
  };
}

export interface NightExposureResult {
  updatedTribute: EngineTribute;
  stateDelta: TributeStateDelta;
  isFatal: boolean;
  narrativeNotes: string;
}

export function resolveNightExposure(
  tribute: EngineTribute,
  context: { prng: PRNG; isCampedWithAllies: boolean }
): NightExposureResult {
  const { prng, isCampedWithAllies } = context;

  // Check if tribute has warm insulation (coat, blanket, thermal tent)
  const hasWarmth = tribute.inventory.some((item) => {
    const name = typeof item === "string" ? item.toLowerCase() : item.name.toLowerCase();
    return name.includes("coat") || name.includes("blanket") || name.includes("tent") || name.includes("thermal") || name.includes("sleeping");
  });

  if (isCampedWithAllies) {
    // Sharing watch & warmth with allies
    const updated = applyBiometricDelta(tribute, { sanityDelta: NIGHT_CAMP_SANITY_RECOVERY });
    return {
      updatedTribute: updated,
      stateDelta: {
        tributeId: tribute.id,
        survivalDelta: 0,
        sanityDelta: NIGHT_CAMP_SANITY_RECOVERY,
        narrativeNotes: `${tribute.name} shared camp with allies, keeping warm and recovering sanity.`,
      },
      isFatal: false,
      narrativeNotes: `${tribute.name} spent the night safely in camp with allies.`,
    };
  }

  // Lone tribute in the cold
  const survivalPenalty = hasWarmth ? Math.round(NIGHT_LONE_EXPOSURE_SURVIVAL_PENALTY * 0.4) : NIGHT_LONE_EXPOSURE_SURVIVAL_PENALTY;
  const sanityPenalty = NIGHT_LONE_ISOLATION_SANITY_PENALTY;

  // Procedural fatality: Survival influences the exposure vulnerability
  const baseExposureFatalProb = hasWarmth ? 0.03 : 0.12;
  const exposureSurvivalVulnerability = (100 - tribute.biometrics.survival) / 100;
  const exposureFatalProb = Math.min(0.70, baseExposureFatalProb * (1 + exposureSurvivalVulnerability * 2.5));
  const isFatal = prng.nextBoolean(exposureFatalProb);

  const updated: EngineTribute = {
    ...applyBiometricDelta(tribute, {
      survivalDelta: isFatal ? -(tribute.biometrics.survival - 1) : survivalPenalty,
      sanityDelta: sanityPenalty,
      overridePhysicalTag: isFatal ? "fatal" : undefined,
    }),
    status: isFatal ? "dead" : tribute.status,
  };

  return {
    updatedTribute: updated,
    stateDelta: {
      tributeId: tribute.id,
      survivalDelta: isFatal ? -(tribute.biometrics.survival - 1) : survivalPenalty,
      sanityDelta: sanityPenalty,
      isFatal,
      narrativeNotes: isFatal
        ? `${tribute.name} succumbed to severe hypothermia and freezing exposure in the night.`
        : `${tribute.name} endured a freezing, sleepless night in isolation.`,
    },
    isFatal,
    narrativeNotes: isFatal
      ? `${tribute.name} froze to death during the bitter arena night.`
      : `${tribute.name} shivered through the dark, cold night alone.`,
  };
}

// ==========================================
// 4. Feast Duel & District Backpack Calculus
// ==========================================

export interface FeastDuelResult {
  victorId: string;
  loserId: string;
  isFatal: boolean;
  updatedVictor: EngineTribute;
  updatedLoser: EngineTribute;
  claimedBackpackItem: EngineItem;
  stateDeltas: Record<string, TributeStateDelta>;
  narrativeNotes: string;
}

export function resolveFeastDuel(
  tributeA: EngineTribute,
  tributeB: EngineTribute,
  backpackItem: EngineItem,
  context: { prng: PRNG; lethality?: CombatLethality }
): FeastDuelResult {
  const { prng, lethality = "balanced" } = context;

  const powerA = calculateTotalCombatPower(tributeA);
  const powerB = calculateTotalCombatPower(tributeB);

  const probA = calculateWinProbability(powerA, powerB);
  const aWins = prng.nextFloat() < probA;

  const victor = aWins ? tributeA : tributeB;
  const loser = aWins ? tributeB : tributeA;
  const victorPower = aWins ? powerA : powerB;
  const loserPower = aWins ? powerB : powerA;

  const victorWeapon = getBestWeapon(victor.inventory);
  const weaponDamageBase = victorWeapon ? 45 : 30;
  const rawDamage = Math.round(weaponDamageBase * (victorPower / loserPower) * FEAST_LETHALITY_MULTIPLIER);
  const finalDamage = scaleDamageByLethality(rawDamage, lethality);

  // Procedural Philosophy: Survival influences fatality probability rather than directly triggering death
  const baseFatalProb = getCriticalFatalProbability(lethality) + 0.20;
  const powerFactor = Math.min(2.0, Math.max(0.6, victorPower / loserPower));
  const feastSurvivalVulnerability = (100 - loser.biometrics.survival) / 100;

  const fatalProb = Math.min(0.85, baseFatalProb * powerFactor * (1 + feastSurvivalVulnerability));
  const isFatal = prng.nextBoolean(fatalProb);

  let updatedVictor = claimItem(backpackItem, victor);

  // If backpack contains medical item and victor is injured, consume it immediately!
  if (backpackItem.category === "medical" && updatedVictor.biometrics.survival < 80) {
    const consumeRes = consumeItem(backpackItem.id, updatedVictor);
    if (consumeRes.consumedItem) {
      updatedVictor = consumeRes.updatedTribute;
    }
  }

  updatedVictor = applyBiometricDelta(updatedVictor, {
    survivalDelta: 0,
    sanityDelta: isFatal ? 15 : 10,
  });

  if (isFatal) {
    updatedVictor = { ...updatedVictor, killCount: updatedVictor.killCount + 1, status: "alive" };
  }

  let updatedLoser: EngineTribute = {
    ...applyBiometricDelta(loser, {
      survivalDelta: isFatal ? -(loser.biometrics.survival - 1) : -finalDamage,
      sanityDelta: -35,
      overridePhysicalTag: isFatal ? "fatal" : undefined,
    }),
    status: isFatal ? "dead" : loser.status,
  };

  const stateDeltas: Record<string, TributeStateDelta> = {
    [victor.id]: {
      tributeId: victor.id,
      survivalDelta: 0,
      sanityDelta: isFatal ? 15 : 10,
      itemsGained: [backpackItem.name],
    },
    [loser.id]: {
      tributeId: loser.id,
      survivalDelta: isFatal ? -(loser.biometrics.survival - 1) : -finalDamage,
      sanityDelta: -35,
      isFatal,
      killerId: isFatal ? victor.id : undefined,
    },
  };

  if (isFatal) {
    const lootResult = dropInventoryOnDeath(updatedLoser, updatedVictor);
    updatedLoser = lootResult.updatedVictim;
    if (lootResult.updatedLooter) {
      updatedVictor = lootResult.updatedLooter;
    }
  }

  return {
    victorId: victor.id,
    loserId: loser.id,
    isFatal,
    updatedVictor,
    updatedLoser,
    claimedBackpackItem: backpackItem,
    stateDeltas,
    narrativeNotes: isFatal
      ? `${victor.name} killed ${loser.name} in a desperate clash at the Cornucopia table and secured the ${backpackItem.name}.`
      : `${victor.name} drove off ${loser.name} at the Feast table and secured the ${backpackItem.name}.`,
  };
}

// ==========================================
// 5. Arena Hazard AoE & Muttation Swarm Calculus
// ==========================================

export interface HazardAoEResult {
  fallenTributeIds: string[];
  updatedTributes: Map<string, EngineTribute>;
  stateDeltas: Record<string, TributeStateDelta>;
  narrativeNotes: string;
}

export function resolveArenaHazardAoE(
  tributes: EngineTribute[],
  hazard: { name: string; description: string; baseDamage?: number },
  context: { prng: PRNG }
): HazardAoEResult {
  const { prng } = context;
  const baseDamage = hazard.baseDamage ?? HAZARD_BASE_AOE_DAMAGE;
  const updatedTributes = new Map<string, EngineTribute>();
  const stateDeltas: Record<string, TributeStateDelta> = {};
  const fallenTributeIds: string[] = [];

  for (const tribute of tributes) {
    const armorMitigation = calculateArmorMitigation(tribute.inventory);
    const agilityBuff = calculateToolBonus(tribute.inventory);
    const hasHighSurvival = tribute.biometrics.survival >= HAZARD_AGILITY_EVASION_SURVIVAL_THRESHOLD;

    // Evasion check: Agile or alert tributes take reduced damage
    const evasionSuccess = hasHighSurvival && prng.nextBoolean(0.5 + agilityBuff);
    const rawDamage = evasionSuccess ? Math.round(baseDamage * 0.4) : baseDamage;
    const finalDamage = Math.max(5, Math.round(rawDamage * (1 - armorMitigation)));

    // Procedural Fatality: Survival score, evasion success, and hazard intensity scale the fatal roll
    const survivalVulnerability = (100 - tribute.biometrics.survival) / 100;
    const baseHazardFatalProb = evasionSuccess ? 0.10 : 0.35;
    const fatalProb = Math.min(0.85, baseHazardFatalProb * (1 + survivalVulnerability * 1.5));
    const isFatal = prng.nextBoolean(fatalProb);

    const updated: EngineTribute = {
      ...applyBiometricDelta(tribute, {
        survivalDelta: isFatal ? -(tribute.biometrics.survival - 1) : -finalDamage,
        sanityDelta: isFatal ? -50 : -25,
        overridePhysicalTag: isFatal ? "fatal" : undefined,
      }),
      status: isFatal ? "dead" : tribute.status,
    };

    updatedTributes.set(tribute.id, updated);
    if (isFatal) {
      fallenTributeIds.push(tribute.id);
    }

    stateDeltas[tribute.id] = {
      tributeId: tribute.id,
      survivalDelta: isFatal ? -(tribute.biometrics.survival - 1) : -finalDamage,
      sanityDelta: isFatal ? -50 : -25,
      isFatal,
      narrativeNotes: isFatal
        ? `${tribute.name} was caught in ${hazard.name} and was killed.`
        : `${tribute.name} survived ${hazard.name} with injuries.`,
    };
  }

  return {
    fallenTributeIds,
    updatedTributes,
    stateDeltas,
    narrativeNotes: `${hazard.name} swept through the sector, affecting ${tributes.map((t) => t.name).join(", ")}.`,
  };
}

export function resolveMuttationSwarm(
  tributes: EngineTribute[],
  swarm: { name: string; powerMultiplier?: number; threatLevel: "moderate" | "lethal" },
  context: { prng: PRNG }
): HazardAoEResult {
  const { prng } = context;
  const powerMultiplier = swarm.powerMultiplier ?? 1.0;
  const beastPower = tributes.length * MUTT_SWARM_POWER_PER_MEMBER * powerMultiplier;
  const combinedTributePower = tributes.reduce(
    (sum, t) => sum + calculateTotalCombatPower(t),
    0
  );

  const probVictory = combinedTributePower / (combinedTributePower + beastPower);
  const tributesWin = prng.nextFloat() < probVictory;

  const updatedTributes = new Map<string, EngineTribute>();
  const stateDeltas: Record<string, TributeStateDelta> = {};
  const fallenTributeIds: string[] = [];

  for (const tribute of tributes) {
    const armorMitigation = calculateArmorMitigation(tribute.inventory);
    const baseDamage = tributesWin
      ? (swarm.threatLevel === "lethal" ? 20 : 10)
      : (swarm.threatLevel === "lethal" ? 55 : 30);

    const damage = Math.max(5, Math.round(baseDamage * (1 - armorMitigation)));

    // Procedural Fatality: Swarm threat, win status, and survival vulnerability scale the roll
    const baseFatalProb = tributesWin
      ? swarm.threatLevel === "lethal"
        ? 0.08
        : 0.02
      : swarm.threatLevel === "lethal"
      ? 0.45
      : 0.20;
    const survivalVulnerability = (100 - tribute.biometrics.survival) / 100;
    const fatalProb = Math.min(0.85, baseFatalProb * (1 + survivalVulnerability * 1.8));
    const isFatal = prng.nextBoolean(fatalProb);

    const updated: EngineTribute = {
      ...applyBiometricDelta(tribute, {
        survivalDelta: isFatal ? -(tribute.biometrics.survival - 1) : -damage,
        sanityDelta: tributesWin ? 10 : -25,
        overridePhysicalTag: isFatal ? "fatal" : undefined,
      }),
      status: isFatal ? "dead" : tribute.status,
    };

    updatedTributes.set(tribute.id, updated);
    if (isFatal) {
      fallenTributeIds.push(tribute.id);
    }

    stateDeltas[tribute.id] = {
      tributeId: tribute.id,
      survivalDelta: isFatal ? -(tribute.biometrics.survival - 1) : -damage,
      sanityDelta: tributesWin ? 10 : -25,
      isFatal,
    };
  }

  return {
    fallenTributeIds,
    updatedTributes,
    stateDeltas,
    narrativeNotes: tributesWin
      ? `${tributes.map((t) => t.name).join(" and ")} repelled the ${swarm.name}.`
      : `The ${swarm.name} savaged ${tributes.map((t) => t.name).join(" and ")}.`,
  };
}
