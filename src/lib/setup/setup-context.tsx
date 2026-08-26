"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import {
  ArenaSetupState,
  SetupTab,
  ArenaPreset,
} from "@/types/setup";
import { ARENA_PRESETS } from "@/config/arena-presets";

interface SetupContextValue {
  activeTab: SetupTab;
  setActiveTab: (tab: SetupTab) => void;
  arenaState: ArenaSetupState;
  selectedPresetId: string | null;
  updateArena: (updates: Partial<ArenaSetupState>) => void;
  applyPreset: (preset: ArenaPreset) => void;
  applyPresetById: (presetId: string) => void;
  resetToDefault: () => void;
}

const DEFAULT_ARENA_STATE: ArenaSetupState = {
  simulationTitle: ARENA_PRESETS[0].simulationTitle,
  arenaName: ARENA_PRESETS[0].arenaName,
  arenaDescription: ARENA_PRESETS[0].description,
  hazards: { ...ARENA_PRESETS[0].hazards },
  pacing: "cinematic",
};

const SetupContext = createContext<SetupContextValue | null>(null);

export function SetupProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<SetupTab>("arena");
  const [arenaState, setArenaState] = useState<ArenaSetupState>(DEFAULT_ARENA_STATE);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(
    ARENA_PRESETS[0].id
  );

  const applyPreset = useCallback((preset: ArenaPreset) => {
    setSelectedPresetId(preset.id);
    setArenaState((prev) => ({
      ...prev,
      simulationTitle: preset.simulationTitle,
      arenaName: preset.arenaName,
      arenaDescription: preset.description,
      hazards: { ...preset.hazards },
    }));
  }, []);

  const applyPresetById = useCallback(
    (presetId: string) => {
      const found = ARENA_PRESETS.find((p) => p.id === presetId);
      if (found) {
        applyPreset(found);
      }
    },
    [applyPreset]
  );

  const updateArena = useCallback((updates: Partial<ArenaSetupState>) => {
    setArenaState((prev) => ({ ...prev, ...updates }));
    setSelectedPresetId(null);
  }, []);

  const resetToDefault = useCallback(() => {
    applyPreset(ARENA_PRESETS[0]);
  }, [applyPreset]);

  const value = useMemo(
    () => ({
      activeTab,
      setActiveTab,
      arenaState,
      selectedPresetId,
      updateArena,
      applyPreset,
      applyPresetById,
      resetToDefault,
    }),
    [
      activeTab,
      arenaState,
      selectedPresetId,
      updateArena,
      applyPreset,
      applyPresetById,
      resetToDefault,
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
