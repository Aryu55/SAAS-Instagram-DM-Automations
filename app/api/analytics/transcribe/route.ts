import { NextRequest, NextResponse } from "next/server";
import { openai, getModelName, isUsingOpenRouter } from "@/lib/openai";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { postId, mediaUrl, mediaType, caption, niche } = await req.json();

    const hfToken = process.env.HF_TOKEN;

    // 1. If HF_TOKEN exists and it's a video, attempt Whisper API
    if (hfToken && mediaType === "VIDEO" && mediaUrl) {
      try {
        console.log("Transcribing video using Hugging Face Whisper API...");
        const videoResponse = await fetch(mediaUrl);
        if (videoResponse.ok) {
          const arrayBuffer = await videoResponse.arrayBuffer();
          
          const hfResponse = await fetch(
            "https://api-inference.huggingface.co/models/openai/whisper-large-v3",
            {
              headers: { 
                Authorization: `Bearer ${hfToken}`,
                "Content-Type": "application/octet-stream"
              },
              method: "POST",
              body: arrayBuffer,
            }
          );

          if (hfResponse.ok) {
            const result = await hfResponse.json();
            if (result.text) {
              return NextResponse.json({ transcript: result.text, source: "Whisper (Audio)" });
            }
          } else {
            console.warn("Hugging Face API returned error status:", hfResponse.status);
          }
        }
      } catch (err: any) {
        console.error("Whisper transcription failed, falling back to LLM simulation:", err.message);
      }
    }

    // 2. Fallback to OpenRouter / OpenAI to simulate the spoken script based on caption & context
    const hasKeys = isUsingOpenRouter || !!process.env.OPEN_AI_KEY;
    if (!hasKeys) {
      // Simulate static transcript locally without keys
      const simulatedText = `[0:00-0:04] (Hook) Stop scrolling if you are struggling with screen addiction. This is frying your focus.\n[0:04-0:22] (Body) Every time you pick up your phone, you get a hit of cheap dopamine. It makes you weak, unmotivated, and distracted. You need to reset your baseline and do a full detox.\n[0:22-0:30] (CTA) If you want to reclaim your focus, comment "DETOX" and I'll send you my complete step-by-step recovery guide for free.`;
      return NextResponse.json({ transcript: simulatedText, source: "System Heuristic (No API Key)" });
    }

    // Use liquid/lfm-2.5-1.2b-instruct:free or standard configured model
    const modelToUse = isUsingOpenRouter ? "liquid/lfm-2.5-1.2b-instruct:free" : getModelName();

    const prompt = `You are an expert short-form content script analyst. Reconstruct the likely voiceover script (transcript) that the creator spoke in this video.
Here is the video metadata:
- Caption: "${caption || "No caption provided"}"
- Target Niche: "${niche || "Self-Help / Dopamine Detox / Addiction Recovery"}"

Create a highly engaging, raw transcript that matches the hook, body, and CTA suggested by the caption. 
Structure it with short timecodes:
[0:00-0:04] (Hook) [Spoken words]
[0:04-0:22] (Body) [Spoken words]
[0:22-0:30] (CTA) [Spoken words]

Keep the script punchy, direct, under 120 words, and in a vernacular spoken style. If the caption mentions a keyword trigger (like "comment REDIRECT" or "DM me"), make sure the CTA section reflects that. Do not include any introductory remarks, explanation, or notes. Return only the script transcript.`;

    const completion = await openai.chat.completions.create({
      model: modelToUse,
      messages: [
        { role: "system", content: "You are a professional video script reconstructor. Output only the transcript text." },
        { role: "user", content: prompt }
      ]
    });

    const transcript = completion.choices[0]?.message?.content?.trim() || "";
    return NextResponse.json({ transcript, source: "AI Reconstructed (Caption-Based)" });
  } catch (error: any) {
    console.error("Error in transcribe endpoint:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
