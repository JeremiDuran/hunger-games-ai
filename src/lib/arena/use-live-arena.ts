"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Tables } from "@/types/database";
import { GamePacing } from "@/types/setup";
import { serializeEventToNarrativePayload } from "@/lib/engine/narrative-serializer";
import { NarrativeVoice } from "@/types/setup";
import { EngineTribute } from "@/lib/engine/types";

export type GameDbRow = Tables<"games">;
export type TributeDbRow = Tables<"tributes">;
export type GamePhaseDbRow = Tables<"game_phases"> & {
  game_phase_events?: Tables<"game_phase_events">[];
};
export type GameEventDbRow = Tables<"game_phase_events">;

export interface EventNarrativeState {
  text: string;
  status: "idle" | "generating" | "streaming" | "complete" | "error";
}

export function useLiveArena(gameId: string, initialPhaseId?: string) {
  const supabase = useMemo(() => createClient(), []);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [game, setGame] = useState<GameDbRow | null>(null);
  const [tributes, setTributes] = useState<TributeDbRow[]>([]);
  const [phases, setPhases] = useState<GamePhaseDbRow[]>([]);

  const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(null);
  const [activeLivePhaseId, setActiveLivePhaseId] = useState<string | null>(null);

  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [narrativesMap, setNarrativesMap] = useState<Record<string, EventNarrativeState>>({});
  const [isSimulating, setIsSimulating] = useState(false);

  // Active generating event guard to prevent duplicate API requests
  const generatingEventIdRef = useRef<string | null>(null);

  // Tributes lookup map by ID
  const tributesMap = useMemo(() => {
    const map = new Map<string, TributeDbRow>();
    for (const t of tributes) {
      map.set(t.id, t);
    }
    return map;
  }, [tributes]);

  // Selected phase
  const selectedPhase = useMemo(() => {
    return phases.find((p) => p.id === selectedPhaseId) ?? null;
  }, [phases, selectedPhaseId]);

  // Events belonging to the selected phase
  const selectedPhaseEvents = useMemo(() => {
    if (!selectedPhase?.game_phase_events) return [];
    return [...selectedPhase.game_phase_events].sort(
      (a, b) => a.event_order - b.event_order
    );
  }, [selectedPhase]);

  const isViewingPastPhase =
    Boolean(selectedPhaseId && activeLivePhaseId && selectedPhaseId !== activeLivePhaseId);

  // Extract pacing from game settings
  const pacing: GamePacing = useMemo(() => {
    const settings = (game?.settings as Record<string, unknown>) ?? {};
    return (settings.pacing as GamePacing) || "cinematic";
  }, [game?.settings]);

  // Extract narrative voice
  const narrativeVoice: NarrativeVoice = useMemo(() => {
    const settings = (game?.settings as Record<string, unknown>) ?? {};
    return (settings.narrative_voice as NarrativeVoice) || "novel_cinematic";
  }, [game?.settings]);

  // 1. Initial Data Fetch
  const loadGameData = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError(null);

      const res = await fetch(`/api/game/${gameId}`);
      if (!res.ok) {
        throw new Error("Failed to load match telemetry");
      }

      const data = await res.json();
      setGame(data.game);
      setTributes(data.tributes);

      const sortedPhases: GamePhaseDbRow[] = (data.phases || []).sort(
        (a: GamePhaseDbRow, b: GamePhaseDbRow) => a.phase_order - b.phase_order
      );
      setPhases(sortedPhases);

      // Pre-populate existing cached narratives from database
      const initialNarratives: Record<string, EventNarrativeState> = {};
      for (const p of sortedPhases) {
        for (const ev of p.game_phase_events || []) {
          if (ev.narrative_text && ev.narrative_text.trim().length > 0) {
            initialNarratives[ev.id] = {
              text: ev.narrative_text,
              status: "complete",
            };
          }
        }
      }
      setNarrativesMap((prev) => ({ ...initialNarratives, ...prev }));

      if (sortedPhases.length > 0) {
        const latestPhase = sortedPhases[sortedPhases.length - 1];
        setActiveLivePhaseId(latestPhase.id);

        const targetPhase = initialPhaseId
          ? sortedPhases.find((p) => p.id === initialPhaseId) ?? latestPhase
          : latestPhase;

        setSelectedPhaseId(targetPhase.id);

        const targetEvents = (targetPhase.game_phase_events || []).sort(
          (a, b) => a.event_order - b.event_order
        );

        if (targetPhase.id === latestPhase.id) {
          // Find first incomplete event in active phase
          const firstUnfinishedIdx = targetEvents.findIndex(
            (ev) => !ev.narrative_text || ev.narrative_text.trim().length === 0
          );
          setCurrentEventIndex(firstUnfinishedIdx >= 0 ? firstUnfinishedIdx : Math.max(0, targetEvents.length - 1));
        } else {
          // In past phase, reveal all events
          setCurrentEventIndex(Math.max(0, targetEvents.length - 1));
        }
      }
    } catch (err) {
      console.error("[useLiveArena] Load error:", err);
      setLoadError(err instanceof Error ? err.message : "Failed to load game");
    } finally {
      setIsLoading(false);
    }
  }, [gameId, initialPhaseId]);

  useEffect(() => {
    loadGameData();
  }, [loadGameData]);

  // 2. Stream/Generate narrative for an individual event
  const streamEventNarrative = useCallback(
    async (event: GameEventDbRow) => {
      if (generatingEventIdRef.current === event.id) return;
      generatingEventIdRef.current = event.id;

      setNarrativesMap((prev) => ({
        ...prev,
        [event.id]: { text: "", status: "generating" },
      }));

      try {
        // Convert to engine format for serializer
        const engineTributesMap = new Map<string, EngineTribute>();
        for (const t of tributes) {
          const stats = (t.stats as Record<string, any>) || {};
          engineTributesMap.set(t.id, {
            id: t.id,
            gameId: t.game_id,
            name: t.name,
            district: t.district,
            gender: t.gender,
            personality: t.personality || "",
            physicalAspect: t.physical_aspect || "",
            avatarUrl: t.avatar_url,
            status: t.status,
            killCount: t.kill_count,
            deathPhaseId: t.death_phase_id,
            placement: t.placement,
            biometrics: {
              survival: stats.survival ?? 50,
              sanity: stats.sanity ?? 50,
              physicalTag: stats.physical_tag || "unscathed",
              mentalTag: stats.mental_tag || "composed",
            },
            inventory: (t.inventory as string[]) || [],
          });
        }

        const engineOutcome = {
          eventId: event.id,
          eventOrder: event.event_order,
          eventCategory: event.event_category as any,
          outcomeType: event.outcome_type as any,
          tributeIds: event.tribute_ids || [],
          killerIds: event.killer_ids || undefined,
          victimIds: event.victim_ids || undefined,
          narrativeText: event.narrative_text || undefined,
          stateDeltas: (event.state_delta as Record<string, any>) || {},
        };

        const narrativePayload = serializeEventToNarrativePayload(engineOutcome as any, {
          simulationTitle: game?.title || "The Hunger Games",
          arenaName: game?.arena_name || "The Arena",
          arenaDescription: game?.arena_description || "",
          narrativeVoice,
          tributes: engineTributesMap,
        });

        const res = await fetch("/api/narrative", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(narrativePayload),
        });

        if (!res.ok) {
          throw new Error(`Narrative API failed with status ${res.status}`);
        }

        const reader = res.body?.getReader();
        if (!reader) {
          throw new Error("No response stream available");
        }

        const decoder = new TextDecoder();
        let accumulatedText = "";

        if (pacing === "instant") {
          // Instant pacing: accumulate entirely before displaying
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            accumulatedText += decoder.decode(value, { stream: true });
          }
          setNarrativesMap((prev) => ({
            ...prev,
            [event.id]: { text: accumulatedText.trim(), status: "complete" },
          }));
        } else {
          // Cinematic / Normal: stream progressively
          setNarrativesMap((prev) => ({
            ...prev,
            [event.id]: { text: "", status: "streaming" },
          }));

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            accumulatedText += chunk;

            setNarrativesMap((prev) => ({
              ...prev,
              [event.id]: { text: accumulatedText, status: "streaming" },
            }));
          }

          setNarrativesMap((prev) => ({
            ...prev,
            [event.id]: { text: accumulatedText.trim(), status: "complete" },
          }));
        }

        // Cache completed text to Supabase
        const finalText = accumulatedText.trim();
        if (finalText.length > 0) {
          await supabase
            .from("game_phase_events")
            .update({ narrative_text: finalText })
            .eq("id", event.id);
        }
      } catch (err) {
        console.error("[useLiveArena] Narrative generation failed:", err);
        setNarrativesMap((prev) => ({
          ...prev,
          [event.id]: { text: "", status: "error" },
        }));
      } finally {
        generatingEventIdRef.current = null;
      }
    },
    [tributes, game, narrativeVoice, pacing, supabase]
  );

  // 3. Auto-kickoff narrative for active live event if missing
  useEffect(() => {
    if (isViewingPastPhase || selectedPhaseEvents.length === 0) return;

    const currentEvent = selectedPhaseEvents[currentEventIndex];
    if (!currentEvent) return;

    const existingState = narrativesMap[currentEvent.id];
    if (
      (!existingState || existingState.status === "idle") &&
      (!currentEvent.narrative_text || currentEvent.narrative_text.trim().length === 0)
    ) {
      streamEventNarrative(currentEvent);
    }
  }, [
    currentEventIndex,
    selectedPhaseEvents,
    isViewingPastPhase,
    narrativesMap,
    streamEventNarrative,
  ]);

  // Current active event state
  const currentEvent = selectedPhaseEvents[currentEventIndex] || null;
  const currentNarrativeState = currentEvent ? narrativesMap[currentEvent.id] : undefined;

  const isCurrentEventComplete = Boolean(
    (currentEvent?.narrative_text && currentEvent.narrative_text.trim().length > 0) ||
      currentNarrativeState?.status === "complete" ||
      currentNarrativeState?.status === "error"
  );

  const isStreaming = currentNarrativeState?.status === "streaming" || currentNarrativeState?.status === "generating";

  const isCurrentPhaseComplete =
    selectedPhaseEvents.length > 0 &&
    currentEventIndex >= selectedPhaseEvents.length - 1 &&
    isCurrentEventComplete;

  // 4. Step to Next Event
  const handleNextEvent = useCallback(() => {
    if (!isCurrentEventComplete || isStreaming) return;
    if (currentEventIndex < selectedPhaseEvents.length - 1) {
      setCurrentEventIndex((prev) => prev + 1);
    }
  }, [isCurrentEventComplete, isStreaming, currentEventIndex, selectedPhaseEvents.length]);

  // 5. Advance Simulation to Next Phase
  const handleAdvanceSimulation = useCallback(async () => {
    if (!isCurrentPhaseComplete || isSimulating) return;

    try {
      setIsSimulating(true);

      const res = await fetch(`/api/game/${gameId}/phase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        throw new Error("Failed to advance round");
      }

      const data = await res.json();
      await loadGameData();
    } catch (err) {
      console.error("[useLiveArena] Advance simulation error:", err);
    } finally {
      setIsSimulating(false);
    }
  }, [isCurrentPhaseComplete, isSimulating, gameId, loadGameData]);

  // 6. Navigation between phases
  const currentPhaseOrder = selectedPhase?.phase_order ?? 0;
  const canGoPrevPhase = currentPhaseOrder > 0;
  const canGoNextPhase = currentPhaseOrder < phases.length - 1;

  const handlePrevPhase = useCallback(() => {
    const prev = phases.find((p) => p.phase_order === currentPhaseOrder - 1);
    if (prev) {
      setSelectedPhaseId(prev.id);
    }
  }, [phases, currentPhaseOrder]);

  const handleNextPhase = useCallback(() => {
    const next = phases.find((p) => p.phase_order === currentPhaseOrder + 1);
    if (next) {
      setSelectedPhaseId(next.id);
    }
  }, [phases, currentPhaseOrder]);

  const handleSelectPhase = useCallback((phaseId: string) => {
    setSelectedPhaseId(phaseId);
  }, []);

  return {
    isLoading,
    loadError,
    game,
    tributes,
    tributesMap,
    phases,
    selectedPhase,
    selectedPhaseId,
    activeLivePhaseId,
    selectedPhaseEvents,
    currentEventIndex,
    currentEvent,
    narrativesMap,
    pacing,
    isViewingPastPhase,
    isCurrentEventComplete,
    isCurrentPhaseComplete,
    isStreaming,
    isSimulating,
    canGoPrevPhase,
    canGoNextPhase,
    handleNextEvent,
    handleAdvanceSimulation,
    handlePrevPhase,
    handleNextPhase,
    handleSelectPhase,
  };
}
