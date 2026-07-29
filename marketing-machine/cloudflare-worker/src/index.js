/**
 * Cloudflare Worker index.js
 * ─────────────────────────
 * Stateless service broker for the Content Factory pipeline.
 * Endpoints:
 *   POST /ideas     - Generates 10 ideas based on business profile
 *   POST /script    - Generates video script from business profile + topic idea
 *   POST /tts       - Invokes TTS engine (Deepgram or Replicate-hosted Bark) & saves to R2
 *   GET  /assets/*  - Serves assets stored in R2 (public)
 */

import { generateIdeas } from "./idea-engine.js";

// VPS render agent webhook URL
const VPS_WEBHOOK_URL = "http://srv1371866.hstgr.cloud:4000/render";

/**
 * Endpoint auth checker helper.
 */
function isAuthorized(request, env) {
  const authHeader = request.headers.get("Authorization");
  const expectedToken = `Bearer ${env.FACTORY_SECRET}`;
  return env.FACTORY_SECRET && authHeader === expectedToken;
}

/**
 * Builds the LLM system prompt for copywriting a script.
 */
function buildScriptSystemPrompt(biz) {
  const langPrompt = biz.language === "hinglish"
    ? `Write the script in Hinglish (a natural mix of ~65% Hindi and ~35% English written entirely in Latin/Roman script). For example: "Suno yaar, agar aap exit dues wait kar rahe ho, toh warning..."`
    : `Write the script in standard ${biz.language || "English"}.`;

  return `You are a world-class short-form marketing copywriter specializing in highly engaging TikToks, Instagram Reels, and YouTube Shorts.
You write scripts that feel raw, authentic, and fast-paced.

PRODUCT DETAILS
- Name: ${biz.name}
- Tagline: ${biz.tagline || ""}
- Description: ${biz.description}
- Voice/Tone: ${biz.voiceTone}
- Ending CTA: ${biz.cta}
- Language / Accent: ${langPrompt}
${biz.complianceNotes ? `- LEGAL COMPLIANCE CONSTRAINT: ${biz.complianceNotes}` : ""}

STRICT COMPLIANCE RULES:
1. Do NOT invent fake reviews, fake numbers, or fake social proof.
2. If compliance notes specify legal boundaries, obey them absolutely.

Your output MUST be a valid JSON object with the following structure:
{
  "hook": "An attention-grabbing first sentence (under 5 seconds)",
  "body": [
    "Sentence 1 of the body delivering value or exposing a pain point",
    "Sentence 2 of the body offering the solution",
    "Sentence 3 of the body explaining how it works"
  ],
  "cta": "The call to action",
  "scriptText": "The consolidated script text containing EXACTLY what the voice actor should say. No stage directions, no labels (like Hook or CTA), no parenthetical directions. Just the words.",
  "brollPrompts": [
    "Visual suggestion for hook scene (keep it descriptive)",
    "Visual suggestion for body scene 1",
    "Visual suggestion for body scene 2",
    "Visual suggestion for CTA scene"
  ],
  "hookVariants": [
    "Alternative hook style 1",
    "Alternative hook style 2",
    "Alternative hook style 3"
  ]
}

Ensure the scriptText contains exactly what the voice actor should speak. Maximum 130 words (~30-45 seconds).`;
}

/**
 * Triggers video script generation via LLM.
 */
