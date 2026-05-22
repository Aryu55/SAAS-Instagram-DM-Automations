"use client";

import { SIDEBAR_MENU } from "@/constants/menu";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

const SIDEBAR_TOOLTIPS: Record<string, string> = {
  home: "Dashboard overview & metrics",
  contacts: "View & export automation contacts",
  automation: "Create & manage DM automations",
  "content-engine": "AI-powered content creation",
  virality: "Predict script virality & simulate retention",
  analytics: "Instagram post analytics & AI recommendation blueprints",
  integrations: "Connect Instagram & other services",
  settings: "Account & app settings",
};

type Props = {
  page: string;
  slug: string;
};

function Items({ page, slug: propSlug }: Props) {
  const pathname = usePathname();
  const params = useParams();
  const slug = (Array.isArray(params.slug) ? params.slug[0] : params.slug) || propSlug;

  return SIDEBAR_MENU.map((item) => {
    const isHomeActive =
      pathname.toLowerCase() === `/dashboard/${slug}`.toLowerCase() ||
      pathname.toLowerCase() === `/dashboard/${slug}/`.toLowerCase();
    const isPageActive = pathname.toLowerCase().startsWith(`/dashboard/${slug}/${item.label}`.toLowerCase());
    const isActive = item.label === "home" ? isHomeActive : isPageActive;

    return (
      <Tooltip key={item.id}>
        <TooltipTrigger asChild>
          <Link
            href={item.label === "home" ? `/dashboard/${slug}` : `/dashboard/${slug}/${item.label}`}
            className={cn(
              "capitalize flex items-center gap-x-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 border border-transparent",
              isActive
                ? "bg-gradient-to-r from-blue-600/10 to-indigo-600/10 border-blue-500/20 text-white shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                : "text-[#9B9CA0] hover:text-white hover:bg-white/[0.03] hover:border-white/[0.04]"
            )}
          >
            <span className={cn(
              "transition-colors duration-300",
              isActive ? "text-blue-400" : "text-[#9B9CA0] group-hover:text-white"
            )}>
              {item.icon}
            </span>
            <span>{item.label}</span>
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right" className="bg-[#1a1a1a] border border-white/10 text-white text-xs">
          {SIDEBAR_TOOLTIPS[item.label] ?? item.label}
        </TooltipContent>
      </Tooltip>
    );
  });
}

export default Items;


