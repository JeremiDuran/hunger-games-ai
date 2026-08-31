# Hunger Games AI — Simulation Rules & Customization Reference

> **Document Status**: Approved Technical & Gameplay Reference  
> **Last Updated**: 2026-08-31  
> **Related Documents**: [`routes_and_ux_flow.md`](./routes_and_ux_flow.md), [`database_schema.md`](./database_schema.md), [`technical_stack.md`](./technical_stack.md)

---

## 1. Architectural Philosophy

In Hunger Games AI, all game outcomes (attacks, injuries, item acquisitions, casualties, alliances) are **100% deterministic** and computed by the procedural simulation engine based on mathematical RNG, tribute stats, and Gamemaker rules.  
The **Large Language Model (LLM)** never determines outcomes—it acts strictly as the **Storyteller & Broadcaster**, transforming raw state transitions into immersive, sensory narratives.

The customization suite configured in the setup wizard (`/setup`) calibrates both the **deterministic simulation engine** and the **AI narrative style**.

---

## 2. Step 1: Arena Protocol & Physical Capabilities

Step 1 establishes the physical environment of the arena and master toggles for Capitol mechanisms.

| Option Key | Type / Range | Default | Purpose & Engine / Narrative Impact |
| :--- | :--- | :--- | :--- |
| `simulationTitle` | String (3–80 chars) | `"The 74th Annual Hunger Games"` | Official broadcast name displayed in headers, phase transitions, and final archives. |
| `arenaName` | String (3–80 chars) | Preset / Custom | Broadcast codename of the arena battleground. |
| `arenaDescription` | String (10–1,200 chars) | Preset / Custom | **Rich LLM Context**: Injected directly into AI system prompts to steer terrain descriptions, weather, hazards, and environmental tactics. |
| `enableBloodbath` | Boolean (`true`/`false`) | `true` | **Day 0 Opening Clash**: When enabled, tributes contest weapons and supplies at the Cornucopia horn on Day 0 with elevated lethality. When disabled, all tributes scatter immediately into the perimeter. |
| `enableMuttations` | Boolean (`true`/`false`) | `true` | **Capitol Bio-Weapons**: Master switch enabling engineered beasts (tracker jackers, wolf mutts, night hunters) deployed by Gamemakers. |
| `enableDisasters` | Boolean (`true`/`false`) | `true` | **Environmental Traps**: Master switch enabling forcefield traps, acid rain, toxic fog, wildfire walls, and flash floods. |
| `enableSponsorDrops` | Boolean (`true`/`false`) | `true` | **Capitol Patronage**: Master switch enabling silver parachute drops carrying medicine, food, or weapons to active tributes. |

---

## 3. Step 2: District Roster & Tribute Attributes

Step 2 configures the participants deployed into the Cornucopia.

| Attribute | Range / Type | Purpose & Engine / Narrative Impact |
| :--- | :--- | :--- |
| **Total Tributes & Capacity** | 12 to 48 (Multiples of 2) | Configures the scale of the game (Default: 24 tributes across 12 districts). |
| **Tributes per District** | 2, 3, or 4 tributes | Dictates district team sizes and alliance potential. |
| `name` | String (2–60 chars) | Tribute identity used in logs, combat resolutions, and death announcements. |
| `district` | Integer (1–24) | District origin (affects default skill proficiencies and alliance affinities). |
| `gender` | `male` \| `female` \| `non_binary` \| `unspecified` | Pronouns and phrasing used by the AI narrative generator. |
| `personality` | String (0–280 chars) | **AI Temperament Steer**: Instructs the LLM on tactical style, emotional state, dialogue, and morality (e.g., *"Ruthless Career pack leader"*, *"Stealthy forager"*). |
| `physicalAspect` | String (0–280 chars) | **Visual Signature Prompt**: Steers physical descriptions, signature weapons, build, or visual identifiers in narrative text. |
| `avatarUrl` | String URL / Null | Custom portrait image rendered on tribute cards and death recap memorials. |

---

## 4. Step 3: Simulation Rules & Pacing Customization

Step 3 fine-tunes turn execution, combat probability distributions, hazard timing, and narrative style.

### A. Turn Granularity & Simulation Speed

| Option Key | Available Values | Default | Mechanical & UX Impact |
| :--- | :--- | :--- | :--- |
| `turnGranularity` | • `event_by_event`<br>• `full_phase`<br>• `autoplay` | `event_by_event` | • **`event_by_event`**: Advances one single encounter at a time for maximum suspense and tactical micro-storytelling.<br>• **`full_phase`**: Simulates the entire Day or Night phase in a single batch (ideal for group viewing or rapid simulations).<br>• **`autoplay`**: Continuous autonomous streaming with timed pauses between events. |
| `pacing` | • `cinematic`<br>• `normal`<br>• `instant` | `cinematic` | • **`cinematic`**: Full token streaming, suspense pauses during lethal clashes, and memorial cannon chimes.<br>• **`normal`**: Steady token streaming speed.<br>• **`instant`**: Skips narrative streaming delays and calculates phase results immediately. |

