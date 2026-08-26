"use client";

import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";

interface A11yContextValue {
  isShortcutsModalOpen: boolean;
  openShortcutsModal: () => void;
  closeShortcutsModal: () => void;
  toggleShortcutsModal: () => void;
  announcePolite: (message: string) => void;
  announceAssertive: (message: string) => void;
}

const A11yContext = createContext<A11yContextValue | null>(null);

export function A11yProvider({ children }: { children: React.ReactNode }) {
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [politeMessage, setPoliteMessage] = useState("");
  const [assertiveMessage, setAssertiveMessage] = useState("");

  const openShortcutsModal = useCallback(() => setIsShortcutsModalOpen(true), []);
  const closeShortcutsModal = useCallback(() => setIsShortcutsModalOpen(false), []);
  const toggleShortcutsModal = useCallback(
    () => setIsShortcutsModalOpen((prev) => !prev),
    []
  );

  const announcePolite = useCallback((message: string) => {
    // Clear first to re-trigger screen reader reading if same message
    setPoliteMessage("");
    setTimeout(() => setPoliteMessage(message), 50);
  }, []);

  const announceAssertive = useCallback((message: string) => {
    setAssertiveMessage("");
    setTimeout(() => setAssertiveMessage(message), 50);
  }, []);

  // Global listener: Pressing '?' (Shift+/) or 'H' opens the shortcuts modal
  useKeyboardShortcuts(
    {
      HELP: () => {
        toggleShortcutsModal();
      },
    },
    { enabled: true }
  );

  const value = useMemo<A11yContextValue>(
    () => ({
      isShortcutsModalOpen,
      openShortcutsModal,
      closeShortcutsModal,
      toggleShortcutsModal,
      announcePolite,
      announceAssertive,
    }),
    [
      isShortcutsModalOpen,
      openShortcutsModal,
      closeShortcutsModal,
      toggleShortcutsModal,
      announcePolite,
      announceAssertive,
    ]
  );

  return (
    <A11yContext.Provider value={value}>
      {children}

      {/* Screen Reader Live Announcement Regions */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only pointer-events-none absolute h-0 w-0 overflow-hidden"
      >
        {politeMessage}
      </div>
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only pointer-events-none absolute h-0 w-0 overflow-hidden"
      >
        {assertiveMessage}
      </div>
    </A11yContext.Provider>
  );
}

export function useA11y() {
  const context = useContext(A11yContext);
  if (!context) {
    throw new Error("useA11y must be used within an A11yProvider");
  }
  return context;
}
