"use server";

import { client } from "@/lib/prisma";
import { onCurrentUser } from "../user";
import { ActionTracer } from "@/lib/tracer";

const WORKER_BASE = "https://marketing-machine-orchestrator.mindmaxing.workers.dev";
const FACTORY_SECRET = process.env.FACTORY_SECRET || "";
const POSTIZ_API_URL = process.env.POSTIZ_API_URL || "http://72.62.230.37:3000/api/posts";
const POSTIZ_API_KEY = process.env.POSTIZ_API_KEY || "";

// Verify factory secret is configured
function checkSecret(tracer: ActionTracer) {
  if (!FACTORY_SECRET) {
    tracer.error("FACTORY_SECRET env variable is missing!");
    throw new Error("FACTORY_SECRET is not set in environment variables");
  }
}

/**
 * Fetch business profile by slug
 */
export async function getBusinessConfig(slug: string) {
  const tracer = new ActionTracer();
  tracer.log("getBusinessConfig called for slug:", slug);
  try {
    const biz = await client.business.findUnique({
      where: { slug }
    });
    tracer.log("getBusinessConfig result resolved:", biz ? { id: biz.id, name: biz.name } : "null (404)");
    if (!biz) return { status: 404, data: null, logs: tracer.getTraces() };
    return { status: 200, data: biz, logs: tracer.getTraces() };
  } catch (err: any) {
    tracer.error("getBusinessConfig failed:", err.message);
    return { status: 500, error: err.message, logs: tracer.getTraces() };
  }
}

/**
 * Update business config
 */
export async function updateBusinessConfig(slug: string, data: any) {
  const tracer = new ActionTracer();
  tracer.log("updateBusinessConfig called for slug:", slug, "with payload keys:", Object.keys(data));
  try {
    const updated = await client.business.upsert({
      where: { slug },
      update: data,
      create: { slug, ...data }
    });
    tracer.log("updateBusinessConfig success. Upserted business record ID:", updated.id);
    return { status: 200, data: updated, logs: tracer.getTraces() };
  } catch (err: any) {
    tracer.error("updateBusinessConfig failed:", err.message);
    return { status: 500, error: err.message, logs: tracer.getTraces() };
  }
}

/**
 * Get content ideas
 */
export async function getContentIdeas(businessId: string) {
  const tracer = new ActionTracer();
  tracer.log("getContentIdeas called for businessId:", businessId);
  try {
    const ideas = await client.contentIdea.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" }
    });
    tracer.log("getContentIdeas returned ideas count:", ideas.length);
    return { status: 200, data: ideas, logs: tracer.getTraces() };
  } catch (err: any) {
    tracer.error("getContentIdeas failed:", err.message);
    return { status: 500, error: err.message, logs: tracer.getTraces() };
  }
}

/**
 * Get content jobs
 */
export async function getContentJobs(businessId: string) {
  const tracer = new ActionTracer();
  tracer.log("getContentJobs called for businessId:", businessId);
  try {
    const jobs = await client.contentJob.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" },
      include: { metrics: true }
    });
    tracer.log("getContentJobs returned jobs count:", jobs.length);
    return { status: 200, data: jobs, logs: tracer.getTraces() };
  } catch (err: any) {
    tracer.error("getContentJobs failed:", err.message);
    return { status: 500, error: err.message, logs: tracer.getTraces() };
  }
}

/**
 * Run content pipeline manually for a specific idea
 */
