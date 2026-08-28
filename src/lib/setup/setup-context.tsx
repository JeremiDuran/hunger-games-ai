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
} from "@/types/setup";
import { ARENA_PRESETS } from "@/config/arena-presets";
import {
  validateArenaFields,
  safeParseArenaDraft,
  ArenaFieldErrorMap,
} from "@/lib/schemas/setup";

const DRAFT_STORAGE_KEY = "hg_setup_arena_draft";

export type DraftStatus = "synced" | "error";

const DEFAULT_ARENA_STATE: ArenaSetupState = {
  simulationTitle: ARENA_PRESETS[0].simulationTitle,
  arenaName: ARENA_PRESETS[0].arenaName,
  arenaDescription: ARENA_PRESETS[0].description,
  hazards: { ...ARENA_PRESETS[0].hazards },
  pacing: "cinematic",
};

function findMatchingPreset(draft: ArenaSetupState): string | null {
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

function writeDraftToStorage(state: ArenaSetupState) {
  if (typeof window === "undefined") return;
  try {
    const serialized = JSON.stringify(state);
    window.localStorage.setItem(DRAFT_STORAGE_KEY, serialized);
    window.sessionStorage.setItem(DRAFT_STORAGE_KEY, serialized);
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

const clientStorageSnapshot = () => {
  if (typeof window === "undefined") return null;
  try {
    return (
      window.localStorage.getItem(DRAFT_STORAGE_KEY) ??
      window.sessionStorage.getItem(DRAFT_STORAGE_KEY) ??
      null
    );
  } catch {
    return null;
  }
};

interface SetupContextValue {
  activeTab: SetupTab;
  setActiveTab: (tab: SetupTab) => void;
  arenaState: ArenaSetupState;
  selectedPresetId: string | null;
  errors: ArenaFieldErrorMap;
  touched: Partial<Record<keyof ArenaSetupState, boolean>>;
  isArenaValid: boolean;
  isHydrated: boolean;
  draftStatus: DraftStatus;
  gameStatus: GameStatus;
  updateArena: (updates: Partial<ArenaSetupState>) => void;
  setFieldTouched: (field: keyof ArenaSetupState) => void;
  applyPreset: (preset: ArenaPreset) => void;
  applyPresetById: (presetId: string) => void;
  resetToDefault: () => void;
  validateArenaStep: () => boolean;
}

const SetupContext = createContext<SetupContextValue | null>(null);

export function SetupProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<SetupTab>("arena");
  const [customState, setCustomState] = useState<ArenaSetupState | null>(null);
  const [touched, setTouched] = useState<
    Partial<Record<keyof ArenaSetupState, boolean>>
  >({});

  const rawStorage = useSyncExternalStore(
    subscribeToStorage,
    clientStorageSnapshot,
    emptyServerSnapshot
  );

  const arenaState = useMemo<ArenaSetupState>(() => {
    if (customState !== null) return customState;
    if (rawStorage) {
      try {
        const parsed = safeParseArenaDraft(JSON.parse(rawStorage));
        if (parsed) return parsed;
      } catch {
        // Corrupt storage payload; fallback to default
      }
    }
    return DEFAULT_ARENA_STATE;
  }, [customState, rawStorage]);

  const selectedPresetId = useMemo(
    () => findMatchingPreset(arenaState),
    [arenaState]
  );

  // Live validation
  const { isValid: isArenaValid, errors } = useMemo(
    () => validateArenaFields(arenaState),
    [arenaState]
  );

  const isHydrated = typeof window !== "undefined";
  const draftStatus: DraftStatus = isArenaValid ? "synced" : "error";

  const setFieldTouched = useCallback((field: keyof ArenaSetupState) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const applyPreset = useCallback(
    (preset: ArenaPreset) => {
      const nextState: ArenaSetupState = {
        ...arenaState,
        simulationTitle: preset.simulationTitle,
        arenaName: preset.arenaName,
        arenaDescription: preset.description,
        hazards: { ...preset.hazards },
      };
      setCustomState(nextState);
      writeDraftToStorage(nextState);
      setTouched({});
    },
    [arenaState]
  );

  const applyPresetById = useCallback(
    (presetId: string) => {
      const found = ARENA_PRESETS.find((p) => p.id === presetId);
      if (found) {
        applyPreset(found);
      }
    },
    [applyPreset]
  );

  const updateArena = useCallback(
    (updates: Partial<ArenaSetupState>) => {
      const nextState: ArenaSetupState = { ...arenaState, ...updates };
      setCustomState(nextState);
      const { isValid } = validateArenaFields(nextState);
      if (isValid) {
        writeDraftToStorage(nextState);
      }
    },
    [arenaState]
  );

  const resetToDefault = useCallback(() => {
    setCustomState(DEFAULT_ARENA_STATE);
    writeDraftToStorage(DEFAULT_ARENA_STATE);
    setTouched({});
  }, []);

  const validateArenaStep = useCallback((): boolean => {
    setTouched({
      simulationTitle: true,
      arenaName: true,
      arenaDescription: true,
      hazards: true,
      pacing: true,
    });
    return isArenaValid;
  }, [isArenaValid]);

  const gameStatus: GameStatus = "setup";

  const value = useMemo(
    () => ({
      activeTab,
      setActiveTab,
      arenaState,
      selectedPresetId,
      errors,
      touched,
      isArenaValid,
      isHydrated,
      draftStatus,
      gameStatus,
      updateArena,
      setFieldTouched,
      applyPreset,
      applyPresetById,
      resetToDefault,
      validateArenaStep,
    }),
    [
      activeTab,
      arenaState,
      selectedPresetId,
      errors,
      touched,
      isArenaValid,
      isHydrated,
      draftStatus,
      gameStatus,
      updateArena,
      setFieldTouched,
      applyPreset,
      applyPresetById,
      resetToDefault,
      validateArenaStep,
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
