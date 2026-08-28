"use client";

import React, { useCallback } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Trees, Users, Sliders, ArrowLeft, Check, AlertCircle } from "lucide-react";
import { useSetup } from "@/lib/setup/setup-context";
import { SetupTab } from "@/types/setup";
import { useThemeEngine } from "@/lib/theme-context";
import { useAuth } from "@/lib/auth/auth-context";
import { AuthStatusBadge } from "@/components/auth/AuthStatusBadge";

export function SetupHeaderNav() {
  const t = useTranslations("setup");
  const { activeTab, setActiveTab, isArenaValid, draftStatus, validateArenaStep } = useSetup();
  const { activePalette } = useThemeEngine();
  const { isPermanent } = useAuth();

  const handleTabClick = useCallback(
    (tabId: SetupTab) => {
      if (tabId === "arena") {
        setActiveTab("arena");
        return;
      }

      // Validating Step 1 before allowing forward progression
      const isValid = validateArenaStep();
      if (!isValid) {
        // Focus the first invalid field
        const firstErrorEl = document.querySelector<HTMLElement>('[aria-invalid="true"]');
        if (firstErrorEl) {
          firstErrorEl.focus();
          firstErrorEl.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        return;
      }

      // If valid, switch tab (for upcoming step implementation)
      setActiveTab(tabId);
    },
    [setActiveTab, validateArenaStep]
  );

  const tabs: { id: SetupTab; label: string; icon: React.ElementType; isReady: boolean }[] = [
    {
      id: "arena",
      label: t("tabs.arena"),
      icon: Trees,
      isReady: isArenaValid,
    },
    {
      id: "tributes",
      label: t("tabs.tributes"),
      icon: Users,
      isReady: false,
    },
    {
      id: "rules",
      label: t("tabs.rules"),
      icon: Sliders,
      isReady: false,
    },
  ];

  return (
    <header className="w-full border-b border-border/70 bg-card/60 backdrop-blur-md sticky top-0 z-30 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Back Link (Permanent Users only) or empty container */}
        <div className="flex items-center gap-2">
          {isPermanent ? (
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors px-2.5 py-1.5 clip-chamfer-xs bg-muted/40 hover:bg-muted/80 border border-border"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Perimeter</span>
            </Link>
          ) : (
            <div className="hidden md:block w-4" />
          )}
        </div>

        {/* Center: Staging Tabs */}
        <nav
          aria-label="Staging Subsystems"
          className="flex items-center gap-1 sm:gap-2 p-1 bg-background/80 border border-border/80 clip-chamfer-sm"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabClick(tab.id)}
                className={`relative inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 clip-chamfer-xs text-xs font-mono font-bold uppercase transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "text-black shadow-[0_0_15px_var(--theme-glow)]"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
                style={
                  isActive
                    ? {
                        background: `linear-gradient(to right, ${activePalette.accentHex}, ${activePalette.highlightHex})`,
                      }
                    : undefined
                }
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? "text-black" : "text-primary"}`} />
                <span>{tab.label}</span>
                {tab.isReady && !isActive && (
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right: Live Capitol Draft Sync Status & Auth Action */}
        <div className="flex items-center gap-2.5">
          {draftStatus === "synced" ? (
            <div className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 clip-chamfer-xs transition-colors">
              <Check className="h-3 w-3 text-emerald-400" />
              <span>{t("status.draftSynced")}</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 clip-chamfer-xs transition-colors">
              <AlertCircle className="h-3 w-3 text-amber-400 animate-pulse" />
              <span>{t("status.validationError")}</span>
            </div>
          )}

          <AuthStatusBadge />
        </div>
      </div>
    </header>
  );
}
