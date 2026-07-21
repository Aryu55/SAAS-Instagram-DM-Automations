import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-background p-8">
      {/* Header Skeleton */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <Skeleton className="w-2 h-2 rounded-full" />
          <Skeleton className="w-48 h-4 rounded-md" />
        </div>
        <Skeleton className="w-64 h-10 rounded-md mb-2" />
        <Skeleton className="w-96 h-4 rounded-md" />
      </div>

      {/* Organization Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <Skeleton className="w-32 h-6 rounded-md mb-2" />
                <Skeleton className="w-48 h-4 rounded-md" />
              </div>
              <Skeleton className="w-16 h-6 rounded-full" />
            </div>

            {/* Stats Row Skeleton */}
            <div className="flex gap-6 mt-4 pt-4 border-t border-[var(--border-color)]">
              {[1, 2, 3].map((stat) => (
                <div key={stat}>
                  <Skeleton className="w-8 h-8 rounded-md mb-1" />
                  <Skeleton className="w-16 h-3 rounded-md" />
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Create New Org Card Skeleton */}
        <div className="rounded-2xl border-2 border-dashed border-[var(--border-color)] p-6 flex flex-col items-center justify-center min-h-[200px]">
          <Skeleton className="w-12 h-12 rounded-full mb-3" />
          <Skeleton className="w-32 h-4 rounded-md" />
        </div>
      </div>
    </div>
  );
}
