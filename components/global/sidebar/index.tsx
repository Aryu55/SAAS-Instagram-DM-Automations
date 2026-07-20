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
    <div className="w-[250px] border-r border-[var(--border-color)] fixed left-0 lg:inline-block bg-[var(--card-bg)] hidden bottom-0 top-0 overflow-hidden">
      <div className="flex flex-col h-full p-6 justify-between">
        <div className="flex flex-col gap-y-6">
          <div className="flex gap-x-2 items-center py-4 justify-center">
            <LogoSmall />
          </div>
          <div className="flex flex-col gap-y-1.5">
            <Items page={page} slug={slug} />
          </div>
        </div>

        <div className="flex flex-col gap-y-5">
          <div className="px-4">
            <Separator orientation="horizontal" className="bg-[var(--border-color)]" />
          </div>
          <div className="px-3 flex flex-col gap-y-4">
            <ClerkAuthState />
            <div className="flex items-center gap-x-3 text-sm text-[var(--text-secondary)] hover:text-[var(--accent-magenta)] cursor-pointer transition-colors duration-200">
              <HelpDuoToneWhite />
              <span>Help</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;

