import { Input } from "@/components/ui/input";
import { SearchIcon } from "lucide-react";
import React from "react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

type Props = {};

function Search({}: Props) {
  return (
    <div className="flex overflow-hidden gap-x-2 border-[1px] border-[#3352CC] rounded-full px-4 py-1 items-center flex-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-pointer">
            <SearchIcon color="#3352CC" />
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="bg-[#1a1a1a] border border-white/10 text-white text-xs">
          Search automations
        </TooltipContent>
      </Tooltip>
      <Input
        placeholder="Search by name, email or status"
        className="border-none outline-none ring-0 focus:ring-0 flex-1"
      />
    </div>
  );
}

export default Search;