export async function runPipelineForIdea(businessId: string, ideaId: string) {
  const tracer = new ActionTracer();
  tracer.log("runPipelineForIdea called:", { businessId, ideaId });
  try {
    checkSecret(tracer);
    const biz = await client.business.findUnique({ where: { id: businessId } });
    const idea = await client.contentIdea.findUnique({ where: { id: ideaId } });

    if (!biz || !idea) {
      tracer.warn("Business or Idea record not found in database.");
      return { status: 404, error: "Business or Idea not found", logs: tracer.getTraces() };
    }

    // Create rendering job in DB
    const job = await client.contentJob.create({
      data: {
        businessId,
        ideaId,
        status: "IDEA"
      }
    });
    tracer.log("Created ContentJob record with status 'IDEA'. Job ID:", job.id);

    // 1. Fetch script from Worker
    tracer.log("Step 1: Requesting script from Worker at /script endpoint...");
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
      tracer.error("Script generation failed at Worker endpoint. Status:", scriptRes.status, "Error:", err);
      await client.contentJob.update({ where: { id: job.id }, data: { status: "FAILED", renderLog: `Script gen failed: ${err}` } });
      return { status: 500, error: `Script generation failed: ${err}`, logs: tracer.getTraces() };
    }

    const scriptData = await scriptRes.json();
    const script = scriptData.script;
    tracer.log("Received script details from Worker. Hook preview:", script.hook);

    // Update job to SCRIPTED
    await client.contentJob.update({
      where: { id: job.id },
      data: {
        status: "SCRIPTED",
        script: script,
        caption: `${script.hook}\n\n${script.body.join("\n")}\n\n${script.cta}\n\n${biz.hashtags || ""}`
      }
    });
    tracer.log("Job status updated to 'SCRIPTED' in DB.");

    // 2. Fetch TTS audio from Worker (saves voice.mp3 to R2)
    tracer.log("Step 2: Requesting TTS voice synthesis from Worker at /tts endpoint...");
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
      tracer.error("TTS generation failed at Worker endpoint. Error:", err);
      await client.contentJob.update({ where: { id: job.id }, data: { status: "FAILED", renderLog: `TTS gen failed: ${err}` } });
      return { status: 500, error: `TTS generation failed: ${err}`, logs: tracer.getTraces() };
    }

    const ttsData = await ttsRes.json();
    const audioKey = ttsData.audioKey;
    tracer.log("TTS synthesis completed. Saved to key:", audioKey);

    await client.contentJob.update({
      where: { id: job.id },
      data: {
        status: "RENDERING",
        audioKey
      }
    });
    tracer.log("Job status updated to 'RENDERING' status in DB.");

    // 3. Dispatch render job to VPS Webhook Agent
    tracer.log("Step 3: Dispatching render task to VPS Webhook Render Box...");
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
      tracer.error("VPS dispatch failed at Worker endpoint. Error:", err);
      await client.contentJob.update({ where: { id: job.id }, data: { status: "FAILED", renderLog: `VPS dispatch failed: ${err}` } });
      return { status: 500, error: `VPS render dispatch failed: ${err}`, logs: tracer.getTraces() };
    }

    tracer.log("Pipeline successfully initiated. Rendering video on VPS box...");

    // Mark idea as used
    await client.contentIdea.update({
      where: { id: ideaId },
      data: { used: true }
    });

    return { status: 200, data: job, logs: tracer.getTraces() };
  } catch (err: any) {
    tracer.error("Fatal error during pipeline run:", err.message);
    return { status: 500, error: err.message, logs: tracer.getTraces() };
  }
}

/**
 * Approve a job and publish it directly via Postiz on the VPS
 */
