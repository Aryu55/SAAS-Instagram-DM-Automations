import React from "react";
import { Brain, Sparkles } from "lucide-react";

export const LogoSmall = () => {
  return (
    <div className="flex items-center gap-x-2.5 select-none">
      {/* Janus AI Glowing Icon Badge */}
      <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 via-indigo-600 to-pink-500 p-[1px] shadow-md shadow-purple-500/20">
        <div className="w-full h-full bg-zinc-950 rounded-[11px] flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/30 to-pink-500/30 opacity-50" />
          <Brain className="w-4 h-4 text-purple-400 relative z-10" />
        </div>
      </div>

      {/* Brand Typography */}
      <div className="flex items-center gap-x-1.5">
        <span
          className="text-xl font-extrabold tracking-tight text-[var(--text-primary)]"
          style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
        >
          Janus
        </span>
        <span
          className="text-[10px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded-md bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm"
          style={{ fontFamily: "var(--font-space-grotesk), monospace" }}
        >
          AI
        </span>
      </div>
    </div>
  );
};
