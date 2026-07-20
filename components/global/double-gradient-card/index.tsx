import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import React from "react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

type Props = {
  label: string;
  subLabel: string;
  description: string;
  href?: string;
};

function DoubleGradientCard({ description, label, subLabel, href }: Props) {
  const cardContent = (
    <div className="border border-[var(--border-color)] bg-[var(--card-bg)] transition-smooth hover:-translate-y-1 hover:shadow-md hover:border-[var(--accent-magenta)]/40 group cursor-pointer h-full rounded-2xl">
      <div className="relative p-6 flex flex-col justify-between min-h-[190px] overflow-hidden h-full">
        <div className="flex flex-col z-40">
          <h2 className="text-xl font-bold text-[var(--text-primary)] tracking-tight group-hover:text-[var(--accent-magenta)] transition-colors duration-200" style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>
            {label}
          </h2>
          <p className="text-[var(--accent-magenta)] text-[10px] uppercase tracking-widest mt-1.5 font-bold" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>{subLabel}</p>
        </div>
        <div className="flex justify-between items-end z-40 gap-x-6 mt-6">
          <p className="text-[var(--text-secondary)] text-xs leading-relaxed max-w-[65ch] font-medium">{description}</p>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button className="rounded-lg bg-[var(--text-primary)] text-[var(--page-bg)] hover:bg-[var(--accent-magenta)] hover:text-white w-9 h-9 p-0 flex items-center justify-center shrink-0 transition-smooth shadow-sm">
                <ArrowRight className="w-4 h-4 transition-smooth group-hover:translate-x-1" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs rounded-lg shadow-xl px-2.5 py-1.5">
              Go to {label}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href} className="block w-full h-full">{cardContent}</Link>;
  }

  return cardContent;
}

export default DoubleGradientCard;
