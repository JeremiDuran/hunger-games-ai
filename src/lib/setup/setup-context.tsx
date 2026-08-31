"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useSyncExternalStore,
  ReactNode,
} from "react";
import {
  ArenaSetupState,
  SetupTab,
  ArenaPreset,
  GameStatus,
  TributeData,
  TributesSetupState,
  TributesPerDistrict,
  RulesSetupState,
  ArenaHazardSettings,
} from "@/types/setup";
import { ARENA_PRESETS } from "@/config/arena-presets";
import {
  getDefaultTributesState,
  getValidTributesPerDistrict,
  reconcileTributesRoster,
  clampToEvenTributes,
  DEFAULT_TOTAL_TRIBUTES,
  DEFAULT_TRIBUTES_PER_DISTRICT,
} from "@/config/tribute-presets";
import {
  validateArenaFields,
  safeParseArenaDraft,
  validateTributesFields,
  safeParseTributesDraft,
  safeParseRulesDraft,
  DEFAULT_RULES_STATE,
  rulesSetupSchema,
  ArenaFieldErrorMap,
  TributeFieldErrorMap,
} from "@/lib/schemas/setup";

const ARENA_DRAFT_STORAGE_KEY = "hg_setup_arena_draft";
const TRIBUTES_DRAFT_STORAGE_KEY = "hg_setup_tributes_draft";
const RULES_DRAFT_STORAGE_KEY = "hg_setup_rules_draft";

export type DraftStatus = "synced" | "error";

const DEFAULT_ARENA_STATE: ArenaSetupState = {
  simulationTitle: ARENA_PRESETS[0].simulationTitle,
  arenaName: ARENA_PRESETS[0].arenaName,
  arenaDescription: ARENA_PRESETS[0].description,
  hazards: { ...ARENA_PRESETS[0].hazards },
  pacing: "cinematic",
};

const DEFAULT_TRIBUTES_STATE: TributesSetupState = getDefaultTributesState(
  DEFAULT_TOTAL_TRIBUTES,
  DEFAULT_TRIBUTES_PER_DISTRICT
);

function findMatchingArenaPreset(draft: ArenaSetupState): string | null {
  const match = ARENA_PRESETS.find(
    (p) =>
      p.simulationTitle === draft.simulationTitle &&
      p.arenaName === draft.arenaName &&
      p.description === draft.arenaDescription &&
      p.hazards.enableBloodbath === draft.hazards.enableBloodbath &&
      p.hazards.enableMuttations === draft.hazards.enableMuttations &&
      p.hazards.enableDisasters === draft.hazards.enableDisasters &&
      p.hazards.enableSponsorDrops === draft.hazards.enableSponsorDrops
  );
  return match ? match.id : null;
}

function writeArenaDraftToStorage(state: ArenaSetupState) {
  if (typeof window === "undefined") return;
  try {
    const serialized = JSON.stringify(state);
    window.localStorage.setItem(ARENA_DRAFT_STORAGE_KEY, serialized);
    window.sessionStorage.setItem(ARENA_DRAFT_STORAGE_KEY, serialized);
  } catch {
    // QuotaExceededError or private browsing
  }
}

function writeTributesDraftToStorage(state: TributesSetupState) {
  if (typeof window === "undefined") return;
  try {
    const serialized = JSON.stringify(state);
    window.localStorage.setItem(TRIBUTES_DRAFT_STORAGE_KEY, serialized);
    window.sessionStorage.setItem(TRIBUTES_DRAFT_STORAGE_KEY, serialized);
  } catch {
    // QuotaExceededError or private browsing
  }
}

function writeRulesDraftToStorage(state: RulesSetupState) {
  if (typeof window === "undefined") return;
  try {
    const serialized = JSON.stringify(state);
    window.localStorage.setItem(RULES_DRAFT_STORAGE_KEY, serialized);
    window.sessionStorage.setItem(RULES_DRAFT_STORAGE_KEY, serialized);
  } catch {
    // QuotaExceededError or private browsing
  }
}

