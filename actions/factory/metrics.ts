"use server";

import { client } from "@/lib/prisma";

const GEMINI_KEY = process.env.GEMINI_API_KEY || "";

/**
 * Pull metrics for published jobs (Instagram Graph API)
 * Reuses the existing Instagram token infrastructure from the DM module
 */
export async function pullInstagramMetrics(businessId: string) {
  try {
    const publishedJobs = await client.contentJob.findMany({
      where: {
        businessId,
        status: { in: ["PUBLISHED", "SCHEDULED"] },
        postizPostId: { not: null }
      }
    });

    if (publishedJobs.length === 0) {
      return { status: 200, data: { message: "No published jobs to fetch metrics for" } };
    }

    // Note: In production, this would use the Instagram Graph API
    // with the business's connected IG account token.
    // For now, we create placeholder metrics that can be manually updated
    // or filled when IG API access is configured.
    let updated = 0;
    for (const job of publishedJobs) {
      // Check if we already have recent metrics
      const existingMetric = await client.postMetric.findFirst({
        where: { jobId: job.id },
        orderBy: { fetchedAt: "desc" }
      });

      // Skip if fetched in the last 6 hours
      if (existingMetric && (Date.now() - existingMetric.fetchedAt.getTime()) < 6 * 60 * 60 * 1000) {
        continue;
      }

      // TODO: Replace with actual Instagram Graph API call when token is available
      // const igToken = await getInstagramToken(businessId);
      // const mediaId = job.postizPostId;
      // const insights = await fetch(`https://graph.instagram.com/${mediaId}/insights?metric=impressions,reach,engagement&access_token=${igToken}`);

      updated++;
    }

    return { status: 200, data: { checked: publishedJobs.length, updated } };
  } catch (err: any) {
    return { status: 500, error: err.message };
  }
}

/**
 * Get all metrics for a business's jobs
 */
export async function getBusinessMetrics(businessId: string) {
  try {
    const jobs = await client.contentJob.findMany({
      where: { businessId, status: { in: ["PUBLISHED", "SCHEDULED", "APPROVED"] } },
      include: { metrics: { orderBy: { fetchedAt: "desc" } } },
      orderBy: { createdAt: "desc" }
    });

    // Aggregate stats
    const totalViews = jobs.reduce((sum, j) => sum + (j.metrics[0]?.views || 0), 0);
    const totalLikes = jobs.reduce((sum, j) => sum + (j.metrics[0]?.likes || 0), 0);
    const totalComments = jobs.reduce((sum, j) => sum + (j.metrics[0]?.comments || 0), 0);
    const avgER = totalViews > 0 ? ((totalLikes + totalComments) / totalViews) * 100 : 0;

    // Hook style breakdown
    const hookStyles: Record<string, { count: number; totalViews: number }> = {};
    for (const job of jobs) {
      const style = (job.script as any)?.hookStyle || "unknown";
      if (!hookStyles[style]) hookStyles[style] = { count: 0, totalViews: 0 };
      hookStyles[style].count++;
      hookStyles[style].totalViews += job.metrics[0]?.views || 0;
    }

    // Pillar breakdown
    const pillars: Record<string, { count: number; totalViews: number }> = {};
    for (const job of jobs) {
      const pillar = (job.script as any)?.contentPillar || "unknown";
      if (!pillars[pillar]) pillars[pillar] = { count: 0, totalViews: 0 };
      pillars[pillar].count++;
      pillars[pillar].totalViews += job.metrics[0]?.views || 0;
    }

    return {
      status: 200,
      data: {
        summary: {
          totalJobs: jobs.length,
          totalViews,
          totalLikes,
          totalComments,
          avgER: Math.round(avgER * 100) / 100
        },
        hookStyles,
        pillars,
        jobs
      }
    };
  } catch (err: any) {
    return { status: 500, error: err.message };
  }
}

/**
 * Analyze weekly performance and update winning patterns
 */
export async function analyzeWeeklyPerformance(businessId: string) {
  if (!GEMINI_KEY) {
    return { status: 400, error: "GEMINI_API_KEY not configured" };
  }

  try {
    const biz = await client.business.findUnique({ where: { id: businessId } });
    if (!biz) return { status: 404, error: "Business not found" };

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Get this week's jobs with metrics
    const weekJobs = await client.contentJob.findMany({
      where: {
        businessId,
        createdAt: { gte: weekAgo }
      },
      include: { metrics: true }
    });

    // Get rejected jobs for learning
    const rejectedJobs = weekJobs.filter(j => j.status === "REJECTED");
    const publishedJobs = weekJobs.filter(j => ["PUBLISHED", "SCHEDULED", "APPROVED"].includes(j.status));

    if (weekJobs.length === 0) {
      return { status: 200, data: { message: "No jobs this week to analyze" } };
    }

    const jobSummaries = weekJobs.map(j => {
      const script = j.script as any;
      const metric = j.metrics[0];
      return {
        status: j.status,
        hookStyle: script?.hookStyle || "unknown",
        pillar: script?.contentPillar || "unknown",
        hook: script?.hook || "",
        views: metric?.views || 0,
        likes: metric?.likes || 0,
        comments: metric?.comments || 0,
        rejectReason: j.rejectReason || null
      };
    });

    const prompt = `You are analyzing a week of short-form video content performance for "${biz.name}" (${biz.description}).

Current winning patterns: ${biz.winningPatterns || "None established yet"}

This week's content jobs:
${JSON.stringify(jobSummaries, null, 2)}

Analyze the data and produce:
1. "patterns": Updated winning patterns string (what hook styles, pillars, angles, and tones are performing best; what to do more of; what to avoid). Keep this concise — max 3-4 sentences.
2. "report": A human-readable weekly report in markdown format covering:
   - Summary stats (total produced, approved, rejected, published)
   - Top performing content and why
   - Rejection patterns and lessons
   - Recommendations for next week

Respond with valid JSON: { "patterns": "...", "report": "..." }`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      }
    );

    if (!geminiRes.ok) {
      return { status: 500, error: `Gemini error: ${await geminiRes.text()}` };
    }

    const geminiData = await geminiRes.json();
    const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const parsed = JSON.parse(text);

    // Update business winning patterns
    await client.business.update({
      where: { id: businessId },
      data: { winningPatterns: parsed.patterns }
    });

    // Log the weekly analysis
    await client.documentaryLog.create({
      data: {
        businessId,
        event: "weekly_analysis_completed",
        detail: {
          weekOf: weekAgo.toISOString().split("T")[0],
          totalJobs: weekJobs.length,
          published: publishedJobs.length,
          rejected: rejectedJobs.length,
          patterns: parsed.patterns
        }
      }
    });

    return {
      status: 200,
      data: {
        patterns: parsed.patterns,
        report: parsed.report
      }
    };
  } catch (err: any) {
    return { status: 500, error: err.message };
  }
}

/**
 * Get the latest weekly report for a business
 */
export async function getLatestWeeklyReport(businessId: string) {
  try {
    const log = await client.documentaryLog.findFirst({
      where: { businessId, event: "weekly_analysis_completed" },
      orderBy: { createdAt: "desc" }
    });
    return { status: 200, data: log };
  } catch (err: any) {
    return { status: 500, error: err.message };
  }
}
