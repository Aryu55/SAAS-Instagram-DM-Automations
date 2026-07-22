"use client";

import { Separator } from "@/components/ui/separator";
import { usePath } from "@/hooks/user-nav";
import { HelpDuoToneWhite } from "@/icons";
import { LogoSmall } from "@/svgs/logo-small";
import React from "react";
import ClerkAuthState from "../clerk-auth-state";
import Items from "./items";


import Link from "next/link";
import { Crown, ArrowLeftRight } from "lucide-react";
import { ThemeToggle } from "../theme-toggle";

type Props = {
  slug: string;
};

function Sidebar({ slug }: Props) {
  const { page } = usePath();

  return (
    <div className="w-[250px] border-r border-[var(--border-color)] fixed left-0 lg:inline-block bg-[var(--card-bg)] hidden bottom-0 top-0">
      <div className="flex flex-col h-full">
        {/* Fixed Header */}
        <div className="p-6 pb-2 space-y-3">
          <div className="flex gap-x-2 items-center justify-start px-2">
            <LogoSmall />
          </div>

          {/* Master Org Navigation Card */}
          <a
            href="/dashboard"
            className="flex items-center justify-between p-2.5 rounded-xl border border-purple-500/20 bg-gradient-to-r from-purple-950/40 via-indigo-950/20 to-black text-amber-300 hover:border-purple-500/40 transition-all shadow-sm group"
          >
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[11px] font-bold leading-none font-mono">Master Org</span>
                <span className="text-[9px] text-purple-300/80 font-mono">Switch Workspace</span>
              </div>
            </div>
            <ArrowLeftRight className="w-3.5 h-3.5 text-purple-400 group-hover:translate-x-0.5 transition-transform" />
          </a>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-2">
          <div className="flex flex-col gap-y-1.5">
            <Items page={page} slug={slug} />
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="p-6 pt-4 mt-auto">
          <div className="flex flex-col gap-y-5">
            <Separator orientation="horizontal" className="bg-[var(--border-color)]" />
            <div className="flex items-center justify-between px-1">
              <ClerkAuthState />
              <ThemeToggle />
            </div>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event("open-janus-onboarding"))}
              className="flex items-center gap-x-3 text-sm text-[var(--text-secondary)] hover:text-[var(--accent-magenta)] cursor-pointer transition-colors duration-200 w-full text-left px-1"
            >
              <HelpDuoToneWhite />
              <span>Help & Tour</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;

