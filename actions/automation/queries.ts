"use server";

import { client } from "@/lib/prisma";
import { cache } from "react";

export const createAutomation = async (clerkId: string, id?: string, template?: string) => {
  let automationData: any = {};

  if (template === "say-hi") {
    automationData = {
      name: "Welcome DM Template",
      trigger: {
        create: {
          type: "DM",
        },
      },
      keywords: {
        createMany: {
          data: [
            { word: "hi" },
            { word: "hello" },
            { word: "hey" },
          ],
        },
      },
      listener: {
        create: {
          listener: "MESSAGE",
          prompt: "Hi! Thank you for reaching out. How can I help you today?",
        },
      },
    };
  } else if (template === "auto-dm-link") {
    automationData = {
      name: "Auto-DM Link Template",
      trigger: {
        create: {
          type: "COMMENT",
        },
      },
      keywords: {
        createMany: {
          data: [
            { word: "link" },
            { word: "send" },
            { word: "get" },
          ],
        },
      },
      listener: {
        create: {
          listener: "MESSAGE",
          prompt: "Here is the link you requested: https://example.com !",
        },
      },
    };
  } else if (template === "generate-leads") {
    automationData = {
      name: "Lead Gen Template",
      trigger: {
        create: {
          type: "DM",
        },
      },
      keywords: {
        createMany: {
          data: [
            { word: "lead" },
            { word: "yes" },
            { word: "info" },
          ],
        },
      },
      listener: {
        create: {
          listener: "MESSAGE",
          prompt: "Awesome! Please share your email address so we can send you the details.",
        },
      },
    };
  } else if (template === "respond-all") {
    automationData = {
      name: "Auto-Responder Template",
      trigger: {
        create: {
          type: "DM",
        },
      },
      keywords: {
        createMany: {
          data: [
            { word: "help" },
            { word: "support" },
            { word: "question" },
          ],
        },
      },
      listener: {
        create: {
          listener: "SMARTAI",
          prompt: "You are a helpful assistant. Provide support and answer user questions.",
        },
      },
    };
  } else if (template === "grow-followers") {
    automationData = {
      name: "Comment Growth Template",
      trigger: {
        create: {
          type: "COMMENT",
        },
      },
      keywords: {
        createMany: {
          data: [
            { word: "follow" },
            { word: "coupon" },
            { word: "gift" },
          ],
        },
      },
      listener: {
        create: {
          listener: "MESSAGE",
          prompt: "Thanks for the support! Here is your exclusive discount coupon code: WELCOME10!",
        },
      },
    };
  }

  if (id) {
    automationData.id = id;
  }

  return await client.user.update({
    where: {
      clerkId,
    },
    data: {
      automations: {
        create: automationData,
      },
    },
  });
};

export const getAutomation = cache(async (clerkId: string) => {
  return await client.user.findUnique({
    where: {
      clerkId,
    },
    select: {
      automations: {
        orderBy: {
          createdAt: "asc",
        },
        include: {
          keywords: true,
          listener: true,
        },
      },
    },
  });
});

export const findAutomation = cache(async (id: string) => {
  return await client.automation.findUnique({
    where: {
      id,
    },
    include: {
      keywords: true,
      trigger: true,
      posts: true,
      listener: true,
      User: {
        select: {
          id: true,
          subscription: true,
          integrations: true,
        },
      },
    },
  });
});

export const updateAutomation = async (
  automationId: string,
  update: {
    name?: string;
    active?: boolean;
  }
) => {
  return await client.automation.update({
    where: {
      id: automationId,
    },
    data: {
      name: update.name,
      active: update.active,
    },
  });
};

export const addListener = async (
  automationId: string,
  listener: "SMARTAI" | "MESSAGE",
  prompt: string,
  reply?: string
) => {
  return await client.automation.update({
    where: {
      id: automationId,
    },
    data: {
      listener: {
        create: {
          listener,
          prompt,
          commentReply: reply,
        },
      },
    },
  });
};

export const addTrigger = async (automationId: string, trigger: string[]) => {
  console.log("🚀 ~ addTrigger ~ automationId:", automationId);
  if (trigger.length === 2) {
    return await client.automation.update({
      where: {
        id: automationId,
      },
      data: {
        trigger: {
          createMany: {
            data: [{ type: trigger[0] }, { type: trigger[1] }],
          },
        },
      },
    });
  }

  return await client.automation.update({
    where: {
      id: automationId,
    },
    data: {
      trigger: {
        create: {
          type: trigger[0],
        },
      },
    },
  });
};

export const addKeyWords = async (automationId: string, keywords: string) => {
  return await client.automation.update({
    where: {
      id: automationId,
    },
    data: {
      keywords: {
        create: {
          word: keywords,
        },
      },
    },
  });
};

export const deleteKeywordsQuery = async (automationId: string) => {
  // console.log("🚀 ~ deleteKeywordsQuery ~ automationId:", automationId);
  return await client.keyword.delete({
    where: {
      id: automationId,
    },
  });
};

export const addPosts = async (
  automationId: string,
  posts: {
    postid: string;
    caption?: string;
    media: string;
    mediaType: "IMAGE" | "VIDEO" | "CAROSEL_ALBUM";
  }[]
) => {
  return await client.automation.update({
    where: {
      id: automationId,
    },
    data: {
      posts: {
        createMany: {
          data: posts,
        },
      },
    },
  });
};

export const createContentEngineAutomationQuery = async (
  clerkId: string,
  topic: string,
  keyword: string,
  promptText: string,
  replyText?: string
) => {
  return await client.user.update({
    where: {
      clerkId,
    },
    data: {
      automations: {
        create: {
          name: `Content: ${topic.slice(0, 30)}`,
          active: true,
          trigger: {
            create: {
              type: "COMMENT",
            },
          },
          keywords: {
            create: {
              word: keyword.toLowerCase(),
            },
          },
          listener: {
            create: {
              listener: "MESSAGE",
              prompt: promptText,
              commentReply: replyText || "Sent! Check your DMs.",
            },
          },
        },
      },
    },
  });
};

