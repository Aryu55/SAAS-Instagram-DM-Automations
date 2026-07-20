"use client";

import { Separator } from "@/components/ui/separator";
import { useQueryAutomations } from "@/hooks/user-queries";
import { InstagramBlue, Warning } from "@/icons";
import Image from "next/image";

type Props = {
  id: string;
};

function PostNode({ id }: Props) {
  const { data, isPending } = useQueryAutomations(id);

  if (isPending) return null;

  return (
    data?.data &&
    data.data.posts.length > 0 && (
      <div className="w-full lg:w-10/12 relative xl:w-7/12 p-[1px] bg-[var(--page-bg)] border border-[var(--border-color)] rounded-none shadow-sm">
        {/* Node Connector Line */}
        <div className="absolute h-16 left-1/2 bottom-full flex flex-col items-center z-10">
          <span className="h-[7px] w-[7px] bg-[var(--accent-magenta)] rounded-full" />
          <Separator
            orientation="vertical"
            className="bottom-full flex-1 border-[1px] border-[var(--border-color)]"
          />
          <span className="h-[7px] w-[7px] bg-[var(--accent-magenta)] rounded-full" />
        </div>

        <div className="glass-card p-8 rounded-none flex flex-col gap-y-4 relative bg-[var(--card-bg)]">
          <div className="flex gap-x-2 items-center text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>
            <span className="p-1 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-emerald-400 shrink-0 flex items-center justify-center">
              <Warning />
            </span>
            <span>If they comment on...</span>
          </div>

          <div className="bg-[var(--page-bg)] border border-[var(--border-color)] p-5 rounded-none flex flex-col gap-y-3">
            <div className="flex gap-x-3 items-center">
              <span className="p-2 bg-[var(--accent-whisper)] rounded-none text-[var(--accent-magenta)] border border-[var(--accent-veil)] shrink-0 flex items-center justify-center">
                <InstagramBlue />
              </span>
              <p className="font-bold text-[var(--text-primary)] tracking-tight">Selected Posts</p>
            </div>
            
            <div className="flex gap-3 flex-wrap mt-2">
              {data.data.posts.map((post) => (
                <div
                  key={post.id}
                  className="relative w-[120px] aspect-square rounded-none cursor-pointer overflow-hidden border border-[var(--border-color)] hover:border-[var(--accent-magenta)] hover:scale-105 transition-smooth shadow-inner shadow-black/10"
                >
                  <Image fill sizes="100vw" src={post.media} alt="Instagram Post Thumbnail" className="object-cover" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  );
}

export default PostNode;
