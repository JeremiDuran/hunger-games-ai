"use client";

import React, { useState } from "react";
import { ShieldAlert, ArrowRight, BookOpen } from "lucide-react";
import { useTranslations } from "next-intl";
import { useThemeEngine } from "@/lib/theme-context";

export function DisclaimerCard() {
  const { activePalette } = useThemeEngine();
  const [acknowledged, setAcknowledged] = useState(false);
  const [isEntering, setIsEntering] = useState(false);
  const t = useTranslations("disclaimer");

  const handleEnter = () => {
    if (!acknowledged) return;
    setIsEntering(true);
    setTimeout(() => {
      alert(t("welcomeAlert"));
      setIsEntering(false);
    }, 500);
  };

  return (
    <article className="relative w-full max-w-2xl mx-auto my-6 clip-chamfer-md border-2 border-primary/70 bg-card text-card-foreground shadow-[0_0_35px_var(--theme-glow),0_25px_60px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-300">
      {/* Top Accent Strip */}
      <div
        className="w-full h-1.5 transition-all duration-500"
        style={{
          background: `linear-gradient(to right, ${activePalette.accentHex}, ${activePalette.highlightHex})`,
        }}
      />

      {/* Card Content */}
      <div className="p-6 sm:p-10 relative z-20 flex flex-col gap-6">
        {/* Header Badge & Title */}
        <header className="flex flex-col items-center text-center gap-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 clip-chamfer-xs bg-primary/15 text-primary border border-primary/50 text-xs font-mono font-bold tracking-widest uppercase shadow-[0_0_12px_var(--theme-glow)]">
            <ShieldAlert className="h-3.5 w-3.5 text-primary" />
            <span>{t("badge")}</span>
          </div>

          <h1
            className="text-2xl sm:text-3xl md:text-4xl font-serif font-extrabold tracking-widest text-transparent bg-clip-text text-shadow-gold transition-all duration-300"
            style={{
              backgroundImage: `linear-gradient(to right, ${activePalette.accentHex}, ${activePalette.highlightHex})`,
            }}
          >
            {t("title")}
          </h1>
        </header>

        {/* Single Unified Disclaimer Component */}
        <div className="clip-chamfer-sm border border-primary/35 bg-muted/40 p-5 sm:p-6 shadow-[3px_3px_0px_rgba(0,0,0,0.2)] text-xs sm:text-sm leading-relaxed text-muted-foreground space-y-4">
          <div className="flex items-start gap-3">
            <BookOpen className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-3">
              <p>
                <strong className="text-foreground font-semibold">
                  {t("fanProjectTitle")}
                </strong>{" "}
                {t("fanProjectText")}
              </p>
              <p>
                <strong className="text-foreground font-semibold">
                  {t("ipTitle")}
                </strong>{" "}
                {t("ipText")}
              </p>
            </div>
          </div>
        </div>

        {/* Interactive Acknowledgement Checkbox */}
        <label
          htmlFor="acknowledge-disclaimer"
          className="flex items-center gap-3 p-3.5 clip-chamfer-sm border border-primary/40 bg-muted/50 hover:bg-muted/80 transition-all select-none cursor-pointer shadow-inner"
        >
          <input
            id="acknowledge-disclaimer"
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
            className="h-4 w-4 rounded border-border text-primary focus:ring-primary accent-primary cursor-pointer"
          />
          <span className="text-xs sm:text-sm font-medium text-foreground">
            {t("checkbox")}
          </span>
        </label>

        {/* Enter Action Button */}
        <div className="pt-2">
          <button
            type="button"
            disabled={!acknowledged || isEntering}
            onClick={handleEnter}
            style={{
              background: `linear-gradient(to right, ${activePalette.accentHex}, ${activePalette.highlightHex})`,
            }}
            className={`w-full flex items-center justify-center gap-2 py-3.5 px-6 clip-chamfer-sm text-black font-mono font-bold text-sm tracking-wider uppercase border border-yellow-300 shadow-[0_0_25px_var(--theme-glow),0_4px_0_rgba(0,0,0,0.3)] active:translate-y-0.5 active:shadow-none transition-all duration-200 ${
              !acknowledged
                ? "opacity-50 cursor-not-allowed"
                : "cursor-pointer hover:brightness-110 hover:shadow-[0_0_35px_var(--theme-glow)]"
            }`}
          >
            <span>{isEntering ? t("ctaLoading") : t("cta")}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}
