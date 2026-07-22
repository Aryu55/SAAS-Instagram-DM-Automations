"use client";

import { Separator } from "@/components/ui/separator";
import { usePath } from "@/hooks/user-nav";
import { HelpDuoToneWhite } from "@/icons";
import { LogoSmall } from "@/svgs/logo-small";
import React from "react";
import ClerkAuthState from "../clerk-auth-state";
import Items from "./items";

import Link from "next/link";
import { Crown, ArrowLeftRight, Sparkles } from "lucide-react";
import { ThemeToggle } from "../theme-toggle";
import OrgSwitcher from "../org-switcher";

type Props = {
  slug: string;
};

function Sidebar({ slug }: Props) {
  const { page } = usePath();

  return (
    <div className="w-[250px] border-r border-[var(--border-color)] fixed left-0 lg:inline-block bg-[var(--card-bg)] hidden bottom-0 top-0 z-40">
      <div className="flex flex-col h-full">
        {/* Fixed Header */}
        <div className="p-5 pb-3 space-y-3 border-b border-[var(--border-color)]/60">
          <div className="flex items-center justify-between px-1">
            <LogoSmall />
            <div className="flex items-center gap-1 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full">
              <Sparkles className="w-3 h-3 text-purple-400" />
              <span className="text-[9px] font-mono font-bold text-purple-300 uppercase">v2.0</span>
            </div>
          </div>

          {/* Org Switcher in Sidebar Header */}
          <div className="pt-1">
            <OrgSwitcher currentSlug={slug} />
          </div>

          {/* Master Org Platform Control Tower Button */}
          <a
            href="/dashboard"
            className="flex items-center justify-between p-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:border-amber-500/70 hover:bg-amber-500/15 transition-all shadow-sm group"
            title="Return to Master Platform Overview"
          >
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0 animate-pulse" />
              <div className="flex flex-col">
                <span className="text-[11px] font-bold leading-none font-mono">Master Org</span>
                <span className="text-[9px] text-amber-600/80 dark:text-amber-200/70 font-mono">Control Tower</span>
              </div>
            </div>
            <ArrowLeftRight className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 group-hover:translate-x-0.5 transition-transform" />
          </a>
        </div>

        {/* Scrollable Navigation Items */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          <div className="flex flex-col gap-y-1">
            <Items page={page} slug={slug} />
          </div>
        </div>

        {/* Fixed Footer with Theme Toggle */}
        <div className="p-4 pt-3 mt-auto border-t border-[var(--border-color)] bg-[var(--page-bg)]/40">
          <div className="flex flex-col gap-y-3">
            <div className="flex items-center justify-between px-2">
              <span className="text-[10px] font-mono text-[var(--text-tertiary)] uppercase font-bold tracking-wider">Appearance</span>
              <ThemeToggle />
            </div>

            <Separator orientation="horizontal" className="bg-[var(--border-color)]" />

            <div className="flex items-center justify-between px-1">
              <ClerkAuthState />
              <div className="flex gap-x-2 text-[var(--text-secondary)] hover:text-[var(--accent-magenta)] cursor-pointer transition-colors duration-150 text-xs font-semibold">
                <HelpDuoToneWhite />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
