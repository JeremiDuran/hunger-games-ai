import { describe, it, expect } from "vitest";
import {
  arenaSetupSchema,
  validateArenaFields,
  safeParseArenaDraft,
  tributeSchema,
  tributesSetupSchema,
  validateTributesFields,
  safeParseTributesDraft,
  rulesSetupSchema,
  safeParseRulesDraft,
  DEFAULT_RULES_STATE,
  toGameDbPayload,
  toTributesDbPayload,
} from "@/lib/schemas/setup";
import { ArenaSetupState, TributeData, TributesSetupState, RulesSetupState } from "@/types/setup";

describe("Arena Setup Schema & Validation (Step 1)", () => {
  const validArenaState: ArenaSetupState = {
    simulationTitle: "The 74th Annual Hunger Games",
    arenaName: "The Forest Arena",
    arenaDescription: "A dense, temperate forest surrounding a wide clearing with a silver Cornucopia.",
    hazards: {
      enableBloodbath: true,
      enableMuttations: true,
      enableDisasters: false,
      enableSponsorDrops: true,
    },
    pacing: "cinematic",
  };

  it("passes validation for a fully valid arena setup state", () => {
    // Arrange & Act
    const result = arenaSetupSchema.safeParse(validArenaState);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.simulationTitle).toBe("The 74th Annual Hunger Games");
      expect(result.data.arenaName).toBe("The Forest Arena");
      expect(result.data.hazards.enableBloodbath).toBe(true);
      expect(result.data.pacing).toBe("cinematic");
    }
  });

  it("trims whitespace from string fields", () => {
    // Arrange
    const stateWithWhitespace = {
      ...validArenaState,
      simulationTitle: "   75th Quarter Quell   ",
      arenaName: "   Clock Arena   ",
      arenaDescription: "   A deadly saltwater clock arena divided into twelve hour segments.   ",
    };

    // Act
    const parsed = arenaSetupSchema.parse(stateWithWhitespace);

    // Assert
    expect(parsed.simulationTitle).toBe("75th Quarter Quell");
    expect(parsed.arenaName).toBe("Clock Arena");
    expect(parsed.arenaDescription).toBe("A deadly saltwater clock arena divided into twelve hour segments.");
  });

  it("rejects simulation title shorter than 3 characters or whitespace-only", () => {
    // Arrange
    const shortTitleState = { ...validArenaState, simulationTitle: "HG" };
    const whitespaceTitleState = { ...validArenaState, simulationTitle: "   " };

    // Act & Assert
    const resShort = arenaSetupSchema.safeParse(shortTitleState);
    const resWhitespace = arenaSetupSchema.safeParse(whitespaceTitleState);

    expect(resShort.success).toBe(false);
    expect(resWhitespace.success).toBe(false);

    if (!resShort.success) {
      expect(resShort.error.issues[0].message).toBe("titleMin");
    }
  });

  it("rejects simulation title longer than 80 characters", () => {
    // Arrange
    const longTitle = "A".repeat(81);
    const state = { ...validArenaState, simulationTitle: longTitle };

    // Act
    const result = arenaSetupSchema.safeParse(state);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("titleMax");
    }
  });

  it("rejects arena name shorter than 3 or longer than 80 characters", () => {
    // Arrange
    const shortNameState = { ...validArenaState, arenaName: "Ab" };
    const longNameState = { ...validArenaState, arenaName: "Z".repeat(81) };

    // Act
    const resShort = arenaSetupSchema.safeParse(shortNameState);
    const resLong = arenaSetupSchema.safeParse(longNameState);

    // Assert
    expect(resShort.success).toBe(false);
    expect(resLong.success).toBe(false);
    if (!resShort.success) expect(resShort.error.issues[0].message).toBe("arenaNameMin");
    if (!resLong.success) expect(resLong.error.issues[0].message).toBe("arenaNameMax");
  });

  it("rejects arena description shorter than 10 or longer than 1200 characters", () => {
    // Arrange
    const shortDescState = { ...validArenaState, arenaDescription: "Too short" };
    const longDescState = { ...validArenaState, arenaDescription: "D".repeat(1201) };

    // Act
    const resShort = arenaSetupSchema.safeParse(shortDescState);
    const resLong = arenaSetupSchema.safeParse(longDescState);

    // Assert
    expect(resShort.success).toBe(false);
    expect(resLong.success).toBe(false);
    if (!resShort.success) expect(resShort.error.issues[0].message).toBe("descMin");
    if (!resLong.success) expect(resLong.error.issues[0].message).toBe("descMax");
  });

  it("validates pacing enum options and defaults to cinematic", () => {
    // Arrange
    const instantState = { ...validArenaState, pacing: "instant" as const };
    const normalState = { ...validArenaState, pacing: "normal" as const };
    const invalidState = { ...validArenaState, pacing: "turbo" };

    // Act & Assert
    expect(arenaSetupSchema.safeParse(instantState).success).toBe(true);
    expect(arenaSetupSchema.safeParse(normalState).success).toBe(true);
    expect(arenaSetupSchema.safeParse(invalidState).success).toBe(false);
  });

  describe("validateArenaFields helper", () => {
    it("returns isValid: true and empty errors map for valid state", () => {
      const { isValid, errors } = validateArenaFields(validArenaState);
      expect(isValid).toBe(true);
      expect(errors).toEqual({});
    });

    it("returns isValid: false and mapped field keys for invalid state", () => {
      const invalidState: ArenaSetupState = {
        simulationTitle: " ",
        arenaName: "X",
        arenaDescription: "Short",
        hazards: {
          enableBloodbath: true,
          enableMuttations: true,
          enableDisasters: true,
          enableSponsorDrops: true,
        },
        pacing: "cinematic",
      };

      const { isValid, errors } = validateArenaFields(invalidState);
      expect(isValid).toBe(false);
      expect(errors.simulationTitle).toBe("titleMin");
      expect(errors.arenaName).toBe("arenaNameMin");
      expect(errors.arenaDescription).toBe("descMin");
    });
  });

  describe("safeParseArenaDraft helper", () => {
    it("returns parsed state for valid draft object", () => {
      const parsed = safeParseArenaDraft(validArenaState);
      expect(parsed).not.toBeNull();
      expect(parsed?.simulationTitle).toBe(validArenaState.simulationTitle);
    });

    it("returns null for non-object, null, or corrupted data", () => {
      expect(safeParseArenaDraft(null)).toBeNull();
      expect(safeParseArenaDraft("string")).toBeNull();
      expect(safeParseArenaDraft(123)).toBeNull();
      expect(safeParseArenaDraft({ title: "Incomplete" })).toBeNull();
    });
  });
});

