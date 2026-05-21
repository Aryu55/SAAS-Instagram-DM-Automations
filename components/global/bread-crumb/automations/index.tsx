"use client";

import { Input } from "@/components/ui/input";
import { useEditAutomation } from "@/hooks/use-automation";
import { useMutationDataState } from "@/hooks/use-mutation-data";
import { useQueryAutomations } from "@/hooks/user-queries";
import { ChevronRight, PencilIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import ActiveAutomationButton from "../../active-automation-button";
import Link from "next/link";
import { useParams } from "next/navigation";

type Props = {
  id: string;
};

function AutomationBreadCrumb({ id }: Props) {
  const { data } = useQueryAutomations(id);
  const { slug } = useParams();

  const { edit, enableEdit, disableEdit, inputRef, isPending } =
    useEditAutomation(id);

  const { latestVariable } = useMutationDataState(["update-automation"]);

  return (
    <div className="rounded-full w-full p-5 bg-[#18181B1A] flex items-center">
      <div className="flex items-center gap-x-3">
        <Link
          href={`/dashboard/${slug}/automation`}
          className="text-[#9B9CA0] hover:text-white transition-colors duration-200 truncate"
        >
          Automation
        </Link>
        <ChevronRight className="flex-shrink-0" color="#9B9CA0" />
        <span className="flex gap-x-3 items-center">
          {edit ? (
            <Input
              ref={inputRef}
              placeholder={
                isPending ? latestVariable.variables : "Add a new Name"
              }
              className="bg-transparent h-auto outline-none text-base border-none p-0"
            />
          ) : data?.data?.name || latestVariable?.variables?.name ? (
            <p className="text-[#9B9CA0]">
              {latestVariable?.variables
                ? latestVariable?.variables.name
                : data?.data?.name}
            </p>
          ) : (
            <Skeleton className="h-5 w-32 bg-white/[0.06]" />
          )}
          {edit ? (
            <></>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className="cursor-pointer hover:opacity-75 duration-100 transition flex-shrink-0 mr-4"
                  onClick={enableEdit}
                >
                  <PencilIcon size={14} />
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-[#1a1a1a] border border-white/10 text-white text-xs">
                Rename this automation
              </TooltipContent>
            </Tooltip>
          )}
        </span>
      </div>
      <div className="flex gap-x-5 ml-auto">
        <p className="text-text-secondary/60 text-sm">
          All pages are automatically Saved
        </p>
        <div className="flex gap-x-5">
          <p className="text-text-secondary text-sm">Changes Saved</p>
          <p className="text-text-secondary text-sm">Undo | Redo</p>
        </div>
      </div>
      <ActiveAutomationButton id={id} />
    </div>
  );
}

export default AutomationBreadCrumb;
