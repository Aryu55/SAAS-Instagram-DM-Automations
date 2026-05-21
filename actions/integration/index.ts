"use server";

import { generateToken } from "@/lib/fetch";
import axios from "axios";
import { redirect } from "next/navigation";
import { onCurrentUser } from "../user";
import { createIntegration, getIntegrations } from "./queries";

import { headers } from "next/headers";

export const onOathInstagram = async (strategy: "INSTAGRAM" | "CRM") => {
  if (strategy === "INSTAGRAM") {
    const hostHeader = headers().get("host") || "localhost:3000";
    const protocol = hostHeader.includes("localhost") ? "http" : "https";
    const origin = `${protocol}://${hostHeader}`;
    
    const clientId = process.env.INSTAGRAM_CLIENT_ID;
    const redirectUri = `${origin}/callback/instagram`;
    
    const oauthUrl = `https://api.instagram.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user_profile,user_media&response_type=code`;
    
    return redirect(oauthUrl);
  }
};


export const onIntegrate = async (code: string) => {
  const user = await onCurrentUser();

  try {
    const integration = await getIntegrations(user.id);

    if (integration && integration.integrations.length === 0) {
      const hostHeader = headers().get("host") || "localhost:3000";
      const protocol = hostHeader.includes("localhost") ? "http" : "https";
      const origin = `${protocol}://${hostHeader}`;

      const token = await generateToken(code, origin);

      console.log("🚀 ~ onIntegrate ~ token:", token);

      if (token) {
        const insts_id = await axios.get(
          `${process.env.INSTAGRAM_BASE_URL}/me?fields=user_id&access_token=${token.access_token}`
        );

        const today = new Date();
        const expire_date = today.setDate(today.getDate() + 60);
        const create = await createIntegration(
          user.id,
          token.access_token,
          new Date(expire_date),
          insts_id.data.user_id
        );
        return { status: 200, data: create };
      }
      return { status: 401 };
    }

    return { status: 404 };
  } catch (error) {
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
    const expire_date = today.setDate(today.getDate() + 90); // 90 days for manual long-lived tokens
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

