"use server";

import { client } from "@/lib/prisma";

/**
 * Get full documentary timeline for a business
 */
export async function getDocumentaryTimeline(businessId: string) {
  try {
    const logs = await client.documentaryLog.findMany({
      where: { businessId },
      orderBy: { createdAt: "asc" }
    });

    const biz = await client.business.findUnique({ where: { id: businessId } });

    return {
      status: 200,
      data: {
        business: biz,
        timeline: logs,
        milestones: extractMilestones(logs)
      }
    };
  } catch (err: any) {
    return { status: 500, error: err.message };
  }
}

/**
 * Export documentary timeline as markdown
 */
export async function exportTimelineMarkdown(businessId: string) {
  try {
    const biz = await client.business.findUnique({ where: { id: businessId } });
    if (!biz) return { status: 404, error: "Business not found" };

    const logs = await client.documentaryLog.findMany({
      where: { businessId },
      orderBy: { createdAt: "asc" }
    });

    // Get stats
    const totalJobs = await client.contentJob.count({ where: { businessId } });
    const publishedJobs = await client.contentJob.count({ where: { businessId, status: "PUBLISHED" } });
    const rejectedJobs = await client.contentJob.count({ where: { businessId, status: "REJECTED" } });

    let md = `# ${biz.name} — Documentary Timeline\n\n`;
    md += `> ${biz.description}\n\n`;
    md += `**Stats:** ${totalJobs} total jobs | ${publishedJobs} published | ${rejectedJobs} rejected\n\n`;
    md += `---\n\n`;

    // Group by date
    const byDate: Record<string, typeof logs> = {};
    for (const log of logs) {
      const dateKey = log.createdAt.toISOString().split("T")[0];
      if (!byDate[dateKey]) byDate[dateKey] = [];
      byDate[dateKey].push(log);
    }

    for (const [date, dateLogs] of Object.entries(byDate)) {
      const d = new Date(date);
      md += `## ${d.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}\n\n`;

      for (const log of dateLogs) {
        const time = log.createdAt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
        const icon = getEventIcon(log.event);
        const detail = log.detail ? ` — ${formatDetail(log.detail)}` : "";
        md += `- ${icon} **${time}** — ${formatEventName(log.event)}${detail}\n`;
      }

      md += `\n`;
    }

    // Milestones section
    const milestones = extractMilestones(logs);
    if (milestones.length > 0) {
      md += `---\n\n## 🏆 Milestones\n\n`;
      for (const m of milestones) {
        md += `- **${m.date}** — ${m.label}\n`;
      }
    }

    return { status: 200, data: md };
  } catch (err: any) {
    return { status: 500, error: err.message };
  }
}

function extractMilestones(logs: any[]) {
  const milestones: { date: string; label: string }[] = [];
  const seen = new Set<string>();

  for (const log of logs) {
    if (log.event === "onboarded" && !seen.has("onboarded")) {
      milestones.push({ date: log.createdAt.toISOString().split("T")[0], label: "🎬 Business onboarded" });
      seen.add("onboarded");
    }
    if (log.event === "video_approved_and_published" && !seen.has("first_publish")) {
      milestones.push({ date: log.createdAt.toISOString().split("T")[0], label: "📤 First video published" });
      seen.add("first_publish");
    }
    if (log.event === "weekly_analysis_completed" && !seen.has("first_analysis")) {
      milestones.push({ date: log.createdAt.toISOString().split("T")[0], label: "📊 First weekly analysis" });
      seen.add("first_analysis");
    }
  }

  return milestones;
}

function getEventIcon(event: string): string {
  const icons: Record<string, string> = {
    onboarded: "🎬",
    video_approved_and_published: "📤",
    video_rejected: "❌",
    cron_pipeline_dispatched: "⚙️",
    weekly_analysis_completed: "📊",
    render_completed: "🎥",
    render_failed: "💥"
  };
  return icons[event] || "📌";
}

function formatEventName(event: string): string {
  return event.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function formatDetail(detail: any): string {
  if (typeof detail === "string") return detail;
  if (detail.reason) return detail.reason;
  if (detail.ideaTopic) return `"${detail.ideaTopic}"`;
  if (detail.jobId) return `Job ${detail.jobId.slice(0, 8)}…`;
  return JSON.stringify(detail).slice(0, 100);
}
