import { client } from "@/lib/prisma";

export const matchKeyword = async (keyword: string) => {
  return await client.keyword.findFirst({
    where: {
      word: {
        equals: keyword,
        mode: "insensitive",
      },
    },
  });
};

export const getKeywordAutomation = async (
  automationId: string,
  dm: boolean
) => {
  return await client.automation.findUnique({
    where: {
      id: automationId,
    },
    include: {
      dms: dm,
      trigger: {
        where: {
          type: dm ? "DM" : "COMMENT",
        },
      },
      listener: true,
      User: {
        select: {
          id: true,
          subscription: {
            select: {
              plan: true,
            },
          },
          integrations: {
            select: {
              token: true,
            },
          },
        },
      },
    },
  });
};

export const upsertContact = async (
  userId: string,
  instagramId: string,
  username?: string,
  token?: string
) => {
  let resolvedUsername = username;
  if (!resolvedUsername && token) {
    try {
      const response = await fetch(
        `https://graph.instagram.com/${instagramId}?fields=username,name&access_token=${token}`
      );
      if (response.ok) {
        const profile = await response.json();
        resolvedUsername = profile.username;
      }
    } catch (e) {
      console.error("Error fetching Instagram profile username:", e);
    }
  }

  if (!resolvedUsername) {
    resolvedUsername = `User_${instagramId.slice(-6)}`;
  }

  return await client.contact.upsert({
    where: {
      userId_instagramId: {
        userId,
        instagramId,
      },
    },
    update: {
      username: resolvedUsername,
    },
    create: {
      userId,
      instagramId,
      username: resolvedUsername,
    },
  });
};

export const trackResponse = async (
  automationId: string,
  type: "COMMENT" | "DM"
) => {
  if (type === "COMMENT") {
    return await client.listener.update({
      where: {
        automationId,
      },
      data: {
        commentCount: {
          increment: 1,
        },
      },
    });
  }

  if (type === "DM") {
    return await client.listener.update({
      where: {
        automationId,
      },
      data: {
        dmCount: {
          increment: 1,
        },
      },
    });
  }
};

export const createChatHistory = (
  automationId: string,
  sender: string,
  message: string,
  receiver: string
) => {
  return client.automation.update({
    where: {
      id: automationId,
    },
    data: {
      dms: {
        create: {
          reciever: receiver,
          senderId: sender,
          message,
        },
      },
    },
  });
};

export const getKeywordPost = async (postId: string, automationId: string) => {
  return await client.post.findFirst({
    where: {
      AND: [{ postid: postId }, { automationId }],
    },
    select: { automationId: true },
  });
};

export const getChatHistory = async (sender: string, receiver: string) => {
  const history = await client.dms.findMany({
    where: {
      AND: [{ senderId: sender }, { reciever: receiver }],
    },
    orderBy: { createdAt: "asc" },
  });

  const chatSession: {
    role: "assistant" | "user";
    content: string;
  }[] = history.map((chat) => {
    return {
      role: chat.reciever ? "assistant" : "user",
      content: chat.message!,
    };
  });
  return {
    history: chatSession,
    automationId: history[history.length - 1].automationId,
  };
};
