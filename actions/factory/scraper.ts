"use server";

import { client } from "@/lib/prisma";

const APIFY_TOKEN = process.env.APIFY_TOKEN || "";
const FACTORY_SECRET = process.env.FACTORY_SECRET || "";
const WORKER_BASE = "https://marketing-machine-orchestrator.mindmaxing.workers.dev";

/**
 * Run Apify scrape for a business's competitor handles/keywords
 */
export async function runScrape(orgId: string, config: {
  handles: string[];
  keywords: string[];
  platform: "instagram" | "youtube";
  maxResults?: number;
}) {
  if (!APIFY_TOKEN) {
    return { status: 400, error: "APIFY_TOKEN not configured. Add it to your .env to enable trend scraping." };
  }

  try {
    const org = await client.organization.findUnique({ where: { id: orgId } });
    if (!org) return { status: 404, error: "Organization not found" };

    const actorId = config.platform === "instagram"
      ? "apify/instagram-reel-scraper"
      : "bernardo/youtube-shorts-scraper";

    const input = config.platform === "instagram"
      ? {
          usernames: config.handles,
          hashtags: config.keywords,
          resultsLimit: config.maxResults || 50,
          resultsType: "posts"
        }
      : {
          searchQueries: config.keywords,
          maxResults: config.maxResults || 50,
          sortBy: "relevance"
        };

    // Start Apify actor run
    const runRes = await fetch(`https://api.apify.com/v2/acts/${actorId}/runs?token=${APIFY_TOKEN}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    });

    if (!runRes.ok) {
      return { status: 500, error: `Apify actor start failed: ${await runRes.text()}` };
    }

    const runData = await runRes.json();
    const runId = runData.data?.id;

    // Poll for completion (max 5 minutes)
    let status = "RUNNING";
    let attempts = 0;
    while (status === "RUNNING" && attempts < 30) {
      await new Promise(r => setTimeout(r, 10000)); // 10s intervals
      const statusRes = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_TOKEN}`);
      const statusData = await statusRes.json();
      status = statusData.data?.status || "FAILED";
      attempts++;
    }

    if (status !== "SUCCEEDED") {
      return { status: 500, error: `Apify run ${status} after ${attempts * 10}s` };
    }

    // Fetch results
    const datasetRes = await fetch(
      `https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${APIFY_TOKEN}&format=json`
    );
    const items = await datasetRes.json();

    // Store in ScrapedPost
    let stored = 0;
    for (const item of items) {
      const views = item.videoViewCount || item.viewCount || item.playCount || 0;
      const likes = item.likesCount || item.likeCount || 0;
      const comments = item.commentsCount || item.commentCount || 0;
      const er = views > 0 ? ((likes + comments) / views) * 100 : 0;

      await client.scrapedPost.create({
        data: {
          orgId,
          platform: config.platform,
          handle: item.ownerUsername || item.channelName || item.channelId || "unknown",
          url: item.url || item.videoUrl || "",
          caption: item.caption || item.title || "",
          views,
          likes,
          comments,
          er: Math.round(er * 100) / 100,
          postDate: item.timestamp ? new Date(item.timestamp) : null
        }
      });
      stored++;
    }

    return { status: 200, data: { stored, total: items.length } };
  } catch (err: any) {
    return { status: 500, error: err.message };
  }
}

/**
 * Score scraped posts using ER + weighted normalize math
 * (Ported from ai-agent-content-system scoring)
 */
export async function scoreScrapedPosts(orgId: string, weights?: {
  viewsWeight?: number;
  erWeight?: number;
  commentsWeight?: number;
  minViews?: number;
  minER?: number;
  maxDaysOld?: number;
}) {
  try {
    const w = {
      viewsWeight: weights?.viewsWeight || 0.4,
      erWeight: weights?.erWeight || 0.35,
      commentsWeight: weights?.commentsWeight || 0.25,
      minViews: weights?.minViews || 1000,
      minER: weights?.minER || 1.0,
      maxDaysOld: weights?.maxDaysOld || 30
    };

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - w.maxDaysOld);

    const posts = await client.scrapedPost.findMany({
      where: {
        orgId,
        views: { gte: w.minViews },
        er: { gte: w.minER },
        postDate: { gte: cutoff }
      }
    });

    if (posts.length === 0) {
      return { status: 200, data: { scored: 0, message: "No posts meet minimum thresholds" } };
    }

    // Normalize values
    const maxViews = Math.max(...posts.map(p => p.views));
    const maxER = Math.max(...posts.map(p => p.er));
    const maxComments = Math.max(...posts.map(p => p.comments));

    for (const post of posts) {
      const normViews = maxViews > 0 ? post.views / maxViews : 0;
      const normER = maxER > 0 ? post.er / maxER : 0;
      const normComments = maxComments > 0 ? post.comments / maxComments : 0;

      const score = (
        normViews * w.viewsWeight +
        normER * w.erWeight +
        normComments * w.commentsWeight
      ) * 100;

      await client.scrapedPost.update({
        where: { id: post.id },
        data: { score: Math.round(score * 100) / 100 }
      });
    }

    return { status: 200, data: { scored: posts.length } };
  } catch (err: any) {
    return { status: 500, error: err.message };
  }
}

