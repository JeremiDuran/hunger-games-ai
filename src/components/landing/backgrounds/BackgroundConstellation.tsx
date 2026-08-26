"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useThemeEngine } from "@/lib/theme-context";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP);
}

// 12 Panem District Nodes distributed across full widescreen 1600x900 viewport
const DISTRICT_NODES = [
  { id: "D1", x: 440, y: 180, label: "01 Luxury" },
  { id: "D2", x: 760, y: 120, label: "02 Masonry" },
  { id: "D3", x: 1120, y: 190, label: "03 Technology" },
  { id: "D4", x: 1420, y: 360, label: "04 Fishing" },
  { id: "D5", x: 1280, y: 640, label: "05 Power" },
  { id: "D6", x: 1040, y: 780, label: "06 Transport" },
  { id: "D7", x: 680, y: 820, label: "07 Lumber" },
  { id: "D8", x: 340, y: 720, label: "08 Textiles" },
  { id: "D9", x: 180, y: 480, label: "09 Grain" },
  { id: "D10", x: 480, y: 420, label: "10 Livestock" },
  { id: "D11", x: 920, y: 460, label: "11 Agriculture" },
  { id: "D12", x: 720, y: 600, label: "12 Mining" },
  { id: "CAP", x: 800, y: 340, label: "THE CAPITOL" },
];

// Constellation connecting line definitions between nodes
const CONSTELLATION_EDGES = [
  ["CAP", "D1"],
  ["CAP", "D2"],
  ["CAP", "D3"],
  ["CAP", "D11"],
  ["CAP", "D10"],
  ["D1", "D2"],
  ["D2", "D3"],
  ["D3", "D4"],
  ["D4", "D5"],
  ["D5", "D6"],
  ["D6", "D7"],
  ["D7", "D8"],
  ["D8", "D9"],
  ["D9", "D10"],
  ["D10", "D1"],
  ["D11", "D12"],
  ["D12", "D6"],
  ["D12", "D7"],
  ["D11", "D5"],
];

export function BackgroundConstellation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { activePalette } = useThemeEngine();

  useGSAP(
    () => {
      // 1. Constellation star node pulsing
      gsap.to(".constellation-node", {
        scale: 1.2,
        opacity: 0.6,
        duration: 2.8,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        stagger: {
          each: 0.2,
          from: "random",
        },
        transformOrigin: "50% 50%",
      });

      // 2. Constellation connecting energy lines pulse
      gsap.to(".constellation-edge", {
        strokeOpacity: 0.38,
        duration: 3.2,
        ease: "power1.inOut",
        yoyo: true,
        repeat: -1,
        stagger: 0.15,
      });

      // 3. Floating ambient motes
      gsap.to(".orbital-mote", {
        y: "-=30",
        x: "+=15",
        duration: 4.5,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        stagger: 0.25,
      });
    },
    { scope: containerRef, dependencies: [activePalette.id] }
  );

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none w-full h-full"
    >
      {/* Deep atmospheric backdrop glow spanning full width */}
      <div
        className="absolute inset-0 opacity-30 transition-all duration-700"
        style={{
          background: `radial-gradient(circle at 50% 40%, ${activePalette.accentHex}30 0%, ${activePalette.highlightHex}15 50%, transparent 80%)`,
        }}
      />

      {/* Full Viewport Panem Constellation Graphic with central readability mask */}
      <div
        className="absolute inset-0 w-full h-full opacity-70 transition-opacity duration-500"
        style={{
          maskImage:
            "radial-gradient(ellipse 70% 50% at 50% 38%, transparent 15%, black 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 50% at 50% 38%, transparent 15%, black 75%)",
        }}
      >
        <svg
          viewBox="0 0 1600 900"
          preserveAspectRatio="xMidYMid slice"
          className="w-full h-full"
        >
          {/* Constellation Connecting Lines */}
          {CONSTELLATION_EDGES.map(([fromId, toId], idx) => {
            const fromNode = DISTRICT_NODES.find((n) => n.id === fromId);
            const toNode = DISTRICT_NODES.find((n) => n.id === toId);
            if (!fromNode || !toNode) return null;

            return (
              <line
                key={`edge-${idx}`}
                x1={fromNode.x}
                y1={fromNode.y}
                x2={toNode.x}
                y2={toNode.y}
                stroke={activePalette.accentHex}
                strokeWidth={fromId === "CAP" ? "1.8" : "1"}
                strokeOpacity="0.22"
                strokeDasharray={fromId === "CAP" ? "none" : "4 4"}
                className="constellation-edge"
              />
            );
          })}

          {/* Orbiting particles distributed around the full viewport */}
          {[
            { cx: 200, cy: 220, r: 2.5 },
            { cx: 380, cy: 350, r: 2 },
            { cx: 600, cy: 250, r: 2.5 },
            { cx: 880, cy: 180, r: 2 },
            { cx: 1250, cy: 220, r: 2.5 },
            { cx: 1480, cy: 520, r: 2.5 },
            { cx: 1350, cy: 750, r: 2 },
            { cx: 850, cy: 750, r: 2.5 },
            { cx: 520, cy: 620, r: 2 },
            { cx: 250, cy: 680, r: 2.5 },
            { cx: 1150, cy: 450, r: 2 },
            { cx: 650, cy: 450, r: 2 },
          ].map((mote, i) => (
            <circle
              key={`mote-${i}`}
              cx={mote.cx}
              cy={mote.cy}
              r={mote.r}
              fill={activePalette.highlightHex}
              className="orbital-mote opacity-45"
            />
          ))}

          {/* Star Nodes */}
          {DISTRICT_NODES.map((node) => {
            const isCapitol = node.id === "CAP";
            return (
              <g key={node.id}>
                {/* Outer Glow Halo */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={isCapitol ? 15 : 9}
                  fill={isCapitol ? activePalette.highlightHex : activePalette.accentHex}
                  className="constellation-node opacity-40"
                />
                {/* Core Star Point */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={isCapitol ? 5 : 3.5}
                  fill={isCapitol ? "#ffffff" : activePalette.accentHex}
                />
                {/* Label text */}
                <text
                  x={node.x}
                  y={node.y + (isCapitol ? -18 : 18)}
                  textAnchor="middle"
                  fill={activePalette.accentHex}
                  fontSize={isCapitol ? "11" : "9.5"}
                  fontWeight={isCapitol ? "bold" : "600"}
                  fontFamily="monospace"
                  letterSpacing="1.5px"
                  className="opacity-60"
                >
                  {node.id}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
