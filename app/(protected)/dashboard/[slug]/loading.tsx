import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-y-10 pb-12 pr-2 lg:pr-6">
      {/* Welcome & Overview Header Skeleton */}
      <div className="flex flex-col gap-y-2 mt-4">
        <Skeleton className="w-24 h-6 rounded-full" />
        <Skeleton className="w-64 md:w-96 h-10 rounded-md" />
        <Skeleton className="w-full max-w-[65ch] h-4 rounded-md" />
      </div>

      {/* Quick Action Navigation Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6 h-32 ${
              i === 1 ? "md:col-span-2" : i === 2 ? "md:col-span-1" : "md:col-span-3"
            }`}
          >
            <div className="flex flex-col justify-between h-full">
              <Skeleton className="w-32 h-6 rounded-md" />
              <Skeleton className="w-48 h-4 rounded-md" />
            </div>
          </div>
        ))}
      </div>

      {/* Analytics & Metrics Hub Skeleton */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Interactive Graph Panel Skeleton */}
        <div className="xl:col-span-7 border border-[var(--border-color)] bg-[var(--card-bg)] rounded-xl p-6 h-[400px] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-lg" />
              <div>
                <Skeleton className="w-32 h-5 mb-1 rounded-md" />
                <Skeleton className="w-48 h-3 rounded-md" />
              </div>
            </div>
            <Skeleton className="w-32 h-8 rounded-lg" />
          </div>
          <Skeleton className="w-full h-full rounded-lg" />
        </div>

        {/* 4 KPI Metric Cards Skeleton */}
        <div className="xl:col-span-5 h-[400px]">
          <Skeleton className="w-full h-full rounded-xl" />
        </div>
      </div>

      {/* Live Timeline & AI Intelligence Hub Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Live Interaction Timeline Skeleton */}
        <div className="lg:col-span-7 border border-[var(--border-color)] bg-[var(--card-bg)] rounded-xl p-6 min-h-[300px]">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-lg" />
              <Skeleton className="w-40 h-5 rounded-md" />
            </div>
            <Skeleton className="w-20 h-4 rounded-md" />
          </div>
          <div className="space-y-6 pl-4 border-l border-[var(--border-color)] ml-3 mt-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col gap-2 relative">
                <Skeleton className="w-6 h-6 rounded-lg absolute -left-[28px] top-0" />
                <div className="flex justify-between pl-4">
                  <Skeleton className="w-24 h-4 rounded-md" />
                  <Skeleton className="w-16 h-3 rounded-md" />
                </div>
                <Skeleton className="w-48 h-3 rounded-md pl-4 mt-1" />
              </div>
            ))}
          </div>
        </div>

        {/* Smart AI / Phase AI Status Panel Skeleton */}
        <div className="lg:col-span-5 border border-[var(--border-color)] bg-[var(--card-bg)] rounded-xl p-6 min-h-[300px] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Skeleton className="w-10 h-10 rounded-lg" />
              <Skeleton className="w-40 h-5 rounded-md" />
            </div>
            <Skeleton className="w-full h-10 rounded-md mb-6" />
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex justify-between border-b border-[var(--border-color)] pb-2.5">
                  <Skeleton className="w-24 h-4 rounded-md" />
                  <Skeleton className="w-16 h-4 rounded-md" />
                </div>
              ))}
            </div>
          </div>
          <Skeleton className="w-full h-12 rounded-lg mt-8" />
        </div>
      </div>
    </div>
  );
}
