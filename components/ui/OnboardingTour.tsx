"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ChevronRight, ChevronLeft, X, Sparkles, CheckCircle2, RotateCcw } from "lucide-react";

export interface TourStep {
  target: string; // data-tour selector attribute value
  title: string;
  description: string;
  tabId?: string; // Auto-switch tab if needed
  position?: "top" | "bottom" | "left" | "right";
}

interface OnboardingTourProps {
  steps: TourStep[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
}

export function OnboardingTour({ steps, activeTab, onTabChange }: OnboardingTourProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [neverShowAgain, setNeverShowAgain] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  // Check localStorage on mount
  useEffect(() => {
    const dismissed = localStorage.getItem("janus_tour_dismissed");
    if (!dismissed) {
      // Auto start tour after a brief delay for rendering
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Update target rect when current step changes or tab changes
  const updateTargetRect = useCallback(() => {
    if (!isOpen || steps.length === 0) return;

    const step = steps[currentStep];
    if (!step) return;

    // If step requires a different tab, switch tab first
    if (step.tabId && onTabChange && activeTab !== step.tabId) {
      onTabChange(step.tabId);
    }

    // Give DOM time to update after tab switch
    setTimeout(() => {
      const el = document.querySelector(`[data-tour="${step.target}"]`);
      if (el) {
        const rect = el.getBoundingClientRect();
        setTargetRect(rect);
        // Scroll element into view smoothly if offscreen
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      } else {
        setTargetRect(null);
      }
    }, 150);
  }, [isOpen, currentStep, steps, activeTab, onTabChange]);

  useEffect(() => {
    updateTargetRect();
    window.addEventListener("resize", updateTargetRect);
    window.addEventListener("scroll", updateTargetRect);
    return () => {
      window.removeEventListener("resize", updateTargetRect);
      window.removeEventListener("scroll", updateTargetRect);
    };
  }, [updateTargetRect]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    if (neverShowAgain) {
      localStorage.setItem("janus_tour_dismissed", "true");
    }
    setIsOpen(false);
  };

  const handleSkip = () => {
    if (neverShowAgain) {
      localStorage.setItem("janus_tour_dismissed", "true");
    }
    setIsOpen(false);
  };

  const handleRestart = () => {
    localStorage.removeItem("janus_tour_dismissed");
    setCurrentStep(0);
    setNeverShowAgain(false);
    setIsOpen(true);
  };

  if (!isOpen || steps.length === 0) {
    return (
      <button
        onClick={handleRestart}
        className="fixed bottom-4 right-4 z-40 flex items-center gap-2 px-3 py-1.5 bg-[#18181b] hover:bg-[#27272a] text-[#a1a1aa] hover:text-[#fafafa] border border-white/10 rounded-full text-xs transition-all shadow-lg backdrop-blur-md"
        title="Restart Product Tour"
      >
        <Sparkles className="w-3.5 h-3.5 text-[#3b82f6]" />
        <span>Product Tour</span>
      </button>
    );
  }

  const step = steps[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;

  // Calculate position for tooltip card relative to target
  let tooltipStyle: React.CSSProperties = {
    position: "fixed",
    zIndex: 9999,
  };

  if (targetRect) {
    const margin = 16;
    const preferredPos = step.position || "bottom";

    if (preferredPos === "bottom") {
      tooltipStyle.top = `${targetRect.bottom + margin}px`;
      tooltipStyle.left = `${Math.max(20, Math.min(window.innerWidth - 380, targetRect.left + (targetRect.width / 2) - 180))}px`;
    } else if (preferredPos === "top") {
      tooltipStyle.bottom = `${window.innerHeight - targetRect.top + margin}px`;
      tooltipStyle.left = `${Math.max(20, Math.min(window.innerWidth - 380, targetRect.left + (targetRect.width / 2) - 180))}px`;
    } else if (preferredPos === "left") {
      tooltipStyle.top = `${targetRect.top}px`;
      tooltipStyle.right = `${window.innerWidth - targetRect.left + margin}px`;
    } else if (preferredPos === "right") {
      tooltipStyle.top = `${targetRect.top}px`;
      tooltipStyle.left = `${targetRect.right + margin}px`;
    }
  } else {
    // Fallback centered position
    tooltipStyle.top = "50%";
    tooltipStyle.left = "50%";
    tooltipStyle.transform = "translate(-50%, -50%)";
  }

  return (
    <>
      {/* Spotlight cutout overlay */}
      {targetRect && (
        <div
          className="fixed inset-0 z-[9990] pointer-events-none transition-all duration-300 ease-out"
          style={{
            boxShadow: `0 0 0 9999px rgba(0, 0, 0, 0.75)`,
            left: `${targetRect.left - 6}px`,
            top: `${targetRect.top - 6}px`,
            width: `${targetRect.width + 12}px`,
            height: `${targetRect.height + 12}px`,
            borderRadius: "12px",
            border: "2px solid #3b82f6",
          }}
        />
      )}

      {/* Backdrop overlay fallback if target element not found */}
      {!targetRect && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[9990]" />
      )}

      {/* Tooltip Card */}
      <div
        style={tooltipStyle}
        className="w-[360px] max-w-[calc(100vw-32px)] bg-[#18181b] border border-[#3b82f6]/40 rounded-xl p-5 shadow-2xl z-[9999] text-[#fafafa] animate-fade-in-up"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#3b82f6]/20 text-[#3b82f6] text-xs font-bold">
              {currentStep + 1}
            </span>
            <span className="text-xs text-[#a1a1aa] font-medium">
              Step {currentStep + 1} of {steps.length}
            </span>
          </div>
          <button
            onClick={handleSkip}
            className="text-[#a1a1aa] hover:text-[#fafafa] p-1 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <h4 className="text-base font-semibold text-white mb-1.5 flex items-center gap-2">
          {step.title}
        </h4>
        <p className="text-xs text-[#a1a1aa] leading-relaxed mb-4">
          {step.description}
        </p>

        {/* Progress Bar */}
        <div className="w-full bg-white/10 h-1 rounded-full mb-4 overflow-hidden">
          <div
            className="bg-gradient-to-r from-[#3b82f6] to-purple-500 h-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-white/[0.08]">
          <label className="flex items-center gap-2 text-[11px] text-[#a1a1aa] cursor-pointer hover:text-white transition-colors">
            <input
              type="checkbox"
              checked={neverShowAgain}
              onChange={e => setNeverShowAgain(e.target.checked)}
              className="rounded bg-[#27272a] border-white/20 text-[#3b82f6] focus:ring-0 w-3.5 h-3.5"
            />
            Don&apos;t show again
          </label>

          <div className="flex items-center gap-2">
            {!isFirst && (
              <button
                onClick={handleBack}
                className="px-2.5 py-1.5 text-xs text-[#a1a1aa] hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Back
              </button>
            )}

            <button
              onClick={handleNext}
              className="px-3.5 py-1.5 text-xs font-medium text-white bg-[#3b82f6] hover:bg-[#2563eb] rounded-lg transition-colors flex items-center gap-1 shadow-lg shadow-[#3b82f6]/20"
            >
              {isLast ? (
                <>
                  <span>Finish</span>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
