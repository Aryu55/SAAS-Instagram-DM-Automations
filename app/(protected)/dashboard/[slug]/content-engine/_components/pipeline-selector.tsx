"use client";

import React from "react";
import { Factory, ChevronDown, Zap, FileText, Mic, Video, Scissors, Layers, CheckCircle2, Image as ImageIcon } from "lucide-react";

const STEP_ICONS: Record<string, React.ReactNode> = {
  IDEATION: <Zap className="w-3 h-3" />,
  SCRIPT: <FileText className="w-3 h-3" />,
  AUDIO_TTS: <Mic className="w-3 h-3" />,
  FOOTAGE_PREP: <Video className="w-3 h-3" />,
  VIDEO_EDIT: <Scissors className="w-3 h-3" />,
  BROLL_INJECTION: <Layers className="w-3 h-3" />,
  CAPTION_OVERLAY: <FileText className="w-3 h-3" />,
  THUMBNAIL: <ImageIcon className="w-3 h-3" />,
  REVIEW: <CheckCircle2 className="w-3 h-3" />,
};

type Pipeline = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  steps: { id: string; stepType: string; isEnabled: boolean; skill: any }[];
};

type Props = {
  pipelines: Pipeline[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export default function PipelineSelector({ pipelines, selectedId, onSelect }: Props) {
  const selected = pipelines.find((p) => p.id === selectedId);
  const [open, setOpen] = React.useState(false);

  return (
    <div className="relative mb-6">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4 hover:border-[var(--accent-magenta)]/30 transition-smooth"
      >
        <div className="flex items-center gap-x-3">
          <span className="p-2 rounded-lg bg-[var(--page-bg)] border border-[var(--border-color)] text-[var(--accent-magenta)]">
            <Factory className="w-4 h-4" />
          </span>
          <div className="text-left">
            <p className="text-xs font-bold text-[var(--text-primary)]">
              {selected ? selected.name : "Select a Pipeline"}
            </p>
            <p className="text-[10px] text-[var(--text-secondary)]">
              {selected ? `${selected.steps.filter((s) => s.isEnabled).length} active steps` : "Choose a template to run"}
            </p>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-[var(--text-tertiary)] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-20 top-full mt-2 w-full rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] shadow-xl overflow-hidden">
          {pipelines.filter((p) => p.isActive).map((pipeline) => (
            <button
              key={pipeline.id}
              onClick={() => { onSelect(pipeline.id); setOpen(false); }}
              className={`w-full text-left p-4 hover:bg-[var(--page-bg)]/40 transition-smooth border-b border-[var(--border-color)] last:border-0 ${
                selectedId === pipeline.id ? "bg-[var(--accent-magenta)]/5" : ""
              }`}
            >
              <p className="text-xs font-bold text-[var(--text-primary)]">{pipeline.name}</p>
              <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">{pipeline.description}</p>
              <div className="flex items-center gap-x-1 mt-2">
                {pipeline.steps.filter((s) => s.isEnabled).map((step) => (
                  <span key={step.id} className="text-[var(--text-tertiary)]">
                    {STEP_ICONS[step.stepType]}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
