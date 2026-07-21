"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getOrganizationConfig } from "@/actions/factory";
import {
  getSkills, createSkill, deleteSkill, upsertStyleReference,
  bulkCategorizeAndCreateSkills, generateSkillPreview
} from "@/actions/skills";
import { toast } from "sonner";
import {
  BookOpen, Plus, Trash2, Video, FileText, Eye, X,
  Loader2, Palette, Mic, Search as SearchIcon, Scissors,
  Layers, Sparkles, Code, ChevronRight, Upload, Play, RefreshCw, Wand2
} from "lucide-react";

const SKILL_TYPE_META: Record<string, { icon: React.ReactNode; color: string; label: string; bgGradient: string }> = {
  EDITING_STYLE:    { icon: <Scissors className="w-4 h-4" />, color: "text-purple-400", label: "Editing Style", bgGradient: "from-purple-900/40 to-indigo-900/40" },
  CAPTION_STYLE:    { icon: <FileText className="w-4 h-4" />, color: "text-blue-400", label: "Caption Style", bgGradient: "from-blue-900/40 to-cyan-900/40" },
  BROLL_GENERATION: { icon: <Layers className="w-4 h-4" />, color: "text-amber-400", label: "B-Roll", bgGradient: "from-amber-900/40 to-orange-900/40" },
  CLIP_GENERATION:  { icon: <Video className="w-4 h-4" />, color: "text-pink-400", label: "Clip Gen", bgGradient: "from-pink-900/40 to-rose-900/40" },
  SCRAPER:          { icon: <SearchIcon className="w-4 h-4" />, color: "text-cyan-400", label: "Scraper", bgGradient: "from-cyan-900/40 to-teal-900/40" },
  ANALYTICS:        { icon: <Eye className="w-4 h-4" />, color: "text-emerald-400", label: "Analytics", bgGradient: "from-emerald-900/40 to-green-900/40" },
  VOICE:            { icon: <Mic className="w-4 h-4" />, color: "text-orange-400", label: "Voice", bgGradient: "from-orange-900/40 to-amber-900/40" },
  CUSTOM:           { icon: <Code className="w-4 h-4" />, color: "text-zinc-400", label: "Custom", bgGradient: "from-zinc-900/40 to-slate-900/40" },
};

type SkillWithRef = {
  id: string;
  name: string;
  type: string;
  description: string | null;
  skillFilePath: string | null;
  isVisual: boolean;
  config: any;
  createdAt: string;
  styleReference: {
    id: string;
    referenceVideoUrl: string | null;
    thumbnailUrl: string | null;
    analysisJson: any;
    frameExtracts: string[];
  } | null;
};

