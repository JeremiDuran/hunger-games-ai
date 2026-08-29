"use client";

import React, { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { FileUp, X, Check, AlertCircle } from "lucide-react";

interface BatchImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (names: string[]) => void;
  currentCount: number;
}

export function BatchImportModal({
  isOpen,
  onClose,
  onImport,
  currentCount,
}: BatchImportModalProps) {
  const t = useTranslations("setup.tributes.batch");
  const [rawText, setRawText] = useState("");

  const parsedNames = rawText
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const handleConfirm = useCallback(() => {
    if (parsedNames.length === 0) return;
    onImport(parsedNames);
    setRawText("");
    onClose();
  }, [parsedNames, onImport, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="batch-import-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
    >
      <div className="relative w-full max-w-xl p-6 clip-chamfer-md bg-card border-2 border-primary/60 shadow-[0_0_50px_rgba(0,0,0,0.8),0_0_20px_var(--theme-glow)] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border/80 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 clip-chamfer-xs bg-primary/10 border border-primary/30 text-primary">
              <FileUp className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="batch-import-title"
                className="text-base font-mono font-bold uppercase tracking-wider text-foreground"
              >
                {t("title")}
              </h2>
              <p className="text-xs text-muted-foreground font-mono">
                {t("subtitle", { count: currentCount })}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={t("close")}
            className="p-1.5 clip-chamfer-xs bg-muted/40 hover:bg-muted/80 text-muted-foreground hover:text-foreground border border-border transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Textarea Input */}
        <div className="space-y-3">
          <label
            htmlFor="batch-names-input"
            className="text-xs font-mono font-bold uppercase tracking-wider text-foreground block"
          >
            {t("inputLabel")}
          </label>
          <textarea
            id="batch-names-input"
            rows={8}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder={t("placeholder")}
            className="w-full p-3 clip-chamfer-xs bg-background text-xs font-mono text-foreground placeholder:text-muted-foreground/40 border border-border focus:border-primary focus:outline-none resize-none"
          />

          {/* Counter Feedback */}
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-muted-foreground">
              {t("detectedCount", { count: parsedNames.length, max: currentCount })}
            </span>
            {parsedNames.length > currentCount && (
              <span className="text-amber-400 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" />
                {t("excessWarning", { count: parsedNames.length - currentCount })}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-3 border-t border-border/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 clip-chamfer-xs bg-muted/40 hover:bg-muted/80 text-xs font-mono font-bold uppercase tracking-wider border border-border transition-colors cursor-pointer"
          >
            {t("cancel")}
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={parsedNames.length === 0}
            className="inline-flex items-center gap-2 px-5 py-2 clip-chamfer-xs bg-primary text-primary-foreground text-xs font-mono font-bold uppercase tracking-wider shadow-xs hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <Check className="h-4 w-4" />
            <span>{t("confirmImport")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
