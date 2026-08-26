"use client";

import React from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Keyboard, X, Sparkles, Compass, BookOpen, Shield } from "lucide-react";
import { useTranslations } from "next-intl";
import { useA11y } from "@/lib/a11y/a11y-context";
import { useThemeEngine } from "@/lib/theme-context";
import { SHORTCUTS } from "@/config/shortcuts";

export function KeyboardShortcutsModal() {
  const { isShortcutsModalOpen, closeShortcutsModal } = useA11y();
  const { activePalette } = useThemeEngine();
  const t = useTranslations("a11y.shortcuts");

  const globalShortcuts = [
    { ...SHORTCUTS.HELP, descKey: "items.help" },
    { ...SHORTCUTS.ESCAPE, descKey: "items.escape" },
  ];
  const landingShortcuts = [
    { ...SHORTCUTS.GUEST_PLAY, descKey: "items.guestPlay" },
    { ...SHORTCUTS.REGISTER, descKey: "items.register" },
  ];
  const storyShortcuts = [
    { ...SHORTCUTS.STORY_FORWARD, descKey: "items.storyForward" },
    { ...SHORTCUTS.STORY_BACKWARD, descKey: "items.storyBackward" },
    { ...SHORTCUTS.STORY_AUTOPLAY, descKey: "items.storyAutoplay" },
    { ...SHORTCUTS.STORY_SKIP, descKey: "items.storySkip" },
  ];

  return (
    <Dialog.Root
      open={isShortcutsModalOpen}
      onOpenChange={(open) => {
        if (!open) closeShortcutsModal();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs transition-opacity data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto pointer-events-none">
          <Dialog.Popup className="pointer-events-auto relative w-full max-w-lg clip-chamfer-md border-2 border-primary/70 bg-card/95 text-card-foreground p-6 sm:p-7 shadow-[0_0_35px_var(--theme-glow),0_25px_60px_rgba(0,0,0,0.8)] backdrop-blur-md outline-none transition-all data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
            {/* Top Accent Line */}
            <div
              className="absolute top-0 inset-x-0 h-1.5 rounded-t"
              style={{
                background: `linear-gradient(to right, ${activePalette.accentHex}, ${activePalette.highlightHex})`,
              }}
            />

            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 clip-chamfer-xs bg-primary/15 border border-primary/40 text-primary">
                  <Keyboard className="h-5 w-5" />
                </div>
                <div>
                  <Dialog.Title className="text-lg sm:text-xl font-serif font-bold uppercase tracking-wider text-foreground">
                    {t("title")}
                  </Dialog.Title>
                  <Dialog.Description className="text-xs font-mono text-muted-foreground">
                    {t("subtitle")}
                  </Dialog.Description>
                </div>
              </div>

              <Dialog.Close
                aria-label={t("dismiss")}
                className="p-1.5 clip-chamfer-xs text-muted-foreground hover:text-foreground hover:bg-muted/80 border border-transparent hover:border-border transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </Dialog.Close>
            </div>

            {/* Categories */}
            <div className="space-y-5 text-xs font-mono">
              {/* Global Section */}
              <div>
                <div className="flex items-center gap-1.5 text-primary font-bold uppercase tracking-wider mb-2.5">
                  <Shield className="h-3.5 w-3.5" />
                  <span>{t("general")}</span>
                </div>
                <div className="space-y-1.5">
                  {globalShortcuts.map((sc) => (
                    <div
                      key={sc.id}
                      className="flex items-center justify-between p-2 rounded bg-muted/40 border border-border/50"
                    >
                      <span className="text-muted-foreground">
                        {t(sc.descKey as never)}
                      </span>
                      <kbd className="px-2 py-0.5 rounded bg-background border border-primary/40 text-primary font-mono font-bold shadow-xs text-[11px]">
                        {sc.label}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>

              {/* Navigation Section */}
              <div>
                <div className="flex items-center gap-1.5 text-primary font-bold uppercase tracking-wider mb-2.5">
                  <Compass className="h-3.5 w-3.5" />
                  <span>{t("landing")}</span>
                </div>
                <div className="space-y-1.5">
                  {landingShortcuts.map((sc) => (
                    <div
                      key={sc.id}
                      className="flex items-center justify-between p-2 rounded bg-muted/40 border border-border/50"
                    >
                      <span className="text-muted-foreground">
                        {t(sc.descKey as never)}
                      </span>
                      <kbd className="px-2 py-0.5 rounded bg-background border border-primary/40 text-primary font-mono font-bold shadow-xs text-[11px]">
                        {sc.label}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>

              {/* Simulator & Story Section */}
              <div>
                <div className="flex items-center gap-1.5 text-primary font-bold uppercase tracking-wider mb-2.5">
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>{t("simulator")}</span>
                </div>
                <div className="space-y-1.5">
                  {storyShortcuts.map((sc) => (
                    <div
                      key={sc.id}
                      className="flex items-center justify-between p-2 rounded bg-muted/40 border border-border/50"
                    >
                      <span className="text-muted-foreground">
                        {t(sc.descKey as never)}
                      </span>
                      <kbd className="px-2 py-0.5 rounded bg-background border border-primary/40 text-primary font-mono font-bold shadow-xs text-[11px]">
                        {sc.label}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer notice */}
            <div className="mt-6 pt-3 border-t border-border/60 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
              <span className="flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-primary" />
                <span>{t("notice")}</span>
              </span>
              <Dialog.Close className="px-3 py-1 clip-chamfer-xs bg-muted hover:bg-muted/80 text-foreground uppercase tracking-wider font-bold cursor-pointer transition-colors">
                {t("dismiss")}
              </Dialog.Close>
            </div>
          </Dialog.Popup>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
