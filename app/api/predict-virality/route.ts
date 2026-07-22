import { NextRequest, NextResponse } from "next/server";
import { openai, getModelName, isUsingOpenRouter } from "@/lib/openai";
import { getMatchingTemplates } from "@/lib/viral-templates";

export const dynamic = 'force-dynamic';

interface MetricBreakdown {
  hookStrength: number;
  pacing: number;
  emotionalValence: number;
  ctaEngagement: number;
  retentionValue: number;
}

interface RetentionPoint {
  time: number;
  retention: number;
}

interface Suggestion {
  original: string;
  replacement: string;
  reason: string;
}

interface AnalysisResult {
  score: number;
  metrics: MetricBreakdown;
  simulatedRetention: RetentionPoint[];
  critique: {
    hook: string;
    body: string;
    cta: string;
  };
  suggestions: Suggestion[];
}

function computeSimulatedScore(
  script: string,
  platform: string,
  niche: string,
  language: string
): AnalysisResult {
  const text = script.toLowerCase();
  
  // Rule-based heuristic scoring to simulate real metrics
  let hookStrength = 6.5;
  let pacing = 7.0;
  let emotionalValence = 6.0;
  let ctaEngagement = 5.5;
  let retentionValue = 6.8;

  // 1. Hook evaluation
  const first30Words = script.split(/\s+/).slice(0, 15).join(" ").toLowerCase();
  if (first30Words.includes("stop") || first30Words.includes("don't") || first30Words.includes("never") || first30Words.includes("warning")) {
    hookStrength += 1.5; // Negative urgency hook
  }
  if (first30Words.includes("secret") || first30Words.includes("how I") || first30Words.includes("free tool") || first30Words.includes("blueprint")) {
    hookStrength += 2.0; // High value hook
  }
  if (first30Words.includes("suno") || first30Words.includes("dosto") || first30Words.includes("yaar")) {
    hookStrength += 1.0; // Friendly greeting hook
  }

  // 2. Pacing (Sentence length count)
  const sentences = script.split(/[.!?\n]+/).filter(s => s.trim().length > 0);
  const avgSentenceLength = sentences.length > 0 ? script.split(/\s+/).length / sentences.length : 15;
  if (avgSentenceLength >= 8 && avgSentenceLength <= 14) {
    pacing += 2.5; // Optimal short punchy sentences
  } else if (avgSentenceLength < 8) {
    pacing += 1.5; // A bit too robotic but fast
  } else {
    pacing -= 1.0; // Monotonous long sentences
  }

  // 3. CTA
  if (text.includes("comment") || text.includes("dm me") || text.includes("reply") || text.includes("type")) {
    ctaEngagement += 3.5; // Comment to DM automation trigger word detected
  }
  if (text.includes("follow") || text.includes("save") || text.includes("share")) {
    ctaEngagement += 1.0; // Secondary CTAs
  }

  // 4. Emotional Valence
  if (text.includes("literally") || text.includes("insane") || text.includes("crazy") || text.includes("mind-blowing") || text.includes("hack")) {
    emotionalValence += 2.5;
  }
  if (text.includes("waste") || text.includes("lose") || text.includes("fail") || text.includes("scared")) {
    emotionalValence += 1.5;
  }

  // 5. Retention value
  const wordCount = script.split(/\s+/).length;
  if (wordCount > 50 && wordCount < 130) {
    retentionValue += 2.0; // Nice sweet spot (30-50s video)
  } else if (wordCount <= 50) {
    retentionValue += 1.0; // Very short
  } else {
    retentionValue -= 1.5; // Too long, likely high dropoff
  }

  // Normalize scores
  hookStrength = Math.min(10, Math.max(1, parseFloat(hookStrength.toFixed(1))));
  pacing = Math.min(10, Math.max(1, parseFloat(pacing.toFixed(1))));
  emotionalValence = Math.min(10, Math.max(1, parseFloat(emotionalValence.toFixed(1))));
  ctaEngagement = Math.min(10, Math.max(1, parseFloat(ctaEngagement.toFixed(1))));
  retentionValue = Math.min(10, Math.max(1, parseFloat(retentionValue.toFixed(1))));

  const score = Math.round(
    (hookStrength * 0.25 +
      pacing * 0.15 +
      emotionalValence * 0.2 +
      ctaEngagement * 0.25 +
      retentionValue * 0.15) *
      10
  );

  // Generate Simulated Retention Curve
  const duration = Math.max(15, Math.min(60, Math.round(wordCount / 2.5))); // ~2.5 words per sec
  const retentionCurve: RetentionPoint[] = [
    { time: 0, retention: 100 }
  ];
  
  // Hook drop-off (0 to 3 seconds)
  const hookDrop = 100 - (10 - hookStrength) * 3;
  retentionCurve.push({ time: 3, retention: Math.round(hookDrop) });
  
  // Mid drop-off (pacing and retention value influence)
  const midPoint = Math.round(duration / 2);
  const midRetention = hookDrop - (10 - (pacing + retentionValue) / 2) * (midPoint / 3);
  retentionCurve.push({ time: midPoint, retention: Math.max(30, Math.round(midRetention)) });

  // CTA point (usually dropoff, unless cta is good)
  const ctaPoint = duration - 3;
  const ctaRetention = midRetention - 8 + (ctaEngagement - 5);
  retentionCurve.push({ time: ctaPoint, retention: Math.max(25, Math.round(ctaRetention)) });

  // End point
  const endRetention = ctaRetention - 4;
  retentionCurve.push({ time: duration, retention: Math.max(20, Math.round(endRetention)) });

  // Generate critiques and suggestions based on keywords
  const hasCommentCta = text.includes("comment") || text.includes("type");
  const suggestions: Suggestion[] = [];

  if (hookStrength < 8.0) {
    suggestions.push({
      original: script.split(/[.!?\n]+/).slice(0, 1)[0] || "Suno dosto...",
      replacement: `Stop doing things manually! If you are still doing ${niche} work yourself, stop.`,
      reason: "Start with a direct pain point or warning to disrupt the user's scroll feed instantly."
    });
  }

  if (!hasCommentCta) {
    suggestions.push({
      original: sentences[sentences.length - 1] || "Thanks for watching.",
      replacement: `Comment "${niche.toUpperCase().slice(0, 5) || "LINK"}" and I will DM you the step-by-step setup!`,
      reason: "Adding comment triggers automates follow-ups and skyrockets Instagram engagement ranking."
    });
  }

  return {
    score,
    metrics: {
      hookStrength,
      pacing,
      emotionalValence,
      ctaEngagement,
      retentionValue
    },
    simulatedRetention: retentionCurve,
    critique: {
      hook: hookStrength > 8.0 
        ? "Excellent immediate trigger. You disrupted the scroll within the first 3 seconds." 
        : "The hook is a bit passive. It starts slow which can cause 35%+ dropoff in the first 3 seconds.",
      body: pacing > 7.5
        ? "Great short sentences. The Hinglish vocabulary keeps the audience listening."
        : "Sentences are slightly too wordy. Try removing filler words to maintain high momentum.",
      cta: hasCommentCta
        ? "Solid call-to-action! Driving comments boosts engagement rate metrics enormously."
        : "Missing comment keyword trigger. Asking users to comment a word is 10x more effective than 'link in bio'."
    },
    suggestions
  };
}

