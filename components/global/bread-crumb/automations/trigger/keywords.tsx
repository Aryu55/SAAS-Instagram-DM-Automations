"use client";

import { Input } from "@/components/ui/input";
import { useKeywords } from "@/hooks/use-automation";
import { useMutationDataState } from "@/hooks/use-mutation-data";
import { useQueryAutomations } from "@/hooks/user-queries";
import { X } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

type Props = {
  id: string;
};

function Keywords({ id }: Props) {
  const { deleteMutation, keywords, onKeyPress, onValueChange } =
    useKeywords(id);

  const { latestVariable: addKeywordVar } = useMutationDataState(["add-keywords"]);
  const { latestVariable: deleteKeywordVar } = useMutationDataState(["delete-keywords"]);
  const { data } = useQueryAutomations(id);

  return (
    <div className="bg-background-80 flex flex-col gap-y-3 p-3 rounded-xl">
      <p className="text-sm text-text-secondary">
        Add words that trigger automation
      </p>
      <div className="flex flex-wrap justify-start gap-2 items-center">
        {data?.data?.keywords &&
          data.data.keywords.length > 0 &&
          data.data.keywords.map(
            (keyword) => {
              const isDeleted =
                deleteKeywordVar &&
                deleteKeywordVar.status === "pending" &&
                deleteKeywordVar.variables?.id === keyword.id;
              if (isDeleted) return null;

              return (
                <div
                  key={keyword.id}
                  className="bg-background-90 flex items-center gap-x-2 capitalize text-text-secondary py-1 px-4 rounded-full"
                >
                  <p>{keyword.word}</p>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex cursor-pointer">
                        <X
                          size={20}
                          className="hover:text-white transition duration-100"
                          onClick={() => deleteMutation({ id: keyword.id })}
                        />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-[#1a1a1a] border border-white/10 text-white text-xs">
                      Remove keyword
                    </TooltipContent>
                  </Tooltip>
                </div>
              );
            }
          )}
        {addKeywordVar &&
          addKeywordVar.status === "pending" &&
          addKeywordVar.variables?.keywords && (
            <div className="bg-background-90 flex items-center gap-x-2 capitalize text-text-secondary py-1 px-4 rounded-full opacity-50">
              {addKeywordVar.variables.keywords}
            </div>
          )}
        <Input
          placeholder="Add Keyword..."
          /* style={{
            width: Math.min(Math.max(keywords.length || 10, 2), 50) + "ch",
          }} */
          value={keywords}
          className="p-0 bg-transparent ring-0 border-none outline-none"
          onChange={onValueChange}
          onKeyUp={onKeyPress}
        />
      </div>
    </div>
  );
}

export default Keywords;

