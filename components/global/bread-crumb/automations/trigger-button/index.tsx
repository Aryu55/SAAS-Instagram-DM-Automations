import PopOver from "@/components/global/popover";
import { BlueAddIcon } from "@/icons";
import React from "react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

type Props = {
  label: string;
  children: React.ReactNode;
};

function TriggerButton({ label, children }: Props) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="w-full">
          <PopOver
            trigger={
              <div className="border-2 border-dashed w-full border-[#3352cc] hover:opacity-80 cursor-pointer transition duration-100 rounded-xl flex gap-x-2 justify-center items-center p-5 mt-4">
                <BlueAddIcon />
                <p className="text-[#767BDD] font-bold">{label}</p>
              </div>
            }
            className="w-[400px]"
          >
            {children}
          </PopOver>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="bg-[#1a1a1a] border border-white/10 text-white text-xs">
        {label === "Attach a Post" ? "Select Instagram posts to monitor" : "Add a trigger event for this automation"}
      </TooltipContent>
    </Tooltip>
  );
}

export default TriggerButton;
