"use client";

import React, { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log detailed error info directly into browser console for user inspection
    console.error("══════════════════════════════════════════════════════════");
    console.error(" [JANUS AI DASHBOARD ERROR TRACE]");
    console.error(" Message:", error.message);
    console.error(" Digest:", error.digest);
    console.error(" Stack:", error.stack);
    console.error("══════════════════════════════════════════════════════════");
  }, [error]);

  return (
    <div className="min-h-screen bg-[var(--page-bg)] flex flex-col items-center justify-center p-6 text-[var(--text-primary)] text-center">
      <div className="max-w-md w-full bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-8 shadow-xl space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto text-xl font-bold">
          !
        </div>
        <h2 className="text-xl font-bold font-mono">Dashboard Loading Notice</h2>
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          {error?.message || "A temporary workspace session issue occurred."}
        </p>
        {error?.digest && (
          <p className="text-[10px] font-mono text-[var(--text-tertiary)] bg-[var(--page-bg)] p-2 rounded-lg">
            Error Digest: {error.digest}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="flex-1 bg-[var(--primary)] text-[var(--primary-foreground)] py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-smooth"
          >
            Retry Session
          </button>
          <a
            href="/dashboard/courses"
            className="flex-1 bg-[var(--page-bg)] border border-[var(--border-color)] py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] hover:bg-[var(--card-bg)] transition-smooth flex items-center justify-center"
          >
            Go to Courses
          </a>
        </div>
      </div>
    </div>
  );
}
