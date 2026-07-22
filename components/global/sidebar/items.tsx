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
  inbox: "Unified DM inbox & contacts",
  studio: "Content pipeline templates & manufacturing",
  skills: "SOPs, editing styles & reusable capabilities",
  research: "Competitive research & scraped posts",
  intelligence: "Analytics, virality & competitive intelligence",
  activity: "Real-time message activity ledger & error diagnostics",
  discover: "Discord-style organization directory & access requests",
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
              "group capitalize flex items-center gap-x-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-150",
              isActive
                ? "bg-violet-500/10 text-violet-900 dark:text-violet-100 font-semibold border border-violet-500/25 shadow-sm"
                : "text-slate-600 dark:text-zinc-400 hover:text-violet-700 dark:hover:text-violet-300 hover:bg-slate-100/80 dark:hover:bg-zinc-800/60"
            )}
          >
            <span className={cn(
              "transition-colors duration-150 shrink-0",
              isActive ? "text-violet-600 dark:text-violet-400" : "text-slate-400 dark:text-zinc-500 group-hover:text-violet-600 dark:group-hover:text-violet-400"
            )}>
              {item.icon}
            </span>
            <span className="text-xs font-semibold tracking-tight">{item.label}</span>
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right" className="bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs rounded-lg shadow-xl px-3 py-1.5">
          {SIDEBAR_TOOLTIPS[item.label] ?? item.label}
        </TooltipContent>
      </Tooltip>
    );
  });
}

export default Items;


