import { NextRequest } from "next/server";
import { openai, getModelName, isUsingOpenRouter } from "@/lib/openai";
import { scrapeInstagramProfile, scrapeYouTubeShorts } from "@/lib/scrapers";
import { getMatchingTemplates } from "@/lib/viral-templates";

export const dynamic = 'force-dynamic';

interface PipelinePayload {
  scrapedPosts: any[];
  validatedPosts: any[];
  topics: any[];
  voiceProfile: {
    vocabulary: string[];
    sentenceLength: string;
    hinglishPattern: string;
    energy: string;
  };
  script: string;
  hooks: any[];
  recommendedHook: any;
  viralityScore?: number;
  viralityCritique?: string;
}

function generateLocalContent(
  topic: string,
  keywords: string[],
  competitors: string[],
  weights: { views: number; engagement: number; comments: number },
  filters: { minViews: number; minEngagement: number },
  voiceScripts: string[]
): PipelinePayload {
  const comps = competitors.length > 0 ? competitors : ["@heybarsee", "@rowancheung", "@mreflow"];
  const kws = keywords.length > 0 ? keywords : ["AI automation", "viral tactics", "reels strategy"];
  
  const kw1 = kws[0] || "AI automation";
  const kw2 = kws[1] || "outreach workflow";
  const kw3 = kws[2] || "growth hack";
  
  const comp1 = comps[0] || "@creator1";
  const comp2 = comps[1] || "@creator2";
  const comp3 = comps[2] || "@creator3";

  let cleanTopic = topic.trim();
  if (cleanTopic.toLowerCase().startsWith("how to ")) {
    cleanTopic = cleanTopic.slice(7);
  }
  cleanTopic = cleanTopic.charAt(0).toUpperCase() + cleanTopic.slice(1);

  const mockPosts = [
    {
      id: "post_1",
      platform: "instagram",
      handle: comp1,
      views: 154000,
      likes: 8900,
      comments: 620,
      postDate: new Date().toISOString(),
      url: "https://instagram.com/p/C7A8z8y",
      caption: `This new approach for ${topic} is literally insane! 🤯 No manual stuff, no complex setups. Comment '${kw1.toUpperCase().slice(0, 6)}' and I'll send you my exact workflow! #${kw1.replace(/\s+/g, '').toLowerCase()} #${kw2.replace(/\s+/g, '').toLowerCase()}`,
      transcript: `Dosto, you need to see this. I am running a new setup for ${topic}. I literally just automated my ${kw1} and watch this... it's doing everything on auto-pilot. Stop working manually and run this now!`
    },
    {
      id: "post_2",
      platform: "youtube",
      handle: comp2,
      views: 88000,
      likes: 5100,
      comments: 480,
      postDate: new Date().toISOString(),
      url: "https://youtube.com/shorts/xyz789",
      caption: `How to connect ${kw2} for 100% automated outreach. Save this video for later! #${kw2.replace(/\s+/g, '').toLowerCase()} #${kw3.replace(/\s+/g, '').toLowerCase()}`,
      transcript: `If you are not using ${kw2} with ${kw1}, you are working 10 times harder than you need to. I set up a simple workflow: it tracks leads and answers questions autonomously. This is the ultimate hack for ${topic}. Let me show you how.`
    },
    {
      id: "post_3",
      platform: "instagram",
      handle: comp1,
      views: 185000,
      likes: 14200,
      comments: 1200,
      postDate: new Date().toISOString(),
      url: "https://youtube.com/shorts/abc456",
      caption: `Vibe coding is cool, but is it safe for ${topic}? Here are the key security checks you must configure. 🛡️ #${kw3.replace(/\s+/g, '').toLowerCase()}`,
      transcript: `Wait, before you let AI agents run wild on your ${topic}, you need to know about safety. In ${kw3}, you have to approve every write command. If you don't run it in a container, you could lose data. Here are three safety practices you must follow.`
    },
    {
      id: "post_4",
      platform: "instagram",
      handle: comp3,
      views: 42000,
      likes: 980,
      comments: 70,
      postDate: new Date().toISOString(),
      url: "https://instagram.com/p/C7B2z1x",
      caption: `Deploying custom ${kw1} skills for businesses in 2026. Stop selling simple chatbots. Here is my framework for ${topic}. #${kw1.replace(/\s+/g, '').toLowerCase()}`,
      transcript: `Chatbots are dead. If you want to make actual money with AI automation, you need to build custom integrations for ${topic}. Businesses want agents that solve problems, not generic chat widgets.`
    }
  ];

  const processedPosts = mockPosts.map(post => {
    const er = parseFloat(((((post.likes + post.comments) / post.views) * 100).toFixed(2)));
    const isViral = er > 5.0 || post.views > 100000;
    return { ...post, er, isViral };
  });

  const maxViews = Math.max(...processedPosts.map(p => p.views));
  const maxER = Math.max(...processedPosts.map(p => p.er));
  const maxComments = Math.max(...processedPosts.map(p => p.comments));

  const scoredPosts = processedPosts.map(post => {
    const vScore = maxViews > 0 ? (post.views / maxViews) * 10 : 0;
    const erScore = maxER > 0 ? (post.er / maxER) * 10 : 0;
    const cScore = maxComments > 0 ? (post.comments / maxComments) * 10 : 0;
    const score = parseFloat(((vScore * (weights.views / 100)) + (erScore * (weights.engagement / 100)) + (cScore * (weights.comments / 100))).toFixed(2));
    return { ...post, score };
  }).filter(post => post.views >= filters.minViews && post.er >= filters.minEngagement);

  scoredPosts.sort((a, b) => b.score - a.score);

  const topics = [
    { name: `${kw1} & ${kw2} Automation`, count: 3, avgViews: 161333, avgER: 5.92 },
    { name: `Dynamic ${cleanTopic} Workflow`, count: 2, avgViews: 113500, avgER: 5.75 },
    { name: `${kw3} Optimization Hacks`, count: 2, avgViews: 101500, avgER: 5.84 }
  ];

  let vocabulary = ["Dosto", "literally", "crazy", "jhanjhat", "Suno"];
  if (voiceScripts && voiceScripts.length > 0 && voiceScripts[0].trim() !== "") {
    const words = voiceScripts.join(" ").split(/\s+/).map(w => w.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,""));
    const hindiWords = words.filter(w => w.length > 4 && /[aeiou]o$|[aeiou]ar$|yaar|kya|aur|hai|tha|thi|kar|rahe|ho|bhai|yaar|suno|dosto/i.test(w));
    if (hindiWords.length > 0) {
      vocabulary = Array.from(new Set([...hindiWords.slice(0, 3), "literally", "crazy", "jhanjhat"]));
    }
  }

  const scriptText = `[BEAT 1]
Suno yaar, agar aap log abhi bhi manually ${cleanTopic} kar rahe ho, toh time waste kar rahe ho! ${kw1} setup aa chuka hai jo aapke liye automatic tasks automate kar deta hai.

[BEAT 2]
Maine isko ek real project par try kiya. Maine bola 'Create an automation for my ${kw2}' aur isne system connection se lekar notifications tak sab kuch run kar diya, direct server par load kar diya.

[BEAT 3]
Koi manual task validation nahi, koi boring copy-paste ka jhanjhat nahi. Yeh directly standard inputs check execute karta hai bina parameters error ke.

[CTA]
Is complete pipeline setup ka step-by-step documentation chahiye? Toh comment section mein '${kw1.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6) || "SETUP"}' type karo, link seedhe DM mein bheinzdunga!`;

  const hooks = [
    { 
      id: "hook_1", 
      pattern: "Aisi honi chahiye X (Aspirational)", 
      text: `Aisi honi chahiye ${kw1} automation. Zero manual errors, pure speed with ${cleanTopic}!`, 
      confidence: 9.2, 
      explanation: `Aspirational hook targeting creators looking to optimize ${cleanTopic}.` 
    },
    { 
      id: "hook_2", 
      pattern: "Pain Point Frustration", 
      text: `Kab tak manually ${cleanTopic} solve karte rahoge? Time waste band karo!`, 
      confidence: 8.9, 
      explanation: "Direct pain-point targeting." 
    },
    { 
      id: "hook_3", 
      pattern: "Log nahi jaante (Exclusivity)", 
      text: `99% creator nahi jaante ${cleanTopic} ki yeh secret integration skill!`, 
      confidence: 9.5, 
      explanation: "Exclusivity trigger. High CTR pattern across YouTube and Reels alike." 
    },
    { 
      id: "hook_4", 
      pattern: "Time or money claim", 
      text: `Maine 12 minutes mein full ${kw1} setup kiya, bina ek line code likhe!`, 
      confidence: 8.5, 
      explanation: "Highly visual number hook." 
    },
    { 
      id: "hook_5", 
      pattern: "Curiosity Gap", 
      text: `Kya ho agar aapka AI agent automatically ${cleanTopic} optimize karne lage?`, 
      confidence: 9.1, 
      explanation: "Curiosity loop." 
    }
  ];

  return {
    scrapedPosts: processedPosts,
    validatedPosts: scoredPosts,
    topics: topics,
    voiceProfile: {
      vocabulary: vocabulary,
      sentenceLength: "10-15 words (punchy & conversational)",
      hinglishPattern: "65% Hindi / 35% Eng",
      energy: "High energy, enthusiastic, authoritative"
    },
    script: scriptText,
    hooks: hooks,
    recommendedHook: hooks[2]
  };
}

