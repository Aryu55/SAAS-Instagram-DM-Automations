import { NextRequest, NextResponse } from "next/server";
import { client } from "@/lib/prisma";
import { analyzeWeeklyPerformance, pullInstagramMetrics } from "@/actions/factory/metrics";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const FACTORY_SECRET = process.env.FACTORY_SECRET || "";

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && authHeader !== `Bearer ${FACTORY_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: any[] = [];

  try {
    const businesses = await client.business.findMany({
      where: { active: true }
    });

    for (const biz of businesses) {
      // Pull latest metrics
      const metricsResult = await pullInstagramMetrics(biz.id);

      // Check if business has enough published posts for analysis
      const publishedCount = await client.contentJob.count({
        where: { businessId: biz.id, status: { in: ["PUBLISHED", "SCHEDULED", "APPROVED"] } }
      });

      if (publishedCount >= 5) {
        const analysisResult = await analyzeWeeklyPerformance(biz.id);
        results.push({
          slug: biz.slug,
          metrics: metricsResult.status === 200 ? "ok" : metricsResult.error,
          analysis: analysisResult.status === 200 ? "ok" : analysisResult.error,
          patterns: (analysisResult as any).data?.patterns || null
        });
      } else {
        results.push({
          slug: biz.slug,
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
