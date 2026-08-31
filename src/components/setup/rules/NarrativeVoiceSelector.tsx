"use client";

import React, { useCallback } from "react";
import { useTranslations } from "next-intl";
import { BookOpen, Radio, Terminal, Check } from "lucide-react";
import { useSetup } from "@/lib/setup/setup-context";
import { NarrativeVoice } from "@/types/setup";

export function NarrativeVoiceSelector() {
  const t = useTranslations("setup.rules");
  const { rulesState, updateRules } = useSetup();

  const handleVoiceSelect = useCallback(
    (narrativeVoice: NarrativeVoice) => {
      updateRules({ narrativeVoice });
    },
    [updateRules]
  );

  const voiceOptions: {
    id: NarrativeVoice;
    title: string;
    desc: string;
    icon: React.ElementType;
    badge?: string;
  }[] = [
    {
      id: "novel_cinematic",
      title: t("narrativeVoice.novel"),
      desc: t("narrativeVoice.novelDesc"),
      icon: BookOpen,
      badge: "DEFAULT",
    },
    {
      id: "capitol_broadcast",
      title: t("narrativeVoice.broadcast"),
      desc: t("narrativeVoice.broadcastDesc"),
      icon: Radio,
    },
    {
      id: "gamemaker_log",
      title: t("narrativeVoice.log"),
      desc: t("narrativeVoice.logDesc"),
      icon: Terminal,
    },
  ];

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-foreground block">
          {t("voiceHeading")}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {t("voiceSubheading")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {voiceOptions.map((opt) => {
          const isSelected = rulesState.narrativeVoice === opt.id;
          const Icon = opt.icon;

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleVoiceSelect(opt.id)}
              className={`p-4 text-left clip-chamfer-sm border transition-all duration-200 cursor-pointer flex flex-col justify-between select-none ${
                isSelected
                  ? "bg-card border-primary/90 shadow-[0_0_15px_var(--theme-glow),0_2px_8px_rgba(0,0,0,0.3)] ring-1 ring-primary/40"
                  : "bg-card/40 border-border/70 hover:border-primary/40 hover:bg-card/70 opacity-80 hover:opacity-100"
              }`}
            >
              <div className="space-y-2.5 w-full">
                <div className="flex items-center justify-between">
                  <div
                    className={`p-2 clip-chamfer-xs transition-colors ${
                      isSelected
                        ? "bg-primary/20 text-primary border border-primary/40"
                        : "bg-muted text-muted-foreground border border-border"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>

                  <div className="flex items-center gap-1.5">
                    {opt.badge && (
                      <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 clip-chamfer-xs bg-muted/80 text-muted-foreground border border-border/80">
                        {opt.badge}
                      </span>
                    )}
                    <div
                      className={`h-4 w-4 rounded-xs border flex items-center justify-center transition-colors ${
                        isSelected
                          ? "bg-primary border-primary text-black"
                          : "border-border bg-background"
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                  </div>
                </div>

                <div>
                  <span className="text-xs sm:text-sm font-serif font-bold text-foreground block">
                    {opt.title}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {opt.desc}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
