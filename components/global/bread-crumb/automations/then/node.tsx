"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useQueryAutomations } from "@/hooks/user-queries";
import { PlaneBlue, SmartAi, Warning } from "@/icons";
import PostButton from "../post";
import InfoTooltip from "@/components/global/info-tooltip";
import { cn } from "@/lib/utils";

type Props = {
  id: string;
};

function ThenNode({ id }: Props) {
  const { data, isPending } = useQueryAutomations(id);

  if (isPending) {
    return (
      <div className="w-full lg:w-10/12 xl:w-7/12 p-[1px] bg-[var(--page-bg)] border border-[var(--border-color)] rounded-none skeleton-shimmer">
        <div className="glass-card p-8 rounded-none flex flex-col gap-y-4">
          <div className="flex gap-x-2 items-center">
            <Skeleton className="h-5 w-5 rounded-none bg-[var(--border-color)]" />
            <Skeleton className="h-5 w-16 bg-[var(--border-color)]" />
          </div>
          <div className="bg-[var(--page-bg)] border border-[var(--border-color)] p-5 rounded-none flex flex-col gap-y-2">
            <div className="flex gap-x-2 items-center">
              <Skeleton className="h-6 w-6 rounded-none bg-[var(--border-color)]" />
              <Skeleton className="h-5 w-44 bg-[var(--border-color)]" />
            </div>
            <Skeleton className="h-4 w-full bg-[var(--border-color)]" />
            <Skeleton className="h-4 w-3/4 bg-[var(--border-color)]" />
          </div>
        </div>
      </div>
    );
  }
  const commentTrigger = data?.data?.trigger?.find((t) => t.type === "COMMENT");

  return !data?.data?.listener ? (
    <></>
  ) : (
    <div className="w-full lg:w-10/12 relative xl:w-7/12 p-[1px] bg-[var(--page-bg)] border border-[var(--border-color)] rounded-none shadow-sm">
      {/* Node Connector Line */}
      <div className="absolute h-16 left-1/2 bottom-full flex flex-col items-center z-10">
        <span className="h-[7px] w-[7px] bg-[var(--accent-magenta)] rounded-full" />
        <Separator
          orientation="vertical"
          className="bottom-full flex-1 border-[1px] border-[var(--border-color)]"
        />
        <span className="h-[7px] w-[7px] bg-[var(--accent-magenta)] rounded-full" />
      </div>

      <div className="glass-card p-8 rounded-none flex flex-col gap-y-4 relative bg-[var(--card-bg)]">
        <div className="flex gap-x-2 items-center text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>
          <span className="p-1 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-emerald-400 shrink-0 flex items-center justify-center">
            <Warning />
          </span>
          <span>Then...</span>
          <InfoTooltip message="Define the action or reply the AI will execute when the trigger fires." />
        </div>

        <div className="bg-[var(--page-bg)] border border-[var(--border-color)] p-5 rounded-none flex flex-col gap-y-2">
          <div className="flex gap-x-3 items-center">
            <span className="p-2 bg-[var(--accent-whisper)] border border-[var(--accent-veil)] text-[var(--accent-magenta)] rounded-none shrink-0 flex items-center justify-center">
              {data.data.listener.listener === "MESSAGE" ? (
                <PlaneBlue />
              ) : (
                <SmartAi />
              )}
            </span>
            <p className="text-md font-bold text-[var(--text-primary)] tracking-tight">
              {data.data.listener.listener === "MESSAGE"
                ? "Send The User Message"
                : "Let Smart AI Take Over"}
            </p>
          </div>
          <p className="text-sm font-medium text-[var(--text-secondary)] leading-relaxed mt-1">
            {data.data.listener.prompt}
          </p>
        </div>
        
        {data.data.posts.length > 0 ? (
          <></>
        ) : commentTrigger ? (
          <div className="mt-2">
            <PostButton id={id} />
          </div>
        ) : (
          <></>
        )}
      </div>
    </div>
  );
}

export default ThenNode;
