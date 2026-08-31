"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useThemeEngine } from "@/lib/theme-context";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP);
}

// 24 Pedestal Launch Vector Coordinates positioned radially
const PEDESTAL_PODS = Array.from({ length: 24 }).map((_, i) => {
  const deg = i * 15;
  const rad = (deg * Math.PI) / 180;
  const r = 360;
  return {
    id: i,
    deg,
    x: Number((Math.cos(rad) * r).toFixed(2)),
    y: Number((Math.sin(rad) * r).toFixed(2)),
    isCardinal: deg % 90 === 0,
    isDistrictLead: deg % 30 === 0,
  };
});

// 12 Hexagonal telemetry markers
const TELEMETRY_MARKERS = Array.from({ length: 12 }).map((_, i) => {
  const angle = (i * 30 * Math.PI) / 180;
  const r1 = 440;
  const r2 = 455;
  return {
    id: i,
    x1: Number((Math.cos(angle) * r1).toFixed(2)),
    y1: Number((Math.sin(angle) * r1).toFixed(2)),
    x2: Number((Math.cos(angle) * r2).toFixed(2)),
    y2: Number((Math.sin(angle) * r2).toFixed(2)),
  };
});

// Tactical Command Orbit Lines
const ORBIT_PATHS = [
  "M -480,0 A 480,480 0 1,0 480,0 A 480,480 0 1,0 -480,0",
  "M -410,0 A 410,410 0 1,0 410,0 A 410,410 0 1,0 -410,0",
  "M -280,0 A 280,280 0 1,0 280,0 A 280,280 0 1,0 -280,0",
];