import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { scriptA, scriptB, platform = "instagram", niche = "tech", language = "hinglish" } = await req.json();

    if (!scriptA) {
      return NextResponse.json({ error: "Script A content is required" }, { status: 400 });
    }

    if (typeof scriptA !== "string" || scriptA.length > 5000) {
      return NextResponse.json({ error: "Script A content exceeds maximum length of 5000 characters" }, { status: 400 });
    }

    if (scriptB && (typeof scriptB !== "string" || scriptB.length > 5000)) {
      return NextResponse.json({ error: "Script B content exceeds maximum length of 5000 characters" }, { status: 400 });
    }

    if (process.env.NODE_ENV !== "production") {
      console.log("[VIRALITY FEATURE] API POST received for user:", session.id);
    }

    const hasKeys = isUsingOpenRouter || !!process.env.OPEN_AI_KEY || !!process.env.GEMINI_API_KEY;

    if (!hasKeys) {
      console.log("[VIRALITY FEATURE] LLM keys not detected, running rule-based heuristic fallback simulator...");
      // Return simulated responses immediately
      const analysisA = computeSimulatedScore(scriptA, platform, niche, language);
      const analysisB = scriptB ? computeSimulatedScore(scriptB, platform, niche, language) : null;
      console.log("[VIRALITY FEATURE] Heuristic simulator computed:", {
        scoreA: analysisA.score,
        scoreB: analysisB?.score || "N/A"
      });
      return NextResponse.json({ versionA: analysisA, versionB: analysisB });
    }

    const systemPrompt = `You are an expert short-form content director and virality optimizer. 
Evaluate the provided short-form script(s) for platforms like Instagram Reels, TikTok, and YouTube Shorts.
You MUST analyze the scripts across five key criteria:
1. Hook Strength (0-10): Hook attention in first 3s, pattern interrupt.
2. Pacing (0-10): Momentum, sentence structure, Hinglish/vernacular flow, word count economy.
3. Emotional Valence (0-10): High-arousal triggers (curiosity, fear of missing out, shock, aspiration).
4. CTA Engagement (0-10): Interaction trigger (specifically comment automation setup).
5. Retention Value (0-10): Depth of insight, lack of fluff, keeping attention till the end.

Format your analysis strictly as a JSON object matching this schema:
{
  "versionA": {
    "score": number, // Overall calculated rating out of 100
    "metrics": {
      "hookStrength": number, // Float 1.0 to 10.0
      "pacing": number, // Float 1.0 to 10.0
      "emotionalValence": number, // Float 1.0 to 10.0
      "ctaEngagement": number, // Float 1.0 to 10.0
      "retentionValue": number // Float 1.0 to 10.0
    },
    "simulatedRetention": [
      {"time": 0, "retention": 100},
      {"time": 3, "retention": number}, // expected retention % at 3 seconds
      {"time": 10, "retention": number},
      {"time": 20, "retention": number},
      {"time": 30, "retention": number},
      {"time": 45, "retention": number},
      {"time": 60, "retention": number} // or estimated script duration
    ],
    "critique": {
      "hook": "detailed string critique...",
      "body": "detailed string critique...",
      "cta": "detailed string critique..."
    },
    "suggestions": [
      {
        "original": "exact original script snippet to modify",
        "replacement": "improved optimized text",
        "reason": "why this revision improves retention/engagement"
      }
    ]
  },
  "versionB": null // If scriptB is analyzed, populate in the same shape as versionA, else null.
}`;

    const matchingTemplates = getMatchingTemplates(niche, 2, scriptA);

    const userPrompt = `Analyze the following script(s) for the "${niche}" niche, target platform "${platform}", and target language "${language}":

### PROVEN VIRAL REFERENCE TEMPLATES TO BENCHMARK AGAINST:
${matchingTemplates.map((t, idx) => `
Template ${idx + 1}:
- Hook Pattern: "${t.hook}"
- Structured Script:
${t.structure}
- Why it is viral: ${t.keyTakeaway}
`).join("\n")}

### USER SCRIPT A TO EVALUATE:
${scriptA}

${scriptB ? `### USER SCRIPT B TO EVALUATE:\n${scriptB}\n` : ""}

