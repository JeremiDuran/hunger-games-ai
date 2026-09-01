/**
 * Hunger Games AI — Alliance Cohesion & Lifecycle Manager
 * Pure functions for managing alliance pacts, district affinities, and psychological strain.
 */

import { PRNG } from "./prng";
import {
  EngineTribute,
  EngineAlliance,
} from "./types";
import { AllianceDynamic } from "@/types/setup";
import { isTributeParanoid } from "./biometrics";
import { ENDGAME_TRIBUTE_COUNT } from "./constants";

// ==========================================
// Constants & Configuration
// ==========================================

export const CAREER_DISTRICTS = [1, 2, 4] as const;
export const DISTRICT_PARTNER_BASE_AFFINITY = 75;
export const CAREER_PACK_BASE_AFFINITY = 60;
export const SAME_DISTRICT_ALLIANCE_PROBABILITY = 0.75;
export const SPONTANEOUS_TRUCE_AFFINITY_THRESHOLD = 50;

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

  // 1. Same District affinity boost
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
 * Initializes alliances at game startup based on the selected Gamemaker AllianceDynamic setting.
 */
export function bootstrapInitialAlliances(
  tributes: EngineTribute[],
  dynamic: AllianceDynamic,
  gameId: string,
  prng: PRNG
): Map<string, EngineAlliance> {
  const alliances = new Map<string, EngineAlliance>();

  if (dynamic === "lone_wolves") {
    return alliances;
  }

  if (dynamic === "career_pack") {
    const careerTributes = tributes.filter((t) =>
      (CAREER_DISTRICTS as readonly number[]).includes(t.district) && t.status === "alive"
    );

    if (careerTributes.length >= 2) {
      const allianceId = `alliance-career-${gameId.slice(0, 8)}`;
      const careerAlliance: EngineAlliance = {
        id: allianceId,
        gameId,
        tributeIds: careerTributes.map((t) => t.id),
        status: "active",
        formedPhaseId: null,
        dissolvedPhaseId: null,
        betrayedByTributeId: null,
      };
      alliances.set(allianceId, careerAlliance);
    }
    return alliances;
  }

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
      if (districtTributes.length >= 2) {
        // District partners have high probability (e.g. 75%) to start allied
        const roll = prng.nextFloat();
        if (roll < SAME_DISTRICT_ALLIANCE_PROBABILITY) {
          const allianceId = `alliance-d${district}-${gameId.slice(0, 6)}-${pactCounter++}`;
          const alliance: EngineAlliance = {
            id: allianceId,
            gameId,
            tributeIds: districtTributes.map((t) => t.id),
            status: "active",
            formedPhaseId: null,
            dissolvedPhaseId: null,
            betrayedByTributeId: null,
          };
          alliances.set(allianceId, alliance);
        }
      }
    }
  }

  return alliances;
}

// ==========================================
// Alliance Queries & Utilities
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
// Lifecycle State Transitions
// ==========================================

export function createAlliance(
  gameId: string,
  tributeIds: string[],
  formedPhaseId: string | null = null,
  customId?: string
): EngineAlliance {
  return {
    id: customId ?? `alliance-${gameId.slice(0, 8)}-${Date.now()}`,
    gameId,
    tributeIds: [...tributeIds],
    status: "active",
    formedPhaseId,
    dissolvedPhaseId: null,
    betrayedByTributeId: null,
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
  };
}

export interface AllianceStrainEvaluation {
  shouldDissolve: boolean;
  shouldBetray: boolean;
  potentialBetrayerId?: string;
  reason?: string;
}

/**
 * Evaluates internal alliance strain and betrayal risk based on psychological state and endgame status.
 */
export function evaluateAllianceStrain(
  alliance: EngineAlliance,
  tributes: Map<string, EngineTribute>,
  totalAliveTributes: number
): AllianceStrainEvaluation {
  const aliveMembers = alliance.tributeIds
    .map((id) => tributes.get(id))
    .filter((t): t is EngineTribute => t !== undefined && t.status === "alive");

  // If fewer than 2 alive members remain, the alliance naturally dissolves
  if (aliveMembers.length < 2) {
    return {
      shouldDissolve: true,
      shouldBetray: false,
      reason: "insufficient_alive_members",
    };
  }

  // Check for paranoid breakdown (Sanity < 25)
  for (const member of aliveMembers) {
    if (isTributeParanoid(member.biometrics.sanity)) {
      return {
        shouldDissolve: false,
        shouldBetray: true,
        potentialBetrayerId: member.id,
        reason: "paranoid_breakdown",
      };
    }
  }

  // Endgame tension (<= 4 tributes remaining in entire match)
  if (totalAliveTributes <= ENDGAME_TRIBUTE_COUNT) {
    // Find member with highest kill count or lowest sanity
    const sorted = [...aliveMembers].sort((a, b) => b.killCount - a.killCount || a.biometrics.sanity - b.biometrics.sanity);
    return {
      shouldDissolve: false,
      shouldBetray: true,
      potentialBetrayerId: sorted[0]?.id,
      reason: "endgame_climax",
    };
  }

  return {
    shouldDissolve: false,
    shouldBetray: false,
  };
}
