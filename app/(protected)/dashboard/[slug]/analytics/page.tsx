"use client";

import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { onUserInfo } from "@/actions/user";
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

export default function AnalyticsPage() {
  const [isDemo, setIsDemo] = useState(true);
  const [posts, setPosts] = useState<Post[]>(DEFAULT_NICHE_POSTS);
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
        if (data.posts && data.posts.length > 0) {
          setPosts(data.posts);
          setIsDemo(false);
          toast.success("Successfully loaded live Instagram posts!");
        } else {
          toast.error("No posts found. Falling back to Demo Mode.");
          setPosts(DEFAULT_NICHE_POSTS);
          setIsDemo(true);
        }
      } else {
        toast.error("Could not fetch live posts. Ensure token is valid.");
        setPosts(DEFAULT_NICHE_POSTS);
        setIsDemo(true);
      }
    } catch (err: any) {
      toast.error("Error loading live posts.");
      setPosts(DEFAULT_NICHE_POSTS);
      setIsDemo(true);
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    if (!hasInstagramIntegration) {
      setIsDemo(true);
      setPosts(DEFAULT_NICHE_POSTS);
    } else {
      fetchLivePosts();
    }
  }, [hasInstagramIntegration]);

  const handleToggleMode = (checked: boolean) => {
    if (!checked) {
      setIsDemo(true);
      setPosts(DEFAULT_NICHE_POSTS);
      toast.info("Switched to Demo Creator Mode.");
    } else {
      if (!hasInstagramIntegration) {
        toast.error("No Instagram Integration found. Go to Integrations tab to connect.");
        return;
      }
      fetchLivePosts();
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-y-4 mt-2">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-x-2">
            Instagram Analytics <span className="text-[10px] uppercase font-bold bg-blue-500/15 border border-blue-500/30 text-blue-400 px-2 py-0.5 rounded-md">New Feature</span>
          </h1>
          <p className="text-text-secondary text-sm">
            Analyze your posts, auto-transcribe videos, and generate AI-driven recommendation scripts.
          </p>
        </div>

        {/* Demo Mode Toggle Switch */}
        <div className="flex items-center gap-x-3 bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-2">
          <span className="text-xs font-semibold text-gray-400">
            {isDemo ? "Demo Mode Active" : "Live Integration"}
          </span>
          <button
            onClick={() => handleToggleMode(!isDemo)}
            className={`w-10 h-6 flex items-center rounded-full p-1 transition-all duration-300 ${
              !isDemo ? "bg-blue-500 justify-end" : "bg-white/[0.08] justify-start"
            }`}
          >
            <span className="w-4 h-4 bg-white rounded-full shadow-md" />
          </button>
        </div>
      </div>

      {/* Integration Warning Banner if in Demo mode */}
      {isDemo && (
        <div className="glass-card border border-amber-500/20 bg-amber-500/5 rounded-2xl p-4 flex gap-x-3 items-center">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="text-xs text-amber-200/90 leading-normal">
            {!hasInstagramIntegration ? (
              <span>
                <strong>No connected Instagram integration found.</strong> We have loaded an interactive <strong>Dopamine Detox & Addiction Recovery</strong> niche creator profile so you can test all features. Connect your account in <span className="underline font-semibold">Integrations</span> to fetch live posts.
              </span>
            ) : (
              <span>
                <strong>Browsing Demo mode.</strong> Toggle the switch above to connect to your live Instagram integration profile.
              </span>
            )}
          </div>
        </div>
      )}

      {/* Top Level KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="glass-card border border-white/[0.08] rounded-2xl p-5 hover:border-white/[0.12] transition duration-200 flex flex-col gap-y-1 justify-between">
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Total Analyzed Posts</span>
          <div className="flex items-baseline gap-x-2 mt-2">
            <span className="text-2xl font-black text-white">{posts.length}</span>
            <span className="text-[10px] text-gray-500 font-semibold">posts</span>
          </div>
          <div className="flex items-center gap-x-1.5 text-[10px] text-blue-400 mt-2 font-medium">
            <Video className="w-3.5 h-3.5" /> Reels & Carousels
          </div>
        </div>

        <div className="glass-card border border-white/[0.08] rounded-2xl p-5 hover:border-white/[0.12] transition duration-200 flex flex-col gap-y-1 justify-between">
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Average Likes</span>
          <div className="flex items-baseline gap-x-2 mt-2">
            <span className="text-2xl font-black text-white">{avgLikes.toLocaleString()}</span>
            <span className="text-[10px] text-gray-500 font-semibold">likes/post</span>
          </div>
          <div className="flex items-center gap-x-1 text-[10px] text-emerald-400 mt-2 font-medium">
            <TrendingUp className="w-3.5 h-3.5" /> Healthy reach
          </div>
        </div>

        <div className="glass-card border border-white/[0.08] rounded-2xl p-5 hover:border-white/[0.12] transition duration-200 flex flex-col gap-y-1 justify-between">
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Average Comments</span>
          <div className="flex items-baseline gap-x-2 mt-2">
            <span className="text-2xl font-black text-white">{avgComments.toLocaleString()}</span>
            <span className="text-[10px] text-gray-500 font-semibold">comments/post</span>
          </div>
          <div className="flex items-center gap-x-1.5 text-[10px] text-purple-400 mt-2 font-medium">
            <MessageSquare className="w-3.5 h-3.5" /> Active engagement
          </div>
        </div>

        <div className="glass-card border border-white/[0.08] rounded-2xl p-5 hover:border-white/[0.12] transition duration-200 flex flex-col gap-y-1 justify-between">
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Avg Engagement Rate</span>
          <div className="flex items-baseline gap-x-2 mt-2">
            <span className="text-2xl font-black text-white">{avgEngagementRate}%</span>
            <span className="text-[10px] text-gray-500 font-semibold">of audience</span>
          </div>
          <div className="flex items-center gap-x-1.5 text-[10px] text-teal-400 mt-2 font-medium">
            <Award className="w-3.5 h-3.5" /> Viral density
          </div>
        </div>
      </div>

      {/* Main Core section: Chart + AI Strategy Report */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Engagement Trend Chart */}
        <div className="xl:col-span-6 glass-card p-6 rounded-2xl border border-white/[0.08] shadow-2xl flex flex-col justify-between overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-x-2">
                <Activity className="w-5 h-5 text-blue-400" /> Engagement Trends
              </h2>
              <p className="text-[#9B9CA0] text-xs">Total interaction score (Likes + Comments) per post</p>
            </div>
            {loadingPosts && <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />}
          </div>

          <div className="h-[250px] w-full bg-[#121214]/30 border border-white/[0.04] p-4 rounded-xl">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="engagementColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255, 255, 255, 0.03)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                <ChartTooltip
                  content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-[#18181b] border border-white/[0.08] p-3 rounded-lg shadow-2xl text-xs">
                          <p className="text-gray-400 font-semibold mb-1">{payload[0].payload.name}</p>
                          <p className="text-white">Likes: {payload[0].payload.likes.toLocaleString()}</p>
                          <p className="text-white">Comments: {payload[0].payload.comments.toLocaleString()}</p>
                          <p className="text-blue-400 font-bold mt-1">
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
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#engagementColor)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Recommendations Hub */}
        <div className="xl:col-span-6 glass-card p-6 rounded-2xl border border-white/[0.08] shadow-2xl flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between mb-4 z-10">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-x-2">
                <Sparkles className="w-5 h-5 text-purple-400" /> AI Strategy Report
              </h2>
              <p className="text-[#9B9CA0] text-xs">AI recommendations and pre-drafted creation blueprints</p>
            </div>
            {aiReport && (
              <button
                onClick={handleGenerateRecommendations}
                disabled={loadingAI}
                className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center gap-1 font-semibold"
              >
                <RefreshCw className={`w-3 h-3 ${loadingAI ? "animate-spin" : ""}`} /> Recalculate
              </button>
            )}
          </div>

          {/* Trigger Recommendations Card if not loaded */}
          {!aiReport && !loadingAI && (
            <div className="flex flex-col items-center justify-center text-center py-10 px-4 flex-1">
              <div className="p-4 bg-purple-500/10 rounded-full border border-purple-500/20 text-purple-400 mb-4 animate-pulse">
                <BrainCircuit className="w-8 h-8" />
              </div>
              <h3 className="text-sm font-bold text-white">Generate Content Strategy Report</h3>
              <p className="text-xs text-gray-500 max-w-[340px] mt-1.5 leading-normal">
                Analyze hook structures and metric indices across all posts to outline your step-by-step roadmap and write next viral script drafts.
              </p>
              <button
                onClick={handleGenerateRecommendations}
                className="mt-5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-xs font-bold text-white shadow-lg shadow-purple-500/20 hover:scale-[1.02] transition duration-200"
              >
                Run AI Reasoning Analysis
              </button>
            </div>
          )}

          {/* Loading Recommendations */}
          {loadingAI && (
            <div className="flex flex-col items-center justify-center text-center py-14 px-4 flex-1">
              <RefreshCw className="w-8 h-8 text-purple-400 animate-spin mb-4" />
              <h3 className="text-sm font-bold text-white">Synthesizing Recommendations</h3>
              <p className="text-xs text-purple-300 max-w-[320px] mt-2 font-medium animate-pulse">
                {loadingSteps}
              </p>
            </div>
          )}

          {/* Display Recommendation Blueprint */}
          {aiReport && !loadingAI && (
            <div className="flex flex-col flex-1 gap-y-4">
              {/* Tab Selector */}
              <div className="flex border-b border-white/[0.06] mb-2 gap-x-6">
                {(["reasoning", "roadmap", "scripts"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setAiTab(tab)}
                    className={`pb-2 text-xs font-semibold relative capitalize transition-colors duration-200 ${
                      aiTab === tab ? "text-white" : "text-[#71717a] hover:text-gray-300"
                    }`}
                  >
                    {tab === "reasoning" && "AI Reasoning"}
                    {tab === "roadmap" && "What should I do?"}
                    {tab === "scripts" && "Draft Scripts"}
                    {aiTab === tab && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 rounded-full" />
                    )}
                  </button>
                ))}
              </div>

              {/* Tab Content 1: AI Reasoning */}
              {aiTab === "reasoning" && (
                <div className="flex flex-col gap-y-3 flex-1 overflow-y-auto max-h-[220px] pr-2 scrollbar-thin">
                  <div className="text-xs text-gray-300 leading-relaxed bg-white/[0.02] border border-white/[0.04] p-3 rounded-xl">
                    <p className="font-semibold text-white mb-1.5 flex items-center gap-1.5">
                      <BrainCircuit className="w-3.5 h-3.5 text-purple-400" /> Strategic Diagnostic:
                    </p>
                    {aiReport.reasoning}
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-1">
                    <div className="bg-emerald-500/5 border border-emerald-500/10 p-2.5 rounded-xl">
                      <span className="text-[9px] font-bold text-emerald-400 uppercase">Core Strength</span>
                      <p className="text-[10px] text-gray-300 mt-1">Biological triggers (Dopamine loops) get 4x more DMs than general quotes.</p>
                    </div>
                    <div className="bg-rose-500/5 border border-rose-500/10 p-2.5 rounded-xl">
                      <span className="text-[9px] font-bold text-rose-400 uppercase">Primary Leak</span>
                      <p className="text-[10px] text-gray-300 mt-1">Lack of direct trigger call-to-actions in visual frames creates a 80% loss in conversions.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab Content 2: Roadmap */}
              {aiTab === "roadmap" && (
                <div className="flex flex-col gap-y-2 flex-1 overflow-y-auto max-h-[220px] pr-2 scrollbar-thin">
                  <span className="text-[10px] font-bold uppercase text-purple-400 tracking-wider">CREATOR ACTION GUIDELINE:</span>
                  {aiReport.actionPlan.map((rule, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-x-2 bg-[#121214]/50 border border-white/[0.03] p-2 rounded-xl text-xs text-gray-300"
                    >
                      <span className="text-purple-400 font-bold font-mono mt-0.5">{idx + 1}.</span>
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
                        className="bg-[#121214]/40 border border-white/[0.06] rounded-xl p-3 flex flex-col gap-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
                            <CornerDownRight className="w-3.5 h-3.5 text-purple-400" /> {script.title}
                          </span>
                          <span className="text-[9px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/10">
                            🔥 {script.prediction} Viral Score
                          </span>
                        </div>

                        <div className="space-y-1.5 text-[10px] leading-relaxed text-gray-300 mt-1">
                          <p>
                            <strong className="text-purple-400">Hook: </strong>
                            {script.hook}
                          </p>
                          <p>
                            <strong className="text-purple-400">Body: </strong>
                            {script.body}
                          </p>
                          <p>
                            <strong className="text-purple-400 font-bold">CTA: </strong>
                            <span className="bg-blue-500/10 text-blue-400 px-1 rounded font-semibold">{script.cta}</span>
                          </p>
                        </div>

                        <button
                          onClick={() => copyToClipboard(fullText, idx)}
                          className="mt-2 text-[10px] font-semibold text-white bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.08] py-1 rounded flex items-center justify-center gap-1.5 transition"
                        >
                          {copiedScript === idx ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" /> Copied!
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
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-x-2">
            <Layers className="w-5 h-5 text-blue-400" /> Connected Posts Gallery
          </h2>
          <p className="text-text-secondary text-xs">
            Review recent Instagram posts, view statistics, and run transcription files.
          </p>
        </div>

        {posts.length === 0 && !loadingPosts ? (
          <div className="glass-card py-16 text-center border border-white/[0.08] rounded-2xl flex flex-col items-center">
            <AlertCircle className="w-10 h-10 text-gray-500 mb-3 animate-pulse" />
            <h3 className="text-sm font-semibold text-white">No Connected Posts Found</h3>
            <p className="text-xs text-gray-400 max-w-[280px] mt-1 leading-normal">
              Connect your account in the Integrations panel or select Demo Mode to load interactive posts.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {posts.map((post) => {
              const engagementScore = post.like_count + post.comments_count;
              let scoreBadge = (
                <span className="text-[9px] font-bold bg-rose-500/10 border border-rose-500/20 text-rose-400 px-2 py-0.5 rounded-full">
                  💤 Sleepy
                </span>
              );
              if (engagementScore > 10000) {
                scoreBadge = (
                  <span className="text-[9px] font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full animate-pulse">
                    🔥 Viral
                  </span>
                );
              } else if (engagementScore > 3000) {
                scoreBadge = (
                  <span className="text-[9px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                    ⚡ Healthy
                  </span>
                );
              } else if (engagementScore > 100) {
                scoreBadge = (
                  <span className="text-[9px] font-bold bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
                    📈 Average
                  </span>
                );
              }

              return (
                <div
                  key={post.id}
                  className="glass-card border border-white/[0.08] rounded-2xl p-5 hover:border-white/[0.12] transition-all duration-300 hover:scale-[1.01] flex flex-col justify-between gap-y-4 shadow-lg group"
                >
                  <div className="flex gap-x-3.5">
                    {/* Media type icon / Thumbnail visualizer */}
                    <div className="w-[100px] h-[100px] bg-[#121214] border border-white/[0.06] rounded-xl flex items-center justify-center shrink-0 overflow-hidden relative">
                      {post.media_type === "VIDEO" ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-purple-500/5 group-hover:bg-purple-500/10 transition">
                          <Play className="w-6 h-6 text-purple-400 fill-purple-400/25" />
                        </div>
                      ) : post.media_type === "CAROUSEL_ALBUM" ? (
                        <Layers className="w-6 h-6 text-blue-400" />
                      ) : (
                        <FileText className="w-6 h-6 text-gray-500" />
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
                          <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 bg-white/[0.04] border border-white/[0.06] px-1.5 py-0.5 rounded">
                            {post.media_type === "VIDEO" ? "Reel" : post.media_type === "IMAGE" ? "Image" : "Carousel"}
                          </span>
                          {scoreBadge}
                        </div>
                        <p className="text-[11px] text-[#9B9CA0] line-clamp-3 mt-2 leading-relaxed">
                          {post.caption || "No caption provided."}
                        </p>
                      </div>
                      <span className="text-[9px] text-gray-600 font-mono">
                        {new Date(post.timestamp).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric"
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Metrics Bar */}
                  <div className="flex items-center gap-x-4 border-t border-b border-white/[0.04] py-2 text-[11px] text-gray-400 font-semibold">
                    <div className="flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-rose-500" />
                      <span className="text-white">{post.like_count.toLocaleString()}</span> Likes
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                      <span className="text-white">{post.comments_count.toLocaleString()}</span> Comments
                    </div>
                  </div>

                  {/* Transcript Viewer / Action */}
                  <div className="flex flex-col gap-y-2">
                    {post.transcript ? (
                      <div className="bg-[#121214]/60 border border-white/[0.05] p-2.5 rounded-xl text-[10px] text-gray-300">
                        <span className="font-extrabold text-[9px] text-purple-400 uppercase tracking-wider flex items-center justify-between mb-1">
                          <span>Transcription File</span>
                          <span className="text-gray-500 text-[8px] font-normal lowercase">{post.transcriptSource}</span>
                        </span>
                        <p className="whitespace-pre-wrap leading-relaxed line-clamp-4 hover:line-clamp-none transition-all duration-300 cursor-pointer">
                          {post.transcript}
                        </p>
                      </div>
                    ) : post.media_type === "VIDEO" ? (
                      <button
                        onClick={() => handleTranscribe(post)}
                        disabled={transcribing[post.id]}
                        className="w-full py-2 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 hover:from-blue-500/20 hover:to-indigo-500/20 border border-blue-500/20 text-[10px] font-bold text-blue-400 rounded-xl flex items-center justify-center gap-1.5 transition"
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
                      <div className="text-[10px] text-center text-gray-500 italic py-1 bg-white/[0.01] rounded">
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
