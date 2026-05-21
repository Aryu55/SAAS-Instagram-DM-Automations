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
      setResults(data);
      toast.success("Virality prediction complete!");
    } catch (err: any) {
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
    <div className="flex flex-col gap-y-8 p-6 lg:p-8 bg-[#121212] min-h-screen text-white">
      {/* Page Header */}
      <div className="flex flex-col gap-y-2">
        <div className="flex items-center gap-x-3">
          <div className="bg-gradient-to-tr from-pink-500 to-rose-500 p-2.5 rounded-xl shadow-[0_0_15px_rgba(236,72,153,0.3)]">
            <Flame className="h-6 w-6 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-[#E2E8F0] to-[#94A3B8] bg-clip-text text-transparent">
              Virality Predictor Model
            </h1>
            <p className="text-sm text-[#9B9CA0]">
              Grade your short-form scripts, simulate audience retention, and apply AI self-correction algorithms.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Left Column: Script Editor Panel */}
        <div className="xl:col-span-6 flex flex-col gap-y-6">
          <div className="bg-[#1D1D1D] rounded-2xl border border-white/[0.08] p-5 flex flex-col gap-y-6 shadow-xl relative overflow-hidden backdrop-blur-md">
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none" />
            
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-x-2">
                <FileCode className="h-5 w-5 text-indigo-400" />
                Script Setup Panel
              </h2>
              <div className="flex items-center gap-x-2 bg-white/[0.03] p-1 rounded-xl border border-white/[0.05]">
                <button
                  onClick={() => setIsComparing(false)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition duration-200 ${!isComparing ? "bg-indigo-600 text-white shadow-md" : "text-[#9B9CA0] hover:text-white"}`}
                >
                  Single Script
                </button>
                <button
                  onClick={() => setIsComparing(true)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition duration-200 ${isComparing ? "bg-indigo-600 text-white shadow-md" : "text-[#9B9CA0] hover:text-white"}`}
                >
                  Compare Drafts (A vs B)
                </button>
              </div>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-y-1.5">
                <label className="text-xs font-semibold text-[#9B9CA0]">Target Platform</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition duration-200"
                >
                  <option value="instagram" className="bg-[#1D1D1D]">Instagram Reels</option>
                  <option value="youtube" className="bg-[#1D1D1D]">YouTube Shorts</option>
                  <option value="tiktok" className="bg-[#1D1D1D]">TikTok Video</option>
                </select>
              </div>

              <div className="flex flex-col gap-y-1.5">
                <label className="text-xs font-semibold text-[#9B9CA0]">Audience Niche</label>
                <select
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  className="bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition duration-200"
                >
                  <option value="tech" className="bg-[#1D1D1D]">Tech & Coding</option>
                  <option value="business" className="bg-[#1D1D1D]">Business / SaaS</option>
                  <option value="fitness" className="bg-[#1D1D1D]">Fitness / Health</option>
                  <option value="education" className="bg-[#1D1D1D]">Education / Finance</option>
                  <option value="lifestyle" className="bg-[#1D1D1D]">Lifestyle / Vlog</option>
                </select>
              </div>

              <div className="flex flex-col gap-y-1.5">
                <label className="text-xs font-semibold text-[#9B9CA0]">Primary Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition duration-200"
                >
                  <option value="hinglish" className="bg-[#1D1D1D]">Hinglish (Hindi+Eng)</option>
                  <option value="english" className="bg-[#1D1D1D]">Pure English</option>
                  <option value="hindi" className="bg-[#1D1D1D]">Pure Hindi</option>
                </select>
              </div>
            </div>

            {/* Editor Blocks */}
            <div className="flex flex-col gap-y-4">
              <div className="flex flex-col gap-y-2">
                <div className="flex items-center justify-between text-xs text-[#9B9CA0]">
                  <span className="font-semibold text-indigo-400">Script Version A (Primary)</span>
                  <span>{scriptA.split(/\s+/).filter(Boolean).length} words</span>
                </div>
                <textarea
                  value={scriptA}
                  onChange={(e) => setScriptA(e.target.value)}
                  placeholder="Paste your primary short form script content here..."
                  rows={8}
                  className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-4 text-sm text-white font-mono leading-relaxed focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.03] transition duration-200 resize-y"
                />
              </div>

              {isComparing && (
                <div className="flex flex-col gap-y-2 animate-in fade-in-50 duration-200">
                  <div className="flex items-center justify-between text-xs text-[#9B9CA0]">
                    <span className="font-semibold text-pink-400">Script Version B (Comparison)</span>
                    <span>{scriptB.split(/\s+/).filter(Boolean).length} words</span>
                  </div>
                  <textarea
                    value={scriptB}
                    onChange={(e) => setScriptB(e.target.value)}
                    placeholder="Paste secondary comparison script draft here..."
                    rows={8}
                    className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-4 text-sm text-white font-mono leading-relaxed focus:outline-none focus:border-pink-500/50 focus:bg-white/[0.03] transition duration-200 resize-y"
                  />
                </div>
              )}
            </div>

            <button
              onClick={handleEvaluate}
              disabled={loading || !scriptA.trim()}
              className="w-full bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white rounded-xl py-3.5 font-bold transition duration-200 shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Running Pipeline Optimization...
                </>
              ) : (
                <>
                  <Zap className="h-5 w-5 fill-current" />
                  Analyze Script Virality
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Analytics Results Panel */}
        <div className="xl:col-span-6 flex flex-col gap-y-6">
          {!results ? (
            <div className="bg-[#1D1D1D] rounded-2xl border border-white/[0.08] p-10 flex flex-col items-center justify-center text-center shadow-xl min-h-[550px] relative overflow-hidden">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-pink-600/5 rounded-full blur-[140px] pointer-events-none" />
              
              <div className="bg-white/[0.02] border border-white/[0.05] p-5 rounded-full mb-6">
                <Flame className="h-12 w-12 text-[#9B9CA0] animate-pulse" />
              </div>
              <h3 className="text-xl font-bold mb-2">Predictions Queue Empty</h3>
              <p className="text-sm text-[#9B9CA0] max-w-sm mb-8">
                Paste your short-form screenplay draft and hit analyze to project script retention flow and receive optimized feedback coordinates.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full text-left">
                <div className="bg-white/[0.02] border border-white/[0.04] p-4 rounded-xl">
                  <Sparkles className="h-5 w-5 text-indigo-400 mb-2" />
                  <h4 className="text-xs font-bold text-white mb-1">Radar Dimensions</h4>
                  <p className="text-[11px] text-[#9B9CA0]">Calculates quality markers across hook, pacing, emotion, and automation CTAs.</p>
                </div>
                <div className="bg-white/[0.02] border border-white/[0.04] p-4 rounded-xl">
                  <TrendingUp className="h-5 w-5 text-pink-400 mb-2" />
                  <h4 className="text-xs font-bold text-white mb-1">Retention Curves</h4>
                  <p className="text-[11px] text-[#9B9CA0]">Simulates audience decay coordinates across timelines to spot drop-off points.</p>
                </div>
                <div className="bg-white/[0.02] border border-white/[0.04] p-4 rounded-xl">
                  <Lightbulb className="h-5 w-5 text-yellow-400 mb-2" />
                  <h4 className="text-xs font-bold text-white mb-1">AI Self-Correction</h4>
                  <p className="text-[11px] text-[#9B9CA0]">Provides line-by-line script replacements with first-principles reasoning.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-y-6">
              {/* KPI Score and Visualizers */}
              <div className="bg-[#1D1D1D] rounded-2xl border border-white/[0.08] p-5 flex flex-col gap-y-6 shadow-xl relative overflow-hidden backdrop-blur-md">
                <div className="absolute top-0 left-0 w-[200px] h-[200px] bg-green-500/5 rounded-full blur-[100px] pointer-events-none" />
                
                <h3 className="text-lg font-semibold flex items-center gap-x-2">
                  <TrendingUp className="h-5 w-5 text-indigo-400" />
                  Virality Analytics Metrics
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Version A Score */}
                  <div className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center relative overflow-hidden ${getScoreColor(results.versionA.score)}`}>
                    <span className="text-[11px] font-bold tracking-widest uppercase opacity-70 mb-2">Version A Score</span>
                    <span className="text-5xl font-black">{results.versionA.score}%</span>
                    
                    <div className="flex items-center gap-x-1.5 mt-3 text-xs bg-white/[0.03] border border-white/[0.05] px-2.5 py-1 rounded-full text-white">
                      <ShieldCheck className="h-3.5 w-3.5 text-green-400" />
                      {results.versionA.score >= 80 ? "Viral Candidate" : results.versionA.score >= 60 ? "Moderate Standard" : "High Dropoff Risk"}
                    </div>
                  </div>

                  {/* Version B Score (or fallback box) */}
                  {results.versionB ? (
                    <div className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center relative overflow-hidden ${getScoreColor(results.versionB.score)}`}>
                      <span className="text-[11px] font-bold tracking-widest uppercase opacity-70 mb-2">Version B Score</span>
                      <span className="text-5xl font-black">{results.versionB.score}%</span>
                      
                      <div className="flex items-center gap-x-1.5 mt-3 text-xs bg-white/[0.03] border border-white/[0.05] px-2.5 py-1 rounded-full text-white">
                        <ShieldCheck className="h-3.5 w-3.5 text-green-400" />
                        {results.versionB.score >= 80 ? "Viral Candidate" : results.versionB.score >= 60 ? "Moderate Standard" : "High Dropoff Risk"}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.01] flex flex-col items-center justify-center text-center text-[#9B9CA0]">
                      <Info className="h-5 w-5 mb-2 text-[#545454]" />
                      <span className="text-xs font-semibold">No Comparison Active</span>
                      <span className="text-[10px] mt-1">Enable compare drafts mode to benchmark scripts side-by-side.</span>
                    </div>
                  )}
                </div>

                {/* Radar Chart */}
                <div className="flex flex-col gap-y-2 mt-2">
                  <h4 className="text-xs font-bold text-[#9B9CA0] uppercase tracking-wider">Metrics Vector Assessment</h4>
                  <div className="w-full flex justify-center py-4 bg-white/[0.01] border border-white/[0.04] rounded-xl">
                    <ResponsiveContainer width="100%" height={240}>
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={getRadarData()}>
                        <PolarGrid stroke="rgba(255,255,255,0.08)" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: "#9B9CA0", fontSize: 10 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#545454", fontSize: 8 }} />
                        <Radar
                          name="Version A"
                          dataKey="A"
                          stroke="#6366f1"
                          fill="#6366f1"
                          fillOpacity={0.35}
                        />
                        {results.versionB && (
                          <Radar
                            name="Version B"
                            dataKey="B"
                            stroke="#ec4899"
                            fill="#ec4899"
                            fillOpacity={0.35}
                          />
                        )}
                        <Legend wrapperStyle={{ fontSize: 10, fill: "#fff" }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Retention Chart */}
                <div className="flex flex-col gap-y-2">
                  <h4 className="text-xs font-bold text-[#9B9CA0] uppercase tracking-wider">Simulated Retention Projection</h4>
                  <div className="w-full py-4 bg-white/[0.01] border border-white/[0.04] rounded-xl pr-6">
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={getRetentionData()}>
                        <defs>
                          <linearGradient id="colorA" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                          </linearGradient>
                          {results.versionB && (
                            <linearGradient id="colorB" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                            </linearGradient>
                          )}
                        </defs>
                        <XAxis dataKey="time" stroke="#545454" tick={{ fill: "#9B9CA0", fontSize: 10 }} />
                        <YAxis unit="%" stroke="#545454" tick={{ fill: "#9B9CA0", fontSize: 10 }} domain={[0, 100]} />
                        <RechartsTooltip contentStyle={{ backgroundColor: "#1D1D1D", borderColor: "rgba(255,255,255,0.08)", color: "#fff" }} />
                        <Area
                          type="monotone"
                          dataKey="Version A"
                          stroke="#6366f1"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorA)"
                        />
                        {results.versionB && (
                          <Area
                            type="monotone"
                            dataKey="Version B"
                            stroke="#ec4899"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorB)"
                          />
                        )}
                        <Legend wrapperStyle={{ fontSize: 10, fill: "#fff" }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Critiques and Suggestions */}
              <div className="bg-[#1D1D1D] rounded-2xl border border-white/[0.08] p-5 flex flex-col gap-y-4 shadow-xl backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-x-2">
                    <button
                      onClick={() => setActiveTab("suggestions")}
                      className={`text-sm font-semibold pb-1.5 border-b-2 transition duration-200 ${activeTab === "suggestions" ? "text-indigo-400 border-indigo-500" : "text-[#9B9CA0] border-transparent hover:text-white"}`}
                    >
                      AI Optimization Tips
                    </button>
                    <button
                      onClick={() => setActiveTab("critique")}
                      className={`text-sm font-semibold pb-1.5 border-b-2 transition duration-200 ${activeTab === "critique" ? "text-indigo-400 border-indigo-500" : "text-[#9B9CA0] border-transparent hover:text-white"}`}
                    >
                      Vector Feedback Critique
                    </button>
                  </div>

                  {results.versionB && (
                    <div className="flex items-center gap-x-1.5 bg-white/[0.03] border border-white/[0.05] p-0.5 rounded-lg text-xs">
                      <button
                        onClick={() => setActiveCompareVersion("versionA")}
                        className={`px-2 py-1 rounded ${activeCompareVersion === "versionA" ? "bg-indigo-600 text-white font-medium" : "text-[#9B9CA0]"}`}
                      >
                        Ver A
                      </button>
                      <button
                        onClick={() => setActiveCompareVersion("versionB")}
                        className={`px-2 py-1 rounded ${activeCompareVersion === "versionB" ? "bg-pink-600 text-white font-medium" : "text-[#9B9CA0]"}`}
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
                          <div className="flex items-center gap-x-2 text-xs text-green-400 bg-green-500/5 border border-green-500/10 p-3.5 rounded-xl">
                            <Check className="h-4 w-4" />
                            No optimizations needed. Script matches prime structural markers.
                          </div>
                        );
                      }
                      return versionObj.suggestions.map((s, idx) => (
                        <div key={idx} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 flex flex-col gap-y-3 relative">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 bg-indigo-500/5 border border-indigo-500/10 px-2 py-0.5 rounded">
                              Refinement #{idx + 1}
                            </span>
                            <button
                              onClick={() => handleApplySuggestion(s.original, s.replacement, activeCompareVersion)}
                              className="text-[10px] bg-white/[0.05] border border-white/[0.08] hover:bg-indigo-600 hover:border-indigo-500 hover:text-white px-2.5 py-1 rounded-md font-semibold transition duration-150 flex items-center gap-x-1"
                            >
                              <Plus className="h-3 w-3" />
                              Apply to Editor
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                            <div className="flex flex-col gap-y-1">
                              <span className="text-[10px] font-semibold text-red-400 uppercase tracking-wider">Original</span>
                              <div className="bg-red-500/5 border border-red-500/10 p-2.5 rounded-lg text-white/90 line-through leading-relaxed">
                                {s.original}
                              </div>
                            </div>
                            <div className="flex flex-col gap-y-1">
                              <span className="text-[10px] font-semibold text-green-400 uppercase tracking-wider">Optimized Replacement</span>
                              <div className="bg-green-500/5 border border-green-500/10 p-2.5 rounded-lg text-white leading-relaxed">
                                {s.replacement}
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-x-2 items-start mt-1 text-[11px] text-[#9B9CA0]">
                            <Lightbulb className="h-4.5 w-4.5 text-yellow-400 shrink-0 mt-0.5" />
                            <span><strong className="text-white">Reasoning:</strong> {s.reason}</span>
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
                          <div className="bg-white/[0.02] border border-white/[0.04] p-3.5 rounded-xl flex items-start gap-x-3">
                            <div className="bg-indigo-500/5 border border-indigo-500/15 p-2 rounded-lg text-indigo-400 shrink-0">
                              <Sparkles className="h-4.5 w-4.5" />
                            </div>
                            <div className="flex flex-col gap-y-1">
                              <span className="font-bold text-white uppercase text-[10px] tracking-wider">Hook Vector Feedback</span>
                              <p className="text-[#9B9CA0]">{versionObj.critique.hook}</p>
                            </div>
                          </div>

                          <div className="bg-white/[0.02] border border-white/[0.04] p-3.5 rounded-xl flex items-start gap-x-3">
                            <div className="bg-pink-500/5 border border-pink-500/15 p-2 rounded-lg text-pink-400 shrink-0">
                              <TrendingUp className="h-4.5 w-4.5" />
                            </div>
                            <div className="flex flex-col gap-y-1">
                              <span className="font-bold text-white uppercase text-[10px] tracking-wider">Pacing & Body Flow</span>
                              <p className="text-[#9B9CA0]">{versionObj.critique.body}</p>
                            </div>
                          </div>

                          <div className="bg-white/[0.02] border border-white/[0.04] p-3.5 rounded-xl flex items-start gap-x-3">
                            <div className="bg-yellow-500/5 border border-yellow-500/15 p-2 rounded-lg text-yellow-400 shrink-0">
                              <Flame className="h-4.5 w-4.5" />
                            </div>
                            <div className="flex flex-col gap-y-1">
                              <span className="font-bold text-white uppercase text-[10px] tracking-wider">Engagement CTA Check</span>
                              <p className="text-[#9B9CA0]">{versionObj.critique.cta}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Footer Copy Tool */}
                <div className="flex justify-end gap-x-3 border-t border-white/[0.06] pt-4 mt-2">
                  <button
                    onClick={() => handleCopy(activeCompareVersion === "versionA" ? scriptA : scriptB)}
                    className="bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-x-1.5 transition duration-150"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-green-400" />
                        Copied Script
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-[#9B9CA0]" />
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
