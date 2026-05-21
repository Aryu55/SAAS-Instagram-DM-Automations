"use client";

import { onOathInstagram, onIntegrateManual } from "@/actions/integration";
import { onUserInfo } from "@/actions/user";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import { toast } from "sonner";
import { Key, ArrowRight, ShieldCheck, Loader2 } from "lucide-react";

type Props = {
  title: string;
  description: string;
  icon: React.ReactNode;
  strategy: "INSTAGRAM" | "CRM";
};

function IntegrationCard({ title, description, icon, strategy }: Props) {
  const [showOptions, setShowOptions] = useState(false);
  const [tokenInput, setTokenInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const onInstOAuth = async () => {
    try {
      await onOathInstagram(strategy);
    } catch (err: any) {
      toast.error("OAuth initiation failed");
    }
  };

  const { data } = useQuery({
    queryKey: ["user-profile"],
    queryFn: onUserInfo,
  });

  const integrated = data?.data?.integrations.find((i) => i.name === strategy);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) {
      toast.error("Please enter a valid token");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await onIntegrateManual(tokenInput.trim());
      if (res.status === 200) {
        toast.success("Successfully connected to Instagram!");
        setTokenInput("");
        setShowOptions(false);
        queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      } else {
        toast.error(res.error || "Failed to connect using token");
      }
    } catch (err: any) {
      toast.error("An error occurred during verification");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-card border border-white/[0.08] rounded-2xl p-6 flex flex-col gap-y-6 transition-all duration-300 hover:border-white/[0.12] shadow-xl">
      <div className="flex items-center justify-between gap-x-5">
        <span className="p-3 bg-blue-500/10 rounded-xl text-blue-400 shrink-0">
          {icon}
        </span>
        <div className="flex flex-col flex-1">
          <div className="flex items-center gap-x-2">
            <h3 className="text-lg font-semibold text-white tracking-tight">{title}</h3>
            {integrated && (
              <span className="inline-flex items-center gap-x-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <ShieldCheck className="w-3 h-3" /> Connected
              </span>
            )}
          </div>
          <p className="text-text-secondary text-sm mt-1 leading-relaxed">{description}</p>
        </div>
        {!integrated && !showOptions && (
          <Button
            onClick={() => setShowOptions(true)}
            className="rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-lg shadow-blue-500/20 transition-all duration-300"
          >
            Connect
          </Button>
        )}
        {integrated && (
          <Button
            disabled
            className="rounded-xl bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 font-medium cursor-not-allowed"
          >
            Active
          </Button>
        )}
      </div>

      {showOptions && !integrated && (
        <div className="border-t border-white/[0.06] pt-6 flex flex-col gap-y-5 animate-fade-in-up">
          <h4 className="text-sm font-semibold text-white">Choose Connection Method</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Method A: Automatic OAuth */}
            <div className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.01] hover:bg-white/[0.02] flex flex-col justify-between gap-y-4 transition-colors">
              <div>
                <h5 className="text-sm font-medium text-white">Method A: OAuth login (Automatic)</h5>
                <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                  Log in directly using your Facebook/Instagram developer account credentials.
                </p>
              </div>
              <Button
                onClick={onInstOAuth}
                className="w-full justify-between rounded-lg bg-white text-black hover:bg-gray-100 font-medium text-xs py-2 px-3 transition-colors"
              >
                <span>Authorize Instantly</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>

            {/* Method B: Manual Token */}
            <div className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.01] hover:bg-white/[0.02] flex flex-col justify-between gap-y-4 transition-colors">
              <div>
                <h5 className="text-sm font-medium text-white">Method B: Paste Access Token (Manual)</h5>
                <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                  Avoid Facebook login popup sandbox errors. Direct entry for developer access tokens.
                </p>
              </div>
              <form onSubmit={handleManualSubmit} className="flex gap-x-2">
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-text-secondary">
                    <Key className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="password"
                    placeholder="IGAA..."
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-white/[0.08] bg-[#141416] text-white outline-none focus:border-blue-500 transition-colors placeholder:text-neutral-600"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-blue-600 hover:bg-blue-500 font-medium text-xs px-4"
                >
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Verify"}
                </Button>
              </form>
            </div>
          </div>

          <div className="flex justify-end mt-2">
            <Button
              variant="ghost"
              onClick={() => setShowOptions(false)}
              className="text-xs text-[#9B9CA0] hover:text-white"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default IntegrationCard;
