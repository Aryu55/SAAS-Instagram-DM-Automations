"use client";

import { onOathInstagram, onIntegrateManual, onDisconnectIntegration } from "@/actions/integration";
import { onUserInfo } from "@/actions/user";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import { toast } from "sonner";
import { Key, ArrowRight, ShieldCheck, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

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
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const queryClient = useQueryClient();
  const router = useRouter();

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      const res = await onDisconnectIntegration();
      if (res.status === 200) {
        toast.success("Successfully disconnected Instagram account!");
        queryClient.invalidateQueries({ queryKey: ["user-profile"] });
        queryClient.invalidateQueries({ queryKey: ["instagram-media"] });
        router.refresh();
      } else {
        toast.error(res.data || "Failed to disconnect integration");
      }
    } catch (err: any) {
      toast.error("An error occurred during disconnection");
    } finally {
      setIsDisconnecting(false);
    }
  };

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
        queryClient.invalidateQueries({ queryKey: ["instagram-media"] });
        router.refresh();
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
    <div className="glass-card border border-[var(--border-color)] rounded-xl p-6 flex flex-col gap-y-6 transition-smooth shadow-sm text-[var(--text-primary)] bg-[var(--card-bg)]">
      <div className="flex items-center justify-between gap-x-5">
        <span className="p-3 bg-[var(--accent-whisper)] rounded-lg text-[var(--accent-magenta)] border border-[var(--accent-veil)] shrink-0">
          {icon}
        </span>
        <div className="flex flex-col flex-1">
          <div className="flex items-center gap-x-2">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] tracking-tight" style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>{title}</h3>
            {integrated && (
              <span className="inline-flex items-center gap-x-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 uppercase tracking-wider" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>
                <ShieldCheck className="w-3 h-3" /> Connected
              </span>
            )}
          </div>
          <p className="text-[var(--text-secondary)] text-xs mt-1 leading-relaxed">{description}</p>
        </div>
        {!integrated && !showOptions && (
          <Button
            onClick={() => setShowOptions(true)}
            className="rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--accent-magenta)] hover:text-white font-bold text-[10px] uppercase tracking-wider px-5 py-3 transition-smooth shadow-sm"
            style={{ fontFamily: "var(--font-space-grotesk), monospace" }}
          >
            Connect
          </Button>
        )}
        {integrated && (
          <div className="flex items-center gap-x-3">
            <span className="hidden sm:inline-flex px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-[9px] uppercase tracking-wider" style={{ fontFamily: "var(--font-space-grotesk), monospace" }}>
              Active
            </span>
            <Button
              onClick={handleDisconnect}
              disabled={isDisconnecting}
              className="rounded-lg bg-transparent hover:bg-red-500/10 border border-red-500/30 text-red-500 hover:text-red-400 font-bold text-[9px] uppercase tracking-wider px-4 py-2 transition duration-200"
              style={{ fontFamily: "var(--font-space-grotesk), monospace" }}
            >
              Disconnect
            </Button>
          </div>
        )}
      </div>

      {showOptions && !integrated && (
        <div className="border-t border-[var(--border-color)] pt-6 flex flex-col gap-y-5 animate-fade-in-up">
          <h4 className="text-sm font-semibold text-[var(--text-primary)]" style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>Choose Connection Method</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Method A: Automatic OAuth */}
            <div className="p-5 rounded-xl border border-[var(--border-color)] bg-[var(--page-bg)] hover:bg-[var(--accent-whisper)] flex flex-col justify-between gap-y-4 transition-colors">
              <div>
                <h5 className="text-sm font-medium text-[var(--text-primary)]">Method A: Facebook Login (Automatic)</h5>
                <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                  Connect via Facebook Login. Your Instagram must be a Business/Creator account linked to a Facebook Page.
                </p>
              </div>
              <Button
                onClick={onInstOAuth}
                className="w-full justify-between rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--accent-magenta)] hover:text-white font-bold text-[9px] uppercase tracking-wider py-2 px-3 transition-colors"
                style={{ fontFamily: "var(--font-space-grotesk), monospace" }}
              >
                <span>Authorize Instantly</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>

            {/* Method B: Manual Token */}
            <div className="p-5 rounded-xl border border-[var(--border-color)] bg-[var(--page-bg)] hover:bg-[var(--accent-whisper)] flex flex-col justify-between gap-y-4 transition-colors">
              <div>
                <h5 className="text-sm font-medium text-[var(--text-primary)]">Method B: Paste Access Token (Manual)</h5>
                <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                  Avoid Facebook login popup sandbox errors. Direct entry for developer access tokens.
                </p>
              </div>
              <form onSubmit={handleManualSubmit} className="flex gap-x-2">
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[var(--text-tertiary)]">
                    <Key className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="password"
                    placeholder="IGAA..."
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-primary)] outline-none focus:border-[var(--accent-magenta)] transition-colors placeholder:text-[var(--text-tertiary)]"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--accent-magenta)] hover:text-white font-bold text-[9px] uppercase tracking-wider px-4"
                  style={{ fontFamily: "var(--font-space-grotesk), monospace" }}
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
              className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
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
