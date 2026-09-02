---
name: simulation-engine
description: >-
  Use this skill when working with, querying, modifying, debugging, or extending
  the Hunger Games AI simulation engine (procedural generation, phase lifecycle,
  combat calculus, biometrics, items lifecycle, slot matchmaking, alliances,
  PRNG seed determinism, database adapters, or narrative serialization).
  Provides instant lookup tables, key formulas, file maps, and direct links
  to comprehensive engine docs in docs/.
---

# Hunger Games AI — Simulation Engine Skill & Cheat Sheet

This skill provides an immediate, token-efficient cheatsheet for navigating and working with the deterministic simulation engine located at [`src/lib/engine/`](file:///c:/jj_projects/hg-ai/src/lib/engine).

For the exhaustive mathematical and architectural specification, read the master document:
👉 **[`docs/simulation_engine_reference.md`](file:///c:/jj_projects/hg-ai/docs/simulation_engine_reference.md)**

---

## 1. Quick File & Function Lookup Matrix

Need to inspect, modify, or debug a simulation feature? Find the exact file and entry point below:

| Feature / Subsystem | Primary Implementation File | Key Functions / Types |
| :--- | :--- | :--- |
| **Phase Orchestration** | [`src/lib/engine/orchestrator.ts`](file:///c:/jj_projects/hg-ai/src/lib/engine/orchestrator.ts) | `advanceGamePhase()`, `validatePhaseEventCoverage()`, `assertPhaseCompleteness()` |
| **Slot Matchmaker** | [`src/lib/engine/matchmaker.ts`](file:///c:/jj_projects/hg-ai/src/lib/engine/matchmaker.ts) | `partitionTributesIntoEncounters()`, `generatePartitionSizes()` |
| **Biometrics (HP & Sanity)**| [`src/lib/engine/biometrics.ts`](file:///c:/jj_projects/hg-ai/src/lib/engine/biometrics.ts) | `clampBiometric()`, `evaluatePhysicalTag()`, `evaluateMentalTag()`, `applyBiometricDelta()` |
| **Combat Calculus (1v1)** | [`src/lib/engine/combat/calculus.ts`](file:///c:/jj_projects/hg-ai/src/lib/engine/combat/calculus.ts) | `calculateTotalCombatPower()`, `calculateWinProbability()`, `resolve1v1Clash()` |
| **Lethality Scaling** | [`src/lib/engine/combat/lethality.ts`](file:///c:/jj_projects/hg-ai/src/lib/engine/combat/lethality.ts) | `scaleDamageByLethality()`, `getCriticalFatalProbability()`, `getStandoffProbability()` |
| **Specialized Encounters**| [`src/lib/engine/combat/phase-calculus.ts`](file:///c:/jj_projects/hg-ai/src/lib/engine/combat/phase-calculus.ts) | `resolveBloodbathHornClash()`, `resolveNightAmbush()`, `resolveHazardEncounter()` |
| **Item Buffs & Tiers** | [`src/lib/engine/items/buffs.ts`](file:///c:/jj_projects/hg-ai/src/lib/engine/items/buffs.ts) | `calculateWeaponBonus()`, `calculateArmorMitigation()`, `normalizeItems()` |
| **Item Lifecycle & Loot** | [`src/lib/engine/items/lifecycle.ts`](file:///c:/jj_projects/hg-ai/src/lib/engine/items/lifecycle.ts) | `claimItem()`, `stealItem()`, `destroyItem()`, `dropInventoryOnDeath()` |
| **Procedural Item Gen** | [`src/lib/engine/items/synthesizer.ts`](file:///c:/jj_projects/hg-ai/src/lib/engine/items/synthesizer.ts) | `generateThematicItemsForArena()`, `generateSponsorDropItem()` |
| **Alliances & Betrayals** | [`src/lib/engine/alliances.ts`](file:///c:/jj_projects/hg-ai/src/lib/engine/alliances.ts) | `calculateTributeAffinity()`, `calculateAllianceCohesion()`, `evaluateAllianceBetrayalRisk()` |
| **Seeded PRNG** | [`src/lib/engine/prng.ts`](file:///c:/jj_projects/hg-ai/src/lib/engine/prng.ts) | `createPRNG()`, `hashStringToSeed()`, `generateDeterministicUuid()` |
| **Database Adapters** | [`src/lib/engine/adapters.ts`](file:///c:/jj_projects/hg-ai/src/lib/engine/adapters.ts) | `dbTributeToEngine()`, `engineTributeToDbUpdate()`, `enginePhaseResultToDbInserts()` |
| **Narrative Payload** | [`src/lib/engine/narrative-serializer.ts`](file:///c:/jj_projects/hg-ai/src/lib/engine/narrative-serializer.ts) | `serializeEventToNarrativePayload()`, `computeParticipantRole()` |
| **Constants & Thresholds**| [`src/lib/engine/constants.ts`](file:///c:/jj_projects/hg-ai/src/lib/engine/constants.ts) | Central numerical constants (zero magic numbers). |

---

## 2. Core Invariants & Rules

When writing or changing code in `src/lib/engine`:

1. **Dead Tributes Cannot Act**: Only tributes with `status === "alive"` can participate in phase events.
2. **100% Phase Coverage Required**: Every living tribute must be assigned to an encounter in each phase. `assertPhaseCompleteness` enforces this before phase advancement.
3. **Pure Functions & Immutability**: Resolvers return fresh clones of `EngineTribute` and `EngineGameState`. Never mutate in-place.
4. **Deterministic PRNG**: Never use `Math.random()`. Pass the `prng` instance (`Mulberry32`) down to all roll functions.
5. **No AI in Combat Rolls**: Never call OpenRouter or LLMs to determine whether an attack hits, who survives, or what items drop. AI is used solely for narrative prose generation on the completed state transition.

---

## 3. Mathematical Formulas Cheat Sheet

### Combat Power
$$\text{BasePower} = (\text{Survival} \times 0.6) + (\text{Sanity} \times 0.4)$$
$$\text{TotalPower} = \text{BasePower} \times (1 + \text{WeaponBonus} + \text{ToolBonus}) \times \text{ConditionMult} \times \text{AmbushMult}(1.25) \times \text{NumericalMult}(1.40)$$

### Win Probability (Bradley-Terry)
$$P(A \text{ wins}) = \frac{\text{Power}_A^{1.5}}{\text{Power}_A^{1.5} + \text{Power}_B^{1.5}}$$

### Biometric Tags & Gauges
* **Survival ($0$ to $100$)**:
  * $\le 0 \to$ `fatal` (Status becomes `"dead"`)
  * $1–29 \to$ `critically_injured`
  * $30–54 \to$ `wounded`
  * $55–79 \to$ `scratched`
  * $80–100 \to$ `unscathed`
* **Sanity ($0$ to $100$)**:
  * $< 15 \to$ `manic` / `delirious`
  * $15–34 \to$ `paranoid` ($<25$ triggers backstab risk)
  * $35–54 \to$ `anxious`
  * $55–79 \to$ `composed`
  * $80–100 \to$ `resolute` ($>75$ grants tactical composure)

### Alliance Cohesion & Affinity
* **Affinity**: Same District ($+75$), Career District ($+60$), Paranoia ($-40$).
* **Cohesion ($0$ to $100$)**:
  $$\text{Cohesion} = 55 + \text{DistrictBonus}(+25) + \text{CareerBonus}(+20) + \frac{\text{AvgSanity} - 50}{2} - \text{ParanoiaPenalty}(-35)$$

---

## 4. Common Workflows

### Advancing a Match Phase
```typescript
import { advanceGamePhase } from "@/lib/engine";

const { phaseResult, nextGameState } = advanceGamePhase({
  gameState: currentEngineGameState,
  previousPhaseEvents: currentPhaseEvents, // Validates 100% coverage
});
```

### Zero-Residue Live DB Test Protocol
When writing tests that interact with Supabase DEV:
```typescript
let gameId: string | null = null;
try {
  const { data: game } = await supabase.from("games").insert({ ... }).select("id").single();
  gameId = game.id;
  // Seed tributes, alliances, execute phase...
} finally {
  if (gameId) {
    // Unconditional cascade cleanup
    await supabase.from("games").delete().eq("id", gameId);
  }
}
```

### Testing the Engine
Run the full simulation test suite:
```powershell
npm test
```
To run only engine-specific tests:
```powershell
npx vitest run src/lib/engine
```
