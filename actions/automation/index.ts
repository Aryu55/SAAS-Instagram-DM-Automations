"use server";

import { onCurrentUser } from "../user";
import { findUser } from "../user/queries";
import {
  addKeyWords,
  addListener,
  addPosts,
  addTrigger,
  createAutomation,
  deleteKeywordsQuery,
  findAutomation,
  getAutomation,
  updateAutomation,
  createContentEngineAutomationQuery,
} from "./queries";

export const createAutomations = async (id?: string, template?: string) => {
  const user = await onCurrentUser();
  console.log("[AUTOMATION ACTIONS] createAutomations called for userId:", user.id, "with template:", template || "none");

  try {
    const create = await createAutomation(user.id, id, template);
    console.log("[AUTOMATION ACTIONS] createAutomation query resolved:", create ? "success" : "failure");

    if (create) return { status: 200, data: "Automation created" };
    return { status: 404, data: "Failed to create automation" };
  } catch (error: any) {
    console.error("[AUTOMATION ACTIONS] createAutomations failed:", error.message);
    return { status: 500, data: error.message };
  }
};

export const getAllAutomation = async () => {
  const user = await onCurrentUser();
  console.log("[AUTOMATION ACTIONS] getAllAutomation called for userId:", user.id);

  try {
    const getAll = await getAutomation(user.id);
    console.log("[AUTOMATION ACTIONS] getAutomation resolved. Total automations count:", getAll?.automations?.length || 0);

    if (getAll) return { status: 200, data: getAll.automations || [] };

    return { status: 404, data: [] };
  } catch (error: any) {
    console.error("[AUTOMATION ACTIONS] getAllAutomation failed:", error.message);
    return { status: 500, data: [] };
  }
};

export const getAutomationInfo = async (id: string) => {
  console.log("[AUTOMATION ACTIONS] getAutomationInfo called for automationId:", id);

  try {
    const automation = await findAutomation(id);
    console.log("[AUTOMATION ACTIONS] findAutomation resolved:", automation ? { id: automation.id, name: automation.name } : "null");

    if (automation) return { status: 200, data: automation };

    return { status: 404 };
  } catch (error: any) {
    console.error("[AUTOMATION ACTIONS] getAutomationInfo failed:", error.message);
    return { status: 500 };
  }
};

export const updateAutomationName = async (
  automationId: string,
  data: {
    name?: string;
    active?: boolean;
    automation?: string;
  }
) => {
  console.log("[AUTOMATION ACTIONS] updateAutomationName called for automationId:", automationId, "with payload:", JSON.stringify(data, null, 2));

  try {
    const update = await updateAutomation(automationId, data);
    console.log("[AUTOMATION ACTIONS] updateAutomation resolved status:", update ? "success" : "failure");

    if (update) return { status: 200, data: "Automation updated" };
    return { status: 404, data: "Failed to update automation" };
  } catch (error: any) {
    console.error("[AUTOMATION ACTIONS] updateAutomationName failed:", error.message);
    return { status: 500, data: "Failed to update automation" };
  }
};

export const saveListener = async (
  automationId: string,
  listener: "SMARTAI" | "MESSAGE",
  prompt: string,
  reply?: string
) => {
  console.log("[AUTOMATION ACTIONS] saveListener called for automationId:", automationId, { listener, prompt, reply });

  try {
    const create = await addListener(automationId, listener, prompt, reply);
    console.log("[AUTOMATION ACTIONS] addListener query resolved status:", create ? "success" : "failure");

    if (create) return { status: 200, data: "Listener created" };
    return { status: 404, data: "Failed to create listener" };
  } catch (error: any) {
    console.error("[AUTOMATION ACTIONS] saveListener failed:", error.message);
    return { status: 500, data: "Failed to save listener" };
  }
};

export const saveTrigger = async (automationId: string, trigger: string[]) => {
  console.log("[AUTOMATION ACTIONS] saveTrigger called for automationId:", automationId, "with triggers:", trigger);

  try {
    const create = await addTrigger(automationId, trigger);
    console.log("[AUTOMATION ACTIONS] addTrigger query resolved status:", create ? "success" : "failure");

    if (create) return { status: 200, data: "Trigger created" };
    return { status: 404, data: "Failed to create trigger" };
  } catch (error: any) {
    console.error("[AUTOMATION ACTIONS] saveTrigger failed:", error.message);
    return { status: 500, data: "Failed to save trigger" };
  }
};

export const saveKeywords = async (automationId: string, keywords: string) => {
  console.log("[AUTOMATION ACTIONS] saveKeywords called for automationId:", automationId, "keyword:", keywords);

  try {
    const create = await addKeyWords(automationId, keywords);
    console.log("[AUTOMATION ACTIONS] addKeyWords query resolved status:", create ? "success" : "failure");

    if (create) return { status: 200, data: "Keywords created" };
    return { status: 404, data: "Failed to create keywords" };
  } catch (error: any) {
    console.error("[AUTOMATION ACTIONS] saveKeywords failed:", error.message);
    return { status: 500, data: "Failed to save keywords" };
  }
};

