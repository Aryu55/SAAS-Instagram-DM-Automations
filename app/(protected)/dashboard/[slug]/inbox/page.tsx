"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getOrganizationConfig } from "@/actions/factory";
import { getOrgContacts, getOrgAutomations } from "@/actions/contacts/org-queries";
import Link from "next/link";
import {
  Inbox, Users, Zap, Search, Download, Calendar,
  Fingerprint, MessageSquare, ChevronRight, Loader2
} from "lucide-react";

type TabId = "contacts" | "automations";

export default function InboxPage() {
  const params = useParams();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const [activeTab, setActiveTab] = useState<TabId>("contacts");
  const [search, setSearch] = useState("");

  // Fetch org
  const { data: orgData } = useQuery({
    queryKey: ["org-config", slug],
    queryFn: () => getOrganizationConfig(slug!),
    enabled: !!slug,
  });
  const orgId = orgData?.status === 200 ? (orgData.data as any)?.id : null;

  // Fetch contacts
  const { data: contactsData, isLoading: loadingContacts } = useQuery({
    queryKey: ["org-contacts", orgId],
    queryFn: () => getOrgContacts(orgId!),
    enabled: !!orgId,
  });
  const contacts = contactsData?.status === 200 ? (contactsData.data as any[]) : [];

  // Fetch automations
  const { data: autoData, isLoading: loadingAutos } = useQuery({
    queryKey: ["org-automations", orgId],
    queryFn: () => getOrgAutomations(orgId!),
    enabled: !!orgId,
  });
  const automations = autoData?.status === 200 ? (autoData.data as any[]) : [];

  const filteredContacts = contacts.filter((c: any) =>
    (c.username || "").toLowerCase().includes(search.toLowerCase()) ||
    c.instagramId.includes(search)
  );

  const filteredAutomations = automations.filter((a: any) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  const exportCSV = () => {
    if (filteredContacts.length === 0) return;
    const headers = ["ID", "Instagram ID", "Username", "First Interacted"];
    const rows = filteredContacts.map((c: any) => [
      c.id, c.instagramId, c.username || "N/A",
      new Date(c.createdAt).toLocaleString(),
    ]);
    const csv = [headers.join(","), ...rows.map((r: any) => r.map((v: any) => `"${String(v).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `contacts_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <div className="flex flex-col gap-y-6 p-4 lg:p-6 text-[var(--text-primary)]">
      {/* Header */}
      <div>
        <h1
          className="text-3xl font-bold"
          style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
        >
          Inbox
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          Manage contacts and DM automations for this organization.
        </p>
      </div>

      {/* Tab Bar */}
      <div className="flex border-b border-[var(--border-color)] gap-x-6">
        {([
          { id: "contacts" as TabId, label: "Contacts", icon: <Users className="w-4 h-4" />, count: contacts.length },
          { id: "automations" as TabId, label: "Automations", icon: <Zap className="w-4 h-4" />, count: automations.length },
        ]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setSearch(""); }}
            className={`pb-3 flex items-center gap-x-2 text-xs font-semibold relative transition-colors duration-200 ${
              activeTab === tab.id ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
            }`}
          >
            {tab.icon}
            {tab.label}
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--page-bg)] border border-[var(--border-color)]" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>
              {tab.count}
            </span>
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-magenta)]" />
            )}
          </button>
        ))}
      </div>

      {/* Search + Actions */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg px-3 py-2 w-full sm:w-80 focus-within:border-[var(--accent-magenta)]/40 transition-smooth">
          <Search className="w-4 h-4 text-[var(--text-tertiary)] mr-2" />
          <input
            type="text"
            placeholder={activeTab === "contacts" ? "Search by username or ID..." : "Search automations..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-xs text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] w-full"
          />
        </div>
        {activeTab === "contacts" && (
          <button
            onClick={exportCSV}
            disabled={filteredContacts.length === 0}
            className="flex items-center gap-x-2 bg-[var(--text-primary)] text-[var(--page-bg)] hover:bg-[var(--accent-magenta)] hover:text-white rounded-lg font-bold text-[10px] uppercase tracking-wider px-5 py-2.5 transition-smooth shadow-sm border border-[var(--border-color)] disabled:opacity-50"
            style={{ fontFamily: "var(--font-space-grotesk), monospace" }}
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        )}
      </div>

      {/* Contacts Tab */}
      {activeTab === "contacts" && (
        <div className="border border-[var(--border-color)] bg-[var(--card-bg)] rounded-xl overflow-hidden shadow-sm">
          {loadingContacts ? (
            <div className="py-20 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--accent-magenta)]" />
            </div>
          ) : filteredContacts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border-color)] bg-[var(--page-bg)]/30">
                    <th className="p-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider" style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>
                      <div className="flex items-center gap-x-2"><Users className="w-3.5 h-3.5 text-[var(--accent-magenta)]" /> Username</div>
                    </th>
                    <th className="p-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider" style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>
                      <div className="flex items-center gap-x-2"><Fingerprint className="w-3.5 h-3.5" /> Instagram ID</div>
                    </th>
                    <th className="p-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider" style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>
                      <div className="flex items-center gap-x-2"><Calendar className="w-3.5 h-3.5" /> First Interacted</div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {filteredContacts.map((c: any) => (
                    <tr key={c.id} className="hover:bg-[var(--page-bg)]/40 transition-smooth group">
                      <td className="p-4 text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--accent-magenta)] transition-smooth">
                        @{c.username || "unknown"}
                      </td>
                      <td className="p-4 text-sm text-[var(--text-secondary)] font-mono">{c.instagramId}</td>
                      <td className="p-4 text-sm text-[var(--text-secondary)]">
                        {new Date(c.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-20 flex flex-col items-center text-center px-6">
              <div className="p-4 bg-[var(--page-bg)] border border-[var(--border-color)] rounded-xl mb-4">
                <Users className="w-8 h-8 text-[var(--text-tertiary)]" />
              </div>
              <h3 className="text-xl font-semibold text-[var(--text-primary)]" style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>
                No Contacts Yet
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-2">
                Contacts will populate once followers interact with your automations.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Automations Tab */}
      {activeTab === "automations" && (
        <div className="flex flex-col gap-y-3">
          {loadingAutos ? (
            <div className="py-20 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--accent-magenta)]" />
            </div>
          ) : filteredAutomations.length > 0 ? (
            filteredAutomations.map((auto: any) => (
              <Link
                key={auto.id}
                href={`/dashboard/${slug}/automation/${auto.id}`}
                className="group flex items-center justify-between rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-5 hover:border-[var(--accent-magenta)]/40 transition-all duration-300 hover:shadow-lg"
              >
                <div className="flex items-center gap-x-4">
                  <span className={`p-2 rounded-lg border ${auto.active ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-[var(--page-bg)] border-[var(--border-color)] text-[var(--text-tertiary)]"}`}>
                    <Zap className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-magenta)] transition-colors">
                      {auto.name}
                    </h3>
                    <div className="flex items-center gap-x-3 mt-1">
                      <span className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>
                        {auto.active ? "ACTIVE" : "INACTIVE"}
                      </span>
                      <span className="text-[9px] text-[var(--text-tertiary)]">
                        {auto._count?.dms || 0} DMs · {auto.keywords?.length || 0} keywords
                      </span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)] group-hover:text-[var(--accent-magenta)] transition-colors" />
              </Link>
            ))
          ) : (
            <div className="py-20 flex flex-col items-center text-center">
              <div className="p-4 bg-[var(--page-bg)] border border-[var(--border-color)] rounded-xl mb-4">
                <Zap className="w-8 h-8 text-[var(--text-tertiary)]" />
              </div>
              <h3 className="text-xl font-semibold text-[var(--text-primary)]" style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>
                No Automations
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-2">
                Create your first DM automation from the Automation page.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
