"use client";

import React from "react";
import { ThemeProvider } from "@/lib/theme-context";
import { AuthProvider } from "@/lib/auth/auth-context";
import { A11yProvider } from "@/lib/a11y/a11y-context";
import { KeyboardShortcutsModal } from "@/components/a11y/KeyboardShortcutsModal";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider>
        <A11yProvider>
          {children}
          <KeyboardShortcutsModal />
        </A11yProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

