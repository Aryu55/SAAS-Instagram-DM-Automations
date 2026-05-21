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
import GradientButton from "../gradient-button";
import Loader from "../loader";

type Props = {};

function AutomationList({}: Props) {
  const { data, isPending } = useQueryAutomation();

  const { latestVariable } = useMutationDataState(["create-automation"]);
  // console.log("🚀 ~ AutomationList ~ latestVariables:", latestVariables);

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
      <div className="flex flex-col gap-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-[#1D1D1D] rounded-xl p-5 border border-[#545454]/50 flex skeleton-shimmer" style={{ animationDelay: `${i * 0.15}s` }}>
            <div className="flex flex-col flex-1 items-start gap-y-2">
              <Skeleton className="h-6 w-48 bg-white/[0.06]" />
              <Skeleton className="h-4 w-32 bg-white/[0.04]" />
              <div className="flex gap-x-2 mt-3">
                <Skeleton className="h-7 w-16 rounded-full bg-white/[0.06]" />
                <Skeleton className="h-7 w-20 rounded-full bg-white/[0.06]" />
                <Skeleton className="h-7 w-14 rounded-full bg-white/[0.06]" />
              </div>
            </div>
            <div className="flex flex-col justify-between items-end">
              <Skeleton className="h-4 w-24 bg-white/[0.04]" />
              <Skeleton className="h-9 w-24 rounded-md bg-white/[0.06]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (data?.status !== 200 || optimisticUiData.data.length <= 0) {
    return (
      <div className="h-[70vh] flex justify-center items-center flex-col gap-y-3">
        <h3 className="text-lg text-gray-400">No Automation</h3>
        <CreateAutomation />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-y-3">
      {optimisticUiData.data!.map((automation) => (
        <Link
          href={`${pathname}/${automation.id}`}
          key={automation.id}
          className="bg-[#1D1D1D] hover:opacity-80 transition duration-100 rounded-xl p-5 border-[1px] radial--gradient--automations flex border-[#545454]"
        >
          <div className="flex flex-col flex-1 items-start">
            <h2 className="text-xl font-semibold">{automation.name}</h2>
            <p className="text-[#9B9CA0] text-sm font-light mb-2">
              This is from comment
            </p>

            {automation.keywords && Array.isArray(automation.keywords) && automation.keywords.length > 0 ? (
              <div className="flex gap-x-2 flex-wrap mt-3">
                {
                  // @ts-ignore
                  automation.keywords.map((keyword, index) => (
                    <div
                      key={index}
                      className={cn(
                        "rounded-full px-4 py-1 capitalize",
                        (0 + 1) % 1 == 0 &&
                          "bg-keyword-green/15 border-2 border-keyword-green",
                        (1 + 1) % 2 == 0 &&
                          "bg-keyword-purple/15 border-2 border-keyword-purple",
                        (2 + 1) % 3 == 0 &&
                          "bg-keyword-yellow/15 border-2 border-keyword-yellow",
                        (3 + 1) % 4 == 0 &&
                          "bg-keyword-red/15 border-2 border-keyword-red"
                      )}
                    >
                      {keyword.word}
                    </div>
                  ))
                }
              </div>
            ) : (
              <div className="rounded-full border-2 mt-3 border-dashed border-white/60 px-3 py-1">
                <p className="text-sm text-[#bfc0c3]">No Keywords</p>
              </div>
            )}
          </div>
          <div className="flex flex-col justify-between">
            <p className="capitalize text-sm font-light text-[#9B9CA0]">
              {automation.createdAt ? (
                <>
                  {getMonth(new Date(automation.createdAt).getUTCMonth() + 1)}{" "}
                  {new Date(automation.createdAt).getUTCDate() === 1
                    ? `${new Date(automation.createdAt).getUTCDate()}st`
                    : `${new Date(automation.createdAt).getUTCDate()}th`}{" "}
                  {new Date(automation.createdAt).getUTCFullYear()}
                </>
              ) : (
                "Loading..."
              )}
            </p>

            {automation.listener?.listener === "SMARTAI" ? (
              <GradientButton
                type="BUTTON"
                className="w-full bg-background-80 text-white hover:bg-background-80"
              >
                Smart AI
              </GradientButton>
            ) : (
              <Button className="bg-background-80 hover:bg-background-80 text-white">
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
