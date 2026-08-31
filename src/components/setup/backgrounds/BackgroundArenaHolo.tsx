"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useThemeEngine } from "@/lib/theme-context";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP);
}

// 24 Azimuth tick marks with deterministic rounded coordinates to prevent float hydration jitter
const AZIMUTH_TICKS = Array.from({ length: 24 }).map((_, i) => {
  const angle = (i * 15 * Math.PI) / 180;
  const r1 = i % 2 === 0 ? 465 : 470;
  const r2 = 478;
  return {
    id: i,
    x1: Number((Math.cos(angle) * r1).toFixed(2)),
    y1: Number((Math.sin(angle) * r1).toFixed(2)),
    x2: Number((Math.cos(angle) * r2).toFixed(2)),
    y2: Number((Math.sin(angle) * r2).toFixed(2)),
    isMajor: i % 2 === 0,
  };
});

// 12 Sector Radial Rays
const SECTOR_RAYS = Array.from({ length: 12 }).map((_, i) => {
  const angle = (i * 30 * Math.PI) / 180;
  return {
    id: i,
    x1: Number((Math.cos(angle) * 110).toFixed(2)),
    y1: Number((Math.sin(angle) * 110).toFixed(2)),
    x2: Number((Math.cos(angle) * 400).toFixed(2)),
    y2: Number((Math.sin(angle) * 400).toFixed(2)),
  };
});

// 12 Sector Environmental Beacons
const SECTOR_BEACONS = Array.from({ length: 12 }).map((_, i) => {
  const deg = i * 30;
  const rad = (deg * Math.PI) / 180;
  const r = 420;
  return {
    id: i,
    x: Number((Math.cos(rad) * r).toFixed(2)),
    y: Number((Math.sin(rad) * r).toFixed(2)),
    isCardinal: deg % 90 === 0,
  };
});

