/**
 * Hunger Games AI — Phase Resolver Registry & Factory
 * Central dispatcher mapping PhaseType to its corresponding BasePhaseResolver strategy.
 */

import { PhaseType } from "../types";
import { BasePhaseResolver } from "./types";
import { BloodbathResolver } from "./bloodbath";
import { DayPhaseResolver } from "./day";
import { NightPhaseResolver } from "./night";
import { FeastPhaseResolver } from "./feast";
import {
  CataclysmResolver,
  NpcOverloadResolver,
  ArenaEventResolver,
} from "./special";

export * from "./types";
export * from "./bloodbath";
export * from "./day";
export * from "./night";
export * from "./feast";
export * from "./special";

const RESOLVER_REGISTRY: Record<PhaseType, BasePhaseResolver> = {
  bloodbath: new BloodbathResolver(),
  day: new DayPhaseResolver(),
  night: new NightPhaseResolver(),
  feast: new FeastPhaseResolver(),
  cataclysm: new CataclysmResolver(),
  npc_overload: new NpcOverloadResolver(),
  arena_event: new ArenaEventResolver(),
};

/**
 * Returns the appropriate BasePhaseResolver instance for the given PhaseType.
 * Defaults to DayPhaseResolver if an unrecognized phase type is provided.
 */
export function getPhaseResolver(phaseType: PhaseType): BasePhaseResolver {
  const resolver = RESOLVER_REGISTRY[phaseType];
  if (!resolver) {
    return RESOLVER_REGISTRY.day;
  }
  return resolver;
}
