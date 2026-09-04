"use client";

import React from "react";
import { Link } from "@/i18n/navigation";
import {
  Shield,
  Radio,
  Play,
  RotateCcw,
  PlusCircle,
  ArrowLeft,
  Flame,
  Award,
} from "lucide-react";
import { useTranslations } from "next-intl";

interface GameHubHeaderProps {
  simulationTitle: string;
  arenaName: string;
  status: "setup" | "in_progress" | "finished" | "archived";
  liveRoute: string;
  isFinished: boolean;
  setupRoute: string;
  lobbyRoute: string;
}

export function GameHubHeader({
  simulationTitle,
  arenaName,
  status,
  liveRoute,
  isFinished,
  setupRoute,
  lobbyRoute,
}: GameHubHeaderProps) {
  const t = useTranslations("gamehub.header");

  const getStatusBadge = () => {
    switch (status) {
      case "in_progress":
        return {
          label: t("status.in_progress"),
          icon: <Radio className="h-3 w-3 animate-pulse text-emerald-400" />,
          className:
            "bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.2)]",
        };
      case "finished":
        return {
          label: t("status.finished"),
          icon: <Award className="h-3 w-3 text-amber-400" />,
          className:
            "bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.25)]",
        };
      case "archived":
        return {
          label: t("status.archived"),
          icon: <Shield className="h-3 w-3 text-muted-foreground" />,
          className: "bg-muted border-border text-muted-foreground",
        };
      default:
        return {
          label: t("status.setup"),
          icon: <Flame className="h-3 w-3 text-primary" />,
          className: "bg-primary/10 border-primary/30 text-primary",
        };
    }
  };

  const badge = getStatusBadge();

  return (
    <header className="w-full bg-card/85 backdrop-blur-md border-b border-border/80 px-4 sm:px-6 py-4 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Return link + Match title + Arena Lore */}
        <div className="flex items-center gap-3">
          <Link
            href={lobbyRoute}
            title={t("cta.lobby")}
            className="h-9 w-9 rounded-full bg-muted/70 hover:bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-base sm:text-lg md:text-xl font-serif font-black tracking-wider uppercase text-foreground leading-tight">
                {simulationTitle || "The 74th Annual Hunger Games"}
              </h1>

              {/* Status Badge */}
              <div
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 clip-chamfer-xs border text-[10px] font-mono font-bold uppercase tracking-wider ${badge.className}`}
              >
                {badge.icon}
                <span>{badge.label}</span>
              </div>
            </div>

            <p className="text-xs font-mono text-primary font-medium tracking-wide mt-0.5">
              {arenaName || "Verdant Woodlands & Golden Cornucopia"}
            </p>
          </div>
        </div>

        {/* Right: Smart Route Action CTAs */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {/* Live Arena / Replay CTA */}
          <Link
            href={liveRoute}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 clip-chamfer-xs bg-primary text-primary-foreground hover:bg-primary/90 font-mono font-bold text-xs uppercase tracking-wider shadow-sm transition-transform active:scale-[0.98]"
          >
            {isFinished ? (
              <>
                <RotateCcw className="h-3.5 w-3.5" />
                <span>{t("cta.replay")}</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>{t("cta.watchLive")}</span>
              </>
            )}
          </Link>

          {/* Setup New Game CTA */}
          <Link
            href={setupRoute}
            className="inline-flex items-center gap-1.5 px-3 py-2 clip-chamfer-xs bg-muted/80 hover:bg-muted border border-border text-foreground hover:text-primary font-mono font-bold text-xs uppercase tracking-wider transition-colors"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>{t("cta.setupNew")}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
