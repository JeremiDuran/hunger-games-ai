"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useThemeEngine } from "@/lib/theme-context";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP);
}

// Deterministic matrix grid coordinates
const TACTICAL_NODES = [
  { id: 1, x: 220, y: 180, label: "SYS_RNG.01", type: "primary" },
  { id: 2, x: 540, y: 140, label: "RULE_LETHAL.V2", type: "secondary" },
  { id: 3, x: 1060, y: 160, label: "HAZARD_FREQ.CLK", type: "secondary" },
  { id: 4, x: 1380, y: 220, label: "VICTORY_COND.0", type: "primary" },
  { id: 5, x: 180, y: 620, label: "TELEMETRY_LOG", type: "secondary" },
  { id: 6, x: 420, y: 780, label: "AI_PROSE_VOX", type: "primary" },
  { id: 7, x: 1180, y: 820, label: "FEAST_SUMMON.TRG", type: "primary" },
  { id: 8, x: 1420, y: 680, label: "DIRECTIVE_SYNC", type: "secondary" },
];

// Circuit connector lines
const CIRCUIT_PATHS = [
  "M 100,180 L 220,180 L 320,240 L 480,240 L 540,140 L 700,140",
  "M 900,140 L 1060,160 L 1200,160 L 1280,220 L 1380,220 L 1520,220",
  "M 80,620 L 180,620 L 280,720 L 420,780 L 620,780",
  "M 980,780 L 1180,820 L 1300,740 L 1420,680 L 1550,680",
  "M 220,180 L 220,380 L 140,480 L 180,620",
  "M 1380,220 L 1380,440 L 1460,540 L 1420,680",
];

// Hexagon perimeter ticks
const HEX_TICKS = Array.from({ length: 12 }).map((_, i) => {
  const angle = (i * 30 * Math.PI) / 180;
  const r1 = 380;
  const r2 = 395;
  return {
    id: i,
    x1: Number((Math.cos(angle) * r1).toFixed(2)),
    y1: Number((Math.sin(angle) * r1).toFixed(2)),
    x2: Number((Math.cos(angle) * r2).toFixed(2)),
    y2: Number((Math.sin(angle) * r2).toFixed(2)),
  };
});