export const deleteKeywords = async (automationId: string) => {
  console.log("[AUTOMATION ACTIONS] deleteKeywords called for automationId:", automationId);

  try {
    const deleted = await deleteKeywordsQuery(automationId);
    console.log("[AUTOMATION ACTIONS] deleteKeywordsQuery resolved status:", deleted ? "success" : "failure");

    if (deleted) {
      return { status: 200, data: "Keywords deleted" };
    }
    return { status: 404, data: "Failed to delete keywords" };
  } catch (error: any) {
    console.error("[AUTOMATION ACTIONS] deleteKeywords failed:", error.message);
    return { status: 500, data: "Failed to delete keywords" };
  }
};

export const getProfilePosts = async () => {
  const user = await onCurrentUser();
  console.log("[AUTOMATION ACTIONS] getProfilePosts called for userId:", user.id);

  try {
    const profile = await findUser(user.id);
    console.log("[AUTOMATION ACTIONS] getProfilePosts profile load. Integrations count:", profile?.integrations?.length || 0);

    if (!profile || profile.integrations.length === 0) {
      console.warn("[AUTOMATION ACTIONS] Profile loaded but no connected Instagram integration found.");
      return { status: 404 };
    }

    const baseUrl = process.env.INSTAGRAM_BASE_URL || "https://graph.instagram.com";
    console.log("[AUTOMATION ACTIONS] Dispatching Graph API request to load Instagram media posts...");
    const posts = await fetch(
      `${baseUrl}/me/media?fields=id,caption,media_url,media_type,timestamp,thumbnail_url&limit=10&access_token=${profile.integrations[0].token}`,
      {
        next: {
          revalidate: 0, // Disable fetch cache so media updates immediately
        },
      }
    );

    if (!posts.ok) {
      const errorData = await posts.json().catch(() => ({}));
      console.error("[AUTOMATION ACTIONS] Instagram API error fetching media:", errorData);
      return { 
        status: posts.status, 
        error: errorData.error?.message || "Failed to fetch media from Instagram" 
      };
    }

    const parsed = await posts.json();
    console.log("[AUTOMATION ACTIONS] Successfully fetched Instagram posts count:", parsed?.data?.length || 0);

    if (parsed) return { status: 200, data: parsed };
    return { status: 404, error: "No media data returned" };
  } catch (error: any) {
    console.error("[AUTOMATION ACTIONS] getProfilePosts failed with error:", error.message);
    return { status: 500, error: error.message };
  }
};

export const savePosts = async (
  automationId: string,
  posts: {
    postid: string;
    caption?: string;
    media: string;
    mediaType: "IMAGE" | "VIDEO" | "CAROSEL_ALBUM";
  }[]
) => {
  console.log("[AUTOMATION ACTIONS] savePosts requested for automationId:", automationId, "postsCount:", posts.length);

  try {
    const create = await addPosts(automationId, posts);
    console.log("[AUTOMATION ACTIONS] addPosts query resolved status:", create ? "success" : "failure");

    if (create) return { status: 200, data: "Posts created" };
    return { status: 404, data: "Failed to create posts" };
  } catch (error: any) {
    console.error("[AUTOMATION ACTIONS] savePosts failed:", error.message);
    return { status: 500, data: "Failed to save posts" };
  }
};

export const activateAutomation = async (id: string, status: boolean) => {
  console.log("[AUTOMATION ACTIONS] activateAutomation called for automationId:", id, "activeStatus:", status);

  try {
    const activate = await updateAutomation(id, { active: status });
    console.log("[AUTOMATION ACTIONS] updateAutomation resolved status:", activate ? "success" : "failure");

    if (activate) {
      return {
        status: 200,
        data: `Automation ${status ? "activated" : "deactivated"}`,
      };
    }
    return { status: 404, data: "Failed to activate automation" };
  } catch (error: any) {
    console.error("[AUTOMATION ACTIONS] activateAutomation failed:", error.message);
    return { status: 500, data: "Failed to activate automation" };
  }
};

export const createAutomationFromContentEngine = async (
  topic: string,
  keyword: string,
  promptText: string,
  replyText?: string
) => {
  const user = await onCurrentUser();
  console.log("[AUTOMATION ACTIONS] createAutomationFromContentEngine called:", {
    userId: user.id,
    topic,
    keyword,
    promptText,
    replyText
  });

  try {
    const create = await createContentEngineAutomationQuery(
      user.id,
      topic,
      keyword,
      promptText,
      replyText
    );
    console.log("[AUTOMATION ACTIONS] createContentEngineAutomationQuery resolved status:", create ? "success" : "failure");

    if (create) {
      return { status: 200, data: "Automation created successfully!" };
    }
    return { status: 404, data: "Failed to create automation." };
  } catch (error: any) {
    console.error("[AUTOMATION ACTIONS] createAutomationFromContentEngine failed:", error.message);
    return { status: 500, data: error.message };
  }
};
