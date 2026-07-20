"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  Sparkles, Plus, X, Copy, Check, FileText, Tv, Flame, Video,
  Settings as SettingsIcon, Grid, CheckCircle2, XCircle, Clock,
  RotateCw, AlertTriangle, TrendingUp, BarChart3, BookOpen,
  ExternalLink, ChevronDown, ChevronRight, Search, Filter,
  Download, Play, Pause, Zap, Target, Eye, Heart, MessageSquare,
  Share2, Bookmark, ArrowUpRight, Layers, Activity
} from "lucide-react";
import { toast } from "sonner";
import {
  getBusinessConfig,
  updateBusinessConfig,
  getContentIdeas,
  getContentJobs,
  runPipelineForIdea,
  approveAndPublishJob,
  rejectJob,
  createManualIdea,
  generateIdeaBatch
} from "@/actions/factory";

type TabId = "ideas" | "review" | "jobs" | "trends" | "analytics" | "documentary" | "settings";

type Props = {
  params: {
    slug: string;
  };
};

// ─────────────────────────────────────────
// Utility Components
// ─────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; dot: string }> = {
    IDEA:      { bg: "bg-blue-500/8",    text: "text-blue-400",    dot: "bg-blue-400" },
    SCRIPTED:  { bg: "bg-indigo-500/8",  text: "text-indigo-400",  dot: "bg-indigo-400" },
    RENDERING: { bg: "bg-amber-500/8",   text: "text-amber-400",   dot: "bg-amber-400" },
    REVIEW:    { bg: "bg-orange-500/8",  text: "text-orange-400",  dot: "bg-orange-400" },
    APPROVED:  { bg: "bg-emerald-500/8", text: "text-emerald-400", dot: "bg-emerald-400" },
    SCHEDULED: { bg: "bg-cyan-500/8",    text: "text-cyan-400",    dot: "bg-cyan-400" },
    PUBLISHED: { bg: "bg-green-500/8",   text: "text-green-400",   dot: "bg-green-400" },
    REJECTED:  { bg: "bg-rose-500/8",    text: "text-rose-400",    dot: "bg-rose-400" },
    FAILED:    { bg: "bg-red-500/8",     text: "text-red-400",     dot: "bg-red-400" },
  };
  const c = config[status] || config.IDEA;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wide uppercase ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {status}
    </span>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-[#18181b] border border-white/[0.06] rounded-lg p-5 animate-pulse">
      <div className="flex justify-between mb-3">
        <div className="h-3 w-20 bg-white/[0.06] rounded" />
        <div className="h-3 w-16 bg-white/[0.06] rounded" />
      </div>
      <div className="h-4 w-3/4 bg-white/[0.06] rounded mb-2" />
      <div className="h-3 w-full bg-white/[0.06] rounded mb-1" />
      <div className="h-3 w-2/3 bg-white/[0.06] rounded mb-4" />
      <div className="h-8 w-full bg-white/[0.06] rounded" />
    </div>
  );
}

function SkeletonTable() {
  return (
    <div className="bg-[#18181b] border border-white/[0.06] rounded-lg overflow-hidden animate-pulse">
      <div className="h-10 bg-[#121214] border-b border-white/[0.06]" />
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-12 border-b border-white/[0.04] flex items-center gap-4 px-4">
          <div className="h-3 w-24 bg-white/[0.06] rounded" />
          <div className="h-3 w-16 bg-white/[0.06] rounded" />
          <div className="h-3 w-20 bg-white/[0.06] rounded" />
          <div className="h-3 w-12 bg-white/[0.06] rounded" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ icon: Icon, title, description, action, onAction, loading }: {
  icon: any; title: string; description: string; action?: string; onAction?: () => void; loading?: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6">
      <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-4">
        <Icon className="w-5 h-5 text-[#71717a]" />
      </div>
      <h4 className="text-sm font-semibold text-[#fafafa] mb-1">{title}</h4>
      <p className="text-[13px] text-[#71717a] text-center max-w-[40ch] leading-relaxed">{description}</p>
      {action && onAction && (
        <button
          onClick={onAction}
          disabled={loading}
          className="mt-4 px-4 py-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white text-[13px] font-medium rounded-md transition-all duration-150 hover:-translate-y-px disabled:opacity-50"
        >
          {loading ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : action}
        </button>
      )}
    </div>
  );
}

