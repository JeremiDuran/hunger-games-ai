"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useThemeEngine } from "@/lib/theme-context";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP);
}

// 12 Panem District Nodes distributed in an aesthetic constellation
const DISTRICT_NODES = [
  { id: "D1", x: 220, y: 140, label: "01 Luxury" },
  { id: "D2", x: 380, y: 110, label: "02 Masonry" },
  { id: "D3", x: 550, y: 160, label: "03 Technology" },
  { id: "D4", x: 670, y: 250, label: "04 Fishing" },
  { id: "D5", x: 610, y: 390, label: "05 Power" },
  { id: "D6", x: 490, y: 480, label: "06 Transport" },
  { id: "D7", x: 340, y: 520, label: "07 Lumber" },
  { id: "D8", x: 200, y: 440, label: "08 Textiles" },
  { id: "D9", x: 140, y: 310, label: "09 Grain" },
  { id: "D10", x: 270, y: 260, label: "10 Livestock" },
  { id: "D11", x: 430, y: 290, label: "11 Agriculture" },
  { id: "D12", x: 360, y: 380, label: "12 Mining" },
  { id: "CAP", x: 400, y: 220, label: "THE CAPITOL" },
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
        scale: 1.3,
        opacity: 0.9,
        duration: 2.5,
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
        strokeOpacity: 0.45,
        duration: 3,
        ease: "power1.inOut",
        yoyo: true,
        repeat: -1,
        stagger: 0.15,
      });

      // 3. Floating ambient motes
      gsap.to(".orbital-mote", {
        y: "-=30",
        x: "+=15",
        duration: 4,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        stagger: 0.3,
      });
    },
    { scope: containerRef, dependencies: [activePalette.id] }
  );

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none"
    >
      {/* Deep atmospheric backdrop glow */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background: `radial-gradient(circle at 50% 40%, ${activePalette.accentHex}30 0%, ${activePalette.highlightHex}10 40%, transparent 80%)`,
        }}
      />

      {/* Center Panem Constellation Graphic */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[650px] sm:w-[950px] sm:h-[750px] opacity-35">
        <svg viewBox="0 0 800 650" className="w-full h-full">
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
                strokeWidth={fromId === "CAP" ? "1.5" : "0.75"}
                strokeOpacity="0.15"
                strokeDasharray={fromId === "CAP" ? "none" : "3 3"}
                className="constellation-edge"
              />
            );
          })}

          {/* Orbiting particles around the constellation */}
          {[
            { cx: 310, cy: 190, r: 2 },
            { cx: 480, cy: 210, r: 1.5 },
            { cx: 520, cy: 330, r: 2.2 },
            { cx: 230, cy: 370, r: 1.8 },
            { cx: 410, cy: 450, r: 2.5 },
            { cx: 590, cy: 180, r: 1.5 },
          ].map((mote, i) => (
            <circle
              key={`mote-${i}`}
              cx={mote.cx}
              cy={mote.cy}
              r={mote.r}
              fill={activePalette.highlightHex}
              className="orbital-mote opacity-60"
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
                  r={isCapitol ? 12 : 7}
                  fill={isCapitol ? activePalette.highlightHex : activePalette.accentHex}
                  className="constellation-node opacity-30"
                />
                {/* Core Star Point */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={isCapitol ? 4.5 : 2.5}
                  fill={isCapitol ? "#ffffff" : activePalette.accentHex}
                />
                {/* Label text */}
                <text
                  x={node.x}
                  y={node.y + (isCapitol ? -14 : 14)}
                  textAnchor="middle"
                  fill={activePalette.vars.mutedForeground}
                  fontSize={isCapitol ? "9" : "7.5"}
                  fontFamily="monospace"
                  letterSpacing="1px"
                  className="opacity-70"
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
