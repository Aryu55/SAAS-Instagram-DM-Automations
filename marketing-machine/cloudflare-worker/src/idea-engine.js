/**
 * idea-engine.js
 * ──────────────
 * Generates short-form video topic ideas on-demand from a business configuration payload.
 */

/**
 * Builds a detailed system prompt that teaches the LLM how to ideate
 * short-form video topics using proven marketing frameworks.
 */
function buildSystemPrompt(biz) {
  const languageStr = biz.language === "hinglish" 
    ? `Hinglish (a mix of ~65% Hindi and 35% English written in Latin script, e.g. "Suno yaar, agar aap also face this problem...")` 
    : biz.language;

  return `You are an expert short-form video content strategist for a SaaS product.
Your job is to generate unique, attention-grabbing topic ideas for our videos.

PRODUCT CONTEXT
- Name: ${biz.name}
- Tagline: ${biz.tagline || ""}
- Description: ${biz.description}
- Target Audience: ${biz.targetAudience}
- Pain Points: ${(biz.painPoints || []).join(', ')}
- Content Pillars: ${(biz.contentPillars || []).join(' | ')}
- Language: ${languageStr}
- Tone: ${biz.voiceTone}
- Ending CTA: ${biz.cta}
${biz.complianceNotes ? `- IMPORTANT Legal Compliance Rule: ${biz.complianceNotes}` : ""}

──────────────────────────────────────────
FRAMEWORKS YOU MUST APPLY (from internal playbooks)
──────────────────────────────────────────

1. HOOK PATTERNS (social skill)
   Every idea MUST specify one of these hook styles:
   • Curiosity  – e.g. "I was wrong about [belief]." / "The real reason [X] isn't what you think."
   • Story      – e.g. "Last week [unexpected thing] happened." / "3 years ago I [past]. Today [now]."
   • Value      – e.g. "How to [outcome] without [pain]:" / "[N] things that [outcome]:"
   • Contrarian – e.g. "Unpopular opinion: [bold claim]" / "[Common advice] is wrong. Here's why:"

2. PAIN-POINT MINING (marketing-ideas + copywriting skills)
   Mine the audience's actual pain points for every idea.
   Use the audience's own language – specific, vivid, emotional.
   Specificity > Vagueness: "Cut weekly bookkeeping from 4 hours to 15 min" beats "Save time."
   Benefits > Features: Focus on the outcome for the viewer.

3. TREND-JACKING & TIMELINESS (marketing-ideas skill)
   Where possible, tie ideas to recurring events target users experience (quarterly deadlines, tax season, exit events, notice periods).

4. FEATURE → BENEFIT ANGLES (copywriting skill)
   Use the formula: {Achieve outcome} without {pain point}.
   Ensure you NEVER generate fake proof or fake testimonials.

5. VIDEO STRUCTURE (video + social skills)
   Ideas should fit one of these proven structures:
   • Problem-Solution (15-30 s): Hook → Agitate → Solve → CTA
   • List Format (30-60 s): Hook → N items → CTA
   • Tutorial (30-60 s): Show result first → Steps → CTA
   Follow the 3-Second Rule: Visual hook + Verbal hook + Text overlay all in second 1.

6. CONTENT PILLAR ALIGNMENT
   Every idea must map to exactly one of the content pillars listed above.
   Distribute ideas roughly evenly across pillars.

7. ENGAGEMENT ESTIMATION
   Rate each idea's estimated engagement as "high", "medium", or "low" based on emotional resonance.

──────────────────────────────────────────
OUTPUT FORMAT
──────────────────────────────────────────
Return ONLY valid JSON. No markdown wrappers, no commentary outside the JSON.
{
  "ideas": [
    {
      "id": "<unique short kebab-case id, e.g. fnf-rights-miss-01>",
      "topic": "<concise topic title>",
      "angle": "<1-2 sentence description of the specific angle / thesis>",
      "hookStyle": "<curiosity | story | value | contrarian>",
      "contentPillar": "<exact pillar string from the list above>",
      "estimatedEngagement": "<high | medium | low>"
    }
  ]
}`;
}

/**
 * Sends a chat completion request to the LLM and returns parsed JSON.
 */
async function callLLM(env, system, user) {
  const apiEndpoint = env.FREE_LLM_API_URL || "https://free.llm.api/v1";
  const apiKey = env.FALLBACK_OPENAI_API_KEY;

  const response = await fetch(`${apiEndpoint}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'auto',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.85,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`LLM API error ${response.status}: ${errorBody.slice(0, 500)}`);
  }

  const data = await response.json();
  const raw = data.choices?.[0]?.message?.content;
  if (!raw) {
    throw new Error('LLM returned an empty response.');
  }

  return JSON.parse(raw);
}

/**
 * Generate unique short-form video topic ideas for a business profile.
 */
export async function generateIdeas(env, biz, count = 10) {
  const systemPrompt = buildSystemPrompt(biz);

  const userPrompt =
    `Generate exactly ${count} unique short-form video topic ideas for ${biz.name}. ` +
    `Distribute them across all content pillars. ` +
    `Each idea must have a distinct angle — no duplicates. ` +
    `Return the JSON object with an "ideas" array.`;

  const result = await callLLM(env, systemPrompt, userPrompt);
  const ideas = Array.isArray(result) ? result : result.ideas;

  if (!Array.isArray(ideas) || ideas.length === 0) {
    throw new Error('LLM did not return a valid ideas array.');
  }

  return ideas;
}