export function BackgroundSummaryWarRoom() {
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
          ".war-spin, .war-counter, .war-pulse, .war-wave, .war-pod-beacon, .war-scan-radar",
          {
            opacity: isLight ? 0.6 : 0.35,
            scale: 1,
          }
        );
        return;
      }

      // 1. Slow, majestic rotation of the outer War Room command ring
      gsap.to(".war-spin", {
        rotation: 360,
        transformOrigin: "50% 50%",
        duration: 90,
        ease: "none",
        repeat: -1,
      });

      // 2. Counter-rotation of the inner arena launch reticle
      gsap.to(".war-counter", {
        rotation: -360,
        transformOrigin: "50% 50%",
        duration: 75,
        ease: "none",
        repeat: -1,
      });

      // 3. Cornucopia center wave pulses expanding outward
      gsap.fromTo(
        ".war-wave",
        {
          scale: 0.1,
          opacity: isLight ? 0.9 : 0.8,
          strokeWidth: isLight ? 2.5 : 2,
        },
        {
          scale: 1.25,
          opacity: 0,
          strokeWidth: 0.5,
          duration: 7,
          ease: "power1.out",
          repeat: -1,
          stagger: 2.2,
          transformOrigin: "50% 50%",
        }
      );

      // 4. Tribute Launch Pod Beacons breathing in synchronization
      gsap.to(".war-pod-beacon", {
        scale: 1.45,
        opacity: isLight ? 0.95 : 0.85,
        duration: 2.5,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        stagger: {
          each: 0.15,
          from: "random",
        },
        transformOrigin: "50% 50%",
      });

      // 5. Radar sweep beam rotation around war room
      gsap.to(".war-scan-radar", {
        rotation: 360,
        transformOrigin: "50% 50%",
        duration: 14,
        ease: "none",
        repeat: -1,
      });

      // 6. Subsystem Telemetry Nodes breathing
      gsap.to(".war-pulse", {
        scale: 1.04,
        opacity: isLight ? 0.85 : 0.7,
        duration: 4,
        ease: "power1.inOut",
        yoyo: true,
        repeat: -1,
        transformOrigin: "50% 50%",
      });
    },
    { scope: containerRef, dependencies: [activePalette.id, isLight] }
  );

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none w-full h-full"
      aria-hidden="true"
    >
      {/* Deep atmospheric backdrop glow responding to visual palette */}
      <div
        className={`absolute inset-0 transition-all duration-700 ${
          isLight ? "opacity-45" : "opacity-30"
        }`}
        style={{
          background: isLight
            ? `radial-gradient(ellipse 90% 70% at 50% 50%, ${activePalette.accentHex}38 0%, ${activePalette.highlightHex}18 50%, transparent 90%)`
            : `radial-gradient(ellipse 85% 65% at 50% 50%, ${activePalette.accentHex}30 0%, ${activePalette.highlightHex}12 50%, transparent 88%)`,
        }}
      />

      {/* Cybernetic telemetry digital dot matrix */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 ${
          isLight ? "opacity-[0.09]" : "opacity-[0.035]"
        }`}
        style={{
          backgroundImage: `radial-gradient(${activePalette.accentHex} 1.5px, transparent 1.5px)`,
          backgroundSize: "28px 28px",
        }}
      />

      {/* Center Readability Mask */}
      <div
        className={`absolute inset-0 w-full h-full transition-opacity duration-500 ${
          isLight ? "opacity-90" : "opacity-75"
        }`}
        style={{
          maskImage:
            "radial-gradient(ellipse 75% 60% at 50% 50%, transparent 18%, black 85%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 75% 60% at 50% 50%, transparent 18%, black 85%)",
        }}
      >
        <svg
          viewBox="0 0 1600 1000"
          preserveAspectRatio="xMidYMid slice"
          className="w-full h-full"
        >
          <defs>
            <linearGradient id="warRadarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={activePalette.highlightHex} stopOpacity="0.4" />
              <stop offset="30%" stopColor={activePalette.accentHex} stopOpacity="0.15" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </linearGradient>

            <linearGradient id="warCoreGlow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={activePalette.accentHex} stopOpacity="0.8" />
              <stop offset="50%" stopColor={activePalette.highlightHex} stopOpacity="1" />
              <stop offset="100%" stopColor={activePalette.accentHex} stopOpacity="0.8" />
            </linearGradient>

            <radialGradient id="cornucopiaNexus" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={activePalette.highlightHex} stopOpacity={isLight ? 0.9 : 0.8} />
              <stop offset="45%" stopColor={activePalette.accentHex} stopOpacity="0.35" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* War Room Center Origin: cx=800, cy=500 */}
          <g transform="translate(800, 500)">
            {/* 1. Rotating Sweeping Radar Wedge */}
            <g className="war-scan-radar">
              <path
                d="M 0,0 L 460,-120 A 480,480 0 0,1 480,0 Z"
                fill="url(#warRadarGrad)"
              />
            </g>

            {/* 2. Expanding Cornucopia Outward Pulse Waves */}
            <circle cx={0} cy={0} r={460} fill="none" stroke={activePalette.accentHex} className="war-wave" />
            <circle cx={0} cy={0} r={460} fill="none" stroke={activePalette.highlightHex} className="war-wave" />
            <circle cx={0} cy={0} r={460} fill="none" stroke={activePalette.accentHex} className="war-wave" />

            {/* 3. Static Concentric Elevation Orbit Paths */}
            {ORBIT_PATHS.map((d, i) => (
              <path
                key={`orbit-${i}`}
                d={d}
                fill="none"
                stroke={activePalette.accentHex}
                strokeWidth={isLight ? "1.2" : "1"}
                strokeOpacity={isLight ? "0.25" : "0.15"}
                strokeDasharray={i === 1 ? "6 8" : "12 12"}
              />
            ))}

            {/* 4. Rotating Outer Command Dials & Azimuth Rings */}
            <g className="war-spin">
              {/* Outer Ring with Hexagonal Apex Geometry */}
              <polygon
                points="0,-480 240,-415 415,-240 480,0 415,240 240,415 0,480 -240,415 -415,240 -480,0 -415,-240 -240,-415"
                fill="none"
                stroke={activePalette.accentHex}
                strokeWidth={isLight ? "1.8" : "1.4"}
                strokeDasharray="24 12 4 12"
                strokeOpacity={isLight ? "0.4" : "0.25"}
              />

              {/* Telemetry tick marks */}
              {TELEMETRY_MARKERS.map((tick) => (
                <line
                  key={`tick-${tick.id}`}
                  x1={tick.x1}
                  y1={tick.y1}
                  x2={tick.x2}
                  y2={tick.y2}
                  stroke={activePalette.highlightHex}
                  strokeWidth={isLight ? "1.8" : "1.2"}
                  strokeOpacity={isLight ? "0.6" : "0.4"}
                />
              ))}
            </g>

            {/* 5. Counter-Rotating Inner Sector Ring */}
            <g className="war-counter">
              <circle
                cx={0}
                cy={0}
                r={360}
                fill="none"
                stroke={activePalette.highlightHex}
                strokeWidth={isLight ? "1.4" : "1"}
                strokeDasharray="4 8"
                strokeOpacity={isLight ? "0.4" : "0.25"}
              />

              {/* 4 Cardinal reticle brackets */}
              <line x1={-370} y1={0} x2={-350} y2={0} stroke={activePalette.highlightHex} strokeWidth="2" strokeOpacity="0.6" />
              <line x1={350} y1={0} x2={370} y2={0} stroke={activePalette.highlightHex} strokeWidth="2" strokeOpacity="0.6" />
              <line x1={0} y1={-370} x2={0} y2={-350} stroke={activePalette.highlightHex} strokeWidth="2" strokeOpacity="0.6" />
              <line x1={0} y1={350} x2={0} y2={370} stroke={activePalette.highlightHex} strokeWidth="2" strokeOpacity="0.6" />
            </g>

            {/* 6. 24 Tribute Pedestal Launch Pods */}
            {PEDESTAL_PODS.map((pod) => (
              <g key={`pod-${pod.id}`} transform={`translate(${pod.x}, ${pod.y})`}>
                {/* Radial launch vector line to center */}
                <line
                  x1={0}
                  y1={0}
                  x2={-pod.x * 0.15}
                  y2={-pod.y * 0.15}
                  stroke={activePalette.accentHex}
                  strokeWidth="0.8"
                  strokeOpacity={isLight ? "0.3" : "0.18"}
                />
                {/* Outer Pod Halo */}
                <circle
                  cx={0}
                  cy={0}
                  r={pod.isDistrictLead ? 8 : 5}
                  fill={pod.isDistrictLead ? activePalette.highlightHex : activePalette.accentHex}
                  className="war-pod-beacon"
                  opacity={isLight ? 0.5 : 0.35}
                />
                {/* Inner Pod Beacon Core */}
                <circle
                  cx={0}
                  cy={0}
                  r={pod.isDistrictLead ? 3 : 2}
                  fill={pod.isDistrictLead ? "#ffffff" : activePalette.accentHex}
                  className="opacity-90"
                />
              </g>
            ))}

            {/* 7. Central Cornucopia Horn Nexus Core */}
            <circle
              cx={0}
              cy={0}
              r={55}
              fill="url(#cornucopiaNexus)"
              className="war-pulse opacity-75"
            />
            {/* Center crosshair */}
            <line
              x1={-35}
              y1={0}
              x2={35}
              y2={0}
              stroke={activePalette.highlightHex}
              strokeWidth="1.4"
              strokeOpacity="0.65"
            />
            <line
              x1={0}
              y1={-35}
              x2={0}
              y2={35}
              stroke={activePalette.highlightHex}
              strokeWidth="1.4"
              strokeOpacity="0.65"
            />
            {/* Inner diamond reticle */}
            <polygon
              points="0,-16 16,0 0,16 -16,0"
              fill="none"
              stroke={activePalette.accentHex}
              strokeWidth="1.8"
              strokeOpacity="0.75"
            />
          </g>
        </svg>
      </div>
    </div>
  );
}
