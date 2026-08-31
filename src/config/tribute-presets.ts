import { TributeData, TributesPerDistrict, TributesSetupState } from "@/types/setup";

export const MIN_TOTAL_TRIBUTES = 12;
export const MAX_TOTAL_TRIBUTES = 48;
export const DEFAULT_TOTAL_TRIBUTES = 24;
export const DEFAULT_TRIBUTES_PER_DISTRICT: TributesPerDistrict = 2;

export const TRIBUTES_PER_DISTRICT_OPTIONS: readonly TributesPerDistrict[] = [2, 3, 4] as const;

export const CANON_74TH_TRIBUTES: readonly TributeData[] = [
  // District 1
  {
    id: "tribute_74_d1_f",
    name: "Glimmer",
    district: 1,
    gender: "female",
    personality: "Charming, haughty Career tribute eager for Capitol spotlight and lethal bow ambushes.",
    physicalAspect: "Flowing blonde hair, striking emerald eyes, adorned in shimmering luxury silk.",
    avatarUrl: "https://static.wikia.nocookie.net/thehungergames/images/f/fc/Tribute_D1_female.jpg",
  },
  {
    id: "tribute_74_d1_m",
    name: "Marvel",
    district: 1,
    gender: "male",
    personality: "Ruthless spear specialist, confident in close-quarters skirmishes and pack tactics.",
    physicalAspect: "Tall, broad-shouldered with athletic poise and razor-sharp spear throwing reflexes.",
    avatarUrl: "https://static.wikia.nocookie.net/thehungergames/images/6/6d/MarvelNormal.png",
  },
  // District 2
  {
    id: "tribute_74_d2_f",
    name: "Clove",
    district: 2,
    gender: "female",
    personality: "Vicious, pinpoint knife thrower who takes sadistic delight in terrorizing prey.",
    physicalAspect: "Petite yet muscular frame, dark hair tied back, bandolier of throwing blades.",
    avatarUrl: "https://static.wikia.nocookie.net/thehungergames/images/b/b7/Tribute_D2_female.jpg",
  },
  {
    id: "tribute_74_d2_m",
    name: "Cato",
    district: 2,
    gender: "male",
    personality: "Ferocious Career pack commander driven by unrelenting bloodlust and Capitol glory.",
    physicalAspect: "Towering, heavily muscled frame with fierce gaze and lethal broadsword mastery.",
    avatarUrl: "https://static.wikia.nocookie.net/thehungergames/images/f/f5/CatoNormal.png",
  },
  // District 3
  {
    id: "tribute_74_d3_f",
    name: "District 3 Female",
    district: 3,
    gender: "female",
    personality: "Analytical and silent, adept at avoiding early clashes and assessing electronics.",
    physicalAspect: "Slender build with calculating gaze, quick agile fingers used to circuitry.",
    avatarUrl: "https://static.wikia.nocookie.net/thehungergames/images/c/c7/District_3_Female.jpg",
  },
  {
    id: "tribute_74_d3_m",
    name: "District 3 Male",
    district: 3,
    gender: "male",
    personality: "Brilliant tech strategist who reactivates landmines to fortify defensive perimeters.",
    physicalAspect: "Wiry build with dark curly hair and sharp, observant eyes.",
    avatarUrl: "https://static.wikia.nocookie.net/thehungergames/images/4/48/Tribute_D3_male.jpg",
  },
  // District 4
  {
    id: "tribute_74_d4_f",
    name: "District 4 Female",
    district: 4,
    gender: "female",
    personality: "Skilled coastal swimmer trained in Career tactics, trident thrusts, and marine stealth.",
    physicalAspect: "Sun-bronzed skin, athletic maritime build, quick underwater agility.",
    avatarUrl: "https://static.wikia.nocookie.net/thehungergames/images/a/a1/Tribute_D4_female.jpg",
  },
  {
    id: "tribute_74_d4_m",
    name: "District 4 Male",
    district: 4,
    gender: "male",
    personality: "Young but agile fisher with keen knot-tying and net-casting survival reflexes.",
    physicalAspect: "Lean and wiry coastal youth with windblown hair and sun-weathered hands.",
    avatarUrl: "https://static.wikia.nocookie.net/thehungergames/images/c/c8/District_4_Male.jpg",
  },
  // District 5
  {
    id: "tribute_74_d5_f",
    name: "Foxface",
    district: 5,
    gender: "female",
    personality: "Master stealth strategist who survives by scavenging scraps and observing unseen.",
    physicalAspect: "Vivid red hair, sharp fox-like features, and lightning-quick silent footwork.",
    avatarUrl: "https://static.wikia.nocookie.net/thehungergames/images/a/ad/Tribute_D5_Female_copy.jpg",
  },
  {
    id: "tribute_74_d5_m",
    name: "District 5 Male",
    district: 5,
    gender: "male",
    personality: "Cautious power plant laborer skilled in electrical current manipulation and evasion.",
    physicalAspect: "Medium build, soot-streaked jacket, watchful posture anticipating traps.",
    avatarUrl: "https://static.wikia.nocookie.net/thehungergames/images/2/2b/District_5_Male.jpg",
  },
  // District 6
  {
    id: "tribute_74_d6_f",
    name: "District 6 Female",
    district: 6,
    gender: "female",
    personality: "Urban speedster who excels at high-momentum evasion and sudden directional changes.",
    physicalAspect: "Lean and lightweight frame with determined expression and swift sprint stance.",
    avatarUrl: "https://static.wikia.nocookie.net/thehungergames/images/a/a4/District_6_Female_%2874th_HG%29.jpg",
  },
  {
    id: "tribute_74_d6_m",
    name: "District 6 Male",
    district: 6,
    gender: "male",
    personality: "Railway technician with keen mechanical instincts and steady hands under duress.",
    physicalAspect: "Broad shoulders, mechanic's calloused palms, focused and reserved.",
    avatarUrl: "https://static.wikia.nocookie.net/thehungergames/images/e/ec/District_6_Male_%2874th_HG%29.jpg",
  },
  // District 7
  {
    id: "tribute_74_d7_f",
    name: "District 7 Female",
    district: 7,
    gender: "female",
    personality: "Rugged lumberjack skilled in axe-throwing, canopy climbing, and woodcraft survival.",
    physicalAspect: "Tough weather-beaten frame, braided brown hair, flannel and leather attire.",
    avatarUrl: "https://static.wikia.nocookie.net/thehungergames/images/d/d0/District_7_Female_%2874th_HG%29.jpg",
  },
  {
    id: "tribute_74_d7_m",
    name: "District 7 Male",
    district: 7,
    gender: "male",
    personality: "Heavy timber feller with immense upper-body power and tree-fall ambush tactics.",
    physicalAspect: "Burly lumberman build with thick forearms and heavy rugged boots.",
    avatarUrl: "https://static.wikia.nocookie.net/thehungergames/images/8/82/District_7_Male_%2874th_HG%29.jpg",
  },
  // District 8
  {
    id: "tribute_74_d8_f",
    name: "District 8 Female",
    district: 8,
    gender: "female",
    personality: "Resourceful textile weaver adept at crafting camouflage netting and silent snares.",
    physicalAspect: "Nimble fingers, expressive eyes, dressed in patched patterned fabric.",
    avatarUrl: "https://static.wikia.nocookie.net/thehungergames/images/f/f4/Tribute_D8_Female_copy.jpg",
  },
  {
    id: "tribute_74_d8_m",
    name: "District 8 Male",
    district: 8,
    gender: "male",
    personality: "Tenacious mill worker with high stamina and surprising agility in tight confines.",
    physicalAspect: "Compact wiry frame, steady focused gaze, quick and evasive runner.",
    avatarUrl: "https://static.wikia.nocookie.net/thehungergames/images/4/40/District_8_Male.jpg",
  },
  // District 9
  {
    id: "tribute_74_d9_f",
    name: "District 9 Female",
    district: 9,
    gender: "female",
    personality: "Hardworking grain harvester familiar with sickle handling and field tracking.",
    physicalAspect: "Sun-freckled skin, braided hair, sturdy and determined posture.",
    avatarUrl: "https://static.wikia.nocookie.net/thehungergames/images/c/cd/District_9_Female.jpg",
  },
  {
    id: "tribute_74_d9_m",
    name: "District 9 Male",
    district: 9,
    gender: "male",
    personality: "Young harvester who contests the Cornucopia knife skirmish with fierce courage.",
    physicalAspect: "Youthful and agile with alert posture and swift reactions.",
    avatarUrl: "https://static.wikia.nocookie.net/thehungergames/images/4/47/District_9_Male.jpg",
  },
  // District 10
  {
    id: "tribute_74_d10_f",
    name: "District 10 Female",
    district: 10,
    gender: "female",
    personality: "Ranch hand skilled with lassos, field butchery, and reading animal behaviors.",
    physicalAspect: "Weather-touched complexion, practical leather gear, quiet and watchful.",
    avatarUrl: "https://static.wikia.nocookie.net/thehungergames/images/f/fe/District_10_Female.jpg",
  },
  {
    id: "tribute_74_d10_m",
    name: "District 10 Male",
    district: 10,
    gender: "male",
    personality: "Resilient livestock herder with immense physical endurance and pain tolerance.",
    physicalAspect: "Stocky muscular build, limp in left leg compensated by immense raw strength.",
    avatarUrl: "https://static.wikia.nocookie.net/thehungergames/images/0/0f/District_10_Male.jpg",
  },
  // District 11
  {
    id: "tribute_74_d11_f",
    name: "Rue",
    district: 11,
    gender: "female",
    personality: "Gentle and agile tree-dweller with four-note mockingjay whistles and medicinal lore.",
    physicalAspect: "Small, lightweight frame with dark curls, bright dark eyes, leaping across treetop branches.",
    avatarUrl: "https://static.wikia.nocookie.net/thehungergames/images/7/7e/Rue_tribute_portrait.jpg",
  },
  {
    id: "tribute_74_d11_m",
    name: "Thresh",
    district: 11,
    gender: "male",
    personality: "Solitary colossus with unyielding code of honor, ruling the tall grass wheatfields.",
    physicalAspect: "Immense physical stature, muscular dark skin, commanding and impenetrable presence.",
    avatarUrl: "https://static.wikia.nocookie.net/thehungergames/images/a/a2/ThreshNormal.png",
  },
  // District 12
  {
    id: "tribute_74_d12_f",
    name: "Katniss Everdeen",
    district: 12,
    gender: "female",
    personality: "The Mockingjay. Fiercely protective, master archer, hunter, and symbol of defiance.",
    physicalAspect: "Dark braided hair, olive skin, gray Seam eyes, wearing a golden Mockingjay pin.",
    avatarUrl: "https://static.wikia.nocookie.net/thehungergames/images/8/8e/Katniss_%282%29.jpg",
  },
  {
    id: "tribute_74_d12_m",
    name: "Peeta Mellark",
    district: 12,
    gender: "male",
    personality: "The Boy with the Bread. Master of camouflage, charismatic orator, loyal unto death.",
    physicalAspect: "Wavy ash-blonde hair, stocky baker's build, warm blue eyes, gentle smile.",
    avatarUrl: "https://static.wikia.nocookie.net/thehungergames/images/6/62/Peeta_Mellark_5.jpg",
  },
];

