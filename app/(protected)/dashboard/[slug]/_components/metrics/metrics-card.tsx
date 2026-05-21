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
      highlightColor: "text-blue-400",
      bgGlow: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
      isActiveIndicator: true,
      activeCount: activeAutomations,
    },
    {
      id: "contacts",
      title: "Saved Contacts",
      subTitle: "Collected via DMs/Comments",
      value: totalContacts,
      desc: "Unique profiles engaged",
      icon: <Users className="w-4 h-4" />,
      highlightColor: "text-indigo-400",
      bgGlow: "bg-indigo-500/10",
      borderColor: "border-indigo-500/20",
      isActiveIndicator: false,
    },
    {
      id: "comments",
      title: "Comments Processed",
      subTitle: "Replies on your posts",
      value: comments,
      desc: `${comments} total comment responses`,
      icon: <MessageSquare className="w-4 h-4" />,
      highlightColor: "text-purple-400",
      bgGlow: "bg-purple-500/10",
      borderColor: "border-purple-500/20",
      isActiveIndicator: false,
    },
    {
      id: "dms",
      title: "DMs Managed",
      subTitle: "Conversations handled",
      value: dms,
      desc: `${dms} direct messages automated`,
      icon: <Mail className="w-4 h-4" />,
      highlightColor: "text-pink-400",
      bgGlow: "bg-pink-500/10",
      borderColor: "border-pink-500/20",
      isActiveIndicator: false,
    },
  ];

  if (automationsLoading || contactsLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-5 glass-card border border-white/[0.06] rounded-xl flex flex-col justify-between min-h-[140px]"
          >
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <Skeleton className="h-4 w-28 bg-white/[0.06]" />
                <Skeleton className="h-3 w-36 bg-white/[0.04]" />
              </div>
              <Skeleton className="h-8 w-8 rounded-lg bg-white/[0.06]" />
            </div>
            <div className="space-y-2 mt-4">
              <Skeleton className="h-8 w-16 bg-white/[0.08]" />
              <Skeleton className="h-3 w-40 bg-white/[0.04]" />
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
          className="p-5 glass-card border border-white/[0.06] flex flex-col justify-between rounded-xl w-full min-h-[140px] transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.03] hover:shadow-[0_4px_20px_rgba(0,0,0,0.4)] group"
        >
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors duration-200">
                {stat.title}
              </h2>
              <p className="text-[10px] text-text-secondary mt-0.5">{stat.subTitle}</p>
            </div>
            <span className={`p-2 ${stat.bgGlow} rounded-lg border ${stat.borderColor} ${stat.highlightColor}`}>
              {stat.icon}
            </span>
          </div>

          <div className="mt-4">
            <div className="flex items-baseline gap-x-2">
              <h3 className="text-3xl font-extrabold text-white tracking-tight">
                {stat.value}
              </h3>
              {stat.isActiveIndicator && stat.activeCount! > 0 && (
                <span className="flex items-center gap-1 text-[9px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/10">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                  </span>
                  Active
                </span>
              )}
            </div>
            <p className="text-[10px] text-[#9B9CA0] mt-1">{stat.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default MetricsCard;


