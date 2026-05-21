"use client";

import React, { useMemo, useState } from "react";
import { v4 } from "uuid";
import { useCreateAutomation } from "@/hooks/use-automation";
import { Button } from "@/components/ui/button";
import Loader from "../loader";
import { AutomationDuoToneWhite } from "@/icons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Search,
  Sparkles,
  MessageSquare,
  Link,
  Target,
  Users,
  Compass,
  Zap,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

type Props = {};

type Template = {
  id: string;
  name: string;
  description: string;
  category: "grow" | "engage" | "traffic";
  triggerType: "DM" | "COMMENT";
  badge: string;
  badgeType: "new" | "popular" | "standard";
  icon: React.ReactNode;
};

function CreateAutomation({}: Props) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const mutationId = useMemo(() => v4(), []);

  const { isPending, mutate } = useCreateAutomation(mutationId);

  const templates: Template[] = [
    {
      id: "say-hi",
      name: "Say hi to new followers",
      description: "Send new followers a one-time welcome message when they hit follow",
      category: "engage",
      triggerType: "DM",
      badge: "NEW BETA",
      badgeType: "new",
      icon: <MessageSquare className="w-6 h-6 text-blue-400" />,
    },
    {
      id: "auto-dm-link",
      name: "Auto-DM links from comments",
      description: "Send a link when people comment on a post or reel",
      category: "traffic",
      triggerType: "COMMENT",
      badge: "POPULAR",
      badgeType: "popular",
      icon: <Link className="w-6 h-6 text-emerald-400" />,
    },
    {
      id: "generate-leads",
      name: "Generate leads with stories",
      description: "Use limited-time offers in your Stories to convert leads",
      category: "grow",
      triggerType: "DM",
      badge: "Quick Automation",
      badgeType: "standard",
      icon: <Target className="w-6 h-6 text-purple-400" />,
    },
    {
      id: "respond-all",
      name: "Respond to all your DMs",
      description: "Auto-send customized replies when people DM you",
      category: "engage",
      triggerType: "DM",
      badge: "Quick Automation",
      badgeType: "standard",
      icon: <Sparkles className="w-6 h-6 text-amber-400" />,
    },
    {
      id: "grow-followers",
      name: "Grow followers from comments",
      description: "Incentivize a follow to grow your followers with discount coupons",
      category: "grow",
      triggerType: "COMMENT",
      badge: "Quick Automation",
      badgeType: "standard",
      icon: <Users className="w-6 h-6 text-rose-400" />,
    },
  ];

  const categories = [
    { id: "all", label: "All templates", group: null },
    { id: "grow", label: "Grow your followers", group: "By goal" },
    { id: "engage", label: "Engage your audience", group: "By goal" },
    { id: "traffic", label: "Drive traffic", group: "By goal" },
    { id: "comment", label: "Post or Reel comment", group: "By trigger" },
    { id: "dm", label: "DM", group: "By trigger" },
  ];

  const groups = {
    all: categories.filter((c) => c.group === null),
    goal: categories.filter((c) => c.group === "By goal"),
    trigger: categories.filter((c) => c.group === "By trigger"),
  };

  const filteredTemplates = templates.filter((tpl) => {
    const matchesSearch =
      tpl.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tpl.description.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeCategory === "all") return true;
    if (activeCategory === "grow" || activeCategory === "engage" || activeCategory === "traffic") {
      return tpl.category === activeCategory;
    }
    if (activeCategory === "dm") return tpl.triggerType === "DM";
    if (activeCategory === "comment") return tpl.triggerType === "COMMENT";
    return true;
  });

  const handleCreate = (templateId?: string) => {
    setSelectedTemplate(templateId || "scratch");
    mutate(templateId);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button className="lg:px-10 py-6 bg-gradient-to-br hover:opacity-80 text-white rounded-full from-[#3352CC] font-medium to-[#1C2D70] flex items-center gap-x-2">
                <AutomationDuoToneWhite />
                <p className="lg:inline hidden">Create Automation</p>
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="bg-[#1a1a1a] border border-white/10 text-white text-xs">
            Create a new automation from scratch or template
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DialogContent className="max-w-4xl w-[95vw] bg-[#0c0c0e] border border-white/[0.08] backdrop-blur-xl rounded-3xl overflow-hidden p-0 gap-0 text-white shadow-2xl shadow-black/80">
        {/* Top Header Section */}
        <div className="p-6 border-b border-white/[0.08] flex flex-col md:flex-row md:items-center justify-between gap-y-4">
          <div>
            <DialogTitle className="text-2xl font-extrabold bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Templates
            </DialogTitle>
            <DialogDescription className="text-gray-400 text-sm mt-1">
              Select a pre-built template or start from a blank canvas.
            </DialogDescription>
          </div>
          <Button
            onClick={() => handleCreate()}
            disabled={isPending}
            className="flex items-center gap-x-2 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white font-semibold px-5 py-4 rounded-xl transition duration-200"
          >
            {isPending && selectedTemplate === "scratch" ? (
              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
            ) : (
              <Compass className="w-4 h-4 text-blue-400" />
            )}
            Start From Scratch
          </Button>
        </div>

        {/* Search bar for mobile / view-wide search */}
        <div className="p-4 border-b border-white/[0.04] bg-[#030303]/30 block md:hidden">
          <div className="flex items-center bg-[#18181b]/50 border border-white/[0.08] rounded-xl px-3 py-2 w-full focus-within:border-blue-500/40 transition duration-150">
            <Search className="w-4 h-4 text-gray-400 mr-2" />
            <input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none focus:ring-0 w-full text-white placeholder-gray-400 text-sm"
            />
          </div>
        </div>

        {/* Main Body */}
        <div className="flex h-[60vh] max-h-[550px]">
          {/* Left Sidebar Menu */}
          <div className="w-60 border-r border-white/[0.08] bg-[#030303]/40 p-4 overflow-y-auto space-y-6 flex-shrink-0 hidden md:block">
            {/* All Templates */}
            <div>
              {groups.all.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveCategory(c.id)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-xl text-sm font-semibold transition duration-150 flex items-center gap-x-2",
                    activeCategory === c.id
                      ? "bg-blue-600/10 border border-blue-500/20 text-blue-400"
                      : "text-gray-400 hover:text-white border border-transparent"
                  )}
                >
                  <Compass className="w-4 h-4" />
                  {c.label}
                </button>
              ))}
            </div>

            {/* By Goal */}
            <div className="space-y-1">
              <p className="text-[10px] uppercase font-bold tracking-wider text-gray-500 px-3">By goal</p>
              {groups.goal.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveCategory(c.id)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition duration-150 flex items-center gap-x-2 border border-transparent",
                    activeCategory === c.id
                      ? "bg-blue-600/10 border-blue-500/20 text-blue-400 font-semibold"
                      : "text-gray-400 hover:text-white"
                  )}
                >
                  {c.id === "grow" && <Users className="w-4 h-4 text-rose-400/80" />}
                  {c.id === "engage" && <Sparkles className="w-4 h-4 text-amber-400/80" />}
                  {c.id === "traffic" && <Link className="w-4 h-4 text-emerald-400/80" />}
                  {c.label}
                </button>
              ))}
            </div>

            {/* By Trigger */}
            <div className="space-y-1">
              <p className="text-[10px] uppercase font-bold tracking-wider text-gray-500 px-3">By trigger</p>
              {groups.trigger.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveCategory(c.id)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition duration-150 flex items-center gap-x-2 border border-transparent",
                    activeCategory === c.id
                      ? "bg-blue-600/10 border-blue-500/20 text-blue-400 font-semibold"
                      : "text-gray-400 hover:text-white"
                  )}
                >
                  <Zap className="w-4 h-4 text-indigo-400/80" />
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right Content Pane */}
          <div className="flex-1 p-6 overflow-y-auto bg-[#070708]/30 flex flex-col gap-y-4">
            {/* Desktop Search Bar */}
            <div className="hidden md:flex items-center bg-[#18181b]/50 border border-white/[0.08] rounded-xl px-3 py-2.5 w-full focus-within:border-blue-500/40 transition duration-150 shadow-inner">
              <Search className="w-5 h-5 text-gray-400 mr-2" />
              <input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none focus:ring-0 w-full text-white placeholder-gray-400 text-sm"
              />
            </div>

            {/* Category horizontal scroll bar on mobile */}
            <div className="flex md:hidden items-center gap-x-2 overflow-x-auto pb-2 scrollbar-none border-b border-white/[0.04]">
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveCategory(c.id)}
                  className={cn(
                    "text-xs px-3 py-1.5 rounded-full whitespace-nowrap border transition duration-150",
                    activeCategory === c.id
                      ? "bg-blue-600/20 border-blue-500/40 text-blue-400 font-semibold"
                      : "bg-white/[0.02] border-white/[0.05] text-gray-400 hover:text-white"
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Grid of templates */}
            {filteredTemplates.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                {filteredTemplates.map((tpl) => {
                  const isCardPending = isPending && selectedTemplate === tpl.id;
                  return (
                    <div
                      key={tpl.id}
                      onClick={() => !isPending && handleCreate(tpl.id)}
                      className={cn(
                        "group relative border border-white/[0.08] hover:border-blue-500/30 rounded-2xl p-5 bg-[#09090b]/40 hover:bg-white/[0.02] transition-all duration-300 flex flex-col justify-between gap-y-4 cursor-pointer shadow-lg hover:shadow-blue-500/[0.02]",
                        isPending ? "opacity-50 pointer-events-none" : ""
                      )}
                    >
                      {/* Card Content */}
                      <div className="flex items-start gap-x-4">
                        <div className="p-3 bg-white/[0.03] border border-white/[0.08] rounded-xl group-hover:bg-blue-500/5 group-hover:border-blue-500/20 transition-all duration-300">
                          {tpl.icon}
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-bold text-base text-white group-hover:text-blue-400 transition-colors duration-200">
                            {tpl.name}
                          </h3>
                          <p className="text-gray-400 text-xs leading-relaxed">
                            {tpl.description}
                          </p>
                        </div>
                      </div>

                      {/* Footer Badge / Quick action text */}
                      <div className="flex items-center justify-between border-t border-white/[0.04] pt-3 mt-1">
                        <span className="text-[10px] text-gray-500 font-medium tracking-wide">
                          {tpl.triggerType} TRIGGER
                        </span>
                        <span
                          className={cn(
                            "text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider",
                            tpl.badgeType === "new"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse"
                              : tpl.badgeType === "popular"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-white/[0.04] text-gray-400 border border-white/[0.05]"
                          )}
                        >
                          {tpl.badge}
                        </span>
                      </div>

                      {/* Spinner Loader overlay for clicked template */}
                      {isCardPending && (
                        <div className="absolute inset-0 bg-[#0c0c0e]/80 flex items-center justify-center rounded-2xl z-10">
                          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
                <Compass className="w-12 h-12 text-gray-600 mb-3" />
                <p className="text-lg font-semibold text-gray-300">No Templates Match</p>
                <p className="text-gray-500 text-sm max-w-xs mt-1">
                  Try adjusting your search keywords or active category.
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default CreateAutomation;
