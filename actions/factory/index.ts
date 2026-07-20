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
    throw new Error("FACTORY_SECRET is not set in environment variables");
  }
}

/**
 * Fetch business profile by slug
 */
export async function getBusinessConfig(slug: string) {
  try {
    const biz = await client.business.findUnique({
      where: { slug }
    });
    if (!biz) return { status: 404, data: null };
    return { status: 200, data: biz };
  } catch (err: any) {
    return { status: 500, error: err.message };
  }
}

/**
 * Update business config
 */
export async function updateBusinessConfig(slug: string, data: any) {
  try {
    const updated = await client.business.upsert({
      where: { slug },
      update: data,
      create: { slug, ...data }
    });
    return { status: 200, data: updated };
  } catch (err: any) {
    return { status: 500, error: err.message };
  }
}

/**
 * Get content ideas
 */
export async function getContentIdeas(businessId: string) {
  try {
    const ideas = await client.contentIdea.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" }
    });
    return { status: 200, data: ideas };
  } catch (err: any) {
    return { status: 500, error: err.message };
  }
}

/**
 * Get content jobs
 */
export async function getContentJobs(businessId: string) {
  try {
    const jobs = await client.contentJob.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" },
      include: { metrics: true }
    });
    return { status: 200, data: jobs };
  } catch (err: any) {
    return { status: 500, error: err.message };
  }
}

/**
 * Run content pipeline manually for a specific idea
 */
export async function runPipelineForIdea(businessId: string, ideaId: string) {
  checkSecret();
  try {
    const biz = await client.business.findUnique({ where: { id: businessId } });
    const idea = await client.contentIdea.findUnique({ where: { id: ideaId } });

    if (!biz || !idea) {
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

    // 1. Fetch script from Worker
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
      await client.contentJob.update({ where: { id: job.id }, data: { status: "FAILED", renderLog: `Script gen failed: ${err}` } });
      return { status: 500, error: `Script generation failed: ${err}` };
    }

    const scriptData = await scriptRes.json();
    const script = scriptData.script;

    // Update job to SCRIPTED
    await client.contentJob.update({
      where: { id: job.id },
      data: {
        status: "SCRIPTED",
        script: script,
        caption: `${script.hook}\n\n${script.body.join("\n")}\n\n${script.cta}\n\n${biz.hashtags || ""}`
      }
    });

    // 2. Fetch TTS audio from Worker (saves voice.mp3 to R2)
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
      await client.contentJob.update({ where: { id: job.id }, data: { status: "FAILED", renderLog: `TTS gen failed: ${err}` } });
      return { status: 500, error: `TTS generation failed: ${err}` };
    }

    const ttsData = await ttsRes.json();
    const audioKey = ttsData.audioKey;

    await client.contentJob.update({
      where: { id: job.id },
      data: {
        status: "RENDERING",
        audioKey
      }
    });

    // 3. Dispatch render job to VPS Webhook Agent
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
      await client.contentJob.update({ where: { id: job.id }, data: { status: "FAILED", renderLog: `VPS dispatch failed: ${err}` } });
      return { status: 500, error: `VPS render dispatch failed: ${err}` };
    }

    // Mark idea as used
    await client.contentIdea.update({
      where: { id: ideaId },
      data: { used: true }
    });

    return { status: 200, data: job };
  } catch (err: any) {
    return { status: 500, error: err.message };
  }
}

/**
 * Approve a job and publish it directly via Postiz on the VPS
 */
export async function approveAndPublishJob(jobId: string, customCaption: string) {
  try {
    const job = await client.contentJob.findUnique({
      where: { id: jobId },
      include: { business: true }
    });

    if (!job || !job.videoKey) {
      return { status: 404, error: "Rendered video reel not found for approval" };
    }

    if (!POSTIZ_API_KEY) {
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
      return { status: 500, error: `Postiz API error: ${err}` };
    }

    const result = await response.json();

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
    await client.documentaryLog.create({
      data: {
        businessId: job.businessId,
        event: "video_approved_and_published",
        detail: { jobId, postizPostId: updated.postizPostId }
      }
    });

    return { status: 200, data: updated };
  } catch (err: any) {
    return { status: 500, error: err.message };
  }
}

/**
 * Reject a job
 */
export async function rejectJob(jobId: string, reason: string) {
  try {
    const job = await client.contentJob.update({
      where: { id: jobId },
      data: {
        status: "REJECTED",
        rejectReason: reason
      }
    });

    await client.documentaryLog.create({
      data: {
        businessId: job.businessId,
        event: "video_rejected",
        detail: { jobId, reason }
      }
    });

    return { status: 200, data: job };
  } catch (err: any) {
    return { status: 500, error: err.message };
  }
}

/**
 * Generate manual ContentIdea
 */
export async function createManualIdea(businessId: string, topic: string, angle: string, pillar: string) {
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
    return { status: 200, data: idea };
  } catch (err: any) {
    return { status: 500, error: err.message };
  }
}

/**
 * Generate dynamic batch of ideas using Worker `/ideas` API
 */
export async function generateIdeaBatch(slug: string) {
  checkSecret();
  try {
    const biz = await client.business.findUnique({ where: { slug } });
    if (!biz) return { status: 404, error: "Business not found" };

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
      return { status: 500, error: `Failed to fetch ideas: ${err}` };
    }

    const data = await res.json();
    const ideas = data.ideas;

    const created = [];
    for (const idea of ideas) {
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

    return { status: 200, data: created };
  } catch (err: any) {
    return { status: 500, error: err.message };
  }
}