/**
 * Returns the list of valid tributes-per-district choices (from [2, 3, 4]) that evenly divide the total tribute count.
 */
export function getValidTributesPerDistrict(totalTributes: number): TributesPerDistrict[] {
  return TRIBUTES_PER_DISTRICT_OPTIONS.filter((count) => totalTributes % count === 0);
}

/**
 * Clamps and rounds a tribute count to an even integer between MIN_TOTAL_TRIBUTES and MAX_TOTAL_TRIBUTES.
 */
export function clampToEvenTributes(count: number): number {
  const bounded = Math.max(MIN_TOTAL_TRIBUTES, Math.min(MAX_TOTAL_TRIBUTES, Math.round(count)));
  if (bounded % 2 === 0) return bounded;
  return bounded + 1 <= MAX_TOTAL_TRIBUTES ? bounded + 1 : bounded - 1;
}

/**
 * Generates an agnostic blank tribute slot with a guaranteed unique ID.
 */
export function createBlankTribute(
  district: number,
  indexInDistrict: number,
  customId?: string
): TributeData {
  const uniqueId =
    customId ||
    `tribute_${Date.now()}_d${district}_s${indexInDistrict}_${Math.random().toString(36).slice(2, 8)}`;

  return {
    id: uniqueId,
    name: "",
    district,
    gender: "unspecified",
    personality: "",
    physicalAspect: "",
    avatarUrl: null,
  };
}