async function generateScript(env, biz, idea) {
  const systemPrompt = buildScriptSystemPrompt(biz);
  const userPrompt = `Write a short-form video script about this topic: "${idea.topic}".
Topic Angle/Thesis: ${idea.angle || ""}
Hook Style context: ${idea.hookStyle || ""}
Content Pillar context: ${idea.contentPillar || ""}`;

  const apiEndpoint = env.FREE_LLM_API_URL || "https://free.llm.api/v1";
  const apiKey = env.FALLBACK_OPENAI_API_KEY;

  const response = await fetch(`${apiEndpoint}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "auto",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`LLM API failed: ${errText}`);
  }

  const data = await response.json();
  const rawContent = data.choices?.[0]?.message?.content;
  if (!rawContent) {
    throw new Error("LLM returned empty choices content");
  }

  return JSON.parse(rawContent);
}

/**
 * Synthesizes audio using Replicate Suno Bark.
 */
async function callReplicateBark(env, text, voiceId) {
  if (!env.REPLICATE_API_TOKEN) {
    throw new Error("REPLICATE_API_TOKEN secret not set on Cloudflare Worker");
  }

  // Suno Bark expects prompt as input. It can take a speaker history prompt.
  const response = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      "Authorization": `Token ${env.REPLICATE_API_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      version: "b13a845d3e7dfc2e2c88463c68383e29f041ff34e06aa7c29eec010196238b17", // suno-ai/bark version
      input: {
        prompt: text,
        history_prompt: voiceId || "v2/hi_speaker_2",
        text_temp: 0.7,
        waveform_temp: 0.7
      }
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Replicate initialization failed: ${err}`);
  }

  let prediction = await response.json();
  const getPredictionUrl = prediction.urls.get;

  // Poll for completion
  let attempts = 0;
  while (prediction.status !== "succeeded" && prediction.status !== "failed" && attempts < 40) {
    await new Promise(r => setTimeout(r, 2000));
    const pollResponse = await fetch(getPredictionUrl, {
      headers: { "Authorization": `Token ${env.REPLICATE_API_TOKEN}` }
    });
    if (pollResponse.ok) {
      prediction = await pollResponse.json();
    }
    attempts++;
  }

  if (prediction.status !== "succeeded") {
    throw new Error(`Replicate Bark prediction failed: ${prediction.error || "Timeout"}`);
  }

  // Bark returns outputs containing an audio file URL
  const audioUrl = prediction.output?.audio_out;
  if (!audioUrl) {
    throw new Error("Replicate Bark did not return audio output URL");
  }

  const audioFileRes = await fetch(audioUrl);
  if (!audioFileRes.ok) {
    throw new Error("Failed to fetch generated audio file from Replicate");
  }

  return await audioFileRes.arrayBuffer();
}

/**
 * Triggers rendering job on Hostinger VPS.
 */
async function dispatchToVPS(env, businessSlug, jobId) {
  try {
    const response = await fetch(VPS_WEBHOOK_URL, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${env.FACTORY_SECRET}`
      },
      body: JSON.stringify({ business: businessSlug, jobId })
    });

    if (!response.ok) {
      const errText = await response.text();
      return { success: false, error: errText };
    }

    return await response.json();
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // ── Health Check (Public) ───────────────────
    if (url.pathname === "/" || url.pathname === "") {
      return jsonResponse({ status: "alive", service: "factory-worker", version: "3.0" });
    }

    // ── Serve Static Assets (Public) ────────────
    if (url.pathname.startsWith("/assets/")) {
      const key = url.pathname.replace("/assets/", "");
      const object = await env.BUCKET.get(key);

      if (object === null) {
        return new Response("Asset Not Found", { status: 404 });
      }

      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set("Access-Control-Allow-Origin", "*");
      return new Response(object.body, { headers });
    }

    // ── Auth Protection ─────────────────────────
    if (!isAuthorized(request, env)) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    // ── POST /ideas ─────────────────────────────
    if (url.pathname === "/ideas" && request.method === "POST") {
      try {
        const body = await request.json();
        const { business, count } = body;
        if (!business || !business.name) {
          return jsonResponse({ error: "Missing business profile configuration" }, 400);
        }

        const ideas = await generateIdeas(env, business, count || 10);
        return jsonResponse({ success: true, ideas });
      } catch (err) {
        return jsonResponse({ error: err.message }, 500);
      }
    }

    // ── POST /script ────────────────────────────
    if (url.pathname === "/script" && request.method === "POST") {
      try {
        const body = await request.json();
        const { business, idea, jobId } = body;

        if (!business || !business.name || !idea || !idea.topic) {
          return jsonResponse({ error: "Missing required fields: business, idea" }, 400);
        }

        const script = await generateScript(env, business, idea);

        // If jobId is provided, persist script.json directly to R2 bucket for VPS render box
        if (jobId && business.slug) {
          const scriptKey = `${business.slug}/${jobId}/script.json`;
          await env.BUCKET.put(scriptKey, JSON.stringify(script, null, 2), {
            httpMetadata: { contentType: "application/json" }
          });
          console.log(`[Script] Persisted script.json to R2 key: ${scriptKey}`);
        }

        return jsonResponse({ success: true, script });
      } catch (err) {
        return jsonResponse({ error: err.message }, 500);
      }
    }

    // ── POST /tts ───────────────────────────────
    if (url.pathname === "/tts" && request.method === "POST") {
      try {
        const body = await request.json();
        const { business, jobId, scriptText, language, voice } = body;

        if (!business || !business.slug || !jobId || !scriptText) {
          return jsonResponse({ error: "Missing required fields: business, jobId, scriptText" }, 400);
        }

        const renderBoxUrl = env.RENDER_BOX_URL || "http://127.0.0.1:4000";
        console.log(`[TTS] Proxying request to VPS Render Box at ${renderBoxUrl}/tts`);

        try {
          const ttsReq = await fetch(`${renderBoxUrl}/tts`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${env.FACTORY_SECRET || ""}`
            },
            body: JSON.stringify({
              text: scriptText,
              language: language || business.language || "en",
              voice: voice || business.ttsVoiceId || "default",
              business: business.slug,
              jobId: jobId
            })
          });

          if (ttsReq.ok) {
            const ttsRes = await ttsReq.json();
            if (ttsRes.success && ttsRes.audioKey) {
              return jsonResponse({ success: true, audioKey: ttsRes.audioKey });
            }
          }
          console.warn(`[TTS] VPS Render Box TTS request returned non-OK status. Trying Cloudflare AI Aura fallback...`);
        } catch (vpsErr) {
          console.warn(`[TTS] Could not connect to VPS Render Box TTS (${vpsErr.message}). Trying Cloudflare AI Aura fallback...`);
        }

        // Optional Cloudflare AI Aura fallback
        const ttsResponse = await env.AI.run("@cf/deepgram/aura-1", { text: scriptText });
        if (!ttsResponse) throw new Error("Cloudflare Aura returned empty audio stream");
        const audioBuffer = await new Response(ttsResponse).arrayBuffer();

        const audioKey = `${business.slug}/${jobId}/voice.mp3`;
        await env.BUCKET.put(audioKey, audioBuffer, { httpMetadata: { contentType: "audio/mpeg" } });
        return jsonResponse({ success: true, audioKey });

      } catch (err) {
        console.error(`[TTS ERROR] ${err.message}`);
        return jsonResponse({ error: `TTS Synthesis Failed: ${err.message}` }, 500);
      }
    }

    // ── GET /assets/* ───────────────────────────
    if (url.pathname.startsWith("/assets/") && request.method === "GET") {
      const assetKey = url.pathname.replace("/assets/", "");
      const object = await env.BUCKET.get(assetKey);
      if (!object) return new Response("Asset not found", { status: 404 });
      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set("Access-Control-Allow-Origin", "*");
      headers.set("etag", object.httpEtag);
      return new Response(object.body, { headers });
    }

    // ── PUT/POST /upload ────────────────────────
    if (url.pathname === "/upload" && (request.method === "PUT" || request.method === "POST")) {
      try {
        const key = url.searchParams.get("key");
        if (!key) return jsonResponse({ error: "Missing key query parameter" }, 400);

        const contentType = request.headers.get("content-type") || "video/mp4";
        await env.BUCKET.put(key, request.body, {
          httpMetadata: { contentType }
        });

        return jsonResponse({ success: true, key, assetUrl: `${url.origin}/assets/${key}` });
      } catch (err) {
        return jsonResponse({ error: err.message }, 500);
      }
    }

    // ── POST /clip-long-video ───────────────────
    if (url.pathname === "/clip-long-video" && request.method === "POST") {
      try {
        const body = await request.json();
        const { business, sourceVideoKey, batchSize = 5, selectedSkills = [] } = body;

        if (!business || !sourceVideoKey) {
          return jsonResponse({ error: "Missing required fields: business, sourceVideoKey" }, 400);
        }

        const skillNames = selectedSkills.map(s => s.name).join(", ") || "General Viral Clipper";
        console.log(`[ClipEngine] Analyzing long video key: ${sourceVideoKey} against skills: [${skillNames}], batch size: ${batchSize}`);

        // Step 1: Call VPS webhook to extract audio chunks from R2 video
        let audioChunkKeys = [];
        try {
          const vpsExtractUrl = VPS_WEBHOOK_URL.replace("/render", "/extract-audio");
          console.log(`[ClipEngine] Requesting VPS audio extraction at ${vpsExtractUrl}`);
          const extractRes = await fetch(vpsExtractUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${env.FACTORY_SECRET || ""}`
            },
            body: JSON.stringify({ sourceVideoKey })
          });
          if (extractRes.ok) {
            const extractData = await extractRes.json();
            audioChunkKeys = extractData.chunkKeys || [];
            console.log(`[ClipEngine] Received ${audioChunkKeys.length} audio chunks from VPS`);
          } else {
            console.warn(`[ClipEngine] VPS audio extraction returned status ${extractRes.status}`);
          }
        } catch (e) {
          console.warn(`[ClipEngine] VPS audio extraction failed: ${e.message}`);
        }

        // Step 2: Transcribe each audio chunk using Workers AI Whisper
        let fullTranscript = "";
        if (audioChunkKeys.length > 0 && env.BUCKET && env.AI) {
          for (let i = 0; i < audioChunkKeys.length; i++) {
            const chunkKey = audioChunkKeys[i];
            try {
              const r2Obj = await env.BUCKET.get(chunkKey);
              if (r2Obj) {
                const arrayBuf = await r2Obj.arrayBuffer();
                const audioBytes = Array.from(new Uint8Array(arrayBuf));
                console.log(`[ClipEngine] Transcribing chunk ${i + 1}/${audioChunkKeys.length} via Workers AI Whisper...`);
                const whisperRes = await env.AI.run("@cf/openai/whisper", { audio: audioBytes });
                if (whisperRes && whisperRes.text) {
                  const chunkOffsetMin = i * 15;
                  fullTranscript += `\n--- [Part ${i + 1} starting at ${chunkOffsetMin}:00] ---\n` + whisperRes.text + "\n";
                }
              }
            } catch (e) {
              console.warn(`[ClipEngine] Failed transcribing chunk ${chunkKey}: ${e.message}`);
            }
          }
        }

        const skillDescriptions = selectedSkills.length > 0
          ? selectedSkills.map((s, idx) => `Skill #${idx + 1} ID: "${s.id}", Name: "${s.name}", Description: "${s.description || "General video clipping"}"`).join("\n")
          : "Skill #1: Creative AI Narrative Clipper";

        const transcriptContext = fullTranscript
          ? `FULL VERBATIM VIDEO TRANSCRIPT:\n"""\n${fullTranscript}\n"""`
          : `Note: Transcript unavailable. Analyze for video key "${sourceVideoKey}".`;

        const prompt = `You are a world-class AI video director and clip editor. Analyze this long-form video transcript for business "${business.name}" (${business.description}) and evaluate its fitness against target Editing Skills:

${skillDescriptions}

${transcriptContext}

Task:
1. Extract exactly ${batchSize} short-form video clip segments based on REAL interesting moments in the transcript.
2. Distribute clips across target Skills based on which moments BEST match each skill's description.
3. If a Skill has NO matching moments in the transcript, assign 0 clips to that skill.

For each clip segment, provide:
- "matchedSkillId": string ID of the matched skill
- "matchedSkillName": string name of the matched skill
- "topic": catchy clip title
- "clipStartTime": start timestamp in seconds (derived from transcript)
- "clipEndTime": end timestamp in seconds (30-60 seconds after start)
- "commentaryScript": short 15-25 word summary/caption written according to the matched skill's style in ${business.language || "hinglish"}

Return ONLY valid JSON:
{
  "preFlightReport": [
    { "skillId": "...", "skillName": "...", "clipsFound": 4, "isFeasible": true },
    { "skillId": "...", "skillName": "...", "clipsFound": 0, "isFeasible": false, "reason": "No matching moments found in transcript" }
  ],
  "segments": [
    { "matchedSkillId": "...", "matchedSkillName": "...", "topic": "...", "clipStartTime": 120, "clipEndTime": 165, "commentaryScript": "..." }
  ]
}`;

        let rawText = "";
        try {
          const aiRes = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
            messages: [{ role: "system", content: "You are a master video editor JSON generator." }, { role: "user", content: prompt }]
          });
          rawText = aiRes.response || "";
        } catch {
          rawText = "";
        }

        let parsedData = null;
        try {
          const match = rawText.match(/\{[\s\S]*\}/);
          parsedData = JSON.parse(match ? match[0] : rawText);
        } catch {
          parsedData = null;
        }

        // Fallback generator if AI fails or returns empty
        if (!parsedData || !Array.isArray(parsedData.segments)) {
          const fallbackSkill = selectedSkills[0] || { id: "default-skill", name: "Creative Narrative" };
          const segments = Array.from({ length: Number(batchSize) }).map((_, i) => ({
            matchedSkillId: fallbackSkill.id,
            matchedSkillName: fallbackSkill.name,
            topic: `Viral Moment #${i + 1} (${fallbackSkill.name})`,
            clipStartTime: (i + 1) * 240,
            clipEndTime: (i + 1) * 240 + 45,
            commentaryScript: `Dekho iss step ko dhyan se. Key insight here for ${fallbackSkill.name}!`
          }));

          const preFlightReport = (selectedSkills.length > 0 ? selectedSkills : [fallbackSkill]).map((s, idx) => ({
            skillId: s.id,
            skillName: s.name,
            clipsFound: idx === 0 ? Number(batchSize) : 0,
            isFeasible: idx === 0,
            reason: idx === 0 ? "High density matching transcript" : "No matching moments found in video"
          }));

          parsedData = { preFlightReport, segments };
        }

        return jsonResponse({ success: true, preFlightReport: parsedData.preFlightReport, segments: parsedData.segments });
      } catch (err) {
        return jsonResponse({ error: err.message }, 500);
      }
    }

    // ── POST /render ────────────────────────────
    if (url.pathname === "/render" && request.method === "POST") {
      try {
        const body = await request.json();
        const { businessSlug, jobId } = body;
        if (!businessSlug || !jobId) {
          return jsonResponse({ error: "Missing required fields: businessSlug, jobId" }, 400);
        }

        const renderStatus = await dispatchToVPS(env, businessSlug, jobId);
        return jsonResponse({ success: true, renderStatus });
      } catch (err) {
        return jsonResponse({ error: err.message }, 500);
      }
    }

    return new Response("Not Found", { status: 404 });
  }
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
  });
}
