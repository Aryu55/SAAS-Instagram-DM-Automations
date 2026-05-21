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
    <div className="flex flex-col gap-y-6 w-full p-4 lg:p-6 text-white">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-y-4">
        <div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Contacts List
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            View and export profiles who interacted with your automations
          </p>
        </div>
        <Button
          onClick={exportToCSV}
          disabled={filteredContacts.length === 0}
          className="flex items-center gap-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 font-semibold px-5 py-5 rounded-xl transition duration-200 shadow-md shadow-blue-500/10"
        >
          <Download className="w-5 h-5" />
          Export to CSV
        </Button>
      </div>

      <div className="flex items-center bg-[#18181b]/50 border border-white/[0.08] rounded-xl px-3 py-1.5 w-full md:w-96 shadow-inner focus-within:border-blue-500/40 transition duration-150">
        <Search className="w-5 h-5 text-gray-400 mr-2" />
        <Input
          placeholder="Search by username or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent border-none outline-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0 py-1.5 w-full text-white placeholder-gray-400"
        />
      </div>

      <div className="border border-white/[0.08] bg-[#09090b]/40 backdrop-blur-md rounded-2xl overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
            <p className="text-gray-400 text-sm">Loading contacts...</p>
          </div>
        ) : filteredContacts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.08] bg-white/[0.02]">
                  <th className="p-4 text-sm font-semibold text-gray-300">
                    <div className="flex items-center gap-x-2">
                      <Users className="w-4 h-4 text-blue-400" />
                      Username
                    </div>
                  </th>
                  <th className="p-4 text-sm font-semibold text-gray-300">
                    <div className="flex items-center gap-x-2">
                      <Fingerprint className="w-4 h-4 text-indigo-400" />
                      Instagram ID
                    </div>
                  </th>
                  <th className="p-4 text-sm font-semibold text-gray-300">
                    <div className="flex items-center gap-x-2">
                      <Calendar className="w-4 h-4 text-purple-400" />
                      First Interacted
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredContacts.map((contact) => (
                  <tr
                    key={contact.id}
                    className="hover:bg-white/[0.02] transition duration-150 group"
                  >
                    <td className="p-4 text-sm font-medium text-white group-hover:text-blue-400 transition duration-150">
                      @{contact.username || "unknown"}
                    </td>
                    <td className="p-4 text-sm text-gray-400 font-mono">
                      {contact.instagramId}
                    </td>
                    <td className="p-4 text-sm text-gray-400">
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
          <div className="py-20 flex flex-col items-center justify-center text-center px-4">
            <Users className="w-12 h-12 text-gray-600 mb-3" />
            <p className="text-lg font-semibold text-gray-300">No Contacts Found</p>
            <p className="text-gray-500 text-sm max-w-xs mt-1">
              Contacts will automatically appear here once users interact with your Instagram automations.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ContactsPage;
