import { findAutomation } from "@/actions/automation/queries";
import {
  createChatHistory,
  getChatHistory,
  getKeywordAutomation,
  getKeywordPost,
  matchKeyword,
  trackResponse,
  upsertContact,
} from "@/actions/webhook/queries";
import { sendDm, sendPrivateMessage } from "@/lib/fetch";
import { openai, getModelName } from "@/lib/openai";
import { client } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const hub = req.nextUrl.searchParams.get("hub.challenge");
  console.log("[INSTAGRAM WEBHOOK] Received verification challenge GET query:", hub);
  return new NextResponse(hub);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  console.log("[INSTAGRAM WEBHOOK] Incoming POST request payload:", JSON.stringify(body, null, 2));
  let matcher;

  try {
    if (body.entry?.[0]?.messaging) {
      const msg = body.entry[0].messaging[0];
      const text = msg.message?.text;
      console.log("[INSTAGRAM WEBHOOK] Messaging trigger text received:", text, "from sender:", msg.sender?.id);
      matcher = await matchKeyword(text);
      console.log("[INSTAGRAM WEBHOOK] Messaging matcher result:", matcher);
    }

    if (body.entry?.[0]?.changes) {
      const change = body.entry[0].changes[0];
      const text = change.value?.text;
      console.log("[INSTAGRAM WEBHOOK] Changes (comment) trigger text received:", text, "from field:", change.field, "from username:", change.value?.from?.username);
      matcher = await matchKeyword(text);
      console.log("[INSTAGRAM WEBHOOK] Comment matcher result:", matcher);
    }

    if (matcher && matcher.automationId) {
      // keyword matcher
      console.log("[INSTAGRAM WEBHOOK] Keyword MATCHED! Automation ID:", matcher.automationId);

      if (body.entry[0].messaging) {
        console.log("[INSTAGRAM WEBHOOK] Handling keyword matched DM flow...");
        const automation = await getKeywordAutomation(
          matcher.automationId,
          true
        );
        console.log("[INSTAGRAM WEBHOOK] Resolved DM automation configuration details:", {
          id: automation?.id,
          trigger: automation?.trigger,
          listenerType: automation?.listener?.listener,
          userPlan: automation?.User?.subscription?.plan,
          userTokenExists: !!automation?.User?.integrations?.[0]?.token
        });

        if (automation && automation.trigger) {
          if (automation.User?.id) {
            console.log("[INSTAGRAM WEBHOOK] Upserting user contact for sender:", body.entry[0].messaging[0].sender.id);
            await upsertContact(
              automation.User.id,
              body.entry[0].messaging[0].sender.id,
              undefined,
              automation.User.integrations[0]?.token
            );
          }
          if (
            automation.listener &&
            automation.listener.listener === "MESSAGE"
          ) {
            console.log("[INSTAGRAM WEBHOOK] DM MESSAGE listener found. Sending static prompt reply:", automation.listener.prompt);
            const direct_message = await sendDm(
              body.entry[0].id,
              body.entry[0].messaging[0].sender.id,
              automation.listener?.prompt,
              automation.User?.integrations[0].token!
            );
            console.log("[INSTAGRAM WEBHOOK] sendDm response status:", direct_message.status);

            if (direct_message.status === 200) {
              const tracked = await trackResponse(automation.id, "DM");
              console.log("[INSTAGRAM WEBHOOK] DM response tracking status:", tracked);
              if (tracked) {
                return NextResponse.json(
                  {
                    message: "Message sent successfully",
                  },
                  {
                    status: 200,
                  }
                );
              }
            }
          }
          if (
            automation.listener &&
            automation.listener.listener === "SMARTAI" &&
            automation.User?.subscription?.plan === "PRO"
          ) {
            console.log("[INSTAGRAM WEBHOOK] DM SMARTAI listener found. Calling OpenAI to generate reply...");
            const smart_ai_message = await openai.chat.completions.create({
              model: getModelName(),
              messages: [
                {
                  role: "assistant",
                  content: `${automation.listener?.prompt}: Keep responses under 2 sentences`,
                },
              ],
            });
            console.log("[INSTAGRAM WEBHOOK] OpenAI generated content:", smart_ai_message.choices[0].message.content);

            if (smart_ai_message.choices[0].message.content) {
              const receiver = createChatHistory(
                automation.id,
                body.entry[0].id,
                body.entry[0].messaging[0].sender.id,
                body.entry[0].messaging[0].message.text
              );

              const sender = createChatHistory(
                automation.id,
                body.entry[0].id,
                body.entry[0].messaging[0].sender.id,
                smart_ai_message.choices[0].message.content
              );

              await client.$transaction([receiver, sender]);
              console.log("[INSTAGRAM WEBHOOK] Saved chat histories transaction successfully.");

              const direct_message = await sendDm(
                body.entry[0].id,
                body.entry[0].messaging[0].sender.id,
                smart_ai_message.choices[0].message.content,
                automation.User?.integrations[0].token!
              );
              console.log("[INSTAGRAM WEBHOOK] sendDm SMARTAI response status:", direct_message.status);

              if (direct_message.status === 200) {
                const tracked = await trackResponse(automation.id, "DM");
                console.log("[INSTAGRAM WEBHOOK] SMARTAI DM response tracking status:", tracked);

                if (tracked) {
                  return NextResponse.json(
                    {
                      message: "Message sent successfully",
                    },
                    { status: 200 }
                  );
                }
              }
            }
          }
        }
      }

      if (
        body.entry[0].changes &&
        body.entry[0].changes[0].field === "comments"
      ) {
        console.log("[INSTAGRAM WEBHOOK] Handling keyword matched Comment flow...");
        const automation = await getKeywordAutomation(
          matcher.automationId,
          false
        );

        const automation_post = await getKeywordPost(
          body.entry[0].changes[0].value.media.id,
          automation?.id!
        );
        console.log("[INSTAGRAM WEBHOOK] Resolved Comment automation configuration:", {
          automationId: automation?.id,
          automationPostId: automation_post?.automationId,
          mediaId: body.entry[0].changes[0].value.media.id
        });

        if (automation && automation_post && automation.trigger) {
          if (automation.User?.id) {
            console.log("[INSTAGRAM WEBHOOK] Upserting user contact for comment author:", body.entry[0].changes[0].value.from.id);
            await upsertContact(
              automation.User.id,
              body.entry[0].changes[0].value.from.id,
              body.entry[0].changes[0].value.from.username
            );
          }
          if (automation.listener) {
            if (automation.listener.listener === "MESSAGE") {
              console.log("[INSTAGRAM WEBHOOK] Comment MESSAGE listener found. Sending private DM reply:", automation.listener.prompt);
              const direct_message = await sendPrivateMessage(
                body.entry[0].id,
                body.entry[0].changes[0].value.id,
                automation.listener?.prompt,
                automation.User?.integrations[0].token!
              );
              console.log("[INSTAGRAM WEBHOOK] sendPrivateMessage response status:", direct_message.status);

              if (direct_message.status === 200) {
                const tracked = await trackResponse(automation.id, "COMMENT");
                console.log("[INSTAGRAM WEBHOOK] Comment reply response tracking status:", tracked);

                if (tracked) {
                  return NextResponse.json(
                    {
                      message: "Message sent successfully",
                    },
                    {
                      status: 200,
                    }
                  );
                }
              }
            }
            if (
              automation.listener.listener === "SMARTAI" &&
              automation.User?.subscription?.plan === "PRO"
            ) {
              console.log("[INSTAGRAM WEBHOOK] Comment SMARTAI listener found. Calling OpenAI to generate private DM reply...");
              const smart_ai_message = await openai.chat.completions.create({
                model: getModelName(),
                messages: [
                  {
                    role: "assistant",
                    content: `${automation.listener?.prompt}: keep responses under 2 sentences`,
                  },
                ],
              });
              console.log("[INSTAGRAM WEBHOOK] OpenAI generated content for comment reply:", smart_ai_message.choices[0].message.content);

              if (smart_ai_message.choices[0].message.content) {
                const receiver = createChatHistory(
                  automation.id,
                  body.entry[0].id,
                  body.entry[0].changes[0].value.from.id,
                  body.entry[0].changes[0].value.text
                );

                const sender = createChatHistory(
                  automation.id,
                  body.entry[0].id,
                  body.entry[0].changes[0].value.from.id,
                  smart_ai_message.choices[0].message.content
                );

                await client.$transaction([receiver, sender]);
                console.log("[INSTAGRAM WEBHOOK] Saved comment reply chat histories transaction.");

                const direct_message = await sendPrivateMessage(
                  body.entry[0].id,
                  body.entry[0].changes[0].value.id,
                  smart_ai_message.choices[0].message.content,
                  automation.User?.integrations[0].token!
                );
                console.log("[INSTAGRAM WEBHOOK] sendPrivateMessage SMARTAI response status:", direct_message.status);

                if (direct_message.status === 200) {
                  const tracked = await trackResponse(automation.id, "COMMENT");
                  console.log("[INSTAGRAM WEBHOOK] SMARTAI Comment reply response tracking status:", tracked);

                  if (tracked) {
                    return NextResponse.json(
                      {
                        message: "Message sent successfully",
                      },
                      { status: 200 }
                    );
                  }
                }
              }
            }
          }
        }
      }
    }

    if (!matcher) {
      console.log("[INSTAGRAM WEBHOOK] Keyword NOT matched directly. Attempting to fall back to conversational chat history...");
      const customer_history = await getChatHistory(
        body.entry[0].messaging[0].recipient.id,
        body.entry[0].messaging[0].sender.id
      );
      console.log("[INSTAGRAM WEBHOOK] Retrieved customer chat history. History length:", customer_history.history?.length || 0);

      if (customer_history.history.length > 0) {
        const automation = await findAutomation(customer_history.automationId!);
        console.log("[INSTAGRAM WEBHOOK] Found fallback chat history automation:", automation?.id);

        if (automation && automation.User?.id) {
          console.log("[INSTAGRAM WEBHOOK] Upserting user contact for conversation continuation:", body.entry[0].messaging[0].sender.id);
          await upsertContact(
            automation.User.id,
            body.entry[0].messaging[0].sender.id,
            undefined,
            automation.User.integrations[0]?.token
          );
        }

        if (
          automation?.User?.subscription?.plan === "PRO" &&
          automation.listener?.listener === "SMARTAI"
        ) {
          console.log("[INSTAGRAM WEBHOOK] Conversation SMARTAI found. Generating contextual chat reply with OpenAI...");
          const smart_ai_message = await openai.chat.completions.create({
            model: getModelName(),
            messages: [
              {
                role: "assistant",
                content: `${automation.listener?.prompt}: Keep responses under 2 sentences`,
              },
              ...customer_history.history,
              {
                role: "user",
                content: body.entry[0].messaging[0].message.text,
              },
            ],
          });
          console.log("[INSTAGRAM WEBHOOK] OpenAI contextual response generated:", smart_ai_message.choices[0].message.content);

          if (smart_ai_message.choices[0].message.content) {
            const receiver = createChatHistory(
              automation.id,
              body.entry[0].id,
              body.entry[0].messaging[0].sender.id,
              body.entry[0].messaging[0].message.text
            );

            const sender = createChatHistory(
              automation.id,
              body.entry[0].id,
              body.entry[0].messaging[0].sender.id,
              smart_ai_message.choices[0].message.content
            );

            await client.$transaction([receiver, sender]);
            console.log("[INSTAGRAM WEBHOOK] Saved contextual chat histories transaction.");

            const direct_message = await sendDm(
              body.entry[0].id,
              body.entry[0].messaging[0].sender.id,
              smart_ai_message.choices[0].message.content,
              automation.User?.integrations[0].token!
            );
            console.log("[INSTAGRAM WEBHOOK] sendDm response status for contextual chat:", direct_message.status);

            if (direct_message.status === 200) {
              return NextResponse.json(
                { message: "Message sent successfully" },
                { status: 200 }
              );
            }
          }
        }
      }
      console.log("[INSTAGRAM WEBHOOK] No fallback conversation history matching. Stopping webhook execution.");
      return NextResponse.json(
        { message: "No Automation set" },
        { status: 200 }
      );
    }
    return NextResponse.json({ message: "No Automation set" }, { status: 200 });
  } catch (error: any) {
    console.error("[INSTAGRAM WEBHOOK] Fatal error caught inside handler:", error.message, error.stack);
    return NextResponse.json({ message: "No Automation set", error: error.message }, { status: 200 });
  }
}
