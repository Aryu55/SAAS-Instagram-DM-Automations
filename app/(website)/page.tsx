"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";

// ─── Intersection Observer hook for scroll-triggered reveals ───
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.unobserve(el); } },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transition: `opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

// ─── Main Landing Page ───
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-[#fafafa] selection:bg-violet-900/40 selection:text-violet-100 overflow-x-hidden">

      {/* ═══ Ambient Background Layer ═══ */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-violet-600/[0.04] blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-blue-600/[0.03] blur-[100px]" />
        <div className="absolute top-[40%] left-[60%] w-[300px] h-[300px] rounded-full bg-fuchsia-600/[0.02] blur-[80px]" />
        {/* Grain overlay */}
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
        }} />
      </div>

      {/* ═══ Navigation ═══ */}
      <nav className="relative z-10 flex items-center justify-between px-4 sm:px-8 md:px-12 lg:px-20 py-4 sm:py-6">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center shadow-sm">
            <span className="text-white text-xs sm:text-sm font-bold" style={{ fontFamily: "var(--font-space-grotesk)" }}>J</span>
          </div>
          <span className="text-sm sm:text-[15px] font-semibold tracking-tight" style={{ fontFamily: "var(--font-space-grotesk)" }}>
            Janus AI
          </span>
        </div>
        <Link
          href="/sign-in"
          className="px-4 py-1.5 sm:px-5 sm:py-2 text-xs sm:text-[13px] font-medium text-[#a1a1aa] hover:text-white border border-white/[0.08] hover:border-white/[0.16] rounded-lg transition-all duration-200 hover:bg-white/[0.03]"
        >
          Login
        </Link>
      </nav>

      {/* ═══ Hero Section ═══ */}
      <section className="relative z-10 flex flex-col items-center text-center px-4 sm:px-6 pt-6 sm:pt-12 md:pt-24 pb-10 sm:pb-16 md:pb-20">
        <Reveal>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.06] bg-white/[0.02] mb-4 sm:mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] sm:text-[11px] font-medium text-[#71717a] uppercase tracking-wider">Internal Tool · v2.8</span>
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <h1
            className="text-[clamp(2.125rem,6.5vw,4.75rem)] font-bold leading-[1.08] sm:leading-[1.05] tracking-[-0.03em] max-w-[15ch] mx-auto"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            The AI Content{" "}
            <span className="bg-gradient-to-r from-violet-400 via-blue-400 to-violet-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-[shimmer_4s_ease-in-out_infinite]">
              Factory
            </span>
          </h1>
        </Reveal>

        <Reveal delay={0.16}>
          <p className="mt-4 sm:mt-6 text-[clamp(0.9375rem,2vw,1.2rem)] text-[#71717a] max-w-[42ch] leading-relaxed mx-auto px-2 sm:px-0">
            Script. Voice. Render. Publish.
            <br className="hidden sm:block" />
            Three machines. Zero manual editing. All on autopilot.
          </p>
        </Reveal>

        <Reveal delay={0.24} className="w-full sm:w-auto">
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 w-full max-w-xs sm:max-w-none mx-auto">
            <Link
              href="/dashboard"
              className="group px-7 py-3 bg-white text-[#09090b] text-[14px] font-semibold rounded-lg transition-all duration-200 hover:shadow-[0_0_30px_rgba(139,92,246,0.15)] hover:-translate-y-px flex items-center justify-center gap-2"
            >
              Enter Dashboard
              <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </Link>
            <a
              href="https://mindmaxing.org/lp01"
              target="_blank"
              rel="noopener noreferrer"
              className="px-7 py-3 text-[14px] font-medium text-[#71717a] hover:text-white border border-white/[0.06] hover:border-white/[0.12] rounded-lg transition-all duration-200 text-center"
            >
              About Mindmaxing
            </a>
          </div>
        </Reveal>
      </section>

      {/* ═══ Internal Use Disclaimer ═══ */}
      <Reveal className="relative z-10 flex justify-center px-4 sm:px-6 pb-12 sm:pb-16">
        <div className="inline-flex items-center gap-2.5 px-4 sm:px-5 py-2.5 rounded-xl border border-amber-500/[0.12] bg-amber-500/[0.04] max-w-md text-left sm:text-center">
          <svg className="w-4 h-4 text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v.01M12 12V8m0 12a9 9 0 110-18 9 9 0 010 18z" /></svg>
          <span className="text-[11px] sm:text-[12px] text-amber-200/80 leading-snug">
            This software is for internal use by{" "}
            <a href="https://mindmaxing.org/lp01" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-amber-100 transition-colors font-medium">mindmaxing.org/lp01</a>
            {" "}only. We are not commercializing this product.
          </span>
        </div>
      </Reveal>

      {/* ═══ The Three Machines ═══ */}
      <section className="relative z-10 px-4 sm:px-8 md:px-12 lg:px-20 pb-16 sm:pb-24">
        <Reveal>
          <div className="text-center mb-10 sm:mb-14">
            <span className="text-[10px] sm:text-[11px] font-medium text-violet-400/70 uppercase tracking-[0.15em]">Architecture</span>
            <h2 className="mt-2 text-[clamp(1.35rem,3.5vw,2.25rem)] font-semibold tracking-tight" style={{ fontFamily: "var(--font-space-grotesk)" }}>
              Three Machines. One Pipeline.
            </h2>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 max-w-5xl mx-auto">
          {[
            {
              id: "01",
              name: "Faceless Explainer",
              desc: "AI scripts a 60-second viral reel, generates neural voiceover via Fish Speech, fetches 8 HD B-roll clips from Pexels, and renders with karaoke subtitles.",
              color: "violet",
              gradient: "from-violet-500/10 to-violet-500/[0.02]",
              borderColor: "border-violet-500/[0.08] hover:border-violet-500/20",
              dotColor: "bg-violet-400",
            },
            {
              id: "02",
              name: "Podcast Clipper",
              desc: "Upload any long-form podcast or video. Whisper transcribes, AI identifies the highest-retention 30–60s segments, and renders them vertical with captions.",
              color: "blue",
              gradient: "from-blue-500/10 to-blue-500/[0.02]",
              borderColor: "border-blue-500/[0.08] hover:border-blue-500/20",
              dotColor: "bg-blue-400",
            },
            {
              id: "03",
              name: "Raw Footage Edit",
              desc: "Drop raw camera footage. AI trims dead space, normalizes any aspect ratio to 9:16, and adds branded subtitle overlays with your voice preset.",
              color: "emerald",
              gradient: "from-emerald-500/10 to-emerald-500/[0.02]",
              borderColor: "border-emerald-500/[0.08] hover:border-emerald-500/20",
              dotColor: "bg-emerald-400",
            },
          ].map((machine, i) => (
            <Reveal key={machine.id} delay={i * 0.1}>
              <div className={`relative rounded-xl border ${machine.borderColor} bg-gradient-to-b ${machine.gradient} p-5 sm:p-6 transition-all duration-300 hover:-translate-y-1 h-full`}>
                <div className="flex items-center gap-2.5 mb-3 sm:mb-4">
                  <span className={`w-2 h-2 rounded-full ${machine.dotColor}`} />
                  <span className="text-[10px] sm:text-[11px] font-mono text-[#52525b] tracking-wider">MACHINE {machine.id}</span>
                </div>
                <h3 className="text-base sm:text-[17px] font-semibold tracking-tight mb-2 sm:mb-3" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                  {machine.name}
                </h3>
                <p className="text-xs sm:text-[13px] text-[#71717a] leading-relaxed">
                  {machine.desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ═══ Tech Stack Strip ═══ */}
      <Reveal className="relative z-10 border-y border-white/[0.04] bg-white/[0.01]">
        <div className="px-4 sm:px-8 md:px-12 lg:px-20 py-5 sm:py-8 flex flex-wrap items-center justify-center gap-x-6 sm:gap-x-10 gap-y-3 sm:gap-y-4">
          {["FFmpeg", "Fish Speech", "BullMQ", "Pexels HD", "Redis", "Whisper", "Chatterbox", "Next.js"].map((tech) => (
            <span key={tech} className="text-[11px] sm:text-[12px] font-mono text-[#3f3f46] uppercase tracking-[0.12em] hover:text-[#71717a] transition-colors cursor-default">
              {tech}
            </span>
          ))}
        </div>
      </Reveal>

      {/* ═══ How It Works ═══ */}
      <section className="relative z-10 px-4 sm:px-8 md:px-12 lg:px-20 py-16 sm:py-24">
        <Reveal>
          <div className="text-center mb-10 sm:mb-16">
            <span className="text-[10px] sm:text-[11px] font-medium text-violet-400/70 uppercase tracking-[0.15em]">Pipeline</span>
            <h2 className="mt-2 text-[clamp(1.35rem,3.5vw,2.25rem)] font-semibold tracking-tight" style={{ fontFamily: "var(--font-space-grotesk)" }}>
              From idea to published reel in four steps.
            </h2>
          </div>
        </Reveal>

        <div className="max-w-2xl mx-auto space-y-0">
          {[
            {
              step: "01",
              title: "AI writes the script",
              desc: "Generates a 60-second screenplay with a pattern-interrupt hook, structured body scenes, and a CTA — tuned to your brand pillars.",
            },
            {
              step: "02",
              title: "Neural voice synthesis",
              desc: "Fish Speech or Chatterbox generates broadcast-quality voiceover. Hindi, Hinglish, or English — with your cloned voice preset.",
            },
            {
              step: "03",
              title: "FFmpeg renders the reel",
              desc: "8 HD B-roll clips from Pexels, karaoke ASS subtitles, brand watermark, 9:16 normalization. All assembled frame-perfect by FFmpeg.",
            },
            {
              step: "04",
              title: "Review and publish",
              desc: "Videos land in the approval queue. Edit captions, approve with one click, and auto-schedule to Instagram via Graph API.",
            },
          ].map((item, i) => (
            <Reveal key={item.step} delay={i * 0.08}>
              <div className="flex gap-4 sm:gap-6 py-5 sm:py-6 border-b border-white/[0.04] last:border-0 group">
                <div className="flex flex-col items-center gap-0.5 pt-0.5 sm:pt-1">
                  <span className="text-[10px] sm:text-[11px] font-mono text-[#3f3f46] group-hover:text-violet-400/60 transition-colors">{item.step}</span>
                </div>
                <div>
                  <h4 className="text-sm sm:text-[15px] font-semibold tracking-tight mb-1 sm:mb-1.5" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                    {item.title}
                  </h4>
                  <p className="text-xs sm:text-[13px] text-[#52525b] leading-relaxed max-w-[50ch]">
                    {item.desc}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ═══ Final CTA ═══ */}
      <Reveal className="relative z-10 px-4 sm:px-6 pb-16 sm:pb-24">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-[clamp(1.35rem,3.5vw,2.25rem)] font-semibold tracking-tight mb-3 sm:mb-4" style={{ fontFamily: "var(--font-space-grotesk)" }}>
            Ready to see it in action?
          </h2>
          <p className="text-xs sm:text-[14px] text-[#52525b] mb-6 sm:mb-8 max-w-[40ch] mx-auto">
            Login to the dashboard and start generating content from your pipelines.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-7 py-3 bg-white text-[#09090b] text-[14px] font-semibold rounded-lg transition-all duration-200 hover:shadow-[0_0_30px_rgba(139,92,246,0.15)] hover:-translate-y-px w-full sm:w-auto"
          >
            Enter Dashboard
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
          </Link>
        </div>
      </Reveal>

      {/* ═══ Footer ═══ */}
      <footer className="relative z-10 border-t border-white/[0.04] px-4 sm:px-8 md:px-12 lg:px-20 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-[10px] sm:text-[11px] text-[#3f3f46] text-center sm:text-left">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 sm:w-5 sm:h-5 rounded bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center">
              <span className="text-white text-[8px] sm:text-[9px] font-bold">J</span>
            </div>
            <span>Janus AI · Internal Content Engine</span>
          </div>
          <span>
            Built by{" "}
            <a href="https://mindmaxing.org/lp01" target="_blank" rel="noopener noreferrer" className="text-[#52525b] hover:text-[#71717a] underline underline-offset-2 transition-colors">
              Mindmaxing
            </a>
            {" "}· Not for commercial distribution
          </span>
        </div>
      </footer>

      {/* ═══ Shimmer keyframe (injected inline for Next.js compat) ═══ */}
      <style jsx global>{`
        @keyframes shimmer {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </div>
  );
}
