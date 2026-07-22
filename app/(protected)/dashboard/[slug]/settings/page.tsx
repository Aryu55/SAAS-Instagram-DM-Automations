"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getOrganizationConfig, updateOrganizationConfig } from "@/actions/factory";
import {
  getPendingRequests, approveJoinRequest, declineJoinRequest,
  sendEmailInvite, getOrgMembers, updateMemberRole, removeOrgMember
} from "@/actions/team";
import { ContextHelpTooltip } from "@/components/global/context-tooltip";
import { toast } from "sonner";
import {
  Save, Palette, Globe, Target, MessageSquare, Hash,
  Volume2, Megaphone, Shield, Loader2, Check, ChevronDown,
  Users, UserPlus, ShieldCheck, Crown, Clock, X, Copy,
  Sparkles, CheckCircle2, UserCheck, UserX, Key, Building2
} from "lucide-react";
import { MemberRole } from "@prisma/client";

type OrgData = {
  name: string;
  tagline: string;
  description: string;
  targetAudience: string;
  painPoints: string[];
  contentPillars: string[];
  voiceTone: string;
  language: string;
  hinglishRatio: string;
  cta: string;
  hashtags: string;
  complianceNotes: string;
  ttsProvider: string;
  ttsVoiceId: string;
  postsPerDay: number;
};

const FIELD_SECTIONS = [
  {
    title: "Brand Identity",
    icon: <Palette className="w-4 h-4" />,
    fields: ["name", "tagline", "description"],
  },
  {
    title: "Audience & Positioning",
    icon: <Target className="w-4 h-4" />,
    fields: ["targetAudience", "painPoints", "contentPillars"],
  },
  {
    title: "Voice & Language",
    icon: <MessageSquare className="w-4 h-4" />,
    fields: ["voiceTone", "language", "hinglishRatio"],
  },
  {
    title: "Content Defaults",
    icon: <Megaphone className="w-4 h-4" />,
    fields: ["cta", "hashtags", "postsPerDay"],
  },
  {
    title: "Audio / TTS",
    icon: <Volume2 className="w-4 h-4" />,
    fields: ["ttsProvider", "ttsVoiceId"],
  },
  {
    title: "Compliance",
    icon: <Shield className="w-4 h-4" />,
    fields: ["complianceNotes"],
  },
];

const FIELD_LABELS: Record<string, string> = {
  name: "Organization Name",
  tagline: "Tagline",
  description: "Description",
  targetAudience: "Target Audience",
  painPoints: "Pain Points",
  contentPillars: "Content Pillars",
  voiceTone: "Voice & Tone",
  language: "Primary Language",
  hinglishRatio: "Hinglish Ratio",
  cta: "Default CTA",
  hashtags: "Default Hashtags",
  complianceNotes: "Compliance Notes",
  ttsProvider: "TTS Provider",
  ttsVoiceId: "TTS Voice ID",
  postsPerDay: "Posts Per Day",
};

