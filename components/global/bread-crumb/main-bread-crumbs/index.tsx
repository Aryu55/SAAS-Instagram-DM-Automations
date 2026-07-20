import { PAGE_ICONS } from "@/constants/pages";
import React from "react";

type Props = {
  page: string;
  slug: string;
};

function MainBreadCrumbs({ page, slug }: Props) {
  return (
    <div className="flex flex-col items-start mt-2 mb-4 animate-fade-in-up">
      {page === "Home" ? (
        <div className="flex flex-col items-start gap-y-1">
          <p className="text-[var(--muted-foreground)] text-[10px] uppercase tracking-wider font-bold" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>
            Welcome back, {slug}
          </p>
        </div>
      ) : (
        <span className="inline-flex gap-x-2.5 items-center">
          <span className="text-[var(--accent-magenta)] flex-shrink-0">
            {PAGE_ICONS[page.toUpperCase()]}
          </span>
          <h2 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight" style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>
            {page}
          </h2>
        </span>
      )}
    </div>
  );
}

export default MainBreadCrumbs;