---

### B. Combat Directives & Lethality Matrix

| Option Key | Available Values | Default | Mechanical & Gameplay Impact |
| :--- | :--- | :--- | :--- |
| `combatLethality` | • `balanced`<br>• `high_bloodbath`<br>• `gritty_survival` | `balanced` | • **`balanced`**: Standard survival distribution resulting in 6–8 arena days.<br>• **`high_bloodbath`**: Elevated critical hit and lethal clash probabilities resulting in fast 3–4 day matches.<br>• **`gritty_survival`**: Tributes prioritize foraging, concealment, and shelter over combat, resulting in longer 8–10 day games. |
| `allianceDynamic` | • `dynamic_pacts`<br>• `lone_wolves`<br>• `career_pack` | `dynamic_pacts` | • **`dynamic_pacts`**: Alliances form organically and fracture over resource scarcity or sleep ambushes.<br>• **`lone_wolves`**: Zero alliance formation; pure 100% individual free-for-all.<br>• **`career_pack`**: Tributes from Districts 1, 2, and 4 form cohesive hunting packs early on. |
| `enableMidGameFeast` | Boolean (`true`/`false`) | `true` | When enabled, Gamemakers summon remaining tributes to the Cornucopia with vital medicine and weapons when the tribute count drops low, triggering high-stakes confrontations. |

---

### C. Reactive Hazard Directives *(Bound to Step 1)*

These modifiers are reactively bound to master toggles in Step 1. If the parent hazard is disabled in Step 1, the modifier is locked as `"disabled"`.

| Option Key | Bound To (Step 1) | Available Values | Default | Impact When Active |
| :--- | :--- | :--- | :--- | :--- |
| `sponsorGenerosity` | `enableSponsorDrops` | • `standard`<br>• `abundance`<br>• `famine` | `standard` | • **`standard`**: Occasional critical drops earned by charismatic or high-kill tributes.<br>• **`abundance`**: Frequent parachutes with food, medical kits, and high-tier gear.<br>• **`famine`**: Zero sponsor drops; survival depends 100% on wild foraging and hunting. |
| `muttationTiming` | `enableMuttations` | • `climax_only`<br>• `night_stalkers` | `climax_only` | • **`climax_only`**: Bio-engineered mutts spawn only in the endgame ($\le 3$ tributes) to force a final showdown.<br>• **`night_stalkers`**: Predatory muttations roam the arena grounds dynamically every night phase. |
| `disasterFrequency` | `enableDisasters` | • `moderate`<br>• `frequent`<br>• `reactive_only` | `moderate` | • **`moderate`**: Periodic weather/terrain hazards.<br>• **`frequent`**: Unrelenting environmental cataclysms forcing constant movement.<br>• **`reactive_only`**: Traps triggered only when combat enters a multi-day stalemate. |

---

### D. AI Storytelling Persona & Broadcast Tone

| Option Key | Available Values | Default | Narrative Style & Prompt Steering |
| :--- | :--- | :--- | :--- |
| `narrativeVoice` | • `novel_cinematic`<br>• `capitol_broadcast`<br>• `gamemaker_log` | `novel_cinematic` | • **`novel_cinematic`**: Immersive, sensory 3rd-person prose capturing internal psychology and visceral arena survival.<br>• **`capitol_broadcast`**: Flamboyant, sensationalist, propaganda commentary ala Caesar Flickerman & Claudius Templesmith.<br>• **`gamemaker_log`**: Cold, clinical military surveillance reports with objective casualty telemetry. |

---

### E. Victory Protocol & Twist Rules

| Option Key | Available Values | Default | Victory Evaluation Rule |
| :--- | :--- | :--- | :--- |
| `victoryCondition` | • `sole_victor`<br>• `district_duo_twist` | `sole_victor` | • **`sole_victor`**: Traditional Hunger Games rule: Exactly one tribute must be the last one standing.<br>• **`district_duo_twist`**: 74th Games Twist: If the final two surviving tributes belong to the same District, both are declared joint Victors. |

---

## 5. Database Serialization (`public.games.settings` JSONB)

All Step 1 hazards and Step 3 rule directives are serialized into the `settings` column of `public.games`:

```json
{
  "enable_bloodbath": true,
  "enable_muttations": true,
  "enable_disasters": true,
  "enable_sponsor_drops": true,
  "pacing": "cinematic",
  "turn_granularity": "event_by_event",
  "combat_lethality": "balanced",
  "sponsor_generosity": "standard",
  "muttation_timing": "climax_only",
  "disaster_frequency": "moderate",
  "alliance_dynamic": "dynamic_pacts",
  "enable_mid_game_feast": true,
  "narrative_voice": "novel_cinematic",
  "victory_condition": "sole_victor"
}
```
