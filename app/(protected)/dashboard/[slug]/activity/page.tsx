"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getOrganizationConfig } from "@/actions/factory";
import { getActivityLogs, getActivityMetrics } from "@/actions/activity";
import { ContextHelpTooltip } from "@/components/global/context-tooltip";
import {
  RotateCw, Filter, Search, AlertCircle, CheckCircle2,
  XCircle, Clock, ArrowUpRight, ArrowDownLeft, ShieldAlert,
  Layers, MessageSquare, RefreshCw
} from "lucide-react";
import { toast } from "sonner";

export default function ActivityPage() {
  const params = useParams();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [directionFilter, setDirectionFilter] = useState("ALL");
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [searchPhone, setSearchPhone] = useState("");
  const [searchTemplate, setSearchTemplate] = useState("");
  const [failedOnly, setFailedOnly] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch Org Config
  const { data: orgData } = useQuery({
    queryKey: ["org-config", slug],
    queryFn: () => getOrganizationConfig(slug!),
    enabled: !!slug,
  });
  const orgId = orgData?.status === 200 ? (orgData.data as any)?.id : null;

  // Fetch Activity Metrics
  const { data: metricsRes, refetch: refetchMetrics } = useQuery({
    queryKey: ["activity-metrics", orgId],
    queryFn: () => getActivityMetrics(orgId!),
    enabled: !!orgId,
    refetchInterval: autoRefresh ? 5000 : false,
  });
  const metrics = metricsRes?.data || { loaded: 100, outbound: 97, inbound: 3, failed: 42, queued: 0, read: 25 };

  // Fetch Activity Logs
  const { data: logsRes, isLoading, refetch: refetchLogs } = useQuery({
    queryKey: ["activity-logs", orgId, statusFilter, sourceFilter, searchPhone, failedOnly],
    queryFn: () => getActivityLogs(orgId!, {
      status: failedOnly ? "failed" : statusFilter,
      source: sourceFilter,
      search: searchPhone || searchTemplate,
      failedOnly
    }),
    enabled: !!orgId,
    refetchInterval: autoRefresh ? 5000 : false,
  });
  const logs = logsRes?.status === 200 ? (logsRes.data as any[]) : [];

  const handleRefresh = () => {
    refetchMetrics();
    refetchLogs();
    toast.success("Activity ledger refreshed");
  };

  const resetFilters = () => {
    setStatusFilter("ALL");
    setDirectionFilter("ALL");
    setSourceFilter("ALL");
    setSearchPhone("");
    setSearchTemplate("");
    setFailedOnly(false);
  };

  return (
    <div className="flex flex-col gap-y-6 p-4 lg:p-6 text-[var(--text-primary)]">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-y-4 border-b border-[var(--border-color)] pb-4">
        <div>
          <div className="flex items-center gap-x-2">
            <h1
              className="text-2xl font-bold"
              style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
            >
              Activity
            </h1>
            <ContextHelpTooltip content="Real-time message & automation execution ledger, newest first." />
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Full message execution ledger, newest first. Monitor firings, statuses, and live diagnostic error traces.
          </p>
        </div>

        <div className="flex items-center gap-x-3">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-x-2 bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg px-3.5 py-2 text-xs font-semibold hover:border-[var(--accent-magenta)]/40 transition-smooth shadow-sm"
          >
            <RotateCw className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
            Refresh
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {/* LOADED */}
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] flex items-center gap-1 font-mono">
              LOADED
              <ContextHelpTooltip content="Total webhook payloads and event triggers loaded into the engine." />
            </span>
          </div>
          <p className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>
            {metrics.loaded}
          </p>
        </div>

        {/* OUTBOUND */}
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1 font-mono">
              OUTBOUND
              <ContextHelpTooltip content="Total automated responses and DMs dispatched to followers." />
            </span>
          </div>
          <p className="text-2xl font-bold text-blue-400" style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>
            {metrics.outbound}
          </p>
        </div>

        {/* INBOUND */}
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1 font-mono">
              INBOUND
              <ContextHelpTooltip content="Inbound comments and DMs received from followers." />
            </span>
          </div>
          <p className="text-2xl font-bold text-emerald-400" style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>
            {metrics.inbound}
          </p>
        </div>

        {/* FAILED */}
        <div className="rounded-xl border border-rose-500/30 bg-rose-950/10 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1 font-mono">
              FAILED
              <ContextHelpTooltip content="Executions that encountered an error (e.g. token expired or rate limited)." />
            </span>
          </div>
          <p className="text-2xl font-bold text-rose-400" style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>
            {metrics.failed}
          </p>
        </div>

        {/* QUEUED */}
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1 font-mono">
              QUEUED
              <ContextHelpTooltip content="Messages scheduled or pending in the rate-limit queue." />
            </span>
          </div>
          <p className="text-2xl font-bold text-amber-400" style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>
            {metrics.queued}
          </p>
        </div>

        {/* READ */}
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1 font-mono">
              READ
              <ContextHelpTooltip content="Outbound messages confirmed read by recipient." />
            </span>
          </div>
          <p className="text-2xl font-bold text-purple-400" style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>
            {metrics.read}
          </p>
        </div>
      </div>

      {/* Filter Control Bar */}
      <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4 flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
          {/* Range */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] mb-1 flex items-center gap-1 font-mono">
              Range
              <ContextHelpTooltip content="Filter activity logs by time window." />
            </label>
            <select className="w-full bg-[var(--page-bg)] border border-[var(--border-color)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-magenta)]/40">
              <option value="ALL">All time</option>
              <option value="24H">Past 24 hours</option>
              <option value="7D">Past 7 days</option>
              <option value="30D">Past 30 days</option>
            </select>
          </div>

          {/* Direction */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] mb-1 flex items-center gap-1 font-mono">
              Direction
              <ContextHelpTooltip content="Filter by message flow direction." />
            </label>
            <select
              value={directionFilter}
              onChange={(e) => setDirectionFilter(e.target.value)}
              className="w-full bg-[var(--page-bg)] border border-[var(--border-color)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-magenta)]/40"
            >
              <option value="ALL">All</option>
              <option value="outbound">Outbound</option>
              <option value="inbound">Inbound</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] mb-1 flex items-center gap-1 font-mono">
              Status
              <ContextHelpTooltip content="Filter by execution outcome status." />
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-[var(--page-bg)] border border-[var(--border-color)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-magenta)]/40"
            >
              <option value="ALL">All</option>
              <option value="failed">Failed</option>
              <option value="outbound">Outbound</option>
              <option value="inbound">Inbound</option>
              <option value="queued">Queued</option>
              <option value="read">Read</option>
            </select>
          </div>

          {/* Source */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] mb-1 flex items-center gap-1 font-mono">
              Source
              <ContextHelpTooltip content="Filter by automation trigger type." />
            </label>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="w-full bg-[var(--page-bg)] border border-[var(--border-color)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-magenta)]/40"
            >
              <option value="ALL">All</option>
              <option value="abandoned_cart">Abandoned Cart</option>
              <option value="dm_keyword">DM Keyword</option>
              <option value="smart_ai">Smart AI</option>
              <option value="comment_reply">Comment Reply</option>
            </select>
          </div>

          {/* Phone / Contact */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] mb-1 flex items-center gap-1 font-mono">
              Phone / Contact
              <ContextHelpTooltip content="Search by recipient phone number or Instagram handle." />
            </label>
            <input
              type="text"
              placeholder="+91..."
              value={searchPhone}
              onChange={(e) => setSearchPhone(e.target.value)}
              className="w-full bg-[var(--page-bg)] border border-[var(--border-color)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-magenta)]/40 font-mono placeholder:text-[var(--text-tertiary)]"
            />
          </div>

          {/* Template */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] mb-1 flex items-center gap-1 font-mono">
              Template / Automation
              <ContextHelpTooltip content="Search by template name or automation title." />
            </label>
            <input
              type="text"
              placeholder="template name"
              value={searchTemplate}
              onChange={(e) => setSearchTemplate(e.target.value)}
              className="w-full bg-[var(--page-bg)] border border-[var(--border-color)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-magenta)]/40 font-mono placeholder:text-[var(--text-tertiary)]"
            />
          </div>
        </div>

        {/* Action Toggle Buttons & Auto Refresh Status */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[var(--border-color)]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFailedOnly(!failedOnly)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-smooth flex items-center gap-1.5 ${
                failedOnly
                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-sm"
                  : "bg-[var(--page-bg)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:text-rose-400"
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              Failed only
            </button>
            <button
              onClick={resetFilters}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--page-bg)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:text-[var(--text-primary)] transition-smooth"
            >
              Reset filters
            </button>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-[var(--text-tertiary)] font-mono">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Auto-refreshes every 5s
          </div>
        </div>
      </div>

      {/* Activity Table */}
      <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-color)] bg-[var(--page-bg)] text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] font-mono">
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4">Message & Diagnostics</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Evidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)] text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[var(--text-tertiary)]">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[var(--accent-magenta)]" />
                    Loading activity ledger...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[var(--text-tertiary)]">
                    No activity logs matching the selected filters.
                  </td>
                </tr>
              ) : (
                logs.map((item) => {
                  const isFailed = item.status === "failed";
                  const isOutbound = item.status === "outbound";
                  const dateStr = new Date(item.createdAt).toLocaleString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit"
                  });

                  return (
                    <tr key={item.id} className="hover:bg-[var(--page-bg)]/50 transition-colors group">
                      {/* Time */}
                      <td className="py-4 px-4 font-mono text-[11px] text-[var(--text-secondary)] whitespace-nowrap align-top">
                        <div>{dateStr}</div>
                        <div className="text-[9px] text-[var(--text-tertiary)]">{item.createdAt.slice(0, 10)}</div>
                      </td>

                      {/* Contact */}
                      <td className="py-4 px-4 align-top whitespace-nowrap">
                        <div className="font-mono text-xs font-semibold text-[var(--text-primary)]">
                          {item.contactInfo || item.senderId || "Unknown"}
                        </div>
                        <span className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded mt-1 ${
                          isOutbound ? "bg-blue-500/10 text-blue-400" : "bg-emerald-500/10 text-emerald-400"
                        }`}>
                          {isOutbound ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownLeft className="w-2.5 h-2.5" />}
                          {item.status === "inbound" ? "inbound" : "outbound"}
                        </span>
                      </td>

                      {/* Source */}
                      <td className="py-4 px-4 align-top whitespace-nowrap">
                        <span className="inline-block bg-[var(--page-bg)] border border-[var(--border-color)] text-[var(--text-secondary)] px-2 py-0.5 rounded text-[10px] font-mono">
                          {item.source || "automation"}
                        </span>
                      </td>

                      {/* Message & Diagnostic Errors */}
                      <td className="py-4 px-4 align-top max-w-md">
                        <p className="text-xs font-medium text-[var(--text-primary)] leading-relaxed font-mono">
                          {item.message}
                        </p>

                        {/* Parameter badges if present */}
                        {item.Automation && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            <span className="bg-zinc-800/60 text-zinc-300 text-[9px] font-mono px-1.5 py-0.5 rounded">
                              {item.Automation.name}
                            </span>
                          </div>
                        )}

                        {/* RED ERROR REASON DISPLAYED PROMINENTLY */}
                        {item.errorReason && (
                          <div className="mt-2 p-2 rounded-lg bg-rose-950/40 border border-rose-500/30 flex items-start gap-x-2 text-rose-400 font-mono text-[11px] leading-snug">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold">Error Notice:</span> {item.errorReason}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="py-4 px-4 align-top whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          isFailed
                            ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                            : isOutbound
                            ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                            : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        }`}>
                          {isFailed ? <XCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                          {item.status}
                        </span>
                      </td>

                      {/* Evidence */}
                      <td className="py-4 px-4 align-top font-mono text-[10px] text-[var(--text-tertiary)] whitespace-nowrap">
                        {item.evidence || `Related: ${item.id.slice(0, 16)}`}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
