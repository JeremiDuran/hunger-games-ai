"use client";

import React, { useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Shield,
  KeyRound,
  Mail,
  User,
  Sparkles,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Lock,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { useThemeEngine } from "@/lib/theme-context";
import { useA11y } from "@/lib/a11y/a11y-context";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { ThemeSidePanel } from "@/components/disclaimer/ThemeSidePanel";
import { BackgroundConstellation } from "@/components/landing/backgrounds/BackgroundConstellation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") || "/lobby";
  const initialError = searchParams.get("error");


  const {
    isAnonymous,
    isAuthenticated,
    signInWithPassword,
    signUpWithPassword,
    upgradeGuestAccount,
  } = useAuth();
  const { activePalette } = useThemeEngine();
  const { announceAssertive, announcePolite } = useA11y();

  const [mode, setMode] = useState<"signin" | "register">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(
    initialError === "auth_callback_failed"
      ? "Authentication callback failed. Please try signing in again."
      : null
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Keyboard shortcut: Escape outside of form inputs returns to perimeter
  const handleReturnToPerimeter = useCallback(() => {
    announcePolite("Returning to Perimeter...");
    router.push("/");
  }, [router, announcePolite]);

  useKeyboardShortcuts({
    BACK_HOME: () => handleReturnToPerimeter(),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      if (mode === "signin") {
        const result = await signInWithPassword({ email, password });
        if (!result.success) {
          const err =
            result.error || "Failed to sign in. Please verify your credentials.";
          setErrorMessage(err);
          announceAssertive(err);
          return;
        }
        const msg = "Access granted. Initializing Capitol session...";
        setSuccessMessage(msg);
        announcePolite(msg);
        setTimeout(() => {
          router.push(nextUrl);
        }, 600);
      } else {
        // Register / Upgrade flow
        if (isAuthenticated && isAnonymous) {
          // Progress Preservation Link
          const result = await upgradeGuestAccount({
            email,
            password,
            username,
          });
          if (!result.success) {
            const err = result.isConflict
              ? "An account with this email already exists. Switch to Sign In tab to access your account."
              : result.error || "Failed to register account.";
            setErrorMessage(err);
            announceAssertive(err);
            return;
          }
          const msg =
            "Session upgraded! Your game progress and tributes have been permanently secured.";
          setSuccessMessage(msg);
          announcePolite(msg);
          setTimeout(() => {
            router.push(nextUrl);
          }, 800);
        } else {
          // Standard permanent signup
          const result = await signUpWithPassword({
            email,
            password,
            username,
          });
          if (!result.success) {
            const err = result.error || "Failed to create account.";
            setErrorMessage(err);
            announceAssertive(err);
            return;
          }
          const msg =
            "Gamemaker credentials registered successfully! Loading command hub...";
          setSuccessMessage(msg);
          announcePolite(msg);
          setTimeout(() => {
            router.push(nextUrl);
          }, 800);
        }
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      setErrorMessage(message);
      announceAssertive(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col justify-between overflow-x-hidden bg-background text-foreground transition-colors duration-500 selection:bg-primary selection:text-primary-foreground">
      {/* Dynamic Panem Background Visuals */}
      <BackgroundConstellation />

      {/* Floating Theme Selector */}
      <ThemeSidePanel />

      {/* Header Navigation */}
      <header className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between z-20">
        <Link
          href="/"
          aria-keyshortcuts="Escape"
          className="inline-flex items-center gap-2 text-xs font-mono text-muted-foreground hover:text-primary transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>RETURN TO PERIMETER</span>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] bg-muted text-muted-foreground border border-border rounded font-mono">
            Esc
          </kbd>
        </Link>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 clip-chamfer-xs bg-primary/10 border border-primary/40 text-primary text-xs font-mono">
          <Shield className="h-3.5 w-3.5" />
          <span>SECURE CAPITOL TERMINAL</span>
        </div>
      </header>

      {/* Main Auth Terminal */}
      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 w-full flex items-center justify-center px-4 sm:px-6 py-8 z-20 outline-none"
      >
        <div className="w-full max-w-md mx-auto">
          {/* Main Card */}
          <div className="relative p-6 sm:p-8 clip-chamfer-md border-2 border-primary/60 bg-card/90 backdrop-blur-md shadow-[0_0_35px_var(--theme-glow),0_20px_50px_rgba(0,0,0,0.6)]">
            {/* Top Accent Gradient Bar */}
            <div
              className="absolute top-0 inset-x-0 h-1.5 rounded-t transition-all duration-500"
              style={{
                background: `linear-gradient(to right, ${activePalette.accentHex}, ${activePalette.highlightHex})`,
              }}
            />

            {/* Header / Title */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 border border-primary/50 text-primary mb-3 shadow-[0_0_15px_var(--theme-glow)]">
                <KeyRound className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-serif font-bold tracking-wider text-foreground uppercase">
                {mode === "signin"
                  ? "Capitol Authorization"
                  : "Gamemaker Commission"}
              </h1>
              <p className="text-xs font-mono text-muted-foreground mt-1">
                {mode === "signin"
                  ? "Enter your credentials to access stored archives & live simulations"
                  : "Register permanent Panem citizenship with cloud persistence"}
              </p>
            </div>

            {/* Guest Upgrade Ambient Notice */}
            {isAuthenticated && isAnonymous && mode === "register" && (
              <div className="mb-5 p-3.5 clip-chamfer-xs bg-amber-500/10 border border-amber-500/40 text-amber-300 text-xs font-mono flex items-start gap-2.5">
                <Sparkles className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                <div>
                  <strong className="block font-bold">
                    Progress Preservation Active
                  </strong>
                  Registering now directly attaches credentials to your ongoing
                  guest session, preserving your active games, presets, and
                  tributes.
                </div>
              </div>
            )}

            {/* Mode Switcher Tabs with Accessible ARIA roles */}
            <div
              role="tablist"
              aria-label="Authentication mode"
              className="grid grid-cols-2 gap-2 p-1 mb-6 bg-muted/60 clip-chamfer-xs border border-border text-xs font-mono"
            >
              <button
                type="button"
                role="tab"
                id="tab-signin"
                aria-selected={mode === "signin"}
                aria-controls="auth-form-panel"
                onClick={() => {
                  setMode("signin");
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`py-2 px-3 text-center uppercase tracking-wider font-bold transition-all cursor-pointer ${
                  mode === "signin"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                role="tab"
                id="tab-register"
                aria-selected={mode === "register"}
                aria-controls="auth-form-panel"
                onClick={() => {
                  setMode("register");
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`py-2 px-3 text-center uppercase tracking-wider font-bold transition-all cursor-pointer ${
                  mode === "register"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Apply / Register
              </button>
            </div>

            {/* Alerts */}
            {errorMessage && (
              <div
                role="alert"
                id="auth-error"
                className="mb-5 p-3 clip-chamfer-xs bg-red-950/60 border border-red-500/60 text-red-300 text-xs font-mono flex items-start gap-2"
              >
                <AlertCircle
                  className="h-4 w-4 shrink-0 text-red-400 mt-0.5"
                  aria-hidden="true"
                />
                <div>{errorMessage}</div>
              </div>
            )}

            {successMessage && (
              <div
                role="status"
                id="auth-success"
                className="mb-5 p-3 clip-chamfer-xs bg-green-950/60 border border-green-500/60 text-green-300 text-xs font-mono flex items-start gap-2"
              >
                <CheckCircle2
                  className="h-4 w-4 shrink-0 text-green-400 mt-0.5"
                  aria-hidden="true"
                />
                <div>{successMessage}</div>
              </div>
            )}

            {/* Auth Form */}
            <form
              id="auth-form-panel"
              role="tabpanel"
              aria-labelledby={
                mode === "signin" ? "tab-signin" : "tab-register"
              }
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              {mode === "register" && (
                <div>
                  <label
                    htmlFor="username"
                    className="block text-xs font-mono font-bold text-muted-foreground uppercase tracking-wider mb-1.5"
                  >
                    Gamemaker Call-sign / Username
                  </label>
                  <div className="relative">
                    <div
                      className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground"
                      aria-hidden="true"
                    >
                      <User className="h-4 w-4" />
                    </div>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      required
                      placeholder="e.g. SenecaCrane"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 clip-chamfer-xs bg-background/80 border border-border focus:border-primary focus:outline-none text-foreground font-mono text-xs sm:text-sm placeholder:text-muted-foreground/50 transition-colors"
                    />
                  </div>
                </div>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-mono font-bold text-muted-foreground uppercase tracking-wider mb-1.5"
                >
                  Panem Email Address
                </label>
                <div className="relative">
                  <div
                    className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground"
                    aria-hidden="true"
                  >
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="gamemaker@capitol.panem"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-invalid={Boolean(errorMessage)}
                    aria-describedby={
                      errorMessage
                        ? "auth-error"
                        : successMessage
                        ? "auth-success"
                        : undefined
                    }
                    className="w-full pl-9 pr-3 py-2.5 clip-chamfer-xs bg-background/80 border border-border focus:border-primary focus:outline-none text-foreground font-mono text-xs sm:text-sm placeholder:text-muted-foreground/50 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-mono font-bold text-muted-foreground uppercase tracking-wider mb-1.5"
                >
                  Security Passphrase
                </label>
                <div className="relative">
                  <div
                    className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground"
                    aria-hidden="true"
                  >
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    minLength={6}
                    autoComplete={
                      mode === "signin" ? "current-password" : "new-password"
                    }
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    aria-invalid={Boolean(errorMessage)}
                    aria-describedby={
                      errorMessage
                        ? "auth-error"
                        : successMessage
                        ? "auth-success"
                        : undefined
                    }
                    className="w-full pl-9 pr-3 py-2.5 clip-chamfer-xs bg-background/80 border border-border focus:border-primary focus:outline-none text-foreground font-mono text-xs sm:text-sm placeholder:text-muted-foreground/50 transition-colors"
                  />
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  background: `linear-gradient(to right, ${activePalette.accentHex}, ${activePalette.highlightHex})`,
                }}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 clip-chamfer-sm text-black font-mono font-bold text-xs sm:text-sm tracking-wider uppercase border border-yellow-300 shadow-[0_0_20px_var(--theme-glow)] hover:brightness-110 active:translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer mt-6"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw
                      className="h-4 w-4 animate-spin"
                      aria-hidden="true"
                    />
                    <span>AUTHENTICATING WITH CAPITOL...</span>
                  </>
                ) : mode === "signin" ? (
                  <>
                    <KeyRound className="h-4 w-4" aria-hidden="true" />
                    <span>AUTHORIZE ACCESS</span>
                    <ArrowRight className="h-4 w-4 ml-1" aria-hidden="true" />
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                    <span>CONFIRM CITIZENSHIP</span>
                    <ArrowRight className="h-4 w-4 ml-1" aria-hidden="true" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Guest Bypass / Link */}
            <div className="mt-6 pt-4 border-t border-border/50 text-center">
              <Link
                href="/setup"
                className="text-xs font-mono text-muted-foreground hover:text-primary transition-colors"
              >
                Skip authentication and play as Guest →
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full text-center text-xs font-mono text-muted-foreground py-4 px-4 z-20 border-t border-border/40 bg-background/60 backdrop-blur-xs">
        <p>
          Hunger Games AI Protocol • PKCE Encrypted • Capitol Security Directive
          14
        </p>
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background text-primary font-mono text-sm">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>CONNECTING TO CAPITOL SECURE GATEWAY...</span>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}