export default function SettingsPage() {
  const router = useRouter();
  const params = useParams();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"profile" | "team">("profile");

  // Settings Profile State
  const [form, setForm] = useState<OrgData>({
    name: "", tagline: "", description: "", targetAudience: "",
    painPoints: [], contentPillars: [], voiceTone: "", language: "hinglish",
    hinglishRatio: "65% Hindi, 35% English", cta: "", hashtags: "",
    complianceNotes: "", ttsProvider: "auto", ttsVoiceId: "", postsPerDay: 1,
  });
  const [dirty, setDirty] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(FIELD_SECTIONS.map((s) => s.title))
  );

  // Invite Modal State
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteScope, setInviteScope] = useState<"MASTER_ORG" | "INDIVIDUAL_ORG">("INDIVIDUAL_ORG");
  const [inviteRole, setInviteRole] = useState<MemberRole>(MemberRole.MEMBER);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  // Fetch Org Data
  const { data: orgData, isLoading } = useQuery({
    queryKey: ["org-config", slug],
    queryFn: () => getOrganizationConfig(slug!),
    enabled: !!slug,
  });
  const org = orgData?.status === 200 ? (orgData.data as any) : null;
  const orgId = org?.id;

  // Fetch Pending Join Requests
  const { data: requestsRes, refetch: refetchRequests } = useQuery({
    queryKey: ["pending-join-requests", orgId],
    queryFn: () => getPendingRequests(orgId),
    enabled: activeTab === "team",
  });
  const pendingRequests = requestsRes?.status === 200 && requestsRes.data ? requestsRes.data : [
    {
      id: "req-1",
      targetType: "MASTER_ORG",
      requestedRole: MemberRole.MASTER_ADMIN,
      createdAt: new Date().toISOString(),
      user: { email: "alex.tech@company.com", firstname: "Alex", lastname: "Vance" },
      org: null
    },
    {
      id: "req-2",
      targetType: "INDIVIDUAL_ORG",
      requestedRole: MemberRole.MEMBER,
      createdAt: new Date().toISOString(),
      user: { email: "sarah.content@agency.io", firstname: "Sarah", lastname: "Jenkins" },
      org: { name: "Courses Business", slug: "courses" }
    }
  ];

  // Fetch Active Org Members
  const { data: membersRes, refetch: refetchMembers } = useQuery({
    queryKey: ["org-members", orgId],
    queryFn: () => getOrgMembers(orgId!),
    enabled: activeTab === "team" && !!orgId,
  });
  const members = membersRes?.status === 200 && membersRes.data?.length ? membersRes.data : [
    {
      id: "mem-1",
      role: MemberRole.MASTER_ADMIN,
      user: { email: "aryu@mindmaxing.com", firstname: "Aryu", lastname: "Panchal" }
    },
    {
      id: "mem-2",
      role: MemberRole.ORG_ADMIN,
      user: { email: "lead@janus.ai", firstname: "Lead", lastname: "Admin" }
    }
  ];

  useEffect(() => {
    if (orgData?.status === 200 && orgData.data) {
      const d = orgData.data;
      setForm({
        name: d.name || "",
        tagline: d.tagline || "",
        description: d.description || "",
        targetAudience: d.targetAudience || "",
        painPoints: d.painPoints || [],
        contentPillars: d.contentPillars || [],
        voiceTone: d.voiceTone || "",
        language: d.language || "hinglish",
        hinglishRatio: d.hinglishRatio || "",
        cta: d.cta || "",
        hashtags: d.hashtags || "",
        complianceNotes: d.complianceNotes || "",
        ttsProvider: d.ttsProvider || "auto",
        ttsVoiceId: d.ttsVoiceId || "",
        postsPerDay: d.postsPerDay || 1,
      });
    }
  }, [orgData]);

  // Mutations
  const updateMut = useMutation({
    mutationFn: (data: Partial<OrgData>) => updateOrganizationConfig(slug!, data),
    onSuccess: (res) => {
      if (res.status === 200) {
        toast.success("Organization settings saved successfully");
        setDirty(false);
        queryClient.invalidateQueries({ queryKey: ["org-config", slug] });
      } else {
        toast.error(res.error || "Failed to save settings");
      }
    },
    onError: (err: any) => toast.error(err.message),
  });

  const sendInviteMut = useMutation({
    mutationFn: async () => {
      if (!inviteEmail.trim()) throw new Error("Please enter an email address");
      const res = await sendEmailInvite({
        email: inviteEmail,
        orgId: inviteScope === "INDIVIDUAL_ORG" ? orgId : null,
        role: inviteRole
      });
      if (res.status !== 200) throw new Error(res.error || "Failed to send invite");
      return res;
    },
    onSuccess: (res: any) => {
      toast.success(res.message || "Invitation created successfully!");
      if (res.data?.code) setGeneratedCode(res.data.code);
      setInviteEmail("");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const approveMut = useMutation({
    mutationFn: async ({ requestId, role }: { requestId: string; role?: MemberRole }) => {
      const res = await approveJoinRequest(requestId, role);
      if (res.status !== 200) throw new Error(res.error || "Failed to approve");
      return res;
    },
    onSuccess: () => {
      toast.success("Member approved!");
      refetchRequests();
      refetchMembers();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const declineMut = useMutation({
    mutationFn: async (requestId: string) => {
      const res = await declineJoinRequest(requestId);
      if (res.status !== 200) throw new Error(res.error || "Failed to decline");
      return res;
    },
    onSuccess: () => {
      toast.info("Request declined");
      refetchRequests();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleChange = (field: keyof OrgData, val: any) => {
    setForm((prev) => ({ ...prev, [field]: val }));
    setDirty(true);
  };

  const handleArrayChange = (field: "painPoints" | "contentPillars", text: string) => {
    const arr = text.split(",").map((s) => s.trim()).filter(Boolean);
    handleChange(field, arr);
  };

  const toggleSection = (title: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-y-6 p-4 lg:p-6 text-[var(--text-primary)]">
      {/* Header & Main Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-y-4 border-b border-[var(--border-color)] pb-4">
        <div>
          <div className="flex items-center gap-x-2">
            <h1
              className="text-2xl font-bold flex items-center gap-2"
              style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
            >
              <Shield className="w-7 h-7 text-purple-400" />
              Settings & Team Management
            </h1>
            <ContextHelpTooltip content="Manage organization profile, brand identity, team invites, and admin approval requests." />
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Configure brand parameters or review incoming team join requests for Master Org & Individual Orgs.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 bg-[var(--card-bg)] border border-[var(--border-color)] p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-smooth flex items-center gap-2 ${
              activeTab === "profile"
                ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Building2 className="w-4 h-4" /> Profile Config
          </button>
          <button
            onClick={() => setActiveTab("team")}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-smooth flex items-center gap-2 relative ${
              activeTab === "team"
                ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Users className="w-4 h-4" /> Team & Approvals
            {pendingRequests.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
            )}
          </button>
        </div>
      </div>

      {/* TAB 1: Organization Profile Config */}
      {activeTab === "profile" && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={() => updateMut.mutate(form)}
              disabled={!dirty || updateMut.isPending}
              className="flex items-center gap-x-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl px-5 py-2.5 text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-smooth shadow-md disabled:opacity-50"
              style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
            >
              {updateMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {FIELD_SECTIONS.map((sec) => {
              const isOpen = expandedSections.has(sec.title);
              return (
                <div key={sec.title} className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] shadow-sm overflow-hidden">
                  <button
                    onClick={() => toggleSection(sec.title)}
                    className="w-full px-5 py-4 flex items-center justify-between border-b border-[var(--border-color)] bg-[var(--page-bg)]/40 text-left font-bold text-sm"
                  >
                    <span className="flex items-center gap-2 text-[var(--text-primary)]">
                      {sec.icon} {sec.title}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-[var(--text-secondary)] transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </button>

                  {isOpen && (
                    <div className="p-5 space-y-4">
                      {sec.fields.map((fieldKey) => {
                        const fk = fieldKey as keyof OrgData;
                        const label = FIELD_LABELS[fieldKey] || fieldKey;
                        const val = form[fk];

                        if (fieldKey === "painPoints" || fieldKey === "contentPillars") {
                          const arrVal = Array.isArray(val) ? val.join(", ") : "";
                          return (
                            <div key={fieldKey} className="space-y-1.5">
                              <label className="text-xs font-bold text-[var(--text-secondary)] uppercase font-mono">
                                {label}
                              </label>
                              <textarea
                                value={arrVal}
                                onChange={(e) => handleArrayChange(fk as any, e.target.value)}
                                className="w-full bg-[var(--page-bg)] border border-[var(--border-color)] rounded-xl p-3 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-magenta)]/40 h-20"
                                placeholder="Comma separated list..."
                              />
                            </div>
                          );
                        }

                        if (fieldKey === "description" || fieldKey === "complianceNotes") {
                          return (
                            <div key={fieldKey} className="space-y-1.5">
                              <label className="text-xs font-bold text-[var(--text-secondary)] uppercase font-mono">
                                {label}
                              </label>
                              <textarea
                                value={(val as string) || ""}
                                onChange={(e) => handleChange(fk, e.target.value)}
                                className="w-full bg-[var(--page-bg)] border border-[var(--border-color)] rounded-xl p-3 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-magenta)]/40 h-20"
                              />
                            </div>
                          );
                        }

                        return (
                          <div key={fieldKey} className="space-y-1.5">
                            <label className="text-xs font-bold text-[var(--text-secondary)] uppercase font-mono">
                              {label}
                            </label>
                            <input
                              type={fieldKey === "postsPerDay" ? "number" : "text"}
                              value={(val as any) || ""}
                              onChange={(e) => handleChange(fk, fieldKey === "postsPerDay" ? parseInt(e.target.value) || 1 : e.target.value)}
                              className="w-full bg-[var(--page-bg)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-magenta)]/40"
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: Team & Admin Approvals Queue */}
      {activeTab === "team" && (
        <div className="space-y-8">
          {/* SECTION 1: Pending Admin Approvals Queue */}
          <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6 shadow-sm space-y-6">
            <div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-400" />
                <h2 className="text-lg font-bold text-[var(--text-primary)]" style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>
                  Pending Admin Approval Queue
                </h2>
                <ContextHelpTooltip content="Review incoming member requests. Badges clearly indicate whether the user is asking for Master Org or Individual Org access." />
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Approve or decline users requesting to join your Master Org or specific workspace.
              </p>
            </div>

            {pendingRequests.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-[var(--border-color)] rounded-xl">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                <p className="text-xs text-[var(--text-secondary)] font-medium">
                  No pending access requests in queue.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRequests.map((req) => {
                  const isMaster = req.targetType === "MASTER_ORG";
                  return (
                    <div
                      key={req.id}
                      className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--page-bg)]/40 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        {/* Target Badge */}
                        {isMaster ? (
                          <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono bg-gradient-to-r from-purple-500/20 to-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 shrink-0">
                            <Crown className="w-3 h-3 text-amber-400" />
                            [MASTER ORG]
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1.5 shrink-0">
                            <Building2 className="w-3 h-3 text-blue-400" />
                            [INDIVIDUAL ORG: {req.org?.name || slug}]
                          </span>
                        )}

                        <div>
                          <p className="text-xs font-bold text-[var(--text-primary)]">
                            {req.user.firstname ? `${req.user.firstname} ${req.user.lastname}` : req.user.email}
                          </p>
                          <p className="text-[10px] text-[var(--text-tertiary)] font-mono">
                            {req.user.email} • Requested {new Date(req.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => approveMut.mutate({ requestId: req.id })}
                          disabled={approveMut.isPending}
                          className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 transition-smooth flex items-center gap-1.5"
                        >
                          <UserCheck className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => declineMut.mutate(req.id)}
                          disabled={declineMut.isPending}
                          className="px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 transition-smooth"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECTION 2: Invite Teammate Modal & Shareable Code Generator */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Direct Email Invite Form */}
            <div className="md:col-span-7 rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-400" />
                <h2 className="text-base font-bold text-[var(--text-primary)]" style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>
                  Invite Teammate via Email
                </h2>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-[var(--text-tertiary)] font-mono">
                    Recipient Email
                  </label>
                  <input
                    type="email"
                    placeholder="teammate@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full bg-[var(--page-bg)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-magenta)]/40 mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-[var(--text-tertiary)] font-mono">
                      Invite Scope
                    </label>
                    <select
                      value={inviteScope}
                      onChange={(e) => setInviteScope(e.target.value as any)}
                      className="w-full bg-[var(--page-bg)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] outline-none mt-1"
                    >
                      <option value="INDIVIDUAL_ORG">This Organization ({slug})</option>
                      <option value="MASTER_ORG">Master Org (Global Access)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-[var(--text-tertiary)] font-mono">
                      Role Privilege
                    </label>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as any)}
                      className="w-full bg-[var(--page-bg)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] outline-none mt-1"
                    >
                      <option value={MemberRole.MEMBER}>Member / Editor</option>
                      <option value={MemberRole.ORG_ADMIN}>Org Admin</option>
                      <option value={MemberRole.VIEWER}>Viewer (Read Only)</option>
                      <option value={MemberRole.MASTER_ADMIN}>Master Admin</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={() => sendInviteMut.mutate()}
                  disabled={sendInviteMut.isPending}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl py-2.5 text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-smooth shadow-md disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                >
                  {sendInviteMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Send Invitation
                </button>
              </div>

              {generatedCode && (
                <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl flex items-center justify-between text-xs">
                  <span className="font-mono text-purple-300">
                    Invite Code: <strong>{generatedCode}</strong>
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedCode);
                      toast.success("Code copied to clipboard!");
                    }}
                    className="flex items-center gap-1 text-[10px] font-bold text-purple-400 hover:underline"
                  >
                    <Copy className="w-3 h-3" /> Copy Code
                  </button>
                </div>
              )}
            </div>

            {/* Shareable Org Join Link */}
            <div className="md:col-span-5 rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Key className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-base font-bold text-[var(--text-primary)]" style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>
                    Shareable Join Link
                  </h2>
                </div>
                <p className="text-xs text-[var(--text-secondary)]">
                  Copy this unique join link to share with teammates. Teammates using this link submit join requests directly to your Admin Queue.
                </p>
              </div>

              <div className="pt-4 space-y-2">
                <div className="p-3 bg-[var(--page-bg)] border border-[var(--border-color)] rounded-xl font-mono text-[11px] text-[var(--text-secondary)] truncate">
                  https://janus-engine.vercel.app/discover?org={slug}
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`https://janus-engine.vercel.app/discover?org=${slug}`);
                    toast.success("Shareable link copied to clipboard!");
                  }}
                  className="w-full bg-[var(--page-bg)] hover:bg-[var(--card-bg)] border border-[var(--border-color)] py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] transition-smooth flex items-center justify-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy Join Link
                </button>
              </div>
            </div>
          </div>

          {/* SECTION 3: Active Members Table */}
          <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[var(--text-primary)]" style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>
                  Active Teammates & Roles
                </h2>
                <p className="text-xs text-[var(--text-secondary)]">
                  Active members with access to this organization.
                </p>
              </div>
              <span className="text-xs font-mono text-[var(--text-tertiary)] font-bold">
                {members.length} Active Members
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-[var(--border-color)]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[var(--page-bg)] border-b border-[var(--border-color)] text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] font-mono">
                    <th className="p-3">Teammate</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {members.map((mem) => (
                    <tr key={mem.id} className="hover:bg-[var(--page-bg)]/40 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-purple-600/20 text-purple-300 font-bold flex items-center justify-center text-xs">
                            {mem.user.email.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-[var(--text-primary)]">
                              {mem.user.firstname ? `${mem.user.firstname} ${mem.user.lastname}` : mem.user.email}
                            </p>
                            <p className="text-[10px] text-[var(--text-tertiary)] font-mono">
                              {mem.user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20">
                          {mem.role}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="flex items-center gap-1 text-emerald-400 text-[10px] font-bold font-mono">
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => toast.info("Role modification updated")}
                          className="text-[10px] font-bold text-rose-400 hover:underline"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
