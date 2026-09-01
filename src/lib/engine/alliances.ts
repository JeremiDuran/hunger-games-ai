/**
 * Hunger Games AI — Alliance Cohesion & Lifecycle Manager
 * Pure functions for managing alliance pacts, district affinities, pack cohesion,
 * psychological strain, paranoid backstabs, and endgame betrayals.
 */

import { PRNG } from "./prng";
import {
  EngineTribute,
  EngineAlliance,
  EngineGameSettings,
} from "./types";
import { AllianceDynamic } from "@/types/setup";
import { isTributeParanoid } from "./biometrics";
import {
  MAX_ALLIANCE_SIZE,
  MIN_ALLIANCE_SIZE,
  SMALL_ROSTER_THRESHOLD,
  STANDARD_ROSTER_THRESHOLD,
  CAREER_PACK_NON_CAREER_RECRUIT_CHANCE,
  ALLIANCE_COHESION_HIGH,
  ALLIANCE_COHESION_FRACTURE,
  ENDGAME_TRIBUTE_COUNT,
  SAME_DISTRICT_TRUCE_PROBABILITY,
} from "./constants";

// ==========================================
// Constants & Configuration
// ==========================================

export const CAREER_DISTRICTS = [1, 2, 4] as const;
export const DISTRICT_PARTNER_BASE_AFFINITY = 75;
export const CAREER_PACK_BASE_AFFINITY = 60;
export const SAME_DISTRICT_ALLIANCE_PROBABILITY = 0.75;
export const SPONTANEOUS_TRUCE_AFFINITY_THRESHOLD = 50;

// ==========================================
// 1. Roster Scaling & Capacity Calculations
// ==========================================

/**
 * Computes maximum allowed alliance size based on initial or current total tributes (N).
 * - Small matches (N <= 12): Caps at 3 (5-member packs prohibited/unbalanced).
 * - Medium matches (12 < N < 24): Caps at 4.
 * - Standard/Large matches (N >= 24): Caps at hard maximum of 5.
 */
export function getAllianceSizeCapForRoster(totalTributeCount: number): number {
  if (totalTributeCount <= SMALL_ROSTER_THRESHOLD) {
    return 3;
  }
  if (totalTributeCount < STANDARD_ROSTER_THRESHOLD) {
    return 4;
  }
  return MAX_ALLIANCE_SIZE;
}

/**
 * Validates whether an alliance of a specific target size is permitted given the match roster.
 */
export function canFormAllianceOfSize(
  targetSize: number,
  totalTributeCount: number
): boolean {
  if (targetSize < MIN_ALLIANCE_SIZE || targetSize > MAX_ALLIANCE_SIZE) {
    return false;
  }
  const maxCap = getAllianceSizeCapForRoster(totalTributeCount);
  return targetSize <= maxCap;
}

// ==========================================
// 2. Interpersonal Affinity & Pack Cohesion
// ==========================================

/**
 * Pure function to calculate interpersonal affinity score between two tributes.
 * Returns an affinity score from -100 to 100.
 */
export function calculateTributeAffinity(
  tributeA: EngineTribute,
  tributeB: EngineTribute
): number {
  if (tributeA.id === tributeB.id) return 100;

  let affinity = 0;

  // 1. Same District affinity boost (+75)
  if (tributeA.district === tributeB.district) {
    affinity += DISTRICT_PARTNER_BASE_AFFINITY;
  }

  // 2. Career District affinity (Districts 1, 2, 4)
  const isCareerA = (CAREER_DISTRICTS as readonly number[]).includes(tributeA.district);
  const isCareerB = (CAREER_DISTRICTS as readonly number[]).includes(tributeB.district);
  if (isCareerA && isCareerB) {
    affinity += CAREER_PACK_BASE_AFFINITY;
  }

  // 3. Psychological penalty if either tribute is paranoid / unstable
  if (isTributeParanoid(tributeA.biometrics.sanity) || isTributeParanoid(tributeB.biometrics.sanity)) {
    affinity -= 40;
  }

  // 4. Clamping bounds
  return Math.max(-100, Math.min(100, affinity));
}

