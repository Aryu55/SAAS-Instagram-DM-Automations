"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/sign-in");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="flex flex-col gap-y-8 p-6 max-w-2xl text-[var(--text-primary)]">
      {/* Account Info */}
      <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4" style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>
          Account
        </h2>
        <div className="flex items-center gap-x-3">
          <span className="text-sm text-[var(--text-secondary)]">Current Plan</span>
          <span className="rounded-full bg-[var(--accent-whisper)] border border-[var(--accent-veil)] px-3 py-0.5 text-xs font-bold text-[var(--accent-magenta)] uppercase tracking-wider" style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>
            PRO
          </span>
        </div>
        <p className="mt-3 text-sm text-[var(--text-secondary)]">
          You have full access to all features.
        </p>
      </div>

      {/* Logout */}
      <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4" style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>
          Session
        </h2>
        <button
          onClick={handleLogout}
          className="rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--accent-magenta)] hover:text-white transition-smooth px-5 py-2.5 text-xs font-bold uppercase tracking-wider shadow-sm"
          style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
        >
          Log out
        </button>
      </div>
    </div>
  );
}