/**
 * Creates the initial default roster for the given capacity and layout (using Canon 74th baseline when possible).
 */
export function createInitialRoster(
  totalTributes: number = DEFAULT_TOTAL_TRIBUTES,
  tributesPerDistrict: TributesPerDistrict = DEFAULT_TRIBUTES_PER_DISTRICT
): TributeData[] {
  const safeTotal = clampToEvenTributes(totalTributes);
  const roster: TributeData[] = [];
  for (let i = 0; i < safeTotal; i++) {
    const district = Math.floor(i / tributesPerDistrict) + 1;
    const indexInDistrict = (i % tributesPerDistrict) + 1;

    if (i < CANON_74TH_TRIBUTES.length) {
      roster.push({
        ...CANON_74TH_TRIBUTES[i],
        district,
      });
    } else {
      roster.push(createBlankTribute(district, indexInDistrict, `tribute_slot_${i + 1}`));
    }
  }
  return roster;
}

/**
 * Generates the default initial TributesSetupState.
 */
export function getDefaultTributesState(
  totalTributes: number = DEFAULT_TOTAL_TRIBUTES,
  tributesPerDistrict: TributesPerDistrict = DEFAULT_TRIBUTES_PER_DISTRICT
): TributesSetupState {
  const safeTotal = clampToEvenTributes(totalTributes);
  const validDivisors = getValidTributesPerDistrict(safeTotal);
  const resolvedPerDistrict = validDivisors.includes(tributesPerDistrict)
    ? tributesPerDistrict
    : validDivisors[0] ?? 2;

  const districtCount = Math.floor(safeTotal / resolvedPerDistrict);
  const tributes = createInitialRoster(safeTotal, resolvedPerDistrict);

  return {
    totalTributes: safeTotal,
    tributesPerDistrict: resolvedPerDistrict,
    districtCount,
    tributes,
  };
}

