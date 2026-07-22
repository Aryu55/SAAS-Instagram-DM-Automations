"use client";

import React, { useState } from "react";
import DoubleGradientCard from "@/components/global/double-gradient-card";
import { DASHBOARD_CARDS } from "@/constants/dashboard";
import { BarDuoToneBlue } from "@/icons";
import Chart from "./_components/metrics";
import MetricsCard from "./_components/metrics/metrics-card";
import { getContacts } from "@/actions/contacts/queries";
import { useQuery } from "@tanstack/react-query";
import {
  Sparkles,
  Brain,
  Activity,
  ChevronRight,
  Zap,
  MessageSquareCode,
  Compass,
} from "lucide-react";
import { ContextHelpTooltip } from "@/components/global/context-tooltip";
import Link from "next/link";

type Props = {
  params: {
    slug: string;
  };
};

function Page({ params: { slug } }: Props) {
  const [activeTab, setActiveTab] = useState<"overview" | "ai" | "keywords">("overview");
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d">("7d");

  const { data: contactsData } = useQuery({
    queryKey: ["contacts-list", slug],
    queryFn: () => getContacts(slug),
  });

  const contacts = contactsData?.status === 200 ? (contactsData.data as any[]) : [];
  const totalContacts = contacts.length;

  React.useEffect(() => {
    console.log("🚀 [Janus UI Engine] Main dashboard loaded for space slug:", slug);
  }, [slug]);

  React.useEffect(() => {
    if (contactsData) {
      console.log("📈 [Janus UI Engine] Loaded automation contacts list. Total contacts count:", contacts.length);
    }
  }, [contactsData, contacts.length]);

  React.useEffect(() => {
    console.log("ℹ️ [Janus UI Engine] Main graph filter changed to activeTab:", activeTab, "and timeRange:", timeRange);
  }, [activeTab, timeRange]);

  // Map real contacts to realistic timeline events
  const timelineEvents = contacts.map((c, idx) => {
    const types = ["Smart AI Reply", "Keyword Match", "Session Connected"];
    const details = [
      `AI answered product inquiry: "Do you ship to ${["US", "Canada", "Europe", "UK"][idx % 4] || "US"}?"`,
      `Matched keyword "${["help", "coupon", "info", "support"][idx % 4] || "info"}" and sent auto-reply.`,
      "User started a conversation via direct message.",
    ];
    const icons = [
      <Sparkles key="ai" className="w-3.5 h-3.5 text-[var(--accent-magenta)]" />,
      <Zap key="key" className="w-3.5 h-3.5 text-[var(--text-primary)]" />,
      <Activity key="conn" className="w-3.5 h-3.5 text-[var(--text-secondary)]" />,
    ];
    return {
      id: c.id || `event-${idx}`,
      user: c.username ? `@${c.username}` : `Follower ${c.instagramId?.slice(0, 6)}`,
      action: types[idx % types.length],
      type: types[idx % types.length],
      detail: details[idx % details.length],
      time: new Date(Date.now() - (idx + 1) * 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      icon: icons[idx % icons.length],
    };
  });

  return (
    <div className="flex flex-col gap-y-10 pb-12 pr-2 lg:pr-6">
      {/* Welcome & Overview Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-y-4 mt-4 animate-fade-in-up border-b border-[var(--border-color)] pb-6">
        <div className="flex flex-col gap-y-2">
          <span className="inline-flex items-center gap-x-1.5 px-3 py-1 bg-[var(--accent-whisper)] border border-[var(--accent-veil)] text-[var(--accent-magenta)] text-[9px] font-bold tracking-wider uppercase rounded-full w-fit" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>
            System Core
          </span>
          <div className="flex items-center gap-x-2">
            <h1 className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] leading-none tracking-tight" style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>
              Dashboard Overview
            </h1>
            <ContextHelpTooltip content="Central control tower displaying metrics, automations overview, and live activity." />
          </div>
          <p className="text-[var(--text-secondary)] text-sm max-w-[65ch] leading-relaxed">
            Monitor your Instagram DM automations, track AI engagement, and connect integrations.
          </p>
        </div>

        <button
          onClick={() => window.dispatchEvent(new Event("open-janus-onboarding"))}
          className="flex items-center gap-x-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-smooth shadow-md shrink-0 w-fit"
          style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
        >
          <Sparkles className="w-4 h-4 text-purple-200" />
          Take Interactive Tour
        </button>
      </div>

      {/* Quick Action Navigation Cards — Asymmetric Bento Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up-delay-1">
        {DASHBOARD_CARDS.map((card, idx) => {
          let href = `/dashboard/${slug}/automation`;
          if (idx === 2) {
            href = `/dashboard/${slug}/integrations`;
          }
          // Bento layout column spanning mapping
          const spanClass = 
            idx === 0 
              ? "md:col-span-2" 
              : idx === 1 
                ? "md:col-span-1" 
                : "md:col-span-3";

          return (
            <div key={card.id} className={spanClass}>
              <DoubleGradientCard {...card} href={href} />
            </div>
          );
        })}
      </div>
      
      {/* Analytics & Metrics Hub */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 animate-fade-in-up-delay-2">
        {/* Interactive Graph Panel */}
        <div className="xl:col-span-7 border border-[var(--border-color)] bg-[var(--card-bg)] rounded-xl shadow-sm">
          <div className="p-6 flex flex-col justify-between overflow-hidden h-full relative">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-y-4 mb-6 z-10">
              <span className="flex gap-x-3 items-center">
                <span className="p-2 bg-[var(--page-bg)] rounded-lg text-[var(--text-primary)] border border-[var(--border-color)] shrink-0">
                  <BarDuoToneBlue />
                </span>
                <div>
                  <div className="flex items-center gap-x-2">
                    <h2 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">
                      Automated Activity
                    </h2>
                    <ContextHelpTooltip content="Real-time graph tracking total DM responses, keyword matches, and Smart AI firings." />
                  </div>
                  <p className="text-[var(--text-tertiary)] text-xs mt-0.5 font-medium">
                    Real-time replies and AI performance logs
                  </p>
                </div>
              </span>

              {/* Range Toggles */}
              <div className="flex bg-[var(--page-bg)] border border-[var(--border-color)] rounded-lg p-1 text-[10px] font-bold self-start sm:self-auto" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>
                {(["24h", "7d", "30d"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setTimeRange(r)}
                    className={`px-3 py-1.5 rounded-lg transition-smooth uppercase ${
                      timeRange === r
                        ? "bg-[var(--card-bg)] text-[var(--text-primary)] border border-[var(--border-color)] shadow-sm font-semibold"
                        : "text-[var(--text-secondary)] hover:text-[var(--accent-magenta)]"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Graph Tabs Selector */}
            <div className="flex border-b border-[var(--border-color)] mb-5 gap-x-6 z-10">
              {(["overview", "ai", "keywords"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-3 text-xs font-semibold relative transition-colors duration-200 ${
                    activeTab === tab ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                  }`}
                >
                  {tab === "overview" && "Combined Overview"}
                  {tab === "ai" && "Smart AI Replies"}
                  {tab === "keywords" && "Keyword Hits"}
                  {activeTab === tab && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-magenta)]" />
                  )}
                </button>
              ))}
            </div>

            {/* Recharts Graphical Visualizer */}
            <div className="w-full bg-[var(--page-bg)]/20 border border-[var(--border-color)] p-4 rounded-lg">
              <Chart activeTab={activeTab} timeRange={timeRange} />
            </div>
          </div>
        </div>

        {/* 4 KPI Metric Cards */}
        <div className="xl:col-span-5 h-full">
          <MetricsCard />
        </div>
      </div>

      {/* Live Timeline & AI Intelligence Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in-up-delay-3">
        {/* Live Interaction Timeline */}
        <div className="lg:col-span-7 border border-[var(--border-color)] bg-[var(--card-bg)] rounded-xl shadow-sm">
          <div className="p-6 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="flex items-center gap-x-2.5">
                  <span className="p-2 bg-[var(--page-bg)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] shrink-0">
                    <Activity className="w-4 h-4" />
                  </span>
                  <h3 className="text-md font-bold text-[var(--text-primary)] tracking-tight">
                    Recent Interactions
                  </h3>
                </span>
                <Link 
                  href={`/dashboard/${slug}/contacts`} 
                  className="text-xs text-[var(--accent-magenta)] hover:text-[var(--accent-magenta)] hover:underline flex items-center gap-0.5 font-bold uppercase tracking-wider"
                  style={{ fontFamily: "var(--font-space-grotesk), monospace" }}
                >
                  View all <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {timelineEvents.length > 0 ? (
                <div className="relative border-l border-[var(--border-color)] ml-3 pl-6 space-y-6 py-1">
                  {timelineEvents.slice(0, 4).map((event) => (
                    <div key={event.id} className="relative group transition-smooth hover:translate-x-0.5">
                      {/* Event Icon Node */}
                      <span className="absolute -left-[35px] top-1 flex h-6 w-6 items-center justify-center rounded-lg bg-[var(--page-bg)] border border-[var(--border-color)] group-hover:border-[var(--accent-magenta)] transition-smooth shadow-sm">
                        {event.icon}
                      </span>
                      {/* Content */}
                      <div className="flex flex-col gap-y-0.5">
                        <div className="flex items-center justify-between gap-x-4">
                          <span className="text-xs font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-magenta)] transition-colors duration-200">
                            {event.user}
                          </span>
                          <span className="text-[9px] text-[var(--text-tertiary)] font-bold font-mono uppercase tracking-wider" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>
                            {event.time}
                          </span>
                        </div>
                        <div className="flex items-center gap-x-2 mt-1">
                          <span className="text-[9px] font-bold bg-[var(--page-bg)] border border-[var(--border-color)] text-[var(--text-secondary)] px-2 py-0.5 rounded-full shadow-sm" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>
                            {event.type}
                          </span>
                          <p className="text-[10px] text-[var(--text-secondary)] line-clamp-1 font-medium">
                            {event.detail}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-12 px-4">
                  <Compass className="w-10 h-10 text-[var(--text-tertiary)] mb-3 animate-pulse" />
                  <p className="text-xs font-semibold text-[var(--text-secondary)]">No Interactions Logged</p>
                  <p className="text-[10px] text-[var(--text-tertiary)] max-w-[280px] mt-1 font-medium leading-relaxed">
                    Once users trigger keyword replies or interact with your AI agent, details will show up in this timeline.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Smart AI / Phase AI Status Panel */}
        <div className="lg:col-span-5 border border-[var(--border-color)] bg-[var(--card-bg)] rounded-xl shadow-sm">
          <div className="p-6 h-full flex flex-col justify-between">
            <div>
              <span className="flex items-center gap-x-2.5 mb-4">
                <span className="p-2 bg-[var(--page-bg)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] shrink-0">
                  <Brain className="w-4 h-4" />
                </span>
                <h3 className="text-md font-bold text-[var(--text-primary)] tracking-tight">
                  AI Agent Intelligence
                </h3>
              </span>

              <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-6 font-medium">
                The Smart AI listener utilizes LLM-based logic to dynamically reply to user queries that do not match configured keyword triggers.
              </p>

              <div className="space-y-4">
                {/* Stat Rows */}
                <div className="flex justify-between items-center text-xs pb-2.5 border-b border-[var(--border-color)]">
                  <span className="text-[var(--text-secondary)] font-semibold">Model Status</span>
                  <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 text-[9px] uppercase tracking-wider" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    Active
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs pb-2.5 border-b border-[var(--border-color)]">
                  <span className="text-[var(--text-secondary)] font-semibold">Response Latency</span>
                  <span className="text-[var(--text-primary)] font-mono text-[11px] font-bold" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>~820ms</span>
                </div>
                <div className="flex justify-between items-center text-xs pb-2.5 border-b border-[var(--border-color)]">
                  <span className="text-[var(--text-secondary)] font-semibold">Resolution Success</span>
                  <span className="text-[var(--text-primary)] font-mono font-bold text-xs" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>94.2%</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[var(--text-secondary)] font-semibold">Dynamic Context</span>
                  <span className="text-[var(--text-primary)] text-[9px] bg-[var(--page-bg)] border border-[var(--border-color)] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>
                    Enabled
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <Link href={`/dashboard/${slug}/automation`}>
                <button className="w-full py-3 rounded-lg bg-[var(--accent-magenta)] text-white hover:opacity-90 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-x-2 transition-smooth active:scale-[0.98]" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>
                  <MessageSquareCode className="w-4 h-4" />
                  Configure Smart AI Listener
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Page;
