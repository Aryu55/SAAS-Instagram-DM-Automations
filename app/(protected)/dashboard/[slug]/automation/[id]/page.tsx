import AutomationBreadCrumb from "@/components/global/bread-crumb/automations";
import PostNode from "@/components/global/bread-crumb/automations/post/node";
import ThenNode from "@/components/global/bread-crumb/automations/then/node";
import Trigger from "@/components/global/bread-crumb/automations/trigger";
import { Warning } from "@/icons";

type Props = {
  params: {
    id: string;
  };
};

async function Page({ params }: Props) {
  return (
    <div className="flex flex-col items-center gap-y-16 pb-20 animate-fade-in-up pr-2 lg:pr-6">
      <AutomationBreadCrumb id={params.id} />
      
      {/* Trigger Configuration Node (Outer double-bezel wrapper) */}
      <div className="w-full lg:w-10/12 xl:w-7/12 p-[1px] bg-[var(--page-bg)] border border-[var(--border-color)] rounded-none shadow-sm">
        <div className="glass-card p-8 rounded-none flex flex-col gap-y-4 relative">
          <div className="flex gap-x-2 items-center text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>
            <span className="p-1 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0 flex items-center justify-center">
              <Warning />
            </span>
            <span>When...</span>
          </div>
          <Trigger id={params.id} />
        </div>
      </div>

      <ThenNode id={params.id} />
      <PostNode id={params.id} />
    </div>
  );
}

export default Page;
