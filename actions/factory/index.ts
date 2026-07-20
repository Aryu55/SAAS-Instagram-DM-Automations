"use server";

import { client } from "@/lib/prisma";
import { onCurrentUser } from "../user";

const WORKER_BASE = "https://marketing-machine-orchestrator.mindmaxing.workers.dev";
const FACTORY_SECRET = process.env.FACTORY_SECRET || "";
const POSTIZ_API_URL = process.env.POSTIZ_API_URL || "http://72.62.230.37:3000/api/posts";
const POSTIZ_API_KEY = process.env.POSTIZ_API_KEY || "";

// Verify factory secret is configured
function checkSecret() {
  if (!FACTORY_SECRET) {
    console.error("[CONTENT FACTORY ENGINE] Error: FACTORY_SECRET env variable is missing!");
    throw new Error("FACTORY_SECRET is not set in environment variables");
  }
}

/**
 * Fetch business profile by slug
 */
export async function getBusinessConfig(slug: string) {
  console.log("[CONTENT FACTORY ENGINE] getBusinessConfig called for slug:", slug);
  try {
    const biz = await client.business.findUnique({
      where: { slug }
    });
    console.log("[CONTENT FACTORY ENGINE] getBusinessConfig result:", biz ? { id: biz.id, name: biz.name } : "null (404)");
    if (!biz) return { status: 404, data: null };
    return { status: 200, data: biz };
  } catch (err: any) {
    console.error("[CONTENT FACTORY ENGINE] getBusinessConfig failed:", err.message);
    return { status: 500, error: err.message };
  }
}

/**
 * Update business config
 */
export async function updateBusinessConfig(slug: string, data: any) {
  console.log("[CONTENT FACTORY ENGINE] updateBusinessConfig called for slug:", slug, "with payload:", JSON.stringify(data, null, 2));
  try {
    const updated = await client.business.upsert({
      where: { slug },
      update: data,
      create: { slug, ...data }
    });
    console.log("[CONTENT FACTORY ENGINE] updateBusinessConfig success. Upserted business record ID:", updated.id);
    return { status: 200, data: updated };
  } catch (err: any) {
    console.error("[CONTENT FACTORY ENGINE] updateBusinessConfig failed:", err.message);
    return { status: 500, error: err.message };
  }
}

/**
 * Get content ideas
 */
export async function getContentIdeas(businessId: string) {
  console.log("[CONTENT FACTORY ENGINE] getContentIdeas called for businessId:", businessId);
  try {
    const ideas = await client.contentIdea.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" }
    });
    console.log("[CONTENT FACTORY ENGINE] getContentIdeas returned ideas count:", ideas.length);
    return { status: 200, data: ideas };
  } catch (err: any) {
    console.error("[CONTENT FACTORY ENGINE] getContentIdeas failed:", err.message);
    return { status: 500, error: err.message };
  }
}

/**
 * Get content jobs
 */
export async function getContentJobs(businessId: string) {
  console.log("[CONTENT FACTORY ENGINE] getContentJobs called for businessId:", businessId);
  try {
    const jobs = await client.contentJob.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" },
      include: { metrics: true }
    });
    console.log("[CONTENT FACTORY ENGINE] getContentJobs returned jobs count:", jobs.length);
    return { status: 200, data: jobs };
  } catch (err: any) {
    console.error("[CONTENT FACTORY ENGINE] getContentJobs failed:", err.message);
    return { status: 500, error: err.message };
  }
}

/**
 * Run content pipeline manually for a specific idea
 */
