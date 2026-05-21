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
    <div className="flex flex-col gap-y-8 p-6 max-w-2xl">
      {/* Account Info */}
      <div className="rounded-xl border border-[#333] bg-[#1a1a1a] p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Account</h2>
        <div className="flex items-center gap-x-3">
          <span className="text-sm text-[#9B9CA0]">Current Plan</span>
          <span className="rounded-full bg-gradient-to-r from-[#6d60a3] to-[#9434E6] px-3 py-0.5 text-xs font-medium text-white">
            PRO
          </span>
        </div>
        <p className="mt-3 text-sm text-[#9B9CA0]">
          You have full access to all features.
        </p>
      </div>

      {/* Logout */}
      <div className="rounded-xl border border-[#333] bg-[#1a1a1a] p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Session</h2>
        <button
          onClick={handleLogout}
          className="rounded-lg bg-red-600 hover:bg-red-700 transition-colors px-5 py-2 text-sm font-medium text-white"
        >
          Log out
        </button>
      </div>
    </div>
  );
}
