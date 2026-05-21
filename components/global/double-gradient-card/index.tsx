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
    <div className="relative glass-card border border-white/[0.08] p-6 rounded-2xl flex flex-col justify-between min-h-[220px] overflow-hidden group transition-all duration-300 hover:border-white/[0.15] cursor-pointer">
      <div className="flex flex-col z-40">
        <h2 className="text-xl font-semibold text-white tracking-tight">{label}</h2>
        <p className="text-text-secondary text-xs mt-1">{subLabel}</p>
      </div>
      <div className="flex justify-between items-end z-40 gap-x-6 mt-6">
        <p className="text-[#9B9CA0] text-sm leading-relaxed">{description}</p>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button className="rounded-xl bg-blue-600 hover:bg-blue-500 w-10 h-10 p-0 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20 transition-all duration-300 group-hover:translate-x-1">
              <ArrowRight className="w-5 h-5 text-white" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="bg-[#1a1a1a] border border-white/10 text-white text-xs">
            Go to {label}
          </TooltipContent>
        </Tooltip>
      </div>
      <div className="w-6/12 h-full absolute radial--double--gradient--cards--top top-0 left-0 z-10 pointer-events-none opacity-60" />
      <div className="w-6/12 h-full absolute radial--double--gradient--cards--bottom top-0 left-1/2 right-0 z-0 pointer-events-none opacity-40" />
    </div>
  );

  if (href) {
    return <Link href={href} className="block w-full h-full">{cardContent}</Link>;
  }

  return cardContent;
}

export default DoubleGradientCard;

