"use server";

import { client } from "@/lib/prisma";

/**
 * Get contacts for a specific organization
 */
export async function getOrgContacts(orgId: string) {
  try {
    const contacts = await client.contact.findMany({
      where: { orgId },
      orderBy: { createdAt: "desc" },
    });
    return { status: 200, data: contacts };
  } catch (err: any) {
    return { status: 500, data: [], error: err.message };
  }
}

/**
 * Get automations for a specific organization
 */
export async function getOrgAutomations(orgId: string) {
  try {
    const automations = await client.automation.findMany({
      where: { orgId },
      orderBy: { createdAt: "desc" },
      include: {
        keywords: true,
        listener: true,
        trigger: true,
        _count: { select: { dms: true } },
      },
    });
    return { status: 200, data: automations };
  } catch (err: any) {
    return { status: 500, data: [], error: err.message };
  }
}
