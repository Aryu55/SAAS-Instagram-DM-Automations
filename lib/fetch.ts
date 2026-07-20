import axios from "axios";

export const refreshToken = async (token: string) => {
  const baseUrl = process.env.INSTAGRAM_BASE_URL || "https://graph.instagram.com";
  const refresh_token = await axios.get(
    `${baseUrl}/refresh_access_token?grant_type=ig_refresh_token&access_token=${token}`
  );
  return refresh_token.data;
};

export const sendDm = async (
  userId: string,
  receiverId: string,
  prompt: string,
  token: string
) => {
  console.log("sending Message");
  const baseUrl = process.env.INSTAGRAM_BASE_URL || "https://graph.instagram.com";
  return await axios.post(
    `${baseUrl}/v21.0/${userId}/messages`,
    {
      recipient: {
        id: receiverId,
      },
      message: {
        text: prompt,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
};

export const sendPrivateMessage = async (
  userId: string,
  receiverId: string,
  prompt: string,
  token: string
) => {
  console.log("sending Message");
  const baseUrl = process.env.INSTAGRAM_BASE_URL || "https://graph.instagram.com";
  return await axios.post(
    `${baseUrl}/${userId}/messages`,
    {
      recipient: {
        comment_id: receiverId,
      },
      message: {
        text: prompt,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
};

export const generateToken = async (code: string, origin?: string) => {
  const redirectUri = origin 
    ? `${origin}/callback/instagram` 
    : `${process.env.NEXT_PUBLIC_HOST_URL}/callback/instagram`;

  // Use Facebook Graph API token exchange (not the deprecated Instagram Basic Display API)
  const params = new URLSearchParams({
    client_id: process.env.INSTAGRAM_CLIENT_ID as string,
    client_secret: process.env.INSTAGRAM_CLIENT_SECRET as string,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
    code: code,
  });

  try {
    // Exchange the authorization code for a short-lived token via Facebook Graph API
    const shortTokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?${params.toString()}`,
      { method: "GET" }
    );

    const tokenData = await shortTokenRes.json();

    if (tokenData.error) {
      console.error("Token exchange error:", tokenData.error);
      return null;
    }

    if (tokenData.access_token) {
      console.log("🚀 ~ generateToken ~ short-lived token obtained");
      
      // Exchange short-lived token for a long-lived token (60 days)
      const longTokenRes = await axios.get(
        `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${process.env.INSTAGRAM_CLIENT_ID}&client_secret=${process.env.INSTAGRAM_CLIENT_SECRET}&fb_exchange_token=${tokenData.access_token}`
      );

      console.log("🚀 ~ generateToken ~ long-lived token obtained");
      return longTokenRes.data;
    }

    console.error("No access_token in response:", tokenData);
    return null;
  } catch (error: any) {
    console.error("generateToken error:", error.message);
    return null;
  }
};
