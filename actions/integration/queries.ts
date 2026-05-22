"use server";

import { client } from "@/lib/prisma";

export const updateIntegration = async (
  token: string,
  expire: Date,
  id: string
) => {
  return await client.integrations.update({
    where: { id },
    data: {
      token,
      expiresAt: expire,
    },
  });
};

export const getIntegrations = async (clerkId: string) => {
  return await client.user.findUnique({
    where: {
      clerkId,
    },
    select: {
      integrations: {
        where: {
          name: "INSTAGRAM",
        },
      },
    },
  });
};

export const createIntegration = async (
  clerkId: string,
  token: string,
  expire: Date,
  insts_id: string
) => {
  const user = await client.user.findUnique({
    where: { clerkId },
    include: {
      integrations: {
        where: { name: "INSTAGRAM" }
      }
    }
  });

  const existing = user?.integrations[0];

  if (existing) {
    await client.integrations.update({
      where: { id: existing.id },
      data: {
        token,
        expiresAt: expire,
        instagramId: insts_id,
      },
    });
    return {
      firstname: user?.firstname,
      lastname: user?.lastname,
    };
  }

  return await client.user.update({
    where: {
      clerkId,
    },
    data: {
      integrations: {
        create: {
          token,
          expiresAt: expire,
          instagramId: insts_id,
        },
      },
    },
    select: {
      firstname: true,
      lastname: true,
    },
  });
};

export const deleteIntegration = async (clerkId: string) => {
  return await client.user.update({
    where: { clerkId },
    data: {
      integrations: {
        deleteMany: {
          name: "INSTAGRAM",
        },
      },
    },
  });
};