Evaluate them carefully, compare their structure and pacing against the proven reference templates provided above, compute realistic simulated retention curves based on script pace and length, and suggest practical line refinements. Remember to return raw JSON matching the schema.`;

    try {
      console.log("[VIRALITY FEATURE] Calling LLM API for deep evaluation of scripts...");
      const completion = await openai.chat.completions.create({
        model: getModelName(),
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ]
      });

      console.log("[VIRALITY FEATURE] LLM API responded successfully. Parsing JSON output...");
      const jsonResponse = JSON.parse(completion.choices[0].message.content || "{}");
      console.log("[VIRALITY FEATURE] Parsed LLM analysis successfully:", {
        scoreA: jsonResponse.versionA?.score,
        scoreB: jsonResponse.versionB?.score || "N/A"
      });
      return NextResponse.json(jsonResponse);
    } catch (err: any) {
      console.error("[VIRALITY FEATURE] LLM evaluation failed, calling fallback simulator:", err.message);
      const analysisA = computeSimulatedScore(scriptA, platform, niche, language);
      const analysisB = scriptB ? computeSimulatedScore(scriptB, platform, niche, language) : null;
      return NextResponse.json({ versionA: analysisA, versionB: analysisB });
    }

  } catch (error: any) {
    console.error("[VIRALITY FEATURE] Fatal error in API POST:", error);
    return NextResponse.json({ error: "Failed to evaluate virality prediction" }, { status: 500 });
  }
}
