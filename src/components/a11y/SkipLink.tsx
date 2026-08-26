"use client";

import React from "react";
import { useTranslations } from "next-intl";

interface SkipLinkProps {
  targetId?: string;
  label?: string;
}

export function SkipLink({
  targetId = "main-content",
  label,
}: SkipLinkProps) {
  const t = useTranslations("a11y");
  const displayLabel = label ?? t("skipToContent");

  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2.5 focus:clip-chamfer-xs focus:bg-primary focus:text-primary-foreground focus:font-mono focus:font-bold focus:text-xs focus:tracking-wider focus:uppercase focus:shadow-[0_0_20px_var(--theme-glow)] focus:outline-2 focus:outline-offset-2 focus:outline-white transition-all"
    >
      {displayLabel}
    </a>
  );
}
