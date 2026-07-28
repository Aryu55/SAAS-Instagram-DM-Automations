"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPipelineById, updatePipelineStep } from "@/actions/pipelines";
import { getSkills } from "@/actions/skills";
import { getOrganizationConfig } from "@/actions/factory";
import { toast } from "sonner";
import Link from "next/link";
import {
  ArrowLeft, Play, Pause, Loader2, Power, PowerOff, X,
  Zap, FileText, Mic, Video, Scissors, Layers,
  Image as ImageIcon, CheckCircle2, ChevronRight, Settings
} from "lucide-react";

const SUNO_VOICE_PRESETS = [
  { id: "v2/hi_speaker_2", label: "🇮🇳 Hindi Speaker 2 (Male, Warm & Authoritative)", lang: "hi-IN", sampleText: "Suno dosto, agar aap exit dues wait kar rahe ho, toh yeh warning dhyan se suno." },
  { id: "v2/hi_speaker_0", label: "🇮🇳 Hindi Speaker 0 (Female, Professional)", lang: "hi-IN", sampleText: "Namaste! Yeh video aapke business ko next level pe le jayegi." },
  { id: "v2/hi_speaker_5", label: "🇮🇳 Hindi Speaker 5 (Male, Energetic Creator)", lang: "hi-IN", sampleText: "Kya aapne kabhi socha hai ki AI viral videos kaise bante hain?" },
  { id: "v2/en_speaker_0", label: "🇺🇸 English Speaker 0 (Female, Neutral & Clear)", lang: "en-US", sampleText: "Welcome! Today we are looking at 3 incredible AI shortcuts." },
  { id: "v2/en_speaker_3", label: "🇺🇸 English Speaker 3 (Male, Professional Tech)", lang: "en-US", sampleText: "Here is how top creators automate their content pipeline in under 5 minutes." },
  { id: "v2/en_speaker_6", label: "🇺🇸 English Speaker 6 (Male, Deep & Storytelling)", lang: "en-US", sampleText: "Every single brand is making this exact mistake in 2026." },
  { id: "v2/en_speaker_9", label: "🇺🇸 English Speaker 9 (Female, High Energy)", lang: "en-US", sampleText: "Stop asking basic prompts to ChatGPT and learn real AI automation." },
  { id: "v2/de_speaker_0", label: "🇩🇪 German Speaker 0 (Male, Standard)", lang: "de-DE", sampleText: "Hallo und willkommen zu diesem KI-Marketing-Tutorial." },
  { id: "v2/fr_speaker_1", label: "🇫🇷 French Speaker 1 (Female, Expressive)", lang: "fr-FR", sampleText: "Bonjour! Découvrez comment automatiser vos contenus facilement." },
  { id: "v2/ja_speaker_0", label: "🇯🇵 Japanese Speaker 0 (Male, Calm)", lang: "ja-JP", sampleText: "こんにちは。AIコンテンツ生成の新しい方法をご紹介します。" },
  { id: "v2/ko_speaker_0", label: "🇰🇷 Korean Speaker 0 (Female, Bright)", lang: "ko-KR", sampleText: "안녕하세요! AI 비디오 제작 파이프라인을 확인해 보세요." }
];

const STEP_META: Record<string, { icon: React.ReactNode; color: string; label: string; description: string }> = {
  IDEATION:        { icon: <Zap className="w-5 h-5" />, color: "text-amber-400", label: "Ideation", description: "Generate content ideas using brand pillars" },
  SCRIPT:          { icon: <FileText className="w-5 h-5" />, color: "text-blue-400", label: "Script", description: "Write the script using AI" },
  AUDIO_TTS:       { icon: <Mic className="w-5 h-5" />, color: "text-orange-400", label: "Audio (TTS)", description: "Text-to-speech voice synthesis" },
  FOOTAGE_PREP:    { icon: <Video className="w-5 h-5" />, color: "text-cyan-400", label: "Footage Prep", description: "Record or source raw footage" },
  VIDEO_EDIT:      { icon: <Scissors className="w-5 h-5" />, color: "text-purple-400", label: "Video Edit", description: "Apply editing style to footage" },
  BROLL_INJECTION: { icon: <Layers className="w-5 h-5" />, color: "text-pink-400", label: "B-Roll", description: "Inject supporting B-roll footage" },
  CAPTION_OVERLAY: { icon: <FileText className="w-5 h-5" />, color: "text-emerald-400", label: "Captions", description: "Add caption overlays" },
  THUMBNAIL:       { icon: <ImageIcon className="w-5 h-5" />, color: "text-rose-400", label: "Thumbnail", description: "Generate video thumbnail" },
  REVIEW:          { icon: <CheckCircle2 className="w-5 h-5" />, color: "text-green-400", label: "Review", description: "Human approval gate" },
};

