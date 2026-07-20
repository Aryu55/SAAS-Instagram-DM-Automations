"use client";

import Loader from "@/components/global/loader";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AUTOMATION_TRIGGERS } from "@/constants/automation";
import { useTrigger } from "@/hooks/use-automation";
import { useQueryAutomations } from "@/hooks/user-queries";
import { cn } from "@/lib/utils";
import ThenActions from "../then/then-actions";
import TriggerButton from "../trigger-button";
import ActiveTrigger from "./active";
import Keywords from "./keywords";

type Props = {
  id: string;
};

function Trigger({ id }: Props) {
  const { isPending, onSaveTrigger, onSetTrigger, types } = useTrigger(id);
  const { data, isPending: isQueryPending } = useQueryAutomations(id);

  if (isQueryPending) {
    return (
      <div className="flex flex-col gap-y-6 items-center w-full">
        <div className="bg-[var(--card-bg)] p-4 rounded-none border border-[var(--border-color)] w-full skeleton-shimmer">
          <div className="flex gap-x-2 items-center">
            <Skeleton className="h-8 w-8 rounded-none bg-[var(--border-color)]" />
            <Skeleton className="h-5 w-56 bg-[var(--border-color)]" />
          </div>
          <Skeleton className="h-4 w-full mt-2 bg-[var(--border-color)]" />
          <div className="flex gap-2 mt-5">
            <Skeleton className="h-7 w-16 rounded-none bg-[var(--border-color)]" />
            <Skeleton className="h-7 w-20 rounded-none bg-[var(--border-color)]" />
            <Skeleton className="h-7 w-14 rounded-none bg-[var(--border-color)]" />
          </div>
        </div>
      </div>
    );
  }

  if (data?.data && data?.data?.trigger?.length > 0) {
    return (
      <div className="flex flex-col gap-y-6 items-center w-full">
        <ActiveTrigger
          type={data.data.trigger[0].type}
          keywords={data.data.keywords}
        />

        {data.data.trigger.length > 1 && (
          <>
            <div className="relative w-6/12 flex justify-center">
              <p className="absolute transform bg-[var(--page-bg)] px-2 -translate-y-1/2 top-1/2 text-xs font-bold text-[var(--text-tertiary)]" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>
                or
              </p>
              <Separator
                orientation="horizontal"
                className="border-[var(--border-color)] border-[1px] w-full"
              />
            </div>
            <ActiveTrigger
              type={data.data.trigger[1].type}
              keywords={data.data.keywords}
            />
          </>
        )}

        {!data.data.listener && <ThenActions id={id} />}
      </div>
    );
  }

  return (
    <TriggerButton label="Add Trigger">
      <div className="flex flex-col gap-y-4 text-[var(--text-primary)] w-full">
        {AUTOMATION_TRIGGERS.map((trigger) => {
          const isSelected = !!types?.find((t) => t === trigger.type);
          return (
            <div
              key={trigger.id}
              onClick={() => onSetTrigger(trigger.type)}
              className={cn(
                "rounded-none flex cursor-pointer flex-col p-5 gap-y-1.5 transition-smooth border",
                !isSelected
                  ? "bg-[var(--card-bg)] border-[var(--border-color)] text-[var(--text-primary)] hover:border-[var(--text-secondary)]"
                  : "bg-[var(--accent-whisper)] border-[var(--accent-magenta)] text-[var(--text-primary)] font-medium shadow-sm"
              )}
            >
              <div className="flex gap-x-2.5 items-center">
                <span className={cn(
                  "p-1.5 rounded-none shrink-0 border",
                  !isSelected 
                    ? "bg-[var(--page-bg)] border-[var(--border-color)] text-[var(--text-secondary)]" 
                    : "bg-[var(--accent-magenta)] border-[var(--accent-magenta)] text-white"
                )}>
                  {trigger.icon}
                </span>
                <p className="font-bold text-sm tracking-tight" style={{ fontFamily: "var(--font-cormorant), serif" }}>{trigger.label}</p>
              </div>
              <p className={cn(
                "text-xs leading-relaxed",
                !isSelected ? "text-[var(--text-secondary)]" : "text-[var(--text-secondary)]"
              )}>
                {trigger.description}
              </p>
            </div>
          );
        })}
        <Keywords id={id} />
        <Button
          onClick={onSaveTrigger}
          disabled={types?.length === 0}
          className="bg-[var(--primary)] hover:bg-[var(--accent-magenta)] hover:text-white text-[var(--primary-foreground)] rounded-none font-bold py-5 tracking-wider uppercase text-[10px] transition-smooth active:scale-[0.98] disabled:opacity-50 shadow-sm border border-[var(--border-color)]"
          style={{ fontFamily: "var(--font-space-grotesk), monospace" }}
        >
          <Loader state={isPending}>Create Trigger</Loader>
        </Button>
      </div>
    </TriggerButton>
  );
}

export default Trigger;
