"use client";

import React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { BarChart3, Flame, Eye, ChevronRight } from "lucide-react";

const MODULES = [
  {
    id: "analytics",
    label: "Analytics",
    description: "Track post performance, AI recommendations, and engagement metrics.",
    icon: <BarChart3 className="w-5 h-5" />,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
  },
  {
    id: "virality",
    label: "Virality Predictor",
    description: "Simulate retention curves and predict viral potential of scripts.",
    icon: <Flame className="w-5 h-5" />,
    color: "text-orange-400",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/20",
  },
  {
    id: "research",
    label: "Competitive Research",
    description: "Scraped posts, competitor analysis, and content intelligence.",
    icon: <Eye className="w-5 h-5" />,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
  },
];

export default function IntelligencePage() {
  const params = useParams();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;

  return (
    <div className="flex flex-col gap-y-6 p-4 lg:p-6 text-[var(--text-primary)]">
      <div>
        <h1
          className="text-3xl font-bold"
          style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
        >
          Intelligence
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          Analytics, virality prediction, and competitive research — all in one place.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {MODULES.map((mod) => (
          <Link
            key={mod.id}
            href={`/dashboard/${slug}/${mod.id}`}
            className="group rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6 hover:border-[var(--accent-magenta)]/40 transition-all duration-300 hover:shadow-lg hover:shadow-[var(--accent-magenta)]/5"
          >
            <span className={`inline-flex p-3 rounded-xl ${mod.bgColor} border ${mod.borderColor} ${mod.color} mb-4`}>
              {mod.icon}
            </span>
            <h3
              className="text-base font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-magenta)] transition-colors mb-1"
              style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
            >
              {mod.label}
            </h3>
            <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed mb-4">
              {mod.description}
            </p>
            <span className="flex items-center gap-x-1 text-[10px] font-bold text-[var(--accent-magenta)] uppercase tracking-wider" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>
              Open <ChevronRight className="w-3 h-3" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
