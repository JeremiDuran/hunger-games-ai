"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useThemeEngine } from "@/lib/theme-context";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP);
}

export function BackgroundRadarGrid() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { activePalette } = useThemeEngine();

  useGSAP(
    () => {
      // 1. Endless Radar Sweep Rotation
      gsap.to(".radar-sweep", {
        rotation: 360,
        transformOrigin: "50% 50%",
        duration: 9,
        ease: "none",
        repeat: -1,
      });

      // 2. Pulsing concentric rings
      gsap.to(".radar-ring-pulse", {
        scale: 1.08,
        opacity: 0.7,
        duration: 2.2,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        stagger: 0.35,
        transformOrigin: "50% 50%",
      });

      // 3. Blinking tactical blips
      gsap.to(".tactical-blip", {
        opacity: 0.1,
        scale: 0.7,
        duration: 1.4,
        ease: "power2.inOut",
        yoyo: true,
        repeat: -1,
        stagger: {
          each: 0.25,
          from: "random",
        },
      });

      // 4. Subtle scanline translation
      gsap.fromTo(
        ".hud-scanline",
        { y: "-100%" },
        {
          y: "100%",
          duration: 7,
          ease: "none",
          repeat: -1,
        }
      );
    },
    { scope: containerRef, dependencies: [activePalette.id] }
  );

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none"
    >
      {/* Background Matrix Grid Pattern */}
      <div
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage: `
            linear-gradient(to right, ${activePalette.accentHex}30 1px, transparent 1px),
            linear-gradient(to bottom, ${activePalette.accentHex}30 1px, transparent 1px)
          `,
          backgroundSize: "36px 36px",
        }}
      />

      {/* Moving CRT Scanline Beam */}
      <div
        className="hud-scanline absolute inset-x-0 h-28 opacity-15 pointer-events-none"
        style={{
          background: `linear-gradient(to bottom, transparent, ${activePalette.accentHex}40, transparent)`,
        }}
      />

      {/* Central Tactical Radar SVG */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] sm:w-[900px] sm:h-[900px] opacity-25">
        <svg viewBox="0 0 800 800" className="w-full h-full">
          <defs>
            <radialGradient id="radarSweepGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={activePalette.accentHex} stopOpacity="0.4" />
              <stop offset="60%" stopColor={activePalette.accentHex} stopOpacity="0.1" />
              <stop offset="100%" stopColor={activePalette.accentHex} stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Concentric rings */}
          <circle
            cx="400"
            cy="400"
            r="360"
            fill="none"
            stroke={activePalette.accentHex}
            strokeWidth="1"
            strokeDasharray="4 6"
            className="radar-ring-pulse"
          />
          <circle
            cx="400"
            cy="400"
            r="260"
            fill="none"
            stroke={activePalette.accentHex}
            strokeWidth="1.5"
            className="radar-ring-pulse"
          />
          <circle
            cx="400"
            cy="400"
            r="160"
            fill="none"
            stroke={activePalette.accentHex}
            strokeWidth="1"
            strokeDasharray="2 4"
            className="radar-ring-pulse"
          />
          <circle
            cx="400"
            cy="400"
            r="60"
            fill="none"
            stroke={activePalette.accentHex}
            strokeWidth="1"
          />

          {/* Crosshairs & Angle Rays */}
          <line
            x1="40"
            y1="400"
            x2="760"
            y2="400"
            stroke={activePalette.accentHex}
            strokeWidth="1"
            strokeDasharray="8 8"
          />
          <line
            x1="400"
            y1="40"
            x2="400"
            y2="760"
            stroke={activePalette.accentHex}
            strokeWidth="1"
            strokeDasharray="8 8"
          />
          <line
            x1="150"
            y1="150"
            x2="650"
            y2="650"
            stroke={activePalette.accentHex}
            strokeWidth="0.5"
            strokeDasharray="4 8"
          />
          <line
            x1="150"
            y1="650"
            x2="650"
            y2="150"
            stroke={activePalette.accentHex}
            strokeWidth="0.5"
            strokeDasharray="4 8"
          />

          {/* Rotating Radar Sweep Cone */}
          <g className="radar-sweep">
            <path
              d="M 400 400 L 760 400 A 360 360 0 0 0 654.5 145.5 Z"
              fill="url(#radarSweepGrad)"
            />
            <line
              x1="400"
              y1="400"
              x2="760"
              y2="400"
              stroke={activePalette.highlightHex}
              strokeWidth="2"
            />
          </g>

          {/* Tactical Blips on Radar Coordinates */}
          <circle
            cx="520"
            cy="310"
            r="4.5"
            fill={activePalette.highlightHex}
            className="tactical-blip"
          />
          <circle
            cx="290"
            cy="490"
            r="3.5"
            fill={activePalette.accentHex}
            className="tactical-blip"
          />
          <circle
            cx="480"
            cy="560"
            r="4"
            fill={activePalette.highlightHex}
            className="tactical-blip"
          />
          <circle
            cx="250"
            cy="270"
            r="3"
            fill={activePalette.accentHex}
            className="tactical-blip"
          />
          <circle
            cx="590"
            cy="460"
            r="5"
            fill={activePalette.highlightHex}
            className="tactical-blip"
          />
        </svg>
      </div>

      {/* Decorative Corner HUD Markers */}
      <div className="absolute top-8 left-8 font-mono text-[10px] text-muted-foreground/60 tracking-widest uppercase hidden lg:block">
        [SURVEILLANCE SECTOR: 01-12]
        <br />
        [FREQ: 104.7 MHZ // PROTOCOL: AD-INFINITUM]
      </div>
      <div className="absolute top-8 right-8 font-mono text-[10px] text-muted-foreground/60 tracking-widest uppercase text-right hidden lg:block">
        [SYS_MONITOR: ACTIVE]
        <br />
        [ENCRYPTION: CAPITOL-GRADE]
      </div>
      <div className="absolute bottom-8 left-8 font-mono text-[10px] text-muted-foreground/60 tracking-widest uppercase hidden lg:block">
        [COORDINATES: 38.8951° N, 77.0364° W]
      </div>
    </div>
  );
}
