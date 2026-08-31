"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useThemeEngine } from "@/lib/theme-context";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP);
}

// 12 District Biometric Sensor Nodes
const DISTRICT_NODES = [
  { id: 1, x: 260, y: 160, label: "DIST_01 // LUXURY", code: "BIO-01" },
  { id: 2, x: 500, y: 130, label: "DIST_02 // MASONRY", code: "BIO-02" },
  { id: 3, x: 1100, y: 130, label: "DIST_03 // TECH", code: "BIO-03" },
  { id: 4, x: 1340, y: 160, label: "DIST_04 // FISHING", code: "BIO-04" },
  { id: 5, x: 180, y: 460, label: "DIST_05 // POWER", code: "BIO-05" },
  { id: 6, x: 1420, y: 460, label: "DIST_06 // TRANSPORT", code: "BIO-06" },
  { id: 7, x: 200, y: 760, label: "DIST_07 // LUMBER", code: "BIO-07" },
  { id: 8, x: 440, y: 840, label: "DIST_08 // TEXTILES", code: "BIO-08" },
  { id: 9, x: 1160, y: 840, label: "DIST_09 // GRAIN", code: "BIO-09" },
  { id: 10, x: 1400, y: 760, label: "DIST_10 // LIVESTOCK", code: "BIO-10" },
  { id: 11, x: 700, y: 890, label: "DIST_11 // AGRI", code: "BIO-11" },
  { id: 12, x: 900, y: 890, label: "DIST_12 // MINING", code: "BIO-12" },
];

// DNA Double-Helix Strand Nodes
const HELIX_POINTS_LEFT = Array.from({ length: 14 }).map((_, i) => {
  const y = 140 + i * 55;
  const phase = (i * Math.PI) / 3.5;
  const offset = Math.sin(phase) * 35;
  return {
    id: i,
    x1: 90 + offset,
    x2: 90 - offset,
    y,
  };
});

const HELIX_POINTS_RIGHT = Array.from({ length: 14 }).map((_, i) => {
  const y = 140 + i * 55;
  const phase = (i * Math.PI) / 3.5;
  const offset = Math.sin(phase) * 35;
  return {
    id: i,
    x1: 1510 + offset,
    x2: 1510 - offset,
    y,
  };
});

// 24 Roster Calibration Ticks around the Census Halo
const CENSUS_TICKS = Array.from({ length: 24 }).map((_, i) => {
  const angle = (i * 15 * Math.PI) / 180;
  const r1 = 370;
  const r2 = i % 2 === 0 ? 390 : 380;
  return {
    id: i,
    x1: Number((Math.cos(angle) * r1).toFixed(2)),
    y1: Number((Math.sin(angle) * r1).toFixed(2)),
    x2: Number((Math.cos(angle) * r2).toFixed(2)),
    y2: Number((Math.sin(angle) * r2).toFixed(2)),
    isMajor: i % 2 === 0,
  };
});

