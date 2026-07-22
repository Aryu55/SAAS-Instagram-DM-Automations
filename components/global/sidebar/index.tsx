"use client";

import { Separator } from "@/components/ui/separator";
import { usePath } from "@/hooks/user-nav";
import { HelpDuoToneWhite } from "@/icons";
import { LogoSmall } from "@/svgs/logo-small";
import React from "react";
import ClerkAuthState from "../clerk-auth-state";
import Items from "./items";


type Props = {
  slug: string;
};

function Sidebar({ slug }: Props) {
  const { page } = usePath();

  return (
    <div className="w-[250px] border-r border-[var(--border-color)] fixed left-0 lg:inline-block bg-[var(--card-bg)] hidden bottom-0 top-0">
      <div className="flex flex-col h-full">
        {/* Fixed Header */}
        <div className="p-6 pb-2">
          <div className="flex gap-x-2 items-center justify-start mb-4 px-2">
            <LogoSmall />
          </div>
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
            <div className="flex flex-col gap-y-4 px-1">
              <ClerkAuthState />
              <button
                type="button"
                onClick={() => window.dispatchEvent(new Event("open-janus-onboarding"))}
                className="flex items-center gap-x-3 text-sm text-[var(--text-secondary)] hover:text-[var(--accent-magenta)] cursor-pointer transition-colors duration-200 w-full text-left"
              >
                <HelpDuoToneWhite />
                <span>Help & Tour</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;

