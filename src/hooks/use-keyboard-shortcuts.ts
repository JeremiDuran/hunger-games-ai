"use client";

import { useEffect, useRef } from "react";
import { SHORTCUTS, ShortcutAction, matchesShortcut } from "@/config/shortcuts";

export interface KeyboardShortcutOptions {
  enabled?: boolean;
  preventDefault?: boolean;
  allowInInputs?: boolean;
}

export type ShortcutHandlers = Partial<Record<ShortcutAction, (e: KeyboardEvent) => void>>;

/**
 * Custom React hook to bind scoped keyboard shortcuts to actions.
 * Automatically ignores keystrokes when the user is focused inside text inputs,
 * textareas, select dropdowns, or contenteditable regions.
 */
export function useKeyboardShortcuts(
  handlers: ShortcutHandlers,
  options: KeyboardShortcutOptions = {}
) {
  const { enabled = true, preventDefault = true, allowInInputs = false } = options;
  const handlersRef = useRef(handlers);

  // Keep handlers ref in sync with latest render to avoid stale closures
  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(event: KeyboardEvent) {
      // 1. Safety Guard: Ignore when focused on input fields unless explicitly allowed
      if (!allowInInputs) {
        const target = event.target as HTMLElement | null;
        if (
          target &&
          (target.tagName === "INPUT" ||
            target.tagName === "TEXTAREA" ||
            target.tagName === "SELECT" ||
            target.isContentEditable ||
            target.getAttribute("role") === "textbox")
        ) {
          return;
        }
      }

      // 2. Iterate through registered handlers and match shortcuts
      const currentHandlers = handlersRef.current;
      for (const [actionKey, handler] of Object.entries(currentHandlers)) {
        if (!handler) continue;
        const shortcut = SHORTCUTS[actionKey as ShortcutAction];
        if (shortcut && matchesShortcut(event, shortcut)) {
          if (preventDefault) {
            event.preventDefault();
          }
          handler(event);
          break;
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, preventDefault, allowInInputs]);
}
