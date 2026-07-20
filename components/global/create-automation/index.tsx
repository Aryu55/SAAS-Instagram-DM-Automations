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
              <Button className="lg:px-8 py-5 bg-[var(--card-bg)] border border-[var(--border-color)] hover:bg-[var(--accent-magenta)] hover:text-white hover:border-[var(--accent-magenta)]/20 text-[var(--text-primary)] font-bold text-[10px] uppercase tracking-wider rounded-lg flex items-center gap-x-2 transition-smooth">
                <AutomationDuoToneWhite />
                <p className="lg:inline hidden">Create Automation</p>
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs rounded-lg shadow-xl px-2.5 py-1.5">
            Create a new automation from scratch or template
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DialogContent className="max-w-4xl w-[95vw] bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl overflow-hidden p-0 gap-0 text-[var(--text-primary)] shadow-2xl shadow-black/80">
        {/* Top Header Section */}
        <div className="p-6 border-b border-[var(--border-color)] flex flex-col md:flex-row md:items-center justify-between gap-y-4">
          <div>
            <DialogTitle className="text-3xl font-bold text-[var(--text-primary)]" style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>
              Templates Catalog
            </DialogTitle>
            <DialogDescription className="text-[var(--text-secondary)] text-xs mt-1">
              Select a pre-built template or start from a blank canvas.
            </DialogDescription>
          </div>
          <Button
            onClick={() => handleCreate()}
            disabled={isPending}
            className="flex items-center gap-x-2 bg-[var(--page-bg)] hover:bg-[var(--accent-magenta)] hover:text-white border border-[var(--border-color)] text-[var(--text-primary)] font-bold text-[10px] uppercase tracking-wider px-5 py-3 rounded-lg transition duration-200"
          >
            {isPending && selectedTemplate === "scratch" ? (
              <Loader2 className="w-4.5 h-4.5 animate-spin text-[var(--accent-magenta)]" />
            ) : (
              <Compass className="w-4 h-4 text-[var(--accent-magenta)]" />
            )}
            Start From Scratch
          </Button>
        </div>

        {/* Search bar for mobile / view-wide search */}
        <div className="p-4 border-b border-[var(--border-color)] bg-black/20 block md:hidden">
          <div className="flex items-center bg-[var(--page-bg)]/50 border border-[var(--border-color)] rounded-lg px-3 py-2 w-full focus-within:border-[var(--accent-magenta)]/30 transition duration-150">
            <Search className="w-4 h-4 text-[var(--text-secondary)] mr-2" />
            <input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none focus:ring-0 w-full text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] text-sm"
            />
          </div>
        </div>

        {/* Main Body */}
        <div className="flex h-[60vh] max-h-[500px]">
          {/* Left Sidebar Menu */}
          <div className="w-60 border-r border-[var(--border-color)] bg-black/10 p-4 overflow-y-auto space-y-6 flex-shrink-0 hidden md:block">
            {/* All Templates */}
            <div>
              {groups.all.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveCategory(c.id)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition duration-150 flex items-center gap-x-2 border border-transparent",
                    activeCategory === c.id
                      ? "bg-[var(--accent-magenta)]/10 border border-[var(--accent-magenta)]/20 text-[var(--accent-magenta)]"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  )}
                >
                  <Compass className="w-4 h-4" />
                  {c.label}
                </button>
              ))}
            </div>

            {/* By Goal */}
            <div className="space-y-1">
              <p className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-secondary)] px-3" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>By goal</p>
              {groups.goal.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveCategory(c.id)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition duration-150 flex items-center gap-x-2 border border-transparent",
                    activeCategory === c.id
                      ? "bg-[var(--accent-magenta)]/10 border border-[var(--accent-magenta)]/20 text-[var(--accent-magenta)] font-semibold"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
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
              <p className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-secondary)] px-3" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>By trigger</p>
              {groups.trigger.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveCategory(c.id)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition duration-150 flex items-center gap-x-2 border border-transparent",
                    activeCategory === c.id
                      ? "bg-[var(--accent-magenta)]/10 border border-[var(--accent-magenta)]/20 text-[var(--accent-magenta)] font-semibold"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  )}
                >
                  <Zap className="w-4 h-4 text-indigo-400/80" />
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right Content Pane */}
          <div className="flex-1 p-6 overflow-y-auto bg-black/5 flex flex-col gap-y-4">
            {/* Desktop Search Bar */}
            <div className="hidden md:flex items-center bg-[var(--page-bg)]/50 border border-[var(--border-color)] rounded-lg px-3 py-2.5 w-full focus-within:border-[var(--accent-magenta)]/30 transition duration-150">
              <Search className="w-4 h-4 text-[var(--text-secondary)] mr-2" />
              <input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none focus:ring-0 w-full text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] text-xs"
              />
            </div>

            {/* Category horizontal scroll bar on mobile */}
            <div className="flex md:hidden items-center gap-x-2 overflow-x-auto pb-2 scrollbar-none border-b border-[var(--border-color)]">
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveCategory(c.id)}
                  className={cn(
                    "text-xs px-3 py-1.5 rounded-full whitespace-nowrap border transition duration-150",
                    activeCategory === c.id
                      ? "bg-[var(--accent-magenta)]/20 border border-[var(--accent-magenta)]/40 text-[var(--accent-magenta)] font-semibold"
                      : "bg-white/[0.02] border-white/[0.05] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
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
                        "group relative border border-[var(--border-color)] hover:border-[var(--accent-magenta)]/30 rounded-xl p-5 bg-[var(--card-bg)]/40 hover:bg-[var(--card-bg)]/90 hover:-translate-y-1 hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-y-4 cursor-pointer shadow-md",
                        isPending ? "opacity-50 pointer-events-none" : ""
                      )}
                    >
                      {/* Card Content */}
                      <div className="flex items-start gap-x-4">
                        <div className="p-3 bg-[var(--page-bg)] border border-[var(--border-color)] rounded-lg group-hover:bg-[var(--accent-magenta)]/5 group-hover:border-[var(--accent-magenta)]/20 transition-all duration-200">
                          {tpl.icon}
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-bold text-sm text-[var(--text-primary)] group-hover:text-[var(--accent-magenta)] transition-colors duration-150">
                            {tpl.name}
                          </h3>
                          <p className="text-[var(--text-secondary)] text-xs leading-relaxed">
                            {tpl.description}
                          </p>
                        </div>
                      </div>

                      {/* Footer Badge / Quick action text */}
                      <div className="flex items-center justify-between border-t border-[var(--border-color)] pt-3 mt-1">
                        <span className="text-[9px] text-[var(--text-secondary)] font-bold tracking-wider uppercase" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>
                          {tpl.triggerType} TRIGGER
                        </span>
                        <span
                          className={cn(
                            "text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider",
                            tpl.badgeType === "new"
                              ? "bg-[var(--accent-magenta)]/15 border border-[var(--accent-magenta)]/20 text-[var(--accent-magenta)]"
                              : tpl.badgeType === "popular"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-[var(--page-bg)] text-[var(--text-secondary)] border border-[var(--border-color)]"
                          )}
                          style={{ fontFamily: "var(--font-space-grotesk), monospace" }}
                        >
                          {tpl.badge}
                        </span>
                      </div>

                      {/* Spinner Loader overlay for clicked template */}
                      {isCardPending && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-xl z-10">
                          <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-magenta)]" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
                <Compass className="w-12 h-12 text-[var(--text-tertiary)] mb-3" />
                <p className="text-lg font-semibold text-[var(--text-primary)]">No Templates Match</p>
                <p className="text-[var(--text-secondary)] text-xs max-w-xs mt-1">
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
