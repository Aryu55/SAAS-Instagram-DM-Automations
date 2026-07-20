import AutomationList from "@/components/global/automation-list";
import CreateAutomation from "@/components/global/create-automation";
import { Check } from "lucide-react";

type Props = {};

function Page({}: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-6 gap-6 pr-2 lg:pr-6">
      <div className="lg:col-span-4">
        <AutomationList />
      </div>
      <div className="lg:col-span-2">
        <div className="flex flex-col rounded-xl bg-[var(--card-bg)] gap-y-6 p-6 border border-[var(--border-color)] overflow-hidden shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]" style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>
              Active Automations
            </h2>
            <p className="text-[var(--text-secondary)] text-xs mt-1 font-medium">
              Your currently running workflows will show here.
            </p>
          </div>
          <div className="flex flex-col gap-y-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex items-start justify-between pb-3 border-b border-[var(--border-color)] last:border-0 last:pb-0">
                <div className="flex flex-col">
                  <h3 className="font-bold text-sm text-[var(--text-primary)]">
                    Direct traffic towards website
                  </h3>
                  <p className="text-[var(--text-tertiary)] text-[10px] uppercase font-bold tracking-wider mt-0.5" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>
                    Oct 5, 2024
                  </p>
                </div>
                <Check className="text-[var(--accent-magenta)] w-4 h-4 shrink-0 mt-0.5" />
              </div>
            ))}
          </div>
          <CreateAutomation />
        </div>
      </div>
    </div>
  );
}

export default Page;

//04.06
