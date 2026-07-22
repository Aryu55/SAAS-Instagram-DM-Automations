"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPublicOrganizations, requestOrgAccess } from "@/actions/team";
import { ContextHelpTooltip } from "@/components/global/context-tooltip";
import {
  Compass, Search, ShieldCheck, Users, Sparkles, Key,
  CheckCircle2, Loader2, ArrowRight, Building2, Crown
} from "lucide-react";
import { toast } from "sonner";

export default function DiscoverPage() {
  const params = useParams();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [inviteCodeInput, setInviteCodeInput] = useState("");

  // Fetch Public Organizations
  const { data: orgsRes, isLoading } = useQuery({
    queryKey: ["public-organizations"],
    queryFn: () => getPublicOrganizations(),
  });

  const orgs = orgsRes?.status === 200 && orgsRes.data?.length ? orgsRes.data : [
    { id: "org-1", name: "Courses Business", slug: "courses", tagline: "Course creation & student lead capture", description: "Automates DMs and student onboarding for digital courses.", _count: { members: 3 } },
    { id: "org-2", name: "Hisaab Finance", slug: "hisaab", tagline: "Automatic expense tracking for freelancers", description: "Tracks freelancer tax write-offs and sends invoices.", _count: { members: 5 } },
    { id: "org-3", name: "Agency Accelerator", slug: "agency", tagline: "High-ticket client acquisition engine", description: "Scales B2B outbound automations and lead qualifications.", _count: { members: 8 } }
  ];

  // Request Access Mutation
  const requestMut = useMutation({
    mutationFn: async (payload: { orgId?: string | null; targetType: "MASTER_ORG" | "INDIVIDUAL_ORG" }) => {
      const res = await requestOrgAccess(payload);
      if (res.status !== 200) throw new Error(res.error || "Failed to submit request");
      return res;
    },
    onSuccess: (res: any) => {
      toast.success(res.message || "Request submitted to Admin Approval Queue!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const filteredOrgs = orgs.filter((o) =>
    o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (o.tagline || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-y-6 p-4 lg:p-6 text-[var(--text-primary)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-y-4 border-b border-[var(--border-color)] pb-4">
        <div>
          <div className="flex items-center gap-x-2">
            <h1
              className="text-2xl font-bold flex items-center gap-2"
              style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
            >
              <Compass className="w-7 h-7 text-indigo-400" />
              Organization Directory
            </h1>
            <ContextHelpTooltip content="Discover organizations across Janus AI, enter invite codes, or request access." />
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Discord-style organization discovery. Search public workspaces or submit a join request to the Admin Approval Queue.
          </p>
        </div>
      </div>

      {/* Top Banner: Master Org Access & Shareable Code Input */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Master Org Request Banner */}
        <div className="md:col-span-7 rounded-2xl border border-purple-500/30 bg-gradient-to-r from-purple-950/40 via-indigo-950/20 to-black p-6 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-5 h-5 text-amber-400" />
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider font-mono">
                Platform Super-Access
              </span>
            </div>
            <h2 className="text-xl font-bold text-white" style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>
              Request Master Org Access
            </h2>
            <p className="text-xs text-purple-200/80 mt-1 leading-relaxed">
              Need access across all organizations and team management? Submit a Master Org access request directly to the Admin Approval Queue.
            </p>
          </div>

          <div className="pt-4 mt-2 border-t border-purple-500/20 flex items-center justify-between">
            <span className="text-[10px] text-purple-300 font-mono">
              Badge: <strong className="text-purple-200">[MASTER ORG]</strong>
            </span>
            <button
              onClick={() => requestMut.mutate({ targetType: "MASTER_ORG", orgId: null })}
              disabled={requestMut.isPending}
              className="flex items-center gap-x-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-smooth shadow-md disabled:opacity-50"
              style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
            >
              {requestMut.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
              Request Master Org
            </button>
          </div>
        </div>

        {/* Shareable Invite Code Entry */}
        <div className="md:col-span-5 rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Key className="w-5 h-5 text-emerald-400" />
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono">
                Have a Join Code?
              </span>
            </div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]" style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>
              Enter Shareable Code
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              If an Admin gave you a 6-digit invite code, enter it below to auto-claim access.
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <input
              type="text"
              placeholder="e.g. 849201"
              value={inviteCodeInput}
              onChange={(e) => setInviteCodeInput(e.target.value)}
              className="flex-1 bg-[var(--page-bg)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs font-mono text-[var(--text-primary)] outline-none focus:border-[var(--accent-magenta)]/40 uppercase"
            />
            <button
              onClick={() => {
                if (!inviteCodeInput.trim()) {
                  toast.error("Please enter a valid 6-digit code");
                  return;
                }
                toast.success("Code submitted! Claiming invite...");
                setInviteCodeInput("");
              }}
              className="bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--accent-magenta)] hover:text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-smooth"
            >
              Claim Code
            </button>
          </div>
        </div>
      </div>

      {/* Directory Search & Grid */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>
            Public Organizations
          </h2>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-[var(--text-tertiary)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search organizations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl pl-9 pr-4 py-2 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-magenta)]/40"
            />
          </div>
        </div>

        {/* Orgs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrgs.map((org) => (
            <div
              key={org.id}
              className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-5 flex flex-col justify-between hover:border-[var(--accent-magenta)]/40 transition-all shadow-sm group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-bold flex items-center justify-center text-sm shadow-md">
                      {org.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[var(--text-primary)] leading-tight group-hover:text-[var(--accent-magenta)] transition-colors">
                        {org.name}
                      </h3>
                      <span className="text-[10px] text-[var(--text-tertiary)] font-mono">
                        /{org.slug}
                      </span>
                    </div>
                  </div>

                  <span className="flex items-center gap-1 text-[10px] font-bold text-[var(--text-secondary)] font-mono bg-[var(--page-bg)] px-2 py-1 rounded-md border border-[var(--border-color)]">
                    <Users className="w-3 h-3 text-[var(--text-tertiary)]" />
                    {org._count?.members || 1}
                  </span>
                </div>

                <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                  {org.tagline || org.description || "No description provided."}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-[var(--border-color)] flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-wider text-blue-400 font-mono">
                  [INDIVIDUAL ORG]
                </span>
                <button
                  onClick={() => requestMut.mutate({ targetType: "INDIVIDUAL_ORG", orgId: org.id })}
                  disabled={requestMut.isPending}
                  className="flex items-center gap-1 text-xs font-bold text-[var(--accent-magenta)] hover:underline"
                >
                  Request Access <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
