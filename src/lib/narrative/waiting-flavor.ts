/**
 * Hunger Games AI — Waiting Flavor Text Engine
 * Dynamic Capitol surveillance and arena monitoring flavor text.
 * Replaces generic loading spinners with immersive, event-specific anticipation copy.
 */

import { EventCategory, OutcomeType } from "@/lib/engine/types";

export interface WaitingFlavorParams {
  eventCategory: EventCategory | string;
  outcomeType: OutcomeType | string;
  participantNames: string[];
  districtNumbers?: number[];
  eventId?: string;
}

/**
 * Helper to format tribute names grammatically into "A", "A and B", or "A, B, and C".
 */
export function formatTributeNames(names: string[]): string {
  if (!names || names.length === 0) return "Tributes";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

type FlavorDictionary = Record<string, Record<string, string[]>>;

const WAITING_FLAVOR_TEMPLATES: FlavorDictionary = {
  combat: {
    death: [
      "Capitol surveillance locks onto Sector 4: {tributes} are engaged in a lethal confrontation...",
      "Hovercraft cameras zoom in as {tributes} clash with fatal intent...",
      "Gamemakers hold their breath as {tributes} trade devastating blows at close quarters...",
      "Panem broadcast alert: life-signs plummeting in a violent clash between {tributes}...",
      "Static hums over the tactical audio feed as {tributes} grapple in an unforgiving clash...",
    ],
    wound: [
      "Capitol cameras pivot rapidly: {tributes} trade aggressive blows in the brush...",
      "Tactical biometrics register high trauma in an intense skirmish between {tributes}...",
      "Dust and grit kick up across the arena monitors as {tributes} fight fiercely...",
      "Gamemakers adjust audio telemetry as {tributes} exchange brutal weapon strikes...",
      "Arena surveillance tracks an aggressive clash as {tributes} collide...",
    ],
    flee: [
      "High-speed tracking drones follow {tributes} in a desperate pursuit across the perimeter...",
      "Sensors detect evasive maneuvers as {tributes} sprint for cover...",
      "Capitol commentators track a tense evasion sequence between {tributes}...",
      "Footsteps echo through the audio relays as {tributes} break contact and scatter...",
    ],
    loot: [
      "Surveillance feed monitors a contested scramble between {tributes}...",
      "Weapons drawn, {tributes} clash over vital arena gear...",
      "Gamemakers observe a tense equipment struggle involving {tributes}...",
    ],
    idle: [
      "Weapons raised, {tributes} warily circle each other in the brush...",
      "The arena monitors flicker as {tributes} trade cautious warnings...",
      "Surveillance relays capture a tense standoff between {tributes}...",
    ],
  },
  forage: {
    loot: [
      "Subterranean cameras follow {tributes} uncovering a hidden supply cache...",
      "Telemetry registers a successful resource discovery by {tributes}...",
      "Capitol drones track {tributes} scavenging desperately among the brush...",
      "Gamemaker sensors ping: {tributes} locates critical sustenance...",
    ],
    death: [
      "Hazard sensors alarm: {tributes} encounters toxic flora in the deep woods...",
      "Capitol biometric feeds detect catastrophic failure as {tributes} scours the wilderness...",
      "Gamemakers zoom in on an unexpected fatal blunder by {tributes}...",
    ],
    wound: [
      "Perimeter sensors trigger as {tributes} suffers an accident while foraging...",
      "Telemetry reports physical injury sustained by {tributes} during supply reconnaissance...",
      "Thermal monitors catch {tributes} stumbling into thorny arena undergrowth...",
    ],
    flee: [
      "Audio monitors pick up snapping twigs as {tributes} abandons a search and flees...",
      "Drones capture {tributes} scrambling away from an unstable sector...",
    ],
    idle: [
      "Capitol drones follow {tributes} quietly scouring the desolate terrain...",
      "{tributes} searches through the foliage, desperate for sustenance...",
      "Thermal imaging tracks {tributes} navigating through the sector...",
    ],
  },
  hazard: {
    death: [
      "Cataclysm alert in Sector 2! Gamemakers track {tributes} trapped in an arena hazard...",
      "Environmental lethal threshold exceeded: Capitol cameras pan to {tributes}...",
      "Capitol sirens reverberate in control as {tributes} succumbs to the arena traps...",
    ],
    wound: [
      "Environmental sensors spike as {tributes} braves hazardous terrain...",
      "Thermal imaging tracks {tributes} struggling through hostile environmental conditions...",
      "Gamemakers unleash sector hazards near {tributes}...",
    ],
    flee: [
      "Warning alarms blare as {tributes} sprints away from an approaching environmental hazard...",
      "Thermal telemetry captures {tributes} narrowly outrunning an arena trap...",
    ],
    idle: [
      "Barometric sensors shift rapidly as {tributes} monitors approaching weather anomalies...",
      "Capitol monitors watch {tributes} endure harsh environmental exposure...",
    ],
  },
  sponsor: {
    loot: [
      "A silver parachute drifts through the sky towards {tributes}...",
      "Capitol patron delivery confirmed: a parachute descends to {tributes}...",
      "Cheering erupts in the Capitol viewing galleries as gifts descend for {tributes}...",
      "High-altitude canister deployment locks onto coordinates for {tributes}...",
    ],
    idle: [
      "Sponsor drones calibrate coordinates near {tributes}...",
      "Parachute telemetry glides through the upper canopy near {tributes}...",
    ],
  },
  mutt: {
    death: [
      "Capitol bio-weapon deployment alert: engineered beasts close in on {tributes}...",
      "Sirens blare in Gamemaker control as apex muttations ambush {tributes}...",
      "Nightmarish growls fill the audio feed as {tributes} faces the Gamemakers' creatures...",
    ],
    wound: [
      "Hostile bio-telemetry spikes: predatory mutts attack {tributes}...",
      "Gamemaker monitors flash amber as {tributes} grapples with vicious muttations...",
    ],
    flee: [
      "Bio-telemetry tracks {tributes} frantically scrambling away from hunting mutts...",
      "Snarls and thrashing brush echo as {tributes} runs for their life...",
    ],
    idle: [
      "Chilling growls resonate through the canopy as {tributes} freezes in place...",
      "Muttation sensors track movement in the shadows circling {tributes}...",
    ],
  },
  social: {
    alliance: [
      "Audio intercept active: {tributes} whisper in the shadows, negotiating a pact...",
      "Surveillance feeds pick up clandestine gestures between {tributes}...",
      "Gamemakers monitor tentative truce talks between {tributes}...",
      "Capitol screens display a rare moment of trust forming between {tributes}...",
    ],
    wound: [
      "Sudden tension detected: an alliance fractures violently between {tributes}...",
      "Capitol sensors record a sudden betrayal strike between {tributes}...",
    ],
    flee: [
      "Cautious glances exchanged: {tributes} keep distance and quickly part ways...",
      "Sensors detect an uneasy standoff before {tributes} retreats into the shadows...",
    ],
    idle: [
      "Cross-sector microphones catch quiet murmurs as {tributes} cross paths...",
      "Wary eyes meet across the clearing as {tributes} size each other up...",
    ],
  },
};

const GENERIC_FALLBACK_TEMPLATES = [
  "Capitol surveillance feeds track {tributes} in active telemetry...",
  "Gamemaker control logs encounter activity for {tributes}...",
  "Hovercraft tracking drones follow {tributes} through the sector...",
  "Panem broadcast cameras pivot toward {tributes}...",
];

/**
 * Returns a flavorful, context-specific waiting text for the event.
 */
export function getWaitingFlavorText(params: WaitingFlavorParams): string {
  const { eventCategory, outcomeType, participantNames, eventId } = params;
  const tributesStr = formatTributeNames(participantNames);

  const categoryDict = WAITING_FLAVOR_TEMPLATES[eventCategory];
  const templates =
    (categoryDict && (categoryDict[outcomeType] || categoryDict.idle)) ||
    GENERIC_FALLBACK_TEMPLATES;

  // Deterministically select template using eventId if available, or random index
  let index = 0;
  if (eventId) {
    let hash = 0;
    for (let i = 0; i < eventId.length; i++) {
      hash = (hash * 31 + eventId.charCodeAt(i)) & 0x7fffffff;
    }
    index = hash % templates.length;
  } else {
    index = Math.floor(Math.random() * templates.length);
  }

  const template = templates[index] || templates[0];
  return template.replace(/{tributes}/g, tributesStr);
}
