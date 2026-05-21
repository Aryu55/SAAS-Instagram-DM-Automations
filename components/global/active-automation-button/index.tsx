"use client";

import { activateAutomation } from "@/actions/automation";
import { Button } from "@/components/ui/button";
import { useMutationData } from "@/hooks/use-mutation-data";
import { useQueryAutomations } from "@/hooks/user-queries";
import { ActiveAutomation } from "@/icons/active-automation";
import { Loader2 } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

type Props = {
  id: string;
};

function ActiveAutomationButton({ id }: Props) {
  const { data, isPending: isQueryPending } = useQueryAutomations(id);
  const { isPending, mutate } = useMutationData(
    ["activate"],
    (data: { status: boolean }) => activateAutomation(id, data.status),
    "automation-info"
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          disabled={isPending || isQueryPending}
          onClick={() => mutate({ status: !data?.data?.active })}
          className="lg:px-10 bg-gradient-to-br hover:opacity-80 text-white rounded-full from-[#3352CC] font-medium to-[#1C2D70] ml-4"
        >
          {isPending || isQueryPending ? <Loader2 className="animate-spin" /> : <ActiveAutomation />}
          <p className="lg:inline hidden">
            {data?.data?.active ? "Deactivate" : "Activate"}
          </p>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="bg-[#1a1a1a] border border-white/10 text-white text-xs">
        {data?.data?.active ? "Deactivate this automation" : "Activate this automation"}
      </TooltipContent>
    </Tooltip>
  );
}

export default ActiveAutomationButton;

