"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import {
  User,
  Swords,
  Skull,
  Heart,
  Shield,
  Gift,
  Compass,
  Radio,
  Flame,
  FileCode2,
  BookOpen,
  Volume2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Tables } from "@/types/database";
import { GamePacing } from "@/types/setup";
import { getWaitingFlavorText } from "@/lib/narrative/waiting-flavor";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP);
}

export type EventPhaseDbRow = Tables<"game_phase_events">;
export type TributeDbRow = Tables<"tributes">;

export interface ArenaEventCardProps {
  event: EventPhaseDbRow;
  tributesMap: Map<string, TributeDbRow>;
  narrativeText?: string;
  narrativeStatus: "idle" | "generating" | "streaming" | "complete" | "error";
  pacing?: GamePacing;
  isCurrentEvent?: boolean;
}

export function ArenaEventCard({
  event,
  tributesMap,
  narrativeText = "",
  narrativeStatus,
  pacing = "cinematic",
  isCurrentEvent = false,
}: ArenaEventCardProps) {
  const t = useTranslations("arena");
  const cardRef = useRef<HTMLDivElement>(null);
  const leftAvatarRef = useRef<HTMLDivElement>(null);
  const rightAvatarRef = useRef<HTMLDivElement>(null);
  const versusIconRef = useRef<HTMLDivElement>(null);

  const [viewMode, setViewMode] = useState<"narrative" | "jsonb">("narrative");
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  // Participating tributes
  const participants = (event.tribute_ids || [])
    .map((id) => tributesMap.get(id))
    .filter((t): t is TributeDbRow => Boolean(t));

  const participantNames = participants.map((p) => p.name);
  const isFatal =
    event.outcome_type === "death" ||
    (event.victim_ids && event.victim_ids.length > 0 && event.killer_ids && event.killer_ids.length > 0);

  const victimNames = (event.victim_ids || [])
    .map((id) => tributesMap.get(id)?.name || "Unknown Tribute")
    .join(", ");

  // Waiting flavor text when waiting for LLM response
  const waitingText = getWaitingFlavorText({
    eventCategory: event.event_category,
    outcomeType: event.outcome_type,
    participantNames,
    eventId: event.id,
  });

  // Pacing GSAP Entrance & Clash Animations
  useGSAP(
    () => {
      const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (prefersReducedMotion || pacing !== "cinematic") {
        gsap.set(cardRef.current, { opacity: 1, y: 0 });
        return;
      }

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      // 1. Fade in & subtle rise of entire card
      tl.fromTo(
        cardRef.current,
        { opacity: 0, y: 20, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.5 }
      );

      // 2. Specialized category animations for participating avatars
      if (event.event_category === "combat" && leftAvatarRef.current && rightAvatarRef.current) {
        // Combat clash: left avatar slides right, right avatar slides left, clash in center
        tl.fromTo(
          leftAvatarRef.current,
          { x: -30, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.4 },
          "-=0.2"
        );
        tl.fromTo(
          rightAvatarRef.current,
          { x: 30, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.4 },
          "<"
        );
        if (versusIconRef.current) {
          tl.fromTo(
            versusIconRef.current,
            { scale: 0, rotation: -45 },
            { scale: 1.2, rotation: 0, duration: 0.25, ease: "back.out(2)" },
            "-=0.15"
          ).to(versusIconRef.current, { scale: 1, duration: 0.15 });
        }
      } else if (event.event_category === "hazard" && cardRef.current) {
        // Hazard environmental pulse
        tl.fromTo(
          cardRef.current,
          { boxShadow: "0 0 0 rgba(239, 68, 68, 0)" },
          {
            boxShadow: "0 0 35px rgba(239, 68, 68, 0.4)",
            repeat: 1,
            yoyo: true,
            duration: 0.35,
          },
          "-=0.2"
        );
      } else if (event.event_category === "social" && leftAvatarRef.current && rightAvatarRef.current) {
        // Social alliance convergence
        tl.fromTo(
          [leftAvatarRef.current, rightAvatarRef.current],
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, stagger: 0.15, duration: 0.4 },
          "-=0.2"
        );
      }
    },
    { scope: cardRef, dependencies: [event.id, pacing] }
  );

  const handleImageError = (tributeId: string) => {
    setImageErrors((prev) => ({ ...prev, [tributeId]: true }));
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "combat":
        return "border-red-500/60 bg-red-500/10 text-red-400";
      case "hazard":
        return "border-amber-500/60 bg-amber-500/10 text-amber-400";
      case "mutt":
        return "border-purple-500/60 bg-purple-500/10 text-purple-400";
      case "sponsor":
        return "border-emerald-500/60 bg-emerald-500/10 text-emerald-400";
      case "forage":
        return "border-blue-500/60 bg-blue-500/10 text-blue-400";
      case "social":
        return "border-amber-400/60 bg-amber-400/10 text-amber-300";
      default:
        return "border-border bg-muted/40 text-muted-foreground";
    }
  };

  const hasNarrativeReady =
    Boolean(narrativeText && narrativeText.trim().length > 0) &&
    (narrativeStatus === "complete" || narrativeStatus === "streaming");

  return (
    <article
      ref={cardRef}
      role="region"
      aria-label={`Event #${event.event_order + 1}: ${event.event_category}`}
      className={`w-full relative p-5 sm:p-6 clip-chamfer-md bg-card/90 backdrop-blur-md border transition-all duration-300 shadow-lg ${
        isFatal
          ? "border-red-600/80 shadow-[0_0_30px_rgba(220,38,38,0.25)]"
          : isCurrentEvent
          ? "border-primary/80 shadow-[0_0_25px_var(--theme-glow)]"
          : "border-border/80 hover:border-border"
      }`}
    >
      {/* Top Event Meta Bar & Telemetry Toggle */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-border/60">
        <div className="flex items-center gap-2">
          <span
            className={`px-2.5 py-0.5 clip-chamfer-xs text-[11px] font-mono font-bold uppercase tracking-wider border ${getCategoryColor(
              event.event_category
            )}`}
          >
            {event.event_category}
          </span>
          <span className="text-xs font-mono text-muted-foreground">
            #{event.event_order + 1}
          </span>
          {event.outcome_type && (
            <span className="text-[10px] font-mono text-muted-foreground uppercase px-1.5 py-0.5 bg-muted/50 clip-chamfer-xs border border-border">
              {event.outcome_type}
            </span>
          )}
        </div>

        {/* View Mode Toggle: Narrative vs Raw JSONB */}
        <div className="flex items-center gap-1 bg-background/80 p-0.5 clip-chamfer-xs border border-border/70">
          <button
            type="button"
            onClick={() => setViewMode("narrative")}
            aria-pressed={viewMode === "narrative"}
            className={`px-2 py-1 clip-chamfer-xs text-[10px] font-mono font-bold uppercase transition-colors flex items-center gap-1 cursor-pointer ${
              viewMode === "narrative"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <BookOpen className="h-3 w-3" />
            <span>{t("viewModes.narrative")}</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("jsonb")}
            aria-pressed={viewMode === "jsonb"}
            className={`px-2 py-1 clip-chamfer-xs text-[10px] font-mono font-bold uppercase transition-colors flex items-center gap-1 cursor-pointer ${
              viewMode === "jsonb"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileCode2 className="h-3 w-3" />
            <span>{t("viewModes.telemetry")}</span>
          </button>
        </div>
      </div>

      {/* 1. TRIBUTES ON TOP (Wireframe & User Spec) */}
      <div className="w-full flex items-center justify-center gap-4 sm:gap-8 my-4 py-2">
        {participants.length === 1 && (
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="relative w-20 h-24 sm:w-24 sm:h-28 clip-chamfer-sm bg-background/80 border-2 border-border/80 overflow-hidden shadow-md flex items-center justify-center">
              {participants[0].avatar_url && !imageErrors[participants[0].id] ? (
                <Image
                  src={participants[0].avatar_url}
                  alt={participants[0].name}
                  fill
                  sizes="96px"
                  className="object-cover object-top"
                  onError={() => handleImageError(participants[0].id)}
                  unoptimized
                />
              ) : (
                <User className="h-10 w-10 text-muted-foreground/60" />
              )}
            </div>
            <div>
              <span className="inline-block px-2 py-0.5 clip-chamfer-xs bg-muted/60 text-muted-foreground font-mono text-[10px] uppercase font-bold border border-border">
                District {participants[0].district}
              </span>
              <h3 className="text-sm sm:text-base font-serif font-bold text-foreground mt-0.5">
                {participants[0].name}
              </h3>
            </div>
          </div>
        )}

        {participants.length === 2 && (
          <div className="flex items-center justify-center gap-4 sm:gap-8 w-full max-w-md">
            {/* Tribute 1 (Left) */}
            <div ref={leftAvatarRef} className="flex-1 flex flex-col items-center text-center space-y-1.5">
              <div
                className={`relative w-18 h-22 sm:w-22 sm:h-26 clip-chamfer-sm bg-background/80 border-2 overflow-hidden shadow-md flex items-center justify-center transition-all ${
                  event.victim_ids?.includes(participants[0].id)
                    ? "border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                    : event.killer_ids?.includes(participants[0].id)
                    ? "border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.4)]"
                    : "border-border/80"
                }`}
              >
                {participants[0].avatar_url && !imageErrors[participants[0].id] ? (
                  <Image
                    src={participants[0].avatar_url}
                    alt={participants[0].name}
                    fill
                    sizes="88px"
                    className="object-cover object-top"
                    onError={() => handleImageError(participants[0].id)}
                    unoptimized
                  />
                ) : (
                  <User className="h-9 w-9 text-muted-foreground/60" />
                )}
                {event.killer_ids?.includes(participants[0].id) && (
                  <div className="absolute top-1 right-1 bg-yellow-500 text-black text-[9px] font-mono font-bold px-1 rounded">
                    KILLER
                  </div>
                )}
                {event.victim_ids?.includes(participants[0].id) && (
                  <div className="absolute top-1 right-1 bg-red-600 text-white text-[9px] font-mono font-bold px-1 rounded flex items-center gap-0.5">
                    <Skull className="h-2.5 w-2.5" />
                    FALLEN
                  </div>
                )}
              </div>
              <span className="inline-block px-1.5 py-0.5 clip-chamfer-xs bg-muted/60 text-muted-foreground font-mono text-[9px] uppercase font-bold border border-border">
                District {participants[0].district}
              </span>
              <h3 className="text-xs sm:text-sm font-serif font-bold text-foreground truncate max-w-[120px]">
                {participants[0].name}
              </h3>
            </div>

            {/* Encounter Center Icon (Clash / Alliance / Hazard) */}
            <div
              ref={versusIconRef}
              className="shrink-0 flex flex-col items-center justify-center"
            >
              <div
                className={`h-9 w-9 sm:h-10 sm:w-10 rounded-full flex items-center justify-center border shadow-md ${
                  event.event_category === "combat"
                    ? "bg-red-500/20 border-red-500/60 text-red-400"
                    : event.event_category === "social"
                    ? "bg-amber-500/20 border-amber-500/60 text-amber-300"
                    : "bg-muted border-border text-muted-foreground"
                }`}
              >
                {event.event_category === "combat" ? (
                  <Swords className="h-4 w-4 sm:h-5 sm:w-5" />
                ) : event.event_category === "social" ? (
                  <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
                ) : (
                  <Radio className="h-4 w-4 sm:h-5 sm:w-5" />
                )}
              </div>
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-muted-foreground mt-1">
                {event.event_category === "combat" ? "VS" : "WITH"}
              </span>
            </div>

            {/* Tribute 2 (Right) */}
            <div ref={rightAvatarRef} className="flex-1 flex flex-col items-center text-center space-y-1.5">
              <div
                className={`relative w-18 h-22 sm:w-22 sm:h-26 clip-chamfer-sm bg-background/80 border-2 overflow-hidden shadow-md flex items-center justify-center transition-all ${
                  event.victim_ids?.includes(participants[1].id)
                    ? "border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                    : event.killer_ids?.includes(participants[1].id)
                    ? "border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.4)]"
                    : "border-border/80"
                }`}
              >
                {participants[1].avatar_url && !imageErrors[participants[1].id] ? (
                  <Image
                    src={participants[1].avatar_url}
                    alt={participants[1].name}
                    fill
                    sizes="88px"
                    className="object-cover object-top"
                    onError={() => handleImageError(participants[1].id)}
                    unoptimized
                  />
                ) : (
                  <User className="h-9 w-9 text-muted-foreground/60" />
                )}
                {event.killer_ids?.includes(participants[1].id) && (
                  <div className="absolute top-1 right-1 bg-yellow-500 text-black text-[9px] font-mono font-bold px-1 rounded">
                    KILLER
                  </div>
                )}
                {event.victim_ids?.includes(participants[1].id) && (
                  <div className="absolute top-1 right-1 bg-red-600 text-white text-[9px] font-mono font-bold px-1 rounded flex items-center gap-0.5">
                    <Skull className="h-2.5 w-2.5" />
                    FALLEN
                  </div>
                )}
              </div>
              <span className="inline-block px-1.5 py-0.5 clip-chamfer-xs bg-muted/60 text-muted-foreground font-mono text-[9px] uppercase font-bold border border-border">
                District {participants[1].district}
              </span>
              <h3 className="text-xs sm:text-sm font-serif font-bold text-foreground truncate max-w-[120px]">
                {participants[1].name}
              </h3>
            </div>
          </div>
        )}

        {participants.length > 2 && (
          <div className="flex flex-wrap items-center justify-center gap-3 max-w-xl">
            {participants.map((tribute) => (
              <div key={tribute.id} className="flex flex-col items-center text-center space-y-1">
                <div className="relative w-14 h-18 sm:w-16 sm:h-20 clip-chamfer-xs bg-background/80 border border-border/80 overflow-hidden shadow-xs flex items-center justify-center">
                  {tribute.avatar_url && !imageErrors[tribute.id] ? (
                    <Image
                      src={tribute.avatar_url}
                      alt={tribute.name}
                      fill
                      sizes="64px"
                      className="object-cover object-top"
                      onError={() => handleImageError(tribute.id)}
                      unoptimized
                    />
                  ) : (
                    <User className="h-7 w-7 text-muted-foreground/60" />
                  )}
                </div>
                <span className="text-[8px] font-mono uppercase text-muted-foreground font-bold">
                  D{tribute.district}
                </span>
                <span className="text-[11px] font-serif font-bold text-foreground max-w-[80px] truncate">
                  {tribute.name}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. LETHAL EVENT CANNON BANNER */}
      {isFatal && (
        <div className="my-3 p-3 clip-chamfer-xs bg-red-950/40 border-2 border-red-600/80 text-red-200 flex items-center justify-between gap-3 shadow-[0_0_20px_rgba(220,38,38,0.3)] animate-pulse">
          <div className="flex items-center gap-2">
            <Volume2 className="h-5 w-5 text-red-400 shrink-0" />
            <div>
              <strong className="block text-xs font-mono font-bold tracking-wider uppercase text-red-300">
                {t("cannonAlert.title")}
              </strong>
              <p className="text-[11px] font-sans text-red-200/90">
                {t("cannonAlert.victim", { name: victimNames || "Tribute" })}
              </p>
            </div>
          </div>
          <span className="text-sm">💀</span>
        </div>
      )}

      {/* 3. NARRATIVE TEXT OR TECHNICAL JSONB */}
      <div className="mt-4 pt-3 border-t border-border/50 min-h-[70px] flex flex-col justify-center">
        {viewMode === "jsonb" ? (
          /* Technical Fallback / Direct JSONB Print */
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1">
              <FileCode2 className="h-3 w-3" />
              <span>{t("rawStateDeltaHeading")}</span>
            </span>
            <pre className="p-3 clip-chamfer-xs bg-background/95 border border-border/70 text-primary font-mono text-[11px] leading-relaxed overflow-x-auto select-all max-h-60">
              {JSON.stringify(
                {
                  event_id: event.id,
                  category: event.event_category,
                  outcome: event.outcome_type,
                  participants: participantNames,
                  killer_ids: event.killer_ids,
                  victim_ids: event.victim_ids,
                  state_delta: event.state_delta,
                },
                null,
                2
              )}
            </pre>
          </div>
        ) : hasNarrativeReady ? (
          /* Live Streamed or Completed Narrative */
          <div
            aria-live="polite"
            className="text-sm sm:text-base font-serif text-foreground/95 leading-relaxed tracking-wide animate-fadeIn"
          >
            <p>{narrativeText}</p>
            {narrativeStatus === "streaming" && (
              <span className="inline-block w-2 h-4 ml-1 bg-primary animate-pulse" />
            )}
          </div>
        ) : narrativeStatus === "error" ? (
          /* Narrative Failed -> Graceful Fallback into Technical Telemetry */
          <div className="space-y-2">
            <div className="p-2 clip-chamfer-xs bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono flex items-center justify-between">
              <span>{t("narrativeFallbackNotice")}</span>
            </div>
            <pre className="p-3 clip-chamfer-xs bg-background/90 border border-border/70 text-muted-foreground font-mono text-[11px] leading-relaxed overflow-x-auto">
              {JSON.stringify(event.state_delta, null, 2)}
            </pre>
          </div>
        ) : (
          /* WAITING STATE: NO GENERIC SPINNER! SHOW FLAVORFUL SURVEILLANCE TEXT */
          <div className="space-y-2 py-2">
            <div className="flex items-center gap-2 text-primary/80">
              <Radio className="h-4 w-4 animate-pulse" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-primary">
                {t("surveillanceLock")}
              </span>
            </div>
            <p className="text-xs sm:text-sm font-sans italic text-muted-foreground/90 leading-relaxed border-l-2 border-primary/40 pl-3">
              "{waitingText}"
            </p>
          </div>
        )}
      </div>
    </article>
  );
}
