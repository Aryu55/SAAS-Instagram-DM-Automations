"use server";

import { client } from "@/lib/prisma";

/**
 * Get all skills for an organization
 */
export async function getSkills(orgId: string) {
  try {
    const skills = await client.skill.findMany({
      where: { orgId },
      include: { styleReference: true },
      orderBy: { createdAt: "desc" },
    });
    return { status: 200, data: skills };
  } catch (err: any) {
    return { status: 500, error: err.message };
  }
}

/**
 * Get a single skill by ID
 */
export async function getSkillById(skillId: string) {
  try {
    const skill = await client.skill.findUnique({
      where: { id: skillId },
      include: { styleReference: true, pipelineSteps: true },
    });
    if (!skill) return { status: 404, data: null };
    return { status: 200, data: skill };
  } catch (err: any) {
    return { status: 500, error: err.message };
  }
}

/**
 * Create a new skill
 */
export async function createSkill(data: {
  orgId: string;
  name: string;
  type: string;
  description?: string;
  skillFilePath?: string;
  isVisual?: boolean;
  config?: any;
}) {
  try {
    const skill = await client.skill.create({
      data: {
        orgId: data.orgId,
        name: data.name,
        type: data.type as any,
        description: data.description || null,
        skillFilePath: data.skillFilePath || null,
        isVisual: data.isVisual || false,
        config: data.config || null,
      },
    });
    return { status: 200, data: skill };
  } catch (err: any) {
    return { status: 500, error: err.message };
  }
}

/**
 * Update an existing skill
 */
export async function updateSkill(skillId: string, data: {
  name?: string;
  type?: string;
  description?: string;
  skillFilePath?: string;
  isVisual?: boolean;
  config?: any;
}) {
  try {
    const skill = await client.skill.update({
      where: { id: skillId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.type && { type: data.type as any }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.skillFilePath !== undefined && { skillFilePath: data.skillFilePath }),
        ...(data.isVisual !== undefined && { isVisual: data.isVisual }),
        ...(data.config !== undefined && { config: data.config }),
      },
    });
    return { status: 200, data: skill };
  } catch (err: any) {
    return { status: 500, error: err.message };
  }
}

/**
 * Delete a skill
 */
export async function deleteSkill(skillId: string) {
  try {
    await client.skill.delete({ where: { id: skillId } });
    return { status: 200 };
  } catch (err: any) {
    return { status: 500, error: err.message };
  }
}

/**
 * Create or update a StyleReference for a visual skill (/watch feature)
 */
export async function upsertStyleReference(data: {
  skillId: string;
  referenceVideoUrl?: string;
  thumbnailUrl?: string;
  analysisJson?: any;
  frameExtracts?: string[];
}) {
  try {
    const ref = await client.styleReference.upsert({
      where: { skillId: data.skillId },
      update: {
        referenceVideoUrl: data.referenceVideoUrl,
        thumbnailUrl: data.thumbnailUrl,
        analysisJson: data.analysisJson || null,
        frameExtracts: data.frameExtracts || [],
      },
      create: {
        skillId: data.skillId,
        referenceVideoUrl: data.referenceVideoUrl,
        thumbnailUrl: data.thumbnailUrl,
        analysisJson: data.analysisJson || null,
        frameExtracts: data.frameExtracts || [],
      },
    });
    return { status: 200, data: ref };
  } catch (err: any) {
    return { status: 500, error: err.message };
  }
}

/**
 * Bulk upload skills with AI Auto-Categorization
 * Extracts individual skills from raw text, auto-classifies them into SkillType,
 * and generates a saved visual representation for non-editing skills to conserve tokens.
 */
