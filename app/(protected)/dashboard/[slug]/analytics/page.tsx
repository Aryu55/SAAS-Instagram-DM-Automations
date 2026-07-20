"use client";

import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { onUserInfo } from "@/actions/user";
import Link from "next/link";
import {
  BarChart3,
  Video,
  Sparkles,
  Flame,
  Zap,
  Activity,
  Layers,
  MessageSquare,
  Copy,
  Check,
  RefreshCw,
  Play,
  FileText,
  AlertCircle,
  TrendingUp,
  Award,
  ChevronRight,
  BrainCircuit,
  CornerDownRight,
  UserCheck
} from "lucide-react";
import { toast } from "sonner";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as ChartTooltip
} from "recharts";

interface Post {
  id: string;
  caption?: string;
  media_type: "VIDEO" | "IMAGE" | "CAROUSEL_ALBUM";
  media_url?: string;
  permalink?: string;
  thumbnail_url?: string;
  timestamp: string;
  username?: string;
  like_count: number;
  comments_count: number;
  transcript?: string;
  transcriptSource?: string;
}

interface AIReport {
  reasoning: string;
  actionPlan: string[];
  scripts: Array<{
    title: string;
    hook: string;
    body: string;
    cta: string;
    prediction: string;
  }>;
}

const DEFAULT_NICHE_POSTS: Post[] = [
  {
    id: "demo_post_1",
    caption: "Why scrolling for 5 minutes destroys your morning focus. Relapse starts here. Every cheap dopamine hit lowers your prefrontal baseline. comment FOCUS to escape the loop. #dopaminedetox #screentime #addictionrecovery #habits",
    media_type: "VIDEO",
    media_url: "#",
    permalink: "https://instagram.com",
    thumbnail_url: "",
    timestamp: "2026-05-20T08:00:00Z",
    username: "dopamine_blueprint",
    like_count: 14250,
    comments_count: 1240,
    transcript: "[0:00-0:04] (Hook) Stop picking up your phone first thing in the morning. That 5-minute scroll is literally rewriting your brain.\n[0:04-0:22] (Body) When you wake up, your brain is in a highly suggestible state. Flooding it with cheap dopamine spikes your baseline, making deep work or recovery feel impossible for the rest of the day. You are priming your brain for relapse.\n[0:22-0:30] (CTA) If you want to break this dopamine loop and reclaim your attention span, comment FOCUS below and I'll send you my morning protocol.",
    transcriptSource: "Whisper (Audio)"
  },
  {
    id: "demo_post_2",
    caption: "The 3-stage Dopamine Detox that cures porn addiction. Rebuild your reward system and get your life back. comment RECOVERY to get the full schedule. #selfhelp #dopaminefast #addiction #discipline",
    media_type: "VIDEO",
    media_url: "#",
    permalink: "https://instagram.com",
    thumbnail_url: "",
    timestamp: "2026-05-18T12:00:00Z",
    username: "dopamine_blueprint",
    like_count: 9810,
    comments_count: 870,
    transcript: "[0:00-0:05] (Hook) Quit trying to quit cold turkey. Without resetting your brain chemistry, you will fail every single time.\n[0:05-0:21] (Body) Phase one is visual elimination; phase two is replacement behaviors; phase three is rebuilding your serotonin baseline through physical exercise and real-world wins. You need to build a life you don't want to escape from.\n[0:21-0:30] (CTA) Comment RECOVERY below, and I'll send you my complete 3-stage calendar protocol for free.",
    transcriptSource: "Whisper (Audio)"
  },
  {
    id: "demo_post_3",
    caption: "Is your brain fried? Dopamine receptors can take up to 90 days to reset. Here is what to expect during recovery. comment BLUEPRINT to learn how to lock your devices. #screentime #pornaddiction #habits #disciplined",
    media_type: "VIDEO",
    media_url: "#",
    permalink: "https://instagram.com",
    thumbnail_url: "",
    timestamp: "2026-05-15T15:30:00Z",
    username: "dopamine_blueprint",
    like_count: 8400,
    comments_count: 620,
    transcript: "[0:00-0:04] (Hook) It takes exactly 90 days of absolute discipline to reset your brain receptors.\n[0:04-0:22] (Body) In the first 10 days, you'll experience severe boredom and anxiety. That's your brain screaming for cheap dopamine. By day 30, focus returns. By day 90, the physical cravings disappear. You need DNS blockers and tech routines to survive this period.\n[0:22-0:30] (CTA) Comment BLUEPRINT below, and I'll DM you the blocklist tools I use to stay clean.",
    transcriptSource: "Whisper (Audio)"
  },
  {
    id: "demo_post_4",
    caption: "The Dopamine Baseline Checklist. 5 simple habits to incorporate daily to get off your screen and start focusing. Save this for later! #productivity #habits #checklist #selfdevelopment",
    media_type: "CAROUSEL_ALBUM",
    media_url: "#",
    permalink: "https://instagram.com",
    thumbnail_url: "",
    timestamp: "2026-05-12T10:15:00Z",
    username: "dopamine_blueprint",
    like_count: 3100,
    comments_count: 190
  },
  {
    id: "demo_post_5",
    caption: "You have power over your mind - not outside events. Realize this, and you will find strength. - Marcus Aurelius #stoic #quote #discipline #stoicism",
    media_type: "IMAGE",
    media_url: "#",
    permalink: "https://instagram.com",
    thumbnail_url: "",
    timestamp: "2026-05-09T09:00:00Z",
    username: "dopamine_blueprint",
    like_count: 1200,
    comments_count: 45
  }
];

