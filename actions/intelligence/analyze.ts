"use server";

import { client } from "@/lib/prisma";

const GEMINI_KEY = process.env.GEMINI_API_KEY || "";

/**
 * Helper to simulate fetching a transcript from a scraper (like Apify)
 */
async function extractTranscriptFromVideo(url: string) {
  // In a real production scenario, this would call Apify or yt-dlp to get the transcript
  // For demonstration, we simulate a transcript based on common viral structures
  return `Have you ever wondered what actually makes a video go viral? Well, there's actually a science to virality, and it's not a complicated setup. You can literally break it down with one Claude skill called /analyze. So before you spend another night doom scrolling and saving videos instead of actually creating, try this. Step one, analyze the hook. Step two, look at the format. Step three, understand the storytelling structure. This is how you win.`;
}

/**
 * Analyze a single video link to extract hook, format, and storytelling structure
 */
export async function analyzeVideo(orgId: string, url: string, platform: string = "INSTAGRAM") {
  try {
    // 1. Get Transcript
    const transcript = await extractTranscriptFromVideo(url);
    
    // 2. Call LLM to extract hook, format, and structure
    let analysisData = {
      hook: "Unknown",
      format: "Unknown",
      storytellingStructure: "Unknown",
      keyTakeaway: "Unknown"
    };

    if (GEMINI_KEY) {
      const prompt = `You are an expert video viral analyst.
Analyze the following transcript from a video. Extract the exact "hook", the "format" (e.g. Talking Head, POV, Vlog, Tutorial), and the "storytelling structure" (e.g. Problem-Agitate-Solve, Hook-Retain-Reward).
Also provide a short "keyTakeaway".

Transcript:
"""
${transcript}
"""

Respond ONLY with a valid JSON object matching this schema:
{
  "hook": "string (the exact words of the hook)",
  "format": "string",
  "storytellingStructure": "string",
  "keyTakeaway": "string"
}`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" },
          }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          analysisData = JSON.parse(text);
        }
      }
    }

    // 3. Save to database
    const scrapedPost = await client.scrapedPost.create({
      data: {
        orgId,
        platform,
        url,
        handle: "analyzed_user", // placeholder
        transcript,
        analysisData,
        status: "COMPLETED"
      }
    });

    return { status: 200, data: scrapedPost };
  } catch (err: any) {
    console.error("Analysis Error:", err);
    return { status: 500, error: err.message };
  }
}

/**
 * Batch analyze multiple videos
 */
export async function batchAnalyzeVideos(orgId: string, urls: string[], platform: string = "INSTAGRAM") {
  try {
    const results = [];
    // For large batches in production, this should be sent to a background job queue (e.g. Inngest / QStash)
    // We do it sequentially here for the MVP
    for (const url of urls) {
      if (url.trim()) {
        const res = await analyzeVideo(orgId, url.trim(), platform);
        if (res.status === 200) {
          results.push(res.data);
        }
      }
    }
    return { status: 200, count: results.length, data: results };
  } catch (err: any) {
    return { status: 500, error: err.message };
  }
}

/**
 * Get all analyzed videos for an organization
 */
export async function getAnalyzedVideos(orgId: string) {
  try {
    const data = await client.scrapedPost.findMany({
      where: { orgId, status: "COMPLETED" },
      orderBy: { createdAt: 'desc' }
    });
    return { status: 200, data };
  } catch (err: any) {
    return { status: 500, error: err.message };
  }
}
