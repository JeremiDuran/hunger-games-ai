"use client";

import React, { useState, useCallback } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import {
  Shield,
  Sparkles,
  Swords,
  Coins,
  Mail,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  LogOut,
  ArrowRight,
  FolderArchive,
  Terminal,
  User,
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { useThemeEngine } from "@/lib/theme-context";
import { useA11y } from "@/lib/a11y/a11y-context";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { ThemeSidePanel } from "@/components/disclaimer/ThemeSidePanel";
import { BackgroundConstellation } from "@/components/landing/backgrounds/BackgroundConstellation";
import { AuthStatusBadge } from "@/components/auth/AuthStatusBadge";
import { SkipLink } from "@/components/a11y/SkipLink";
import { KeyboardShortcutsModal } from "@/components/a11y/KeyboardShortcutsModal";

export default function LobbyPage() {
  const router = useRouter();
  const t = useTranslations("lobby");
  const tAuth = useTranslations("auth");

  const {
    user,
    username,
    role,
    tokensBalance,
    isAuthenticated,
    isPermanent,
    isAnonymous,
    isLoading,
    resendVerificationEmail,
    signOut,
  } = useAuth();
  const { activePalette } = useThemeEngine();
  const { announceAssertive, announcePolite } = useA11y();

  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<"idle" | "success" | "error">("idle");
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const isEmailVerified = Boolean(user?.email_confirmed_at);

  const handleResend = useCallback(async () => {
    if (!user?.email || isResending) return;
    setIsResending(true);
    setResendStatus("idle");
    setResendMessage(null);

    const result = await resendVerificationEmail(user.email);
    setIsResending(false);

    if (result.success) {
      setResendStatus("success");
      const msg = t("resendSuccess");
      setResendMessage(msg);
      announcePolite(msg);
    } else {
      setResendStatus("error");
      const msg = result.error || t("resendError");
      setResendMessage(msg);
      announceAssertive(msg);
    }
  }, [user?.email, isResending, resendVerificationEmail, t, announcePolite, announceAssertive]);

  useKeyboardShortcuts({
    BACK_HOME: () => router.push("/"),
  });

  return (
    <div className="min-h-screen relative flex flex-col justify-between overflow-x-clip bg-background text-foreground transition-colors duration-500 selection:bg-primary selection:text-primary-foreground">
      <SkipLink targetId="main-lobby-content" />
      <BackgroundConstellation />
      <ThemeSidePanel />
      <KeyboardShortcutsModal />

      {/* Header Bar */}
      <header className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between z-20">
        <Link
          href="/"
          className="inline-flex items-center gap-2 group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/40 flex items-center justify-center text-primary shadow-[0_0_10px_var(--theme-glow)] group-hover:scale-105 transition-transform">
            <Shield className="h-4 w-4" />
          </div>
          <span className="font-serif font-bold text-sm sm:text-base tracking-wider text-foreground uppercase">
            Hunger Games AI
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <AuthStatusBadge />
        </div>
      </header>

      {/* Main Command Hub */}
      <main
        id="main-lobby-content"
        tabIndex={-1}
        className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 z-20 outline-none"
      >
        {/* Hero Section */}
        <div className="relative p-6 sm:p-8 clip-chamfer-md border-2 border-primary/50 bg-card/90 backdrop-blur-md shadow-[0_0_35px_var(--theme-glow),0_20px_50px_rgba(0,0,0,0.6)] mb-8">
          <div
            className="absolute top-0 inset-x-0 h-1.5 rounded-t transition-all duration-500"
            style={{
              background: `linear-gradient(to right, ${activePalette.accentHex}, ${activePalette.highlightHex})`,
            }}
          />

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 mb-2 clip-chamfer-xs bg-primary/10 border border-primary/40 text-primary text-xs font-mono font-bold">
                <Terminal className="h-3.5 w-3.5" />
                <span>{t("title")}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-wider text-foreground uppercase">
                {t("welcome", { username: isLoading ? "..." : username })}
              </h1>
              <p className="text-xs sm:text-sm font-mono text-muted-foreground mt-1">
                {t("subtitle")}
              </p>
            </div>

            {/* Clearance & Token Status Pill */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="px-3 py-1.5 clip-chamfer-xs bg-muted/60 border border-border text-xs font-mono flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-primary" />
                <span className="font-bold text-foreground">
                  {role === "admin" ? t("roleAdmin") : t("roleCitizen")}
                </span>
              </div>

              <div className="px-3 py-1.5 clip-chamfer-xs bg-amber-500/10 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold flex items-center gap-1.5 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
                <Coins className="h-3.5 w-3.5 text-amber-400" />
                <span>{t("tokensAvailable", { count: tokensBalance })}</span>
              </div>
            </div>
          </div>

          {/* Email Verification Banner (Pending) */}
          {isAuthenticated && isPermanent && !isEmailVerified && user?.email && (
            <div
              role="alert"
              className="mt-6 p-4 clip-chamfer-xs bg-amber-950/40 border-2 border-amber-500/60 text-amber-200 text-xs font-mono flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-[0_0_20px_rgba(245,158,11,0.25)]"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-sm font-bold text-amber-300 uppercase tracking-wider">
                    {t("verificationPendingTitle")}
                  </strong>
                  <p className="text-xs text-amber-200/90 mt-0.5">
                    {t("verificationPendingDesc", { email: user.email })}
                  </p>
                  {resendMessage && (
                    <div
                      className={`mt-2 font-bold ${
                        resendStatus === "success"
                          ? "text-emerald-300"
                          : "text-red-300"
                      }`}
                    >
                      {resendMessage}
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={handleResend}
                disabled={isResending}
                className="shrink-0 px-3.5 py-2 clip-chamfer-xs bg-amber-500/20 hover:bg-amber-500/30 active:bg-amber-500/40 border border-amber-400 text-amber-200 font-mono font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                {isResending ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>{t("resending")}</span>
                  </>
                ) : (
                  <>
                    <Mail className="h-3.5 w-3.5" />
                    <span>{t("resendVerification")}</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Email Verification Banner (Confirmed) */}
          {isAuthenticated && isPermanent && isEmailVerified && (
            <div className="mt-6 p-3 clip-chamfer-xs bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>{t("verifiedBadge")}</span>
            </div>
          )}

          {/* Guest Account Info */}
          {isAuthenticated && isAnonymous && (
            <div className="mt-6 p-3.5 clip-chamfer-xs bg-primary/10 border border-primary/40 text-primary text-xs font-mono flex items-start gap-2.5">
              <Sparkles className="h-4 w-4 shrink-0 mt-0.5" />
              <p>{t("guestNotice")}</p>
            </div>
          )}
        </div>

        {/* Tactical Action Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Launch Simulation */}
          <div className="relative p-6 clip-chamfer-md border-2 border-primary/60 bg-card/90 backdrop-blur-md flex flex-col justify-between hover:border-primary transition-all group shadow-[0_0_20px_rgba(0,0,0,0.4)]">
            <div>
              <div className="h-10 w-10 clip-chamfer-xs bg-primary/20 border border-primary text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-[0_0_15px_var(--theme-glow)]">
                <Swords className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-serif font-bold text-foreground uppercase tracking-wider mb-2">
                {t("actions.newGameTitle")}
              </h2>
              <p className="text-xs font-mono text-muted-foreground leading-relaxed mb-6">
                {t("actions.newGameDesc")}
              </p>
            </div>

            <Link
              href="/setup"
              style={{
                background: `linear-gradient(to right, ${activePalette.accentHex}, ${activePalette.highlightHex})`,
              }}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 clip-chamfer-xs text-black font-mono font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_var(--theme-glow)] hover:brightness-110 active:translate-y-0.5 transition-all cursor-pointer"
            >
              <span>{t("actions.newGameCta")}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Card 2: Simulation Archives */}
          <div className="relative p-6 clip-chamfer-md border border-border/80 bg-card/70 backdrop-blur-md flex flex-col justify-between hover:border-primary/60 transition-all group">
            <div>
              <div className="h-10 w-10 clip-chamfer-xs bg-muted border border-border text-muted-foreground flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FolderArchive className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-lg font-serif font-bold text-foreground uppercase tracking-wider mb-2">
                {t("actions.archivesTitle")}
              </h2>
              <p className="text-xs font-mono text-muted-foreground leading-relaxed mb-6">
                {t("actions.archivesDesc")}
              </p>
            </div>

            <Link
              href="/archives"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 clip-chamfer-xs bg-muted/80 hover:bg-muted text-foreground border border-border font-mono font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              <span>{t("actions.archivesCta")}</span>
            </Link>
          </div>

          {/* Card 3: Terminal & Profile Settings */}
          <div className="relative p-6 clip-chamfer-md border border-border/80 bg-card/70 backdrop-blur-md flex flex-col justify-between hover:border-primary/60 transition-all group">
            <div>
              <div className="h-10 w-10 clip-chamfer-xs bg-muted border border-border text-muted-foreground flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <User className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-lg font-serif font-bold text-foreground uppercase tracking-wider mb-2">
                {t("actions.terminalTitle")}
              </h2>
              <p className="text-xs font-mono text-muted-foreground leading-relaxed mb-6">
                {t("actions.terminalDesc")}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/profile"
                className="flex-1 flex items-center justify-center py-3 px-4 clip-chamfer-xs bg-muted/80 hover:bg-muted text-foreground border border-border font-mono font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                <span>{t("actions.terminalCta")}</span>
              </Link>

              {isAuthenticated && (
                <button
                  type="button"
                  onClick={() => signOut()}
                  aria-label={tAuth("badge.logout")}
                  className="px-3 py-3 clip-chamfer-xs bg-red-950/30 hover:bg-red-950/60 border border-red-500/40 text-red-300 transition-colors cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full text-center text-xs font-mono text-muted-foreground py-4 px-4 z-20 border-t border-border/40 bg-background/60 backdrop-blur-xs mt-8">
        <p>{tAuth("footerNotice")}</p>
      </footer>
    </div>
  );
}