describe("Tributes Setup Schema & Validation (Step 2)", () => {
  const createMockTribute = (id: string, name: string, district: number): TributeData => ({
    id,
    name,
    district,
    gender: "female",
    personality: "Fierce and resourceful archer.",
    physicalAspect: "Lean and athletic with dark braided hair.",
    avatarUrl: "https://example.com/avatar.jpg",
  });

  const validTribute = createMockTribute("tribute-1", "Katniss Everdeen", 12);

  describe("Individual Tribute Schema", () => {
    it("validates a compliant tribute object", () => {
      const result = tributeSchema.safeParse(validTribute);
      expect(result.success).toBe(true);
    });

    it("trims whitespace from name, personality, and physical aspect", () => {
      const tribute = {
        ...validTribute,
        name: "   Peeta Mellark   ",
        personality: "   Brave and compassionate.   ",
        physicalAspect: "   Stocky with blond hair.   ",
      };

      const parsed = tributeSchema.parse(tribute);
      expect(parsed.name).toBe("Peeta Mellark");
      expect(parsed.personality).toBe("Brave and compassionate.");
      expect(parsed.physicalAspect).toBe("Stocky with blond hair.");
    });

    it("rejects tribute name shorter than 2 or longer than 60 characters", () => {
      const shortRes = tributeSchema.safeParse({ ...validTribute, name: "K" });
      const longRes = tributeSchema.safeParse({ ...validTribute, name: "A".repeat(61) });

      expect(shortRes.success).toBe(false);
      expect(longRes.success).toBe(false);
      if (!shortRes.success) expect(shortRes.error.issues[0].message).toBe("nameMin");
      if (!longRes.success) expect(longRes.error.issues[0].message).toBe("nameMax");
    });

    it("rejects invalid district numbers (must be integer 1..24)", () => {
      expect(tributeSchema.safeParse({ ...validTribute, district: 0 }).success).toBe(false);
      expect(tributeSchema.safeParse({ ...validTribute, district: 25 }).success).toBe(false);
      expect(tributeSchema.safeParse({ ...validTribute, district: 3.5 }).success).toBe(false);
      expect(tributeSchema.safeParse({ ...validTribute, district: 1 }).success).toBe(true);
      expect(tributeSchema.safeParse({ ...validTribute, district: 24 }).success).toBe(true);
    });

    it("accepts all valid gender enums and rejects unknown values", () => {
      const validGenders = ["male", "female", "non_binary", "unspecified"] as const;
      for (const gender of validGenders) {
        expect(tributeSchema.safeParse({ ...validTribute, gender }).success).toBe(true);
      }
      expect(tributeSchema.safeParse({ ...validTribute, gender: "other" }).success).toBe(false);
    });

    it("enforces 280 character limit on personality and physical aspect", () => {
      const maxText = "A".repeat(280);
      const overflowText = "A".repeat(281);

      expect(tributeSchema.safeParse({ ...validTribute, personality: maxText }).success).toBe(true);
      expect(tributeSchema.safeParse({ ...validTribute, personality: overflowText }).success).toBe(false);

      expect(tributeSchema.safeParse({ ...validTribute, physicalAspect: maxText }).success).toBe(true);
      expect(tributeSchema.safeParse({ ...validTribute, physicalAspect: overflowText }).success).toBe(false);
    });

    it("defaults empty personality and physicalAspect to empty string", () => {
      const minimalTribute = {
        id: "t-min",
        name: "Gale Hawthorne",
        district: 12,
        gender: "male" as const,
      };

      const parsed = tributeSchema.parse(minimalTribute);
      expect(parsed.personality).toBe("");
      expect(parsed.physicalAspect).toBe("");
      expect(parsed.avatarUrl).toBeNull();
    });
  });

  describe("Tributes Roster Setup Schema & validateTributesFields", () => {
    const buildRoster = (count: number): TributeData[] => {
      return Array.from({ length: count }, (_, i) =>
        createMockTribute(`t-${i + 1}`, `Tribute ${i + 1}`, Math.floor(i / 2) + 1)
      );
    };

    it("validates a standard 24-tribute roster with 2 tributes per district", () => {
      const rosterState: TributesSetupState = {
        totalTributes: 24,
        tributesPerDistrict: 2,
        districtCount: 12,
        tributes: buildRoster(24),
      };

      const result = tributesSetupSchema.safeParse(rosterState);
      expect(result.success).toBe(true);

      const { isValid, errors } = validateTributesFields(rosterState.tributes, 24);
      expect(isValid).toBe(true);
      expect(errors).toEqual({});
    });

    it("rejects odd totalTributes count or odd roster length", () => {
      const rosterWith13 = buildRoster(13);
      const oddState = {
        totalTributes: 13,
        tributesPerDistrict: 2,
        districtCount: 7,
        tributes: rosterWith13,
      };

      const result = tributesSetupSchema.safeParse(oddState);
      expect(result.success).toBe(false);

      const { isValid } = validateTributesFields(rosterWith13);
      expect(isValid).toBe(false);
    });

    it("rejects totalTributes out of the 12..48 boundary", () => {
      expect(tributesSetupSchema.safeParse({
        totalTributes: 10,
        tributesPerDistrict: 2,
        districtCount: 5,
        tributes: buildRoster(10),
      }).success).toBe(false);

      expect(tributesSetupSchema.safeParse({
        totalTributes: 50,
        tributesPerDistrict: 2,
        districtCount: 25,
        tributes: buildRoster(50),
      }).success).toBe(false);
    });

    it("maps errors per tribute ID when individual tributes fail validation", () => {
      const roster = buildRoster(24);
      // Corrupt tribute 1 and tribute 3
      roster[0] = { ...roster[0], name: " " }; // empty
      roster[2] = { ...roster[2], name: "Z".repeat(65) }; // too long

      const { isValid, errors } = validateTributesFields(roster, 24);
      expect(isValid).toBe(false);
      expect(errors[roster[0].id]?.name).toBe("nameMin");
      expect(errors[roster[2].id]?.name).toBe("nameMax");
      expect(errors[roster[1].id]).toBeUndefined();
    });
  });

  describe("safeParseTributesDraft helper", () => {
    it("parses valid direct tributes draft state", () => {
      const roster = Array.from({ length: 12 }, (_, i) =>
        createMockTribute(`t-${i + 1}`, `Tribute ${i + 1}`, Math.floor(i / 2) + 1)
      );
      const draft = {
        totalTributes: 12,
        tributesPerDistrict: 2,
        districtCount: 6,
        tributes: roster,
      };

      const parsed = safeParseTributesDraft(draft);
      expect(parsed).not.toBeNull();
      expect(parsed?.totalTributes).toBe(12);
      expect(parsed?.tributes.length).toBe(12);
    });

    it("handles legacy draft format fallback correctly", () => {
      const legacyTributes = Array.from({ length: 16 }, (_, i) => ({
        id: `legacy-${i + 1}`,
        name: `Legacy Tribute ${i + 1}`,
        district: Math.floor(i / 2) + 1,
        gender: "unspecified" as const,
      }));

      const legacyDraft = {
        tributes: legacyTributes,
        tributesPerDistrict: 4,
      };

      const parsed = safeParseTributesDraft(legacyDraft);
      expect(parsed).not.toBeNull();
      expect(parsed?.totalTributes).toBe(16);
      expect(parsed?.tributesPerDistrict).toBe(4);
      expect(parsed?.districtCount).toBe(4);
    });

    it("returns null for invalid or empty drafts", () => {
      expect(safeParseTributesDraft(null)).toBeNull();
      expect(safeParseTributesDraft({})).toBeNull();
      expect(safeParseTributesDraft({ tributes: [] })).toBeNull();
    });
  });
});

