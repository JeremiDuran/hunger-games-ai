"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import {
  X,
  User,
  Sparkles,
  ShieldAlert,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Check,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { TributeData, TributeGender } from "@/types/setup";
import { useSetup } from "@/lib/setup/setup-context";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP);
}

interface TributeEditorModalProps {
  tribute: TributeData | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigatePrev: () => void;
  onNavigateNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  currentIndex: number;
  totalCount: number;
  slotIndexInDistrict: number;
}

const GENDER_OPTIONS: { value: TributeGender; labelKey: string }[] = [
  { value: "female", labelKey: "genderFemale" },
  { value: "male", labelKey: "genderMale" },
  { value: "non_binary", labelKey: "genderNonBinary" },
  { value: "unspecified", labelKey: "genderUnspecified" },
];

interface TributeEditorBodyProps {
  tribute: TributeData;
  slotIndexInDistrict: number;
  currentIndex: number;
  totalCount: number;
  onClose: () => void;
  onNavigatePrev: () => void;
  onNavigateNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}

function TributeEditorBody({
  tribute,
  slotIndexInDistrict,
  currentIndex,
  totalCount,
  onClose,
  onNavigatePrev,
  onNavigateNext,
  hasPrev,
  hasNext,
}: TributeEditorBodyProps) {
  const t = useTranslations("setup.tributes");
  const tVal = useTranslations("setup.validation");
  const { updateTribute, tributeErrors, tributesTouched } = useSetup();

  const nameInputRef = useRef<HTMLInputElement>(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  const errors = tributeErrors[tribute.id] || {};
  const isTouched = tributesTouched[tribute.id] || false;
  const hasNameError = isTouched && Boolean(errors.name);

  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateTribute(tribute.id, { name: e.target.value });
    },
    [tribute.id, updateTribute]
  );

  const handleGenderChange = useCallback(
    (gender: TributeGender) => {
      updateTribute(tribute.id, { gender });
    },
    [tribute.id, updateTribute]
  );

  const handlePersonalityChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      updateTribute(tribute.id, { personality: e.target.value });
    },
    [tribute.id, updateTribute]
  );

  const handlePhysicalChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      updateTribute(tribute.id, { physicalAspect: e.target.value });
    },
    [tribute.id, updateTribute]
  );

  const handleAvatarUrlChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setImageError(false);
      updateTribute(tribute.id, { avatarUrl: e.target.value.trim() || null });
    },
    [tribute.id, updateTribute]
  );

  const handleClearAvatar = useCallback(() => {
    setImageError(false);
    updateTribute(tribute.id, { avatarUrl: null });
  }, [tribute.id, updateTribute]);

  return (
    <>
      {/* 1. Header Bar */}
      <div className="p-4 sm:p-5 border-b border-border/80 flex items-center justify-between gap-4 bg-muted/20">
        <div className="flex items-center gap-3">
          <div className="p-2 clip-chamfer-xs bg-primary/10 border border-primary/30 text-primary">
            <User className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2
                id="tribute-editor-title"
                className="text-base sm:text-lg font-mono font-black uppercase tracking-wider text-foreground"
              >
                {t("dossierEditorTitle")}
              </h2>
              <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 clip-chamfer-xs border border-primary/30">
                D{tribute.district} #{slotIndexInDistrict}
              </span>
            </div>
            <p id="tribute-editor-desc" className="text-xs text-muted-foreground font-mono mt-0.5">
              {t("dossierEditorSubtitle", {
                district: tribute.district,
                slot: slotIndexInDistrict,
                index: currentIndex + 1,
                total: totalCount,
              })}
            </p>
          </div>
        </div>

        {/* Stepper Controls & Close Button */}
        <div className="flex items-center gap-2">
          {/* Prev / Next Quick Buttons */}
          <div className="hidden sm:inline-flex items-center p-0.5 clip-chamfer-xs bg-muted/40 border border-border">
            <button
              type="button"
              onClick={onNavigatePrev}
              disabled={!hasPrev}
              title={t("prevTribute")}
              aria-label={t("prevTribute")}
              className="p-1.5 clip-chamfer-xs text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2 text-[10px] font-mono text-muted-foreground">
              {currentIndex + 1} / {totalCount}
            </span>
            <button
              type="button"
              onClick={onNavigateNext}
              disabled={!hasNext}
              title={t("nextTribute")}
              aria-label={t("nextTribute")}
              className="p-1.5 clip-chamfer-xs text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Close Modal Button */}
          <button
            type="button"
            onClick={onClose}
            title={t("closeEditor")}
            aria-label={t("closeEditor")}
            className="p-2 clip-chamfer-xs bg-muted/40 hover:bg-muted/80 text-muted-foreground hover:text-foreground border border-border transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 2. Scrollable Body Content */}
      <div className="p-4 sm:p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
        {/* Top Section: Avatar & Primary Attributes */}
        <div className="flex flex-col md:flex-row gap-5 items-start">
          {/* Left: Avatar Portrait & URL Input */}
          <div className="w-full md:w-56 shrink-0 space-y-3">
            <div className="relative w-full aspect-3/4 max-w-[200px] mx-auto md:max-w-none clip-chamfer-sm bg-background/90 border-2 border-border shadow-inner overflow-hidden flex items-center justify-center group">
              {tribute.avatarUrl && !imageError ? (
                <Image
                  src={tribute.avatarUrl}
                  alt={tribute.name || "Tribute Portrait"}
                  fill
                  sizes="(max-width: 768px) 200px, 224px"
                  className="object-cover object-top transition-transform duration-300 group-hover:scale-105"
                  onError={() => setImageError(true)}
                  unoptimized
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-4 text-center text-muted-foreground/60">
                  <User className="h-12 w-12 mb-2 text-primary/40" />
                  <span className="text-[10px] font-mono uppercase tracking-wider leading-tight">
                    {t("noPortrait")}
                  </span>
                  <span className="text-[9px] font-mono text-muted-foreground/40 mt-1">
                    {t("livePreview")}
                  </span>
                </div>
              )}

              {/* Corner Capitol Tech Stamp */}
              <div className="absolute top-0 right-0 w-4 h-4 bg-primary/40 clip-chamfer-xs pointer-events-none" />
              <div className="absolute bottom-1 left-2 text-[9px] font-mono uppercase text-primary/70 bg-black/60 px-1.5 py-0.5 clip-chamfer-xs pointer-events-none">
                SEC // D{tribute.district}-{slotIndexInDistrict}
              </div>
            </div>

            {/* Avatar URL Input */}
            <div className="space-y-1.5">
              <label
                htmlFor={`modal-avatar-${tribute.id}`}
                className="text-[11px] font-mono font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between"
              >
                <span className="flex items-center gap-1">
                  <ImageIcon className="h-3 w-3 text-primary" />
                  <span>{t("avatarUrlLabel")}</span>
                </span>
                {tribute.avatarUrl && (
                  <button
                    type="button"
                    onClick={handleClearAvatar}
                    className="text-[10px] font-mono text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="h-2.5 w-2.5" />
                    <span>{t("clearAvatar")}</span>
                  </button>
                )}
              </label>
              <div className="relative">
                <input
                  id={`modal-avatar-${tribute.id}`}
                  type="url"
                  value={tribute.avatarUrl || ""}
                  onChange={handleAvatarUrlChange}
                  placeholder="https://..."
                  className="w-full px-3 py-1.5 clip-chamfer-xs bg-background/90 text-xs font-mono text-foreground placeholder:text-muted-foreground/40 border border-border focus:border-primary focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Right: Core Fields (Name & Gender) */}
          <div className="flex-1 w-full space-y-4">
            {/* Tribute Name Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor={`modal-name-${tribute.id}`}
                  className="text-xs font-mono font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5"
                >
                  <span>{t("nameLabel")}</span>
                  <span className="text-primary">*</span>
                </label>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {tribute.name.length}/60
                </span>
              </div>

              <div className="relative">
                <input
                  ref={nameInputRef}
                  id={`modal-name-${tribute.id}`}
                  type="text"
                  value={tribute.name}
                  onChange={handleNameChange}
                  maxLength={60}
                  placeholder={t("namePlaceholder")}
                  aria-invalid={hasNameError}
                  aria-describedby={hasNameError ? `modal-name-err-${tribute.id}` : undefined}
                  className={`w-full px-4 py-2.5 clip-chamfer-xs bg-background text-sm font-mono text-foreground placeholder:text-muted-foreground/50 border transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-primary ${
                    hasNameError
                      ? "border-red-500 text-red-300"
                      : "border-border hover:border-primary/50 focus:border-primary"
                  }`}
                />
                {hasNameError && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400">
                    <AlertCircle className="h-4 w-4" />
                  </div>
                )}
              </div>

              {hasNameError && (
                <p
                  id={`modal-name-err-${tribute.id}`}
                  className="text-[11px] font-mono text-red-400 mt-1 flex items-center gap-1"
                >
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  <span>{tVal(errors.name || "nameMin")}</span>
                </p>
              )}
            </div>

            {/* Gender Selector Buttons */}
            <div>
              <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                {t("genderLabel")}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {GENDER_OPTIONS.map((opt) => {
                  const isSelected = tribute.gender === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleGenderChange(opt.value)}
                      className={`px-3 py-2 clip-chamfer-xs text-xs font-mono font-bold uppercase tracking-wider border transition-all cursor-pointer text-center ${
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary shadow-xs font-black"
                          : "bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/70 border-border"
                      }`}
                    >
                      {t(opt.labelKey)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Personality / Backstory */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor={`modal-pers-${tribute.id}`}
                  className="text-[11px] font-mono font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"
                >
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <span>{t("personalityLabel")}</span>
                </label>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {tribute.personality.length}/280
                </span>
              </div>
              <textarea
                id={`modal-pers-${tribute.id}`}
                rows={3}
                value={tribute.personality}
                onChange={handlePersonalityChange}
                maxLength={280}
                placeholder={t("personalityPlaceholder")}
                className="w-full px-3.5 py-2 clip-chamfer-xs bg-background/90 text-xs font-mono text-foreground placeholder:text-muted-foreground/40 border border-border hover:border-primary/40 focus:border-primary focus:outline-none resize-none"
              />
            </div>

            {/* Physical Aspect */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor={`modal-phys-${tribute.id}`}
                  className="text-[11px] font-mono font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"
                >
                  <ShieldAlert className="h-3.5 w-3.5 text-primary" />
                  <span>{t("physicalLabel")}</span>
                </label>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {tribute.physicalAspect.length}/280
                </span>
              </div>
              <textarea
                id={`modal-phys-${tribute.id}`}
                rows={3}
                value={tribute.physicalAspect}
                onChange={handlePhysicalChange}
                maxLength={280}
                placeholder={t("physicalPlaceholder")}
                className="w-full px-3.5 py-2 clip-chamfer-xs bg-background/90 text-xs font-mono text-foreground placeholder:text-muted-foreground/40 border border-border hover:border-primary/40 focus:border-primary focus:outline-none resize-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Footer Bar with Navigation and Done Button */}
      <div className="p-4 sm:p-5 border-t border-border/80 bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Mobile Stepper */}
        <div className="flex items-center gap-2 sm:hidden w-full justify-between">
          <button
            type="button"
            onClick={onNavigatePrev}
            disabled={!hasPrev}
            className="px-3 py-2 clip-chamfer-xs bg-muted/50 text-foreground disabled:opacity-30 disabled:cursor-not-allowed border border-border font-mono text-xs inline-flex items-center gap-1 cursor-pointer"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>{t("prevTribute")}</span>
          </button>

          <span className="text-xs font-mono text-muted-foreground">
            {currentIndex + 1} / {totalCount}
          </span>

          <button
            type="button"
            onClick={onNavigateNext}
            disabled={!hasNext}
            className="px-3 py-2 clip-chamfer-xs bg-muted/50 text-foreground disabled:opacity-30 disabled:cursor-not-allowed border border-border font-mono text-xs inline-flex items-center gap-1 cursor-pointer"
          >
            <span>{t("nextTribute")}</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <button
            type="button"
            onClick={onNavigatePrev}
            disabled={!hasPrev}
            className="px-3.5 py-2 clip-chamfer-xs bg-muted/40 hover:bg-muted/80 text-foreground disabled:opacity-30 disabled:cursor-not-allowed border border-border font-mono text-xs uppercase tracking-wider inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>{t("prevTribute")}</span>
          </button>

          <button
            type="button"
            onClick={onNavigateNext}
            disabled={!hasNext}
            className="px-3.5 py-2 clip-chamfer-xs bg-muted/40 hover:bg-muted/80 text-foreground disabled:opacity-30 disabled:cursor-not-allowed border border-border font-mono text-xs uppercase tracking-wider inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>{t("nextTribute")}</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Done / Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 clip-chamfer-xs bg-primary text-primary-foreground font-mono font-bold text-xs uppercase tracking-wider shadow-xs hover:brightness-110 active:translate-y-0.5 transition-all cursor-pointer"
        >
          <Check className="h-4 w-4" />
          <span>{t("doneEditing")}</span>
        </button>
      </div>
    </>
  );
}

export function TributeEditorModal({
  tribute,
  isOpen,
  onClose,
  onNavigatePrev,
  onNavigateNext,
  hasPrev,
  hasNext,
  currentIndex,
  totalCount,
  slotIndexInDistrict,
}: TributeEditorModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Handle keyboard shortcuts (Escape to close, Ctrl/Cmd + Left/Right for prev/next)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      // Check if user is navigating using Cmd/Ctrl + Arrow keys
      if ((e.ctrlKey || e.metaKey) && e.key === "ArrowLeft" && hasPrev) {
        e.preventDefault();
        onNavigatePrev();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "ArrowRight" && hasNext) {
        e.preventDefault();
        onNavigateNext();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, hasPrev, hasNext, onClose, onNavigatePrev, onNavigateNext]);

  // GSAP Entrance & Animation
  useGSAP(
    () => {
      if (!isOpen || !modalRef.current || !cardRef.current) return;

      const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (prefersReducedMotion) {
        gsap.set(modalRef.current, { opacity: 1 });
        gsap.set(cardRef.current, { opacity: 1, scale: 1, y: 0 });
        return;
      }

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.fromTo(
        modalRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.2 }
      ).fromTo(
        cardRef.current,
        { opacity: 0, scale: 0.95, y: 15 },
        { opacity: 1, scale: 1, y: 0, duration: 0.3 },
        "-=0.1"
      );
    },
    { scope: modalRef, dependencies: [isOpen] }
  );

  if (!isOpen || !tribute) return null;

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="tribute-editor-title"
      aria-describedby="tribute-editor-desc"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md overflow-y-auto"
      onClick={(e) => {
        if (e.target === modalRef.current) {
          onClose();
        }
      }}
    >
      <div
        ref={cardRef}
        className="relative w-full max-w-3xl my-auto clip-chamfer-md bg-card/95 border-2 border-primary/60 shadow-[0_0_50px_rgba(0,0,0,0.9),0_0_25px_var(--theme-glow)] flex flex-col max-h-[90vh] overflow-hidden"
      >
        {/* Holographic Top Glow Accent */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-80" />

        <TributeEditorBody
          key={tribute.id}
          tribute={tribute}
          slotIndexInDistrict={slotIndexInDistrict}
          currentIndex={currentIndex}
          totalCount={totalCount}
          onClose={onClose}
          onNavigatePrev={onNavigatePrev}
          onNavigateNext={onNavigateNext}
          hasPrev={hasPrev}
          hasNext={hasNext}
        />
      </div>
    </div>
  );
}
