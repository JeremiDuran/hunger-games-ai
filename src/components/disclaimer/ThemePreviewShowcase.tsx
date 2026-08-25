"use client";

import React, { useState } from "react";
import {
  Skull,
  Radio,
  Activity,
  Award,
  Zap,
  Target,
  Flame,
  Shield,
  Crosshair,
  Sparkles,
  Sliders,
  Send,
} from "lucide-react";
import { useThemeEngine } from "@/lib/theme-context";

export function ThemePreviewShowcase() {
  const { activePalette, resolvedMode } = useThemeEngine();
  const [sliderVal, setSliderVal] = useState(68);
  const [activeTab, setActiveTab] = useState<"widgets" | "tributes" | "broadcast">("widgets");

  return (
    <section
      aria-label="Gilded HUD Component System & Palette Lab"
      className="w-full max-w-4xl mx-auto my-8 p-6 sm:p-8 clip-chamfer-md border-2 border-primary bg-card text-card-foreground shadow-[0_0_35px_var(--theme-glow),0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-300 relative overflow-hidden"
    >
      {/* Background HUD Grid */}
      <div className="absolute inset-0 pattern-hud-grid pointer-events-none opacity-20 -z-10" />

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-primary/30 relative z-20">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="flex h-2.5 w-2.5 rounded-full animate-ping"
              style={{ backgroundColor: activePalette.accentHex }}
            />
            <h3 className="text-xl font-serif font-bold tracking-wider text-foreground">
              Gilded HUD Component Lab
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-mono">
            Active Palette:{" "}
            <strong className="text-primary font-bold">{activePalette.name}</strong> • Mode:{" "}
            <span className="uppercase font-semibold text-foreground px-1.5 py-0.5 rounded bg-muted">
              {resolvedMode}
            </span>
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 bg-muted/60 p-1 clip-chamfer-xs border border-border">
          {(
            [
              { id: "widgets", label: "Tactical Controls", icon: Sliders },
              { id: "tributes", label: "Tribute HUD Cards", icon: Target },
              { id: "broadcast", label: "Arena Broadcast Log", icon: Radio },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 clip-chamfer-xs text-xs font-mono font-semibold transition-all cursor-pointer ${
                  isActive
                    ? "bg-primary text-primary-foreground font-bold shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: TACTICAL CONTROLS & WIDGETS */}
      {activeTab === "widgets" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 relative z-20">
          {/* Panel 1: Interactive Tactical Buttons */}
          <div className="flex flex-col gap-3 clip-chamfer-sm border-l-4 border-primary border-t border-r border-b border-primary/30 bg-muted/40 p-4 shadow-[3px_3px_0px_rgba(0,0,0,0.2)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold tracking-wider text-primary uppercase">
                1. Tactical Action Mechanisms
              </span>
              <span className="text-[10px] font-mono text-muted-foreground">[CHAMFER SILHOUETTES]</span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                type="button"
                style={{
                  background: `linear-gradient(to right, ${activePalette.accentHex}, ${activePalette.highlightHex})`,
                }}
                className="px-4 py-2 clip-chamfer-sm text-black font-mono font-bold text-xs uppercase tracking-widest border border-yellow-300 shadow-[0_0_15px_var(--theme-glow),0_3px_0_rgba(0,0,0,0.3)] active:translate-y-0.5 cursor-pointer hover:brightness-110"
              >
                EXECUTE_DECREE [F1]
              </button>

              <button
                type="button"
                className="px-4 py-2 clip-chamfer-sm border-2 border-primary bg-card text-primary font-mono text-xs uppercase tracking-widest hover:bg-primary/15 shadow-[2px_2px_0_rgba(0,0,0,0.3)] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
              >
                GOLD_RETICLE
              </button>

              <button
                type="button"
                className="px-4 py-2 clip-chamfer-sm bg-gradient-to-r from-red-700 to-orange-700 text-white font-mono font-bold text-xs uppercase tracking-widest shadow-[0_0_12px_rgba(239,68,68,0.4)] active:translate-y-0.5 cursor-pointer hover:brightness-110"
              >
                OVERTHROW_SIM
              </button>

              <button
                type="button"
                className="px-3 py-1.5 clip-chamfer-xs bg-muted text-muted-foreground font-mono text-[11px] uppercase tracking-wider hover:text-foreground cursor-pointer"
              >
                SCAN_FREQ
              </button>
            </div>
          </div>

          {/* Panel 2: Live Telemetry Gauges */}
          <div
            className="flex flex-col gap-3 clip-chamfer-sm border-l-4 border-t border-r border-b bg-muted/40 p-4 shadow-[3px_3px_0px_rgba(0,0,0,0.2)]"
            style={{
              borderLeftColor: activePalette.highlightHex,
              borderTopColor: `${activePalette.highlightHex}40`,
              borderRightColor: `${activePalette.highlightHex}40`,
              borderBottomColor: `${activePalette.highlightHex}40`,
            }}
          >
            <div className="flex items-center justify-between">
              <span
                className="text-xs font-mono font-bold tracking-wider uppercase"
                style={{ color: activePalette.highlightHex }}
              >
                2. Live Biometric Telemetry
              </span>
              <span className="text-[10px] font-mono text-muted-foreground">{sliderVal}% SIGNAL</span>
            </div>

            <div className="flex flex-col gap-2.5">
              <div>
                <div className="flex justify-between text-[11px] font-mono text-muted-foreground mb-1">
                  <span>MOCKINGJAY BROADCAST CARRIER</span>
                  <span className="text-primary font-bold">{sliderVal}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={sliderVal}
                  onChange={(e) => setSliderVal(Number(e.target.value))}
                  className="w-full accent-primary cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="p-2 clip-chamfer-xs bg-muted/80 border border-border text-center">
                  <span className="block text-[10px] font-mono text-muted-foreground uppercase">
                    ARENA VOLATILITY
                  </span>
                  <span className="text-sm font-mono font-bold" style={{ color: activePalette.highlightHex }}>
                    LEVEL 4.8
                  </span>
                </div>
                <div className="p-2 clip-chamfer-xs bg-muted/80 border border-border text-center">
                  <span className="block text-[10px] font-mono text-muted-foreground uppercase">
                    CAPITOL SPONSORSHIP
                  </span>
                  <span className="text-sm font-mono font-bold text-primary">78,450 ₳</span>
                </div>
              </div>
            </div>
          </div>

          {/* Panel 3: Chamfered Form Inputs & Search */}
          <div className="flex flex-col gap-3 clip-chamfer-sm border border-primary/40 bg-muted/40 p-4">
            <span className="text-xs font-mono font-bold tracking-wider text-primary uppercase">
              3. Interactive HUD Inputs
            </span>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Crosshair className="absolute left-3 top-2.5 h-4 w-4 text-primary/60" />
                <input
                  type="text"
                  placeholder="SEARCH_TRIBUTE // DIST_12..."
                  className="w-full pl-9 pr-3 py-2 clip-chamfer-xs border border-primary/50 bg-background text-foreground text-xs font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <button
                type="button"
                className="px-3 py-2 clip-chamfer-xs bg-primary text-primary-foreground font-mono font-bold text-xs hover:brightness-110 cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Panel 4: Status Badges & Reticles */}
          <div className="flex flex-col gap-3 clip-chamfer-sm border border-primary/40 bg-muted/40 p-4">
            <span className="text-xs font-mono font-bold tracking-wider text-primary uppercase">
              4. District Tactical Badges
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 clip-chamfer-xs bg-primary/20 border border-primary/60 text-primary font-mono text-xs font-bold">
                <Zap className="h-3.5 w-3.5" />
                D12 // REBEL LEADER
              </span>
              <span
                className="inline-flex items-center gap-1 px-2.5 py-1 clip-chamfer-xs font-mono text-xs font-bold border"
                style={{
                  backgroundColor: `${activePalette.highlightHex}25`,
                  borderColor: `${activePalette.highlightHex}80`,
                  color: activePalette.highlightHex,
                }}
              >
                <Flame className="h-3.5 w-3.5" />
                IN COMBAT
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 clip-chamfer-xs bg-muted border border-border text-muted-foreground font-mono text-xs">
                <Shield className="h-3.5 w-3.5" />
                ALLIANCE ACTIVE
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TRIBUTE HUD CARDS */}
      {activeTab === "tributes" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 relative z-20">
          {/* Tribute 1 */}
          <div className="clip-chamfer-sm border-2 border-primary bg-muted/50 p-4 flex flex-col justify-between gap-4 shadow-[3px_3px_0px_rgba(0,0,0,0.3)]">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="px-1.5 py-0.5 clip-chamfer-xs bg-primary text-primary-foreground font-mono font-bold text-[10px]">
                  DISTRICT 12
                </span>
                <span className="text-xs font-mono text-primary font-bold">#01 // KATNISS</span>
              </div>
              <h4 className="font-serif font-bold text-base text-foreground">
                Katniss Everdeen
              </h4>
              <p className="text-xs text-muted-foreground font-mono">
                Equipped: Recurve Bow, 12 Arrows, Mockingjay Token
              </p>
            </div>

            <div className="flex flex-col gap-1.5 pt-2 border-t border-border">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-muted-foreground">VITALITY</span>
                <span className="text-primary font-bold">88%</span>
              </div>
              <div className="w-full bg-muted h-1.5 clip-chamfer-xs overflow-hidden">
                <div className="bg-primary h-full w-[88%]" />
              </div>
            </div>
          </div>

          {/* Tribute 2 */}
          <div className="clip-chamfer-sm border-2 border-primary/60 bg-muted/50 p-4 flex flex-col justify-between gap-4 shadow-[3px_3px_0px_rgba(0,0,0,0.3)]">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="px-1.5 py-0.5 clip-chamfer-xs bg-primary/30 text-primary border border-primary/50 font-mono font-bold text-[10px]">
                  DISTRICT 12
                </span>
                <span className="text-xs font-mono text-primary font-bold">#02 // PEETA</span>
              </div>
              <h4 className="font-serif font-bold text-base text-foreground">
                Peeta Mellark
              </h4>
              <p className="text-xs text-muted-foreground font-mono">
                Equipped: Camouflage Kit, Bread Loaf, Hunting Knife
              </p>
            </div>

            <div className="flex flex-col gap-1.5 pt-2 border-t border-border">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-muted-foreground">VITALITY</span>
                <span className="font-bold" style={{ color: activePalette.highlightHex }}>72%</span>
              </div>
              <div className="w-full bg-muted h-1.5 clip-chamfer-xs overflow-hidden">
                <div className="h-full w-[72%]" style={{ backgroundColor: activePalette.highlightHex }} />
              </div>
            </div>
          </div>

          {/* Tribute 3 */}
          <div
            className="clip-chamfer-sm border-2 bg-muted/50 p-4 flex flex-col justify-between gap-4 shadow-[3px_3px_0px_rgba(0,0,0,0.3)]"
            style={{ borderColor: activePalette.highlightHex }}
          >
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span
                  className="px-1.5 py-0.5 clip-chamfer-xs font-mono font-bold text-[10px] text-white"
                  style={{ backgroundColor: activePalette.highlightHex }}
                >
                  DISTRICT 02
                </span>
                <span className="text-xs font-mono font-bold" style={{ color: activePalette.highlightHex }}>
                  #04 // CATO
                </span>
              </div>
              <h4 className="font-serif font-bold text-base text-foreground">
                Cato Hadley
              </h4>
              <p className="text-xs text-muted-foreground font-mono">
                Equipped: Broadsword, Body Armor, Career Pack
              </p>
            </div>

            <div className="flex flex-col gap-1.5 pt-2 border-t border-border">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-muted-foreground">VITALITY</span>
                <span className="text-primary font-bold">95%</span>
              </div>
              <div className="w-full bg-muted h-1.5 clip-chamfer-xs overflow-hidden">
                <div className="bg-primary h-full w-[95%]" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ARENA BROADCAST LOG */}
      {activeTab === "broadcast" && (
        <div className="flex flex-col gap-3 pt-6 relative z-20">
          <div className="flex flex-col gap-2 font-mono text-xs">
            <div className="p-3 clip-chamfer-xs border-l-4 border-primary bg-muted/50 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <Radio className="h-4 w-4 text-primary shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <span className="text-primary font-bold">[DAY 01 • 14:22]</span>{" "}
                  <span className="text-foreground">
                    Katniss Everdeen retrieved bow from Cornucopia and evaded Career ambush.
                  </span>
                </div>
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0 uppercase">SECTOR 04</span>
            </div>

            <div
              className="p-3 clip-chamfer-xs border-l-4 bg-muted/50 flex items-start justify-between gap-3"
              style={{ borderLeftColor: activePalette.highlightHex }}
            >
              <div className="flex items-start gap-2.5">
                <Skull className="h-4 w-4 shrink-0 mt-0.5" style={{ color: activePalette.highlightHex }} />
                <div>
                  <span className="font-bold" style={{ color: activePalette.highlightHex }}>
                    [CANNON FIRE • 12:00]
                  </span>{" "}
                  <span className="text-foreground">
                    1 Cannon recorded: District 9 Male fallen in Cornucopia skirmish.
                  </span>
                </div>
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0 uppercase">SECTOR 01</span>
            </div>

            <div className="p-3 clip-chamfer-xs border-l-4 border-primary/50 bg-muted/50 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <Award className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="text-primary font-bold">[SPONSOR GIFT • 18:45]</span>{" "}
                  <span className="text-foreground">
                    Haymitch Abernathy sent burn ointment to Katniss Everdeen via silver parachute.
                  </span>
                </div>
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0 uppercase">AIR DROP</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
