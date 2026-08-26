"use client";

import React, { useState } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { User, Shield, Sparkles, LogOut, ChevronDown, Coins, UserPlus } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { useThemeEngine } from "@/lib/theme-context";

interface AuthStatusBadgeProps {
  className?: string;
}

export function AuthStatusBadge({ className = "" }: AuthStatusBadgeProps) {
  const { isAuthenticated, isAnonymous, username, tokensBalance, role, signOut, isLoading } =
    useAuth();
  const { activePalette } = useThemeEngine();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const t = useTranslations("auth.badge");

  if (isLoading) {
    return (
      <div className={`h-7 w-24 bg-muted/30 animate-pulse clip-chamfer-xs ${className}`} />
    );
  }

  // Not logged in or anonymous guest: Show only the direct Save Progress / Sign In CTA
  if (!isAuthenticated || isAnonymous) {
    return (
      <Link
        href="/login"
        style={{
          background: `linear-gradient(to right, ${activePalette.accentHex}, ${activePalette.highlightHex})`,
        }}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 clip-chamfer-xs text-black text-xs font-mono font-bold uppercase tracking-wider shadow-[0_0_12px_var(--theme-glow)] hover:brightness-110 active:translate-y-0.5 transition-all ${className}`}
      >
        <UserPlus className="h-3.5 w-3.5" />
        <span>{t("saveProgress")}</span>
      </Link>
    );
  }

  // Permanent Registered User
  return (
    <div className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setDropdownOpen((prev) => !prev)}
        className="inline-flex items-center gap-2 px-3 py-1.5 clip-chamfer-xs bg-card/90 border border-primary/50 text-foreground text-xs font-mono hover:border-primary transition-all shadow-[0_0_15px_rgba(0,0,0,0.3)] cursor-pointer"
        aria-expanded={dropdownOpen}
        aria-haspopup="menu"
      >
        <div className="flex items-center gap-1.5 text-primary font-bold">
          {role === "admin" ? (
            <Shield className="h-3.5 w-3.5 text-yellow-400" />
          ) : (
            <Sparkles className="h-3.5 w-3.5 text-primary" />
          )}
          <span className="truncate max-w-[120px]">{username}</span>
        </div>

        <div className="hidden sm:flex items-center gap-1 text-[11px] text-muted-foreground pl-1 border-l border-border">
          <Coins className="h-3 w-3 text-amber-400" />
          <span>{tokensBalance}</span>
        </div>

        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground ml-0.5" />
      </button>

      {dropdownOpen && (
        <>
          {/* Backdrop click to close */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setDropdownOpen(false)}
          />
          <div className="absolute right-0 mt-1.5 w-48 clip-chamfer-xs bg-card border border-primary/40 shadow-2xl z-50 py-1 font-mono text-xs text-foreground backdrop-blur-md">
            <div className="px-3 py-2 border-b border-border/60">
              <div className="font-bold text-primary truncate">{username}</div>
              <div className="text-[10px] text-muted-foreground uppercase flex items-center justify-between mt-0.5">
                <span>{role === "admin" ? t("roleAdmin") : t("roleCitizen")}</span>
                <span className="text-amber-400 font-mono">{t("tokens", { count: tokensBalance })}</span>
              </div>
            </div>

            <Link
              href="/profile"
              onClick={() => setDropdownOpen(false)}
              className="w-full text-left px-3 py-2 hover:bg-primary/20 flex items-center gap-2 text-foreground transition-colors"
            >
              <User className="h-3.5 w-3.5 text-primary" />
              <span>{t("dossier")}</span>
            </Link>

            <Link
              href="/archives"
              onClick={() => setDropdownOpen(false)}
              className="w-full text-left px-3 py-2 hover:bg-primary/20 flex items-center gap-2 text-foreground transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>{t("archives")}</span>
            </Link>

            <button
              type="button"
              onClick={async () => {
                setDropdownOpen(false);
                await signOut();
              }}
              className="w-full text-left px-3 py-2 text-red-400 hover:bg-red-500/10 flex items-center gap-2 border-t border-border/60 transition-colors cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>{t("logout")}</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