/**
 * Reconciles an existing tribute roster when total tributes or tributes-per-district changes.
 * - Preserves all user-entered data for remaining slots.
 * - Automatically recalculates and updates `tribute.district` for every slot.
 * - If capacity expands up to 24, restores the Canon 74th character baseline for unpopulated slots.
 * - Appends clean new slots beyond 24; truncates if capacity decreases.
 */
export function reconcileTributesRoster(
  currentTributes: TributeData[],
  targetTotal: number,
  targetPerDistrict: TributesPerDistrict
): TributeData[] {
  const safeTotal = clampToEvenTributes(targetTotal);
  const reconciled: TributeData[] = [];

  for (let i = 0; i < safeTotal; i++) {
    const district = Math.floor(i / targetPerDistrict) + 1;
    const indexInDistrict = (i % targetPerDistrict) + 1;

    if (i < currentTributes.length) {
      // Preserve existing tribute data, update district assignment
      reconciled.push({
        ...currentTributes[i],
        district,
      });
    } else if (i < CANON_74TH_TRIBUTES.length) {
      // Seamlessly restore Canon 74th character baseline when expanding
      reconciled.push({
        ...CANON_74TH_TRIBUTES[i],
        district,
      });
    } else {
      // Append clean blank slot for custom capacity > 24
      reconciled.push(
        createBlankTribute(
          district,
          indexInDistrict,
          `tribute_slot_${i + 1}_${Date.now().toString(36)}`
        )
      );
    }
  }

  return reconciled;
}

