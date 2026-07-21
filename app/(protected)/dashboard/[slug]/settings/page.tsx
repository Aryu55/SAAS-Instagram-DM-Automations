"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getOrganizationConfig, updateOrganizationConfig } from "@/actions/factory";
import { toast } from "sonner";
import {
  Save, Palette, Globe, Target, MessageSquare, Hash,
  Volume2, Megaphone, Shield, Loader2, Check, ChevronDown
} from "lucide-react";

type OrgData = {
  name: string;
  tagline: string;
  description: string;
  targetAudience: string;
  painPoints: string[];
  contentPillars: string[];
  voiceTone: string;
  language: string;
  hinglishRatio: string;
  cta: string;
  hashtags: string;
  complianceNotes: string;
  ttsProvider: string;
  ttsVoiceId: string;
  postsPerDay: number;
};

const FIELD_SECTIONS = [
  {
    title: "Brand Identity",
    icon: <Palette className="w-4 h-4" />,
    fields: ["name", "tagline", "description"],
  },
  {
    title: "Audience & Positioning",
    icon: <Target className="w-4 h-4" />,
    fields: ["targetAudience", "painPoints", "contentPillars"],
  },
  {
    title: "Voice & Language",
    icon: <MessageSquare className="w-4 h-4" />,
    fields: ["voiceTone", "language", "hinglishRatio"],
  },
  {
    title: "Content Defaults",
    icon: <Megaphone className="w-4 h-4" />,
    fields: ["cta", "hashtags", "postsPerDay"],
  },
  {
    title: "Audio / TTS",
    icon: <Volume2 className="w-4 h-4" />,
    fields: ["ttsProvider", "ttsVoiceId"],
  },
  {
    title: "Compliance",
    icon: <Shield className="w-4 h-4" />,
    fields: ["complianceNotes"],
  },
];

const FIELD_LABELS: Record<string, string> = {
  name: "Organization Name",
  tagline: "Tagline",
  description: "Description",
  targetAudience: "Target Audience",
  painPoints: "Pain Points",
  contentPillars: "Content Pillars",
  voiceTone: "Voice & Tone",
  language: "Primary Language",
  hinglishRatio: "Hinglish Ratio",
  cta: "Default CTA",
  hashtags: "Default Hashtags",
  complianceNotes: "Compliance Notes",
  ttsProvider: "TTS Provider",
  ttsVoiceId: "TTS Voice ID",
  postsPerDay: "Posts Per Day",
};

const FIELD_HINTS: Record<string, string> = {
  name: "Your organization's display name",
  tagline: "One-line brand tagline",
  description: "Short description of what this org does",
  targetAudience: "Who are you creating content for?",
  painPoints: "Comma-separated list of audience pain points",
  contentPillars: "Comma-separated list of content themes/pillars",
  voiceTone: "e.g. 'Casual, witty, educational'",
  language: "Primary language for content generation",
  hinglishRatio: "e.g. '65% Hindi, 35% English'",
  cta: "Default call-to-action appended to posts",
  hashtags: "Default hashtags appended to captions",
  complianceNotes: "Legal disclaimers or content restrictions",
  ttsProvider: "'auto', 'elevenlabs', 'google', etc.",
  ttsVoiceId: "Voice ID from your TTS provider",
  postsPerDay: "Target number of posts per day",
};

