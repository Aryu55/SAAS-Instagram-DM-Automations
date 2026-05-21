export interface ViralTemplate {
  id: string;
  niche: "tech" | "business" | "finance" | "productivity" | "creative" | "general";
  hook: string;
  structure: string;
  keyTakeaway: string;
  metrics: string;
}

export const VIRAL_TEMPLATES: ViralTemplate[] = [
  // TECH / AI / CODING
  {
    id: "tech_1",
    niche: "tech",
    hook: "Stop building custom software manually. This tool does it in seconds.",
    structure: `[HOOK] (0-3s): Stop building custom software manually! In 2026, you're literally burning your time.\n[PROBLEM] (3-10s): Building websites and APIs from scratch takes days, and debugging dependencies is a complete nightmare.\n[SOLUTION] (10-22s): But check this out... I just use this free agent setup. I type what I want, and it writes, builds, and deploys it instantly on auto-pilot.\n[CTA] (22-30s): Comment "AGENTS" below and I will DM you the full setup guide for free!`,
    keyTakeaway: "Negative urgency scroll-stopper hook, concrete problem description, live-action demo effect, comment-to-DM trigger keyword.",
    metrics: "Est. Views: 1.5M+, ER: 8.9%, Comment Rate: High"
  },
  {
    id: "tech_2",
    niche: "tech",
    hook: "99% of coders don't know this secret terminal command.",
    structure: `[HOOK] (0-3s): 99% of developers don't know this secret terminal command! It literally saves me hours.\n[EXPLANATION] (3-12s): If you are still manually parsing logs or looking for bugs, you're doing it wrong. Just run this command...\n[VALUE DEMO] (12-23s): See how it scans the entire workspace, isolates compile errors, and explains exactly how to fix it in seconds.\n[CTA] (23-30s): Comment "SHORTCUT" and my AI automation will DM you the code block and installation script immediately!`,
    keyTakeaway: "Exclusivity hook, fast pacing, instant tool value demonstration, automated keyword delivery.",
    metrics: "Est. Views: 980K+, ER: 7.2%, Comment Rate: Medium"
  },
  {
    id: "tech_3",
    niche: "tech",
    hook: "This free AI model just killed my expensive subscription.",
    structure: `[HOOK] (0-3s): This new free AI model just killed my paid subscription. Don't pay for premium tools anymore!\n[PROBLEM] (3-10s): Everyone is spending $20 a month on premium accounts, but this open-source setup is actually faster and smarter.\n[PROOF] (10-22s): I ran the same code optimization task on both, and this free model finished in 800ms with zero errors.\n[CTA] (22-30s): Comment "FREEAI" and I'll send you the integration link and the API key settings right to your DMs!`,
    keyTakeaway: "Financial pain-point hook, side-by-side comparison proof, immediate saving benefit.",
    metrics: "Est. Views: 2.1M+, ER: 9.4%, Comment Rate: High"
  },

  // BUSINESS / GROWTH / MARKETING
  {
    id: "business_1",
    niche: "business",
    hook: "I set up this automated lead system in 12 minutes without spending a dime.",
    structure: `[HOOK] (0-3s): I set up this automated lead system in 12 minutes, and it didn't cost me a single rupee.\n[PROBLEM] (3-12s): Running cold outreach manually takes hours and leads to zero replies. It's frustrating and unsustainable.\n[SETUP] (12-22s): Instead, I use a webhook that listens to Instagram comments and automatically sends a personalized link in under 2 seconds.\n[CTA] (22-30s): Comment "LEADS" and I'll send you my complete automated sales template and setup steps!`,
    keyTakeaway: "Time-bound benefit hook, relatable frustration, transparent workflow reveal, high-relevance CTA.",
    metrics: "Est. Views: 1.1M+, ER: 8.6%, Comment Rate: High"
  },
  {
    id: "business_2",
    niche: "business",
    hook: "How to steal your competitor's traffic legally.",
    structure: `[HOOK] (0-3s): Here is how to steal your competitor's traffic completely legally. Save this video right now!\n[EXPOSITION] (3-12s): Go to this tool, enter their handle, and extract their top-performing content scripts and keyword triggers.\n[STRATEGY] (12-23s): Rebuild these topics in your own voice and attach automated interactive DMs to convert the attention.\n[CTA] (23-30s): Comment "STEAL" and I will send you the scraping framework link and prompt blueprints!`,
    keyTakeaway: "Intriguing/contrarian hook, 'legal stealing' pattern, high-value strategy sharing, high shareability.",
    metrics: "Est. Views: 1.8M+, ER: 9.1%, Comment Rate: High"
  },

  // FINANCE / WEALTH
  {
    id: "finance_1",
    niche: "finance",
    hook: "Don't store your savings in a bank account. Do this instead.",
    structure: `[HOOK] (0-3s): If you are storing your savings in a normal bank account, you are literally losing money to inflation.\n[EXPLANATION] (3-12s): Standard banks pay less than 3% interest, while inflation eats up 6%. Your hard-earned money is shrinking.\n[ALTERNATIVE] (12-22s): Instead, put it in this liquid fund setup. It pays 7.5% interest, has zero lock-in, and withdraws in seconds.\n[CTA] (22-30s): Comment "WEALTH" and I will send you the comparison sheet and setup guide to get started!`,
    keyTakeaway: "Urgent fear-of-loss hook, mathematical logical proof, clear actionable alternative.",
    metrics: "Est. Views: 1.4M+, ER: 7.9%, Comment Rate: Medium"
  },
  {
    id: "finance_2",
    niche: "finance",
    hook: "3 tax loopholes that rich people use to save millions.",
    structure: `[HOOK] (0-3s): Here are 3 tax loopholes that rich people use to save millions legally. Most people have no idea.\n[BODY] (3-22s): First, setting up a home office deduction. Second, writing off business expenses via a corporation. Third, investing via tax-free accounts.\n[CTA] (22-30s): Comment "TAX" and I will send you the cheat sheet detailing how to configure these write-offs this year!`,
    keyTakeaway: "Authority-based exclusivity, listicle structure (3 items) for high retention, immediate savings value.",
    metrics: "Est. Views: 2.3M+, ER: 8.8%, Comment Rate: High"
  },

  // PRODUCTIVITY / LIFEHACKS
  {
    id: "productivity_1",
    niche: "productivity",
    hook: "This simple habit saves me 3 hours of screen time every day.",
    structure: `[HOOK] (0-3s): This one simple habit saves me 3 hours of mindless screen time every single day.\n[PROBLEM] (3-10s): We check our phones 150 times a day, breaking focus and ruining productivity.\n[HABIT] (10-22s): Turn on grayscale mode and move social apps into folders. It makes your phone boring and kills the dopamine loop.\n[CTA] (22-30s): Comment "FOCUS" and I'll send you my complete list of minimal phone setups and focus routines!`,
    keyTakeaway: "Relatable self-improvement hook, psychological explanation, easy actionable hack, high save rate.",
    metrics: "Est. Views: 850K+, ER: 6.8%, Comment Rate: Medium"
  },
  {
    id: "productivity_2",
    niche: "productivity",
    hook: "Stop organizing your tasks in standard lists. Do this.",
    structure: `[HOOK] (0-3s): Stop organizing your tasks in lists! It's the worst way to actually get things done.\n[PROBLEM] (3-12s): Long to-do lists overwhelm your brain and lead to procrastination because everything looks equally important.\n[SOLUTION] (12-22s): Use time-blocking. Schedule tasks directly into your calendar. If it doesn't have a time, it doesn't exist.\n[CTA] (22-30s): Comment "PLANNER" and I'll send you my custom calendar template for free!`,
    keyTakeaway: "Strong counter-intuitive hook, logical explanation of list failure, immediate time-blocking solution.",
    metrics: "Est. Views: 1.2M+, ER: 7.5%, Comment Rate: High"
  },

  // CREATIVE / DESIGN / VIDEO
  {
    id: "creative_1",
    niche: "creative",
    hook: "This editing trick will double your video retention rates instantly.",
    structure: `[HOOK] (0-3s): This editing trick will literally double your video retention rates. Pay attention!\n[EXPLANATION] (3-12s): Most creators lose viewers in the first 5 seconds because their frame is static. You need visual breaks.\n[DEMO] (12-22s): Cut every 2.5 seconds, use zoom punches, and add sound effects on every transition to keep the brain engaged.\n[CTA] (22-30s): Comment "EDIT" and I will send you my pack of viral sound effects and assets!`,
    keyTakeaway: "Benefit-driven hook, audio-visual instruction, immediate demonstration, highly downloadable asset CTA.",
    metrics: "Est. Views: 1.6M+, ER: 9.2%, Comment Rate: High"
  },

  // GENERAL / VIRAL / BROAD
  {
    id: "general_1",
    niche: "general",
    hook: "Don't scroll! This is the most useful website on the internet.",
    structure: `[HOOK] (0-3s): Don't scroll! This is literally the most useful website on the internet.\n[PROBLEM] (3-10s): If you are struggling with [broad problem, e.g. finding files or writing scripts], you are wasting hours.\n[DEMO] (10-22s): Just go to this website. Upload your file, and it does everything for you. It's completely free.\n[CTA] (22-30s): Comment "TOOL" and I'll send you the link and 5 secret hacks to use it!`,
    keyTakeaway: "Direct pattern interrupt ('Don't scroll!'), broad interest hook, quick web-app value presentation.",
    metrics: "Est. Views: 3.5M+, ER: 10.5%, Comment Rate: High"
  },
  {
    id: "general_2",
    niche: "general",
    hook: "3 tools that feel illegal to know in 2026.",
    structure: `[HOOK] (0-3s): Here are 3 tools that feel completely illegal to know in 2026. Save this before it gets taken down!\n[LISTICLE] (3-22s): Tool 1: AI voice replicator. Tool 2: Free screen recorder with zero watermarks. Tool 3: Automated data scraper.\n[CTA] (22-30s): Comment "ILLEGAL" and I will DM you the links to all three tools instantly!`,
    keyTakeaway: "Curiosity/fear-based hook ('illegal to know', 'before it gets taken down'), simple list format, high engagement.",
    metrics: "Est. Views: 4.2M+, ER: 11.2%, Comment Rate: High"
  }
];

export function getMatchingTemplates(niche: string, limit = 2): ViralTemplate[] {
  const normalized = niche.toLowerCase().trim();
  
  // Find templates directly matching the niche
  let matches = VIRAL_TEMPLATES.filter(
    (t) => t.niche === normalized || (normalized.includes(t.niche) || t.niche.includes(normalized))
  );

  // Fallback to general templates if we need more matches
  if (matches.length < limit) {
    const general = VIRAL_TEMPLATES.filter((t) => t.niche === "general" && !matches.includes(t));
    matches = [...matches, ...general];
  }

  // Slice to the requested limit to preserve token count & speed
  return matches.slice(0, limit);
}
