"use server";

import { onCurrentUser } from "../user";
import { client } from "@/lib/prisma";

export const getContacts = async (slug?: string) => {
  const user = await onCurrentUser();
  try {
    const dbUser = await client.user.findUnique({
      where: { clerkId: user.id },
    });
    if (!dbUser) return { status: 404, data: [] };

    let orgId: string | undefined = undefined;
    if (slug) {
      const org = await client.organization.findUnique({
        where: { slug },
        select: { id: true },
      });
      if (org) orgId = org.id;
    }

    const contacts = await client.contact.findMany({
      where: {
        userId: dbUser.id,
        ...(orgId ? { orgId } : {}),
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { status: 200, data: contacts };
  } catch (error: any) {
    return { status: 500, data: [] };
  }
};
