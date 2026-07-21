"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignUpPage() {
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    console.log("📝 [Janus Auth] Initiating account registration for:", email, `${firstname} ${lastname}`);

    try {
      console.log("📡 [Janus Auth] Sending POST /api/auth/signup...");
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, firstname, lastname }),
      });

      const data = await res.json();
      console.log("📥 [Janus Auth] Signup response status:", res.status, "payload:", data);

      if (!res.ok) {
        console.warn("⚠️ [Janus Auth] Signup failed:", data.error || "Signup failed");
        setError(data.error || "Signup failed");
        setLoading(false);
        return;
      }

      console.log("🎉 [Janus Auth] Account created successfully for", firstname);
      console.log("🚀 [Janus Auth] Navigating to /dashboard...");
      window.location.href = "/dashboard";
    } catch (err: any) {
      console.error("💥 [Janus Auth] Network error during signup:", err.message);
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="rounded-2xl border border-[#333] bg-[#1a1a1a] p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Create Janus AI Account</h1>
          <p className="text-[#9B9CA0] text-sm">Get started with your Janus AI workspace</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="firstname" className="block text-sm font-medium text-[#9B9CA0] mb-1.5">First Name</label>
              <input id="firstname" type="text" value={firstname} onChange={(e) => setFirstname(e.target.value)} required
                className="w-full rounded-xl border border-[#333] bg-[#252525] px-4 py-3 text-white placeholder-[#555] outline-none focus:border-[#6C6C6C] focus:ring-1 focus:ring-[#6C6C6C] transition-colors" placeholder="John" />
            </div>
            <div>
              <label htmlFor="lastname" className="block text-sm font-medium text-[#9B9CA0] mb-1.5">Last Name</label>
              <input id="lastname" type="text" value={lastname} onChange={(e) => setLastname(e.target.value)} required
                className="w-full rounded-xl border border-[#333] bg-[#252525] px-4 py-3 text-white placeholder-[#555] outline-none focus:border-[#6C6C6C] focus:ring-1 focus:ring-[#6C6C6C] transition-colors" placeholder="Doe" />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[#9B9CA0] mb-1.5">Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full rounded-xl border border-[#333] bg-[#252525] px-4 py-3 text-white placeholder-[#555] outline-none focus:border-[#6C6C6C] focus:ring-1 focus:ring-[#6C6C6C] transition-colors" placeholder="you@example.com" />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[#9B9CA0] mb-1.5">Password</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
              className="w-full rounded-xl border border-[#333] bg-[#252525] px-4 py-3 text-white placeholder-[#555] outline-none focus:border-[#6C6C6C] focus:ring-1 focus:ring-[#6C6C6C] transition-colors" placeholder="••••••••" />
          </div>

          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-red-400 text-sm">{error}</div>
          )}

          <button type="submit" disabled={loading}
            className="w-full rounded-xl bg-white text-black font-semibold py-3 hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#9B9CA0]">
          Already have an account?{" "}
          <Link href="/sign-in" className="text-white font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
