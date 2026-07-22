"use client";

import React, { useState } from "react";
import { Crown, ChevronDown, Building2, Check, LayoutGrid, Plus } from "lucide-react";

type Props = {
  currentSlug: string;
};

const AVAILABLE_ORGS = [
  { name: "Courses Business", slug: "courses", tagline: "Course & Student Automations" },
  { name: "Hisaab Finance", slug: "hisaab", tagline: "Freelancer Expense Tracking" },
];

export default function OrgSwitcher({ currentSlug }: Props) {
  const [open, setOpen] = useState(false);

  const activeOrg = AVAILABLE_ORGS.find((o) => o.slug === currentSlug) || {
    name: currentSlug ? currentSlug.toUpperCase() : "Workspace",
    slug: currentSlug,
    tagline: "Active Organization",
  };

  return (
    <div className="relative z-50">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-x-2 px-3 py-1.5 rounded-xl border border-purple-500/30 bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-black text-white hover:border-purple-500/60 transition-all shadow-sm group"
        title="Switch Organization Workspace"
      >
        <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
          {activeOrg.name.slice(0, 2).toUpperCase()}
        </div>
        <span className="text-xs font-bold font-mono tracking-tight text-purple-200 group-hover:text-white max-w-[120px] truncate">
          {activeOrg.name}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-purple-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />

          <div className="absolute left-0 mt-2 w-64 rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-2 shadow-2xl z-50 space-y-1 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="px-3 py-1.5 border-b border-[var(--border-color)] mb-1">
              <span className="text-[10px] font-mono text-[var(--text-tertiary)] uppercase tracking-wider font-bold">
                Workspaces & Orgs
              </span>
            </div>

            {/* Master Control Center Link */}
            <a
              href="/dashboard"
              className="flex items-center gap-x-2.5 p-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-amber-300 transition-all group"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500/20 to-purple-600/30 flex items-center justify-center shrink-0 border border-amber-500/30">
                <Crown className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-xs font-bold text-amber-300 font-mono leading-tight">Master Control Tower</span>
                <span className="text-[9px] text-purple-300/80 font-mono">View All Organizations</span>
              </div>
              <LayoutGrid className="w-3.5 h-3.5 text-amber-400/80 group-hover:translate-x-0.5 transition-transform" />
            </a>

            {/* Organization List */}
            <div className="py-1 space-y-0.5">
              {AVAILABLE_ORGS.map((org) => {
                const isActive = org.slug === currentSlug;

                return (
                  <a
                    key={org.slug}
                    href={`/dashboard/${org.slug}`}
                    className={`flex items-center justify-between p-2 rounded-xl transition-all ${
                      isActive
                        ? "bg-[var(--accent-magenta)]/15 text-[var(--text-primary)] font-bold border border-[var(--accent-magenta)]/30"
                        : "hover:bg-[var(--page-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    <div className="flex items-center gap-x-2.5 min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center text-[9px] font-bold text-indigo-300 shrink-0">
                        {org.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-semibold truncate leading-tight">{org.name}</span>
                        <span className="text-[9px] text-[var(--text-tertiary)] font-mono truncate">/{org.slug}</span>
                      </div>
                    </div>

                    {isActive && <Check className="w-3.5 h-3.5 text-[var(--accent-magenta)] shrink-0" />}
                  </a>
                );
              })}
            </div>

            {/* Discover More Orgs */}
            <a
              href="/dashboard/courses/discover"
              className="flex items-center gap-x-2 p-2 rounded-xl border border-dashed border-[var(--border-color)] hover:border-[var(--accent-magenta)]/50 text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-semibold transition-all pt-2 mt-1"
            >
              <Plus className="w-3.5 h-3.5 text-[var(--accent-magenta)]" />
              <span>Join or Discover Orgs</span>
            </a>
          </div>
        </>
      )}
    </div>
  );
}