export default function PipelineDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const pipelineId = Array.isArray(params.pipelineId) ? params.pipelineId[0] : params.pipelineId;

  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);

  const handlePlayVoiceSample = (preset: typeof SUNO_VOICE_PRESETS[0]) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      toast.error("Speech preview not supported in this browser");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(preset.sampleText);
    utterance.lang = preset.lang;
    utterance.onstart = () => setPlayingVoiceId(preset.id);
    utterance.onend = () => setPlayingVoiceId(null);
    utterance.onerror = () => setPlayingVoiceId(null);
    window.speechSynthesis.speak(utterance);
  };

  // Fetch org
  const { data: orgData } = useQuery({
    queryKey: ["org-config", slug],
    queryFn: () => getOrganizationConfig(slug!),
    enabled: !!slug,
  });
  const orgId = orgData?.status === 200 ? (orgData.data as any)?.id : null;

  // Fetch pipeline
  const { data: pipelineData, isLoading } = useQuery({
    queryKey: ["pipeline", pipelineId],
    queryFn: () => getPipelineById(pipelineId!),
    enabled: !!pipelineId,
  });
  const pipeline = pipelineData?.status === 200 ? (pipelineData.data as any) : null;

  // Fetch skills for assignment
  const { data: skillsData } = useQuery({
    queryKey: ["skills", orgId],
    queryFn: () => getSkills(orgId!),
    enabled: !!orgId,
  });
  const skills = skillsData?.status === 200 ? (skillsData.data as any[]) : [];

  const selectedStep = pipeline?.steps?.find((s: any) => s.id === selectedStepId);

  // Update step mutation
  const updateMut = useMutation({
    mutationFn: ({ stepId, data }: { stepId: string; data: any }) => updatePipelineStep(stepId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipeline", pipelineId] });
      toast.success("Step updated");
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--accent-magenta)]" />
      </div>
    );
  }

  if (!pipeline) {
    return (
      <div className="p-6 text-center">
        <p className="text-[var(--text-secondary)]">Pipeline not found.</p>
      </div>
    );
  }

  const enabledSteps = pipeline.steps?.filter((s: any) => s.isEnabled) || [];
  const disabledSteps = pipeline.steps?.filter((s: any) => !s.isEnabled) || [];

  return (
    <div className="flex flex-col gap-y-6 p-4 lg:p-6 text-[var(--text-primary)]">
      {/* Back + Header */}
      <div className="flex items-center gap-x-4">
        <Link
          href={`/dashboard/${slug}/studio`}
          className="p-2 rounded-lg bg-[var(--page-bg)] border border-[var(--border-color)] hover:border-[var(--accent-magenta)]/40 transition-smooth"
        >
          <ArrowLeft className="w-4 h-4 text-[var(--text-secondary)]" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>
            {pipeline.name}
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            {pipeline.description}
          </p>
        </div>
      </div>

      {/* Horizontal Pipeline Diagram */}
      <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6 shadow-sm overflow-x-auto">
        <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-4" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>
          Active Pipeline Steps
        </p>
        <div className="flex items-center gap-x-3 min-w-max">
          {enabledSteps.map((step: any, idx: number) => {
            const meta = STEP_META[step.stepType] || STEP_META.REVIEW;
            const isSelected = selectedStepId === step.id;

            return (
              <React.Fragment key={step.id}>
                <button
                  onClick={() => setSelectedStepId(isSelected ? null : step.id)}
                  className={`flex flex-col items-center gap-y-2 p-4 rounded-xl border-2 transition-all duration-200 min-w-[120px] ${
                    isSelected
                      ? "border-[var(--accent-magenta)] bg-[var(--accent-magenta)]/5 shadow-lg shadow-[var(--accent-magenta)]/10"
                      : "border-[var(--border-color)] bg-[var(--page-bg)] hover:border-[var(--accent-magenta)]/30"
                  }`}
                >
                  <span className={`p-2 rounded-lg bg-[var(--card-bg)] border border-[var(--border-color)] ${meta.color}`}>
                    {meta.icon}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-primary)]" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>
                    {meta.label}
                  </span>
                  {step.skill && (
                    <span className="text-[9px] text-[var(--accent-magenta)] font-medium truncate max-w-[100px]">
                      {step.skill.name}
                    </span>
                  )}
                  <span className="flex items-center gap-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[8px] text-emerald-400 font-bold uppercase" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>Active</span>
                  </span>
                </button>
                {idx < enabledSteps.length - 1 && (
                  <ChevronRight className="w-5 h-5 text-[var(--text-tertiary)] shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Disabled Steps */}
        {disabledSteps.length > 0 && (
          <>
            <div className="mt-6 mb-3 border-t border-dashed border-[var(--border-color)] pt-4">
              <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>
                Disabled Steps (click to enable)
              </p>
            </div>
            <div className="flex items-center gap-x-3 flex-wrap">
              {disabledSteps.map((step: any) => {
                const meta = STEP_META[step.stepType] || STEP_META.REVIEW;
                return (
                  <button
                    key={step.id}
                    onClick={() => updateMut.mutate({ stepId: step.id, data: { isEnabled: true } })}
                    className="flex items-center gap-x-2 px-3 py-2 rounded-lg border border-dashed border-[var(--border-color)] opacity-40 hover:opacity-70 transition-smooth"
                  >
                    <span className={meta.color}>{meta.icon}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>
                      {meta.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Step Configuration Panel */}
      {selectedStep && (
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-x-3">
              <span className={`p-2 rounded-lg bg-[var(--page-bg)] border border-[var(--border-color)] ${STEP_META[selectedStep.stepType]?.color}`}>
                {STEP_META[selectedStep.stepType]?.icon}
              </span>
              <div>
                <h3 className="text-base font-bold" style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>
                  Configure: {STEP_META[selectedStep.stepType]?.label}
                </h3>
                <p className="text-[10px] text-[var(--text-secondary)]">
                  {STEP_META[selectedStep.stepType]?.description}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-x-2">
              <button
                onClick={() => updateMut.mutate({ stepId: selectedStep.id, data: { isEnabled: false } })}
                className="flex items-center gap-x-1 text-[10px] font-bold text-rose-400 hover:text-rose-300 uppercase tracking-wider transition-smooth"
                style={{ fontFamily: "var(--font-space-grotesk), monospace" }}
              >
                <PowerOff className="w-3.5 h-3.5" />
                Disable
              </button>
              <button
                onClick={() => setSelectedStepId(null)}
                className="p-1.5 hover:bg-[var(--page-bg)] rounded-lg transition-smooth"
              >
                <X className="w-4 h-4 text-[var(--text-secondary)]" />
              </button>
            </div>
          </div>

          {/* Skill Assignment */}
          <div className="flex flex-col gap-y-4">
            <div>
              <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2 block" style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>
                Assigned Skill
              </label>
              <select
                value={selectedStep.skillId || ""}
                onChange={(e) =>
                  updateMut.mutate({
                    stepId: selectedStep.id,
                    data: { skillId: e.target.value || null },
                  })
                }
                className="w-full bg-[var(--page-bg)] border border-[var(--border-color)] rounded-lg px-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-magenta)]/40 transition-smooth"
              >
                <option value="">No skill assigned</option>
                {skills.map((skill: any) => (
                  <option key={skill.id} value={skill.id}>
                    {skill.name} ({skill.type})
                  </option>
                ))}
              </select>
            </div>

            {/* Reference Video Preview (if skill is visual) */}
            {selectedStep.skill?.isVisual && selectedStep.skill?.styleReference?.referenceVideoUrl && (
              <div className="rounded-lg border border-[var(--border-color)] overflow-hidden">
                <div className="p-3 bg-[var(--page-bg)] border-b border-[var(--border-color)]">
                  <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>
                    Reference Video — {selectedStep.skill.name}
                  </p>
                </div>
                <video
                  controls
                  src={selectedStep.skill.styleReference.referenceVideoUrl}
                  className="w-full aspect-video bg-black max-h-[300px]"
                />
              </div>
            )}

            {/* Voice Picker for AUDIO_TTS step */}
            {selectedStep.stepType === "AUDIO_TTS" && (
              <div className="p-4 rounded-xl border border-[var(--accent-magenta)]/20 bg-[var(--accent-magenta)]/5 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[var(--accent-magenta)] uppercase tracking-wider block" style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>
                    🎙️ Suno Bark AI Voice Selection
                  </label>
                  <span className="text-[10px] text-[var(--text-tertiary)] bg-[var(--page-bg)] px-2 py-0.5 rounded border border-[var(--border-color)]">
                    Suno Bark Engine
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                  Select the voice profile used during AI TTS audio synthesis for this pipeline.
                </p>

                {(() => {
                  const currentVoiceId = selectedStep.config?.ttsVoiceId || "v2/hi_speaker_2";
                  const currentPreset = SUNO_VOICE_PRESETS.find(p => p.id === currentVoiceId) || SUNO_VOICE_PRESETS[0];
                  const isPlaying = playingVoiceId === currentPreset.id;

                  return (
                    <div className="flex items-center gap-x-2">
                      <select
                        value={currentVoiceId}
                        onChange={(e) => {
                          const newVoiceId = e.target.value;
                          const existingConfig = selectedStep.config && typeof selectedStep.config === "object" ? selectedStep.config : {};
                          updateMut.mutate({
                            stepId: selectedStep.id,
                            data: { config: { ...existingConfig, ttsVoiceId: newVoiceId, ttsProvider: "bark" } }
                          });
                        }}
                        className="flex-1 bg-[var(--page-bg)] border border-[var(--border-color)] rounded-lg px-3 py-2.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-magenta)] transition-smooth font-medium"
                      >
                        {SUNO_VOICE_PRESETS.map((preset) => (
                          <option key={preset.id} value={preset.id}>
                            {preset.label}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() => handlePlayVoiceSample(currentPreset)}
                        className="px-3 py-2.5 bg-[var(--accent-magenta)] hover:bg-[var(--accent-magenta)]/80 text-white rounded-lg text-xs font-bold transition-all duration-150 flex items-center gap-1.5 shrink-0"
                        title="Audition voice sample"
                      >
                        {isPlaying ? <Pause className="w-3.5 h-3.5 animate-pulse" /> : <Play className="w-3.5 h-3.5" />}
                        {isPlaying ? "Playing..." : "Audition"}
                      </button>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Step Config JSON (advanced) */}
            <div>
              <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2 block" style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>
                Step Configuration (JSON)
              </label>
              <textarea
                value={selectedStep.config ? JSON.stringify(selectedStep.config, null, 2) : ""}
                onChange={(e) => {
                  try {
                    const parsed = e.target.value ? JSON.parse(e.target.value) : null;
                    updateMut.mutate({ stepId: selectedStep.id, data: { config: parsed } });
                  } catch {
                    // Don't save invalid JSON
                  }
                }}
                rows={4}
                placeholder='{"language": "hinglish", "hookStyle": "question"}'
                className="w-full bg-[var(--page-bg)] border border-[var(--border-color)] rounded-lg px-4 py-3 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-magenta)]/40 transition-smooth resize-none font-mono"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