/**
 * Cluster top posts into named topic groups using LLM
 */
export async function clusterTopPosts(orgId: string, topN: number = 20) {
  try {
    const posts = await client.scrapedPost.findMany({
      where: { orgId, score: { gt: 0 } },
      orderBy: { score: "desc" },
      take: topN
    });

    if (posts.length < 3) {
      return { status: 200, data: { clusters: [], message: "Need at least 3 scored posts to cluster" } };
    }

    const GEMINI_KEY = process.env.GEMINI_API_KEY || "";
    if (!GEMINI_KEY) {
      return { status: 400, error: "GEMINI_API_KEY not set" };
    }

    const postSummaries = posts.map((p, i) => 
      `${i + 1}. [${p.platform}] @${p.handle} | Views: ${p.views} | ER: ${p.er}% | Score: ${p.score}\n   Caption: ${(p.caption || "").slice(0, 200)}`
    ).join("\n");

    const prompt = `Analyze these top-performing short-form video posts and group them into 3-6 named topic clusters. For each cluster, provide:
- cluster_name: descriptive name
- post_indices: which posts belong (1-indexed)
- avg_score: average score of posts in cluster
- content_pattern: what makes this cluster work
- idea_seed: a content idea inspired by this cluster

Posts:
${postSummaries}

Respond with valid JSON: { "clusters": [...] }`;

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
      return { status: 500, error: `Gemini API error: ${await geminiRes.text()}` };
    }

    const geminiData = await geminiRes.json();
    const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const parsed = JSON.parse(text);
    const clusters = parsed.clusters || [];

    // Update posts with cluster names
    for (const cluster of clusters) {
      for (const idx of cluster.post_indices || []) {
        const post = posts[idx - 1];
        if (post) {
          await client.scrapedPost.update({
            where: { id: post.id },
            data: { cluster: cluster.cluster_name }
          });
        }
      }
    }

    return { status: 200, data: { clusters } };
  } catch (err: any) {
    return { status: 500, error: err.message };
  }
}

/**
 * Get scraped posts for a business
 */
export async function getScrapedPosts(orgId: string, limit: number = 50) {
  try {
    const posts = await client.scrapedPost.findMany({
      where: { orgId },
      orderBy: { score: "desc" },
      take: limit
    });
    return { status: 200, data: posts };
  } catch (err: any) {
    return { status: 500, error: err.message };
  }
}

/**
 * Generate ideas from a specific cluster
 */
export async function generateIdeasFromCluster(
  orgId: string,
  clusterName: string,
  count: number = 5
) {
  try {
    const org = await client.organization.findUnique({ where: { id: orgId } });
    if (!org) return { status: 404, error: "Organization not found" };

    // Get posts in this cluster for context
    const clusterPosts = await client.scrapedPost.findMany({
      where: { orgId, cluster: clusterName },
      orderBy: { score: "desc" },
      take: 10
    });

    const clusterContext = clusterPosts.map(p =>
      `@${p.handle}: "${(p.caption || "").slice(0, 150)}" (${p.views} views, ${p.er}% ER)`
    ).join("\n");

    // Call worker /ideas with cluster context
    const res = await fetch(`${WORKER_BASE}/ideas`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${FACTORY_SECRET}`
      },
      body: JSON.stringify({
        business: org,
        count,
        clusterContext: `These trending posts in the "${clusterName}" cluster performed well:\n${clusterContext}\n\n`
      })
    });

    if (!res.ok) {
      return { status: 500, error: `Worker ideas error: ${await res.text()}` };
    }

    const data = await res.json();
    const created = [];
    for (const idea of data.ideas || []) {
      const createdIdea = await client.contentIdea.create({
        data: {
          orgId,
          topic: idea.topic,
          angle: idea.angle,
          hookStyle: idea.hookStyle,
          contentPillar: idea.contentPillar,
          source: "scraper"
        }
      });
      created.push(createdIdea);
    }

    return { status: 200, data: created };
  } catch (err: any) {
    return { status: 500, error: err.message };
  }
}