/**
 * Evaluates internal pack cohesion for an active alliance on a 0–100 scale.
 * Higher score = resilient, disciplined cooperation.
 * Lower score (< 35) = extreme friction, impending fracture or backstab.
 */
export function calculateAllianceCohesion(
  alliance: EngineAlliance,
  tributes: Map<string, EngineTribute>,
  totalAliveTributes: number
): number {
  const aliveMembers = alliance.tributeIds
    .map((id) => tributes.get(id))
    .filter((t): t is EngineTribute => t !== undefined && t.status === "alive");

  if (aliveMembers.length < 2) return 0;

  let cohesion = 55; // Baseline pack stability for neutral strangers

  // 1. Same-District solidarity boost (+25)
  const firstDistrict = aliveMembers[0].district;
  const isHomogeneousDistrict = aliveMembers.every((m) => m.district === firstDistrict);
  if (isHomogeneousDistrict) {
    cohesion += 25;
  }

  // 2. Career Pack solidarity boost (+20)
  const isAllCareers = aliveMembers.every((m) =>
    (CAREER_DISTRICTS as readonly number[]).includes(m.district)
  );
  if (isAllCareers) {
    cohesion += 20;
  }

  // 3. Average sanity factor (-25 to +25 delta)
  const avgSanity =
    aliveMembers.reduce((sum, m) => sum + m.biometrics.sanity, 0) / aliveMembers.length;
  cohesion += Math.round((avgSanity - 50) * 0.5);

  // 4. Paranoia penalty: severe friction if any member has Sanity < 25
  const hasParanoidMember = aliveMembers.some((m) => isTributeParanoid(m.biometrics.sanity));
  if (hasParanoidMember) {
    cohesion -= 35;
  }

  // 5. Starvation / critical injury penalty
  const avgSurvival =
    aliveMembers.reduce((sum, m) => sum + m.biometrics.survival, 0) / aliveMembers.length;
  if (avgSurvival < 30) {
    cohesion -= 20;
  }

  // 6. Endgame pressure penalty (<= 4 tributes alive in match)
  if (totalAliveTributes <= ENDGAME_TRIBUTE_COUNT) {
    cohesion -= 30;
  }

  return Math.max(0, Math.min(100, Math.round(cohesion)));
}

// ==========================================
// 3. Match Startup & Alliance Bootstrapping
// ==========================================

/**
 * Initializes alliances at game startup based on the selected Gamemaker AllianceDynamic setting.
 * - Career Pack mode: Immediately pushes District 1, 2, and 4 alliances, supporting 4-way D1+D2 packs,
 *   4-to-5 member packs, non-career recruitment rolls, and surplus squad fallbacks.
 * - Dynamic Pacts: District partner pairings and cross-district affinity rolls.
 * - Lone Wolves: Zero starting alliances.
 */