export function BackgroundArenaHolo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { activePalette, resolvedMode } = useThemeEngine();
  const isLight = resolvedMode === "light";

  useGSAP(
    () => {
      const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (prefersReducedMotion) {
        gsap.set(".holo-rotate, .holo-counter-rotate, .holo-pulse, .holo-beacon, .holo-wave", {
          opacity: isLight ? 0.6 : 0.35,
          scale: 1,
        });
        return;
      }

      // 1. Slow, majestic rotation of the outer holographic azimuth compass
      gsap.to(".holo-rotate", {
        rotation: 360,
        transformOrigin: "50% 50%",
        duration: 90,
        ease: "none",
        repeat: -1,
      });

      // 2. Counter-rotation of the inner sector ring
      gsap.to(".holo-counter-rotate", {
        rotation: -360,
        transformOrigin: "50% 50%",
        duration: 120,
        ease: "none",
        repeat: -1,
      });

      // 3. Topographical contour elevation breathing
      gsap.to(".holo-pulse", {
        scale: 1.03,
        opacity: isLight ? 0.8 : 0.6,
        duration: 4.5,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        stagger: {
          each: 0.6,
          from: "center",
        },
        transformOrigin: "50% 50%",
      });

      // 4. Sector environmental beacons pulsing
      gsap.to(".holo-beacon", {
        scale: 1.35,
        opacity: isLight ? 0.9 : 0.75,
        duration: 2.4,
        ease: "power2.inOut",
        yoyo: true,
        repeat: -1,
        stagger: {
          each: 0.3,
          from: "random",
        },
        transformOrigin: "50% 50%",
      });

      // 5. Cornucopia outward forcefield wave animation
      gsap.fromTo(
        ".holo-wave",
        {
          scale: 0.15,
          opacity: isLight ? 0.85 : 0.7,
          strokeWidth: isLight ? 2.5 : 2,
        },
        {
          scale: 1.15,
          opacity: 0,
          strokeWidth: 0.5,
          duration: 6,
          ease: "power1.out",
          repeat: -1,
          stagger: 2,
          transformOrigin: "50% 50%",
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
            ? `radial-gradient(ellipse 85% 65% at 50% 45%, ${activePalette.accentHex}35 0%, ${activePalette.highlightHex}18 50%, transparent 88%)`
            : `radial-gradient(ellipse 80% 60% at 50% 45%, ${activePalette.accentHex}30 0%, ${activePalette.highlightHex}12 50%, transparent 85%)`,
        }}
      />

      {/* Subtle topographic hexagonal ambient grid */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 ${
          isLight ? "opacity-[0.09]" : "opacity-[0.035]"
        }`}
        style={{
          backgroundImage: `radial-gradient(${activePalette.accentHex} 1.5px, transparent 1.5px)`,
          backgroundSize: "32px 32px",
        }}
      />

      {/* Center Readability Mask: Keeps the center transparent so form controls remain ultra-crisp */}
      <div
        className={`absolute inset-0 w-full h-full transition-opacity duration-500 ${
          isLight ? "opacity-90" : "opacity-65"
        }`}
        style={{
          maskImage:
            "radial-gradient(ellipse 70% 55% at 50% 45%, transparent 25%, black 85%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 55% at 50% 45%, transparent 25%, black 85%)",
        }}
      >
        <svg
          viewBox="0 0 1600 1000"
          preserveAspectRatio="xMidYMid slice"
          className="w-full h-full"
        >
          <defs>
            <linearGradient id="holoLineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={activePalette.accentHex} stopOpacity="0.8" />
              <stop offset="50%" stopColor={activePalette.highlightHex} stopOpacity="0.4" />
              <stop offset="100%" stopColor={activePalette.accentHex} stopOpacity="0.1" />
            </linearGradient>

            <radialGradient id="cornucopiaGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={activePalette.highlightHex} stopOpacity="0.8" />
              <stop offset="40%" stopColor={activePalette.accentHex} stopOpacity="0.3" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Arena Center Origin: cx=800, cy=500 */}
          <g transform="translate(800, 500)">
            {/* 1. Outward Radiating Forcefield Pulse Waves */}
            <circle
              cx={0}
              cy={0}
              r={440}
              fill="none"
              stroke={activePalette.accentHex}
              className="holo-wave"
            />
            <circle
              cx={0}
              cy={0}
              r={440}
              fill="none"
              stroke={activePalette.highlightHex}
              className="holo-wave"
            />
            <circle
              cx={0}
              cy={0}
              r={440}
              fill="none"
              stroke={activePalette.accentHex}
              className="holo-wave"
            />

            {/* 2. Concentric Topographical Elevation Contours (Breathing) */}
            {/* Outer Perimeter Barrier */}
            <circle
              cx={0}
              cy={0}
              r={440}
              fill="none"
              stroke={activePalette.accentHex}
              strokeWidth="1.5"
              strokeDasharray="8 6 2 6"
              strokeOpacity="0.35"
              className="holo-pulse"
            />

            {/* Sub-Perimeter Sector Line */}
            <circle
              cx={0}
              cy={0}
              r={360}
              fill="none"
              stroke={activePalette.accentHex}
              strokeWidth="1"
              strokeDasharray="4 8"
              strokeOpacity="0.25"
              className="holo-pulse"
            />

            {/* Mid-Tier Biome Ridge Line (Wavy organic contour) */}
            <path
              d="M 0,-280 C 70,-275 140,-295 198,-198 C 295,-140 275,-70 280,0 C 275,70 295,140 198,198 C 140,295 70,275 0,280 C -70,275 -140,295 -198,198 C -295,140 -275,70 -280,0 C -275,-70 -295,-140 -198,-198 C -140,-295 -70,-275 0,-280 Z"
              fill="none"
              stroke={activePalette.highlightHex}
              strokeWidth="1.2"
              strokeOpacity="0.3"
              className="holo-pulse"
            />

            {/* Inner Wilderness Basin Contour */}
            <path
              d="M 0,-190 C 50,-180 100,-200 134,-134 C 200,-100 180,-50 190,0 C 180,50 200,100 134,134 C 100,200 50,180 0,190 C -50,180 -100,200 -134,134 C -200,100 -180,50 -190,0 C -180,-50 -200,-100 -134,-134 C -100,-200 -50,-180 0,-190 Z"
              fill="none"
              stroke={activePalette.accentHex}
              strokeWidth="1"
              strokeDasharray="6 4"
              strokeOpacity="0.3"
              className="holo-pulse"
            />

            {/* Cornucopia Plateau Ring */}
            <circle
              cx={0}
              cy={0}
              r={110}
              fill="none"
              stroke={activePalette.accentHex}
              strokeWidth="1.2"
              strokeOpacity="0.4"
              className="holo-pulse"
            />

            {/* 3. Rotating Outer Azimuth Sector Compass */}
            <g className="holo-rotate">
              {/* Outer compass ring */}
              <circle
                cx={0}
                cy={0}
                r={465}
                fill="none"
                stroke={activePalette.accentHex}
                strokeWidth="1.5"
                strokeOpacity="0.28"
              />

              {/* Azimuth tick marks */}
              {AZIMUTH_TICKS.map((tick) => (
                <line
                  key={`tick-${tick.id}`}
                  x1={tick.x1}
                  y1={tick.y1}
                  x2={tick.x2}
                  y2={tick.y2}
                  stroke={activePalette.accentHex}
                  strokeWidth={tick.isMajor ? "1.5" : "0.8"}
                  strokeOpacity={tick.isMajor ? "0.4" : "0.2"}
                />
              ))}
            </g>

            {/* 4. Counter-Rotating Inner Sector Ring */}
            <g className="holo-counter-rotate">
              <circle
                cx={0}
                cy={0}
                r={400}
                fill="none"
                stroke={activePalette.highlightHex}
                strokeWidth="1"
                strokeDasharray="12 18"
                strokeOpacity="0.3"
              />

              {/* 12 Sector Radial Rays */}
              {SECTOR_RAYS.map((ray) => (
                <line
                  key={`ray-${ray.id}`}
                  x1={ray.x1}
                  y1={ray.y1}
                  x2={ray.x2}
                  y2={ray.y2}
                  stroke={activePalette.accentHex}
                  strokeWidth="0.8"
                  strokeDasharray="4 6"
                  strokeOpacity="0.18"
                />
              ))}
            </g>

            {/* 5. Sector Environmental Beacons (Deterministic coordinates) */}
            {SECTOR_BEACONS.map((beacon) => (
              <g key={`beacon-${beacon.id}`} transform={`translate(${beacon.x}, ${beacon.y})`}>
                {/* Outer pulse aura */}
                <circle
                  cx={0}
                  cy={0}
                  r={beacon.isCardinal ? 9 : 6}
                  fill={beacon.isCardinal ? activePalette.highlightHex : activePalette.accentHex}
                  className="holo-beacon opacity-35"
                />
                {/* Inner solid beacon */}
                <circle
                  cx={0}
                  cy={0}
                  r={beacon.isCardinal ? 3 : 2}
                  fill={beacon.isCardinal ? "#ffffff" : activePalette.accentHex}
                  className="opacity-80"
                />
              </g>
            ))}

            {/* 6. Central Cornucopia Nexus Core */}
            <circle
              cx={0}
              cy={0}
              r={45}
              fill="url(#cornucopiaGrad)"
              className="opacity-70"
            />
            {/* Center crosshair */}
            <line
              x1={-25}
              y1={0}
              x2={25}
              y2={0}
              stroke={activePalette.highlightHex}
              strokeWidth="1.2"
              strokeOpacity="0.5"
            />
            <line
              x1={0}
              y1={-25}
              x2={0}
              y2={25}
              stroke={activePalette.highlightHex}
              strokeWidth="1.2"
              strokeOpacity="0.5"
            />
            <polygon
              points="0,-12 12,0 0,12 -12,0"
              fill="none"
              stroke={activePalette.accentHex}
              strokeWidth="1.5"
              strokeOpacity="0.6"
            />
          </g>
        </svg>
      </div>
    </div>
  );
}
