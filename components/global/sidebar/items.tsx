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
              "capitalize flex items-center gap-x-3 rounded-lg px-4 py-3 text-sm font-medium transition-smooth",
              isActive
                ? "bg-[var(--accent-magenta)]/10 text-[var(--text-primary)] shadow-sm border border-[var(--accent-magenta)]/20"
                : "text-[var(--text-secondary)] hover:text-[var(--accent-magenta)] hover:bg-[var(--card-bg)]/50"
            )}
          >
            <span className={cn(
              "transition-colors duration-200",
              isActive ? "text-[var(--accent-magenta)]" : "text-[var(--text-secondary)] group-hover:text-[var(--accent-magenta)]"
            )}>
              {item.icon}
            </span>
            <span className="font-semibold">{item.label}</span>
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


