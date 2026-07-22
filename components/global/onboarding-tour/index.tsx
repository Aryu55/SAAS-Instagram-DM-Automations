"use client";

import React, { useState, useEffect } from "react";
import {
  Brain, Bot, Video, Flame, Activity, X, ChevronRight,
  ChevronLeft, Sparkles, CheckCircle2, ArrowRight
} from "lucide-react";

const TOUR_STEPS = [
  {
    step: 1,
    badge: "Welcome",
    title: "Welcome to Janus AI",
    subtitle: "Autonomous Content Engine & DM Automation Powerhouse",
    description:
      "Janus AI combines AI content pipelines, SOP skill management, viral research, and automated Instagram DM lead capture into one unified command center.",
    icon: <Brain className="w-8 h-8 text-purple-400" />,
    gradient: "from-purple-900/60 via-indigo-950/60 to-black",
    highlight: "All-in-One AI Command Center"
  },
  {
    step: 2,
    badge: "Engagement",
    title: "Instagram Automations",
    subtitle: "Convert Comments & DMs into Sales Automatically",
    description:
      "Set up keyword triggers and Smart AI listeners. When followers comment on your reels or message your profile, Janus AI responds instantly within seconds.",
    icon: <Bot className="w-8 h-8 text-blue-400" />,
    gradient: "from-blue-900/60 via-cyan-950/60 to-black",
    highlight: "24/7 Lead Capture Engine"
  },
  {
    step: 3,
    badge: "Creation",
    title: "Content Engine & Skills",
    subtitle: "AI Scripting, SOP Skills & Reference Videos",
    description:
      "Upload SOP skills, attach /watch reference videos for custom editing styles, and let the 4-agent Content Engine generate high-retention video concepts.",
    icon: <Video className="w-8 h-8 text-pink-400" />,
    gradient: "from-pink-900/60 via-rose-950/60 to-black",
    highlight: "Automated Video Pipeline"
  },
  {
    step: 4,
    badge: "Intelligence",
    title: "Viral Analyzer (/analyze)",
    subtitle: "Reverse-Engineer Viral Content Science",
    description:
      "Paste any video URL or batch analyze multiple links to extract exact hooks (first 3 seconds), video formats, storytelling arcs, and complete transcripts.",
    icon: <Flame className="w-8 h-8 text-rose-400" />,
    gradient: "from-rose-900/60 via-orange-950/60 to-black",
    highlight: "Competitive Intelligence"
  },
  {
    step: 5,
    badge: "Diagnostics",
    title: "Activity Ledger (/activity)",
    subtitle: "Real-Time Message Firings & Error Traces",
    description:
      "Track every outbound DM, inbound comment, and failed execution. If an automation doesn't fire, the Activity ledger displays the red error notice right there.",
    icon: <Activity className="w-8 h-8 text-emerald-400" />,
    gradient: "from-emerald-900/60 via-teal-950/60 to-black",
    highlight: "Live Error Diagnostics"
  }
];

export function OnboardingTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Check if user has already completed/skipped the tour
    const completed = localStorage.getItem("janus_onboarding_completed");
    if (!completed) {
      // Small delay for smooth entry
      const timer = setTimeout(() => setIsOpen(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    // Global event listener to manual trigger onboarding anytime (e.g. Help button)
    const handleReopen = () => {
      setCurrentStep(0);
      setIsOpen(true);
    };
    window.addEventListener("open-janus-onboarding", handleReopen);
    return () => window.removeEventListener("open-janus-onboarding", handleReopen);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem("janus_onboarding_completed", "true");
    setIsOpen(false);
  };

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleDismiss();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  if (!isOpen) return null;

  const current = TOUR_STEPS[currentStep];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dark Overlay */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity duration-300"
        onClick={handleDismiss}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10 animate-fade-in-up">
        {/* Header Gradient Banner */}
        <div className={`p-6 bg-gradient-to-b ${current.gradient} border-b border-[var(--border-color)] relative transition-all duration-500`}>
          <div className="flex items-center justify-between mb-4">
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-black/40 text-white/90 border border-white/10 backdrop-blur-sm"
              style={{ fontFamily: "var(--font-space-grotesk), monospace" }}
            >
              Step {current.step} of {TOUR_STEPS.length} — {current.badge}
            </span>
            <button
              onClick={handleDismiss}
              className="text-xs font-semibold text-zinc-400 hover:text-white flex items-center gap-1 bg-black/30 hover:bg-black/50 px-2.5 py-1 rounded-lg transition-smooth"
            >
              <span>Skip Walkthrough</span>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-x-4">
            <div className="p-3 rounded-xl bg-black/40 border border-white/10 shrink-0 backdrop-blur-sm">
              {current.icon}
            </div>
            <div>
              <h2
                className="text-2xl font-bold text-white leading-tight"
                style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
              >
                {current.title}
              </h2>
              <p className="text-xs text-white/70 mt-1 font-medium">
                {current.subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Slide Body */}
        <div className="p-6 flex flex-col gap-y-4">
          <div className="rounded-xl bg-[var(--page-bg)] border border-[var(--border-color)] p-4 flex items-start gap-x-3">
            <Sparkles className="w-4 h-4 text-[var(--accent-magenta)] shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-magenta)] font-mono">
                Key Highlight
              </span>
              <p className="text-xs font-bold text-[var(--text-primary)] mt-0.5">
                {current.highlight}
              </p>
            </div>
          </div>

          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            {current.description}
          </p>

          {/* Progress Indicators */}
          <div className="flex items-center justify-center gap-1.5 pt-2">
            {TOUR_STEPS.map((s, idx) => (
              <button
                key={s.step}
                onClick={() => setCurrentStep(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  currentStep === idx
                    ? "w-6 bg-[var(--accent-magenta)]"
                    : "w-2 bg-[var(--border-color)] hover:bg-[var(--text-tertiary)]"
                }`}
                aria-label={`Go to step ${s.step}`}
              />
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[var(--page-bg)] border-t border-[var(--border-color)] flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className="flex items-center gap-x-1 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-30 disabled:hover:text-[var(--text-secondary)] transition-smooth px-3 py-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

          <button
            onClick={handleNext}
            className="flex items-center gap-x-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl px-5 py-2.5 text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-smooth shadow-md"
            style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
          >
            {currentStep === TOUR_STEPS.length - 1 ? (
              <>
                <span>Get Started</span>
                <CheckCircle2 className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>Next Step</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
