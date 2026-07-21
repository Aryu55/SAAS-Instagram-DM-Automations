import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";

type Props = {
  message: string;
};

function InfoTooltip({ message }: Props) {
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-help inline-flex text-[var(--text-tertiary)] hover:text-[var(--accent-magenta)] transition-colors">
            <Info className="w-3.5 h-3.5" />
          </span>
        </TooltipTrigger>
        <TooltipContent className="bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--text-primary)] shadow-xl max-w-[280px]">
          <p className="text-xs leading-relaxed font-medium">{message}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default InfoTooltip;
