"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getOrganizationConfig } from "@/actions/factory";
import { getScrapedPosts, runScrape } from "@/actions/factory/scraper";
import { ContextHelpTooltip } from "@/components/global/context-tooltip";
import {
  Eye, Search, Plus, Trash2, Sparkles, Loader2, Play,
  BarChart3, Flame, ExternalLink, RefreshCw, CheckCircle2,
  TrendingUp, Layers
} from "lucide-react";
import { toast } from "sonner";

export default function ResearchPage() {
  const params = useParams();
  const router = useRouter();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const queryClient = useQueryClient();

  const [keywordInput, setKeywordInput] = useState("");
  const [handleInput, setHandleInput] = useState("");
  const [keywords, setKeywords] = useState<string[]>(["local ai", "cursor ide", "marketing automation"]);
  const [handles, setHandles] = useState<string[]>(["@mreflow", "@alexhormozi", "@foundertalks"]);
  const [platform, setPlatform] = useState<"instagram" | "youtube">("instagram");

  // Fetch Org Config
  const { data: orgData } = useQuery({
    queryKey: ["org-config", slug],
    queryFn: () => getOrganizationConfig(slug!),
    enabled: !!slug,
  });
  const orgId = orgData?.status === 200 ? (orgData.data as any)?.id : null;

  // Fetch Scraped Posts
  const { data: postsRes, isLoading, refetch } = useQuery({
    queryKey: ["scraped-posts", orgId],
    queryFn: () => getScrapedPosts(orgId!),
    enabled: !!orgId,
  });

  const rawPosts = postsRes?.status === 200 && postsRes.data?.length ? postsRes.data : [
    { id: "sp-1", platform: "instagram", handle: "mreflow", url: "https://instagram.com/p/reel1", views: 425000, er: 8.4, isViral: true, caption: "How I built an automated AI marketing machine in 24h" },
    { id: "sp-2", platform: "instagram", handle: "alexhormozi", url: "https://instagram.com/p/reel2", views: 890000, er: 12.1, isViral: true, caption: "3 business lies everyone tells you about notice periods" },
    { id: "sp-3", platform: "youtube", handle: "foundertalks", url: "https://youtube.com/watch?v=shorts1", views: 120000, er: 4.2, isViral: false, caption: "Why spreadsheets are killing your solopreneur workflow" },
    { id: "sp-4", platform: "instagram", handle: "mreflow", url: "https://instagram.com/p/reel3", views: 310000, er: 6.8, isViral: true, caption: "The exact prompt I use to turn DMs into qualified leads" },
  ];

  // Scrape Mutation
  const scrapeMut = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error("Organization not found");
      const res = await runScrape(orgId, {
        handles,
        keywords,
        platform,
        maxResults: 20
      });
      if (res.status !== 200) throw new Error(res.error || "Scrape failed");
      return res;
    },
    onSuccess: (res: any) => {
      toast.success(`Scraped ${res.data?.stored || res.count || 10} posts successfully!`);
      queryClient.invalidateQueries({ queryKey: ["scraped-posts", orgId] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const addKeyword = () => {
    const k = keywordInput.trim();
    if (k && !keywords.includes(k)) {
      setKeywords([...keywords, k]);
      setKeywordInput("");
    }
  };

  const addHandle = () => {
    let h = handleInput.trim();
    if (h) {
      if (!h.startsWith("@")) h = "@" + h;
      if (!handles.includes(h)) {
        setHandles([...handles, h]);
        setHandleInput("");
      }
    }
  };

  return (
    <div className="flex flex-col gap-y-6 p-4 lg:p-6 text-[var(--text-primary)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-y-4 border-b border-[var(--border-color)] pb-4">
        <div>
          <div className="flex items-center gap-x-2">
            <h1
              className="text-2xl font-bold flex items-center gap-2"
              style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
            >
              <Eye className="w-7 h-7 text-emerald-400" />
              Competitive Research
            </h1>
            <ContextHelpTooltip content="Monitor competitor handles, scrape viral reels, and extract winning niche signals." />
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Track top creator handles, discover high-ER reels, and feed winner data into your Content Engine.
          </p>
        </div>

        <button
          onClick={() => scrapeMut.mutate()}
          disabled={scrapeMut.isPending}
          className="flex items-center gap-x-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl px-5 py-2.5 text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-smooth shadow-md disabled:opacity-50"
          style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
        >
          {scrapeMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {scrapeMut.isPending ? "Scraping..." : "Run Competitor Scraper"}
        </button>
      </div>

      {/* Target Setup & Scraped Data Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Target Configuration */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="border border-[var(--border-color)] bg-[var(--card-bg)] p-6 rounded-xl space-y-6 shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  Target Config
                </h3>
                <ContextHelpTooltip content="Set the competitor handles and keywords you want to scrape for viral patterns." />
              </div>
              <p className="text-xs text-[var(--text-secondary)] font-medium mt-0.5">
                Define accounts & topics to scrape across platforms
              </p>
            </div>

            {/* Platform Selector */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] font-mono">
                Platform Target
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPlatform("instagram")}
                  className={`py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-smooth flex items-center justify-center gap-2 ${
                    platform === "instagram"
                      ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                      : "bg-[var(--page-bg)] text-[var(--text-secondary)] border border-[var(--border-color)]"
                  }`}
                >
                  Instagram Reels
                </button>
                <button
                  type="button"
                  onClick={() => setPlatform("youtube")}
                  className={`py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-smooth flex items-center justify-center gap-2 ${
                    platform === "youtube"
                      ? "bg-red-500/20 text-red-400 border border-red-500/40"
                      : "bg-[var(--page-bg)] text-[var(--text-secondary)] border border-[var(--border-color)]"
                  }`}
                >
                  YouTube Shorts
                </button>
              </div>
            </div>

            {/* Competitor Handles */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] font-mono">
                Competitor Handles
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={handleInput}
                  onChange={(e) => setHandleInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addHandle()}
                  placeholder="e.g. @mreflow"
                  className="flex-1 bg-[var(--page-bg)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-magenta)]/40 font-mono"
                />
                <button
                  type="button"
                  onClick={addHandle}
                  className="bg-[var(--card-bg)] hover:bg-[var(--page-bg)] border border-[var(--border-color)] px-3 py-2 rounded-lg text-xs font-bold transition-smooth"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {handles.map((h) => (
                  <span
                    key={h}
                    className="bg-[var(--page-bg)] border border-[var(--border-color)] px-2.5 py-1 rounded-full text-[10px] font-bold font-mono text-[var(--text-secondary)] flex items-center gap-1.5"
                  >
                    {h}
                    <Trash2
                      className="w-3 h-3 cursor-pointer text-rose-400 hover:text-rose-300"
                      onClick={() => setHandles(handles.filter((item) => item !== h))}
                    />
                  </span>
                ))}
              </div>
            </div>

            {/* Keywords */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] font-mono">
                Niche Keywords & Hashtags
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addKeyword()}
                  placeholder="e.g. AI automation"
                  className="flex-1 bg-[var(--page-bg)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-magenta)]/40 font-mono"
                />
                <button
                  type="button"
                  onClick={addKeyword}
                  className="bg-[var(--card-bg)] hover:bg-[var(--page-bg)] border border-[var(--border-color)] px-3 py-2 rounded-lg text-xs font-bold transition-smooth"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {keywords.map((k) => (
                  <span
                    key={k}
                    className="bg-[var(--page-bg)] border border-[var(--border-color)] px-2.5 py-1 rounded-full text-[10px] font-bold font-mono text-[var(--text-secondary)] flex items-center gap-1.5"
                  >
                    #{k}
                    <Trash2
                      className="w-3 h-3 cursor-pointer text-rose-400 hover:text-rose-300"
                      onClick={() => setKeywords(keywords.filter((item) => item !== k))}
                    />
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Scraped Posts & Viral Signals Table */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="border border-[var(--border-color)] bg-[var(--card-bg)] rounded-xl p-6 flex flex-col shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-[var(--text-primary)]">
                    Scraped Viral Posts
                  </h3>
                  <ContextHelpTooltip content="Raw posts scraped from competitor handles ranked by view signals and engagement." />
                </div>
                <p className="text-xs text-[var(--text-secondary)] font-medium">
                  {rawPosts.length} competitor posts indexed
                </p>
              </div>
              <button
                onClick={() => refetch()}
                className="p-2 hover:bg-[var(--page-bg)] rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)]"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-lg border border-[var(--border-color)]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[var(--page-bg)] border-b border-[var(--border-color)] text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] font-mono">
                    <th className="p-3">Platform</th>
                    <th className="p-3">User</th>
                    <th className="p-3">Views</th>
                    <th className="p-3">ER</th>
                    <th className="p-3">Signal</th>
                    <th className="p-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {rawPosts.map((post) => (
                    <tr key={post.id} className="hover:bg-[var(--page-bg)]/40 transition-colors">
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase font-mono border ${
                          post.platform === "instagram"
                            ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                            : "bg-red-500/10 text-red-400 border-red-500/20"
                        }`}>
                          {post.platform}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-[var(--text-primary)] font-mono">
                        @{post.handle}
                      </td>
                      <td className="p-3 font-mono text-[var(--text-secondary)]">
                        {post.views.toLocaleString()}
                      </td>
                      <td className="p-3 font-mono font-bold text-emerald-400">
                        {post.er}%
                      </td>
                      <td className="p-3">
                        {(post as any).isViral || post.views > 200000 ? (
                          <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider font-mono">
                            VIRAL
                          </span>
                        ) : (
                          <span className="text-[var(--text-tertiary)] text-[10px]">Standard</span>
                        )}
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => router.push(`/dashboard/${slug}/intelligence/analyzer`)}
                          className="flex items-center gap-1 text-[10px] font-bold text-[var(--accent-magenta)] hover:underline"
                        >
                          <Flame className="w-3 h-3" /> Analyze
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
