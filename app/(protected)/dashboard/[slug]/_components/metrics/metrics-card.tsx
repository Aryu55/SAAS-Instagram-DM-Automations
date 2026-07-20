"use client";

import { useQueryAutomation } from "@/hooks/user-queries";
import { useQuery } from "@tanstack/react-query";
import { getContacts } from "@/actions/contacts/queries";
import { MessageSquare, Mail, Users, Bot } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {};

function MetricsCard({}: Props) {
  const { data: automationsData, isLoading: automationsLoading } = useQueryAutomation();

  const { data: contactsData, isLoading: contactsLoading } = useQuery({
    queryKey: ["contacts-list"],
    queryFn: () => getContacts(),
  });

  const automations = automationsData?.data || [];
  const totalAutomations = automations.length;
  const activeAutomations = automations.filter((a) => a.active).length;

  const contacts = contactsData?.status === 200 ? (contactsData.data as any[]) : [];
  const totalContacts = contacts.length;

  const comments = automations.reduce((current, next) => {
    return current + (next.listener?.commentCount || 0);
  }, 0);

  const dms = automations.reduce((current, next) => {
    return current + (next.listener?.dmCount || 0);
  }, 0);

  const stats = [
    {
      id: "automations",
      title: "Total Automations",
      subTitle: "Active workflows",
      value: `${activeAutomations}/${totalAutomations}`,
      desc: activeAutomations > 0 ? "Active automation running" : "No active automations",
      icon: <Bot className="w-4 h-4" />,
      highlightColor: "text-[var(--text-primary)] border-[var(--border-color)] bg-[var(--page-bg)]",
      isActiveIndicator: true,
      activeCount: activeAutomations,
    },
    {
      id: "contacts",
      title: "Saved Contacts",
      subTitle: "Collected via DMs/Comments",
      value: totalContacts.toString(),
      desc: "Unique profiles engaged",
      icon: <Users className="w-4 h-4" />,
      highlightColor: "text-[var(--text-primary)] border-[var(--border-color)] bg-[var(--page-bg)]",
      isActiveIndicator: false,
    },
    {
      id: "comments",
      title: "Comments Processed",
      subTitle: "Replies on your posts",
      value: comments.toString(),
      desc: `${comments} total comment responses`,
      icon: <MessageSquare className="w-4 h-4" />,
      highlightColor: "text-[var(--text-primary)] border-[var(--border-color)] bg-[var(--page-bg)]",
      isActiveIndicator: false,
    },
    {
      id: "dms",
      title: "DMs Managed",
      subTitle: "Conversations handled",
      value: dms.toString(),
      desc: `${dms} direct messages automated`,
      icon: <Mail className="w-4 h-4" />,
      highlightColor: "text-[var(--text-primary)] border-[var(--border-color)] bg-[var(--page-bg)]",
      isActiveIndicator: false,
    },
  ];

  if (automationsLoading || contactsLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="border border-[var(--border-color)] bg-[var(--card-bg)] rounded-xl min-h-[140px] h-full"
          >
            <div className="p-5 flex flex-col justify-between h-full">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28 bg-[var(--border-color)]" />
                  <Skeleton className="h-3 w-36 bg-[var(--border-color)]" />
                </div>
                <Skeleton className="h-8 w-8 rounded-lg bg-[var(--border-color)]" />
              </div>
              <div className="space-y-2 mt-4">
                <Skeleton className="h-8 w-16 bg-[var(--border-color)]" />
                <Skeleton className="h-3 w-40 bg-[var(--border-color)]" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
      {stats.map((stat) => (
        <div
          key={stat.id}
          className="border border-[var(--border-color)] bg-[var(--card-bg)] transition-smooth hover:-translate-y-1 hover:shadow-md hover:border-[var(--accent-magenta)]/30 group h-full rounded-xl"
        >
          <div className="p-5 flex flex-col justify-between min-h-[140px] h-full">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-magenta)] transition-colors duration-200" style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>
                  {stat.title}
                </h2>
                <p className="text-[10px] text-[var(--text-secondary)] mt-0.5 font-medium">{stat.subTitle}</p>
              </div>
              <span className={`p-2.5 rounded-lg border flex items-center justify-center shrink-0 transition-smooth group-hover:bg-[var(--accent-magenta)] group-hover:text-white group-hover:border-transparent ${stat.highlightColor}`}>
                {stat.icon}
              </span>
            </div>

            <div className="mt-4">
              <div className="flex items-baseline gap-x-2">
                <h3 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight font-mono" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>
                  {stat.value}
                </h3>
                {stat.isActiveIndicator && stat.activeCount! > 0 && (
                  <span className="flex items-center gap-1.5 text-[9px] font-bold text-[var(--accent-magenta)] bg-[var(--accent-whisper)] px-2.5 py-0.5 rounded-full border border-[var(--accent-veil)] uppercase tracking-wider">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent-magenta)] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--accent-magenta)]"></span>
                    </span>
                    Active
                  </span>
                )}
              </div>
              <p className="text-[10px] text-[var(--text-secondary)] mt-1 font-medium">{stat.desc}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default MetricsCard;
