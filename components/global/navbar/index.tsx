"use client";

import { Separator } from "@/components/ui/separator";
import { PAGE_BREAD_CRUMBS } from "@/constants/pages";
import { usePath } from "@/hooks/user-nav";
import { HelpDuoToneWhite } from "@/icons";
import { LogoSmall } from "@/svgs/logo-small";
import { Menu } from "lucide-react";
import MainBreadCrumbs from "../bread-crumb/main-bread-crumbs";
import ClerkAuthState from "../clerk-auth-state";
import CreateAutomation from "../create-automation";
import Sheet from "../sheet";
import Items from "../sidebar/items";

import Notification from "./notification";
import Search from "./search";

type Props = {
  slug: string;
};

function NavBar({ slug }: Props) {
  const { page } = usePath();
  const currentPage = PAGE_BREAD_CRUMBS.includes(page) || page == slug;

  return (
    currentPage && (
      <div className="flex flex-col">
        <div className="flex gap-x-3 lg:gap-x-5 justify-end">
          <span className="lg:hidden flex items-center flex-1 gap-x-2">
            <Sheet trigger={<Menu className="text-[var(--text-primary)] w-5 h-5 cursor-pointer" />} className="lg:hidden" side="left">
              <div className="flex flex-col gap-y-5 w-full h-full p-6 bg-[var(--card-bg)] border-r border-[var(--border-color)]">
                <div className="flex gap-x-2 items-center p-5 justify-center">
                  <LogoSmall />
                </div>
                <div className="flex flex-col py-3">
                  <Items page={page} slug={slug} />
                </div>
                <div className="px-16">
                  <Separator
                    orientation="horizontal"
                    className="bg-[var(--border-color)]"
                  />
                </div>
                <div className="px-3 flex flex-col gap-y-5">
                  <ClerkAuthState />
                  <div className="flex gap-x-3 text-[var(--text-secondary)] hover:text-[var(--accent-magenta)] cursor-pointer transition-colors duration-150">
                    <HelpDuoToneWhite />
                    <p className="font-semibold text-sm">Help</p>
                  </div>
                </div>

              </div>
            </Sheet>
          </span>
          <Search />
          <CreateAutomation />
          <Notification />
        </div>
        <MainBreadCrumbs page={page === slug ? "Home" : page} slug={slug} />
      </div>
    )
  );
}

export default NavBar;
