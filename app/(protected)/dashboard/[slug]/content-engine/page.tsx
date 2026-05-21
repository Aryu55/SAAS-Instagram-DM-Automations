"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, 
  Terminal as TerminalIcon, 
  Plus, 
  X, 
  Copy, 
  Sliders, 
  Search, 
  Check, 
  FileText, 
  Compass, 
  Video, 
  Instagram, 
  Tv, 
  Twitter,
  Flame
} from "lucide-react";
import { createAutomationFromContentEngine } from "@/actions/automation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function ContentEnginePage() {
  // State variables
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [triggerKeyword, setTriggerKeyword] = useState("");
  const [dmReplyText, setDmReplyText] = useState("");
  const [commentReplyText, setCommentReplyText] = useState("Sent! Check your DMs.");
  const [isCreatingAutomation, setIsCreatingAutomation] = useState(false);

  const [activeTab, setActiveTab] = useState("console");
  const [topic, setTopic] = useState("");
  
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState("");
  
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [newCompetitor, setNewCompetitor] = useState("");

  const [weights, setWeights] = useState({ views: 40, engagement: 35, comments: 25 });
  const [filters, setFilters] = useState({ minViews: 10000, minEngagement: 2.0 });

  const [voiceScripts, setVoiceScripts] = useState<string[]>([
    "",
    "",
    ""
  ]);

  const [logs, setLogs] = useState<{ message: string; type: string }[]>([
    { message: "Welcome to Phaze AI 4-Agent Pipeline panel.", type: "system" },
    { message: "Configure keywords/handles and press 'Execute AI System' to start.", type: "info" }
  ]);
  const [progress, setProgress] = useState({ percent: 0, message: "System Idle" });
  const [isPipelineRunning, setIsPipelineRunning] = useState(false);
  const [copied, setCopied] = useState(false);

  // Results State
  const [results, setResults] = useState<any>(null);

  const consoleEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminal logs
  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  // Initial mock displays removed

  // Balance weights to sum to 100
  const handleWeightChange = (key: "views" | "engagement" | "comments", val: number) => {
    setWeights(prev => {
      let v = prev.views;
      let e = prev.engagement;
      let c = prev.comments;

      if (key === "views") {
        v = val;
        let rem = 100 - v;
        if (e + c === 0) { e = 1; c = 1; }
        let sumEC = e + c;
        e = Math.round((e / sumEC) * rem);
        c = rem - e;
      } else if (key === "engagement") {
        e = val;
        let rem = 100 - e;
        if (v + c === 0) { v = 1; c = 1; }
        let sumVC = v + c;
        v = Math.round((v / sumVC) * rem);
        c = rem - v;
      } else if (key === "comments") {
        c = val;
        let rem = 100 - c;
        if (v + e === 0) { v = 1; e = 1; }
        let sumVE = v + e;
        v = Math.round((v / sumVE) * rem);
        e = rem - v;
      }

      return { views: v, engagement: e, comments: c };
    });
  };

  // Run content pipeline via API
  const runPipeline = async () => {
    if (isPipelineRunning) return;
    setIsPipelineRunning(true);
    setActiveTab("console");
    setLogs([
      { message: "[System Boot] Pipeline sequence initiated...", type: "system" }
    ]);
    setProgress({ percent: 0, message: "Initializing pipeline..." });

    try {
      const response = await fetch("/api/run-pipeline", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          topic,
          keywords,
          competitors,
          weights,
          filters,
          voiceScripts
        })
      });

      if (!response.body) throw new Error("ReadableStream not supported by browser.");
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() || "";

        for (const rawEvent of events) {
          if (!rawEvent.trim()) continue;

          const lines = rawEvent.split("\n");
          let eventType = "";
          let eventData: any = null;

          for (const line of lines) {
            if (line.startsWith("event: ")) {
              eventType = line.replace("event: ", "").trim();
            } else if (line.startsWith("data: ")) {
              try {
                eventData = JSON.parse(line.replace("data: ", "").trim());
              } catch (e) {
                // Ignore parse errors on partial frames
              }
            }
          }

          if (eventType === "log" && eventData) {
            setLogs(prev => [...prev, { message: eventData.message, type: eventData.type }]);
          } else if (eventType === "progress" && eventData) {
            setProgress({ percent: eventData.percent, message: eventData.message });
          } else if (eventType === "result" && eventData) {
            setResults(eventData);
          }
        }
      }
    } catch (e: any) {
      console.error(e);
      setLogs(prev => [...prev, { message: `CRITICAL ERROR: ${e.message}`, type: "error" }]);
    } finally {
      setIsPipelineRunning(false);
    }
  };

  const getInitialKeyword = (scriptText: string) => {
    if (!scriptText) return "SETUP";
    const parts = scriptText.split("[CTA]");
    if (parts.length > 1) {
      const ctaPart = parts[1];
      const quoteMatch = ctaPart.match(/['"']([A-Z0-9_\-\s]+)['"']/);
      if (quoteMatch && quoteMatch[1]) {
        return quoteMatch[1].trim().toUpperCase();
      }
      const capMatch = ctaPart.match(/\b([A-Z]{3,})\b/);
      if (capMatch && capMatch[0]) {
        return capMatch[0].trim().toUpperCase();
      }
    }
    const quoteMatchAll = scriptText.match(/['"']([A-Z0-9_\-\s]+)['"']/);
    if (quoteMatchAll && quoteMatchAll[1]) {
      return quoteMatchAll[1].trim().toUpperCase();
    }
    return "SETUP";
  };

  const getInitialReplyText = (scriptText: string) => {
    if (!scriptText) return "Here is your link: [Insert Link Here]";
    const parts = scriptText.split("[CTA]");
    if (parts.length > 1) {
      return `Hey! Thanks for commenting. Here is the step-by-step setup documentation we mentioned in the Reel: [Insert Link Here]`;
    }
    return "Hey! Here is the link you requested: [Insert Link Here]";
  };

  useEffect(() => {
    if (results?.script) {
      const parsedKw = getInitialKeyword(results.script);
      setTriggerKeyword(parsedKw);
      setDmReplyText(getInitialReplyText(results.script));
    }
  }, [results]);

  const handleCreateAutomation = async () => {
    if (!triggerKeyword.trim() || !dmReplyText.trim()) {
      toast.error("Keyword and DM message cannot be empty.");
      return;
    }
    setIsCreatingAutomation(true);
    try {
      const res = await createAutomationFromContentEngine(
        topic,
        triggerKeyword.trim(),
        dmReplyText.trim(),
        commentReplyText.trim()
      );
      if (res.status === 200) {
        toast.success(res.data || "Automation created successfully!");
        setIsCreateDialogOpen(false);
      } else {
        toast.error(res.data || "Failed to create automation.");
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred.");
    } finally {
      setIsCreatingAutomation(false);
    }
  };

  const copyScript = () => {
    if (!results) return;
    navigator.clipboard.writeText(results.script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-y-6 text-white min-height-screen pb-10">
      
      {/* Top Welcome Title */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <span className="text-xs uppercase tracking-widest text-[#768BDD] font-bold">Agents Dashboard</span>
          <h2 className="text-3xl font-extrabold flex items-center gap-2">
            AI Content Strategy Engine <Sparkles className="text-purple-500 animate-pulse w-6 h-6" />
          </h2>
          <p className="text-[#9B9CA0] text-sm">
            4-Agent content scraping, viral scoring, voice scripting, and hook generation engine.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-end gap-3 w-full lg:w-auto">
          <div className="flex flex-col w-full sm:w-[320px]">
            <span className="text-[10px] uppercase tracking-wider text-[#9B9CA0] font-bold mb-1">Target Topic Angle</span>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="bg-[#1c1c1e] border border-[#2c2c2e] rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#768BDD] focus:outline-none w-full"
              placeholder="e.g. How to build local AI agents"
            />
          </div>
          <button 
            onClick={runPipeline}
            disabled={isPipelineRunning}
            className="px-6 py-3 rounded-full font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:shadow-[0_0_20px_rgba(168,85,247,0.5)] transition duration-300 disabled:opacity-60 flex items-center justify-center gap-2 w-full sm:w-auto h-[46px]"
          >
            {isPipelineRunning ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Running...
              </span>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Run Pipeline
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex gap-x-2 border-b border-[#333336] overflow-x-auto pb-1">
        {[
          { id: "console", label: "Pipeline Console", icon: <TerminalIcon className="w-4 h-4" /> },
          { id: "scraper", label: "Agent 01 Scraper", icon: <Search className="w-4 h-4" /> },
          { id: "validator", label: "Agent 02 Validator", icon: <Sliders className="w-4 h-4" /> },
          { id: "writer", label: "Agent 03 Writer", icon: <FileText className="w-4 h-4" /> },
          { id: "hooks", label: "Agent 04 Hooks", icon: <Compass className="w-4 h-4" /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium text-sm transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? "border-[#768BDD] text-[#768BDD]" 
                : "border-transparent text-[#9B9CA0] hover:text-white"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Page Body Contents */}
      <div className="mt-4">
        
        {/* ==================== TAB: CONSOLE ==================== */}
        {activeTab === "console" && (
          <div className="grid grid-cols-1 gap-6">
            
            {/* Quick stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#1c1c1e] border border-[#2c2c2e] p-5 rounded-2xl">
                <p className="text-[#9B9CA0] text-xs uppercase tracking-wider">Top View Signal</p>
                <h3 className="text-2xl font-bold mt-1 text-white">
                  {results && results.scrapedPosts.length > 0 ? Math.max(...results.scrapedPosts.map((p: any) => p.views)).toLocaleString() : "0"}
                </h3>
                <span className="text-[10px] text-green-500 font-bold">{results ? "▲ Top Peak" : "-"}</span>
              </div>
              <div className="bg-[#1c1c1e] border border-[#2c2c2e] p-5 rounded-2xl">
                <p className="text-[#9B9CA0] text-xs uppercase tracking-wider">Avg Engagement</p>
                <h3 className="text-2xl font-bold mt-1 text-white">
                  {results && results.scrapedPosts.length > 0 ? (results.scrapedPosts.reduce((acc: number, p: any) => acc + p.er, 0) / results.scrapedPosts.length).toFixed(2) + "%" : "0.00%"}
                </h3>
                <span className="text-[10px] text-purple-400 font-bold">{results ? "▲ Multi-Platform" : "-"}</span>
              </div>
              <div className="bg-[#1c1c1e] border border-[#2c2c2e] p-5 rounded-2xl">
                <p className="text-[#9B9CA0] text-xs uppercase tracking-wider">Posts Analyzed</p>
                <h3 className="text-2xl font-bold mt-1 text-white">{results ? results.scrapedPosts.length : 0}</h3>
                <span className="text-[10px] text-slate-500">Last 7 days window</span>
              </div>
              <div className="bg-[#1c1c1e] border border-[#2c2c2e] p-5 rounded-2xl">
                <p className="text-[#9B9CA0] text-xs uppercase tracking-wider">Recommend Niche</p>
                <h3 className="text-lg font-bold mt-2 text-indigo-400 truncate">
                  {results && results.topics.length > 0 ? results.topics[0].name : "Awaiting Data"}
                </h3>
                <span className="text-[10px] text-indigo-500 font-bold">{results ? "Trend Confidence" : "-"}</span>
              </div>
            </div>

            {/* Terminal Card */}
            <div className="bg-[#0b0f19] border border-[#20283e] rounded-2xl flex flex-col h-[400px] overflow-hidden shadow-2xl">
              <div className="bg-[#080b13] border-b border-[#20283e] px-4 py-3 flex items-center justify-between">
                <div className="flex gap-2">
                  <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                  <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                </div>
                <span className="text-xs font-mono text-[#4e5d80]">claude-code-agent-pipeline</span>
                <div className="w-12"></div>
              </div>
              
              {/* Terminal Logs container */}
              <div className="flex-1 p-5 overflow-y-auto font-mono text-xs space-y-2 select-text">
                {logs.map((log, idx) => (
                  <div key={idx} className="flex gap-x-2">
                    <span className="text-slate-600 select-none">&gt;</span>
                    <span className={
                      log.type === "system" ? "text-indigo-400 font-bold" :
                      log.type === "agent" ? "text-pink-400 font-bold" :
                      log.type === "success" ? "text-green-400 font-bold" :
                      log.type === "warn" ? "text-yellow-500" :
                      log.type === "error" ? "text-red-400 font-bold" : "text-[#b3c5ef]"
                    }>
                      {log.message}
                    </span>
                  </div>
                ))}
                
                {/* Typing caret simulator */}
                {isPipelineRunning && (
                  <div className="flex gap-x-2 items-center">
                    <span className="text-slate-600 select-none">&gt;</span>
                    <span className="w-2 h-4 bg-[#768BDD] animate-ping"></span>
                  </div>
                )}
                <div ref={consoleEndRef}></div>
              </div>

              {/* Stepper progress */}
              <div className="bg-[#080b13] border-t border-[#20283e] px-5 py-4 flex flex-col gap-2">
                <div className="flex justify-between text-xs text-[#9B9CA0]">
                  <span>{progress.message}</span>
                  <span>{progress.percent}%</span>
                </div>
                <div className="w-full bg-[#1c1c1e] h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full transition-all duration-300"
                    style={{ width: `${progress.percent}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
          </div>
        )}

        {/* ==================== TAB: SCRAPER ==================== */}
        {activeTab === "scraper" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Scraper Panel Settings */}
            <div className="bg-[#1c1c1e] border border-[#2c2c2e] p-6 rounded-2xl space-y-6">
              <div>
                <h3 className="text-lg font-bold">Content Scraper Configuration</h3>
                <p className="text-xs text-[#9B9CA0]">Define the competitor handles and keywords you scrape</p>
              </div>

              {/* Keywords Tag Manager */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-white">Keywords</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (document.getElementById("add-kw")?.click())}
                    placeholder="e.g. Cursor IDE"
                    className="flex-1 bg-[#0e0e0e] border border-[#333336] rounded-xl px-4 py-2 text-sm text-white"
                  />
                  <button 
                    id="add-kw"
                    onClick={() => {
                      const trim = newKeyword.trim();
                      if (trim && !keywords.includes(trim)) {
                        setKeywords(prev => [...prev, trim]);
                        setNewKeyword("");
                      }
                    }}
                    className="bg-[#333336] hover:bg-[#444448] text-white p-2.5 rounded-xl text-sm"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {keywords.map(kw => (
                    <span key={kw} className="bg-white/5 border border-white/10 px-3 py-1 rounded-lg text-xs flex items-center gap-1.5 text-[#9B9CA0]">
                      {kw}
                      <X className="w-3 h-3 cursor-pointer text-red-400" onClick={() => setKeywords(prev => prev.filter(k => k !== kw))} />
                    </span>
                  ))}
                </div>
              </div>

              {/* Competitors Tag Manager */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-white">Competitor Handles</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCompetitor}
                    onChange={(e) => setNewCompetitor(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (document.getElementById("add-comp")?.click())}
                    placeholder="e.g. @mreflow"
                    className="flex-1 bg-[#0e0e0e] border border-[#333336] rounded-xl px-4 py-2 text-sm text-white"
                  />
                  <button 
                    id="add-comp"
                    onClick={() => {
                      let trim = newCompetitor.trim();
                      if (trim) {
                        if (!trim.startsWith("@")) trim = "@" + trim;
                        if (!competitors.includes(trim)) {
                          setCompetitors(prev => [...prev, trim]);
                          setNewCompetitor("");
                        }
                      }
                    }}
                    className="bg-[#333336] hover:bg-[#444448] text-white p-2.5 rounded-xl text-sm"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {competitors.map(comp => (
                    <span key={comp} className="bg-white/5 border border-white/10 px-3 py-1 rounded-lg text-xs flex items-center gap-1.5 text-[#9B9CA0]">
                      {comp}
                      <X className="w-3 h-3 cursor-pointer text-red-400" onClick={() => setCompetitors(prev => prev.filter(c => c !== comp))} />
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Scraped posts dashboard */}
            <div className="bg-[#1c1c1e] border border-[#2c2c2e] p-6 rounded-2xl flex flex-col">
              <div className="mb-4">
                <h3 className="text-lg font-bold">Scraped Raw Posts</h3>
                <p className="text-xs text-[#9B9CA0]">Posts collected in current batch</p>
              </div>

              <div className="overflow-x-auto flex-1 rounded-xl border border-white/5">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-[#0e0e0e] border-b border-white/10 text-[#9B9CA0] text-xs">
                      <th className="p-3">Platform</th>
                      <th className="p-3">User</th>
                      <th className="p-3">Views</th>
                      <th className="p-3">ER</th>
                      <th className="p-3">Signal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results && results.scrapedPosts.map((post: any, idx: number) => (
                      <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition">
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                            post.platform === "instagram" ? "bg-pink-500/10 text-pink-500 border border-pink-500/20" :
                            post.platform === "youtube" ? "bg-red-500/10 text-red-500 border border-red-500/20" :
                            "bg-sky-500/10 text-sky-500 border border-sky-500/20"
                          }`}>
                            {post.platform}
                          </span>
                        </td>
                        <td className="p-3 font-semibold">{post.handle}</td>
                        <td className="p-3">{post.views.toLocaleString()}</td>
                        <td className="p-3">{post.er}%</td>
                        <td className="p-3">
                          {post.isViral ? (
                            <span className="bg-purple-500/10 text-purple-400 text-[10px] border border-purple-500/20 px-2 py-0.5 rounded font-bold">VIRAL</span>
                          ) : (
                            <span className="text-[#9B9CA0] text-xs">Standard</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ==================== TAB: VALIDATOR ==================== */}
        {activeTab === "validator" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Scoring settings panel */}
            <div className="bg-[#1c1c1e] border border-[#2c2c2e] p-6 rounded-2xl space-y-6">
              <div>
                <h3 className="text-lg font-bold">Scoring Weights</h3>
                <p className="text-xs text-[#9B9CA0]">Balance views, engagement rate, and comment volume to calculate scores</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-semibold">
                    <span>Views Weight</span>
                    <span className="text-[#768BDD]">{weights.views}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={weights.views}
                    onChange={(e) => handleWeightChange("views", parseInt(e.target.value))}
                    className="w-full accent-indigo-500 bg-white/10 rounded-lg appearance-none h-1.5"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-semibold">
                    <span>Engagement Rate Weight</span>
                    <span className="text-[#768BDD]">{weights.engagement}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={weights.engagement}
                    onChange={(e) => handleWeightChange("engagement", parseInt(e.target.value))}
                    className="w-full accent-indigo-500 bg-white/10 rounded-lg appearance-none h-1.5"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-semibold">
                    <span>Comments Volume Weight</span>
                    <span className="text-[#768BDD]">{weights.comments}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={weights.comments}
                    onChange={(e) => handleWeightChange("comments", parseInt(e.target.value))}
                    className="w-full accent-indigo-500 bg-white/10 rounded-lg appearance-none h-1.5"
                  />
                </div>
              </div>

              <div className="flex h-3 w-full bg-white/5 rounded-full overflow-hidden pt-0.5">
                <div className="bg-indigo-500 h-full" style={{ width: `${weights.views}%` }}></div>
                <div className="bg-purple-500 h-full" style={{ width: `${weights.engagement}%` }}></div>
                <div className="bg-pink-500 h-full" style={{ width: `${weights.comments}%` }}></div>
              </div>

              <div className="border-t border-white/5 pt-4 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-semibold">
                    <span>Minimum Views Filter</span>
                    <span className="text-indigo-400">{filters.minViews.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min="1000"
                    max="50000"
                    step="1000"
                    value={filters.minViews}
                    onChange={(e) => setFilters(prev => ({ ...prev, minViews: parseInt(e.target.value) }))}
                    className="w-full accent-indigo-500 bg-white/10 rounded-lg appearance-none h-1.5"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-semibold">
                    <span>Minimum Engagement Rate</span>
                    <span className="text-indigo-400">{filters.minEngagement}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="10.0"
                    step="0.1"
                    value={filters.minEngagement}
                    onChange={(e) => setFilters(prev => ({ ...prev, minEngagement: parseFloat(e.target.value) }))}
                    className="w-full accent-indigo-500 bg-white/10 rounded-lg appearance-none h-1.5"
                  />
                </div>
              </div>
            </div>

            {/* Validation clusters table */}
            <div className="bg-[#1c1c1e] border border-[#2c2c2e] p-6 rounded-2xl flex flex-col">
              <div className="mb-4">
                <h3 className="text-lg font-bold">Validated Topic Clusters</h3>
                <p className="text-xs text-[#9B9CA0]">Grouped semantic themes ranked by average views</p>
              </div>

              <div className="overflow-x-auto flex-1 rounded-xl border border-white/5">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-[#0e0e0e] border-b border-white/10 text-[#9B9CA0] text-xs">
                      <th className="p-3">Topic Cluster Name</th>
                      <th className="p-3">Hits</th>
                      <th className="p-3">Avg Views</th>
                      <th className="p-3">Engagement Avg</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results && results.topics.map((topic: any, idx: number) => (
                      <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition">
                        <td className="p-3 font-semibold text-white">{topic.name}</td>
                        <td className="p-3 text-[#9B9CA0]">{topic.count} posts</td>
                        <td className="p-3">{topic.avgViews.toLocaleString()}</td>
                        <td className="p-3">
                          <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded text-xs font-semibold">
                            {topic.avgER}% ER
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ==================== TAB: WRITER ==================== */}
        {activeTab === "writer" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left panels: references & voice metrics */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-[#1c1c1e] border border-[#2c2c2e] p-6 rounded-2xl space-y-4">
                <div>
                  <h3 className="text-lg font-bold">Voice training corpus</h3>
                  <p className="text-xs text-[#9B9CA0]">Your past reels scripts used to train tone & energy</p>
                </div>

                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                  {voiceScripts.map((sText, idx) => (
                    <div key={idx} className="space-y-1">
                      <span className="text-xs font-semibold text-[#9B9CA0]">Reference Reel Script 0{idx + 1}</span>
                      <textarea
                        value={sText}
                        onChange={(e) => {
                          const updated = [...voiceScripts];
                          updated[idx] = e.target.value;
                          setVoiceScripts(updated);
                        }}
                        className="w-full bg-[#0e0e0e] border border-[#333336] rounded-xl p-3 text-xs text-[#b3c5ef] h-[100px] outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Vocal metrics */}
              <div className="bg-[#1c1c1e] border border-[#2c2c2e] p-6 rounded-2xl space-y-4">
                <h4 className="text-sm font-bold text-white border-b border-white/5 pb-2">Vocal Profiler Output</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl">
                    <span className="text-[10px] text-[#9B9CA0] uppercase">Hinglish Ratio</span>
                    <p className="text-xs font-bold text-[#768BDD] mt-0.5">
                      {results?.voiceProfile?.hinglishPattern || "-"}
                    </p>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl">
                    <span className="text-[10px] text-[#9B9CA0] uppercase">Sentence Length</span>
                    <p className="text-xs font-bold text-[#768BDD] mt-0.5">
                      {results?.voiceProfile?.sentenceLength || "-"}
                    </p>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl">
                    <span className="text-[10px] text-[#9B9CA0] uppercase">CTA trigger</span>
                    <p className="text-xs font-bold text-[#768BDD] mt-0.5 truncate">
                      {results ? "Comment Trigger" : "-"}
                    </p>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl">
                    <span className="text-[10px] text-[#9B9CA0] uppercase">Energy style</span>
                    <p className="text-xs font-bold text-[#768BDD] mt-0.5">
                      {results?.voiceProfile?.energy || "-"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Virality verification output */}
              <div className="bg-[#1c1c1e] border border-[#2c2c2e] p-6 rounded-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-orange-400" />
                    Agentic Virality Evaluator
                  </h4>
                  {results?.viralityScore && (
                    <span className={`text-xs font-black px-2 py-0.5 rounded ${
                      results.viralityScore >= 80 ? "bg-green-500/10 text-green-400 border border-green-500/20" :
                      results.viralityScore >= 60 ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20" :
                      "bg-red-500/10 text-red-400 border border-red-500/20"
                    }`}>
                      {results.viralityScore}% Score
                    </span>
                  )}
                </div>
                {results ? (
                  <div className="space-y-3">
                    <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
                      <span className="text-[10px] text-[#9B9CA0] uppercase font-bold">Optimization Status</span>
                      <p className="text-xs text-white mt-1 leading-relaxed">
                        {results.viralityScore >= 80 
                          ? "✅ Script compiled with prime viral structures. Self-correction skipped."
                          : `🔄 Self-correction applied. Script optimized to meet virality benchmarks.`}
                      </p>
                    </div>
                    {results.viralityCritique && (
                      <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
                        <span className="text-[10px] text-[#9B9CA0] uppercase font-bold">Evaluation Details</span>
                        <p className="text-xs text-[#b3c5ef] mt-1 leading-relaxed">
                          {results.viralityCritique}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-[#9B9CA0] italic">
                    Awaiting pipeline execution to run the agentic self-correction loop.
                  </p>
                )}
              </div>

            </div>

            {/* Right panels: editor output & angle topic */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              
              {/* Script output editor */}
              <div className="bg-[#1c1c1e] border border-[#2c2c2e] rounded-2xl flex flex-col flex-1 overflow-hidden">
                <div className="bg-[#101012] px-5 py-3 border-b border-white/5 flex justify-between items-center">
                  <span className="text-sm font-bold flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-purple-400" />
                    Structured Screenplay Draft
                  </span>
                  <div className="flex gap-x-2">
                    {results && (
                      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                        <DialogTrigger asChild>
                          <button
                            className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:opacity-90 border border-purple-500/30 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 text-white"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-white animate-pulse" />
                            Create DM Automation
                          </button>
                        </DialogTrigger>
                        <DialogContent className="bg-[#161618] border border-[#2c2c2e] text-white rounded-2xl max-w-md shadow-2xl p-6">
                          <DialogHeader className="space-y-1">
                            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-white">
                              <Sparkles className="text-purple-400 w-5 h-5" />
                              Setup DM Automation
                            </DialogTitle>
                            <DialogDescription className="text-[#9B9CA0] text-xs">
                              Link this screenplay&apos;s call-to-action to your Instagram DM automations.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <label className="text-xs font-semibold text-white uppercase tracking-wider">Trigger Keyword</label>
                              <input
                                type="text"
                                value={triggerKeyword}
                                onChange={(e) => setTriggerKeyword(e.target.value.toUpperCase())}
                                className="w-full bg-[#0e0e0f] border border-[#2c2c2e] rounded-xl px-4 py-2 text-sm text-white focus:border-[#768BDD] focus:outline-none"
                                placeholder="e.g. AGENTS"
                              />
                              <p className="text-[10px] text-[#9B9CA0]">Users commenting this keyword on your post will trigger the DM.</p>
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-semibold text-white uppercase tracking-wider">DM Reply Message</label>
                              <textarea
                                value={dmReplyText}
                                onChange={(e) => setDmReplyText(e.target.value)}
                                className="w-full bg-[#0e0e0f] border border-[#2c2c2e] rounded-xl p-3 text-sm text-white h-[100px] focus:border-[#768BDD] focus:outline-none resize-none"
                                placeholder="Write the DM content with your links..."
                              />
                              <p className="text-[10px] text-[#9B9CA0]">The private message sent to the user&apos;s Instagram inbox.</p>
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-semibold text-white uppercase tracking-wider">Comment Auto-Reply</label>
                              <input
                                type="text"
                                value={commentReplyText}
                                onChange={(e) => setCommentReplyText(e.target.value)}
                                className="w-full bg-[#0e0e0f] border border-[#2c2c2e] rounded-xl px-4 py-2 text-sm text-white focus:border-[#768BDD] focus:outline-none"
                                placeholder="e.g. Sent! Check your DMs."
                              />
                              <p className="text-[10px] text-[#9B9CA0]">Public reply written on the user&apos;s comment.</p>
                            </div>
                          </div>
                          <DialogFooter className="pt-2">
                            <button
                              onClick={handleCreateAutomation}
                              disabled={isCreatingAutomation || !triggerKeyword.trim() || !dmReplyText.trim()}
                              className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-sm hover:shadow-[0_0_15px_rgba(168,85,247,0.4)] transition duration-300 disabled:opacity-50 flex items-center justify-center gap-2 text-white"
                            >
                              {isCreatingAutomation ? (
                                <>
                                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                  Creating...
                                </>
                              ) : (
                                "Confirm & Create"
                              )}
                            </button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                    <button 
                      onClick={copyScript}
                      disabled={!results}
                      className="bg-[#2c2c2e] hover:bg-[#3d3d40] border border-white/10 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50 text-white"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-green-400" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>
                <textarea
                  value={results ? results.script : ""}
                  onChange={(e) => setResults((prev: any) => ({ ...prev, script: e.target.value }))}
                  placeholder="Run pipeline to generate script..."
                  className="flex-1 bg-transparent p-5 text-sm leading-relaxed text-[#b3c5ef] font-medium h-[280px] outline-none resize-none"
                />
              </div>

              {/* Angle selector */}
              <div className="bg-[#1c1c1e] border border-[#2c2c2e] p-5 rounded-2xl">
                <label className="text-xs uppercase tracking-wider text-[#9B9CA0] font-bold block mb-1">Today&apos;s Reel Topic Angle</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full bg-[#0e0e0e] border border-[#333336] rounded-xl px-4 py-2.5 text-sm text-white"
                />
              </div>

            </div>

          </div>
        )}

        {/* ==================== TAB: HOOKS ==================== */}
        {activeTab === "hooks" && (
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Banner selection */}
            {results && results.recommendedHook && (
              <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-500/30 p-5 rounded-2xl space-y-1">
                <span className="text-[10px] text-indigo-400 uppercase font-bold tracking-widest block">Recommended Hook Selection</span>
                <p className="text-lg font-bold text-white italic">
                  &quot;{results.recommendedHook.text}&quot;
                </p>
                <span className="text-xs text-[#9B9CA0] block pt-1">
                  Pattern: {results.recommendedHook.pattern} | Confidence: {results.recommendedHook.confidence}/10
                </span>
              </div>
            )}

            {/* List of 5 hooks */}
            <div className="bg-[#1c1c1e] border border-[#2c2c2e] p-6 rounded-2xl space-y-6">
              <div>
                <h3 className="text-lg font-bold">5 Viral Hook Variations</h3>
                <p className="text-xs text-[#9B9CA0]">Variations structured around high performing retention metrics</p>
              </div>

              <div className="space-y-4">
                {results ? results.hooks.map((hook: any) => {
                  const isRec = results.recommendedHook && results.recommendedHook.id === hook.id;
                  return (
                    <div 
                      key={hook.id} 
                      className={`p-5 rounded-xl border transition ${
                        isRec 
                          ? "border-indigo-500/40 bg-gradient-to-r from-indigo-500/5 to-transparent hover:bg-indigo-500/10" 
                          : "border-white/5 bg-white/2 hover:border-white/10 hover:bg-white/5"
                      }`}
                    >
                      <div className="flex justify-between items-center text-xs mb-2">
                        <span className={`font-bold ${isRec ? "text-indigo-400" : "text-pink-400"}`}>
                          {isRec ? "★ RECOMMENDED PATTERN" : hook.pattern}
                        </span>
                        <span className="text-green-400 font-semibold">Confidence: {hook.confidence}/10</span>
                      </div>
                      <p className="text-base font-bold text-white mb-2 italic">&quot;{hook.text}&quot;</p>
                      <p className="text-xs text-[#9B9CA0]">{hook.explanation}</p>
                    </div>
                  );
                }) : (
                  <p className="text-center text-[#9B9CA0] py-10">No hooks generated. Please execute the content pipeline.</p>
                )}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