export async function approveAndPublishJob(jobId: string, customCaption: string) {
  const tracer = new ActionTracer();
  tracer.log("approveAndPublishJob called for jobId:", jobId);
  try {
    const job = await client.contentJob.findUnique({
      where: { id: jobId },
      include: { business: true }
    });

    if (!job || !job.videoKey) {
      tracer.error("Approval failed: job or videoKey not found for jobId:", jobId);
      return { status: 404, error: "Rendered video reel not found for approval", logs: tracer.getTraces() };
    }

    if (!POSTIZ_API_KEY) {
      tracer.warn("POSTIZ_API_KEY missing from env. Saving job as 'APPROVED' state locally in DB...");
      // If API key is not configured, schedule it locally in the database state instead of throwing
      await client.contentJob.update({
        where: { id: jobId },
        data: {
          status: "APPROVED",
          caption: customCaption,
          scheduledAt: new Date()
        }
      });
      return { status: 200, data: "Job approved. Postiz API key missing — marked as APPROVED locally.", logs: tracer.getTraces() };
    }

    const videoUrl = `${WORKER_BASE}/assets/${job.videoKey}`;
    tracer.log("Submitting video publication query to Postiz self-hosted API. Video URL:", videoUrl);

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
      tracer.error("Postiz API request failed. Response status:", response.status, "Error:", err);
      return { status: 500, error: `Postiz API error: ${err}`, logs: tracer.getTraces() };
    }

    const result = await response.json();
    tracer.log("Postiz scheduled successfully. Postiz Post ID:", result.id);

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
    tracer.log("Recording documentary timeline event for job publication approval...");
    await client.documentaryLog.create({
      data: {
        businessId: job.businessId,
        event: "video_approved_and_published",
        detail: { jobId, postizPostId: updated.postizPostId }
      }
    });

    return { status: 200, data: updated, logs: tracer.getTraces() };
  } catch (err: any) {
    tracer.error("Fatal error during job approval:", err.message);
    return { status: 500, error: err.message, logs: tracer.getTraces() };
  }
}

/**
 * Reject a job
 */
export async function rejectJob(jobId: string, reason: string) {
  const tracer = new ActionTracer();
  tracer.log("rejectJob called:", { jobId, reason });
  try {
    const job = await client.contentJob.update({
      where: { id: jobId },
      data: {
        status: "REJECTED",
        rejectReason: reason
      }
    });

    tracer.log("Job status set to 'REJECTED' in DB. Recording event in documentary timeline log...");
    await client.documentaryLog.create({
      data: {
        businessId: job.businessId,
        event: "video_rejected",
        detail: { jobId, reason }
      }
    });

    return { status: 200, data: job, logs: tracer.getTraces() };
  } catch (err: any) {
    tracer.error("Fatal error during job rejection:", err.message);
    return { status: 500, error: err.message, logs: tracer.getTraces() };
  }
}

/**
 * Generate manual ContentIdea
 */
export async function createManualIdea(businessId: string, topic: string, angle: string, pillar: string) {
  const tracer = new ActionTracer();
  tracer.log("createManualIdea called:", { businessId, topic, angle, pillar });
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
    tracer.log("Manual idea created successfully in DB. Idea ID:", idea.id);
    return { status: 200, data: idea, logs: tracer.getTraces() };
  } catch (err: any) {
    tracer.error("createManualIdea failed:", err.message);
    return { status: 500, error: err.message, logs: tracer.getTraces() };
  }
}

/**
 * Generate dynamic batch of ideas using Worker `/ideas` API
 */
export async function generateIdeaBatch(slug: string) {
  const tracer = new ActionTracer();
  tracer.log("generateIdeaBatch requested for business slug:", slug);
  try {
    checkSecret(tracer);
    const biz = await client.business.findUnique({ where: { slug } });
    if (!biz) {
      tracer.warn("Business not found for slug:", slug);
      return { status: 404, error: "Business not found", logs: tracer.getTraces() };
    }

    tracer.log("Calling Worker /ideas endpoint to fetch 10 script ideas...");
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
      tracer.error("Ideas generation failed at Worker endpoint. Status:", res.status, "Error:", err);
      return { status: 500, error: `Failed to fetch ideas: ${err}`, logs: tracer.getTraces() };
    }

    const data = await res.json();
    const ideas = data.ideas;
    tracer.log("Worker returned ideas list. Size:", ideas?.length || 0);

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
    tracer.log("Successfully saved", created.length, "new ideas into the database.");

    return { status: 200, data: created, logs: tracer.getTraces() };
  } catch (err: any) {
    tracer.error("Fatal error during idea batch generation:", err.message);
    return { status: 500, error: err.message, logs: tracer.getTraces() };
  }
}