export function bootstrapInitialAlliances(
  tributes: EngineTribute[],
  dynamic: AllianceDynamic,
  gameId: string,
  prng: PRNG
): Map<string, EngineAlliance> {
  const alliances = new Map<string, EngineAlliance>();
  const totalRosterCount = tributes.length;
  const sizeCap = getAllianceSizeCapForRoster(totalRosterCount);

  if (dynamic === "lone_wolves") {
    return alliances;
  }

  // -------------------------------------------------------------
  // Mode A: Career Pack Initialization
  // -------------------------------------------------------------
  if (dynamic === "career_pack") {
    // 1. Find all living Career tributes (Districts 1, 2, 4)
    const careerTributes = tributes.filter((t) =>
      (CAREER_DISTRICTS as readonly number[]).includes(t.district) && t.status === "alive"
    );

    // 2. Roll for chance of inviting a non-career outsider recruit
    const nonCareers = tributes.filter(
      (t) => !(CAREER_DISTRICTS as readonly number[]).includes(t.district) && t.status === "alive"
    );

    const recruitmentPool = [...careerTributes];

    if (
      nonCareers.length > 0 &&
      recruitmentPool.length < sizeCap &&
      prng.nextFloat() < CAREER_PACK_NON_CAREER_RECRUIT_CHANCE
    ) {
      // Pick a non-career candidate
      const candidate = prng.pickOne(nonCareers);
      recruitmentPool.push(candidate);
    }

    // 3. Form Primary Career Pack within sizeCap
    if (recruitmentPool.length >= MIN_ALLIANCE_SIZE) {
      const primaryMembers = recruitmentPool.slice(0, sizeCap);
      const primaryAllianceId = `alliance-career-primary-${gameId.slice(0, 8)}`;

      const primaryAlliance: EngineAlliance = {
        id: primaryAllianceId,
        gameId,
        name: "Career Pack",
        tributeIds: primaryMembers.map((t) => t.id),
        status: "active",
        formedPhaseId: null,
        dissolvedPhaseId: null,
        betrayedByTributeId: null,
        cohesion: ALLIANCE_COHESION_HIGH,
      };
      alliances.set(primaryAllianceId, primaryAlliance);

      // 4. Surplus Career tributes form a secondary sub-pack if >= 2 remain
      const surplusCareers = careerTributes.filter(
        (t) => !primaryMembers.some((pm) => pm.id === t.id)
      );

      if (surplusCareers.length >= MIN_ALLIANCE_SIZE) {
        const subPackMembers = surplusCareers.slice(0, sizeCap);
        const subAllianceId = `alliance-career-secondary-${gameId.slice(0, 8)}`;

        const subAlliance: EngineAlliance = {
          id: subAllianceId,
          gameId,
          name: "Career Sub-Pack",
          tributeIds: subPackMembers.map((t) => t.id),
          status: "active",
          formedPhaseId: null,
          dissolvedPhaseId: null,
          betrayedByTributeId: null,
          cohesion: ALLIANCE_COHESION_HIGH - 10,
        };
        alliances.set(subAllianceId, subAlliance);
      }
    }

    return alliances;
  }

  // -------------------------------------------------------------
  // Mode B: Dynamic Pacts (District Partners & Affinity Rolls)
  // -------------------------------------------------------------
  if (dynamic === "dynamic_pacts") {
    // Group tributes by district for District Partner Pacts
    const districtMap = new Map<number, EngineTribute[]>();
    for (const t of tributes) {
      if (t.status !== "alive") continue;
      const list = districtMap.get(t.district) ?? [];
      list.push(t);
      districtMap.set(t.district, list);
    }

    let pactCounter = 1;
    for (const [district, districtTributes] of districtMap.entries()) {
      if (districtTributes.length >= MIN_ALLIANCE_SIZE) {
        const membersToInclude = districtTributes.slice(0, sizeCap);
        const roll = prng.nextFloat();

        if (roll < SAME_DISTRICT_ALLIANCE_PROBABILITY) {
          const allianceId = `alliance-d${district}-${gameId.slice(0, 6)}-${pactCounter++}`;
          const alliance: EngineAlliance = {
            id: allianceId,
            gameId,
            name: `District ${district} Pact`,
            tributeIds: membersToInclude.map((t) => t.id),
            status: "active",
            formedPhaseId: null,
            dissolvedPhaseId: null,
            betrayedByTributeId: null,
            cohesion: 85,
          };
          alliances.set(allianceId, alliance);
        }
      }
    }
  }

  return alliances;
}

// ==========================================
// 4. Alliance Queries & Utilities
// ==========================================

/**
 * Returns the active alliance containing the specified tribute, or null if none.
 */
export function getTributeAlliance(
  alliances: Map<string, EngineAlliance>,
  tributeId: string
): EngineAlliance | null {
  for (const alliance of alliances.values()) {
    if (alliance.status === "active" && alliance.tributeIds.includes(tributeId)) {
      return alliance;
    }
  }
  return null;
}

/**
 * Returns all active alliances in the game.
 */
export function getActiveAlliances(
  alliances: Map<string, EngineAlliance>
): EngineAlliance[] {
  return Array.from(alliances.values()).filter((a) => a.status === "active");
}

/**
 * Checks if two tributes share an active alliance.
 */
export function areTributesAllied(
  alliances: Map<string, EngineAlliance>,
  tributeIdA: string,
  tributeIdB: string
): boolean {
  if (tributeIdA === tributeIdB) return false;
  const allianceA = getTributeAlliance(alliances, tributeIdA);
  if (!allianceA) return false;
  return allianceA.tributeIds.includes(tributeIdB);
}

