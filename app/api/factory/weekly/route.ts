import { NextRequest, NextResponse } from "next/server";
import { client } from "@/lib/prisma";
import { analyzeWeeklyPerformance, pullInstagramMetrics } from "@/actions/factory/metrics";

export async function GET(req: NextRequest) {
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
    const organizations = await client.organization.findMany({
      where: { active: true }
    });

    for (const org of organizations) {
      // Pull latest metrics
      const metricsResult = await pullInstagramMetrics(org.id);

      // Check if organization has enough published posts for analysis
      const publishedCount = await client.contentJob.count({
        where: { orgId: org.id, status: { in: ["PUBLISHED", "SCHEDULED", "APPROVED"] } }
      });

      if (publishedCount >= 5) {
        const analysisResult = await analyzeWeeklyPerformance(org.id);
        results.push({
          slug: org.slug,
          metrics: metricsResult.status === 200 ? "ok" : metricsResult.error,
          analysis: analysisResult.status === 200 ? "ok" : analysisResult.error,
          patterns: (analysisResult as any).data?.patterns || null
        });
      } else {
        results.push({
          slug: org.slug,
          metrics: metricsResult.status === 200 ? "ok" : metricsResult.error,
          analysis: `skipped (${publishedCount}/5 published posts minimum)`
        });
      }
    }

    return NextResponse.json({ ok: true, results }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
