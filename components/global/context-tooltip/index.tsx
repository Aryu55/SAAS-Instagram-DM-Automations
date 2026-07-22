"use client";

import React from "react";
import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Props = {
  content: string;
  side?: "top" | "right" | "bottom" | "left";
  className?: string;
};

export function ContextHelpTooltip({ content, side = "top", className }: Props) {
  if (!content) return null;

  return (
    <TooltipProvider>
      <Tooltip delayDuration={150}>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={`inline-flex items-center justify-center p-0.5 text-[var(--text-tertiary)] hover:text-[var(--accent-magenta)] transition-colors outline-none cursor-help ${className || ""}`}
            aria-label="Contextual Help"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side={side}
          className="max-w-xs bg-zinc-900 border border-zinc-800 text-zinc-100 text-[11px] rounded-lg p-2.5 shadow-xl leading-relaxed z-50 font-normal"
        >
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