export function BackgroundTributesBiometric() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { activePalette, resolvedMode } = useThemeEngine();
  const isLight = resolvedMode === "light";

  useGSAP(
    () => {
      const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (prefersReducedMotion) {
        gsap.set(
          ".bio-rotate, .bio-counter-rotate, .bio-node-pulse, .bio-ekg-pulse, .bio-dna-node, .bio-scan-beam",
          {
            opacity: isLight ? 0.6 : 0.35,
            scale: 1,
          }
        );
        return;
      }

      // 1. Slow biometric census ring rotation
      gsap.to(".bio-rotate", {
        rotation: 360,
        transformOrigin: "50% 50%",
        duration: 100,
        ease: "none",
        repeat: -1,
      });

      // 2. Counter-rotation of inner tribute biometric classification dial
      gsap.to(".bio-counter-rotate", {
        rotation: -360,
        transformOrigin: "50% 50%",
        duration: 85,
        ease: "none",
        repeat: -1,
      });

      // 3. District Biometric Sensors pulsing (simulating live telemetry)
      gsap.to(".bio-node-pulse", {
        scale: 1.35,
        opacity: isLight ? 0.9 : 0.75,
        duration: 2.2,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        stagger: {
          each: 0.25,
          from: "random",
        },
        transformOrigin: "50% 50%",
      });

      // 4. DNA Helix nodes oscillating phase
      gsap.to(".bio-dna-node", {
        scale: 1.4,
        opacity: isLight ? 0.85 : 0.7,
        duration: 1.8,
        ease: "power1.inOut",
        yoyo: true,
        repeat: -1,
        stagger: {
          each: 0.15,
          from: "start",
        },
        transformOrigin: "50% 50%",
      });

      // 5. Heartbeat / EKG pulse wave traversing across telemetry bus
      gsap.fromTo(
        ".bio-ekg-pulse",
        {
          strokeDashoffset: 1200,
          opacity: 0.1,
        },
        {
          strokeDashoffset: 0,
          opacity: isLight ? 0.95 : 0.8,
          duration: 7,
          ease: "power1.inOut",
          repeat: -1,
          stagger: 2.5,
        }
      );

      // 6. Vertical Census Biometric Scanner beam
      gsap.fromTo(
        ".bio-scan-beam",
        {
          y: -420,
          opacity: 0,
        },
        {
          y: 420,
          opacity: isLight ? 0.45 : 0.35,
          duration: 9,
          ease: "sine.inOut",
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
          isLight ? "opacity-40" : "opacity-25"
        }`}
        style={{
          background: isLight
            ? `radial-gradient(ellipse 85% 65% at 50% 48%, ${activePalette.accentHex}35 0%, ${activePalette.highlightHex}18 50%, transparent 88%)`
            : `radial-gradient(ellipse 80% 60% at 50% 45%, ${activePalette.accentHex}30 0%, ${activePalette.highlightHex}12 50%, transparent 85%)`,
        }}
      />

      {/* Biometric Vital Matrix Grid Pattern */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 ${
          isLight ? "opacity-[0.09]" : "opacity-[0.035]"
        }`}
        style={{
          backgroundImage: `radial-gradient(${activePalette.accentHex} 1.5px, transparent 1.5px)`,
          backgroundSize: "30px 30px",
        }}
      />

      {/* Center Readability Mask */}
      <div
        className={`absolute inset-0 w-full h-full transition-opacity duration-500 ${
          isLight ? "opacity-90" : "opacity-70"
        }`}
        style={{
          maskImage:
            "radial-gradient(ellipse 75% 60% at 50% 48%, transparent 22%, black 85%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 75% 60% at 50% 48%, transparent 22%, black 85%)",
        }}
      >
        <svg
          viewBox="0 0 1600 1000"
          preserveAspectRatio="xMidYMid slice"
          className="w-full h-full"
        >
          <defs>
            <linearGradient id="bioEkgGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={activePalette.accentHex} stopOpacity="0.1" />
              <stop offset="50%" stopColor={activePalette.highlightHex} stopOpacity={isLight ? 1 : 0.9} />
              <stop offset="100%" stopColor={activePalette.accentHex} stopOpacity="0.1" />
            </linearGradient>

            <linearGradient id="bioScanGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="transparent" />
              <stop
                offset="50%"
                stopColor={activePalette.accentHex}
                stopOpacity={isLight ? 0.45 : 0.3}
              />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>

            <linearGradient id="helixGradLeft" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={activePalette.accentHex} stopOpacity="0.1" />
              <stop offset="50%" stopColor={activePalette.highlightHex} stopOpacity={isLight ? 0.75 : 0.5} />
              <stop offset="100%" stopColor={activePalette.accentHex} stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {/* 1. Flank DNA Double-Helix Telemetry Columns */}
          {/* Left DNA Column */}
          <g>
            {HELIX_POINTS_LEFT.map((pt) => (
              <g key={`helix-l-${pt.id}`}>
                {/* Cross rungs */}
                <line
                  x1={pt.x1}
                  y1={pt.y}
                  x2={pt.x2}
                  y2={pt.y}
                  stroke={activePalette.accentHex}
                  strokeWidth={isLight ? "1.4" : "1"}
                  strokeOpacity={isLight ? "0.45" : "0.25"}
                  strokeDasharray="2 4"
                />
                {/* Left strand node */}
                <circle
                  cx={pt.x1}
                  cy={pt.y}
                  r={isLight ? 3.5 : 2.5}
                  fill={activePalette.accentHex}
                  className="bio-dna-node"
                  opacity={isLight ? 0.7 : 0.5}
                />
                {/* Right strand node */}
                <circle
                  cx={pt.x2}
                  cy={pt.y}
                  r={isLight ? 3.5 : 2.5}
                  fill={activePalette.highlightHex}
                  className="bio-dna-node"
                  opacity={isLight ? 0.7 : 0.5}
                />
              </g>
            ))}
          </g>

          {/* Right DNA Column */}
          <g>
            {HELIX_POINTS_RIGHT.map((pt) => (
              <g key={`helix-r-${pt.id}`}>
                {/* Cross rungs */}
                <line
                  x1={pt.x1}
                  y1={pt.y}
                  x2={pt.x2}
                  y2={pt.y}
                  stroke={activePalette.accentHex}
                  strokeWidth={isLight ? "1.4" : "1"}
                  strokeOpacity={isLight ? "0.45" : "0.25"}
                  strokeDasharray="2 4"
                />
                {/* Left strand node */}
                <circle
                  cx={pt.x1}
                  cy={pt.y}
                  r={isLight ? 3.5 : 2.5}
                  fill={activePalette.highlightHex}
                  className="bio-dna-node"
                  opacity={isLight ? 0.7 : 0.5}
                />
                {/* Right strand node */}
                <circle
                  cx={pt.x2}
                  cy={pt.y}
                  r={isLight ? 3.5 : 2.5}
                  fill={activePalette.accentHex}
                  className="bio-dna-node"
                  opacity={isLight ? 0.7 : 0.5}
                />
              </g>
            ))}
          </g>

          {/* 2. Horizontal Biometric Heartbeat / EKG Telemetry Streams */}
          {/* Upper EKG Line */}
          <path
            d="M 60,260 L 320,260 L 350,220 L 370,290 L 390,240 L 410,260 L 750,260 L 770,230 L 790,280 L 810,260 L 1200,260 L 1220,210 L 1240,290 L 1260,260 L 1540,260"
            fill="none"
            stroke={activePalette.accentHex}
            strokeWidth={isLight ? "1.2" : "1"}
            strokeOpacity={isLight ? "0.25" : "0.12"}
          />
          <path
            d="M 60,260 L 320,260 L 350,220 L 370,290 L 390,240 L 410,260 L 750,260 L 770,230 L 790,280 L 810,260 L 1200,260 L 1220,210 L 1240,290 L 1260,260 L 1540,260"
            fill="none"
            stroke="url(#bioEkgGrad)"
            strokeWidth={isLight ? "2.2" : "1.8"}
            strokeDasharray="160 450"
            className="bio-ekg-pulse"
          />

          {/* Lower EKG Line */}
          <path
            d="M 60,720 L 280,720 L 300,750 L 320,680 L 340,730 L 360,720 L 800,720 L 820,690 L 840,750 L 860,720 L 1180,720 L 1200,680 L 1220,760 L 1240,720 L 1540,720"
            fill="none"
            stroke={activePalette.accentHex}
            strokeWidth={isLight ? "1.2" : "1"}
            strokeOpacity={isLight ? "0.25" : "0.12"}
          />
          <path
            d="M 60,720 L 280,720 L 300,750 L 320,680 L 340,730 L 360,720 L 800,720 L 820,690 L 840,750 L 860,720 L 1180,720 L 1200,680 L 1220,760 L 1240,720 L 1540,720"
            fill="none"
            stroke="url(#bioEkgGrad)"
            strokeWidth={isLight ? "2.2" : "1.8"}
            strokeDasharray="160 450"
            className="bio-ekg-pulse"
          />

          {/* 3. 12 District Biometric Sensor Nodes */}
          {DISTRICT_NODES.map((node) => (
            <g key={`bio-node-${node.id}`} transform={`translate(${node.x}, ${node.y})`}>
              {/* Telemetry Bracket */}
              <path
                d="M -12,-8 L -16,-8 L -16,8 L -12,8 M 12,-8 L 16,-8 L 16,8 L 12,8"
                fill="none"
                stroke={activePalette.accentHex}
                strokeWidth={isLight ? "1.4" : "1"}
                strokeOpacity={isLight ? "0.6" : "0.35"}
              />
              {/* Pulsing Outer Aura */}
              <circle
                cx={0}
                cy={0}
                r={isLight ? 7 : 6}
                fill={activePalette.highlightHex}
                className="bio-node-pulse"
                opacity={isLight ? 0.5 : 0.35}
              />
              {/* Center Biometric Core */}
              <circle
                cx={0}
                cy={0}
                r={isLight ? 2.8 : 2}
                fill={isLight ? activePalette.accentHex : "#ffffff"}
                className={isLight ? "opacity-95" : "opacity-90"}
              />
              {/* Node Code & District Label */}
              <text
                x={0}
                y={-14}
                textAnchor="middle"
                fill={activePalette.accentHex}
                fontSize="8"
                fontFamily="monospace"
                letterSpacing="1"
                className={`select-none uppercase font-bold ${
                  isLight ? "opacity-75" : "opacity-45"
                }`}
              >
                {node.label}
              </text>
            </g>
          ))}

          {/* 4. Center Biometric Census Nexus (cx=800, cy=500) */}
          <g transform="translate(800, 500)">
            {/* Biometric Scanning Beam */}
            <rect
              x={-480}
              y={-25}
              width={960}
              height={50}
              fill="url(#bioScanGrad)"
              className="bio-scan-beam"
            />

            {/* Rotating Outer Census Calibration Ring */}
            <g className="bio-rotate">
              {/* Octagonal Outer Reticle */}
              <polygon
                points="0,-390 275,-275 390,0 275,275 0,390 -275,275 -390,0 -275,-275"
                fill="none"
                stroke={activePalette.accentHex}
                strokeWidth={isLight ? "1.8" : "1.4"}
                strokeDasharray="18 10 4 10"
                strokeOpacity={isLight ? "0.45" : "0.28"}
              />

              {/* Census Tick Marks */}
              {CENSUS_TICKS.map((tick) => (
                <line
                  key={`census-tick-${tick.id}`}
                  x1={tick.x1}
                  y1={tick.y1}
                  x2={tick.x2}
                  y2={tick.y2}
                  stroke={tick.isMajor ? activePalette.highlightHex : activePalette.accentHex}
                  strokeWidth={tick.isMajor ? (isLight ? "1.8" : "1.4") : isLight ? "1.2" : "0.8"}
                  strokeOpacity={tick.isMajor ? (isLight ? "0.6" : "0.4") : isLight ? "0.4" : "0.2"}
                />
              ))}
            </g>

            {/* Counter-Rotating Inner Tribute Classification Ring */}
            <g className="bio-counter-rotate">
              <circle
                cx={0}
                cy={0}
                r={310}
                fill="none"
                stroke={activePalette.highlightHex}
                strokeWidth={isLight ? "1.5" : "1"}
                strokeDasharray="8 12"
                strokeOpacity={isLight ? "0.4" : "0.25"}
              />
              <circle
                cx={0}
                cy={0}
                r={240}
                fill="none"
                stroke={activePalette.accentHex}
                strokeWidth={isLight ? "1.4" : "1"}
                strokeDasharray="14 6 2 6"
                strokeOpacity={isLight ? "0.35" : "0.2"}
              />

              {/* 4 Cardinal Biometric Target Brackets */}
              <path
                d="M -250,-20 L -250,-40 L -230,-40 M 250,-20 L 250,-40 L 230,-40 M -250,20 L -250,40 L -230,40 M 250,20 L 250,40 L 230,40"
                fill="none"
                stroke={activePalette.highlightHex}
                strokeWidth={isLight ? "2" : "1.5"}
                strokeOpacity={isLight ? "0.6" : "0.45"}
              />
            </g>

            {/* Central Tribute Vital Target Core */}
            <g className={isLight ? "opacity-55" : "opacity-35"}>
              <circle
                cx={0}
                cy={0}
                r={65}
                fill="none"
                stroke={activePalette.accentHex}
                strokeWidth={isLight ? "1.4" : "1"}
                strokeDasharray="4 6"
              />
              <line
                x1={-90}
                y1={0}
                x2={90}
                y2={0}
                stroke={activePalette.highlightHex}
                strokeWidth={isLight ? "1.4" : "1"}
                strokeDasharray="4 4"
              />
              <line
                x1={0}
                y1={-90}
                x2={0}
                y2={90}
                stroke={activePalette.highlightHex}
                strokeWidth={isLight ? "1.4" : "1"}
                strokeDasharray="4 4"
              />
              {/* Central Diamond Glyphs */}
              <polygon
                points="0,-16 16,0 0,16 -16,0"
                fill="none"
                stroke={activePalette.accentHex}
                strokeWidth={isLight ? "1.8" : "1.4"}
              />
            </g>
          </g>
        </svg>
      </div>
    </div>
  );
}
