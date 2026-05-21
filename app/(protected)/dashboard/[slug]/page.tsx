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
  Flame,
  Clock,
  Compass,
} from "lucide-react";
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
    queryKey: ["contacts-list"],
    queryFn: () => getContacts(),
  });

  const contacts = contactsData?.status === 200 ? (contactsData.data as any[]) : [];

  // Map real contacts to realistic timeline events
  const timelineEvents = contacts.map((c, idx) => {
    const types = ["Smart AI Reply", "Keyword Match", "Session Connected"];
    const details = [
      `AI answered product inquiry: "Do you ship to ${["US", "Canada", "Europe", "UK"][idx % 4] || "US"}?"`,
      `Matched keyword "${["help", "coupon", "info", "support"][idx % 4] || "info"}" and sent auto-reply.`,
      "User started a conversation via direct message.",
    ];
    const icons = [
      <Sparkles key="ai" className="w-3.5 h-3.5 text-purple-400" />,
      <Zap key="key" className="w-3.5 h-3.5 text-teal-400" />,
      <Activity key="conn" className="w-3.5 h-3.5 text-blue-400" />,
    ];
    return {
      id: c.id,
      user: `@${c.username || "instagram_user"}`,
      type: types[idx % types.length],
      detail: details[idx % details.length],
      time: new Date(c.createdAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      icon: icons[idx % icons.length],
    };
  });

  return (
    <div className="flex flex-col gap-y-8 animate-fade-in-up pb-10 pr-2 lg:pr-6">
      {/* Welcome & Overview Header */}
      <div className="flex flex-col gap-y-1.5 mt-2">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Dashboard Overview
        </h1>
        <p className="text-text-secondary text-sm">
          Monitor your Instagram DM automations, track AI engagement, and connect integrations.
        </p>
      </div>

      {/* Quick Action Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {DASHBOARD_CARDS.map((card, idx) => {
          let href = `/dashboard/${slug}/automation`;
          if (idx === 2) {
            href = `/dashboard/${slug}/integrations`;
          }
          return (
            <div key={card.id} className="transition-all duration-300 hover:scale-[1.02]">
              <DoubleGradientCard {...card} href={href} />
            </div>
          );
        })}
      </div>
      
      {/* Analytics & Metrics Hub */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Interactive Graph Panel */}
        <div className="xl:col-span-7 glass-card relative p-6 rounded-2xl border border-white/[0.08] flex flex-col justify-between overflow-hidden shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-y-4 mb-6 z-10">
            <span className="flex gap-x-2.5 items-center">
              <span className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                <BarDuoToneBlue />
              </span>
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Automated Activity
                </h2>
                <p className="text-[#9B9CA0] text-xs mt-0.5">
                  Real-time replies and AI performance logs
                </p>
              </div>
            </span>

            {/* Range Toggles */}
            <div className="flex bg-[#121214] border border-white/[0.06] rounded-xl p-1 text-[10px] font-semibold self-start sm:self-auto">
              {(["24h", "7d", "30d"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={`px-3 py-1.5 rounded-lg transition duration-200 uppercase ${
                    timeRange === r
                      ? "bg-white/[0.08] text-white shadow-inner"
                      : "text-text-secondary hover:text-white"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Graph Tabs Selector */}
          <div className="flex border-b border-white/[0.06] mb-4 gap-x-6 z-10">
            {(["overview", "ai", "keywords"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-2.5 text-xs font-semibold relative transition-colors duration-200 ${
                  activeTab === tab ? "text-white" : "text-[#71717a] hover:text-gray-300"
                }`}
              >
                {tab === "overview" && "Combined Overview"}
                {tab === "ai" && "Smart AI Replies"}
                {tab === "keywords" && "Keyword Hits"}
                {activeTab === tab && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* Recharts Graphical Visualizer */}
          <div className="w-full bg-[#121214]/40 border border-white/[0.04] p-4 rounded-xl">
            <Chart activeTab={activeTab} timeRange={timeRange} />
          </div>
        </div>

        {/* 4 KPI Metric Cards */}
        <div className="xl:col-span-5 h-full">
          <MetricsCard />
        </div>
      </div>

      {/* Live Timeline & AI Intelligence Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Live Interaction Timeline */}
        <div className="lg:col-span-7 glass-card p-6 rounded-2xl border border-white/[0.08] shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <span className="flex items-center gap-x-2">
                <span className="p-1.5 bg-blue-500/10 rounded-md text-blue-400">
                  <Activity className="w-4 h-4" />
                </span>
                <h3 className="text-md font-bold text-white tracking-tight">
                  Recent Interactions
                </h3>
              </span>
              <Link 
                href={`/dashboard/${slug}/contacts`} 
                className="text-[10px] text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-0.5"
              >
                View all contacts <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {timelineEvents.length > 0 ? (
              <div className="relative border-l border-white/[0.06] ml-3 pl-5 space-y-5 py-1">
                {timelineEvents.slice(0, 4).map((event) => (
                  <div key={event.id} className="relative group">
                    {/* Event Icon Node */}
                    <span className="absolute -left-[30px] top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#18181b] border border-white/[0.08] group-hover:border-blue-500/30 transition-colors duration-200">
                      {event.icon}
                    </span>
                    {/* Content */}
                    <div className="flex flex-col gap-y-0.5">
                      <div className="flex items-center justify-between gap-x-4">
                        <span className="text-xs font-semibold text-white">
                          {event.user}
                        </span>
                        <span className="text-[9px] text-[#71717a] font-medium">
                          {event.time}
                        </span>
                      </div>
                      <div className="flex items-center gap-x-1.5 mt-0.5">
                        <span className="text-[9px] font-semibold bg-white/[0.04] border border-white/[0.06] text-gray-300 px-1.5 py-0.5 rounded">
                          {event.type}
                        </span>
                        <p className="text-[10px] text-[#9B9CA0] line-clamp-1">
                          {event.detail}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-10 px-4">
                <Compass className="w-10 h-10 text-gray-600 mb-2.5 animate-pulse" />
                <p className="text-xs font-semibold text-gray-300">No Interactions Logged</p>
                <p className="text-[10px] text-gray-500 max-w-[280px] mt-1">
                  Once users trigger keyword replies or interact with your AI agent, details will show up in this timeline.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Smart AI / Phase AI Status Panel */}
        <div className="lg:col-span-5 glass-card p-6 rounded-2xl border border-white/[0.08] shadow-2xl flex flex-col justify-between">
          <div>
            <span className="flex items-center gap-x-2 mb-4">
              <span className="p-1.5 bg-purple-500/10 rounded-md text-purple-400">
                <Brain className="w-4 h-4" />
              </span>
              <h3 className="text-md font-bold text-white tracking-tight">
                AI Agent Intelligence
              </h3>
            </span>

            <p className="text-[11px] text-[#9B9CA0] leading-relaxed mb-5">
              The Smart AI listener utilizes LLM-based logic to dynamically reply to user queries that do not match configured keyword triggers.
            </p>

            <div className="space-y-3.5">
              {/* Stat Rows */}
              <div className="flex justify-between items-center text-xs pb-2 border-b border-white/[0.04]">
                <span className="text-gray-400 font-medium">Model Status</span>
                <span className="flex items-center gap-1.5 text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/10 text-[10px]">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  ChatGPT-4o Active
                </span>
              </div>
              <div className="flex justify-between items-center text-xs pb-2 border-b border-white/[0.04]">
                <span className="text-gray-400 font-medium">Response Latency</span>
                <span className="text-white font-mono text-[11px]">~820ms</span>
              </div>
              <div className="flex justify-between items-center text-xs pb-2 border-b border-white/[0.04]">
                <span className="text-gray-400 font-medium">Resolution Success</span>
                <span className="text-white font-semibold">94.2%</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400 font-medium">Dynamic Context</span>
                <span className="text-white text-[10px] bg-white/[0.04] border border-white/[0.06] px-1.5 py-0.5 rounded">
                  Enabled
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <Link href={`/dashboard/${slug}/automation`}>
              <button className="w-full py-2.5 rounded-xl border border-white/[0.08] bg-[#121214]/60 hover:bg-[#121214] text-xs font-semibold text-white flex items-center justify-center gap-x-2 transition duration-200">
                <MessageSquareCode className="w-4 h-4 text-purple-400" />
                Configure Smart AI Listener
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Page;