export async function bulkCategorizeAndCreateSkills(data: {
  orgId: string;
  rawText: string;
}) {
  try {
    const GEMINI_KEY = process.env.GEMINI_API_KEY || "";
    let parsedSkills: Array<{
      name: string;
      type: string;
      description: string;
      isVisual: boolean;
      referenceVideoUrl?: string;
      generatedPreview?: {
        gradient: string;
        iconType: string;
        badge: string;
        keyTakeaway: string;
        previewTheme: string;
        sampleOutput?: string;
      };
    }> = [];

    if (GEMINI_KEY) {
      const prompt = `You are an expert video automation pipeline architect.
The user is providing a bulk list or text describing multiple skills/capabilities for content generation (e.g., editing styles, b-roll injection, caption styles, voiceovers, scrapers, clip generation, cutting, AI avatars, etc.).

Analyze the text and extract each discrete skill. Categorize each skill into EXACTLY ONE of these SkillType values:
- "EDITING_STYLE" (video editing styles, cuts, transitions, pacing, Telusko style, Hormozi edit, etc.)
- "CAPTION_STYLE" (subtitle styles, dynamic captions, word-by-word highlights, etc.)
- "BROLL_GENERATION" (b-roll injection, stock footage, AI broll overlay, etc.)
- "CLIP_GENERATION" (clip cutting, highlight extraction, AI avatar video, video snippet gen)
- "SCRAPER" (scrapers, instagram research, competitor scraping)
- "ANALYTICS" (metrics, performance analysis, virality scoring)
- "VOICE" (TTS voice profiles, voice cloning, audio styles)
- "CUSTOM" (anything else)

For EDITING_STYLE skills: set isVisual = true. If a video URL or path was mentioned, set referenceVideoUrl.
For ALL OTHER skills: generate a "generatedPreview" object with vibrant UI styling parameters so the dashboard can permanently render a visual preview card WITHOUT calling the LLM again.

Raw Input Text:
"""
${data.rawText}
"""

Respond ONLY with a valid JSON array of objects with keys: "name", "type", "description", "isVisual", "referenceVideoUrl" (optional), "generatedPreview" (optional object with: gradient, iconType, badge, keyTakeaway, previewTheme, sampleOutput).`;

      try {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { responseMimeType: "application/json" },
            }),
          }
        );

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
          parsedSkills = JSON.parse(text);
        }
      } catch (e) {
        console.error("Gemini bulk categorization error:", e);
      }
    }

    // Fallback rule-based parsing if Gemini wasn't available or failed
    if (!parsedSkills || parsedSkills.length === 0) {
      const lines = data.rawText.split(/\n+/).filter((l) => l.trim().length > 0);
      parsedSkills = lines.map((line) => {
        const cleaned = line.trim().replace(/^[-*•\d.]+\s*/, "");
        let type = "CUSTOM";
        const lower = cleaned.toLowerCase();
        if (lower.includes("edit") || lower.includes("cut") || lower.includes("transition")) type = "EDITING_STYLE";
        else if (lower.includes("caption") || lower.includes("sub") || lower.includes("text")) type = "CAPTION_STYLE";
        else if (lower.includes("broll") || lower.includes("b-roll") || lower.includes("footage")) type = "BROLL_GENERATION";
        else if (lower.includes("clip") || lower.includes("avatar") || lower.includes("short")) type = "CLIP_GENERATION";
        else if (lower.includes("voice") || lower.includes("audio") || lower.includes("tts")) type = "VOICE";
        else if (lower.includes("scrape") || lower.includes("research") || lower.includes("apify")) type = "SCRAPER";
        else if (lower.includes("analytic") || lower.includes("metric") || lower.includes("score")) type = "ANALYTICS";

        const namePart = cleaned.includes(":") ? cleaned.split(":")[0] : cleaned.slice(0, 35);
        const descPart = cleaned.includes(":") ? cleaned.split(":")[1].trim() : cleaned;

        const isEditing = type === "EDITING_STYLE";
        return {
          name: namePart.trim(),
          type,
          description: descPart,
          isVisual: isEditing || ["CAPTION_STYLE", "BROLL_GENERATION", "CLIP_GENERATION"].includes(type),
          generatedPreview: isEditing ? undefined : {
            gradient: type === "CAPTION_STYLE" ? "from-blue-600 to-cyan-500" :
                      type === "BROLL_GENERATION" ? "from-amber-500 to-orange-600" :
                      type === "CLIP_GENERATION" ? "from-pink-500 to-rose-600" :
                      type === "VOICE" ? "from-orange-500 to-amber-600" :
                      type === "SCRAPER" ? "from-emerald-500 to-teal-600" : "from-purple-600 to-indigo-600",
            iconType: type,
            badge: type.replace("_", " "),
            keyTakeaway: descPart,
            previewTheme: "dark",
            sampleOutput: `Automated output for ${namePart.trim()}`
          }
        };
      });
    }

    // Save all to DB
    const createdSkills = [];
    for (const item of parsedSkills) {
      const created = await client.skill.create({
        data: {
          orgId: data.orgId,
          name: item.name,
          type: item.type as any,
          description: item.description || null,
          isVisual: item.isVisual || item.type === "EDITING_STYLE",
          config: item.generatedPreview ? { generatedPreview: item.generatedPreview } : undefined,
        },
      });

      // If reference video url provided (or if editing style with link)
      if (item.referenceVideoUrl) {
        await client.styleReference.create({
          data: {
            skillId: created.id,
            referenceVideoUrl: item.referenceVideoUrl,
          },
        });
      }

      createdSkills.push(created);
    }

    return { status: 200, count: createdSkills.length, data: createdSkills };
  } catch (err: any) {
    return { status: 500, error: err.message };
  }
}

/**
 * Generate & cache AI visual preview for an existing non-editing skill
 */
export async function generateSkillPreview(skillId: string) {
  try {
    const skill = await client.skill.findUnique({ where: { id: skillId } });
    if (!skill) return { status: 404, error: "Skill not found" };

    const GEMINI_KEY = process.env.GEMINI_API_KEY || "";
    let preview = {
      gradient: "from-purple-600 to-indigo-600",
      iconType: skill.type,
      badge: skill.type.replace("_", " "),
      keyTakeaway: skill.description || skill.name,
      previewTheme: "dark",
      sampleOutput: `AI-generated visual specimen for ${skill.name}`
    };

    if (GEMINI_KEY) {
      const prompt = `Generate a visual preview design object for skill "${skill.name}" of type "${skill.type}". Description: "${skill.description || ""}".
Return JSON object: { "gradient": "from-color to-color", "badge": "string", "keyTakeaway": "string", "sampleOutput": "string" }`;

      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { responseMimeType: "application/json" },
            }),
          }
        );
        if (res.ok) {
          const data = await res.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            const parsed = JSON.parse(text);
            preview = { ...preview, ...parsed };
          }
        }
      } catch (e) {
        console.error("Generate preview error:", e);
      }
    }

    // Save in DB to cache forever
    const currentConfig = (skill.config as any) || {};
    const updatedSkill = await client.skill.update({
      where: { id: skillId },
      data: {
        config: { ...currentConfig, generatedPreview: preview }
      }
    });

    return { status: 200, data: updatedSkill };
  } catch (err: any) {
    return { status: 500, error: err.message };
  }
}

