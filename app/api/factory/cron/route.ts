import { NextRequest, NextResponse } from "next/server";
import { client } from "@/lib/prisma";

const WORKER_BASE = "https://marketing-machine-orchestrator.mindmaxing.workers.dev";
const FACTORY_SECRET = process.env.FACTORY_SECRET || "";

export async function GET(req: NextRequest) {
  // Verify cron secret (Vercel sends this header)
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  const factorySecret = process.env.FACTORY_SECRET;

  const isValidCron = cronSecret && authHeader === `Bearer ${cronSecret}`;
  const isValidFactory = factorySecret && authHeader === `Bearer ${factorySecret}`;

  if (!isValidCron && !isValidFactory) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: any[] = [];

  try {
    // Get all active organizations
    const organizations = await client.organization.findMany({
      where: { active: true }
    });

    for (const org of organizations) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Count jobs created today for this organization
      const todayJobCount = await client.contentJob.count({
        where: {
          orgId: org.id,
          createdAt: { gte: today }
        }
      });

      const deficit = org.postsPerDay - todayJobCount;
      if (deficit <= 0) {
        results.push({ slug: org.slug, action: "skipped", reason: "quota met" });
        continue;
      }

      // Check for unused ideas, generate if needed
      let unusedIdeas = await client.contentIdea.findMany({
        where: { orgId: org.id, used: false },
        take: deficit
      });

      if (unusedIdeas.length < deficit) {
        // Generate a batch of 10 ideas via worker
        try {
          const ideasRes = await fetch(`${WORKER_BASE}/ideas`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${FACTORY_SECRET}`
            },
            body: JSON.stringify({ business: org, count: 10 })
          });

          if (ideasRes.ok) {
            const ideasData = await ideasRes.json();
            for (const idea of ideasData.ideas || []) {
              await client.contentIdea.create({
                data: {
                  orgId: org.id,
                  topic: idea.topic,
                  angle: idea.angle,
                  hookStyle: idea.hookStyle,
                  contentPillar: idea.contentPillar,
                  source: "llm"
                }
              });
            }
          }

          unusedIdeas = await client.contentIdea.findMany({
            where: { orgId: org.id, used: false },
            take: deficit
          });
        } catch (e: any) {
          results.push({ slug: org.slug, action: "error", reason: `Idea gen failed: ${e.message}` });
          continue;
        }
      }

      // Run pipeline for each idea up to the deficit
      for (const idea of unusedIdeas.slice(0, deficit)) {
        try {
          // Create job
          const job = await client.contentJob.create({
            data: { orgId: org.id, ideaId: idea.id, status: "IDEA" }
          });

          // 1. Script
          const scriptRes = await fetch(`${WORKER_BASE}/script`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${FACTORY_SECRET}` },
            body: JSON.stringify({ business: org, idea })
          });

          if (!scriptRes.ok) {
            await client.contentJob.update({ where: { id: job.id }, data: { status: "FAILED", renderLog: `Script failed: ${await scriptRes.text()}` } });
            continue;
          }

          const scriptData = await scriptRes.json();
          const script = scriptData.script;

          await client.contentJob.update({
            where: { id: job.id },
            data: { status: "SCRIPTED", script, caption: `${script.hook}\n\n${script.body?.join("\n") || ""}\n\n${script.cta}\n\n${org.hashtags || ""}` }
          });

          // 2. TTS
          const ttsRes = await fetch(`${WORKER_BASE}/tts`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${FACTORY_SECRET}` },
            body: JSON.stringify({ business: org, jobId: job.id, scriptText: script.scriptText })
          });

          if (!ttsRes.ok) {
            await client.contentJob.update({ where: { id: job.id }, data: { status: "FAILED", renderLog: `TTS failed: ${await ttsRes.text()}` } });
            continue;
          }

          const ttsData = await ttsRes.json();
          await client.contentJob.update({
            where: { id: job.id },
            data: { status: "RENDERING", audioKey: ttsData.audioKey }
          });

          // 3. Dispatch render to VPS
          await fetch(`${WORKER_BASE}/render`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${FACTORY_SECRET}` },
            body: JSON.stringify({ businessSlug: org.slug, jobId: job.id })
          });

          // Mark idea as used
          await client.contentIdea.update({ where: { id: idea.id }, data: { used: true } });

          // Log
          await client.documentaryLog.create({
            data: { orgId: org.id, event: "cron_pipeline_dispatched", detail: { jobId: job.id, ideaTopic: idea.topic } }
          });

          results.push({ slug: org.slug, action: "dispatched", jobId: job.id });
        } catch (e: any) {
          results.push({ slug: org.slug, action: "error", reason: e.message });
        }
      }
    }

    return NextResponse.json({ ok: true, results }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
