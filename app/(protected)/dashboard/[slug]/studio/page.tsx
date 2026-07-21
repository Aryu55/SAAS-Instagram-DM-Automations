"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getOrganizationConfig } from "@/actions/factory";
import { getPipelines, togglePipelineActive, duplicatePipeline } from "@/actions/pipelines";
import { toast } from "sonner";
import Link from "next/link";
import {
  Factory, Play, Copy, ChevronRight, Loader2, Zap,
  Power, PowerOff, Layers, FileText, Video, Mic,
  Scissors, Eye, Image as ImageIcon, CheckCircle2
} from "lucide-react";

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

export default function StudioPage() {
  const params = useParams();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const queryClient = useQueryClient();

  const { data: orgData } = useQuery({
    queryKey: ["org-config", slug],
    queryFn: () => getOrganizationConfig(slug!),
    enabled: !!slug,
  });
  const orgId = orgData?.status === 200 ? (orgData.data as any)?.id : null;

  const { data: pipelinesData, isLoading } = useQuery({
    queryKey: ["pipelines", orgId],
    queryFn: () => getPipelines(orgId!),
    enabled: !!orgId,
  });
  const pipelines = pipelinesData?.status === 200 ? (pipelinesData.data as any[]) : [];

  const toggleMut = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => togglePipelineActive(id, active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipelines", orgId] });
      toast.success("Pipeline status updated");
    },
  });

  const dupMut = useMutation({
    mutationFn: (id: string) => duplicatePipeline(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipelines", orgId] });
      toast.success("Pipeline duplicated");
    },
  });

  return (
    <div className="flex flex-col gap-y-6 p-4 lg:p-6 text-[var(--text-primary)]">
      {/* Header */}
      <div>
        <div className="flex items-center gap-x-2 mb-2">
          <span className="inline-flex items-center gap-x-1.5 px-3 py-1 bg-[var(--accent-whisper)] border border-[var(--accent-veil)] text-[var(--accent-magenta)] text-[9px] font-bold tracking-wider uppercase rounded-full" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>
            Manufacturer&apos;s View
          </span>
        </div>
        <h1
          className="text-3xl font-bold"
          style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
        >
          Content Studio
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          Pipeline templates define how your content is manufactured. Click a pipeline to configure its steps.
        </p>
      </div>

      {/* Pipeline Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--accent-magenta)]" />
        </div>
      ) : pipelines.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Factory className="w-10 h-10 text-[var(--text-tertiary)] mb-4" />
          <h3 className="text-xl font-bold" style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>
            No Pipelines
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mt-2 max-w-sm">
            Run the pipeline seed script to create default templates.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {pipelines.map((pipeline: any) => {
            const enabledSteps = pipeline.steps?.filter((s: any) => s.isEnabled) || [];
            const totalSteps = pipeline.steps?.length || 0;

            return (
              <div
                key={pipeline.id}
                className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] shadow-sm overflow-hidden hover:border-[var(--accent-magenta)]/30 transition-all duration-300 group"
              >
                {/* Card Header */}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-base font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-magenta)] transition-colors" style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>
                        {pipeline.name}
                      </h3>
                      <p className="text-[10px] text-[var(--text-secondary)] mt-0.5 line-clamp-1">
                        {pipeline.description}
                      </p>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                      pipeline.isActive
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                    }`} style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>
                      {pipeline.isActive ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </div>

                  {/* Step Pills (mini pipeline preview) */}
                  <div className="flex items-center gap-x-1 flex-wrap mt-3">
                    {(pipeline.steps || []).map((step: any, idx: number) => (
                      <React.Fragment key={step.id}>
                        <span
                          className={`inline-flex items-center gap-x-1 px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider border ${
                            step.isEnabled
                              ? "bg-[var(--page-bg)] text-[var(--text-primary)] border-[var(--border-color)]"
                              : "bg-transparent text-[var(--text-tertiary)] border-transparent opacity-40"
                          }`}
                          style={{ fontFamily: "var(--font-space-grotesk), monospace" }}
                        >
                          {STEP_ICONS[step.stepType]}
                          {step.stepType.replace("_", " ")}
                        </span>
                        {idx < (pipeline.steps || []).length - 1 && (
                          <span className="text-[var(--text-tertiary)] text-[8px]">→</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>

                  <p className="text-[10px] text-[var(--text-tertiary)] mt-3" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>
                    {enabledSteps.length}/{totalSteps} steps enabled
                  </p>
                </div>

                {/* Card Actions */}
                <div className="flex border-t border-[var(--border-color)]">
                  <Link
                    href={`/dashboard/${slug}/studio/${pipeline.id}`}
                    className="flex-1 flex items-center justify-center gap-x-2 py-3 text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] hover:text-[var(--accent-magenta)] hover:bg-[var(--page-bg)]/30 transition-smooth border-r border-[var(--border-color)]"
                    style={{ fontFamily: "var(--font-space-grotesk), monospace" }}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Configure
                  </Link>
                  <button
                    onClick={() => toggleMut.mutate({ id: pipeline.id, active: !pipeline.isActive })}
                    className="flex-1 flex items-center justify-center gap-x-2 py-3 text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] hover:text-[var(--accent-magenta)] hover:bg-[var(--page-bg)]/30 transition-smooth border-r border-[var(--border-color)]"
                    style={{ fontFamily: "var(--font-space-grotesk), monospace" }}
                  >
                    {pipeline.isActive ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
                    {pipeline.isActive ? "Disable" : "Enable"}
                  </button>
                  <button
                    onClick={() => dupMut.mutate(pipeline.id)}
                    className="flex-1 flex items-center justify-center gap-x-2 py-3 text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] hover:text-[var(--accent-magenta)] hover:bg-[var(--page-bg)]/30 transition-smooth"
                    style={{ fontFamily: "var(--font-space-grotesk), monospace" }}
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Duplicate
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