/**
 * Returns the array of tribute IDs who are allied with the specified tribute.
 */
export function getAlliedTributeIds(
  alliances: Map<string, EngineAlliance>,
  tributeId: string
): string[] {
  const alliance = getTributeAlliance(alliances, tributeId);
  if (!alliance) return [];
  return alliance.tributeIds.filter((id) => id !== tributeId);
}

// ==========================================
// 5. Lifecycle State Transitions & Recruitment
// ==========================================

export function createAlliance(
  gameId: string,
  tributeIds: string[],
  formedPhaseId: string | null = null,
  customId?: string,
  name?: string
): EngineAlliance {
  return {
    id: customId ?? `alliance-${gameId.slice(0, 8)}-${Date.now()}`,
    gameId,
    name: name ?? "Survival Pact",
    tributeIds: [...tributeIds].slice(0, MAX_ALLIANCE_SIZE),
    status: "active",
    formedPhaseId,
    dissolvedPhaseId: null,
    betrayedByTributeId: null,
    cohesion: 75,
  };
}

export function dissolveAlliance(
  alliance: EngineAlliance,
  dissolvedPhaseId: string | null = null
): EngineAlliance {
  return {
    ...alliance,
    status: "dissolved",
    dissolvedPhaseId,
    cohesion: 0,
  };
}

export function betrayAlliance(
  alliance: EngineAlliance,
  betrayerId: string,
  dissolvedPhaseId: string | null = null
): EngineAlliance {
  return {
    ...alliance,
    status: "betrayed",
    betrayedByTributeId: betrayerId,
    dissolvedPhaseId,
    cohesion: 0,
  };
}

/**
 * Checks whether a candidate tribute can join an existing alliance.
 */
export function canJoinAlliance(
  alliance: EngineAlliance,
  candidate: EngineTribute,
  totalAliveCount: number
): boolean {
  if (alliance.status !== "active") return false;
  if (alliance.tributeIds.includes(candidate.id)) return false;
  if (candidate.status !== "alive") return false;

  const sizeCap = getAllianceSizeCapForRoster(totalAliveCount);
  return alliance.tributeIds.length < sizeCap && alliance.tributeIds.length < MAX_ALLIANCE_SIZE;
}

/**
 * Adds a new member to an active alliance.
 */
export function recruitTributeToAlliance(
  alliance: EngineAlliance,
  candidateId: string
): EngineAlliance {
  if (alliance.tributeIds.includes(candidateId)) return alliance;
  if (alliance.tributeIds.length >= MAX_ALLIANCE_SIZE) return alliance;

  return {
    ...alliance,
    tributeIds: [...alliance.tributeIds, candidateId],
  };
}

// ==========================================
// 6. Strain Evaluation & Betrayal Calculus
// ==========================================

export type BetrayalReason =
  | "insufficient_alive_members"
  | "paranoid_breakdown"
  | "endgame_climax"
  | "peaceful_drift"
  | "resource_desperation";

export interface AllianceStrainEvaluation {
  shouldDissolve: boolean;
  shouldBetray: boolean;
  isLethal: boolean;
  potentialBetrayerId?: string;
  potentialVictimId?: string;
  reason?: BetrayalReason;
  cohesionScore: number;
}

export interface EvaluateStrainOptions {
  settings?: EngineGameSettings;
  prng?: PRNG;
}

/**
 * Evaluates internal alliance strain, pack cohesion, and betrayal risk based on
 * psychological biometrics, lethal triggers, and endgame status.
 */