describe("Rules & Protocol Setup Schema (Step 3)", () => {
  it("validates DEFAULT_RULES_STATE successfully", () => {
    const result = rulesSetupSchema.safeParse(DEFAULT_RULES_STATE);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.turnGranularity).toBe("event_by_event");
      expect(result.data.pacing).toBe("cinematic");
      expect(result.data.combatLethality).toBe("balanced");
      expect(result.data.sponsorGenerosity).toBe("standard");
      expect(result.data.muttationTiming).toBe("climax_only");
      expect(result.data.disasterFrequency).toBe("moderate");
      expect(result.data.allianceDynamic).toBe("dynamic_pacts");
      expect(result.data.enableMidGameFeast).toBe(true);
      expect(result.data.narrativeVoice).toBe("novel_cinematic");
      expect(result.data.victoryCondition).toBe("sole_victor");
    }
  });

  it("validates custom directives and enums", () => {
    const customRules: RulesSetupState = {
      turnGranularity: "autoplay",
      pacing: "instant",
      combatLethality: "high_bloodbath",
      sponsorGenerosity: "abundance",
      muttationTiming: "night_stalkers",
      disasterFrequency: "frequent",
      allianceDynamic: "career_pack",
      enableMidGameFeast: false,
      narrativeVoice: "capitol_broadcast",
      victoryCondition: "district_duo_twist",
    };

    const result = rulesSetupSchema.safeParse(customRules);
    expect(result.success).toBe(true);
  });

  it("rejects unknown enum directives", () => {
    const invalidRules = {
      ...DEFAULT_RULES_STATE,
      narrativeVoice: "pirate_radio",
      combatLethality: "peaceful",
    };

    const result = rulesSetupSchema.safeParse(invalidRules);
    expect(result.success).toBe(false);
  });

  describe("safeParseRulesDraft helper", () => {
    it("parses valid rules draft", () => {
      const parsed = safeParseRulesDraft(DEFAULT_RULES_STATE);
      expect(parsed).not.toBeNull();
      expect(parsed?.turnGranularity).toBe("event_by_event");
    });

    it("returns null for non-object or corrupt rules drafts", () => {
      expect(safeParseRulesDraft(null)).toBeNull();
      expect(safeParseRulesDraft("corrupt")).toBeNull();
      expect(safeParseRulesDraft({ turnGranularity: "invalid_value" })).toBeNull();
    });
  });
});