function getSimulatedViralityScore(script: string, topic: string): { score: number; critique: string } {
  const text = script.toLowerCase();
  let score = 70;
  let critique = "";

  if (text.includes("stop") || text.includes("don't") || text.includes("never") || text.includes("warning")) {
    score += 10;
  }
  if (text.includes("comment") || text.includes("type") || text.includes("dm me")) {
    score += 15;
  } else {
    critique += "No comment call-to-action DM trigger detected. ";
  }

  const sentences = script.split(/[.!?\n]+/).filter(s => s.trim().length > 0);
  const avgLen = script.split(/\s+/).length / (sentences.length || 1);
  if (avgLen >= 8 && avgLen <= 14) {
    score += 5;
  }

  score = Math.min(100, Math.max(40, score));
  critique = critique || "Excellent script pacing and strong comment automation trigger words.";
  return { score, critique: `Predicted Virality Score: ${score}%. Analysis: ${critique}` };
}

async function optimizeScriptVirality(
  scriptText: string,
  topic: string,
  keywords: string[],
  voiceProfile: any,
  sendEvent: (event: string, data: any) => void
): Promise<{ script: string; score: number; critique: string }> {
  const hasKeys = isUsingOpenRouter || !!process.env.OPEN_AI_KEY;
  
  if (!hasKeys) {
    const sim = getSimulatedViralityScore(scriptText, topic);
    return { script: scriptText, ...sim };
  }

  try {
    sendEvent('log', { message: '🤖 [Agent 05 - Virality Evaluator] Analyzing script retention markers...', type: 'agent' });
    
    // Resolve niche mapping to get matching viral reference templates
    const resolveNiche = (topicStr: string, kws: string[]): string => {
      const combined = `${topicStr} ${kws.join(" ")}`.toLowerCase();
      if (combined.includes("code") || combined.includes("tech") || combined.includes("developer") || combined.includes("software") || combined.includes("ai") || combined.includes("terminal") || combined.includes("api") || combined.includes("automation")) {
        return "tech";
      }
      if (combined.includes("lead") || combined.includes("business") || combined.includes("marketing") || combined.includes("sales") || combined.includes("growth") || combined.includes("traffic") || combined.includes("client")) {
        return "business";
      }
      if (combined.includes("tax") || combined.includes("finance") || combined.includes("money") || combined.includes("saving") || combined.includes("invest") || combined.includes("wealth") || combined.includes("rupee") || combined.includes("dollar")) {
        return "finance";
      }
      if (combined.includes("productivity") || combined.includes("habit") || combined.includes("focus") || combined.includes("time") || combined.includes("planner")) {
        return "productivity";
      }
      if (combined.includes("edit") || combined.includes("video") || combined.includes("design") || combined.includes("creative") || combined.includes("frame")) {
        return "creative";
      }
      return "general";
    };

    const targetNiche = resolveNiche(topic, keywords);
    const matchingTemplates = getMatchingTemplates(targetNiche, 2);

    // Step 1: Grade the script
    const gradingSystemPrompt = `You are a script evaluator. Grade the script out of 100 based on hook strength, pacing, emotional triggers, value, and comment-based CTA. Compare the script against the provided proven viral templates. Return raw JSON: {"score": number, "critique": "brief critique text"}`;
    const gradingUserPrompt = `Script:
${scriptText}

Topic: ${topic}
Keywords: ${keywords.join(", ")}

### PROVEN VIRAL REFERENCE TEMPLATES TO BENCHMARK AGAINST:
${matchingTemplates.map((t, idx) => `
Template ${idx + 1}:
- Hook Pattern: "${t.hook}"
- Structured Script:
${t.structure}
- Why it works: ${t.keyTakeaway}
`).join("\n")}`;

    const gradingCompletion = await openai.chat.completions.create({
      model: getModelName(),
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: gradingSystemPrompt },
        { role: "user", content: gradingUserPrompt }
      ]
    });

    const gradeResult = JSON.parse(gradingCompletion.choices[0].message.content || "{}");
    const initialScore = gradeResult.score || 75;
    const initialCritique = gradeResult.critique || "Moderate quality script.";

    sendEvent('log', { message: `📊 Initial script virality score: ${initialScore}%`, type: 'info' });

    if (initialScore >= 80) {
      sendEvent('log', { message: `✅ Script passed virality threshold of 80%!`, type: 'success' });
      return { script: scriptText, score: initialScore, critique: initialCritique };
    }

    // Step 2: Self-correction rewrite
    sendEvent('log', { message: `⚠️ Score ${initialScore}% is below threshold. Launching Agentic Self-Correction Loop...`, type: 'warn' });
    
    const writerSystemPrompt = `You are a viral scriptwriter. Rewrite the provided script to optimize its virality. Use a Hinglish creator tone.
Address the critique: "${initialCritique}".
Model the script's hook, pacing, and CTA structure after the provided proven viral templates.
Ensure:
1. Start with an immediate attention-disrupting hook (first 3s).
2. Maintain short, snappy sentence pacing.
3. Explicitly ask viewers to comment a specific keyword to trigger the DM automation.
Output JSON only: {"script": "full rewritten script text"}`;

    const rewritePrompt = `Original Script:
${scriptText}

Voice Profile:
- Vocabulary: ${JSON.stringify(voiceProfile.vocabulary)}
- Sentence Length: ${voiceProfile.sentenceLength}
- Energy: ${voiceProfile.energy}

### PROVEN VIRAL REFERENCE TEMPLATES TO MODEL AFTER:
${matchingTemplates.map((t, idx) => `
Template ${idx + 1}:
- Hook: "${t.hook}"
- Structure:
${t.structure}
- Key Takeaway: ${t.keyTakeaway}
`).join("\n")}

Rewrite the script to optimize it based on the critiques and reference templates. Return only JSON.`;

    const rewriteCompletion = await openai.chat.completions.create({
      model: getModelName(),
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: writerSystemPrompt },
        { role: "user", content: rewritePrompt }
      ]
    });

    const rewriteResult = JSON.parse(rewriteCompletion.choices[0].message.content || "{}");
    const rewrittenScript = rewriteResult.script || scriptText;

    // Step 3: Grade rewritten script
    sendEvent('log', { message: '🤖 Re-evaluating optimized script...', type: 'agent' });
    
    const finalGradingCompletion = await openai.chat.completions.create({
      model: getModelName(),
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: gradingSystemPrompt },
        { role: "user", content: `Script:\n${rewrittenScript}\n\nTopic: ${topic}\n\n### PROVEN VIRAL REFERENCE TEMPLATES:\n${matchingTemplates.map((t, idx) => `Template ${idx + 1}: ${t.hook}\n${t.structure}`).join("\n")}` }
      ]
    });

    const finalGradeResult = JSON.parse(finalGradingCompletion.choices[0].message.content || "{}");
    const finalScore = finalGradeResult.score || 85;
    const finalCritique = finalGradeResult.critique || "Optimized script.";

    sendEvent('log', { message: `🚀 Self-correction complete. Final Virality Score: ${finalScore}%`, type: 'success' });
    
    return {
      script: rewrittenScript,
      score: finalScore,
      critique: finalCritique
    };

  } catch (err: any) {
    sendEvent('log', { message: `⚠️ Virality optimization error: ${err.message}. Defaulting to original script.`, type: 'warn' });
    const sim = getSimulatedViralityScore(scriptText, topic);
    return { script: scriptText, ...sim };
  }
}

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();
  
  let topic = "How to build local AI agents in terminal";
  let weights = { views: 40, engagement: 35, comments: 25 };
  let filters = { minViews: 10000, minEngagement: 2.0, maxDaysOld: 30 };
  let keywords = ["Claude Code", "AI agents", "N8N"];
  let competitors = ["@heybarsee", "@rowancheung"];
  let voiceScripts: string[] = [];

  try {
    const body = await req.json();
    if (body.topic) topic = body.topic;
    if (body.weights) weights = body.weights;
    if (body.filters) filters = body.filters;
    if (body.keywords && body.keywords.length > 0) keywords = body.keywords;
    if (body.competitors && body.competitors.length > 0) competitors = body.competitors;
    if (body.voiceScripts) voiceScripts = body.voiceScripts;
  } catch (e) {
    // Fallback to default values
  }

  const customStream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: string, data: any) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

      try {
        sendEvent('log', { message: '🚀 Starting AI Content Pipeline...', type: 'system' });
        await delay(300);

        if (isUsingOpenRouter) {
          sendEvent('log', { message: `🔑 OPENROUTER_API_KEY detected. Booting Live DeepSeek Mode (${getModelName()})...`, type: 'success' });
        } else if (process.env.OPEN_AI_KEY) {
          sendEvent('log', { message: '🔑 OPEN_AI_KEY detected. Booting Live OpenAI Mode...', type: 'info' });
        } else if (process.env.GEMINI_API_KEY) {
          sendEvent('log', { message: '🔑 GEMINI_API_KEY detected. Booting Live Gemini Mode...', type: 'info' });
        } else {
          sendEvent('log', { message: '⚠️ No API keys found. Running in Simulated Mode...', type: 'warn' });
        }
        await delay(400);

        // ==========================================
        // AGENT 01: CONTENT SCRAPER
        // ==========================================
        sendEvent('log', { message: '🤖 [Agent 01 - Content Scraper] Initialized.', type: 'agent' });
        sendEvent('progress', { percent: 10, stage: 'scraper', message: 'Configuring Scraping targets...' });
        await delay(400);
        
        sendEvent('log', { message: `🔍 Keywords targeted: ${keywords.join(', ')}`, type: 'info' });
        sendEvent('log', { message: `📱 Competitors targeted: ${competitors.join(', ')}`, type: 'info' });
        await delay(300);
        
        let scrapedPosts: any[] = [];

        // Scrape YouTube Shorts
        sendEvent('progress', { percent: 20, stage: 'scraper', message: 'Scraping YouTube Shorts...' });
        for (const kw of keywords) {
          sendEvent('log', { message: `🎥 Scraping YouTube for Shorts matching: "${kw}"`, type: 'info' });
          try {
            const ytPosts = await scrapeYouTubeShorts(kw);
            if (ytPosts.length > 0) {
              sendEvent('log', { message: `✅ Found ${ytPosts.length} Shorts for keyword: "${kw}"`, type: 'success' });
              scrapedPosts = [...scrapedPosts, ...ytPosts];
            } else {
              sendEvent('log', { message: `ℹ️ No Shorts found for "${kw}" on YouTube.`, type: 'info' });
            }
          } catch (err: any) {
            sendEvent('log', { message: `⚠️ YouTube Scraper failed for "${kw}": ${err.message}`, type: 'warn' });
          }
          await delay(300);
        }

        // Scrape Instagram Reels
        sendEvent('progress', { percent: 35, stage: 'scraper', message: 'Scraping Instagram Reels...' });
        for (const comp of competitors) {
          sendEvent('log', { message: `📸 Scraping Instagram profile: ${comp}`, type: 'info' });
          try {
            const igPosts = await scrapeInstagramProfile(comp);
            if (igPosts.length > 0) {
              sendEvent('log', { message: `✅ Found ${igPosts.length} reels for competitor: ${comp}`, type: 'success' });
              scrapedPosts = [...scrapedPosts, ...igPosts];
            } else {
              sendEvent('log', { message: `ℹ️ No posts found for competitor ${comp} (Check sessionid cookie).`, type: 'info' });
            }
          } catch (err: any) {
            sendEvent('log', { message: `⚠️ Instagram Scraper failed for "${comp}": ${err.message}`, type: 'warn' });
          }
          await delay(300);
        }

        if (scrapedPosts.length === 0) {
          sendEvent('log', { message: '⚠️ Scraped raw outputs were empty. Initializing dynamic simulated fallback...', type: 'warn' });
          const fallback = generateLocalContent(topic, keywords, competitors, weights, filters, voiceScripts);
          scrapedPosts = fallback.scrapedPosts;
          await delay(500);
        }

        sendEvent('log', { message: `💾 Scraping complete. Total raw posts collected: ${scrapedPosts.length}`, type: 'success' });
        await delay(300);

        // ==========================================
        // AGENT 02: VALIDATOR
        // ==========================================
        sendEvent('log', { message: '🤖 [Agent 02 - Validation Agent] Initialized.', type: 'agent' });
        sendEvent('progress', { percent: 50, stage: 'validator', message: 'Evaluating content scoring & filtering...' });
        await delay(400);

        const wViews = weights.views;
        const wEr = weights.engagement;
        const wComments = weights.comments;
        sendEvent('log', { message: `⚖️ Applied weights -> Views: ${wViews}%, ER: ${wEr}%, Comments: ${wComments}%`, type: 'info' });

        const processedPosts = scrapedPosts.map((p, idx) => {
          const er = p.er || parseFloat(((((p.likes || 0) + (p.comments || 0)) / (p.views || 1)) * 100).toFixed(2));
          const isViral = er > 5.0 || p.views > 100000;
          return { ...p, id: p.id || `post_${idx}`, er, isViral };
        });

        const maxViews = Math.max(...processedPosts.map(p => p.views), 1);
        const maxER = Math.max(...processedPosts.map(p => p.er), 1);
        const maxComments = Math.max(...processedPosts.map(p => p.comments), 1);

        const validatedPosts = processedPosts.map(post => {
          const vScore = (post.views / maxViews) * 10;
          const erScore = (post.er / maxER) * 10;
          const cScore = (post.comments / maxComments) * 10;
          const score = parseFloat(((vScore * (wViews / 100)) + (erScore * (wEr / 100)) + (cScore * (wComments / 100))).toFixed(2));
          return { ...post, score };
        }).filter(post => post.views >= filters.minViews && post.er >= filters.minEngagement);

        validatedPosts.sort((a, b) => b.score - a.score);

        // Build Topic Clusters
        const clusters: { name: string; count: number; avgViews: number; avgER: number }[] = [];
        for (const kw of keywords) {
          const matching = validatedPosts.filter(p => 
            p.caption?.toLowerCase().includes(kw.toLowerCase()) || 
            p.transcript?.toLowerCase().includes(kw.toLowerCase())
          );
          if (matching.length > 0) {
            const sumViews = matching.reduce((acc, p) => acc + p.views, 0);
            const sumER = matching.reduce((acc, p) => acc + p.er, 0);
            clusters.push({
              name: `${kw} & Related Automation`,
              count: matching.length,
              avgViews: Math.round(sumViews / matching.length),
              avgER: parseFloat((sumER / matching.length).toFixed(2))
            });
          }
        }

        if (clusters.length === 0) {
          clusters.push({
            name: `${keywords[0] || "General"} Trend Optimization`,
            count: validatedPosts.length || 1,
            avgViews: Math.round(validatedPosts.reduce((acc, p) => acc + p.views, 0) / (validatedPosts.length || 1)),
            avgER: parseFloat((validatedPosts.reduce((acc, p) => acc + p.er, 0) / (validatedPosts.length || 1)).toFixed(2))
          });
        }

        await delay(300);

        // ==========================================
        // AGENT 03 & 04: GENERATION STAGES
        // ==========================================
        sendEvent('log', { message: '🤖 [Agent 03 - Script Writer] Initialized.', type: 'agent' });
        sendEvent('progress', { percent: 65, stage: 'writer', message: 'Analyzing voice profile...' });
        await delay(400);

        sendEvent('log', { message: '🤖 [Agent 04 - Hook Generator] Initialized.', type: 'agent' });
        sendEvent('progress', { percent: 80, stage: 'hooks', message: 'Generating viral script draft and hooks...' });
        await delay(300);

        let payload: PipelinePayload;

        const systemInstruction = "You are a creator content backend. Generate a JSON payload containing scrapedPosts, topics, voiceProfile, script, hooks, recommendedHook based on prompt instructions. You MUST output a raw JSON object matching the requested schema exactly.";
        const userPrompt = `Generate a content engine JSON payload for topic: "${topic}", keywords: ${JSON.stringify(keywords)}, competitors: ${JSON.stringify(competitors)}, and voice scripts: ${JSON.stringify(voiceScripts)}. Ensure the script and hooks use a natural Hinglish creator tone. Output structure must exactly match:
{
  "scrapedPosts": ${JSON.stringify(processedPosts.slice(0, 6))},
  "topics": ${JSON.stringify(clusters.slice(0, 3))},
  "voiceProfile": {
    "vocabulary": ["Dosto", "literally", "crazy", "jhanjhat", "Suno"],
    "sentenceLength": "10-15 words (punchy & conversational)",
    "hinglishPattern": "65% Hindi / 35% Eng",
    "energy": "High energy, enthusiastic, authoritative"
  },
  "script": "[BEAT 1]\\nSuno yaar...\\n\\n[BEAT 2]\\n...\\n\\n[BEAT 3]\\n...\\n\\n[CTA]\\n...",
  "hooks": [
    {"id": "hook_1", "pattern": "Aisi honi chahiye X (Aspirational)", "text": "Hinglish hook 1 here", "confidence": 9.2, "explanation": "Explanation"},
    {"id": "hook_2", "pattern": "Pain Point Frustration", "text": "Hinglish hook 2 here", "confidence": 8.9, "explanation": "Explanation"},
    {"id": "hook_3", "pattern": "Log nahi jaante (Exclusivity)", "text": "Hinglish hook 3 here", "confidence": 9.5, "explanation": "Explanation"},
    {"id": "hook_4", "pattern": "Time or money claim", "text": "Hinglish hook 4 here", "confidence": 8.5, "explanation": "Explanation"},
    {"id": "hook_5", "pattern": "Curiosity Gap", "text": "Hinglish hook 5 here", "confidence": 9.1, "explanation": "Explanation"}
  ],
  "recommendedHook": {"id": "hook_3", "pattern": "Log nahi jaante (Exclusivity)", "text": "Hinglish hook 3 here", "confidence": 9.5, "explanation": "Explanation"}
}`;

        if (isUsingOpenRouter || process.env.OPEN_AI_KEY) {
          try {
            const apiLabel = isUsingOpenRouter ? "OpenRouter (DeepSeek)" : "OpenAI (GPT-4o-mini)";
            sendEvent('log', { message: `🤖 [AI Generator] Querying ${apiLabel} for screenplay...`, type: 'agent' });
            
            const completion = await openai.chat.completions.create({
              model: getModelName(),
              response_format: { type: "json_object" },
              messages: [
                { role: "system", content: systemInstruction },
                { role: "user", content: userPrompt }
              ]
            });

            const resultJson = JSON.parse(completion.choices[0].message.content || "{}");
            
            if (resultJson.script && resultJson.hooks) {
              payload = {
                scrapedPosts: processedPosts,
                validatedPosts: validatedPosts,
                topics: resultJson.topics || clusters,
                voiceProfile: resultJson.voiceProfile || {
                  vocabulary: ["Dosto", "literally", "crazy", "jhanjhat", "Suno"],
                  sentenceLength: "10-15 words (punchy & conversational)",
                  hinglishPattern: "65% Hindi / 35% Eng",
                  energy: "High energy, enthusiastic, authoritative"
                },
                script: resultJson.script,
                hooks: resultJson.hooks,
                recommendedHook: resultJson.recommendedHook || resultJson.hooks[2]
              };
              sendEvent('log', { message: `✅ Successfully compiled response from ${apiLabel}.`, type: 'success' });
            } else {
              throw new Error("Missing script or hooks in LLM response JSON.");
            }
          } catch (err: any) {
            sendEvent('log', { message: `⚠️ AI completion error: ${err.message}. Running Simulated Fallback...`, type: 'warn' });
            payload = generateLocalContent(topic, keywords, competitors, weights, filters, voiceScripts);
          }
        } else if (process.env.GEMINI_API_KEY) {
          try {
            sendEvent('log', { message: '🤖 [AI Generator] Querying Gemini for screenplay...', type: 'agent' });
            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
            const geminiRes = await fetch(geminiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{
                  role: "user",
                  parts: [{ text: `${systemInstruction}\n\n${userPrompt}` }]
                }],
                generationConfig: { responseMimeType: "application/json" }
              })
            });

            if (!geminiRes.ok) throw new Error(`Gemini API status ${geminiRes.status}`);

            const responseJson = await geminiRes.json();
            const responseText = responseJson.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!responseText) throw new Error("Empty response from Gemini API");

            const cleanJsonString = (str: string): string => {
              let cleaned = str.trim();
              if (cleaned.startsWith("```json")) cleaned = cleaned.substring(7);
              else if (cleaned.startsWith("```")) cleaned = cleaned.substring(3);
              if (cleaned.endsWith("```")) cleaned = cleaned.substring(0, cleaned.length - 3);
              return cleaned.trim();
            };

            const resultJson = JSON.parse(cleanJsonString(responseText) || "{}");
            
            if (resultJson.script && resultJson.hooks) {
              payload = {
                scrapedPosts: processedPosts,
                validatedPosts: validatedPosts,
                topics: resultJson.topics || clusters,
                voiceProfile: resultJson.voiceProfile || {
                  vocabulary: ["Dosto", "literally", "crazy", "jhanjhat", "Suno"],
                  sentenceLength: "10-15 words (punchy & conversational)",
                  hinglishPattern: "65% Hindi / 35% Eng",
                  energy: "High energy, enthusiastic, authoritative"
                },
                script: resultJson.script,
                hooks: resultJson.hooks,
                recommendedHook: resultJson.recommendedHook || resultJson.hooks[2]
              };
              sendEvent('log', { message: '✅ Successfully compiled response from Gemini.', type: 'success' });
            } else {
              throw new Error("Missing script or hooks in Gemini response.");
            }
          } catch (err: any) {
            sendEvent('log', { message: `⚠️ Gemini completed with error: ${err.message}. Using simulated fallback...`, type: 'warn' });
            payload = generateLocalContent(topic, keywords, competitors, weights, filters, voiceScripts);
          }
        } else {
          payload = generateLocalContent(topic, keywords, competitors, weights, filters, voiceScripts);
        }

        // Output results details to console
        payload.scrapedPosts.slice(0, 4).forEach(p => {
          if (p.isViral) {
            sendEvent('log', { message: `🔥 [VIRAL SIGNAL] ${p.platform.toUpperCase()} post by ${p.handle} - ${p.views.toLocaleString()} views, ${p.er}% ER`, type: 'success' });
          }
        });
        await delay(300);

        sendEvent('log', { message: `📂 Formed ${payload.topics.length} topic clusters. Top: "${payload.topics[0].name}"`, type: 'success' });
        await delay(300);

        sendEvent('log', { message: `✍️ Voice profile established: Hinglish mix (${payload.voiceProfile.hinglishPattern})`, type: 'info' });
        await delay(200);

        sendEvent('log', { message: '📝 Completed script draft structure. Running Virality Verification...', type: 'success' });
        await delay(200);

        const viralityOpt = await optimizeScriptVirality(
          payload.script,
          topic,
          keywords,
          payload.voiceProfile,
          sendEvent
        );

        payload.script = viralityOpt.script;
        payload.viralityScore = viralityOpt.score;
        payload.viralityCritique = viralityOpt.critique;

        sendEvent('progress', { percent: 100, stage: 'complete', message: 'Pipeline successfully completed!' });
        sendEvent('log', { message: '🎉 Pipeline Complete! Transporting package payload...', type: 'system' });
        await delay(200);

        sendEvent('result', payload);
      } catch (err: any) {
        sendEvent('log', { message: `❌ Error: ${err.message}`, type: 'error' });
      } finally {
        controller.close();
      }
    }
  });

  return new Response(customStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
  });
}