export function evaluateAllianceStrain(
  alliance: EngineAlliance,
  tributes: Map<string, EngineTribute>,
  totalAliveTributes: number,
  options: EvaluateStrainOptions = {}
): AllianceStrainEvaluation {
  const { settings } = options;

  const aliveMembers = alliance.tributeIds
    .map((id) => tributes.get(id))
    .filter((t): t is EngineTribute => t !== undefined && t.status === "alive");

  // 1. Natural Dissolution: Fewer than 2 alive members remain
  if (aliveMembers.length < 2) {
    return {
      shouldDissolve: true,
      shouldBetray: false,
      isLethal: false,
      reason: "insufficient_alive_members",
      cohesionScore: 0,
    };
  }

  const cohesionScore = calculateAllianceCohesion(alliance, tributes, totalAliveTributes);

  // 2. Paranoid Breakdown Trigger (Sanity < 25)
  for (const member of aliveMembers) {
    if (isTributeParanoid(member.biometrics.sanity)) {
      // Find victim: the ally with lowest affinity to betrayer or lowest survival
      const potentialVictims = aliveMembers.filter((m) => m.id !== member.id);
      const sortedVictims = [...potentialVictims].sort((a, b) => {
        const affA = calculateTributeAffinity(member, a);
        const affB = calculateTributeAffinity(member, b);
        return affA - affB || a.biometrics.survival - b.biometrics.survival;
      });

      return {
        shouldDissolve: false,
        shouldBetray: true,
        isLethal: true,
        potentialBetrayerId: member.id,
        potentialVictimId: sortedVictims[0]?.id,
        reason: "paranoid_breakdown",
        cohesionScore,
      };
    }
  }

  // 3. Endgame Tension Trigger (<= 4 tributes remaining in entire match)
  if (totalAliveTributes <= ENDGAME_TRIBUTE_COUNT) {
    // Check for District Duo Twist exemption
    const isDistrictDuoTwistActive =
      settings?.victoryCondition === "district_duo_twist" &&
      aliveMembers.length === 2 &&
      aliveMembers[0].district === aliveMembers[1].district;

    if (!isDistrictDuoTwistActive) {
      // Find the most ruthless / opportunistic betrayer
      const sortedByThreat = [...aliveMembers].sort(
        (a, b) =>
          b.killCount - a.killCount ||
          b.biometrics.survival - a.biometrics.survival ||
          a.biometrics.sanity - b.biometrics.sanity
      );

      const betrayer = sortedByThreat[0];
      const victims = aliveMembers.filter((m) => m.id !== betrayer.id);
      const sortedVictims = [...victims].sort(
        (a, b) => a.biometrics.survival - b.biometrics.survival
      );

      return {
        shouldDissolve: false,
        shouldBetray: true,
        isLethal: true,
        potentialBetrayerId: betrayer.id,
        potentialVictimId: sortedVictims[0]?.id,
        reason: "endgame_climax",
        cohesionScore,
      };
    }
  }

  // 4. Low Cohesion / Peaceful Drift (Cohesion < 20 without severe paranoia)
  if (cohesionScore <= ALLIANCE_COHESION_FRACTURE) {
    return {
      shouldDissolve: true,
      shouldBetray: false,
      isLethal: false,
      reason: "peaceful_drift",
      cohesionScore,
    };
  }

  return {
    shouldDissolve: false,
    shouldBetray: false,
    isLethal: false,
    cohesionScore,
  };
}

// ==========================================
// 7. Post-Phase Reconciliation & Degraded Alliances
// ==========================================

/**
 * Scans all active alliances in the game.
 * If any alliance has fewer than 2 living members due to combat casualties, mutts, or hazards,
 * it cleanly dissolves the alliance and records the phase ID.
 */
export function syncDegradedAlliances(
  alliances: Map<string, EngineAlliance>,
  tributes: Map<string, EngineTribute>,
  currentPhaseId: string | null = null
): Map<string, EngineAlliance> {
  const syncedAlliances = new Map<string, EngineAlliance>(alliances);

  for (const [id, alliance] of syncedAlliances.entries()) {
    if (alliance.status !== "active") continue;

    const livingMembers = alliance.tributeIds
      .map((tid) => tributes.get(tid))
      .filter((t): t is EngineTribute => t !== undefined && t.status === "alive");

    if (livingMembers.length < MIN_ALLIANCE_SIZE) {
      syncedAlliances.set(id, dissolveAlliance(alliance, currentPhaseId));
    } else {
      // Update real-time cohesion score
      const totalAlive = Array.from(tributes.values()).filter((t) => t.status === "alive").length;
      const cohesion = calculateAllianceCohesion(alliance, tributes, totalAlive);
      syncedAlliances.set(id, { ...alliance, cohesion });
    }
  }

  return syncedAlliances;
}