export async function runPipelineForIdea(businessId: string, ideaId: string) {
  console.log("[CONTENT FACTORY ENGINE] runPipelineForIdea called:", { businessId, ideaId });
  checkSecret();
  try {
    const biz = await client.business.findUnique({ where: { id: businessId } });
    const idea = await client.contentIdea.findUnique({ where: { id: ideaId } });

    if (!biz || !idea) {
      console.warn("[CONTENT FACTORY ENGINE] Business or Idea not found in DB.");
      return { status: 404, error: "Business or Idea not found" };
    }

    // Create rendering job in DB
    const job = await client.contentJob.create({
      data: {
        businessId,
        ideaId,
        status: "IDEA"
      }
    });
    console.log("[CONTENT FACTORY ENGINE] Created job tracking record with status 'IDEA'. Job ID:", job.id);

    // 1. Fetch script from Worker
    console.log("[CONTENT FACTORY ENGINE] Step 1: Requesting script from Worker at /script endpoint...");
    const scriptRes = await fetch(`${WORKER_BASE}/script`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${FACTORY_SECRET}`
      },
      body: JSON.stringify({ business: biz, idea })
    });

    if (!scriptRes.ok) {
      const err = await scriptRes.text();
      console.error("[CONTENT FACTORY ENGINE] Script generation failed at Worker endpoint. Response status:", scriptRes.status, "Error:", err);
      await client.contentJob.update({ where: { id: job.id }, data: { status: "FAILED", renderLog: `Script gen failed: ${err}` } });
      return { status: 500, error: `Script generation failed: ${err}` };
    }

    const scriptData = await scriptRes.json();
    const script = scriptData.script;
    console.log("[CONTENT FACTORY ENGINE] Received script details from Worker. Hook:", script.hook);

    // Update job to SCRIPTED
    await client.contentJob.update({
      where: { id: job.id },
      data: {
        status: "SCRIPTED",
        script: script,
        caption: `${script.hook}\n\n${script.body.join("\n")}\n\n${script.cta}\n\n${biz.hashtags || ""}`
      }
    });
    console.log("[CONTENT FACTORY ENGINE] Job updated to 'SCRIPTED' in DB.");

    // 2. Fetch TTS audio from Worker (saves voice.mp3 to R2)
    console.log("[CONTENT FACTORY ENGINE] Step 2: Requesting TTS voice synthesis from Worker at /tts endpoint...");
    const ttsRes = await fetch(`${WORKER_BASE}/tts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${FACTORY_SECRET}`
      },
      body: JSON.stringify({
        business: biz,
        jobId: job.id,
        scriptText: script.scriptText
      })
    });

    if (!ttsRes.ok) {
      const err = await ttsRes.text();
      console.error("[CONTENT FACTORY ENGINE] TTS generation failed at Worker endpoint. Error:", err);
      await client.contentJob.update({ where: { id: job.id }, data: { status: "FAILED", renderLog: `TTS gen failed: ${err}` } });
      return { status: 500, error: `TTS generation failed: ${err}` };
    }

    const ttsData = await ttsRes.json();
    const audioKey = ttsData.audioKey;
    console.log("[CONTENT FACTORY ENGINE] TTS synthesis completed. Saved to key:", audioKey);

    await client.contentJob.update({
      where: { id: job.id },
      data: {
        status: "RENDERING",
        audioKey
      }
    });
    console.log("[CONTENT FACTORY ENGINE] Job updated to 'RENDERING' status in DB.");

    // 3. Dispatch render job to VPS Webhook Agent
    console.log("[CONTENT FACTORY ENGINE] Step 3: Dispatching render task to VPS Webhook Render Box...");
    const renderRes = await fetch(`${WORKER_BASE}/render`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${FACTORY_SECRET}`
      },
      body: JSON.stringify({
        businessSlug: biz.slug,
        jobId: job.id
      })
    });

    if (!renderRes.ok) {
      const err = await renderRes.text();
      console.error("[CONTENT FACTORY ENGINE] VPS dispatch failed at Worker endpoint. Error:", err);
      await client.contentJob.update({ where: { id: job.id }, data: { status: "FAILED", renderLog: `VPS dispatch failed: ${err}` } });
      return { status: 500, error: `VPS render dispatch failed: ${err}` };
    }

    console.log("[CONTENT FACTORY ENGINE] Pipeline successfully initiated. Rendering video on VPS box...");

    // Mark idea as used
    await client.contentIdea.update({
      where: { id: ideaId },
      data: { used: true }
    });

    return { status: 200, data: job };
  } catch (err: any) {
    console.error("[CONTENT FACTORY ENGINE] Fatal error during pipeline run:", err.message);
    return { status: 500, error: err.message };
  }
}

/**
 * Approve a job and publish it directly via Postiz on the VPS
 */