export default function AnalyticsPage({ params: { slug } }: { params: { slug: string } }) {
  const [isDemo, setIsDemo] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [transcribing, setTranscribing] = useState<Record<string, boolean>>({});
  const [loadingAI, setLoadingAI] = useState(false);
  const [loadingSteps, setLoadingSteps] = useState<string>("");
  const [aiReport, setAiReport] = useState<AIReport | null>(null);
  const [aiTab, setAiTab] = useState<"reasoning" | "roadmap" | "scripts">("reasoning");
  const [copiedScript, setCopiedScript] = useState<number | null>(null);

  // Fetch clerk profile to check integrations
  const { data: userProfile, isLoading: loadingProfile } = useQuery({
    queryKey: ["user-profile"],
    queryFn: onUserInfo,
  });

  const hasInstagramIntegration = !!userProfile?.data?.integrations.find(
    (i: any) => i.name === "INSTAGRAM"
  );

  // Fetch Live posts when toggled
  const fetchLivePosts = async () => {
    setLoadingPosts(true);
    try {
      const res = await fetch("/api/analytics/posts");
      if (res.status === 200) {
        const data = await res.json();
        if (data.posts) {
          setPosts(data.posts);
          setIsDemo(false);
          if (data.posts.length > 0) {
            toast.success("Successfully loaded live Instagram posts!");
          }
        }
      } else {
        toast.error("Could not fetch live posts. Ensure token is valid.");
        setPosts([]);
        setIsDemo(false);
      }
    } catch (err: any) {
      toast.error("Error loading live posts.");
      setPosts([]);
      setIsDemo(false);
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    if (loadingProfile) return;
    if (!hasInstagramIntegration) {
      setIsDemo(false);
      setPosts([]);
    } else {
      fetchLivePosts();
    }
  }, [hasInstagramIntegration, loadingProfile]);

  const handleToggleMode = (checked: boolean) => {
    if (!checked) {
      setIsDemo(false);
      setPosts([]);
      toast.info("Switched to Live Mode.");
    } else {
      setIsDemo(true);
      setPosts(DEFAULT_NICHE_POSTS);
      toast.info("Switched to Demo Creator Mode.");
    }
  };

  // Run video transcription
  const handleTranscribe = async (post: Post) => {
    setTranscribing((prev) => ({ ...prev, [post.id]: true }));
    try {
      const res = await fetch("/api/analytics/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: post.id,
          mediaUrl: post.media_url,
          mediaType: post.media_type,
          caption: post.caption,
          niche: "Porn Addiction Recovery and Dopamine Detox"
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setPosts((prev) =>
          prev.map((p) =>
            p.id === post.id
              ? { ...p, transcript: data.transcript, transcriptSource: data.source }
              : p
          )
        );
        toast.success(`Successfully transcribed using: ${data.source}`);
      } else {
        toast.error("Failed to transcribe post.");
      }
    } catch (err) {
      toast.error("Error transcribing post.");
    } finally {
      setTranscribing((prev) => ({ ...prev, [post.id]: false }));
    }
  };

  // Run AI Recommendation blueprints
  const handleGenerateRecommendations = async () => {
    if (posts.length === 0) {
      toast.error("No posts found to analyze. Please connect your Instagram or enable Demo Mode.");
      return;
    }
    setLoadingAI(true);
    const steps = [
      "Analyzing content metrics and engagement levels...",
      "Extracting hooks and transcription structures...",
      "Analyzing dopamine & addiction recovery patterns...",
      "Formatting content roadmap and drafting 3 viral scripts..."
    ];

    // Trigger sequential loading step simulation for premium feel
    let stepIdx = 0;
    setLoadingSteps(steps[0]);
    const stepInterval = setInterval(() => {
      stepIdx++;
      if (stepIdx < steps.length) {
        setLoadingSteps(steps[stepIdx]);
      }
    }, 1200);

    try {
      const res = await fetch("/api/analytics/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          posts,
          niche: "Porn Addiction Recovery, Dopamine Detox, screen scrolling habits, building discipline"
        }),
      });

      clearInterval(stepInterval);

      if (res.ok) {
        const data = await res.json();
        setAiReport(data);
        setAiTab("reasoning");
        toast.success("AI Content Strategy Report successfully created!");
      } else {
        toast.error("Failed to run AI recommendations.");
      }
    } catch (err) {
      clearInterval(stepInterval);
      toast.error("Error generating recommendations.");
    } finally {
      setLoadingAI(false);
      setLoadingSteps("");
    }
  };

  // Helper metrics calculations
  const totalLikes = posts.reduce((sum, p) => sum + p.like_count, 0);
  const totalComments = posts.reduce((sum, p) => sum + p.comments_count, 0);
  const avgLikes = posts.length ? Math.round(totalLikes / posts.length) : 0;
  const avgComments = posts.length ? Math.round(totalComments / posts.length) : 0;
  // Estimated engagement rate based on random baseline followers (e.g. 50k followers for demo)
  const estFollowers = isDemo ? 62000 : 25000;
  const avgEngagementRate = posts.length
    ? (((totalLikes + totalComments) / posts.length) / estFollowers * 100).toFixed(2)
    : "0.00";

  // Recharts Chart Data
  const chartData = [...posts]
    .reverse()
    .map((p, idx) => ({
      name: `Post ${idx + 1}`,
      engagement: p.like_count + p.comments_count,
      likes: p.like_count,
      comments: p.comments_count,
    }));

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedScript(index);
    toast.success("Script copied to clipboard!");
    setTimeout(() => {
      setCopiedScript(null);
    }, 2000);
  };

  return (
    <div className="flex flex-col gap-y-8 animate-fade-in-up pb-10 pr-2 lg:pr-6">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-y-4 border-b border-[var(--border-color)] pb-6 mt-2">
        <div>
          <span className="inline-flex items-center gap-x-1.5 px-3 py-1 bg-[var(--accent-whisper)] border border-[var(--accent-veil)] text-[var(--accent-magenta)] text-[9px] font-bold tracking-wider uppercase rounded-full w-fit mb-2.5" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>
            Performance Metrics
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] leading-none tracking-tight" style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>
            Instagram Analytics
          </h2>
          <p className="text-[var(--text-secondary)] text-sm max-w-[65ch] mt-2 leading-relaxed">
            Analyze your posts, auto-transcribe videos, and generate AI-driven recommendation scripts.
          </p>
        </div>

        {/* Demo Mode Toggle Switch */}
        <div className="flex items-center gap-x-3 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg px-4 py-2" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>
          <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-secondary)]">
            {isDemo ? "Demo Mode Active" : "Live Integration"}
          </span>
          <button
            onClick={() => handleToggleMode(!isDemo)}
            className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-all duration-300 ${
              isDemo ? "bg-[var(--accent-magenta)] justify-end" : "bg-[var(--page-bg)] border border-[var(--border-color)] justify-start"
            }`}
          >
            <span className="w-3.5 h-3.5 bg-[var(--text-primary)] rounded-full shadow-sm" />
          </button>
        </div>
      </div>

      {/* Integration Warning Banners */}
      {!hasInstagramIntegration && !isDemo && (
        <div className="bg-[var(--accent-whisper)] border border-[var(--accent-veil)] rounded-xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex gap-x-3 items-center">
            <AlertCircle className="w-5 h-5 text-[var(--accent-magenta)] shrink-0" />
            <div className="text-xs text-[var(--text-secondary)] leading-normal">
              <strong>Instagram account not connected.</strong> Connect your account in the{" "}
              <Link href={`/dashboard/${slug}/integrations`} className="underline font-semibold text-[var(--accent-magenta)] hover:text-[var(--accent-magenta)]/80">
                Integrations
              </Link>{" "}
              tab to view your live post metrics, or enable Demo Mode to try it out.
            </div>
          </div>
          <button
            onClick={() => {
              setIsDemo(true);
              setPosts(DEFAULT_NICHE_POSTS);
              toast.info("Enabled Demo Creator Mode.");
            }}
            className="px-4 py-2 rounded-lg bg-[var(--text-primary)] hover:bg-[var(--accent-magenta)] hover:text-white border border-[var(--border-color)] text-[10px] font-bold uppercase tracking-wider text-[var(--page-bg)] transition-smooth"
            style={{ fontFamily: "var(--font-space-grotesk), monospace" }}
          >
            Enable Demo Mode
          </button>
        </div>
      )}

      {hasInstagramIntegration && !isDemo && posts.length === 0 && !loadingPosts && (
        <div className="bg-[var(--accent-whisper)] border border-[var(--accent-veil)] rounded-xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex gap-x-3 items-center">
            <AlertCircle className="w-5 h-5 text-[var(--accent-magenta)] shrink-0" />
            <div className="text-xs text-[var(--text-secondary)] leading-normal">
              <strong>No posts found.</strong> Your Instagram integration is active, but we didn&apos;t find any posts on your profile. Upload reels or posts on Instagram, or enable Demo Mode to preview.
            </div>
          </div>
          <button
            onClick={() => {
              setIsDemo(true);
              setPosts(DEFAULT_NICHE_POSTS);
              toast.info("Enabled Demo Creator Mode.");
            }}
            className="px-4 py-2 rounded-lg bg-[var(--text-primary)] hover:bg-[var(--accent-magenta)] hover:text-white border border-[var(--border-color)] text-[10px] font-bold uppercase tracking-wider text-[var(--page-bg)] transition-smooth"
            style={{ fontFamily: "var(--font-space-grotesk), monospace" }}
          >
            Enable Demo Mode
          </button>
        </div>
      )}

      {isDemo && (
        <div className="bg-[var(--accent-whisper)] border border-[var(--accent-veil)] rounded-xl p-4 flex gap-x-3 items-center">
          <AlertCircle className="w-5 h-5 text-[var(--accent-magenta)] shrink-0" />
          <div className="text-xs text-[var(--text-primary)] leading-normal flex-1">
            <strong>Viewing Demo Creator Mode.</strong> We have loaded interactive Dopamine Detox & Addiction Recovery mock posts. Toggle the mode switch in the header to exit.
          </div>
        </div>
      )}

      {/* Top Level KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="glass-card p-5 flex flex-col gap-y-1 justify-between">
          <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-wider" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>Total Analyzed Posts</span>
          <div className="flex items-baseline gap-x-2 mt-2">
            <span className="text-2xl font-black text-[var(--text-primary)]" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>{posts.length}</span>
            <span className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase tracking-wider" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>posts</span>
          </div>
          <div className="flex items-center gap-x-1.5 text-[10px] text-[var(--accent-magenta)] mt-2 font-bold uppercase tracking-wider" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>
            <Video className="w-3.5 h-3.5 text-current" /> Reels & Carousels
          </div>
        </div>

        <div className="glass-card p-5 flex flex-col gap-y-1 justify-between">
          <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-wider" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>Average Likes</span>
          <div className="flex items-baseline gap-x-2 mt-2">
            <span className="text-2xl font-black text-[var(--text-primary)]" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>{avgLikes.toLocaleString()}</span>
            <span className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase tracking-wider" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>likes/post</span>
          </div>
          <div className="flex items-center gap-x-1 text-[10px] text-emerald-600 dark:text-emerald-400 mt-2 font-bold uppercase tracking-wider" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>
            <TrendingUp className="w-3.5 h-3.5 text-current" /> Healthy reach
          </div>
        </div>

        <div className="glass-card p-5 flex flex-col gap-y-1 justify-between">
          <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-wider" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>Average Comments</span>
          <div className="flex items-baseline gap-x-2 mt-2">
            <span className="text-2xl font-black text-[var(--text-primary)]" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>{avgComments.toLocaleString()}</span>
            <span className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase tracking-wider" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>comments/post</span>
          </div>
          <div className="flex items-center gap-x-1.5 text-[10px] text-[var(--accent-magenta)] mt-2 font-bold uppercase tracking-wider" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>
            <MessageSquare className="w-3.5 h-3.5 text-current" /> Active engagement
          </div>
        </div>

        <div className="glass-card p-5 flex flex-col gap-y-1 justify-between">
          <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-wider" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>Avg Engagement Rate</span>
          <div className="flex items-baseline gap-x-2 mt-2">
            <span className="text-2xl font-black text-[var(--text-primary)]" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>{avgEngagementRate}%</span>
            <span className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase tracking-wider" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>of audience</span>
          </div>
          <div className="flex items-center gap-x-1.5 text-[10px] text-[var(--text-secondary)] mt-2 font-bold uppercase tracking-wider" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>
            <Award className="w-3.5 h-3.5 text-current" /> Viral density
          </div>
        </div>
      </div>

      {/* Main Core section: Chart + AI Strategy Report */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Engagement Trend Chart */}
        <div className="xl:col-span-6 glass-card p-6 flex flex-col justify-between overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)] tracking-tight flex items-center gap-x-2">
                <Activity className="w-5 h-5 text-[var(--accent-magenta)]" /> Engagement Trends
              </h2>
              <p className="text-[var(--text-secondary)] text-xs">Total interaction score (Likes + Comments) per post</p>
            </div>
            {loadingPosts && <RefreshCw className="w-4 h-4 text-[var(--accent-magenta)] animate-spin" />}
          </div>

          <div className="h-[250px] w-full bg-[var(--page-bg)]/30 border border-[var(--border-color)] p-4 rounded-xl">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="engagementColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-magenta)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--accent-magenta)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border-color)" strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="name" stroke="var(--text-tertiary)" fontSize={10} tickLine={false} axisLine={false} style={{ fontFamily: "var(--font-space-grotesk), monospace" }} />
                <YAxis stroke="var(--text-tertiary)" fontSize={10} tickLine={false} axisLine={false} style={{ fontFamily: "var(--font-space-grotesk), monospace" }} />
                <ChartTooltip
                  content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] p-3 rounded-lg shadow-2xl text-xs text-[var(--text-primary)]" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>
                          <p className="text-[var(--text-secondary)] font-bold mb-1">{payload[0].payload.name}</p>
                          <p>Likes: {payload[0].payload.likes.toLocaleString()}</p>
                          <p>Comments: {payload[0].payload.comments.toLocaleString()}</p>
                          <p className="text-[var(--accent-magenta)] font-bold mt-1">
                            Total Score: {payload[0].payload.engagement.toLocaleString()}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="engagement"
                  stroke="var(--accent-magenta)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#engagementColor)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Recommendations Hub */}
        <div className="xl:col-span-6 glass-card p-6 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between mb-4 z-10">
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)] tracking-tight flex items-center gap-x-2">
                <Sparkles className="w-5 h-5 text-[var(--accent-magenta)]" /> AI Strategy Report
              </h2>
              <p className="text-[var(--text-secondary)] text-xs">AI recommendations and pre-drafted creation blueprints</p>
            </div>
            {aiReport && (
              <button
                onClick={handleGenerateRecommendations}
                disabled={loadingAI}
                className="text-[10px] text-[var(--accent-magenta)] hover:text-[var(--accent-magenta)]/80 flex items-center gap-1 font-bold uppercase tracking-wider"
                style={{ fontFamily: "var(--font-space-grotesk), monospace" }}
              >
                <RefreshCw className={`w-3 h-3 ${loadingAI ? "animate-spin" : ""}`} /> Recalculate
              </button>
            )}
          </div>

          {/* Trigger Recommendations Card if not loaded */}
          {!aiReport && !loadingAI && (
            <div className="flex flex-col items-center justify-center text-center py-10 px-4 flex-1">
              <div className="p-4 bg-[var(--accent-whisper)] rounded-xl border border-[var(--accent-veil)] text-[var(--accent-magenta)] mb-4 animate-pulse">
                <BrainCircuit className="w-8 h-8" />
              </div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Generate Content Strategy Report</h3>
              <p className="text-xs text-[var(--text-secondary)] max-w-[340px] mt-1.5 leading-normal">
                Analyze hook structures and metric indices across all posts to outline your step-by-step roadmap and write next viral script drafts.
              </p>
              <button
                onClick={handleGenerateRecommendations}
                className="mt-5 px-6 py-2.5 rounded-lg bg-[var(--text-primary)] hover:bg-[var(--accent-magenta)] hover:text-white text-[10px] font-bold uppercase tracking-wider text-[var(--page-bg)] border border-[var(--border-color)] transition-smooth"
                style={{ fontFamily: "var(--font-space-grotesk), monospace" }}
              >
                Run AI Reasoning Analysis
              </button>
            </div>
          )}

          {/* Loading Recommendations */}
          {loadingAI && (
            <div className="flex flex-col items-center justify-center text-center py-14 px-4 flex-1">
              <RefreshCw className="w-8 h-8 text-[var(--accent-magenta)] animate-spin mb-4" />
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Synthesizing Recommendations</h3>
              <p className="text-xs text-[var(--accent-magenta)] max-w-[320px] mt-2 font-bold uppercase tracking-wider animate-pulse" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>
                {loadingSteps}
              </p>
            </div>
          )}

          {/* Display Recommendation Blueprint */}
          {aiReport && !loadingAI && (
            <div className="flex flex-col flex-1 gap-y-4">
              {/* Tab Selector */}
              <div className="flex border-b border-[var(--border-color)] mb-2 gap-x-6" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>
                {(["reasoning", "roadmap", "scripts"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setAiTab(tab)}
                    className={`pb-2 text-xs font-bold relative uppercase tracking-wider transition-colors duration-200 ${
                      aiTab === tab ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {tab === "reasoning" && "AI Reasoning"}
                    {tab === "roadmap" && "What should I do?"}
                    {tab === "scripts" && "Draft Scripts"}
                    {aiTab === tab && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-magenta)] rounded-full" />
                    )}
                  </button>
                ))}
              </div>

              {/* Tab Content 1: AI Reasoning */}
              {aiTab === "reasoning" && (
                <div className="flex flex-col gap-y-3 flex-1 overflow-y-auto max-h-[220px] pr-2 scrollbar-thin">
                  <div className="text-xs text-[var(--text-secondary)] leading-relaxed bg-[var(--page-bg)]/40 border border-[var(--border-color)] p-3 rounded-lg">
                    <p className="font-bold text-[var(--text-primary)] mb-1.5 flex items-center gap-1.5">
                      <BrainCircuit className="w-3.5 h-3.5 text-[var(--accent-magenta)]" /> Strategic Diagnostic:
                    </p>
                    {aiReport.reasoning}
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-1">
                    <div className="bg-emerald-500/5 border border-emerald-500/10 p-2.5 rounded-lg">
                      <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>Core Strength</span>
                      <p className="text-[10px] text-[var(--text-secondary)] mt-1">Biological triggers (Dopamine loops) get 4x more DMs than general quotes.</p>
                    </div>
                    <div className="bg-rose-500/5 border border-rose-500/10 p-2.5 rounded-lg">
                      <span className="text-[9px] font-bold text-rose-600 dark:text-rose-400 uppercase" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>Primary Leak</span>
                      <p className="text-[10px] text-[var(--text-secondary)] mt-1">Lack of direct trigger call-to-actions in visual frames creates a 80% loss in conversions.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab Content 2: Roadmap */}
              {aiTab === "roadmap" && (
                <div className="flex flex-col gap-y-2 flex-1 overflow-y-auto max-h-[220px] pr-2 scrollbar-thin">
                  <span className="text-[10px] font-bold uppercase text-[var(--accent-magenta)] tracking-wider" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>CREATOR ACTION GUIDELINE:</span>
                  {aiReport.actionPlan.map((rule, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-x-2 bg-[var(--page-bg)]/40 border border-[var(--border-color)] p-2 rounded-lg text-xs text-[var(--text-secondary)]"
                    >
                      <span className="text-[var(--accent-magenta)] font-bold font-mono mt-0.5">{idx + 1}.</span>
                      <p className="leading-relaxed">{rule}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab Content 3: Draft Scripts */}
              {aiTab === "scripts" && (
                <div className="flex flex-col gap-y-3 flex-1 overflow-y-auto max-h-[220px] pr-2 scrollbar-thin">
                  {aiReport.scripts.map((script, idx) => {
                    const fullText = `[Hook]\n${script.hook}\n\n[Body]\n${script.body}\n\n[CTA]\n${script.cta}`;
                    return (
                      <div
                        key={idx}
                        className="bg-[var(--page-bg)]/40 border border-[var(--border-color)] rounded-xl p-3 flex flex-col gap-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-[var(--text-primary)] flex items-center gap-1.5">
                            <CornerDownRight className="w-3.5 h-3.5 text-[var(--accent-magenta)]" /> {script.title}
                          </span>
                          <span className="text-[9px] font-bold uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>
                            🔥 {script.prediction} Viral Score
                          </span>
                        </div>

                        <div className="space-y-1.5 text-[10px] leading-relaxed text-[var(--text-secondary)] mt-1">
                          <p>
                            <strong className="text-[var(--accent-magenta)]">Hook: </strong>
                            {script.hook}
                          </p>
                          <p>
                            <strong className="text-[var(--accent-magenta)]">Body: </strong>
                            {script.body}
                          </p>
                          <p>
                            <strong className="text-[var(--accent-magenta)] font-bold">CTA: </strong>
                            <span className="bg-[var(--accent-whisper)] text-[var(--accent-magenta)] px-1.5 py-0.5 rounded-full font-bold">{script.cta}</span>
                          </p>
                        </div>

                        <button
                          onClick={() => copyToClipboard(fullText, idx)}
                          className="mt-2 text-[10px] font-bold uppercase tracking-wider text-[var(--text-primary)] bg-[var(--page-bg)] border border-[var(--border-color)] hover:bg-[var(--accent-whisper)] py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-smooth"
                          style={{ fontFamily: "var(--font-space-grotesk), monospace" }}
                        >
                          {copiedScript === idx ? (
                            <>
                              <Check className="w-3 text-emerald-500" /> Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" /> Copy Script
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Connected Posts Grid Section */}
      <div className="flex flex-col gap-y-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] tracking-tight flex items-center gap-x-2" style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>
            <Layers className="w-5 h-5 text-[var(--accent-magenta)]" /> Connected Posts Gallery
          </h2>
          <p className="text-[var(--text-secondary)] text-xs">
            Review recent Instagram posts, view statistics, and run transcription files.
          </p>
        </div>

        {posts.length === 0 && !loadingPosts ? (
          <div className="glass-card py-16 text-center flex flex-col items-center">
            <AlertCircle className="w-10 h-10 text-[var(--text-tertiary)] mb-3 animate-pulse" />
            <h3 className="text-sm font-bold text-[var(--text-primary)]">No Connected Posts Found</h3>
            <p className="text-xs text-[var(--text-secondary)] max-w-[280px] mt-1 leading-normal">
              Connect your account in the Integrations panel or select Demo Mode to load interactive posts.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {posts.map((post) => {
              const engagementScore = post.like_count + post.comments_count;
              let scoreBadge = (
                <span className="text-[9px] font-bold bg-rose-500/5 border border-rose-500/10 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-full" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>
                  💤 Sleepy
                </span>
              );
              if (engagementScore > 10000) {
                scoreBadge = (
                  <span className="text-[9px] font-bold bg-amber-500/5 border border-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full animate-pulse" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>
                    🔥 Viral
                  </span>
                );
              } else if (engagementScore > 3000) {
                scoreBadge = (
                  <span className="text-[9px] font-bold bg-emerald-500/5 border border-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>
                    ⚡ Healthy
                  </span>
                );
              } else if (engagementScore > 100) {
                scoreBadge = (
                  <span className="text-[9px] font-bold bg-[var(--accent-whisper)] border border-[var(--accent-veil)] text-[var(--accent-magenta)] px-2 py-0.5 rounded-full" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>
                    📈 Average
                  </span>
                );
              }

              return (
                <div
                  key={post.id}
                  className="glass-card p-5 hover:scale-[1.01] flex flex-col justify-between gap-y-4 group"
                >
                  <div className="flex gap-x-3.5">
                    {/* Media type icon / Thumbnail visualizer */}
                    <div className="w-[100px] h-[100px] bg-[var(--page-bg)]/40 border border-[var(--border-color)] rounded-xl flex items-center justify-center shrink-0 overflow-hidden relative">
                      {post.media_type === "VIDEO" ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-[var(--accent-whisper)]/50 group-hover:bg-[var(--accent-whisper)] transition">
                          <Play className="w-6 h-6 text-[var(--accent-magenta)] fill-[var(--accent-magenta)]/25" />
                        </div>
                      ) : post.media_type === "CAROUSEL_ALBUM" ? (
                        <Layers className="w-6 h-6 text-[var(--accent-magenta)]" />
                      ) : (
                        <FileText className="w-6 h-6 text-[var(--text-tertiary)]" />
                      )}
                      {post.thumbnail_url && (
                        <img
                          src={post.thumbnail_url}
                          alt="Instagram post"
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>

                    <div className="flex flex-col flex-1 justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-x-2">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-secondary)] bg-[var(--page-bg)] border border-[var(--border-color)] px-1.5 py-0.5 rounded-full" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>
                            {post.media_type === "VIDEO" ? "Reel" : post.media_type === "IMAGE" ? "Image" : "Carousel"}
                          </span>
                          {scoreBadge}
                        </div>
                        <p className="text-[11px] text-[var(--text-secondary)] line-clamp-3 mt-2 leading-relaxed">
                          {post.caption || "No caption provided."}
                        </p>
                      </div>
                      <span className="text-[9px] text-[var(--text-tertiary)] font-bold uppercase tracking-wider" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>
                        {new Date(post.timestamp).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric"
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Metrics Bar */}
                  <div className="flex items-center gap-x-4 border-t border-b border-[var(--border-color)] py-2 text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-wider" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>
                    <div className="flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-[var(--accent-magenta)]" />
                      <span className="text-[var(--text-primary)]">{post.like_count.toLocaleString()}</span> Likes
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5 text-[var(--accent-magenta)]" />
                      <span className="text-[var(--text-primary)]">{post.comments_count.toLocaleString()}</span> Comments
                    </div>
                  </div>

                  {/* Transcript Viewer / Action */}
                  <div className="flex flex-col gap-y-2">
                    {post.transcript ? (
                      <div className="bg-[var(--page-bg)]/40 border border-[var(--border-color)] p-2.5 rounded-lg text-[10px] text-[var(--text-secondary)]">
                        <span className="font-bold text-[9px] text-[var(--accent-magenta)] uppercase tracking-wider flex items-center justify-between mb-1" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>
                          <span>Transcription File</span>
                          <span className="text-[var(--text-tertiary)] text-[8px] font-normal lowercase">{post.transcriptSource}</span>
                        </span>
                        <p className="whitespace-pre-wrap leading-relaxed line-clamp-4 hover:line-clamp-none transition-all duration-300 cursor-pointer">
                          {post.transcript}
                        </p>
                      </div>
                    ) : post.media_type === "VIDEO" ? (
                      <button
                        onClick={() => handleTranscribe(post)}
                        disabled={transcribing[post.id]}
                        className="w-full py-2 bg-[var(--text-primary)] hover:bg-[var(--accent-magenta)] hover:text-white border border-[var(--border-color)] text-[10px] font-bold uppercase tracking-wider text-[var(--page-bg)] rounded-lg flex items-center justify-center gap-1.5 transition-smooth"
                        style={{ fontFamily: "var(--font-space-grotesk), monospace" }}
                      >
                        {transcribing[post.id] ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Transcribing Audio...
                          </>
                        ) : (
                          <>
                            <BrainCircuit className="w-3.5 h-3.5" /> Transcribe Reel
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="text-[10px] text-center text-[var(--text-tertiary)] italic py-1 bg-[var(--page-bg)]/20 border border-[var(--border-color)] rounded-lg">
                        Images/Carousels have no audio file to transcribe
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
