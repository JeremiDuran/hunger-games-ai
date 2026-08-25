"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  Swords,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  Terminal,
  Crosshair,
} from "lucide-react";
import { useThemeEngine } from "@/lib/theme-context";

interface DisclaimerCardProps {
  onToggleShowcase: () => void;
  showcaseOpen: boolean;
}

export function DisclaimerCard({
  onToggleShowcase,
  showcaseOpen,
}: DisclaimerCardProps) {
  const { activePalette } = useThemeEngine();
  const [acknowledged, setAcknowledged] = useState(false);
  const [isEntering, setIsEntering] = useState(false);

  const handleEnter = () => {
    if (!acknowledged) return;
    setIsEntering(true);
    setTimeout(() => {
      alert(
        `Welcome to the Hunger Games AI Arena! [Gilded Insurgent HUD • ${activePalette.name}] protocol active.`
      );
      setIsEntering(false);
    }, 500);
  };

  return (
    <article
      className="relative w-full max-w-3xl mx-auto my-6 clip-chamfer-md border-2 border-primary bg-card text-card-foreground shadow-[0_0_35px_var(--theme-glow),0_25px_60px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-300"
    >
      {/* Top Gilded Telemetry HUD Bar */}
      <div
        className="w-full h-1.5 transition-all duration-500"
        style={{
          background: `linear-gradient(to right, ${activePalette.borderHex}, ${activePalette.accentHex}, ${activePalette.highlightHex})`,
        }}
      />
      <div className="w-full bg-muted/60 border-b border-primary/30 px-4 py-2 flex items-center justify-between text-[10px] font-mono text-primary">
        <span className="flex items-center gap-1.5">
          <span
            className="h-2 w-2 rounded-full animate-ping"
            style={{ backgroundColor: activePalette.highlightHex }}
          />
          <span className="font-bold">[HIJACKED GAMEMAKER FEED // CAPITOL_MAIN BYPASS]</span>
        </span>
        <span className="hidden sm:inline font-serif font-bold tracking-wider">
          INSURGENT ORCHESTRATOR // FREQ 12.4
        </span>
        <span className="font-bold" style={{ color: activePalette.highlightHex }}>
          GRID: 74 // REBELLION
        </span>
      </div>

      {/* Crosshair telemetry reticles */}
      <Crosshair className="absolute top-3.5 right-3.5 h-4 w-4 text-primary/40 pointer-events-none" />
      <Crosshair className="absolute bottom-3.5 left-3.5 h-4 w-4 text-primary/40 pointer-events-none" />

      {/* Card Content Body */}
      <div className="p-6 sm:p-10 relative z-20 flex flex-col gap-6">
        {/* Header Badge & Title */}
        <header className="flex flex-col items-center text-center gap-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 clip-chamfer-xs bg-primary/15 text-primary border border-primary/50 text-xs font-mono font-bold tracking-widest uppercase shadow-[0_0_12px_var(--theme-glow)]">
            <ShieldAlert className="h-3.5 w-3.5 text-primary" />
            <span>{activePalette.codename}</span>
          </div>

          <h1
            className="text-3xl sm:text-4xl md:text-5xl font-serif font-extrabold tracking-widest text-transparent bg-clip-text text-shadow-gold transition-all duration-300"
            style={{
              backgroundImage: `linear-gradient(to right, ${activePalette.accentHex}, ${activePalette.highlightHex})`,
            }}
          >
            DISCLAIMER & NOTICE
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground max-w-xl italic font-serif">
            &ldquo;If we burn, the Capitol burns in gilded ash.&rdquo; —{" "}
            <span className="not-italic font-bold text-foreground font-mono">
              Mockingjay Signal Vanguard
            </span>
          </p>
        </header>

        {/* Disclaimer Notice Sections */}
        <div className="flex flex-col gap-3.5 text-xs sm:text-sm leading-relaxed text-muted-foreground">
          {/* Section 1: Non-Commercial */}
          <div className="clip-chamfer-sm border-l-4 border-primary border-t border-r border-b border-primary/25 bg-muted/40 p-4 shadow-[3px_3px_0px_rgba(0,0,0,0.2)]">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h2 className="font-serif font-bold text-foreground text-sm uppercase tracking-wider mb-1">
                  1. Non-Commercial Fan Project
                </h2>
                <p>
                  This application is an independent, non-commercial fan-created
                  interactive simulator. It is{" "}
                  <strong className="text-foreground">
                    not affiliated with or endorsed
                  </strong>{" "}
                  by Suzanne Collins, Scholastic Inc., Lionsgate Entertainment
                  Inc., or their subsidiaries.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Intellectual Property */}
          <div
            className="clip-chamfer-sm border-l-4 border-t border-r border-b bg-muted/40 p-4 shadow-[3px_3px_0px_rgba(0,0,0,0.2)]"
            style={{
              borderLeftColor: activePalette.highlightHex,
              borderTopColor: `${activePalette.highlightHex}40`,
              borderRightColor: `${activePalette.highlightHex}40`,
              borderBottomColor: `${activePalette.highlightHex}40`,
            }}
          >
            <div className="flex items-start gap-3">
              <AlertTriangle
                className="h-5 w-5 shrink-0 mt-0.5"
                style={{ color: activePalette.highlightHex }}
              />
              <div>
                <h2 className="font-serif font-bold text-foreground text-sm uppercase tracking-wider mb-1">
                  2. Fiction & Trademark Notice
                </h2>
                <p>
                  <em>The Hunger Games</em>, <em>Panem</em>, the Capitol, the
                  Districts, and associated logos and lore are exclusive property
                  of their copyright holders. All simulated events are works of
                  creative fiction.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Procedural AI */}
          <div className="clip-chamfer-sm border-l-4 border-primary border-t border-r border-b border-primary/25 bg-muted/40 p-4 shadow-[3px_3px_0px_rgba(0,0,0,0.2)]">
            <div className="flex items-start gap-3">
              <Terminal className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h2 className="font-serif font-bold text-foreground text-sm uppercase tracking-wider mb-1">
                  3. Procedural Simulation Mechanics
                </h2>
                <p>
                  Game outcomes are procedurally evaluated by deterministic
                  gameplay algorithms. Generative AI only provides atmospheric
                  flavor dialogue and commentary, never deciding battle outcomes.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Acknowledgement Checkbox */}
        <label
          htmlFor="acknowledge-disclaimer"
          className="flex items-center gap-3 p-3.5 clip-chamfer-sm border border-primary/40 bg-muted/50 hover:bg-muted/80 transition-all select-none cursor-pointer shadow-inner"
        >
          <input
            id="acknowledge-disclaimer"
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
            className="h-4 w-4 rounded border-border text-primary focus:ring-primary accent-primary cursor-pointer"
          />
          <span className="text-xs sm:text-sm font-medium text-foreground">
            I understand and acknowledge that this is an unofficial fan
            simulation and work of fiction.
          </span>
        </label>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
          <button
            type="button"
            disabled={!acknowledged || isEntering}
            onClick={handleEnter}
            style={{
              background: `linear-gradient(to right, ${activePalette.accentHex}, ${activePalette.highlightHex})`,
            }}
            className={`w-full sm:flex-1 flex items-center justify-center gap-2 py-3.5 px-6 clip-chamfer-sm text-black font-mono font-bold text-sm tracking-wider uppercase border border-yellow-300 shadow-[0_0_25px_var(--theme-glow),0_4px_0_rgba(0,0,0,0.3)] active:translate-y-0.5 active:shadow-none transition-all duration-200 ${
              !acknowledged
                ? "opacity-50 cursor-not-allowed"
                : "cursor-pointer hover:brightness-110 hover:shadow-[0_0_35px_var(--theme-glow)]"
            }`}
          >
            <Swords className="h-4 w-4" />
            {isEntering ? "INITIALIZING SIMULATION..." : "ENTER THE SIMULATION"}
          </button>

          <button
            type="button"
            onClick={onToggleShowcase}
            className="w-full sm:w-auto flex items-center justify-center gap-2 py-3.5 px-5 clip-chamfer-sm border border-primary/50 bg-card text-foreground font-mono font-semibold text-xs tracking-wider uppercase hover:bg-muted/60 transition-all duration-200 cursor-pointer"
          >
            <span>HUD Component Lab</span>
            {showcaseOpen ? (
              <ChevronUp className="h-4 w-4 text-primary" />
            ) : (
              <ChevronDown className="h-4 w-4 text-primary" />
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