export async function approveAndPublishJob(jobId: string, customCaption: string) {
  console.log("[CONTENT FACTORY ENGINE] approveAndPublishJob called for jobId:", jobId);
  try {
    const job = await client.contentJob.findUnique({
      where: { id: jobId },
      include: { business: true }
    });

    if (!job || !job.videoKey) {
      console.error("[CONTENT FACTORY ENGINE] Approval failed: job or videoKey not found for jobId:", jobId);
      return { status: 404, error: "Rendered video reel not found for approval" };
    }

    if (!POSTIZ_API_KEY) {
      console.log("[CONTENT FACTORY ENGINE] POSTIZ_API_KEY missing from env. Saving job as 'APPROVED' state locally in DB...");
      // If API key is not configured, schedule it locally in the database state instead of throwing
      await client.contentJob.update({
        where: { id: jobId },
        data: {
          status: "APPROVED",
          caption: customCaption,
          scheduledAt: new Date()
        }
      });
      return { status: 200, data: "Job approved. Postiz API key missing — marked as APPROVED locally." };
    }

    const videoUrl = `${WORKER_BASE}/assets/${job.videoKey}`;
    console.log("[CONTENT FACTORY ENGINE] Submitting video publication query to Postiz self-hosted API. Video URL:", videoUrl);

    // POST to self-hosted Postiz API
    const response = await fetch(POSTIZ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${POSTIZ_API_KEY}`
      },
      body: JSON.stringify({
        content: customCaption,
        media: [{ url: videoUrl, type: "video" }],
        type: "social"
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("[CONTENT FACTORY ENGINE] Postiz API request failed. Response status:", response.status, "Error:", err);
      return { status: 500, error: `Postiz API error: ${err}` };
    }

    const result = await response.json();
    console.log("[CONTENT FACTORY ENGINE] Postiz scheduled successfully. Postiz Post ID:", result.id);

    const updated = await client.contentJob.update({
      where: { id: jobId },
      data: {
        status: "SCHEDULED",
        caption: customCaption,
        postizPostId: result.id || "postiz_scheduled_post",
        scheduledAt: new Date()
      }
    });

    // Write log entry
    console.log("[CONTENT FACTORY ENGINE] Recording documentary timeline event for job publication approval...");
    await client.documentaryLog.create({
      data: {
        businessId: job.businessId,
        event: "video_approved_and_published",
        detail: { jobId, postizPostId: updated.postizPostId }
      }
    });

    return { status: 200, data: updated };
  } catch (err: any) {
    console.error("[CONTENT FACTORY ENGINE] Fatal error during job approval:", err.message);
    return { status: 500, error: err.message };
  }
}

/**
 * Reject a job
 */
export async function rejectJob(jobId: string, reason: string) {
  console.log("[CONTENT FACTORY ENGINE] rejectJob called:", { jobId, reason });
  try {
    const job = await client.contentJob.update({
      where: { id: jobId },
      data: {
        status: "REJECTED",
        rejectReason: reason
      }
    });

    console.log("[CONTENT FACTORY ENGINE] Job status set to 'REJECTED' in DB. Recording event in documentary timeline log...");
    await client.documentaryLog.create({
      data: {
        businessId: job.businessId,
        event: "video_rejected",
        detail: { jobId, reason }
      }
    });

    return { status: 200, data: job };
  } catch (err: any) {
    console.error("[CONTENT FACTORY ENGINE] Fatal error during job rejection:", err.message);
    return { status: 500, error: err.message };
  }
}

/**
 * Generate manual ContentIdea
 */
export async function createManualIdea(businessId: string, topic: string, angle: string, pillar: string) {
  console.log("[CONTENT FACTORY ENGINE] createManualIdea called:", { businessId, topic, angle, pillar });
  try {
    const idea = await client.contentIdea.create({
      data: {
        businessId,
        topic,
        angle,
        contentPillar: pillar,
        hookStyle: "value",
        source: "manual"
      }
    });
    console.log("[CONTENT FACTORY ENGINE] Manual idea created successfully in DB. Idea ID:", idea.id);
    return { status: 200, data: idea };
  } catch (err: any) {
    console.error("[CONTENT FACTORY ENGINE] createManualIdea failed:", err.message);
    return { status: 500, error: err.message };
  }
}

/**
 * Generate dynamic batch of ideas using Worker `/ideas` API
 */
export async function generateIdeaBatch(slug: string) {
  console.log("[CONTENT FACTORY ENGINE] generateIdeaBatch requested for business slug:", slug);
  checkSecret();
  try {
    const biz = await client.business.findUnique({ where: { slug } });
    if (!biz) {
      console.warn("[CONTENT FACTORY ENGINE] Business not found for slug:", slug);
      return { status: 404, error: "Business not found" };
    }

    console.log("[CONTENT FACTORY ENGINE] Calling Worker /ideas endpoint to fetch 10 script ideas...");
    const res = await fetch(`${WORKER_BASE}/ideas`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${FACTORY_SECRET}`
      },
      body: JSON.stringify({ business: biz, count: 10 })
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[CONTENT FACTORY ENGINE] Ideas generation failed at Worker endpoint. Response status:", res.status, "Error:", err);
      return { status: 500, error: `Failed to fetch ideas: ${err}` };
    }

    const data = await res.json();
    const ideas = data.ideas;
    console.log("[CONTENT FACTORY ENGINE] Worker returned ideas list. Size:", ideas?.length || 0);

    const created = [];
    for (const idea of ideas || []) {
      const createdIdea = await client.contentIdea.create({
        data: {
          businessId: biz.id,
          topic: idea.topic,
          angle: idea.angle,
          hookStyle: idea.hookStyle,
          contentPillar: idea.contentPillar,
          source: "llm"
        }
      });
      created.push(createdIdea);
    }
    console.log("[CONTENT FACTORY ENGINE] Successfully saved", created.length, "new ideas into the database.");

    return { status: 200, data: created };
  } catch (err: any) {
    console.error("[CONTENT FACTORY ENGINE] Fatal error during idea batch generation:", err.message);
    return { status: 500, error: err.message };
  }
}