export default function SettingsPage() {
  const router = useRouter();
  const params = useParams();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const queryClient = useQueryClient();

  const [form, setForm] = useState<OrgData>({
    name: "", tagline: "", description: "", targetAudience: "",
    painPoints: [], contentPillars: [], voiceTone: "", language: "hinglish",
    hinglishRatio: "65% Hindi, 35% English", cta: "", hashtags: "",
    complianceNotes: "", ttsProvider: "auto", ttsVoiceId: "", postsPerDay: 1,
  });
  const [dirty, setDirty] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(FIELD_SECTIONS.map((s) => s.title))
  );

  const { data: orgData, isLoading } = useQuery({
    queryKey: ["org-config", slug],
    queryFn: () => getOrganizationConfig(slug!),
    enabled: !!slug,
  });

  useEffect(() => {
    if (orgData?.status === 200 && orgData.data) {
      const d = orgData.data;
      setForm({
        name: d.name || "",
        tagline: d.tagline || "",
        description: d.description || "",
        targetAudience: d.targetAudience || "",
        painPoints: d.painPoints || [],
        contentPillars: d.contentPillars || [],
        voiceTone: d.voiceTone || "",
        language: d.language || "hinglish",
        hinglishRatio: d.hinglishRatio || "",
        cta: d.cta || "",
        hashtags: d.hashtags || "",
        complianceNotes: d.complianceNotes || "",
        ttsProvider: d.ttsProvider || "auto",
        ttsVoiceId: d.ttsVoiceId || "",
        postsPerDay: d.postsPerDay || 1,
      });
    }
  }, [orgData]);

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload: any = { ...form };
      // Convert comma-separated strings back to arrays if user edited them
      if (typeof payload.painPoints === "string") {
        payload.painPoints = (payload.painPoints as string).split(",").map((s: string) => s.trim()).filter(Boolean);
      }
      if (typeof payload.contentPillars === "string") {
        payload.contentPillars = (payload.contentPillars as string).split(",").map((s: string) => s.trim()).filter(Boolean);
      }
      payload.postsPerDay = Number(payload.postsPerDay) || 1;
      return updateOrganizationConfig(slug!, payload);
    },
    onSuccess: (res) => {
      if (res.status === 200) {
        toast.success("Brand assets saved successfully");
        setDirty(false);
        queryClient.invalidateQueries({ queryKey: ["org-config", slug] });
      } else {
        toast.error("Failed to save: " + (res as any).error);
      }
    },
    onError: (err) => toast.error("Save failed: " + err.message),
  });

  const updateField = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const toggleSection = (title: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  };

  const renderField = (key: string) => {
    const value = (form as any)[key];
    const isArray = Array.isArray(value);
    const displayValue = isArray ? value.join(", ") : String(value ?? "");

    if (key === "postsPerDay") {
      return (
        <input
          type="number"
          min={1}
          max={10}
          value={value}
          onChange={(e) => updateField(key, e.target.value)}
          className="w-full bg-[var(--page-bg)] border border-[var(--border-color)] rounded-lg px-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-magenta)]/40 transition-smooth"
        />
      );
    }

    if (key === "description" || key === "complianceNotes") {
      return (
        <textarea
          value={displayValue}
          onChange={(e) => updateField(key, isArray ? e.target.value : e.target.value)}
          rows={3}
          className="w-full bg-[var(--page-bg)] border border-[var(--border-color)] rounded-lg px-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-magenta)]/40 transition-smooth resize-none"
        />
      );
    }

    return (
      <input
        type="text"
        value={displayValue}
        onChange={(e) => updateField(key, isArray ? e.target.value : e.target.value)}
        className="w-full bg-[var(--page-bg)] border border-[var(--border-color)] rounded-lg px-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-magenta)]/40 transition-smooth"
        placeholder={FIELD_HINTS[key]}
      />
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--accent-magenta)]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-y-6 max-w-3xl w-full p-4 lg:p-6 text-[var(--text-primary)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-y-4">
        <div>
          <h1
            className="text-3xl font-bold text-[var(--text-primary)]"
            style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
          >
            Brand Assets
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            These settings are injected into every content generation run for this organization.
          </p>
        </div>
        <button
          onClick={() => saveMutation.mutate()}
          disabled={!dirty || saveMutation.isPending}
          className={`flex items-center gap-x-2 rounded-lg px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-smooth shadow-sm ${
            dirty
              ? "bg-[var(--accent-magenta)] text-white hover:opacity-90"
              : "bg-[var(--card-bg)] text-[var(--text-tertiary)] border border-[var(--border-color)] cursor-not-allowed"
          }`}
          style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
        >
          {saveMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saveMutation.isSuccess && !dirty ? (
            <Check className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saveMutation.isPending ? "Saving..." : dirty ? "Save Changes" : "Saved"}
        </button>
      </div>

      {/* Form Sections */}
      {FIELD_SECTIONS.map((section) => (
        <div
          key={section.title}
          className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] shadow-sm overflow-hidden"
        >
          <button
            onClick={() => toggleSection(section.title)}
            className="w-full flex items-center justify-between p-5 hover:bg-[var(--page-bg)]/30 transition-smooth"
          >
            <span className="flex items-center gap-x-3">
              <span className="p-2 bg-[var(--page-bg)] rounded-lg border border-[var(--border-color)] text-[var(--accent-magenta)]">
                {section.icon}
              </span>
              <span
                className="text-sm font-bold text-[var(--text-primary)]"
                style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
              >
                {section.title}
              </span>
            </span>
            <ChevronDown
              className={`w-4 h-4 text-[var(--text-tertiary)] transition-transform duration-200 ${
                expandedSections.has(section.title) ? "rotate-180" : ""
              }`}
            />
          </button>

          {expandedSections.has(section.title) && (
            <div className="px-5 pb-5 flex flex-col gap-y-4 border-t border-[var(--border-color)] pt-4">
              {section.fields.map((fieldKey) => (
                <div key={fieldKey} className="flex flex-col gap-y-1.5">
                  <label
                    className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider"
                    style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
                  >
                    {FIELD_LABELS[fieldKey]}
                  </label>
                  {FIELD_HINTS[fieldKey] && (
                    <p className="text-[10px] text-[var(--text-tertiary)]">
                      {FIELD_HINTS[fieldKey]}
                    </p>
                  )}
                  {renderField(fieldKey)}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Logout Section — Preserved from original */}
      <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6 shadow-sm">
        <h2
          className="text-lg font-semibold text-[var(--text-primary)] mb-4"
          style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
        >
          Session
        </h2>
        <button
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            router.push("/sign-in");
            router.refresh();
          }}
          className="rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--accent-magenta)] hover:text-white transition-smooth px-5 py-2.5 text-xs font-bold uppercase tracking-wider shadow-sm"
          style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
        >
          Log out
        </button>
      </div>
    </div>
  );
}