describe("Payload Serialization & Database Parity Transforms", () => {
  const arenaState: ArenaSetupState = {
    simulationTitle: "The 74th Annual Hunger Games",
    arenaName: "Capitol Forest Arena",
    arenaDescription: "Dense temperate wilderness with treacherous ravines.",
    hazards: {
      enableBloodbath: true,
      enableMuttations: false, // disabled muttations
      enableDisasters: true,
      enableSponsorDrops: false, // disabled sponsor drops
    },
    pacing: "cinematic",
  };

  const customRulesState: RulesSetupState = {
    ...DEFAULT_RULES_STATE,
    combatLethality: "high_bloodbath",
    allianceDynamic: "career_pack",
  };

  describe("toGameDbPayload", () => {
    it("transforms camelCase setup state to snake_case Supabase games schema payload", () => {
      // Act
      const payload = toGameDbPayload(arenaState, "user-guest-123", 24, customRulesState);

      // Assert
      expect(payload.user_id).toBe("user-guest-123");
      expect(payload.title).toBe("The 74th Annual Hunger Games");
      expect(payload.arena_name).toBe("Capitol Forest Arena");
      expect(payload.arena_description).toBe("Dense temperate wilderness with treacherous ravines.");
      expect(payload.tribute_count).toBe(24);
      expect(payload.status).toBe("setup");

      // Verify settings JSONB
      expect(payload.settings.enable_bloodbath).toBe(true);
      expect(payload.settings.enable_muttations).toBe(false);
      expect(payload.settings.enable_disasters).toBe(true);
      expect(payload.settings.enable_sponsor_drops).toBe(false);
      expect(payload.settings.combat_lethality).toBe("high_bloodbath");
      expect(payload.settings.alliance_dynamic).toBe("career_pack");

      // Verify disabled hazard mappings
      expect(payload.settings.sponsor_generosity).toBe("disabled");
      expect(payload.settings.muttation_timing).toBe("disabled");
      expect(payload.settings.disaster_frequency).toBe("moderate");
    });

    it("throws a ZodError if tribute count is not a valid even number between 2 and 48", () => {
      expect(() => toGameDbPayload(arenaState, "u-1", 13)).toThrow();
      expect(() => toGameDbPayload(arenaState, "u-1", 0)).toThrow();
      expect(() => toGameDbPayload(arenaState, "u-1", 50)).toThrow();
    });

    it("throws a ZodError if arena state fails schema validation", () => {
      const invalidArena = { ...arenaState, simulationTitle: "HG" };
      expect(() => toGameDbPayload(invalidArena, "u-1", 24)).toThrow();
    });
  });

  describe("toTributesDbPayload", () => {
    it("transforms tribute list to snake_case Supabase tributes schema insert payloads", () => {
      const tributes: TributeData[] = [
        {
          id: "t-1",
          name: "Katniss Everdeen",
          district: 12,
          gender: "female",
          personality: "Reserved and fiercely protective.",
          physicalAspect: "Olive skin and dark hair.",
          avatarUrl: null,
        },
        {
          id: "t-2",
          name: "Peeta Mellark",
          district: 12,
          gender: "male",
          personality: "Artistic and charismatic orator.",
          physicalAspect: "Broad shoulders and ash blond hair.",
          avatarUrl: "https://example.com/peeta.png",
        },
      ];

      // Act
      const payloads = toTributesDbPayload(tributes, "game-uuid-456");

      // Assert
      expect(payloads).toHaveLength(2);

      const [first, second] = payloads;
      expect(first.game_id).toBe("game-uuid-456");
      expect(first.name).toBe("Katniss Everdeen");
      expect(first.district).toBe(12);
      expect(first.gender).toBe("female");
      expect(first.personality).toBe("Reserved and fiercely protective.");
      expect(first.physical_aspect).toBe("Olive skin and dark hair.");
      expect(first.avatar_url).toBeNull();
      expect(first.status).toBe("alive");
      expect(first.kill_count).toBe(0);
      expect(first.stats).toEqual({ health: 100, strength: 50, agility: 50, intelligence: 50 });
      expect(first.inventory).toEqual([]);

      expect(second.name).toBe("Peeta Mellark");
      expect(second.avatar_url).toBe("https://example.com/peeta.png");
    });

    it("throws a ZodError if any tribute has invalid data", () => {
      const invalidTributes: TributeData[] = [
        {
          id: "t-bad",
          name: "X", // < 2 chars
          district: 12,
          gender: "female",
          personality: "",
          physicalAspect: "",
          avatarUrl: null,
        },
      ];

      expect(() => toTributesDbPayload(invalidTributes, "game-1")).toThrow();
    });
  });
});