function subscribeToStorage(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

const emptyServerSnapshot = () => null;

const clientArenaSnapshot = () => {
  if (typeof window === "undefined") return null;
  try {
    return (
      window.localStorage.getItem(ARENA_DRAFT_STORAGE_KEY) ??
      window.sessionStorage.getItem(ARENA_DRAFT_STORAGE_KEY) ??
      null
    );
  } catch {
    return null;
  }
};

const clientTributesSnapshot = () => {
  if (typeof window === "undefined") return null;
  try {
    return (
      window.localStorage.getItem(TRIBUTES_DRAFT_STORAGE_KEY) ??
      window.sessionStorage.getItem(TRIBUTES_DRAFT_STORAGE_KEY) ??
      null
    );
  } catch {
    return null;
  }
};

const clientRulesSnapshot = () => {
  if (typeof window === "undefined") return null;
  try {
    return (
      window.localStorage.getItem(RULES_DRAFT_STORAGE_KEY) ??
      window.sessionStorage.getItem(RULES_DRAFT_STORAGE_KEY) ??
      null
    );
  } catch {
    return null;
  }
};

interface SetupContextValue {
  activeTab: SetupTab;
  setActiveTab: (tab: SetupTab) => void;
  // Step 1: Arena
  arenaState: ArenaSetupState;
  selectedArenaPresetId: string | null;
  selectedPresetId: string | null; // Alias for backward compatibility
  arenaErrors: ArenaFieldErrorMap;
  errors: ArenaFieldErrorMap; // Alias for backward compatibility
  arenaTouched: Partial<Record<keyof ArenaSetupState, boolean>>;
  touched: Partial<Record<keyof ArenaSetupState, boolean>>; // Alias for backward compatibility
  isArenaValid: boolean;
  updateArena: (updates: Partial<ArenaSetupState>) => void;
  setArenaFieldTouched: (field: keyof ArenaSetupState) => void;
  setFieldTouched: (field: keyof ArenaSetupState) => void; // Alias for backward compatibility
  applyArenaPreset: (preset: ArenaPreset) => void;
  applyPreset: (preset: ArenaPreset) => void; // Alias for backward compatibility
  applyArenaPresetById: (presetId: string) => void;
  applyPresetById: (presetId: string) => void; // Alias for backward compatibility
  resetArenaToDefault: () => void;
  resetToDefault: () => void; // Alias for backward compatibility
  validateArenaStep: () => boolean;
  enableHazardInArena: (hazardKey: keyof ArenaHazardSettings) => void;

  // Step 2: Tributes
  tributesState: TributesSetupState;
  tributes: TributeData[];
  totalTributes: number;
  tributesPerDistrict: TributesPerDistrict;
  districtCount: number;
  validTributesPerDistrictOptions: TributesPerDistrict[];
  tributeErrors: TributeFieldErrorMap;
  tributesTouched: Record<string, boolean>;
  isTributesValid: boolean;
  updateTribute: (id: string, updates: Partial<TributeData>) => void;
  setTotalTributes: (count: number) => void;
  setTributesPerDistrict: (count: TributesPerDistrict) => void;
  clearAllTributes: () => void;
  batchImportTributeNames: (names: string[]) => void;
  resetTributesToDefault: () => void;
  validateTributesStep: () => boolean;

  // Step 3: Rules & Pacing
  rulesState: RulesSetupState;
  isRulesValid: boolean;
  updateRules: (updates: Partial<RulesSetupState>) => void;
  resetRulesToDefault: () => void;

  // Global Setup Meta
  isHydrated: boolean;
  draftStatus: DraftStatus;
  gameStatus: GameStatus;
  isLaunchReady: boolean;
}

const SetupContext = createContext<SetupContextValue | null>(null);

export function SetupProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<SetupTab>("arena");
  const [customArenaState, setCustomArenaState] = useState<ArenaSetupState | null>(null);
  const [arenaTouched, setArenaTouched] = useState<
    Partial<Record<keyof ArenaSetupState, boolean>>
  >({});

  const [customTributesState, setCustomTributesState] = useState<TributesSetupState | null>(null);
  const [tributesTouched, setTributesTouched] = useState<Record<string, boolean>>({});

  const [customRulesState, setCustomRulesState] = useState<RulesSetupState | null>(null);

  const rawArenaStorage = useSyncExternalStore(
    subscribeToStorage,
    clientArenaSnapshot,
    emptyServerSnapshot
  );

  const rawTributesStorage = useSyncExternalStore(
    subscribeToStorage,
    clientTributesSnapshot,
    emptyServerSnapshot
  );

  const rawRulesStorage = useSyncExternalStore(
    subscribeToStorage,
    clientRulesSnapshot,
    emptyServerSnapshot
  );

  // 1. Arena State
  const arenaState = useMemo<ArenaSetupState>(() => {
    if (customArenaState !== null) return customArenaState;
    if (rawArenaStorage) {
      try {
        const parsed = safeParseArenaDraft(JSON.parse(rawArenaStorage));
        if (parsed) return parsed;
      } catch {
        // Corrupt storage payload; fallback to default
      }
    }
    return DEFAULT_ARENA_STATE;
  }, [customArenaState, rawArenaStorage]);

  const selectedArenaPresetId = useMemo(
    () => findMatchingArenaPreset(arenaState),
    [arenaState]
  );

  const { isValid: isArenaValid, errors: arenaErrors } = useMemo(
    () => validateArenaFields(arenaState),
    [arenaState]
  );

  // 2. Tributes State
  const tributesState = useMemo<TributesSetupState>(() => {
    if (customTributesState !== null) return customTributesState;
    if (rawTributesStorage) {
      try {
        const parsed = safeParseTributesDraft(JSON.parse(rawTributesStorage));
        if (parsed) return parsed;
      } catch {
        // Corrupt storage payload; fallback to default
      }
    }
    return DEFAULT_TRIBUTES_STATE;
  }, [customTributesState, rawTributesStorage]);

  const validTributesPerDistrictOptions = useMemo(
    () => getValidTributesPerDistrict(tributesState.totalTributes),
    [tributesState.totalTributes]
  );

  const { isValid: isTributesValid, errors: tributeErrors } = useMemo(
    () => validateTributesFields(tributesState.tributes, tributesState.totalTributes),
    [tributesState.tributes, tributesState.totalTributes]
  );

  // 3. Rules & Pacing State
  const rulesState = useMemo<RulesSetupState>(() => {
    if (customRulesState !== null) return customRulesState;
    if (rawRulesStorage) {
      try {
        const parsed = safeParseRulesDraft(JSON.parse(rawRulesStorage));
        if (parsed) return parsed;
      } catch {
        // Corrupt storage payload; fallback to default
      }
    }
    return DEFAULT_RULES_STATE;
  }, [customRulesState, rawRulesStorage]);

  const isRulesValid = useMemo(() => {
    return rulesSetupSchema.safeParse(rulesState).success;
  }, [rulesState]);

  const isHydrated = typeof window !== "undefined";
  const draftStatus: DraftStatus = isArenaValid && isTributesValid && isRulesValid ? "synced" : "error";
  const isLaunchReady = isArenaValid && isTributesValid && isRulesValid;

  // Arena Handlers
  const setArenaFieldTouched = useCallback((field: keyof ArenaSetupState) => {
    setArenaTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const applyArenaPreset = useCallback(
    (preset: ArenaPreset) => {
      const nextState: ArenaSetupState = {
        ...arenaState,
        simulationTitle: preset.simulationTitle,
        arenaName: preset.arenaName,
        arenaDescription: preset.description,
        hazards: { ...preset.hazards },
      };
      setCustomArenaState(nextState);
      writeArenaDraftToStorage(nextState);
      setArenaTouched({});
    },
    [arenaState]
  );

  const applyArenaPresetById = useCallback(
    (presetId: string) => {
      const found = ARENA_PRESETS.find((p) => p.id === presetId);
      if (found) {
        applyArenaPreset(found);
      }
    },
    [applyArenaPreset]
  );

  const updateArena = useCallback(
    (updates: Partial<ArenaSetupState>) => {
      const nextState: ArenaSetupState = { ...arenaState, ...updates };
      setCustomArenaState(nextState);
      const { isValid } = validateArenaFields(nextState);
      if (isValid) {
        writeArenaDraftToStorage(nextState);
      }
    },
    [arenaState]
  );

  const enableHazardInArena = useCallback(
    (hazardKey: keyof ArenaHazardSettings) => {
      const nextState: ArenaSetupState = {
        ...arenaState,
        hazards: {
          ...arenaState.hazards,
          [hazardKey]: true,
        },
      };
      setCustomArenaState(nextState);
      writeArenaDraftToStorage(nextState);
    },
    [arenaState]
  );

  const resetArenaToDefault = useCallback(() => {
    setCustomArenaState(DEFAULT_ARENA_STATE);
    writeArenaDraftToStorage(DEFAULT_ARENA_STATE);
    setArenaTouched({});
  }, []);

  const validateArenaStep = useCallback((): boolean => {
    setArenaTouched({
      simulationTitle: true,
      arenaName: true,
      arenaDescription: true,
      hazards: true,
      pacing: true,
    });
    return isArenaValid;
  }, [isArenaValid]);

  // Tributes Handlers
  const updateTribute = useCallback(
    (id: string, updates: Partial<TributeData>) => {
      const updatedList = tributesState.tributes.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      );
      const nextState: TributesSetupState = {
        ...tributesState,
        tributes: updatedList,
      };
      setCustomTributesState(nextState);
      const { isValid } = validateTributesFields(updatedList, nextState.totalTributes);
      if (isValid) {
        writeTributesDraftToStorage(nextState);
      }
    },
    [tributesState]
  );

  const setTotalTributes = useCallback(
    (newTotal: number) => {
      const clampedTotal = clampToEvenTributes(newTotal);
      const validDivisors = getValidTributesPerDistrict(clampedTotal);
      if (validDivisors.length === 0) return;

      const resolvedPerDistrict = validDivisors.includes(tributesState.tributesPerDistrict)
        ? tributesState.tributesPerDistrict
        : validDivisors[0];

      const reconciledTributes = reconcileTributesRoster(
        tributesState.tributes,
        clampedTotal,
        resolvedPerDistrict
      );

      const nextState: TributesSetupState = {
        totalTributes: clampedTotal,
        tributesPerDistrict: resolvedPerDistrict,
        districtCount: Math.floor(clampedTotal / resolvedPerDistrict),
        tributes: reconciledTributes,
      };

      setCustomTributesState(nextState);
      writeTributesDraftToStorage(nextState);
    },
    [tributesState]
  );

  const setTributesPerDistrict = useCallback(
    (newPerDistrict: TributesPerDistrict) => {
      if (tributesState.totalTributes % newPerDistrict !== 0) return;

      const reconciledTributes = reconcileTributesRoster(
        tributesState.tributes,
        tributesState.totalTributes,
        newPerDistrict
      );

      const nextState: TributesSetupState = {
        ...tributesState,
        tributesPerDistrict: newPerDistrict,
        districtCount: Math.floor(tributesState.totalTributes / newPerDistrict),
        tributes: reconciledTributes,
      };

      setCustomTributesState(nextState);
      writeTributesDraftToStorage(nextState);
    },
    [tributesState]
  );

  const clearAllTributes = useCallback(() => {
    const clearedList = tributesState.tributes.map((t) => ({
      ...t,
      name: "",
      gender: "unspecified" as const,
      personality: "",
      physicalAspect: "",
      avatarUrl: null,
    }));

    const nextState: TributesSetupState = {
      ...tributesState,
      tributes: clearedList,
    };

    setCustomTributesState(nextState);
    writeTributesDraftToStorage(nextState);
    setTributesTouched({});
  }, [tributesState]);

  const batchImportTributeNames = useCallback(
    (names: string[]) => {
      if (!names.length) return;
      const updatedList = tributesState.tributes.map((t, idx) => {
        if (idx < names.length && names[idx].trim()) {
          return { ...t, name: names[idx].trim() };
        }
        return t;
      });
      const nextState: TributesSetupState = {
        ...tributesState,
        tributes: updatedList,
      };
      setCustomTributesState(nextState);
      writeTributesDraftToStorage(nextState);
    },
    [tributesState]
  );

  const resetTributesToDefault = useCallback(() => {
    const defaultState = getDefaultTributesState(
      DEFAULT_TOTAL_TRIBUTES,
      DEFAULT_TRIBUTES_PER_DISTRICT
    );
    setCustomTributesState(defaultState);
    writeTributesDraftToStorage(defaultState);
    setTributesTouched({});
  }, []);

  const validateTributesStep = useCallback((): boolean => {
    const allTouched: Record<string, boolean> = {};
    for (const t of tributesState.tributes) {
      allTouched[t.id] = true;
    }
    setTributesTouched(allTouched);
    return isTributesValid;
  }, [isTributesValid, tributesState.tributes]);

  // Rules Handlers
  const updateRules = useCallback(
    (updates: Partial<RulesSetupState>) => {
      const nextState: RulesSetupState = { ...rulesState, ...updates };
      setCustomRulesState(nextState);
      const { success } = rulesSetupSchema.safeParse(nextState);
      if (success) {
        writeRulesDraftToStorage(nextState);
      }
    },
    [rulesState]
  );

  const resetRulesToDefault = useCallback(() => {
    setCustomRulesState(DEFAULT_RULES_STATE);
    writeRulesDraftToStorage(DEFAULT_RULES_STATE);
  }, []);

  const gameStatus: GameStatus = "setup";

  const value = useMemo<SetupContextValue>(
    () => ({
      activeTab,
      setActiveTab,
      // Arena
      arenaState,
      selectedArenaPresetId,
      selectedPresetId: selectedArenaPresetId,
      arenaErrors,
      errors: arenaErrors,
      arenaTouched,
      touched: arenaTouched,
      isArenaValid,
      updateArena,
      setArenaFieldTouched,
      setFieldTouched: setArenaFieldTouched,
      applyArenaPreset,
      applyPreset: applyArenaPreset,
      applyArenaPresetById,
      applyPresetById: applyArenaPresetById,
      resetArenaToDefault,
      resetToDefault: resetArenaToDefault,
      validateArenaStep,
      enableHazardInArena,
      // Tributes
      tributesState,
      tributes: tributesState.tributes,
      totalTributes: tributesState.totalTributes,
      tributesPerDistrict: tributesState.tributesPerDistrict,
      districtCount: tributesState.districtCount,
      validTributesPerDistrictOptions,
      tributeErrors,
      tributesTouched,
      isTributesValid,
      updateTribute,
      setTotalTributes,
      setTributesPerDistrict,
      clearAllTributes,
      batchImportTributeNames,
      resetTributesToDefault,
      validateTributesStep,
      // Rules
      rulesState,
      isRulesValid,
      updateRules,
      resetRulesToDefault,
      // Global
      isHydrated,
      draftStatus,
      gameStatus,
      isLaunchReady,
    }),
    [
      activeTab,
      arenaState,
      selectedArenaPresetId,
      arenaErrors,
      arenaTouched,
      isArenaValid,
      updateArena,
      setArenaFieldTouched,
      applyArenaPreset,
      applyArenaPresetById,
      resetArenaToDefault,
      validateArenaStep,
      enableHazardInArena,
      tributesState,
      validTributesPerDistrictOptions,
      tributeErrors,
      tributesTouched,
      isTributesValid,
      updateTribute,
      setTotalTributes,
      setTributesPerDistrict,
      clearAllTributes,
      batchImportTributeNames,
      resetTributesToDefault,
      validateTributesStep,
      rulesState,
      isRulesValid,
      updateRules,
      resetRulesToDefault,
      isHydrated,
      draftStatus,
      gameStatus,
      isLaunchReady,
    ]
  );

  return (
    <SetupContext.Provider value={value}>{children}</SetupContext.Provider>
  );
}

export function useSetup(): SetupContextValue {
  const context = useContext(SetupContext);
  if (!context) {
    throw new Error("useSetup must be used within a SetupProvider");
  }
  return context;
}