export function BackgroundRulesTactical() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { activePalette, resolvedMode } = useThemeEngine();
  const isLight = resolvedMode === "light";

  useGSAP(
    () => {
      const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (prefersReducedMotion) {
        gsap.set(".tactical-spin, .tactical-counter, .tactical-pulse, .tactical-scan, .tactical-laser", {
          opacity: isLight ? 0.6 : 0.35,
          scale: 1,
        });
        return;
      }

      // 1. Slow, commanding rotation of the tactical Gamemaker command ring
      gsap.to(".tactical-spin", {
        rotation: 360,
        transformOrigin: "50% 50%",
        duration: 80,
        ease: "none",
        repeat: -1,
      });

      // 2. Counter rotation of inner simulation reticle
      gsap.to(".tactical-counter", {
        rotation: -360,
        transformOrigin: "50% 50%",
        duration: 100,
        ease: "none",
        repeat: -1,
      });

      // 3. Logic Node telemetry breathing
      gsap.to(".tactical-pulse", {
        scale: 1.25,
        opacity: isLight ? 0.9 : 0.85,
        duration: 3,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        stagger: {
          each: 0.4,
          from: "random",
        },
        transformOrigin: "50% 50%",
      });

      // 4. Kinetic circuit conduit pulse streams (dashoffset animation)
      gsap.fromTo(
        ".tactical-laser",
        {
          strokeDashoffset: 1000,
          opacity: 0.2,
        },
        {
          strokeDashoffset: 0,
          opacity: isLight ? 0.95 : 0.75,
          duration: 12,
          ease: "none",
          repeat: -1,
          stagger: 2,
        }
      );

      // 5. Tactical laser sweep scanning beam
      gsap.fromTo(
        ".tactical-scan",
        {
          y: -400,
          opacity: 0,
        },
        {
          y: 400,
          opacity: isLight ? 0.5 : 0.4,
          duration: 8,
          ease: "power1.inOut",
          yoyo: true,
          repeat: -1,
        }
      );
    },
    { scope: containerRef, dependencies: [activePalette.id, isLight] }
  );

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none w-full h-full"
      aria-hidden="true"
    >
      {/* Deep atmospheric backdrop glow reacting to visual palette */}
      <div
        className={`absolute inset-0 transition-all duration-700 ${
          isLight ? "opacity-40" : "opacity-20"
        }`}
        style={{
          background: isLight
            ? `radial-gradient(ellipse 90% 70% at 50% 50%, ${activePalette.accentHex}35 0%, ${activePalette.highlightHex}15 50%, transparent 90%)`
            : `radial-gradient(ellipse 90% 70% at 50% 50%, ${activePalette.accentHex}25 0%, ${activePalette.highlightHex}10 50%, transparent 90%)`,
        }}
      />

      {/* Cybernetic telemetry digital dot matrix */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 ${
          isLight ? "opacity-[0.09]" : "opacity-[0.03]"
        }`}
        style={{
          backgroundImage: `radial-gradient(${activePalette.highlightHex} 1.5px, transparent 1.5px)`,
          backgroundSize: "28px 28px",
        }}
      />

      {/* Center Readability Mask */}
      <div
        className={`absolute inset-0 w-full h-full transition-opacity duration-500 ${
          isLight ? "opacity-90" : "opacity-70"
        }`}
        style={{
          maskImage:
            "radial-gradient(ellipse 75% 60% at 50% 50%, transparent 20%, black 85%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 75% 60% at 50% 50%, transparent 20%, black 85%)",
        }}
      >
        <svg
          viewBox="0 0 1600 1000"
          preserveAspectRatio="xMidYMid slice"
          className="w-full h-full"
        >
          <defs>
            <linearGradient id="rulesLaserGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={activePalette.accentHex} stopOpacity="0.1" />
              <stop offset="50%" stopColor={activePalette.highlightHex} stopOpacity="0.9" />
              <stop offset="100%" stopColor={activePalette.accentHex} stopOpacity="0.1" />
            </linearGradient>

            <linearGradient id="scanBeamGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="50%" stopColor={activePalette.accentHex} stopOpacity="0.35" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>

          {/* 1. Static Circuitry Conduit Bus Background */}
          {CIRCUIT_PATHS.map((path, idx) => (
            <path
              key={`circuit-base-${idx}`}
              d={path}
              fill="none"
              stroke={activePalette.accentHex}
              strokeWidth="1.2"
              strokeOpacity="0.12"
            />
          ))}

          {/* 2. Kinetic Glowing Laser Pulse Conduits */}
          {CIRCUIT_PATHS.map((path, idx) => (
            <path
              key={`circuit-laser-${idx}`}
              d={path}
              fill="none"
              stroke="url(#rulesLaserGrad)"
              strokeWidth="1.8"
              strokeDasharray="120 400"
              className="tactical-laser"
            />
          ))}

          {/* 3. Logic Nodes & Telemetry Labels */}
          {TACTICAL_NODES.map((node) => {
            const isPrimary = node.type === "primary";
            return (
              <g key={`node-${node.id}`} transform={`translate(${node.x}, ${node.y})`}>
                {/* Outer pulse ring */}
                <circle
                  cx={0}
                  cy={0}
                  r={isPrimary ? 8 : 5}
                  fill={isPrimary ? activePalette.highlightHex : activePalette.accentHex}
                  className="tactical-pulse opacity-40"
                />
                {/* Center dot */}
                <circle
                  cx={0}
                  cy={0}
                  r={isPrimary ? 3 : 2}
                  fill={isPrimary ? "#ffffff" : activePalette.accentHex}
                  className="opacity-90"
                />
                {/* Node Label */}
                <text
                  x={12}
                  y={4}
                  fill={activePalette.accentHex}
                  fontSize="8"
                  fontFamily="monospace"
                  letterSpacing="1"
                  className="opacity-45 select-none uppercase font-bold"
                >
                  {node.label}
                </text>
              </g>
            );
          })}

          {/* 4. Center Command Nexus (cx=800, cy=500) */}
          <g transform="translate(800, 500)">
            {/* Tactical Scanning Laser Beam */}
            <rect
              x={-500}
              y={-20}
              width={1000}
              height={40}
              fill="url(#scanBeamGrad)"
              className="tactical-scan"
            />

            {/* Rotating Outer Directive Hex-Ring */}
            <g className="tactical-spin">
              <polygon
                points="0,-400 346,-200 346,200 0,400 -346,200 -346,-200"
                fill="none"
                stroke={activePalette.accentHex}
                strokeWidth="1.4"
                strokeDasharray="20 10 4 10"
                strokeOpacity="0.25"
              />

              {/* Hex perimeter tick marks */}
              {HEX_TICKS.map((tick) => (
                <line
                  key={`hex-tick-${tick.id}`}
                  x1={tick.x1}
                  y1={tick.y1}
                  x2={tick.x2}
                  y2={tick.y2}
                  stroke={activePalette.highlightHex}
                  strokeWidth="1.2"
                  strokeOpacity="0.35"
                />
              ))}
            </g>

            {/* Counter-Rotating Inner Protocol Dial */}
            <g className="tactical-counter">
              <circle
                cx={0}
                cy={0}
                r={300}
                fill="none"
                stroke={activePalette.highlightHex}
                strokeWidth="1"
                strokeDasharray="6 14"
                strokeOpacity="0.2"
              />
              <circle
                cx={0}
                cy={0}
                r={220}
                fill="none"
                stroke={activePalette.accentHex}
                strokeWidth="1"
                strokeDasharray="16 8 2 8"
                strokeOpacity="0.18"
              />

              {/* Cardinal telemetry alignment pips */}
              <line x1={-310} y1={0} x2={-290} y2={0} stroke={activePalette.highlightHex} strokeWidth="2" strokeOpacity="0.5" />
              <line x1={290} y1={0} x2={310} y2={0} stroke={activePalette.highlightHex} strokeWidth="2" strokeOpacity="0.5" />
              <line x1={0} y1={-310} x2={0} y2={-290} stroke={activePalette.highlightHex} strokeWidth="2" strokeOpacity="0.5" />
              <line x1={0} y1={290} x2={0} y2={310} stroke={activePalette.highlightHex} strokeWidth="2" strokeOpacity="0.5" />
            </g>

            {/* Crosshair telemetry core */}
            <g className="opacity-30">
              <line x1={-80} y1={0} x2={80} y2={0} stroke={activePalette.accentHex} strokeWidth="1" strokeDasharray="4 4" />
              <line x1={0} y1={-80} x2={0} y2={80} stroke={activePalette.accentHex} strokeWidth="1" strokeDasharray="4 4" />
              <circle cx={0} cy={0} r={40} fill="none" stroke={activePalette.accentHex} strokeWidth="1" strokeDasharray="2 6" />
            </g>
          </g>
        </svg>
      </div>
    </div>
  );
}
