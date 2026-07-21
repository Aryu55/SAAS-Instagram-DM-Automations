"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getOrganizationConfig } from "@/actions/factory";
import { analyzeVideo, batchAnalyzeVideos, getAnalyzedVideos } from "@/actions/intelligence/analyze";
import { toast } from "sonner";
import {
  BrainCircuit, Search, Play, LayoutTemplate,
  Lightbulb, Loader2, Link as LinkIcon, FileText,
  Sparkles, CheckCircle2, BarChart3
} from "lucide-react";

export default function AnalyzerPage() {
  const params = useParams();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const queryClient = useQueryClient();

  const [urlInput, setUrlInput] = useState("");
  const [selectedPost, setSelectedPost] = useState<any>(null);

  // Fetch Org
  const { data: orgData } = useQuery({
    queryKey: ["org-config", slug],
    queryFn: () => getOrganizationConfig(slug!),
    enabled: !!slug,
  });
  const orgId = orgData?.status === 200 ? (orgData.data as any)?.id : null;

  // Fetch Analyzed Videos
  const { data: analyzedData, isLoading } = useQuery({
    queryKey: ["analyzed-videos", orgId],
    queryFn: () => getAnalyzedVideos(orgId!),
    enabled: !!orgId,
  });
  const videos = analyzedData?.status === 200 ? (analyzedData.data as any[]) : [];

  // Mutations
  const analyzeMut = useMutation({
    mutationFn: async (url: string) => {
      // Split by lines or commas if multiple URLs
      const urls = url.split(/[\n,]+/).map(u => u.trim()).filter(u => !!u);
      if (urls.length === 0) throw new Error("Please provide at least one URL");
      
      if (urls.length === 1) {
        const res = await analyzeVideo(orgId!, urls[0]);
        if (res.status !== 200) throw new Error(res.error || "Failed to analyze");
        return res;
      } else {
        const res = await batchAnalyzeVideos(orgId!, urls);
        if (res.status !== 200) throw new Error(res.error || "Failed batch analysis");
        return res;
      }
    },
    onSuccess: (res: any) => {
      toast.success(res.count ? `Analyzed ${res.count} videos!` : "Video Analyzed Successfully!");
      setUrlInput("");
      queryClient.invalidateQueries({ queryKey: ["analyzed-videos", orgId] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <div className="flex flex-col gap-y-6 p-4 lg:p-6 text-[var(--text-primary)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-y-4">
        <div>
          <h1
            className="text-3xl font-bold flex items-center gap-2"
            style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
          >
            <BrainCircuit className="w-8 h-8 text-[var(--accent-magenta)]" />
            Viral Analyzer
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Reverse engineer any viral video to extract the exact hook, format, and storytelling structure.
          </p>
        </div>
      </div>

      {/* Input Section */}
      <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-6 shadow-sm flex flex-col gap-4">
        <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider" style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>
          Analyze Video URL(s)
        </label>
        
        <div className="flex flex-col md:flex-row gap-3">
          <textarea
            rows={1}
            placeholder="Paste Instagram Reel or TikTok URL... (paste multiple lines for batch analysis)"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            className="w-full bg-[var(--page-bg)] border border-[var(--border-color)] rounded-xl p-4 text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-magenta)]/40 transition-smooth resize-none min-h-[60px]"
          />
          <button
            onClick={() => analyzeMut.mutate(urlInput)}
            disabled={!urlInput.trim() || analyzeMut.isPending}
            className="flex items-center justify-center gap-x-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl px-6 py-4 text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-smooth shadow-sm disabled:opacity-50 min-w-[200px] whitespace-nowrap"
            style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
          >
            {analyzeMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {analyzeMut.isPending ? "Analyzing..." : urlInput.includes("\n") ? "Batch Analyze" : "Analyze Video"}
          </button>
        </div>
      </div>

      {/* Analyzer History / Results Grid */}
      <div>
        <h2 className="text-lg font-bold mb-4" style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>
          Analysis Library
        </h2>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Skeleton Loading State for Premium Feel */}
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-5 animate-pulse flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-zinc-800/50 rounded-lg"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-1/2 bg-zinc-800/50 rounded"></div>
                    <div className="h-2 w-1/3 bg-zinc-800/30 rounded"></div>
                  </div>
                </div>
                <div className="h-20 bg-zinc-800/20 rounded-lg w-full"></div>
                <div className="flex justify-between">
                  <div className="h-2 w-1/4 bg-zinc-800/30 rounded"></div>
                  <div className="h-2 w-1/4 bg-zinc-800/30 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="p-4 bg-[var(--page-bg)] border border-[var(--border-color)] rounded-xl mb-4">
              <Search className="w-8 h-8 text-[var(--text-tertiary)]" />
            </div>
            <h3 className="text-xl font-bold text-[var(--text-primary)]" style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>
              No Videos Analyzed Yet
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-2 max-w-sm">
              Paste a video link above to extract its script, hook, and storytelling formula.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map((vid) => {
              const data = vid.analysisData || {};
              return (
                <button
                  key={vid.id}
                  onClick={() => setSelectedPost(vid)}
                  className="group text-left rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] overflow-hidden hover:border-[var(--accent-magenta)]/40 transition-all duration-300 hover:shadow-lg hover:shadow-[var(--accent-magenta)]/5 flex flex-col justify-between"
                >
                  <div className="p-4 border-b border-[var(--border-color)] bg-[var(--page-bg)] flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <LinkIcon className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                      <span className="text-[10px] text-[var(--text-secondary)] font-mono truncate w-40">
                        {vid.url}
                      </span>
                    </div>
                    {vid.status === "COMPLETED" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                    )}
                  </div>

                  <div className="p-5 flex-1 flex flex-col gap-y-4">
                    {/* Hook Section */}
                    <div>
                      <span className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider flex items-center gap-1 mb-1.5" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>
                        <Play className="w-3 h-3 text-rose-400" /> The Hook
                      </span>
                      <p className="text-sm font-semibold text-[var(--text-primary)] line-clamp-2 leading-tight">
                        &quot;{data.hook}&quot;
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-1">
                      {/* Format */}
                      <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-2.5">
                        <span className="text-[8px] font-bold text-purple-400/80 uppercase tracking-wider block mb-1">Format</span>
                        <p className="text-[10px] font-medium text-purple-200 line-clamp-1">{data.format}</p>
                      </div>
                      
                      {/* Structure */}
                      <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-lg p-2.5">
                        <span className="text-[8px] font-bold text-cyan-400/80 uppercase tracking-wider block mb-1">Structure</span>
                        <p className="text-[10px] font-medium text-cyan-200 line-clamp-1">{data.storytellingStructure}</p>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Side Panel Detail View */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedPost(null)} />
          <div className="relative w-full max-w-xl bg-[var(--card-bg)] border-l border-[var(--border-color)] overflow-y-auto shadow-2xl">
            <div className="p-6 flex flex-col gap-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-[var(--text-primary)]" style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>
                    Viral Analysis Report
                  </h2>
                  <a href={selectedPost.url} target="_blank" rel="noreferrer" className="text-xs text-[var(--accent-magenta)] hover:underline mt-1 flex items-center gap-1">
                    <LinkIcon className="w-3 h-3" /> {selectedPost.url}
                  </a>
                </div>
                <button onClick={() => setSelectedPost(null)} className="p-2 hover:bg-[var(--page-bg)] rounded-lg transition-smooth">
                  <span className="text-2xl leading-none">&times;</span>
                </button>
              </div>

              {/* Data Cards */}
              {selectedPost.analysisData && (
                <div className="space-y-4">
                  {/* The Hook */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-rose-950/40 to-pink-900/20 border border-rose-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Play className="w-4 h-4 text-rose-400" />
                      <h3 className="text-xs font-bold text-rose-300 uppercase tracking-wider">The Hook (First 3 Seconds)</h3>
                    </div>
                    <p className="text-lg font-black text-white italic leading-tight">
                      &quot;{selectedPost.analysisData.hook}&quot;
                    </p>
                  </div>

                  {/* Format & Structure */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-[var(--page-bg)] border border-[var(--border-color)]">
                      <div className="flex items-center gap-2 mb-2">
                        <LayoutTemplate className="w-4 h-4 text-purple-400" />
                        <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Video Format</h3>
                      </div>
                      <p className="text-sm font-bold text-purple-300">
                        {selectedPost.analysisData.format}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-[var(--page-bg)] border border-[var(--border-color)]">
                      <div className="flex items-center gap-2 mb-2">
                        <BarChart3 className="w-4 h-4 text-cyan-400" />
                        <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Storytelling Arc</h3>
                      </div>
                      <p className="text-sm font-bold text-cyan-300">
                        {selectedPost.analysisData.storytellingStructure}
                      </p>
                    </div>
                  </div>

                  {/* Key Takeaway */}
                  <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="w-4 h-4 text-emerald-400" />
                      <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Key Takeaway</h3>
                    </div>
                    <p className="text-sm text-emerald-100/90 leading-relaxed">
                      {selectedPost.analysisData.keyTakeaway}
                    </p>
                  </div>

                  {/* Full Transcript */}
                  <div className="mt-6">
                    <div className="flex items-center gap-2 mb-3 border-b border-[var(--border-color)] pb-2">
                      <FileText className="w-4 h-4 text-[var(--text-secondary)]" />
                      <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Full Transcript</h3>
                    </div>
                    <div className="bg-[var(--page-bg)] border border-[var(--border-color)] rounded-xl p-4 max-h-60 overflow-y-auto">
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-mono whitespace-pre-wrap">
                        {selectedPost.transcript || "No transcript available."}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
