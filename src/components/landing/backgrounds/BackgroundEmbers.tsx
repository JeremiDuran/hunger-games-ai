"use client";

import React, { useEffect, useRef } from "react";
import { useThemeEngine } from "@/lib/theme-context";

interface Particle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  opacity: number;
  maxOpacity: number;
  fadeSpeed: number;
  pulsePhase: number;
  color: string;
}

export function BackgroundEmbers() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { activePalette } = useThemeEngine();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    // Color palette resolution
    const colors = [
      activePalette.accentHex,
      activePalette.highlightHex,
      activePalette.vars.primary,
      "#ffffff",
    ];

    const particleCount = Math.min(Math.floor(width / 22), 80);
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2.5 + 0.8,
        speedY: -(Math.random() * 0.7 + 0.3),
        speedX: (Math.random() - 0.5) * 0.4,
        opacity: Math.random() * 0.8 + 0.2,
        maxOpacity: Math.random() * 0.7 + 0.3,
        fadeSpeed: Math.random() * 0.01 + 0.005,
        pulsePhase: Math.random() * Math.PI * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Soft ambient radiant glow in center-top
      const gradient = ctx.createRadialGradient(
        width / 2,
        height * 0.28,
        10,
        width / 2,
        height * 0.28,
        Math.max(width, height) * 0.65
      );
      gradient.addColorStop(0, `${activePalette.accentHex}18`);
      gradient.addColorStop(0.5, `${activePalette.highlightHex}08`);
      gradient.addColorStop(1, "transparent");

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Render & update embers
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.y += p.speedY;
        p.x += p.speedX + Math.sin(p.pulsePhase) * 0.25;
        p.pulsePhase += 0.02;

        // Wrap around bottom if floated above top
        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        const currentAlpha = Math.abs(Math.sin(p.pulsePhase)) * p.maxOpacity;

        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = currentAlpha;
        ctx.shadowBlur = p.size * 5;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [activePalette]);

  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-full block opacity-75 transition-opacity duration-700"
      />
      {/* Subtle vignette border overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.7)_100%)] pointer-events-none" />
    </div>
  );
}
