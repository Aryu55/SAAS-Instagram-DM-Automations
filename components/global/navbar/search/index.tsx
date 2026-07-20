import { Input } from "@/components/ui/input";
import { SearchIcon } from "lucide-react";
import React from "react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

type Props = {};

function Search({}: Props) {
  return (
    <div className="flex overflow-hidden gap-x-2 border border-[var(--border-color)] bg-[var(--card-bg)]/50 rounded-xl px-4 py-2 items-center flex-1 max-w-md transition-smooth focus-within:border-[var(--accent-magenta)]/40 focus-within:bg-[var(--card-bg)]">
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-pointer text-[var(--text-tertiary)] hover:text-[var(--accent-magenta)] transition-colors duration-150">
            <SearchIcon className="w-4 h-4" />
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs rounded-lg shadow-xl px-2.5 py-1.5">
          Search automations
        </TooltipContent>
      </Tooltip>
      <Input
        placeholder="Search by name, email or status..."
        className="border-none bg-transparent outline-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 flex-1 p-0 h-auto text-xs text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
      />
    </div>
  );
}

export default Search;
