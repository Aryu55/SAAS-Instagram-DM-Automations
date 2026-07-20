"use client";

import React, { useState } from "react";
import { 
  Flame, 
  Sparkles, 
  TrendingUp, 
  ChevronRight, 
  FileText, 
  Check, 
  Copy, 
  Plus, 
  RotateCcw,
  Zap,
  BookOpen,
  ArrowRight,
  Info,
  Maximize2,
  FileCode,
  ShieldCheck,
  AlertTriangle,
  Lightbulb
} from "lucide-react";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend
} from "recharts";

interface MetricBreakdown {
  hookStrength: number;
  pacing: number;
  emotionalValence: number;
  ctaEngagement: number;
  retentionValue: number;
}

interface RetentionPoint {
  time: number;
  retention: number;
}

interface Suggestion {
  original: string;
  replacement: string;
  reason: string;
}

interface AnalysisResult {
  score: number;
  metrics: MetricBreakdown;
  simulatedRetention: RetentionPoint[];
  critique: {
    hook: string;
    body: string;
    cta: string;
  };
  suggestions: Suggestion[];
}

interface ApiResponse {
  versionA: AnalysisResult;
  versionB: AnalysisResult | null;
}

export default function ViralityPage() {
  const [scriptA, setScriptA] = useState<string>(
    `Suno yaar, agar aap log abhi bhi manually outreach kar rahe ho, toh time waste kar rahe ho! 

Ek simple automation setup aa chuka hai jo direct links send kar deta hai. 

Maine isko try kiya aur leads double ho gaye. 

For full setup detail comment "OUTREACH" and script links will follow.`
  );
  const [scriptB, setScriptB] = useState<string>(
    `Stop manually sending DMs! ❌ 99% of creators are wasting hours copy-pasting links. 

Here is how I automated my entire Instagram funnel in 10 minutes. 

Comment "GROWTH" below, and I'll instantly DM you my secret templates and direct workflow links! 🚀`
  );
  
  const [platform, setPlatform] = useState<string>("instagram");
  const [niche, setNiche] = useState<string>("tech");
  const [language, setLanguage] = useState<string>("hinglish");
  
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [results, setResults] = useState<ApiResponse | null>(null);
  const [activeTab, setActiveTab] = useState<"critique" | "suggestions">("suggestions");
  const [activeCompareVersion, setActiveCompareVersion] = useState<"versionA" | "versionB">("versionA");
  
  const [copied, setCopied] = useState<boolean>(false);

  const handleEvaluate = async () => {
    setLoading(true);
    setResults(null);
    console.log("ℹ️ [Janus UI Engine] Initiating virality script prediction...", {
      platform,
      niche,
      language,
      isComparing,
      scriptASize: scriptA?.length || 0,
      scriptBSize: isComparing ? scriptB?.length : 0
    });
    try {
      const response = await fetch("/api/predict-virality", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          scriptA,
          scriptB: isComparing ? scriptB : undefined,
          platform,
          niche,
          language,
        }),
      });

      if (!response.ok) {
        throw new Error("Evaluation failed");
      }

      const data = await response.json();
      console.log("✅ [Janus UI Engine] Virality prediction response received:", data);
      setResults(data);
      toast.success("Virality prediction complete!");
    } catch (err: any) {
      console.error("❌ [Janus UI Engine] Virality evaluation failed:", err.message);
      toast.error(err.message || "Failed to analyze scripts.");
    } finally {
      setLoading(false);
    }
  };

  const handleApplySuggestion = (original: string, replacement: string, version: "versionA" | "versionB") => {
    if (version === "versionA") {
      if (scriptA.includes(original)) {
        setScriptA(prev => prev.replace(original, replacement));
        toast.success("Optimized suggestion applied to Version A!");
      } else {
        toast.error("Original text block was modified. Cannot apply suggestion automatically.");
      }
    } else {
      if (scriptB.includes(original)) {
        setScriptB(prev => prev.replace(original, replacement));
        toast.success("Optimized suggestion applied to Version B!");
      } else {
        toast.error("Original text block was modified. Cannot apply suggestion automatically.");
      }
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Script copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  // Process charts data format
  const getRadarData = () => {
    if (!results) return [];
    const metricsNames: { key: keyof MetricBreakdown; label: string }[] = [
      { key: "hookStrength", label: "Hook Quality" },
      { key: "pacing", label: "Pacing/Rhythm" },
      { key: "emotionalValence", label: "Emotional Arousal" },
      { key: "ctaEngagement", label: "CTA Automation" },
      { key: "retentionValue", label: "Value Density" }
    ];

    return metricsNames.map(m => {
      const item: any = {
        subject: m.label,
        A: results.versionA.metrics[m.key] * 10,
      };
      if (results.versionB) {
        item.B = results.versionB.metrics[m.key] * 10;
      }
      return item;
    });
  };

  const getRetentionData = () => {
    if (!results) return [];
    const pointsA = results.versionA.simulatedRetention;
    const pointsB = results.versionB?.simulatedRetention || [];
    
    // Merge points by time
    const timePoints = Array.from(new Set([
      ...pointsA.map(p => p.time),
      ...pointsB.map(p => p.time)
    ])).sort((a, b) => a - b);

    return timePoints.map(t => {
      const ptA = pointsA.find(p => p.time === t);
      const ptB = pointsB.find(p => p.time === t);
      
      const item: any = {
        time: `${t}s`,
        "Version A": ptA ? ptA.retention : undefined
      };
      if (results.versionB) {
        item["Version B"] = ptB ? ptB.retention : undefined;
      }
      return item;
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400 border-green-500/20 bg-green-500/5";
    if (score >= 60) return "text-yellow-400 border-yellow-500/20 bg-yellow-500/5";
    return "text-red-400 border-red-500/20 bg-red-500/5";
  };

  return (
    <div className="flex flex-col gap-y-8 p-4 lg:p-6 text-[var(--text-primary)] pr-2 lg:pr-6">
      {/* Page Header */}
      <div className="flex flex-col gap-y-2 border-b border-[var(--border-color)] pb-6 mt-2 animate-fade-in-up">
        <span className="inline-flex items-center gap-x-1.5 px-3 py-1 bg-[var(--accent-whisper)] border border-[var(--accent-veil)] text-[var(--accent-magenta)] text-[9px] font-bold tracking-wider uppercase rounded-full w-fit" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>
          Prediction Engine
        </span>
        <h1 className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] leading-none tracking-tight" style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>
          Virality Predictor Model
        </h1>
        <p className="text-[var(--text-secondary)] text-sm max-w-[65ch] leading-relaxed">
          Grade your short-form scripts, simulate audience retention, and apply AI self-correction algorithms.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Left Column: Script Editor Panel */}
        <div className="xl:col-span-6 flex flex-col gap-y-6">
          <div className="border border-[var(--border-color)] bg-[var(--card-bg)] p-5 flex flex-col gap-y-6 shadow-sm relative overflow-hidden rounded-xl">
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[var(--accent-whisper)] rounded-full blur-[120px] pointer-events-none" />
            
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-x-2">
                <FileCode className="h-5 w-5 text-[var(--accent-magenta)]" />
                Script Setup Panel
              </h2>
              <div className="flex items-center gap-x-2 bg-[var(--page-bg)]/50 p-1 rounded-lg border border-[var(--border-color)]">
                <button
                  onClick={() => setIsComparing(false)}
                  className={`text-[10px] px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider transition-smooth ${!isComparing ? "bg-[var(--accent-magenta)] text-white shadow-sm" : "text-[var(--text-secondary)] hover:text-[var(--accent-magenta)]"}`}
                  style={{ fontFamily: "var(--font-space-grotesk), monospace" }}
                >
                  Single Script
                </button>
                <button
                  onClick={() => setIsComparing(true)}
                  className={`text-[10px] px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider transition-smooth ${isComparing ? "bg-[var(--accent-magenta)] text-white shadow-sm" : "text-[var(--text-secondary)] hover:text-[var(--accent-magenta)]"}`}
                  style={{ fontFamily: "var(--font-space-grotesk), monospace" }}
                >
                  Compare Drafts
                </button>
              </div>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-y-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-secondary)]" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>Target Platform</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="bg-[var(--page-bg)] border border-[var(--border-color)] rounded-lg px-3 py-2.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-magenta)]/30 transition duration-150"
                >
                  <option value="instagram" className="bg-[var(--card-bg)] text-[var(--text-primary)]">Instagram Reels</option>
                  <option value="youtube" className="bg-[var(--card-bg)] text-[var(--text-primary)]">YouTube Shorts</option>
                  <option value="tiktok" className="bg-[var(--card-bg)] text-[var(--text-primary)]">TikTok Video</option>
                </select>
              </div>

              <div className="flex flex-col gap-y-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-secondary)]" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>Audience Niche</label>
                <select
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  className="bg-[var(--page-bg)] border border-[var(--border-color)] rounded-lg px-3 py-2.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-magenta)]/30 transition duration-150"
                >
                  <option value="tech" className="bg-[var(--card-bg)] text-[var(--text-primary)]">Tech & Automation</option>
                  <option value="business" className="bg-[var(--card-bg)] text-[var(--text-primary)]">Business & Marketing</option>
                  <option value="finance" className="bg-[var(--card-bg)] text-[var(--text-primary)]">Finance & Wealth</option>
                  <option value="productivity" className="bg-[var(--card-bg)] text-[var(--text-primary)]">Productivity & Detox</option>
                  <option value="creative" className="bg-[var(--card-bg)] text-[var(--text-primary)]">Creative & Copy</option>
                  <option value="general" className="bg-[var(--card-bg)] text-[var(--text-primary)]">Self Help / Recovery</option>
                </select>
              </div>

              <div className="flex flex-col gap-y-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-secondary)]" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>Primary Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="bg-[var(--page-bg)] border border-[var(--border-color)] rounded-lg px-3 py-2.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-magenta)]/30 transition duration-150"
                >
                  <option value="hinglish" className="bg-[var(--card-bg)] text-[var(--text-primary)]">Hinglish (Hindi+Eng)</option>
                  <option value="english" className="bg-[var(--card-bg)] text-[var(--text-primary)]">Pure English</option>
                  <option value="hindi" className="bg-[var(--card-bg)] text-[var(--text-primary)]">Pure Hindi</option>
                </select>
              </div>
            </div>

            {/* Editor Blocks */}
            <div className="flex flex-col gap-y-4">
              <div className="flex flex-col gap-y-2">
                <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                  <span className="font-bold text-[var(--accent-magenta)] uppercase tracking-wider text-[9px]" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>Script Version A (Primary)</span>
                  <span className="font-bold text-[10px] tracking-tight" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>{scriptA.split(/\s+/).filter(Boolean).length} words</span>
                </div>
                <textarea
                  value={scriptA}
                  onChange={(e) => setScriptA(e.target.value)}
                  placeholder="Paste your primary short form script content here..."
                  rows={8}
                  className="bg-[var(--page-bg)]/30 border border-[var(--border-color)] rounded-lg p-4 text-xs text-[var(--text-primary)] font-mono leading-relaxed focus:outline-none focus:border-[var(--accent-magenta)]/30 focus:bg-[var(--page-bg)]/50 transition duration-150 resize-y"
                />
              </div>

              {isComparing && (
                <div className="flex flex-col gap-y-2 animate-in fade-in-50 duration-200">
                  <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                    <span className="font-bold text-[var(--accent-magenta)] uppercase tracking-wider text-[9px]" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>Script Version B (Comparison)</span>
                    <span className="font-bold text-[10px] tracking-tight" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>{scriptB.split(/\s+/).filter(Boolean).length} words</span>
                  </div>
                  <textarea
                    value={scriptB}
                    onChange={(e) => setScriptB(e.target.value)}
                    placeholder="Paste secondary comparison script draft here..."
                    rows={8}
                    className="bg-[var(--page-bg)]/30 border border-[var(--border-color)] rounded-lg p-4 text-xs text-[var(--text-primary)] font-mono leading-relaxed focus:outline-none focus:border-[var(--accent-magenta)]/30 focus:bg-[var(--page-bg)]/50 transition duration-150 resize-y"
                  />
                </div>
              )}
            </div>

            <button
              onClick={handleEvaluate}
              disabled={loading || !scriptA.trim()}
              className="w-full bg-[var(--text-primary)] text-[var(--page-bg)] hover:bg-[var(--accent-magenta)] hover:text-white border border-[var(--border-color)] rounded-lg py-3.5 font-bold uppercase tracking-wider transition-smooth shadow-sm flex items-center justify-center gap-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontFamily: "var(--font-space-grotesk), monospace" }}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-current" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Running Pipeline Optimization...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 fill-current" />
                  Analyze Script Virality
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Analytics Results Panel */}
        <div className="xl:col-span-6 flex flex-col gap-y-6">
          {!results ? (
            <div className="border border-[var(--border-color)] bg-[var(--card-bg)] p-10 flex flex-col items-center justify-center text-center shadow-sm min-h-[550px] relative overflow-hidden rounded-xl">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-[var(--accent-whisper)] rounded-full blur-[140px] pointer-events-none" />
              
              <div className="bg-[var(--page-bg)] border border-[var(--border-color)] p-5 rounded-xl mb-6">
                <Flame className="h-12 w-12 text-[var(--text-secondary)] animate-pulse" />
              </div>
              <h3 className="text-2xl font-bold mb-2 text-[var(--text-primary)]" style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>Predictions Queue Empty</h3>
              <p className="text-xs text-[var(--text-secondary)] max-w-sm mb-8 font-medium leading-relaxed">
                Paste your short-form screenplay draft and hit analyze to project script retention flow and receive optimized feedback coordinates.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full text-left">
                <div className="bg-[var(--page-bg)]/50 border border-[var(--border-color)] p-4 rounded-xl">
                  <Sparkles className="h-5 w-5 text-[var(--accent-magenta)] mb-2" />
                  <h4 className="text-xs font-bold text-[var(--text-primary)] mb-1">Radar Dimensions</h4>
                  <p className="text-[10px] text-[var(--text-secondary)] font-medium leading-relaxed">Calculates quality markers across hook, pacing, emotion, and automation CTAs.</p>
                </div>
                <div className="bg-[var(--page-bg)]/50 border border-[var(--border-color)] p-4 rounded-xl">
                  <TrendingUp className="h-5 w-5 text-[var(--accent-magenta)] mb-2" />
                  <h4 className="text-xs font-bold text-[var(--text-primary)] mb-1">Retention Curves</h4>
                  <p className="text-[10px] text-[var(--text-secondary)] font-medium leading-relaxed">Simulates audience decay coordinates across timelines to spot drop-off points.</p>
                </div>
                <div className="bg-[var(--page-bg)]/50 border border-[var(--border-color)] p-4 rounded-xl">
                  <Lightbulb className="h-5 w-5 text-[var(--accent-magenta)] mb-2" />
                  <h4 className="text-xs font-bold text-[var(--text-primary)] mb-1">AI Self-Correction</h4>
                  <p className="text-[10px] text-[var(--text-secondary)] font-medium leading-relaxed">Provides line-by-line script replacements with first-principles reasoning.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-y-6">
              {/* KPI Score and Visualizers */}
              <div className="border border-[var(--border-color)] bg-[var(--card-bg)] p-5 flex flex-col gap-y-6 shadow-sm relative overflow-hidden rounded-xl">
                <div className="absolute top-0 left-0 w-[200px] h-[200px] bg-[var(--accent-whisper)] rounded-full blur-[100px] pointer-events-none" />
                
                <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-x-2">
                  <TrendingUp className="h-5 w-5 text-[var(--accent-magenta)]" />
                  Virality Analytics Metrics
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Version A Score */}
                  <div className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center relative overflow-hidden ${getScoreColor(results.versionA.score)}`}>
                    <span className="text-[10px] font-bold tracking-wider uppercase opacity-75 mb-2" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>Version A Score</span>
                    <span className="text-5xl font-black" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>{results.versionA.score}%</span>
                    
                    <div className="flex items-center gap-x-1.5 mt-3 text-[10px] uppercase font-bold tracking-wider bg-[var(--page-bg)] border border-[var(--border-color)] px-3 py-1 rounded-full text-[var(--text-primary)]" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                      {results.versionA.score >= 80 ? "Viral Candidate" : results.versionA.score >= 60 ? "Moderate Standard" : "High Dropoff Risk"}
                    </div>
                  </div>

                  {/* Version B Score (or fallback box) */}
                  {results.versionB ? (
                    <div className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center relative overflow-hidden ${getScoreColor(results.versionB.score)}`}>
                      <span className="text-[10px] font-bold tracking-wider uppercase opacity-75 mb-2" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>Version B Score</span>
                      <span className="text-5xl font-black" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>{results.versionB.score}%</span>
                      <div className="flex items-center gap-x-1.5 mt-3 text-[10px] uppercase font-bold tracking-wider bg-[var(--page-bg)] border border-[var(--border-color)] px-3 py-1 rounded-full text-[var(--text-primary)]" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                        {results.versionB.score >= 80 ? "Viral Candidate" : results.versionB.score >= 60 ? "Moderate Standard" : "High Dropoff Risk"}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--page-bg)]/30 flex flex-col items-center justify-center text-center text-[var(--text-secondary)]">
                      <Info className="h-5 w-5 mb-2 text-[var(--text-tertiary)]" />
                      <span className="text-xs font-semibold text-[var(--text-primary)]">No Comparison Active</span>
                      <span className="text-[9px] mt-1 uppercase font-bold tracking-wider" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>Enable compare drafts mode to benchmark scripts side-by-side.</span>
                    </div>
                  )}
                </div>

                {/* Radar Chart */}
                <div className="flex flex-col gap-y-2 mt-2">
                  <h4 className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>Metrics Vector Assessment</h4>
                  <div className="w-full flex justify-center py-4 bg-[var(--page-bg)]/30 border border-[var(--border-color)] rounded-xl">
                    <ResponsiveContainer width="100%" height={240}>
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={getRadarData()}>
                        <PolarGrid stroke="var(--border-color)" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: "var(--text-secondary)", fontSize: 10, fontWeight: 500 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "var(--text-tertiary)", fontSize: 8 }} />
                        <Radar
                          name="Version A"
                          dataKey="A"
                          stroke="var(--accent-magenta)"
                          fill="var(--accent-magenta)"
                          fillOpacity={0.35}
                        />
                        {results.versionB && (
                          <Radar
                            name="Version B"
                            dataKey="B"
                            stroke="var(--text-primary)"
                            fill="var(--text-primary)"
                            fillOpacity={0.25}
                          />
                        )}
                        <Legend wrapperStyle={{ fontSize: 10, fill: "var(--text-primary)" }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Retention Chart */}
                <div className="flex flex-col gap-y-2">
                  <h4 className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>Simulated Retention Projection</h4>
                  <div className="w-full py-4 bg-[var(--page-bg)]/30 border border-[var(--border-color)] rounded-xl pr-6">
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={getRetentionData()}>
                        <defs>
                          <linearGradient id="colorA" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--accent-magenta)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="var(--accent-magenta)" stopOpacity={0} />
                          </linearGradient>
                          {results.versionB && (
                            <linearGradient id="colorB" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="var(--text-primary)" stopOpacity={0.2} />
                              <stop offset="95%" stopColor="var(--text-primary)" stopOpacity={0} />
                            </linearGradient>
                          )}
                        </defs>
                        <XAxis dataKey="time" stroke="var(--border-color)" tick={{ fill: "var(--text-secondary)", fontSize: 10 }} />
                        <YAxis unit="%" stroke="var(--border-color)" tick={{ fill: "var(--text-secondary)", fontSize: 10 }} domain={[0, 100]} />
                        <RechartsTooltip contentStyle={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border-color)", color: "var(--text-primary)", borderRadius: "8px", fontSize: 11 }} />
                        <Area
                          type="monotone"
                          dataKey="Version A"
                          stroke="var(--accent-magenta)"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorA)"
                        />
                        {results.versionB && (
                          <Area
                            type="monotone"
                            dataKey="Version B"
                            stroke="var(--text-primary)"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorB)"
                          />
                        )}
                        <Legend wrapperStyle={{ fontSize: 10, fill: "var(--text-primary)" }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Critiques and Suggestions */}
              <div className="border border-[var(--border-color)] bg-[var(--card-bg)] p-5 flex flex-col gap-y-4 shadow-sm relative rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-x-2">
                    <button
                      onClick={() => setActiveTab("suggestions")}
                      className={`text-xs uppercase tracking-wider font-bold pb-1.5 border-b-2 transition duration-200 ${activeTab === "suggestions" ? "text-[var(--accent-magenta)] border-[var(--accent-magenta)]" : "text-[var(--text-secondary)] border-transparent hover:text-[var(--accent-magenta)]"}`}
                      style={{ fontFamily: "var(--font-space-grotesk), monospace" }}
                    >
                      AI Optimization Tips
                    </button>
                    <button
                      onClick={() => setActiveTab("critique")}
                      className={`text-xs uppercase tracking-wider font-bold pb-1.5 border-b-2 transition duration-200 ${activeTab === "critique" ? "text-[var(--accent-magenta)] border-[var(--accent-magenta)]" : "text-[var(--text-secondary)] border-transparent hover:text-[var(--accent-magenta)]"}`}
                      style={{ fontFamily: "var(--font-space-grotesk), monospace" }}
                    >
                      Vector Feedback Critique
                    </button>
                  </div>

                  {results.versionB && (
                    <div className="flex items-center gap-x-1.5 bg-[var(--page-bg)] border border-[var(--border-color)] p-0.5 rounded-lg text-xs">
                      <button
                        onClick={() => setActiveCompareVersion("versionA")}
                        className={`px-2 py-1 rounded-lg font-bold uppercase tracking-wider text-[9px] ${activeCompareVersion === "versionA" ? "bg-[var(--accent-magenta)] text-white" : "text-[var(--text-secondary)]"}`}
                        style={{ fontFamily: "var(--font-space-grotesk), monospace" }}
                      >
                        Ver A
                      </button>
                      <button
                        onClick={() => setActiveCompareVersion("versionB")}
                        className={`px-2 py-1 rounded-lg font-bold uppercase tracking-wider text-[9px] ${activeCompareVersion === "versionB" ? "bg-[var(--text-primary)] text-white" : "text-[var(--text-secondary)]"}`}
                        style={{ fontFamily: "var(--font-space-grotesk), monospace" }}
                      >
                        Ver B
                      </button>
                    </div>
                  )}
                </div>

                {/* Tab content: Suggestions */}
                {activeTab === "suggestions" && (
                  <div className="flex flex-col gap-y-3.5 mt-2">
                    {(() => {
                      const versionObj = activeCompareVersion === "versionA" ? results.versionA : results.versionB;
                      if (!versionObj || versionObj.suggestions.length === 0) {
                        return (
                          <div className="flex items-center gap-x-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-3.5 rounded-lg font-bold uppercase tracking-wider" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>
                            <Check className="h-4 w-4" />
                            No optimizations needed.
                          </div>
                        );
                      }
                      return versionObj.suggestions.map((s, idx) => (
                        <div key={idx} className="bg-[var(--page-bg)]/30 border border-[var(--border-color)] rounded-xl p-4 flex flex-col gap-y-3 relative">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--accent-magenta)] bg-[var(--accent-whisper)] border border-[var(--accent-veil)] px-2 py-0.5 rounded-full" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>
                              Refinement #{idx + 1}
                            </span>
                            <button
                              onClick={() => handleApplySuggestion(s.original, s.replacement, activeCompareVersion)}
                              className="text-[9px] bg-[var(--card-bg)] border border-[var(--border-color)] hover:bg-[var(--accent-magenta)] hover:border-[var(--accent-magenta)] hover:text-white px-2.5 py-1 rounded-lg font-bold uppercase tracking-wider transition duration-150 flex items-center gap-x-1"
                              style={{ fontFamily: "var(--font-space-grotesk), monospace" }}
                            >
                              <Plus className="h-3 w-3" />
                              Apply to Editor
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                            <div className="flex flex-col gap-y-1">
                              <span className="text-[9px] font-bold text-red-500 uppercase tracking-wider" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>Original</span>
                              <div className="bg-red-500/5 border border-red-500/10 p-2.5 rounded-lg text-[var(--text-secondary)] line-through leading-relaxed">
                                {s.original}
                              </div>
                            </div>
                            <div className="flex flex-col gap-y-1">
                              <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>Optimized Replacement</span>
                              <div className="bg-emerald-500/5 border border-emerald-500/10 p-2.5 rounded-lg text-[var(--text-primary)] leading-relaxed">
                                {s.replacement}
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-x-2 items-start mt-1 text-[11px] text-[var(--text-secondary)] font-medium">
                            <Lightbulb className="h-4.5 w-4.5 text-yellow-500 shrink-0 mt-0.5" />
                            <span><strong className="text-[var(--text-primary)]">Reasoning:</strong> {s.reason}</span>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                )}

                {/* Tab content: Critique */}
                {activeTab === "critique" && (
                  <div className="flex flex-col gap-y-3 mt-2">
                    {(() => {
                      const versionObj = activeCompareVersion === "versionA" ? results.versionA : results.versionB;
                      if (!versionObj) return null;
                      return (
                        <div className="grid grid-cols-1 gap-3.5 text-xs leading-relaxed">
                          <div className="bg-[var(--page-bg)]/30 border border-[var(--border-color)] p-3.5 rounded-xl flex items-start gap-x-3">
                            <div className="bg-[var(--accent-whisper)] border border-[var(--accent-veil)] p-2 rounded-lg text-[var(--accent-magenta)] shrink-0">
                              <Sparkles className="h-4.5 w-4.5" />
                            </div>
                            <div className="flex flex-col gap-y-1">
                              <span className="font-bold text-[var(--text-primary)] uppercase text-[10px] tracking-wider" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>Hook Vector Feedback</span>
                              <p className="text-[var(--text-secondary)] font-medium">{versionObj.critique.hook}</p>
                            </div>
                          </div>

                          <div className="bg-[var(--page-bg)]/30 border border-[var(--border-color)] p-3.5 rounded-xl flex items-start gap-x-3">
                            <div className="bg-[var(--accent-whisper)] border border-[var(--accent-veil)] p-2 rounded-lg text-[var(--text-primary)] shrink-0">
                              <TrendingUp className="h-4.5 w-4.5" />
                            </div>
                            <div className="flex flex-col gap-y-1">
                              <span className="font-bold text-[var(--text-primary)] uppercase text-[10px] tracking-wider" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>Pacing & Body Flow</span>
                              <p className="text-[var(--text-secondary)] font-medium">{versionObj.critique.body}</p>
                            </div>
                          </div>

                          <div className="bg-[var(--page-bg)]/30 border border-[var(--border-color)] p-3.5 rounded-xl flex items-start gap-x-3">
                            <div className="bg-[var(--accent-whisper)] border border-[var(--accent-veil)] p-2 rounded-lg text-[var(--text-secondary)] shrink-0">
                              <Flame className="h-4.5 w-4.5" />
                            </div>
                            <div className="flex flex-col gap-y-1">
                              <span className="font-bold text-[var(--text-primary)] uppercase text-[10px] tracking-wider" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>Engagement CTA Check</span>
                              <p className="text-[var(--text-secondary)] font-medium">{versionObj.critique.cta}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Footer Copy Tool */}
                <div className="flex justify-end gap-x-3 border-t border-[var(--border-color)] pt-4 mt-2">
                  <button
                    onClick={() => handleCopy(activeCompareVersion === "versionA" ? scriptA : scriptB)}
                    className="bg-[var(--card-bg)] border border-[var(--border-color)] hover:bg-[var(--accent-magenta)] hover:border-[var(--accent-magenta)] hover:text-white px-4 py-2 rounded-lg text-[10px] uppercase font-bold tracking-wider flex items-center gap-x-1.5 transition duration-150"
                    style={{ fontFamily: "var(--font-space-grotesk), monospace" }}
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                        Copied Script
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
                        Copy Script
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
