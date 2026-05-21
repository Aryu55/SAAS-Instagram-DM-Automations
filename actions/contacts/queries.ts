"use server";

import { onCurrentUser } from "../user";
import { client } from "@/lib/prisma";

export const getContacts = async () => {
  const user = await onCurrentUser();
  try {
    const dbUser = await client.user.findUnique({
      where: { clerkId: user.id },
      select: {
        contacts: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (dbUser) return { status: 200, data: dbUser.contacts };
    return { status: 404, data: [] };
  } catch (error: any) {
    return { status: 500, data: [] };
  }
};
