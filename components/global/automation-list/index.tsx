"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMutationDataState } from "@/hooks/use-mutation-data";
import { usePath } from "@/hooks/user-nav";
import { useQueryAutomation } from "@/hooks/user-queries";
import { cn, getMonth } from "@/lib/utils";
import Link from "next/link";
import { useMemo } from "react";
import CreateAutomation from "../create-automation";

type Props = {};

function AutomationList({}: Props) {
  const { data, isPending } = useQueryAutomation();

  const { latestVariable } = useMutationDataState(["create-automation"]);

  const { pathname } = usePath();

  const optimisticUiData = useMemo(() => {
    if (latestVariable && latestVariable.status === "pending" && data) {
      const templateId = latestVariable.variables;
      let name = "Untitled";
      let keywords: { id: string; word: string }[] = [];

      if (templateId === "say-hi") {
        name = "Welcome DM Template";
        keywords = [
          { id: "1", word: "hi" },
          { id: "2", word: "hello" },
          { id: "3", word: "hey" },
        ];
      } else if (templateId === "auto-dm-link") {
        name = "Auto-DM Link Template";
        keywords = [
          { id: "1", word: "link" },
          { id: "2", word: "send" },
          { id: "3", word: "get" },
        ];
      } else if (templateId === "generate-leads") {
        name = "Lead Gen Template";
        keywords = [
          { id: "1", word: "lead" },
          { id: "2", word: "yes" },
          { id: "3", word: "info" },
        ];
      } else if (templateId === "respond-all") {
        name = "Auto-Responder Template";
        keywords = [
          { id: "1", word: "help" },
          { id: "2", word: "support" },
          { id: "3", word: "question" },
        ];
      } else if (templateId === "grow-followers") {
        name = "Comment Growth Template";
        keywords = [
          { id: "1", word: "follow" },
          { id: "2", word: "coupon" },
          { id: "3", word: "gift" },
        ];
      }

      const newAutomation = {
        id: "optimistic-id",
        name,
        createdAt: new Date(),
        keywords,
        listener: templateId === "respond-all" ? { listener: "SMARTAI" } : { listener: "MESSAGE" },
      };

      const newData = [newAutomation, ...data.data];
      return { data: newData };
    }
    return data || { data: [] };
  }, [latestVariable, data]);

  if (isPending) {
    return (
      <div className="flex flex-col gap-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-[var(--card-bg)] rounded-xl p-5 border border-[var(--border-color)] flex" style={{ animationDelay: `${i * 0.15}s` }}>
            <div className="flex flex-col flex-1 items-start gap-y-2">
              <Skeleton className="h-6 w-48 bg-[var(--border-color)]" />
              <Skeleton className="h-4 w-32 bg-[var(--border-color)]" />
              <div className="flex gap-x-2 mt-3">
                <Skeleton className="h-7 w-16 rounded-full bg-[var(--border-color)]" />
                <Skeleton className="h-7 w-20 rounded-full bg-[var(--border-color)]" />
                <Skeleton className="h-7 w-14 rounded-full bg-[var(--border-color)]" />
              </div>
            </div>
            <div className="flex flex-col justify-between items-end">
              <Skeleton className="h-4 w-24 bg-[var(--border-color)]" />
              <Skeleton className="h-9 w-24 rounded-lg bg-[var(--border-color)]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (data?.status !== 200 || optimisticUiData.data.length <= 0) {
    return (
      <div className="h-[40vh] flex justify-center items-center flex-col gap-y-4 border border-dashed border-[var(--border-color)] bg-[var(--card-bg)] p-6 rounded-xl">
        <h3 className="text-lg text-[var(--text-secondary)] font-semibold">No Automation Configured</h3>
        <p className="text-xs text-[var(--text-tertiary)] max-w-[280px] text-center mb-2">Create your first Instagram auto-reply flow to interact with your audience automatically.</p>
        <CreateAutomation />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-y-4">
      {optimisticUiData.data!.map((automation) => (
        <Link
          href={`${pathname}/${automation.id}`}
          key={automation.id}
          className="bg-[var(--card-bg)] hover:-translate-y-1 hover:shadow-md hover:border-[var(--accent-magenta)]/30 transition duration-200 rounded-xl p-6 border border-[var(--border-color)] flex group"
        >
          <div className="flex flex-col flex-1 items-start">
            <h2 className="text-xl font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-magenta)] transition-colors duration-200">
              {automation.name}
            </h2>
            <p className="text-[var(--text-secondary)] text-xs font-medium mt-0.5 mb-2">
              Instagram DM Automation trigger
            </p>

            {automation.keywords && Array.isArray(automation.keywords) && automation.keywords.length > 0 ? (
              <div className="flex gap-x-2 flex-wrap mt-3 gap-y-2">
                {
                  // @ts-ignore
                  automation.keywords.map((keyword, index) => (
                    <div
                      key={index}
                      className={cn(
                        "rounded-full px-3 py-1 text-[10px] uppercase font-bold border",
                        index % 4 === 0 && "bg-emerald-950/20 border-emerald-900/40 text-emerald-400",
                        index % 4 === 1 && "bg-purple-950/20 border-purple-900/40 text-purple-400",
                        index % 4 === 2 && "bg-amber-950/20 border-amber-900/40 text-amber-400",
                        index % 4 === 3 && "bg-rose-950/20 border-rose-900/40 text-rose-400"
                      )}
                      style={{ fontFamily: "var(--font-space-grotesk), monospace" }}
                    >
                      {keyword.word}
                    </div>
                  ))
                }
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-[var(--text-tertiary)] px-3 py-1 mt-3" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>
                <p className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase tracking-wider">No Keywords</p>
              </div>
            )}
          </div>
          <div className="flex flex-col justify-between items-end shrink-0 pl-4">
            <p className="capitalize text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-4" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>
              {automation.createdAt ? (
                <>
                  {getMonth(new Date(automation.createdAt).getUTCMonth() + 1)}{" "}
                  {new Date(automation.createdAt).getUTCDate()}
                  {new Date(automation.createdAt).getUTCDate() === 1
                    ? "st"
                    : new Date(automation.createdAt).getUTCDate() === 2
                    ? "nd"
                    : new Date(automation.createdAt).getUTCDate() === 3
                    ? "rd"
                    : "th"}
                  {", "}{new Date(automation.createdAt).getUTCFullYear()}
                </>
              ) : (
                "Loading..."
              )}
            </p>

            {automation.listener?.listener === "SMARTAI" ? (
              <Button
                className="rounded-lg bg-[var(--accent-magenta)] text-white hover:opacity-90 text-[10px] font-bold uppercase tracking-wider px-3.5 py-1.5 h-auto transition-smooth"
                style={{ fontFamily: "var(--font-space-grotesk), monospace" }}
              >
                Smart AI
              </Button>
            ) : (
              <Button
                className="rounded-lg bg-[var(--page-bg)] hover:bg-[var(--border-color)] border border-[var(--border-color)] text-[var(--text-primary)] text-[10px] font-bold uppercase tracking-wider px-3.5 py-1.5 h-auto transition-smooth"
                style={{ fontFamily: "var(--font-space-grotesk), monospace" }}
              >
                Standard
              </Button>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}

export default AutomationList;