export default function SkillsPage() {
  const params = useParams();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const queryClient = useQueryClient();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<SkillWithRef | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");

  // Fetch org to get orgId
  const { data: orgData } = useQuery({
    queryKey: ["org-config", slug],
    queryFn: () => getOrganizationConfig(slug!),
    enabled: !!slug,
  });
  const orgId = orgData?.status === 200 ? (orgData.data as any)?.id : null;

  // Fetch skills
  const { data: skillsData, isLoading } = useQuery({
    queryKey: ["skills", orgId],
    queryFn: () => getSkills(orgId!),
    enabled: !!orgId,
  });
  const skills: SkillWithRef[] = skillsData?.status === 200 ? (skillsData.data as any[]) : [];

  // Filter + search
  const filtered = skills.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.description || "").toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === "ALL" || s.type === filterType;
    return matchesSearch && matchesType;
  });

  // Delete mutation
  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteSkill(id),
    onSuccess: () => {
      toast.success("Skill deleted");
      queryClient.invalidateQueries({ queryKey: ["skills", orgId] });
      if (selectedSkill) setSelectedSkill(null);
    },
  });

  // Regenerate visual preview mutation
  const regenPreviewMut = useMutation({
    mutationFn: (skillId: string) => generateSkillPreview(skillId),
    onSuccess: () => {
      toast.success("AI visual specimen updated and saved");
      queryClient.invalidateQueries({ queryKey: ["skills", orgId] });
    },
  });

  return (
    <div className="flex flex-col gap-y-6 p-4 lg:p-6 text-[var(--text-primary)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-y-4">
        <div>
          <h1
            className="text-3xl font-bold"
            style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
          >
            Skills Library
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            SOPs, editing styles, and reusable capabilities for your content pipelines.
          </p>
        </div>
        <div className="flex items-center gap-x-3">
          <button
            onClick={() => setShowBulkModal(true)}
            className="flex items-center gap-x-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg px-4 py-2.5 text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-smooth shadow-sm"
            style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
          >
            <Sparkles className="w-4 h-4 text-purple-200" />
            Bulk AI Import
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-x-2 bg-[var(--accent-magenta)] text-white rounded-lg px-4 py-2.5 text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-smooth shadow-sm"
            style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
          >
            <Plus className="w-4 h-4" />
            Add Skill
          </button>
        </div>
      </div>

      {/* Search + Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg px-3 py-2 flex-1 focus-within:border-[var(--accent-magenta)]/40 transition-smooth">
          <SearchIcon className="w-4 h-4 text-[var(--text-tertiary)] mr-2" />
          <input
            type="text"
            placeholder="Search skills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-xs text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] w-full"
          />
        </div>
        <div className="flex bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg p-1 text-[10px] font-bold overflow-x-auto" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>
          {["ALL", ...Object.keys(SKILL_TYPE_META)].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-md transition-smooth whitespace-nowrap uppercase ${
                filterType === t
                  ? "bg-[var(--page-bg)] text-[var(--text-primary)] border border-[var(--border-color)] shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--accent-magenta)]"
              }`}
            >
              {t === "ALL" ? "All" : SKILL_TYPE_META[t]?.label || t}
            </button>
          ))}
        </div>
      </div>

      {/* Skills Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--accent-magenta)]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="p-4 bg-[var(--page-bg)] border border-[var(--border-color)] rounded-xl mb-4">
            <BookOpen className="w-8 h-8 text-[var(--text-tertiary)]" />
          </div>
          <h3
            className="text-xl font-bold text-[var(--text-primary)]"
            style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
          >
            No Skills Yet
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mt-2 max-w-sm">
            Add your first skill or use Bulk AI Import to upload multiple editing styles, caption templates, or voice profiles.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((skill) => {
            const meta = SKILL_TYPE_META[skill.type] || SKILL_TYPE_META.CUSTOM;
            const preview = skill.config?.generatedPreview;
            const isEditingStyle = skill.type === "EDITING_STYLE";
            const videoUrl = skill.styleReference?.referenceVideoUrl;

            return (
              <button
                key={skill.id}
                onClick={() => setSelectedSkill(skill)}
                className="group text-left rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] overflow-hidden hover:border-[var(--accent-magenta)]/40 transition-all duration-300 hover:shadow-lg hover:shadow-[var(--accent-magenta)]/5 flex flex-col justify-between"
              >
                {/* Skill Card Visual Header */}
                {isEditingStyle && videoUrl ? (
                  <div className="relative w-full aspect-video bg-black overflow-hidden group-hover:opacity-90 transition-opacity">
                    <video
                      src={videoUrl}
                      muted
                      playsInline
                      className="w-full h-full object-cover pointer-events-none opacity-80"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3">
                      <span className="flex items-center gap-1 text-[10px] font-bold text-white bg-purple-600/80 px-2 py-0.5 rounded-full backdrop-blur-sm">
                        <Play className="w-3 h-3 fill-white" /> Reference Video Preview
                      </span>
                    </div>
                  </div>
                ) : preview ? (
                  <div className={`p-4 bg-gradient-to-r ${preview.gradient || "from-purple-900/40 to-indigo-900/40"} border-b border-[var(--border-color)] flex items-center justify-between`}>
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-white/80 bg-black/30 px-2 py-0.5 rounded" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>
                        {preview.badge || meta.label}
                      </span>
                      <p className="text-xs font-semibold text-white mt-1.5 line-clamp-1">
                        {preview.keyTakeaway || skill.name}
                      </p>
                    </div>
                    <Sparkles className="w-4 h-4 text-white/60 shrink-0" />
                  </div>
                ) : null}

                {/* Main Card Info */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <span className={`p-2 rounded-lg bg-[var(--page-bg)] border border-[var(--border-color)] ${meta.color}`}>
                        {meta.icon}
                      </span>
                      {skill.isVisual && (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase tracking-wider" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>
                          Visual
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-magenta)] transition-colors mb-1">
                      {skill.name}
                    </h3>
                    <p className="text-[10px] text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                      {skill.description || "No description"}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-[var(--border-color)]">
                    <span className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>
                      {meta.label}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-[var(--text-tertiary)] group-hover:text-[var(--accent-magenta)] transition-colors" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Skill Detail Side Panel */}
      {selectedSkill && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelectedSkill(null)} />
          <div className="relative w-full max-w-lg bg-[var(--card-bg)] border-l border-[var(--border-color)] overflow-y-auto shadow-2xl">
            <div className="p-6 flex flex-col gap-y-5">
              <div className="flex items-center justify-between">
                <h2
                  className="text-xl font-bold text-[var(--text-primary)]"
                  style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
                >
                  {selectedSkill.name}
                </h2>
                <button onClick={() => setSelectedSkill(null)} className="p-2 hover:bg-[var(--page-bg)] rounded-lg transition-smooth">
                  <X className="w-4 h-4 text-[var(--text-secondary)]" />
                </button>
              </div>

              <div className="flex items-center gap-x-3">
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${SKILL_TYPE_META[selectedSkill.type]?.color || "text-zinc-400"} bg-[var(--page-bg)] border-[var(--border-color)]`} style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>
                  {SKILL_TYPE_META[selectedSkill.type]?.label || selectedSkill.type}
                </span>
                {selectedSkill.isVisual && (
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase tracking-wider" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>
                    Visual Skill
                  </span>
                )}
              </div>

              {selectedSkill.description && (
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {selectedSkill.description}
                </p>
              )}

              {selectedSkill.skillFilePath && (
                <div className="rounded-lg bg-[var(--page-bg)] border border-[var(--border-color)] p-4">
                  <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-1" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>
                    Skill File Path
                  </p>
                  <code className="text-xs text-[var(--text-primary)] font-mono break-all">
                    {selectedSkill.skillFilePath}
                  </code>
                </div>
              )}

              {/* Reference Video Preview (for visual skills) */}
              {selectedSkill.isVisual && selectedSkill.styleReference?.referenceVideoUrl && (
                <div className="rounded-lg border border-[var(--border-color)] overflow-hidden">
                  <div className="p-3 bg-[var(--page-bg)] border-b border-[var(--border-color)]">
                    <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>
                      Reference Video
                    </p>
                  </div>
                  <video
                    controls
                    src={selectedSkill.styleReference.referenceVideoUrl}
                    className="w-full aspect-video bg-black"
                  />
                </div>
              )}

              {/* Style Analysis JSON (if available) */}
              {selectedSkill.styleReference?.analysisJson && (
                <div className="rounded-lg bg-[var(--page-bg)] border border-[var(--border-color)] p-4">
                  <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-2" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>
                    Style Analysis
                  </p>
                  <pre className="text-xs text-[var(--text-secondary)] overflow-x-auto whitespace-pre-wrap font-mono">
                    {JSON.stringify(selectedSkill.styleReference.analysisJson, null, 2)}
                  </pre>
                </div>
              )}

              {/* Config JSON (if available) */}
              {selectedSkill.config && (
                <div className="rounded-lg bg-[var(--page-bg)] border border-[var(--border-color)] p-4">
                  <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-2" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>
                    Configuration
                  </p>
                  <pre className="text-xs text-[var(--text-secondary)] overflow-x-auto whitespace-pre-wrap font-mono">
                    {JSON.stringify(selectedSkill.config, null, 2)}
                  </pre>
                </div>
              )}

              {/* AI Specimen or Regenerate Button for non-editing skills */}
              {selectedSkill.type !== "EDITING_STYLE" && (
                <button
                  onClick={() => regenPreviewMut.mutate(selectedSkill.id)}
                  disabled={regenPreviewMut.isPending}
                  className="flex items-center justify-center gap-x-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg px-4 py-2.5 text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-smooth shadow-sm disabled:opacity-50"
                  style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
                >
                  {regenPreviewMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                  {selectedSkill.config?.generatedPreview ? "Regenerate AI Visual Specimen" : "Generate & Cache AI Visual Specimen"}
                </button>
              )}

              {/* Delete Button */}
              <button
                onClick={() => {
                  if (confirm(`Delete skill "${selectedSkill.name}"?`)) {
                    deleteMut.mutate(selectedSkill.id);
                  }
                }}
                className="flex items-center gap-x-2 text-rose-400 hover:text-rose-300 text-xs font-bold uppercase tracking-wider mt-2 transition-smooth"
                style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
              >
                <Trash2 className="w-4 h-4" />
                Delete Skill
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk AI Import Modal */}
      {showBulkModal && orgId && (
        <BulkImportModal
          orgId={orgId}
          onClose={() => setShowBulkModal(false)}
          onSuccess={() => {
            setShowBulkModal(false);
            queryClient.invalidateQueries({ queryKey: ["skills", orgId] });
          }}
        />
      )}

      {/* Create Skill Modal */}
      {showCreateModal && orgId && (
        <CreateSkillModal
          orgId={orgId}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            queryClient.invalidateQueries({ queryKey: ["skills", orgId] });
          }}
        />
      )}
    </div>
  );
}

// ─── Bulk Import Modal Component ───

function BulkImportModal({
  orgId,
  onClose,
  onSuccess,
}: {
  orgId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [rawText, setRawText] = useState(
    `- Fast Zoom-Ins & Jump Cuts (Telusko style rapid technical edits)\n- Hormozi Yellow Pop Captions with dynamic word highlights\n- High-Retention AI B-Roll Injector (Tech stock video overlay)\n- Hindi AI Voiceover Profile (Energetic Male Tech Narrator)\n- Instagram Competitor Reel Scraper & Keyword Miner\n- AI Talking Head Avatar Generator (Faceless explainer snippets)`
  );

  const bulkMut = useMutation({
    mutationFn: async () => {
      const res = await bulkCategorizeAndCreateSkills({ orgId, rawText });
      if (res.status !== 200) throw new Error((res as any).error || "Failed to bulk import");
      return res;
    },
    onSuccess: (res: any) => {
      toast.success(`Successfully auto-categorized and imported ${res.count || 0} skills!`);
      onSuccess();
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl shadow-2xl p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-x-2">
            <span className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <h2
                className="text-lg font-bold text-[var(--text-primary)]"
                style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
              >
                Bulk AI Skill Import
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Paste raw skill descriptions. AI will auto-categorize into Editing, Captions, Voice, B-Roll, etc., and generate saved visual cards.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[var(--page-bg)] rounded-lg transition-smooth">
            <X className="w-4 h-4 text-[var(--text-secondary)]" />
          </button>
        </div>

        <div className="flex flex-col gap-y-4">
          <div>
            <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5 block" style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>
              Raw Skills Input (Line or Paragraph separated)
            </label>
            <textarea
              rows={8}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste skill SOPs, editing styles, captions, or voice profiles here..."
              className="w-full bg-[var(--page-bg)] border border-[var(--border-color)] rounded-xl p-4 text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-magenta)]/40 transition-smooth resize-none leading-relaxed"
            />
          </div>

          <div className="rounded-xl bg-purple-500/5 border border-purple-500/20 p-3 flex items-start gap-x-3">
            <Wand2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-purple-200/90 leading-relaxed font-medium">
              Editing Style skills will allow linking reference videos (/watch). Non-editing skills will get AI-generated visual cards cached in DB so no tokens are wasted.
            </p>
          </div>

          <button
            onClick={() => bulkMut.mutate()}
            disabled={!rawText.trim() || bulkMut.isPending}
            className="w-full flex items-center justify-center gap-x-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl px-5 py-3 text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-smooth shadow-md disabled:opacity-50"
            style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
          >
            {bulkMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {bulkMut.isPending ? "AI Auto-Categorizing Skills..." : "Import & Auto-Categorize with AI"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Create Skill Modal Component ───

function CreateSkillModal({
  orgId,
  onClose,
  onSuccess,
}: {
  orgId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState("EDITING_STYLE");
  const [description, setDescription] = useState("");
  const [skillFilePath, setSkillFilePath] = useState("");
  const [isVisual, setIsVisual] = useState(true);
  const [refVideoUrl, setRefVideoUrl] = useState("");

  const createMut = useMutation({
    mutationFn: async () => {
      const res = await createSkill({
        orgId,
        name,
        type,
        description: description || undefined,
        skillFilePath: skillFilePath || undefined,
        isVisual,
      });
      if (res.status !== 200) throw new Error((res as any).error || "Failed to create");

      // If visual + has reference video URL, also create StyleReference
      if (isVisual && refVideoUrl && res.data) {
        await upsertStyleReference({
          skillId: (res.data as any).id,
          referenceVideoUrl: refVideoUrl,
        });
      }

      // If not editing style, trigger preview generation to cache in DB
      if (type !== "EDITING_STYLE" && res.data) {
        await generateSkillPreview((res.data as any).id);
      }

      return res;
    },
    onSuccess: () => {
      toast.success(`Skill "${name}" created`);
      onSuccess();
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl shadow-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2
            className="text-lg font-bold text-[var(--text-primary)]"
            style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
          >
            Add New Skill
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-[var(--page-bg)] rounded-lg transition-smooth">
            <X className="w-4 h-4 text-[var(--text-secondary)]" />
          </button>
        </div>

        <div className="flex flex-col gap-y-4">
          <div>
            <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1 block" style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>
              Skill Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Telusko Edit Style"
              className="w-full bg-[var(--page-bg)] border border-[var(--border-color)] rounded-lg px-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-magenta)]/40 transition-smooth"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1 block" style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>
              Type *
            </label>
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setIsVisual(["EDITING_STYLE", "CLIP_GENERATION", "BROLL_GENERATION"].includes(e.target.value));
              }}
              className="w-full bg-[var(--page-bg)] border border-[var(--border-color)] rounded-lg px-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-magenta)]/40 transition-smooth"
            >
              {Object.entries(SKILL_TYPE_META).map(([val, meta]) => (
                <option key={val} value={val}>{meta.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1 block" style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this skill do?"
              rows={2}
              className="w-full bg-[var(--page-bg)] border border-[var(--border-color)] rounded-lg px-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-magenta)]/40 transition-smooth resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1 block" style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>
              SKILL.md File Path
            </label>
            <input
              type="text"
              value={skillFilePath}
              onChange={(e) => setSkillFilePath(e.target.value)}
              placeholder="/path/to/SKILL.md"
              className="w-full bg-[var(--page-bg)] border border-[var(--border-color)] rounded-lg px-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-magenta)]/40 transition-smooth font-mono"
            />
          </div>

          {isVisual && (
            <div>
              <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1 block" style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>
                Reference Video URL (/watch)
              </label>
              <input
                type="text"
                value={refVideoUrl}
                onChange={(e) => setRefVideoUrl(e.target.value)}
                placeholder="https://... or /path/to/video.mp4"
                className="w-full bg-[var(--page-bg)] border border-[var(--border-color)] rounded-lg px-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-magenta)]/40 transition-smooth font-mono"
              />
              <p className="text-[10px] text-[var(--text-tertiary)] mt-1">
                This video will be used as the style reference for editing.
              </p>
            </div>
          )}

          <div className="flex items-center gap-x-3 mt-1">
            <input
              type="checkbox"
              checked={isVisual}
              onChange={(e) => setIsVisual(e.target.checked)}
              className="rounded border-[var(--border-color)]"
              id="isVisual"
            />
            <label htmlFor="isVisual" className="text-xs text-[var(--text-secondary)] font-medium">
              This is a visual skill (shows video preview in pipelines)
            </label>
          </div>

          <button
            onClick={() => createMut.mutate()}
            disabled={!name || createMut.isPending}
            className="w-full mt-2 flex items-center justify-center gap-x-2 bg-[var(--accent-magenta)] text-white rounded-lg px-5 py-3 text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-smooth shadow-sm disabled:opacity-50"
            style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
          >
            {createMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {createMut.isPending ? "Creating..." : "Create Skill"}
          </button>
        </div>
      </div>
    </div>
  );
}

