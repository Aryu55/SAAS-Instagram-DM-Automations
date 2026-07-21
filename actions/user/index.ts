"use server";

import { refreshToken } from "@/lib/fetch";
import { stripe } from "@/lib/stripe";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { updateIntegration } from "../integration/queries";
import { createUser, findUser, updateSubscription } from "./queries";

export const onCurrentUser = async () => {
  console.log("[AUTH TRACE] onCurrentUser: retrieving session from cookies...");
  const user = await getSession();
  console.log("[AUTH TRACE] onCurrentUser: session resolved:", user ? { id: user.id, email: user.emailAddresses?.[0]?.emailAddress } : "null");
  if (!user) {
    console.log("[AUTH TRACE] onCurrentUser: No session cookie. Redirecting to /api/auth/logout to clear state");
    return redirect("/api/auth/logout");
  }

  return user;
};

export const onboardUser = async () => {
  console.log("[AUTH TRACE] onboardUser: resolving current user session...");
  const user = await onCurrentUser();
  console.log("[AUTH TRACE] onboardUser: session loaded. ID:", user.id);

  try {
    console.log("[AUTH TRACE] onboardUser: searching db for clerkId:", user.id);
    const found = await findUser(user.id);
    console.log("[AUTH TRACE] onboardUser: db query resolved. User found in database:", !!found);

    if (found) {
      console.log("[AUTH TRACE] onboardUser: found user record:", {
        id: found.id,
        email: found.email,
        firstname: found.firstname,
        lastname: found.lastname,
        integrationsCount: found.integrations.length
      });

      if (found.integrations.length > 0) {
        const today = new Date();
        const time_left =
          found.integrations[0].expiresAt?.getTime()! - today.getTime();

        const days = Math.round(time_left / (1000 * 3600 * 24));
        console.log("[AUTH TRACE] onboardUser: integration token expiresAt:", found.integrations[0].expiresAt, "days remaining:", days);

        if (days < 5) {
          console.log("[AUTH TRACE] onboardUser: token expires in less than 5 days. Initiating refresh...");
          try {
            console.log("[AUTH TRACE] onboardUser: calling refreshToken endpoint...");
            const refresh = await refreshToken(found.integrations[0].token);
            console.log("[AUTH TRACE] onboardUser: refreshToken resolved successfully.");
            const today = new Date();
            const expire_date = today.setDate(today.getDate() + 60);

            console.log("[AUTH TRACE] onboardUser: saving new access token to integrations db...");
            const update_token = await updateIntegration(
              refresh.access_token,
              new Date(expire_date),
              found.integrations[0].id
            );

            if (!update_token) {
              console.log("[AUTH TRACE] onboardUser: Failed to update token in db.");
            } else {
              console.log("[AUTH TRACE] onboardUser: DB token updated successfully.");
            }
          } catch (refreshError: any) {
            console.error("[AUTH TRACE] onboardUser error: Graceful exit: Token refresh failed:", refreshError.message);
          }
        }
      }
      
      console.log("[AUTH TRACE] onboardUser: login success. Returning status 200");
      return {
        status: 200,
        data: {
          firstname: found.firstname,
          lastname: found.lastname,
        },
      };
    }
    
    console.log("[AUTH TRACE] onboardUser: User record not found in db. Creating new record for clerkId:", user.id);
    const created = await createUser(
      user.id,
      user.firstName!,
      user.lastName!,
      user.emailAddresses[0].emailAddress
    );

    console.log("[AUTH TRACE] onboardUser: New user record created successfully in DB:", created);
    return { status: 201, data: created };
  } catch (error: any) {
    console.error("[AUTH TRACE] onboardUser fatal error caught:", error.message, error.stack);
    return { status: 500, data: error.message };
  }
};

export const onUserInfo = async () => {
  const user = await onCurrentUser();

  try {
    const profile = await findUser(user.id);
    if (profile) return { status: 200, data: profile };

    return { status: 404 };
  } catch (error: any) {
    return { status: 500 };
  }
};

export const onSubscribe = async (session_id: string) => {
  const user = await onCurrentUser();

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session) {
      const subscript = await updateSubscription(user.id, {
        customerId: session.customer as string,
        plan: "PRO",
      });

      if (subscript) return { status: 200 };

      return { status: 401 };
    }

    return { status: 404 };
  } catch (error) {
    return { status: 500 };
  }
};
