"use server";

import { generateToken } from "@/lib/fetch";
import axios from "axios";
import { redirect } from "next/navigation";
import { onCurrentUser } from "../user";
import { createIntegration, getIntegrations, deleteIntegration } from "./queries";

import { headers } from "next/headers";

export const onOathInstagram = async (strategy: "INSTAGRAM" | "CRM") => {
  if (strategy === "INSTAGRAM") {
    const hostHeader = headers().get("host") || "localhost:3000";
    const protocol = hostHeader.includes("localhost") ? "http" : "https";
    const origin = `${protocol}://${hostHeader}`;
    
    const clientId = process.env.INSTAGRAM_CLIENT_ID;
    const redirectUri = `${origin}/callback/instagram`;
    
    // Use Facebook Login for Business OAuth (Instagram Basic Display API is deprecated)
    // This endpoint works for Instagram business/creator accounts connected to Facebook Pages
    const scopes = [
      "instagram_basic",
      "instagram_manage_messages",
      "instagram_manage_comments",
      "pages_show_list",
      "pages_manage_metadata",
      "pages_messaging",
    ].join(",");

    const oauthUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&response_type=code`;
    
    return redirect(oauthUrl);
  }
};


export const onIntegrate = async (code: string) => {
  const user = await onCurrentUser();

  try {
    const hostHeader = headers().get("host") || "localhost:3000";
    const protocol = hostHeader.includes("localhost") ? "http" : "https";
    const origin = `${protocol}://${hostHeader}`;

    const token = await generateToken(code, origin);

    console.log("🚀 ~ onIntegrate ~ token:", token);

    if (token) {
      // With Facebook Login flow, we get a Facebook Page token
      // We need to get the Instagram Business Account ID connected to the page
      let instagramId: string | null = null;

      try {
        // First get the user's pages
        const pagesRes = await axios.get(
          `https://graph.facebook.com/v19.0/me/accounts?access_token=${token.access_token}`
        );
        
        if (pagesRes.data?.data?.length > 0) {
          // Get the first page and find its connected Instagram account
          for (const page of pagesRes.data.data) {
            try {
              const igRes = await axios.get(
                `https://graph.facebook.com/v19.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token || token.access_token}`
              );
              if (igRes.data?.instagram_business_account?.id) {
                instagramId = igRes.data.instagram_business_account.id;
                break;
              }
            } catch {
              // This page doesn't have an IG business account, try next
              continue;
            }
          }
        }
      } catch (e: any) {
        console.error("Failed to get Instagram Business Account from pages:", e.message);
      }

      // Fallback: try direct Instagram user ID
      if (!instagramId) {
        try {
          const meRes = await axios.get(
            `https://graph.facebook.com/v19.0/me?fields=id&access_token=${token.access_token}`
          );
          instagramId = meRes.data.id;
        } catch (e: any) {
          console.error("Failed to get user ID:", e.message);
        }
      }

      if (!instagramId) {
        console.error("Could not determine Instagram user ID from OAuth flow");
        return { status: 401 };
      }

      const today = new Date();
      const expire_date = today.setDate(today.getDate() + 60);
      // createIntegration handles upsert (update if exists, create if not)
      const create = await createIntegration(
        user.id,
        token.access_token,
        new Date(expire_date),
        instagramId
      );
      return { status: 200, data: create };
    }
    return { status: 401 };
  } catch (error: any) {
    console.error("onIntegrate error:", error.message);
    return { status: 500 };
  }
};

export const onIntegrateManual = async (token: string) => {
  const user = await onCurrentUser();
  let insts_id = null;
  let errorMsg = "";

  // Try graph.instagram.com first (Instagram Basic Display)
  try {
    const response = await axios.get(
      `${process.env.INSTAGRAM_BASE_URL || "https://graph.instagram.com"}/me?fields=id&access_token=${token}`
    );
    insts_id = response.data.id;
  } catch (error: any) {
    errorMsg = error.response?.data?.error?.message || error.message;
    console.error("Failed verification via graph.instagram.com:", errorMsg);
  }

  // Fallback to graph.facebook.com (Instagram Graph API / Facebook Login for Business)
  if (!insts_id) {
    try {
      const response = await axios.get(
        `https://graph.facebook.com/v19.0/me?fields=id&access_token=${token}`
      );
      insts_id = response.data.id;
    } catch (error: any) {
      errorMsg = error.response?.data?.error?.message || error.message;
      console.error("Failed verification via graph.facebook.com:", errorMsg);
    }
  }

  if (!insts_id) {
    return { status: 400, error: `Invalid token or could not fetch Instagram user ID: ${errorMsg}` };
  }

  try {
    const today = new Date();
    const expire_date = today.setDate(today.getDate() + 60); // Long-lived tokens last ~60 days
    const create = await createIntegration(
      user.id,
      token,
      new Date(expire_date),
      insts_id
    );

    return { status: 200, data: create };
  } catch (error: any) {
    console.error("Manual integration database error:", error.message);
    return { status: 500, error: error.message };
  }
};

export const onDisconnectIntegration = async () => {
  const user = await onCurrentUser();
  try {
    const deleted = await deleteIntegration(user.id);
    if (deleted) return { status: 200, data: "Successfully disconnected Instagram account!" };
    return { status: 404, data: "No integration found to disconnect." };
  } catch (error: any) {
    console.error("Disconnect integration error:", error.message);
    return { status: 500, error: error.message };
  }
};
