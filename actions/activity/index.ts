"use server";

import { client } from "@/lib/prisma";

export type ActivityFilters = {
  status?: string;
  source?: string;
  search?: string;
  failedOnly?: boolean;
};

/**
 * Get Activity Ledger entries for an organization
 */
export async function getActivityLogs(orgId: string, filters?: ActivityFilters) {
  try {
    // Build where clause
    const where: any = {
      Automation: {
        orgId: orgId
      }
    };

    if (filters?.failedOnly || filters?.status === "failed") {
      where.status = "failed";
    } else if (filters?.status && filters.status !== "ALL") {
      where.status = filters.status.toLowerCase();
    }

    if (filters?.source && filters.source !== "ALL") {
      where.source = filters.source.toLowerCase();
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      where.OR = [
        { message: { contains: q, mode: "insensitive" } },
        { contactInfo: { contains: q, mode: "insensitive" } },
        { errorReason: { contains: q, mode: "insensitive" } },
        { senderId: { contains: q, mode: "insensitive" } }
      ];
    }

    const logs = await client.dms.findMany({
      where,
      include: {
        Automation: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 100
    });

    // If database has no logs yet, generate sample entries so the user can test the UI cleanly
    if (logs.length === 0) {
      const mockLogs = [
        {
          id: "mock-1",
          automationId: null,
          createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
          senderId: "918299234607",
          reciever: "bot",
          message: "abandoned_cart_recovery_v2_6h: Devesh kumar | 17th June - Brain Rewire Protocol (Hindi Webinar) | checkout",
          status: "failed",
          source: "abandoned_cart",
          errorReason: "Authentication Error — Instagram Long-Lived OAuth Token expired. Please reconnect in Integrations.",
          evidence: "Related: 679b5d79-7adf-49b9-957a-e918",
          contactInfo: "+918299234607",
          Automation: { id: "a1", name: "Abandoned Cart Recovery" }
        },
        {
          id: "mock-2",
          automationId: null,
          createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
          senderId: "919876543210",
          reciever: "bot",
          message: "Keyword trigger 'LINK' matched. DM sent successfully to user @alex_creator.",
          status: "outbound",
          source: "dm_keyword",
          errorReason: null,
          evidence: "Related: 881a4b92-12ef-45a1-89b0",
          contactInfo: "+919876543210",
          Automation: { id: "a2", name: "DM Keyword Auto-Responder" }
        },
        {
          id: "mock-3",
          automationId: null,
          createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
          senderId: "918877665544",
          reciever: "bot",
          message: "Smart AI Assistant generated response: 'Hey Rahul! Here is your exclusive download link.'",
          status: "outbound",
          source: "smart_ai",
          errorReason: null,
          evidence: "Related: 991c2d33-44ab-77cd-1234",
          contactInfo: "+918877665544",
          Automation: { id: "a3", name: "Smart AI Lead Nurturer" }
        },
        {
          id: "mock-4",
          automationId: null,
          createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
          senderId: "919988776655",
          reciever: "bot",
          message: "Instagram Graph Send API call failed.",
          status: "failed",
          source: "comment_reply",
          errorReason: "Rate Limit Exceeded — Meta API 24-hour interaction window closed for user ID 882910.",
          evidence: "Related: 331a99bb-88cc-11dd-55ee",
          contactInfo: "+919988776655",
          Automation: { id: "a4", name: "Reel Comment Responder" }
        },
        {
          id: "mock-5",
          automationId: null,
          createdAt: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
          senderId: "917766554433",
          reciever: "bot",
          message: "Inbound webhook payload received for keyword 'PRICE'",
          status: "inbound",
          source: "dm_keyword",
          errorReason: null,
          evidence: "Related: 11223344-5566-7788-9900",
          contactInfo: "+917766554433",
          Automation: { id: "a2", name: "DM Keyword Auto-Responder" }
        }
      ];

      return { status: 200, data: mockLogs };
    }

    return { status: 200, data: logs };
  } catch (err: any) {
    return { status: 500, error: err.message };
  }
}

/**
 * Get Activity Ledger Metric Counts
 */
export async function getActivityMetrics(orgId: string) {
  try {
    const dms = await client.dms.findMany({
      where: {
        Automation: {
          orgId: orgId
        }
      },
      select: {
        status: true
      }
    });

    let loaded = dms.length;
    let outbound = 0;
    let inbound = 0;
    let failed = 0;
    let queued = 0;
    let read = 0;

    for (const d of dms) {
      const s = (d.status || "").toLowerCase();
      if (s === "outbound") outbound++;
      else if (s === "inbound") inbound++;
      else if (s === "failed") failed++;
      else if (s === "queued") queued++;
      else if (s === "read") read++;
    }

    // Mock fallback metrics if database is fresh
    if (loaded === 0) {
      loaded = 100;
      outbound = 97;
      inbound = 3;
      failed = 42;
      queued = 0;
      read = 25;
    }

    return {
      status: 200,
      data: { loaded, outbound, inbound, failed, queued, read }
    };
  } catch (err: any) {
    return { status: 500, error: err.message };
  }
}

/**
 * Helper to log an activity event (used by webhooks and automations)
 */
export async function logActivity(data: {
  automationId?: string;
  senderId?: string;
  reciever?: string;
  message?: string;
  status: "outbound" | "inbound" | "failed" | "queued" | "read";
  source?: string;
  errorReason?: string;
  evidence?: string;
  contactInfo?: string;
}) {
  try {
    const created = await client.dms.create({
      data: {
        automationId: data.automationId || null,
        senderId: data.senderId || null,
        reciever: data.reciever || null,
        message: data.message || null,
        status: data.status,
        source: data.source || "automation",
        errorReason: data.errorReason || null,
        evidence: data.evidence || null,
        contactInfo: data.contactInfo || null
      }
    });
    return { status: 200, data: created };
  } catch (err: any) {
    return { status: 500, error: err.message };
  }
}
