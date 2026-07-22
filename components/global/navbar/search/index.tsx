import { Input } from "@/components/ui/input";
import { SearchIcon } from "lucide-react";
import React from "react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

type Props = {};

function Search({}: Props) {
  return (
    <div className="flex overflow-hidden gap-x-2 border border-slate-200/90 dark:border-zinc-800/80 bg-slate-100/70 dark:bg-zinc-900/70 rounded-xl px-3.5 py-1.5 items-center flex-1 max-w-md transition-all duration-150 focus-within:border-violet-500/50 focus-within:bg-white dark:focus-within:bg-zinc-900 focus-within:ring-2 focus-within:ring-violet-500/10 shadow-xs">
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-pointer text-slate-400 dark:text-zinc-500 hover:text-violet-600 dark:hover:text-violet-400 transition-colors duration-150">
            <SearchIcon className="w-4 h-4" />
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs rounded-lg shadow-xl px-2.5 py-1.5">
          Search automations
        </TooltipContent>
      </Tooltip>
      <Input
        placeholder="Search by name, email or status..."
        className="border-none bg-transparent outline-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 flex-1 p-0 h-auto text-xs text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 font-medium"
      />
    </div>
  );
}

export default Search;
