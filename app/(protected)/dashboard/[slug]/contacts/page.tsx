"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getContacts } from "@/actions/contacts/queries";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Download, Users, Calendar, Fingerprint } from "lucide-react";

type Contact = {
  id: string;
  instagramId: string;
  username: string | null;
  createdAt: Date;
  userId: string | null;
};

function ContactsPage() {
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["contacts-list"],
    queryFn: () => getContacts(),
  });

  const contacts: Contact[] = data?.status === 200 ? (data.data as any[]) : [];

  const filteredContacts = contacts.filter((c) =>
    (c.username || "")?.toLowerCase().includes(search.toLowerCase()) ||
    c.instagramId.includes(search)
  );

  const exportToCSV = () => {
    if (filteredContacts.length === 0) return;

    const headers = ["ID", "Instagram ID", "Username", "Interacted At"];
    const rows = filteredContacts.map((c) => [
      c.id,
      c.instagramId,
      c.username || "N/A",
      new Date(c.createdAt).toLocaleString(),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((val) => `"${val.toString().replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `instagram_contacts_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-y-6 w-full p-4 lg:p-6 text-[var(--text-primary)] pr-2 lg:pr-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-y-4">
        <div>
          <h1 className="text-4xl font-bold text-[var(--text-primary)]" style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>
            Contacts Catalog
          </h1>
          <p className="text-[var(--text-secondary)] text-xs mt-1">
            View and export profiles who interacted with your automations
          </p>
        </div>
        <Button
          onClick={exportToCSV}
          disabled={filteredContacts.length === 0}
          className="flex items-center gap-x-2 bg-[var(--text-primary)] text-[var(--page-bg)] hover:bg-[var(--accent-magenta)] hover:text-white rounded-lg font-bold text-[10px] uppercase tracking-wider px-5 py-3 transition-smooth shadow-sm border border-[var(--border-color)]"
          style={{ fontFamily: "var(--font-space-grotesk), monospace" }}
        >
          <Download className="w-4 h-4" />
          Export to CSV
        </Button>
      </div>

      <div className="flex items-center bg-[var(--card-bg)]/50 border border-[var(--border-color)] rounded-lg px-3 py-2 w-full md:w-80 focus-within:border-[var(--accent-magenta)]/40 transition-smooth">
        <Search className="w-4 h-4 text-[var(--text-tertiary)] mr-2" />
        <Input
          placeholder="Search by username or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent border-none outline-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0 py-1 h-auto text-xs text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
        />
      </div>

      <div className="border border-[var(--border-color)] bg-[var(--card-bg)] rounded-xl overflow-hidden shadow-md">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[var(--accent-magenta)]" />
            <p className="text-[var(--text-secondary)] text-xs">Loading contacts...</p>
          </div>
        ) : filteredContacts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-color)] bg-[var(--page-bg)]/30">
                  <th className="p-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider" style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>
                    <div className="flex items-center gap-x-2">
                      <Users className="w-3.5 h-3.5 text-[var(--accent-magenta)]" />
                      Username
                    </div>
                  </th>
                  <th className="p-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider" style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>
                    <div className="flex items-center gap-x-2">
                      <Fingerprint className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                      Instagram ID
                    </div>
                  </th>
                  <th className="p-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider" style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>
                    <div className="flex items-center gap-x-2">
                      <Calendar className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                      First Interacted
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {filteredContacts.map((contact) => (
                  <tr
                    key={contact.id}
                    className="hover:bg-[var(--page-bg)]/40 transition-smooth group"
                  >
                    <td className="p-4 text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--accent-magenta)] transition-smooth">
                      @{contact.username || "unknown"}
                    </td>
                    <td className="p-4 text-sm text-[var(--text-secondary)] font-mono" style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>
                      {contact.instagramId}
                    </td>
                    <td className="p-4 text-sm text-[var(--text-secondary)]">
                      {new Date(contact.createdAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-20 flex flex-col items-center justify-center text-center px-6 max-w-md mx-auto">
            <div className="p-4 bg-[var(--page-bg)] border border-[var(--border-color)] rounded-xl mb-4 text-[var(--text-tertiary)]">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-semibold text-[var(--text-primary)]" style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>
              No Contacts Registered
            </h3>
            <p className="text-[var(--text-secondary)] text-xs mt-2 leading-relaxed">
              Contacts will automatically populate here once followers interact with your Instagram automations.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ContactsPage;
