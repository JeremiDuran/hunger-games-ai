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
// 4. Slot Architecture & Grouping Bounds
// ==========================================

export const MAX_TRIBUTE_SLOTS_PER_EVENT = 4;
export const MIN_TRIBUTE_SLOTS_PER_EVENT = 1;
export const MAX_NPC_SLOTS_PER_EVENT = 2;

export const ENDGAME_TRIBUTE_COUNT = 4;
export const CLIMAX_MUTTATION_TRIGGER_COUNT = 3;

// ==========================================
// 5. Combat & Equipment Multipliers
// ==========================================

/** Base armed combat advantage bonus (+35% probability shift) */
export const ARMED_COMBAT_ADVANTAGE = 1.35;

/** Multiplier bonus when engaging with numerical superiority (e.g. 2v1) */
export const NUMERICAL_SUPERIORITY_ADVANTAGE = 1.4;
