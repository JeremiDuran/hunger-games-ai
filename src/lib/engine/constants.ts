/**
 * Hunger Games AI — Simulation Engine Constants & Numerical Thresholds
 * Centralized configuration adhering to no-magic-numbers and domain rules.
 */

// ==========================================
// 1. Biometric Bounds & Defaults
// ==========================================

export const MIN_BIOMETRIC = 0;
export const MAX_BIOMETRIC = 100;
export const BASELINE_BIOMETRIC = 50;

// ==========================================
// 2. Physical Vitality (Survival) Thresholds
// ==========================================

/** Survival 80–100: Unscathed / Peak condition */
export const SURVIVAL_PRIME_THRESHOLD = 80;

/** Survival 55–79: Scratched / Bruised */
export const SURVIVAL_SCRATCHED_THRESHOLD = 55;

/** Survival 30–54: Wounded / Fatigued */
export const SURVIVAL_WOUNDED_THRESHOLD = 30;

/** Survival 1–29: Critically Injured / Bleeding */
export const SURVIVAL_CRITICAL_THRESHOLD = 1;

/** Survival <= 0: Fatal Collapse / Death */
export const SURVIVAL_FATAL_THRESHOLD = 0;

// ==========================================
// 3. Psychological Fortitude (Sanity) Thresholds
// ==========================================

/** Sanity 80–100: Resolute / Calm */
export const SANITY_RESOLUTE_THRESHOLD = 80;

/** Sanity 55–79: Alert / Composed */
export const SANITY_COMPOSED_THRESHOLD = 55;

/** Sanity 35–54: Shaken / Anxious */
export const SANITY_ANXIOUS_THRESHOLD = 35;

/** Sanity 15–34: Paranoid / Disturbed */
export const SANITY_PARANOID_THRESHOLD = 15;

/** Sanity 1–14: Delirious / Manic */
export const SANITY_MANIC_THRESHOLD = 1;

/**
 * Sanity < 25 triggers high risk of Paranoid Betrayal against allies
 * and erratic panic combat gambits.
 */
export const SANITY_BETRAYAL_THRESHOLD = 25;

/**
 * Sanity > 75 enables high tactical patience, stealth ambush execution,
 * and disciplined supply management.
 */
export const SANITY_TACTICAL_THRESHOLD = 75;

// ==========================================
// 4. Slot Architecture & Alliance Bounds
// ==========================================

export const MAX_TRIBUTE_SLOTS_PER_EVENT = 4;
export const MIN_TRIBUTE_SLOTS_PER_EVENT = 1;
export const MAX_NPC_SLOTS_PER_EVENT = 2;

/** Absolute hard maximum members in a single persistent alliance */
export const MAX_ALLIANCE_SIZE = 5;
/** Minimum members required for an active alliance */
export const MIN_ALLIANCE_SIZE = 2;

/** Small match size threshold (<= 12 tributes) where max alliance is scaled down */
export const SMALL_ROSTER_THRESHOLD = 12;
export const STANDARD_ROSTER_THRESHOLD = 24;

/** Probability of a non-career tribute being recruited into a career pack at startup */
export const CAREER_PACK_NON_CAREER_RECRUIT_CHANCE = 0.15;

/** Pack cohesion metric thresholds (0 to 100) */
export const ALLIANCE_COHESION_HIGH = 75;
export const ALLIANCE_COHESION_STRAINED = 40;
export const ALLIANCE_COHESION_FRACTURE = 25;

/** Tactical ambush power bonus for backstabbing an ally (+35% combat power) */
export const ALLIANCE_AMBUSH_POWER_BONUS = 1.35;

/** Truce probabilities for peaceful day encounters */
export const SAME_DISTRICT_TRUCE_PROBABILITY = 0.8;
export const CROSS_DISTRICT_TRUCE_PROBABILITY = 0.45;

export const ENDGAME_TRIBUTE_COUNT = 4;
export const CLIMAX_MUTTATION_TRIGGER_COUNT = 3;

// ==========================================
// 5. Combat & Equipment Multipliers
// ==========================================

/** Base armed combat advantage bonus (+35% probability shift) */
export const ARMED_COMBAT_ADVANTAGE = 1.35;

/** Multiplier bonus when engaging with numerical superiority (e.g. 2v1) */
export const NUMERICAL_SUPERIORITY_ADVANTAGE = 1.4;

// ==========================================
// 6. Sponsor Generosity Probabilities
// ==========================================

export const SPONSOR_PROBABILITY_FAMINE = 0.1;
export const SPONSOR_PROBABILITY_STANDARD = 0.25;
export const SPONSOR_PROBABILITY_ABUNDANCE = 0.45;

// ==========================================
// 7. Night Phase Environmental & Camp Parameters
// ==========================================

export const NIGHT_CAMP_SANITY_RECOVERY = 15;
export const NIGHT_LONE_EXPOSURE_SURVIVAL_PENALTY = -12;
export const NIGHT_LONE_ISOLATION_SANITY_PENALTY = -15;

// ==========================================
// 8. Bloodbath & Feast Thresholds
// ==========================================

export const BLOODBATH_CAREER_RUSH_PROBABILITY = 0.9;
export const BLOODBATH_STANDARD_RUSH_PROBABILITY = 0.45;
export const BLOODBATH_SCARED_FLEE_THRESHOLD = 35;

export const FEAST_DESPERATE_SURVIVAL_THRESHOLD = 40;
export const FEAST_DESPERATE_ATTENDANCE_PROBABILITY = 0.85;
export const FEAST_STANDARD_ATTENDANCE_PROBABILITY = 0.5;

// ==========================================
// 9. Combat Lethality Calibration Parameters
// ==========================================

export const LETHALITY_FACTORS = {
  high_bloodbath: {
    damageMultiplier: 1.35,
    criticalFatalProbability: 0.4,
    standoffProbability: 0.1,
  },
  balanced: {
    damageMultiplier: 1.0,
    criticalFatalProbability: 0.2,
    standoffProbability: 0.25,
  },
  gritty_survival: {
    damageMultiplier: 0.8,
    criticalFatalProbability: 0.08,
    standoffProbability: 0.45,
  },
} as const;

