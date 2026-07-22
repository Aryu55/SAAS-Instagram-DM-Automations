"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, LayoutDashboard } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log full error details directly into the browser DevTools console
    console.error("════════════════════════════════════════════════════════════");
    console.error("🚨 [JANUS AI GLOBAL ERROR TRACE]");
    console.error("Error Message:", error.message);
    console.error("Error Digest:", error.digest);
    console.error("Error Stack:", error.stack);
    console.error("════════════════════════════════════════════════════════════");
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0d0d12] text-white flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full rounded-2xl border border-white/10 bg-[#161622] p-8 shadow-2xl text-center space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Janus AI Application Notice</h1>
            <p className="text-xs text-zinc-400 leading-relaxed">
              {error?.message || "A temporary workspace session issue occurred."}
            </p>
            {error?.digest && (
              <p className="text-[10px] font-mono text-zinc-500 bg-black/40 p-2 rounded-lg border border-white/5">
                Error Digest: {error.digest}
              </p>
            )}
          </div>

          <div className="pt-2 flex flex-col gap-3">
            <button
              onClick={() => reset()}
              className="w-full flex items-center justify-center gap-x-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl py-3 text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-all shadow-md"
            >
              <RefreshCw className="w-4 h-4" />
              Reload Workspace
            </button>

            <Link
              href="/dashboard/courses"
              className="w-full flex items-center justify-center gap-x-2 bg-white/5 border border-white/10 text-zinc-300 rounded-xl py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-white/10 transition-all"
            >
              <LayoutDashboard className="w-4 h-4" />
              Go to Courses Workspace
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
