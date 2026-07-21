import { NextRequest, NextResponse } from "next/server";
import { client } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    const expectedToken = `Bearer ${process.env.FACTORY_SECRET}`;
    if (!process.env.FACTORY_SECRET || authHeader !== expectedToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId, status, videoKey, renderLog } = await req.json();

    if (!jobId || !status) {
      return NextResponse.json({ error: "Missing jobId or status" }, { status: 400 });
    }

    const existingJob = await client.contentJob.findUnique({
      where: { id: jobId },
      include: { org: true }
    });

    if (!existingJob) {
      return NextResponse.json({ error: "ContentJob not found" }, { status: 404 });
    }

    // Update job status, keys, and log output
    const updatedJob = await client.contentJob.update({
      where: { id: jobId },
      data: {
        status: status === "REVIEW" ? "REVIEW" : "FAILED",
        videoKey: videoKey || null,
        renderLog: renderLog || null
      }
    });

    // Write to organization DocumentaryLog
    await client.documentaryLog.create({
      data: {
        orgId: existingJob.orgId,
        event: status === "REVIEW" ? "video_rendered" : "video_render_failed",
        detail: {
          jobId,
          videoKey: videoKey || null,
          error: status === "FAILED" ? "See render logs for execution failures." : null
        }
      }
    });

    console.log(`[Factory Callback] Processed job ${jobId} successfully -> Status: ${status}`);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[Factory Callback] Error processing callback:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