function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-5">
      <div>
        <h3 className="text-[15px] font-semibold text-[#fafafa] tracking-[-0.01em]">{title}</h3>
        {subtitle && <p className="text-[13px] text-[#71717a] mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function StatCard({ label, value, change, icon: Icon }: { label: string; value: string | number; change?: string; icon?: any }) {
  return (
    <div className="bg-[#18181b] border border-white/[0.06] rounded-lg p-4 transition-all duration-150 hover:border-white/[0.1]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-medium text-[#71717a] uppercase tracking-wider">{label}</span>
        {Icon && <Icon className="w-3.5 h-3.5 text-[#52525b]" />}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-semibold text-[#fafafa] tracking-tight">{value}</span>
        {change && (
          <span className={`text-[11px] font-medium ${change.startsWith("+") || change.startsWith("↑") ? "text-emerald-400" : "text-rose-400"}`}>
            {change}
          </span>
        )}
      </div>
    </div>
  );
}

function relativeTime(date: string | Date) {
  const now = Date.now();
  const d = new Date(date).getTime();
  const diff = now - d;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─────────────────────────────────────────
// Main Page Component
// ─────────────────────────────────────────

export default function ContentEnginePage({ params }: Props) {
  const slug = params.slug;
  const WORKER_BASE = "https://marketing-machine-orchestrator.mindmaxing.workers.dev";

  const [activeTab, setActiveTab] = useState<TabId>("ideas");
  const [business, setBusiness] = useState<any>(null);
  const [ideas, setIdeas] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Settings Form
  const [settingsForm, setSettingsForm] = useState({
    name: "", tagline: "", description: "", targetAudience: "",
    painPoints: "", contentPillars: "", voiceTone: "", cta: "",
    hashtags: "", complianceNotes: "", ttsProvider: "auto",
    ttsVoiceId: "v2/hi_speaker_2", language: "hinglish", active: false
  });

  // Manual Idea Form
  const [manualIdea, setManualIdea] = useState({ topic: "", angle: "", pillar: "" });

  // Rejection State
  const [rejectingJobId, setRejectingJobId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Render log expand state
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Trend Hub state (Phase 2)
  const [scrapedPosts, setScrapedPosts] = useState<any[]>([]);
  const [clusters, setClusters] = useState<any[]>([]);

  // Analytics state (Phase 3)
  const [metricsData, setMetricsData] = useState<any>(null);
  const [weeklyReport, setWeeklyReport] = useState<string | null>(null);

  // Documentary state (Phase 4)
  const [timeline, setTimeline] = useState<any[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);

  const loadAllData = useCallback(async () => {
    try {
      const bizRes = await getBusinessConfig(slug);
      if (bizRes.status === 200 && bizRes.data) {
        const biz = bizRes.data;
        setBusiness(biz);
        setSettingsForm({
          name: biz.name || "", tagline: biz.tagline || "",
          description: biz.description || "", targetAudience: biz.targetAudience || "",
          painPoints: biz.painPoints?.join(", ") || "",
          contentPillars: biz.contentPillars?.join(", ") || "",
          voiceTone: biz.voiceTone || "", cta: biz.cta || "",
          hashtags: biz.hashtags || "", complianceNotes: biz.complianceNotes || "",
          ttsProvider: biz.ttsProvider || "auto",
          ttsVoiceId: biz.ttsVoiceId || "v2/hi_speaker_2",
          language: biz.language || "hinglish", active: biz.active || false
        });

        const [ideasRes, jobsRes] = await Promise.all([
          getContentIdeas(biz.id),
          getContentJobs(biz.id)
        ]);
        if (ideasRes.status === 200 && ideasRes.data) setIdeas(ideasRes.data);
        if (jobsRes.status === 200 && jobsRes.data) setJobs(jobsRes.data);
      }
    } catch (e: any) {
      toast.error(`Error loading data: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => { loadAllData(); }, [loadAllData]);

  // ─── Handlers ───

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading("settings");
    try {
      const payload = {
        name: settingsForm.name, tagline: settingsForm.tagline,
        description: settingsForm.description, targetAudience: settingsForm.targetAudience,
        painPoints: settingsForm.painPoints.split(",").map(p => p.trim()).filter(Boolean),
        contentPillars: settingsForm.contentPillars.split(",").map(p => p.trim()).filter(Boolean),
        voiceTone: settingsForm.voiceTone, cta: settingsForm.cta,
        hashtags: settingsForm.hashtags, complianceNotes: settingsForm.complianceNotes,
        ttsProvider: settingsForm.ttsProvider, ttsVoiceId: settingsForm.ttsVoiceId,
        language: settingsForm.language, active: settingsForm.active
      };
      const res = await updateBusinessConfig(slug, payload);
      if (res.status === 200) { toast.success("Settings saved"); loadAllData(); }
      else toast.error(res.error || "Failed to update");
    } catch (err: any) { toast.error(err.message); }
    finally { setActionLoading(null); }
  };

  const triggerBatchGenerate = async () => {
    if (!business) return;
    setActionLoading("generate_ideas");
    try {
      const res = await generateIdeaBatch(slug);
      if (res.status === 200) { toast.success("10 new ideas generated"); loadAllData(); }
      else toast.error(res.error || "Failed to generate ideas");
    } catch (e: any) { toast.error(e.message); }
    finally { setActionLoading(null); }
  };

  const handleCreateManualIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business || !manualIdea.topic.trim()) return;
    setActionLoading("create_manual_idea");
    try {
      const res = await createManualIdea(business.id, manualIdea.topic, manualIdea.angle, manualIdea.pillar);
      if (res.status === 200) { toast.success("Idea added"); setManualIdea({ topic: "", angle: "", pillar: "" }); loadAllData(); }
      else toast.error(res.error || "Failed to create");
    } catch (e: any) { toast.error(e.message); }
    finally { setActionLoading(null); }
  };

  const triggerRender = async (ideaId: string) => {
    if (!business) return;
    setActionLoading(`render_${ideaId}`);
    const toastId = toast.loading("Running pipeline: Script → TTS → Render...");
    try {
      const res = await runPipelineForIdea(business.id, ideaId);
      toast.dismiss(toastId);
      if (res.status === 200) { toast.success("Job queued for rendering"); loadAllData(); setActiveTab("jobs"); }
      else toast.error(res.error || "Pipeline failed");
    } catch (e: any) { toast.dismiss(toastId); toast.error(e.message); }
    finally { setActionLoading(null); }
  };

  const handleApproveJob = async (jobId: string, caption: string) => {
    setActionLoading(`approve_${jobId}`);
    try {
      const res = await approveAndPublishJob(jobId, caption);
      if (res.status === 200) { toast.success("Approved & scheduled to Postiz"); loadAllData(); }
      else toast.error(res.error || "Approval failed");
    } catch (e: any) { toast.error(e.message); }
    finally { setActionLoading(null); }
  };

  const handleRejectJob = async () => {
    if (!rejectingJobId) return;
    setActionLoading(`reject_${rejectingJobId}`);
    try {
      const res = await rejectJob(rejectingJobId, rejectReason);
      if (res.status === 200) { toast.success("Job rejected"); setRejectingJobId(null); setRejectReason(""); loadAllData(); }
      else toast.error(res.error || "Rejection failed");
    } catch (e: any) { toast.error(e.message); }
    finally { setActionLoading(null); }
  };

  // Load trend data dynamically
  const loadTrendData = async () => {
    if (!business) return;
    try {
      const { getScrapedPosts } = await import("@/actions/factory/scraper");
      const res = await getScrapedPosts(business.id);
      if (res.status === 200 && res.data) setScrapedPosts(res.data);
    } catch {}
  };

  // Load analytics data
  const loadAnalytics = async () => {
    if (!business) return;
    try {
      const { getBusinessMetrics, getLatestWeeklyReport } = await import("@/actions/factory/metrics");
      const [metricsRes, reportRes] = await Promise.all([
        getBusinessMetrics(business.id),
        getLatestWeeklyReport(business.id)
      ]);
      if (metricsRes.status === 200) setMetricsData(metricsRes.data);
      if (reportRes.status === 200 && reportRes.data) {
        setWeeklyReport((reportRes.data.detail as any)?.report || null);
      }
    } catch {}
  };

  // Load documentary timeline
  const loadTimeline = async () => {
    if (!business) return;
    try {
      const { getDocumentaryTimeline } = await import("@/actions/factory/documentary");
      const res = await getDocumentaryTimeline(business.id);
      if (res.status === 200 && res.data) {
        setTimeline(res.data.timeline || []);
        setMilestones(res.data.milestones || []);
      }
    } catch {}
  };

  // Lazy-load tab data
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (activeTab === "trends") loadTrendData();
    if (activeTab === "analytics") loadAnalytics();
    if (activeTab === "documentary") loadTimeline();
  }, [activeTab, business?.id]);

  // ─── Loading State ───

  if (loading) {
    return (
      <div className="flex flex-col gap-6 pb-10 animate-fade-in-up">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-5">
          <div>
            <div className="h-3 w-24 bg-white/[0.06] rounded mb-2 animate-pulse" />
            <div className="h-7 w-48 bg-white/[0.06] rounded animate-pulse" />
          </div>
        </div>
        <div className="flex gap-2 border-b border-white/[0.06] pb-1">
          {[...Array(4)].map((_, i) => <div key={i} className="h-8 w-28 bg-white/[0.06] rounded animate-pulse" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  // ─── Onboarding Wizard ───

  if (!business) {
    return (
      <div className="max-w-2xl mx-auto mt-10 animate-fade-in-up">
        <div className="bg-[#18181b] border border-white/[0.06] rounded-lg p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-[#3b82f6]/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-[#3b82f6]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#fafafa]">Onboard &quot;{slug}&quot;</h2>
              <p className="text-[13px] text-[#71717a]">Configure the brand profile to start generating content</p>
            </div>
          </div>

          <form onSubmit={handleSettingsSubmit} className="space-y-4">
            <FormField label="Business Name" required>
              <input type="text" required placeholder="e.g. Hisaab" value={settingsForm.name}
                onChange={e => setSettingsForm(prev => ({ ...prev, name: e.target.value }))}
                className="form-input" />
            </FormField>
            <FormField label="Tagline">
              <input type="text" placeholder="One-line value prop" value={settingsForm.tagline}
                onChange={e => setSettingsForm(prev => ({ ...prev, tagline: e.target.value }))}
                className="form-input" />
            </FormField>
            <FormField label="Product Description" required>
              <textarea required placeholder="What the product does — be specific" value={settingsForm.description}
                onChange={e => setSettingsForm(prev => ({ ...prev, description: e.target.value }))}
                className="form-input h-24 resize-none" />
            </FormField>
            <FormField label="Target Audience" required>
              <input type="text" required placeholder="Who is this for?" value={settingsForm.targetAudience}
                onChange={e => setSettingsForm(prev => ({ ...prev, targetAudience: e.target.value }))}
                className="form-input" />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Pain Points" hint="Comma separated">
                <input type="text" placeholder="Problem 1, Problem 2" value={settingsForm.painPoints}
                  onChange={e => setSettingsForm(prev => ({ ...prev, painPoints: e.target.value }))}
                  className="form-input" />
              </FormField>
              <FormField label="Content Pillars" hint="Comma separated">
                <input type="text" placeholder="Pillar 1, Pillar 2" value={settingsForm.contentPillars}
                  onChange={e => setSettingsForm(prev => ({ ...prev, contentPillars: e.target.value }))}
                  className="form-input" />
              </FormField>
            </div>
            <FormField label="CTA" required>
              <input type="text" required placeholder="Call to action for every video" value={settingsForm.cta}
                onChange={e => setSettingsForm(prev => ({ ...prev, cta: e.target.value }))}
                className="form-input" />
            </FormField>
            <button type="submit" disabled={actionLoading === "settings"}
              className="w-full py-2.5 bg-[#3b82f6] hover:bg-[#2563eb] text-white text-[13px] font-medium rounded-md transition-all duration-150 hover:-translate-y-px disabled:opacity-50">
              {actionLoading === "settings" ? "Creating..." : "Onboard Business"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ─── Derived Data ───

  const reviewJobs = jobs.filter(j => j.status === "REVIEW");
  const unusedIdeas = ideas.filter(i => !i.used);
  const publishedCount = jobs.filter(j => ["PUBLISHED", "SCHEDULED", "APPROVED"].includes(j.status)).length;
  const pendingCount = jobs.filter(j => ["IDEA", "SCRIPTED", "RENDERING"].includes(j.status)).length;

  const tabs: { id: TabId; label: string; icon: any; badge?: number }[] = [
    { id: "ideas", label: "Ideas", icon: Grid, badge: unusedIdeas.length },
    { id: "review", label: "Review", icon: Video, badge: reviewJobs.length },
    { id: "jobs", label: "Pipeline", icon: Layers },
    { id: "trends", label: "Trends", icon: TrendingUp },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "documentary", label: "Documentary", icon: BookOpen },
    { id: "settings", label: "Settings", icon: SettingsIcon },
  ];

  // ─── Main Render ───

  return (
    <div className="flex flex-col gap-6 text-[#fafafa] min-h-screen pb-10 animate-fade-in-up">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/[0.06] pb-5">
        <div>
          <span className="text-[11px] font-medium text-[#3b82f6] uppercase tracking-wider">Content Factory</span>
          <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2.5 mt-0.5">
            {business.name}
            <StatusBadge status={business.active ? "PUBLISHED" : "REJECTED"} />
          </h2>
          <p className="text-[13px] text-[#71717a] mt-1 max-w-[60ch] leading-relaxed">
            {business.tagline || business.description?.slice(0, 100)}
          </p>
        </div>

        <div className="flex items-center gap-3 mt-3 md:mt-0">
          {/* Quick stats */}
          <div className="flex items-center gap-4 text-[11px] text-[#71717a] mr-2">
            <span className="flex items-center gap-1"><Grid className="w-3 h-3" /> {unusedIdeas.length} ideas</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {pendingCount} pending</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> {publishedCount} published</span>
          </div>

          {activeTab === "ideas" && (
            <button onClick={triggerBatchGenerate} disabled={actionLoading === "generate_ideas"}
              className="px-4 py-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white text-[13px] font-medium rounded-md transition-all duration-150 hover:-translate-y-px hover:shadow-lg hover:shadow-blue-500/20 disabled:opacity-50 flex items-center gap-2">
              {actionLoading === "generate_ideas" ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              Generate Ideas
            </button>
          )}
        </div>
      </div>

      {/* ── Tab Navigation ── */}
      <div className="flex gap-1 border-b border-white/[0.06] overflow-x-auto pb-px -mb-px">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium border-b-2 transition-all duration-150 whitespace-nowrap ${
              activeTab === tab.id
                ? "border-[#3b82f6] text-[#fafafa]"
                : "border-transparent text-[#71717a] hover:text-[#a1a1aa]"
            }`}>
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className={`ml-1 px-1.5 py-px rounded-full text-[10px] font-medium ${
                tab.id === "review" ? "bg-orange-500/15 text-orange-400" : "bg-white/[0.06] text-[#a1a1aa]"
              }`}>{tab.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <div className="mt-1">

        {/* ═══════════ IDEAS CALENDAR ═══════════ */}
        {activeTab === "ideas" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8">
              <SectionHeader title="Unused Video Concepts" subtitle={`${unusedIdeas.length} ideas ready to render`} />
              {unusedIdeas.length === 0 ? (
                <EmptyState icon={Sparkles} title="No ideas yet"
                  description="Generate a batch of AI-powered video concepts based on your brand profile."
                  action="Generate 10 Ideas" onAction={triggerBatchGenerate} loading={actionLoading === "generate_ideas"} />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {unusedIdeas.map((idea, idx) => (
                    <div key={idea.id}
                      className="bg-[#18181b] border border-white/[0.06] rounded-lg p-4 flex flex-col justify-between transition-all duration-200 hover:border-white/[0.1] hover:-translate-y-px group"
                      style={{ animationDelay: `${idx * 50}ms` }}>
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] font-medium text-[#52525b] bg-white/[0.04] px-2 py-0.5 rounded">{idea.contentPillar}</span>
                          <span className="text-[10px] font-medium text-[#3b82f6]">{idea.hookStyle}</span>
                        </div>
                        <h4 className="text-[14px] font-medium text-[#fafafa] leading-snug mb-1.5">{idea.topic}</h4>
                        <p className="text-[12px] text-[#71717a] leading-relaxed line-clamp-2">{idea.angle}</p>
                      </div>
                      <button onClick={() => triggerRender(idea.id)} disabled={actionLoading === `render_${idea.id}`}
                        className="mt-3 w-full py-2 bg-transparent border border-white/[0.08] hover:bg-[#3b82f6] hover:border-[#3b82f6] text-[#a1a1aa] hover:text-white rounded-md text-[12px] font-medium transition-all duration-150 flex items-center justify-center gap-1.5">
                        {actionLoading === `render_${idea.id}` ? <RotateCw className="w-3 h-3 animate-spin" /> : <Video className="w-3 h-3" />}
                        Render Video
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar: Manual Idea */}
            <div className="lg:col-span-4">
              <div className="bg-[#18181b] border border-white/[0.06] rounded-lg p-5 sticky top-6">
                <SectionHeader title="Add Manual Idea" subtitle="Custom topic injection" />
                <form onSubmit={handleCreateManualIdea} className="space-y-3">
                  <FormField label="Topic">
                    <input type="text" required placeholder="e.g. 3 HR lies about notice periods"
                      value={manualIdea.topic} onChange={e => setManualIdea(prev => ({ ...prev, topic: e.target.value }))}
                      className="form-input" />
                  </FormField>
                  <FormField label="Angle / Thesis">
                    <textarea required placeholder="The core argument or revelation"
                      value={manualIdea.angle} onChange={e => setManualIdea(prev => ({ ...prev, angle: e.target.value }))}
                      className="form-input h-20 resize-none" />
                  </FormField>
                  <FormField label="Content Pillar">
                    <select required value={manualIdea.pillar} onChange={e => setManualIdea(prev => ({ ...prev, pillar: e.target.value }))}
                      className="form-input">
                      <option value="">Select pillar</option>
                      {business.contentPillars?.map((p: string) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </FormField>
                  <button type="submit" disabled={actionLoading === "create_manual_idea"}
                    className="w-full py-2 bg-white/[0.06] hover:bg-[#3b82f6] text-[#a1a1aa] hover:text-white rounded-md text-[12px] font-medium transition-all duration-150">
                    Add to Calendar
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════ REVIEW QUEUE (THE HEART) ═══════════ */}
        {activeTab === "review" && (
          <div>
            <SectionHeader title="Approval Queue" subtitle={`${reviewJobs.length} videos pending review`} />
            {reviewJobs.length === 0 ? (
              <EmptyState icon={CheckCircle2} title="Queue clear" description="All videos have been reviewed. Generate new content from the Ideas tab." />
            ) : (
              <div className="space-y-6">
                {reviewJobs.map(job => (
                  <div key={job.id} className="bg-[#18181b] border border-white/[0.06] rounded-lg overflow-hidden">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                      {/* Video Player */}
                      <div className="lg:col-span-5 p-5 flex flex-col items-center bg-black/20">
                        <div className="relative aspect-[9/16] w-full max-w-[260px] bg-black rounded-lg overflow-hidden border border-white/[0.08] shadow-2xl">
                          <video src={`${WORKER_BASE}/assets/${job.videoKey}`} controls className="w-full h-full object-cover" />
                        </div>
                        <span className="text-[10px] text-[#52525b] font-mono mt-3">{job.id.slice(0, 8)}…</span>
                      </div>

                      {/* Content + Actions */}
                      <div className="lg:col-span-7 p-5 flex flex-col justify-between">
                        <div className="space-y-4">
                          {/* Caption editor */}
                          <div>
                            <label className="text-[11px] font-medium text-[#71717a] uppercase tracking-wider mb-1.5 block">Caption</label>
                            <textarea defaultValue={job.caption || ""} id={`caption-${job.id}`}
                              className="form-input h-32 text-[13px] leading-relaxed" />
                            <span className="text-[10px] text-[#52525b] mt-1 block">Editable before approval</span>
                          </div>

                          {/* Script verification */}
                          {job.script && (
                            <div className="bg-[#0a0a0c] border border-white/[0.04] rounded-md p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <FileText className="w-3 h-3 text-[#52525b]" />
                                <span className="text-[10px] font-medium text-[#52525b] uppercase tracking-wider">Speech Text</span>
                              </div>
                              <p className="text-[12px] text-[#a1a1aa] italic leading-relaxed">&quot;{job.script.scriptText}&quot;</p>

                              {job.script.hookVariants && job.script.hookVariants.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-white/[0.04]">
                                  <span className="text-[10px] font-medium text-[#52525b] uppercase tracking-wider block mb-1.5">Hook Variants</span>
                                  <div className="flex flex-wrap gap-1.5">
                                    {job.script.hookVariants.map((h: string, i: number) => (
                                      <span key={i} className="text-[11px] text-[#a1a1aa] bg-white/[0.04] px-2 py-1 rounded">{h}</span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 mt-5 pt-4 border-t border-white/[0.06]">
                          <button
                            onClick={() => {
                              const val = (document.getElementById(`caption-${job.id}`) as HTMLTextAreaElement)?.value || "";
                              handleApproveJob(job.id, val);
                            }}
                            disabled={actionLoading === `approve_${job.id}`}
                            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-[13px] font-medium transition-all duration-150 hover:-translate-y-px hover:shadow-lg hover:shadow-emerald-500/20 flex items-center justify-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            Approve & Schedule
                          </button>
                          <button onClick={() => setRejectingJobId(job.id)}
                            className="px-4 py-2.5 bg-transparent border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 rounded-md text-[13px] font-medium transition-all duration-150 flex items-center gap-2">
                            <XCircle className="w-4 h-4" />
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Rejection Modal */}
            {rejectingJobId && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-[#18181b] border border-white/[0.06] rounded-lg max-w-md w-full p-6 animate-fade-in-up">
                  <div className="flex items-center gap-2 mb-4">
                    <XCircle className="w-5 h-5 text-rose-400" />
                    <h4 className="text-[15px] font-semibold text-[#fafafa]">Reject Video</h4>
                  </div>
                  <p className="text-[13px] text-[#71717a] mb-4">Rejection reasons feed the weekly pattern analysis to improve future content.</p>
                  <textarea required placeholder="e.g. Script grammar error / accent felt off / subtitles mismatched"
                    value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                    className="form-input h-24 mb-4" />
                  <div className="flex justify-end gap-3">
                    <button onClick={() => setRejectingJobId(null)}
                      className="px-4 py-2 text-[13px] text-[#a1a1aa] hover:text-white transition-colors">Cancel</button>
                    <button onClick={handleRejectJob} disabled={!rejectReason.trim()}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-[13px] font-medium rounded-md transition-all duration-150 disabled:opacity-50">
                      Confirm Reject
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════ PIPELINE / RENDER LOGS ═══════════ */}
        {activeTab === "jobs" && (
          <div>
            <SectionHeader title="Render Pipeline"
              subtitle={`${jobs.length} total jobs`}
              action={
                <button onClick={loadAllData} className="px-3 py-1.5 text-[12px] text-[#71717a] hover:text-[#fafafa] border border-white/[0.06] hover:border-white/[0.1] rounded-md transition-all duration-150 flex items-center gap-1.5">
                  <RotateCw className="w-3 h-3" /> Refresh
                </button>
              } />

            {jobs.length === 0 ? (
              <EmptyState icon={Layers} title="No pipeline jobs" description="Render a video from the Ideas tab to start the pipeline." />
            ) : (
              <div className="bg-[#18181b] border border-white/[0.06] rounded-lg overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      {["Job", "Status", "Created", "Audio", "Video", ""].map(h => (
                        <th key={h} className="px-4 py-3 text-[11px] font-medium text-[#52525b] uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {jobs.map(job => (
                      <React.Fragment key={job.id}>
                        <tr className="hover:bg-white/[0.02] transition-colors duration-100">
                          <td className="px-4 py-3 text-[12px] font-mono text-[#a1a1aa]">{job.id.slice(0, 8)}…</td>
                          <td className="px-4 py-3"><StatusBadge status={job.status} /></td>
                          <td className="px-4 py-3 text-[12px] text-[#71717a]">{relativeTime(job.createdAt)}</td>
                          <td className="px-4 py-3">
                            {job.audioKey ? (
                              <a href={`${WORKER_BASE}/assets/${job.audioKey}`} target="_blank" rel="noreferrer"
                                className="text-[12px] text-[#3b82f6] hover:text-[#60a5fa] transition-colors">voice.mp3</a>
                            ) : <span className="text-[12px] text-[#3f3f46]">—</span>}
                          </td>
                          <td className="px-4 py-3">
                            {job.videoKey ? (
                              <a href={`${WORKER_BASE}/assets/${job.videoKey}`} target="_blank" rel="noreferrer"
                                className="text-[12px] text-emerald-400 hover:text-emerald-300 font-medium transition-colors flex items-center gap-1">
                                <Play className="w-3 h-3" /> Watch
                              </a>
                            ) : <span className="text-[12px] text-[#3f3f46]">—</span>}
                          </td>
                          <td className="px-4 py-3">
                            {job.renderLog && (
                              <button onClick={() => setExpandedLogId(expandedLogId === job.id ? null : job.id)}
                                className="text-[12px] text-[#71717a] hover:text-[#fafafa] transition-colors flex items-center gap-1">
                                {expandedLogId === job.id ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                Logs
                              </button>
                            )}
                          </td>
                        </tr>
                        {expandedLogId === job.id && job.renderLog && (
                          <tr>
                            <td colSpan={6} className="px-4 py-3 bg-[#0a0a0c]">
                              <pre className="text-[11px] text-[#71717a] font-mono whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                                {job.renderLog}
                              </pre>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ═══════════ TREND HUB (Phase 2) ═══════════ */}
        {activeTab === "trends" && (
          <div>
            <SectionHeader title="Trend Intelligence" subtitle="Competitor analysis and topic clustering" />
            <EmptyState icon={TrendingUp} title="Trend Hub"
              description="Add APIFY_TOKEN to your .env to enable competitor scraping. Once configured, you can analyze trending content and generate ideas from winning patterns."
            />
            {scrapedPosts.length > 0 && (
              <div className="mt-6 bg-[#18181b] border border-white/[0.06] rounded-lg overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      {["Handle", "Platform", "Views", "ER%", "Score", "Cluster"].map(h => (
                        <th key={h} className="px-4 py-3 text-[11px] font-medium text-[#52525b] uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {scrapedPosts.map(post => (
                      <tr key={post.id} className="hover:bg-white/[0.02] transition-colors duration-100">
                        <td className="px-4 py-3 text-[12px] text-[#a1a1aa]">@{post.handle}</td>
                        <td className="px-4 py-3 text-[12px] text-[#71717a]">{post.platform}</td>
                        <td className="px-4 py-3 text-[12px] text-[#fafafa] font-medium">{post.views.toLocaleString()}</td>
                        <td className="px-4 py-3 text-[12px] text-amber-400">{post.er}%</td>
                        <td className="px-4 py-3 text-[12px] text-[#3b82f6] font-medium">{post.score}</td>
                        <td className="px-4 py-3">
                          {post.cluster ? (
                            <span className="text-[10px] bg-white/[0.04] text-[#a1a1aa] px-2 py-0.5 rounded">{post.cluster}</span>
                          ) : <span className="text-[12px] text-[#3f3f46]">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ═══════════ ANALYTICS (Phase 3) ═══════════ */}
        {activeTab === "analytics" && (
          <div>
            <SectionHeader title="Performance Analytics" subtitle="Metrics and winning patterns" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <StatCard label="Total Jobs" value={jobs.length} icon={Layers} />
              <StatCard label="Published" value={publishedCount} icon={CheckCircle2} />
              <StatCard label="Review Queue" value={reviewJobs.length} icon={Clock} />
              <StatCard label="Avg ER" value={metricsData?.summary?.avgER ? `${metricsData.summary.avgER}%` : "—"} icon={Activity} />
            </div>

            {/* Winning Patterns */}
            {business.winningPatterns && (
              <div className="bg-[#18181b] border border-white/[0.06] rounded-lg p-5 mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-4 h-4 text-[#3b82f6]" />
                  <h4 className="text-[14px] font-medium text-[#fafafa]">Winning Patterns</h4>
                </div>
                <p className="text-[13px] text-[#a1a1aa] leading-relaxed">{business.winningPatterns}</p>
              </div>
            )}

            {/* Weekly Report */}
            {weeklyReport ? (
              <div className="bg-[#18181b] border border-white/[0.06] rounded-lg p-5">
                <SectionHeader title="Weekly Report" />
                <div className="text-[13px] text-[#a1a1aa] leading-relaxed prose prose-invert prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: weeklyReport.replace(/\n/g, "<br/>") }} />
              </div>
            ) : (
              <EmptyState icon={BarChart3} title="No analytics yet"
                description="Analytics populate after 5+ published posts. Run the weekly analysis to generate winning patterns and reports." />
            )}
          </div>
        )}

        {/* ═══════════ DOCUMENTARY (Phase 4) ═══════════ */}
        {activeTab === "documentary" && (
          <div>
            <SectionHeader title="Documentary Timeline" subtitle="Every event, timestamped for the YouTube documentary"
              action={
                <button onClick={async () => {
                  try {
                    const { exportTimelineMarkdown } = await import("@/actions/factory/documentary");
                    const res = await exportTimelineMarkdown(business.id);
                    if (res.status === 200 && res.data) {
                      navigator.clipboard.writeText(res.data);
                      toast.success("Timeline copied to clipboard");
                    }
                  } catch { toast.error("Export failed"); }
                }}
                className="px-3 py-1.5 text-[12px] text-[#71717a] hover:text-[#fafafa] border border-white/[0.06] hover:border-white/[0.1] rounded-md transition-all duration-150 flex items-center gap-1.5">
                  <Download className="w-3 h-3" /> Export MD
                </button>
              } />

            {/* Milestones */}
            {milestones.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {milestones.map((m: any, i: number) => (
                  <div key={i} className="bg-[#3b82f6]/8 border border-[#3b82f6]/20 rounded-md px-3 py-1.5 text-[12px] text-[#60a5fa] font-medium">
                    {m.label} • {m.date}
                  </div>
                ))}
              </div>
            )}

            {timeline.length === 0 ? (
              <EmptyState icon={BookOpen} title="No events recorded" description="Events will appear here as you generate, review, and publish content." />
            ) : (
              <div className="space-y-1">
                {timeline.map((log: any, i: number) => (
                  <div key={log.id || i} className="flex items-start gap-3 py-2.5 px-3 rounded-md hover:bg-white/[0.02] transition-colors duration-100">
                    <div className="w-8 h-8 rounded-md bg-white/[0.04] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-sm">{getEventIcon(log.event)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-medium text-[#fafafa]">{formatEventName(log.event)}</span>
                        <span className="text-[11px] text-[#52525b]">{relativeTime(log.createdAt)}</span>
                      </div>
                      {log.detail && (
                        <p className="text-[12px] text-[#71717a] mt-0.5 truncate">{formatDetail(log.detail)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══════════ BRAND SETTINGS ═══════════ */}
        {activeTab === "settings" && (
          <div className="max-w-3xl">
            <form onSubmit={handleSettingsSubmit} className="space-y-8">

              {/* Section: Identity */}
              <SettingsSection title="Brand Identity" description="Core business information used in all content generation">
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Business Name" required>
                    <input type="text" required value={settingsForm.name}
                      onChange={e => setSettingsForm(prev => ({ ...prev, name: e.target.value }))}
                      className="form-input" />
                  </FormField>
                  <FormField label="Tagline">
                    <input type="text" value={settingsForm.tagline}
                      onChange={e => setSettingsForm(prev => ({ ...prev, tagline: e.target.value }))}
                      className="form-input" />
                  </FormField>
                </div>
                <FormField label="Description" required>
                  <textarea required value={settingsForm.description}
                    onChange={e => setSettingsForm(prev => ({ ...prev, description: e.target.value }))}
                    className="form-input h-20 resize-none" />
                </FormField>
              </SettingsSection>

              {/* Section: Audience & Messaging */}
              <SettingsSection title="Audience & Messaging" description="Who you're talking to and how">
                <FormField label="Target Audience" required>
                  <input type="text" required value={settingsForm.targetAudience}
                    onChange={e => setSettingsForm(prev => ({ ...prev, targetAudience: e.target.value }))}
                    className="form-input" />
                </FormField>
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Pain Points" hint="Comma separated">
                    <input type="text" value={settingsForm.painPoints}
                      onChange={e => setSettingsForm(prev => ({ ...prev, painPoints: e.target.value }))}
                      className="form-input" />
                  </FormField>
                  <FormField label="Content Pillars" hint="Comma separated">
                    <input type="text" value={settingsForm.contentPillars}
                      onChange={e => setSettingsForm(prev => ({ ...prev, contentPillars: e.target.value }))}
                      className="form-input" />
                  </FormField>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Voice & Tone">
                    <input type="text" value={settingsForm.voiceTone}
                      onChange={e => setSettingsForm(prev => ({ ...prev, voiceTone: e.target.value }))}
                      className="form-input" />
                  </FormField>
                  <FormField label="CTA" required>
                    <input type="text" required value={settingsForm.cta}
                      onChange={e => setSettingsForm(prev => ({ ...prev, cta: e.target.value }))}
                      className="form-input" />
                  </FormField>
                </div>
                <FormField label="Hashtags">
                  <input type="text" value={settingsForm.hashtags}
                    onChange={e => setSettingsForm(prev => ({ ...prev, hashtags: e.target.value }))}
                    className="form-input" />
                </FormField>
              </SettingsSection>

              {/* Section: Voice & Language */}
              <SettingsSection title="Voice & Language" description="TTS provider and language configuration">
                <div className="grid grid-cols-3 gap-4">
                  <FormField label="Language">
                    <select value={settingsForm.language}
                      onChange={e => setSettingsForm(prev => ({ ...prev, language: e.target.value }))}
                      className="form-input">
                      <option value="hinglish">Hinglish</option>
                      <option value="en">English</option>
                      <option value="hi">Hindi</option>
                    </select>
                  </FormField>
                  <FormField label="TTS Provider">
                    <select value={settingsForm.ttsProvider}
                      onChange={e => setSettingsForm(prev => ({ ...prev, ttsProvider: e.target.value }))}
                      className="form-input">
                      <option value="auto">Auto (Aura/Bark)</option>
                      <option value="aura">Workers AI Aura</option>
                      <option value="bark">Bark via Replicate</option>
                    </select>
                  </FormField>
                  <FormField label="Voice ID">
                    <input type="text" placeholder="v2/hi_speaker_2" value={settingsForm.ttsVoiceId}
                      onChange={e => setSettingsForm(prev => ({ ...prev, ttsVoiceId: e.target.value }))}
                      className="form-input" />
                  </FormField>
                </div>
              </SettingsSection>

              {/* Section: Compliance */}
              <SettingsSection title="Compliance & Safety" description="Legal boundaries for content generation">
                <FormField label="Compliance Notes" hint="The script writer must obey these rules">
                  <textarea value={settingsForm.complianceNotes}
                    onChange={e => setSettingsForm(prev => ({ ...prev, complianceNotes: e.target.value }))}
                    className="form-input h-20 resize-none" placeholder="e.g. Educational only. Never claim to provide legal services." />
                </FormField>
                <div className="bg-amber-500/5 border border-amber-500/10 rounded-md p-3 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-[12px] text-amber-400/80 leading-relaxed">
                    Compliance notes are injected into every script generation prompt. They cannot be overridden by the AI.
                  </p>
                </div>
              </SettingsSection>

              {/* Section: Pipeline Control */}
              <SettingsSection title="Pipeline Control" description="Automation and scheduling">
                <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/[0.06] rounded-lg">
                  <div>
                    <span className="text-[14px] font-medium text-[#fafafa] block">Auto-generate daily content</span>
                    <span className="text-[12px] text-[#71717a]">Vercel cron creates content jobs automatically each morning</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={settingsForm.active}
                      onChange={e => setSettingsForm(prev => ({ ...prev, active: e.target.checked }))}
                      className="sr-only peer" />
                    <div className="w-11 h-6 bg-[#27272a] peer-focus:ring-2 peer-focus:ring-[#3b82f6]/30 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3b82f6]" />
                  </label>
                </div>
              </SettingsSection>

              {/* Asset Checklist */}
              <SettingsSection title="Asset Checklist" description="Required files for rendering">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { name: "logo.png", desc: "Brand logo (transparent PNG)", status: "missing" },
                    { name: "B-roll clips", desc: "10-15 vertical video clips", status: "missing" },
                    { name: "Background music", desc: "Loop-friendly audio", status: "found" },
                  ].map(asset => (
                    <div key={asset.name} className={`border rounded-md p-3 ${asset.status === "found" ? "border-emerald-500/20 bg-emerald-500/5" : "border-white/[0.06] bg-white/[0.02]"}`}>
                      <div className="flex items-center gap-2 mb-1">
                        {asset.status === "found" ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <AlertTriangle className="w-3.5 h-3.5 text-[#52525b]" />}
                        <span className="text-[12px] font-medium text-[#fafafa]">{asset.name}</span>
                      </div>
                      <p className="text-[11px] text-[#71717a]">{asset.desc}</p>
                    </div>
                  ))}
                </div>
              </SettingsSection>

              <button type="submit" disabled={actionLoading === "settings"}
                className="px-6 py-2.5 bg-[#3b82f6] hover:bg-[#2563eb] text-white text-[13px] font-medium rounded-md transition-all duration-150 hover:-translate-y-px hover:shadow-lg hover:shadow-blue-500/20 disabled:opacity-50">
                {actionLoading === "settings" ? "Saving..." : "Save Settings"}
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────

function FormField({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-medium text-[#71717a] uppercase tracking-wider flex items-center gap-1">
        {label}
        {required && <span className="text-rose-400">*</span>}
        {hint && <span className="text-[#52525b] normal-case tracking-normal font-normal">({hint})</span>}
      </label>
      {children}
    </div>
  );
}

function SettingsSection({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="pb-2 border-b border-white/[0.06]">
        <h4 className="text-[14px] font-semibold text-[#fafafa]">{title}</h4>
        {description && <p className="text-[12px] text-[#71717a] mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  );
}

// ─── Documentary helpers ───

function getEventIcon(event: string): string {
  const icons: Record<string, string> = {
    onboarded: "🎬", video_approved_and_published: "📤",
    video_rejected: "❌", cron_pipeline_dispatched: "⚙️",
    weekly_analysis_completed: "📊", render_completed: "🎥", render_failed: "💥"
  };
  return icons[event] || "📌";
}

function formatEventName(event: string): string {
  return event.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function formatDetail(detail: any): string {
  if (typeof detail === "string") return detail;
  if (detail.reason) return detail.reason;
  if (detail.ideaTopic) return `"${detail.ideaTopic}"`;
  if (detail.jobId) return `Job ${String(detail.jobId).slice(0, 8)}…`;
  return JSON.stringify(detail).slice(0, 100);
}
