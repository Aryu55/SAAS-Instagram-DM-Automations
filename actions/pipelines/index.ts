"use server";

import { client } from "@/lib/prisma";

export async function seedDefaultPipelines(orgId: string) {
  try {
    const count = await client.pipelineConfig.count({ where: { orgId } });
    if (count > 0) return;

    // 1. Faceless Explainer
    await client.pipelineConfig.create({
      data: {
        orgId,
        name: "Faceless Explainer",
        templateId: "faceless-explainer",
        description: "Script ➔ AI Voice TTS ➔ B-Roll Injection ➔ Captions ➔ Render",
        isActive: true,
        steps: {
          create: [
            { stepType: "IDEATION", orderIndex: 0, isEnabled: true, config: { hookStyle: "question" } },
            { stepType: "SCRIPT", orderIndex: 1, isEnabled: true, config: { tone: "fast-paced" } },
            { stepType: "AUDIO_TTS", orderIndex: 2, isEnabled: true, config: { ttsProvider: "bark", ttsVoiceId: "v2/hi_speaker_2" } },
            { stepType: "BROLL_INJECTION", orderIndex: 3, isEnabled: true, config: { style: "dynamic" } },
            { stepType: "CAPTION_OVERLAY", orderIndex: 4, isEnabled: true, config: { font: "Inter" } },
            { stepType: "REVIEW", orderIndex: 5, isEnabled: true }
          ]
        }
      }
    });

    // 2. AI Avatar Talking Head
    await client.pipelineConfig.create({
      data: {
        orgId,
        name: "AI Avatar Talking Head",
        templateId: "ai-avatar",
        description: "Script ➔ AI Voice TTS ➔ Avatar Synthesis ➔ Captions ➔ Render",
        isActive: true,
        steps: {
          create: [
            { stepType: "IDEATION", orderIndex: 0, isEnabled: true },
            { stepType: "SCRIPT", orderIndex: 1, isEnabled: true },
            { stepType: "AUDIO_TTS", orderIndex: 2, isEnabled: true, config: { ttsProvider: "bark", ttsVoiceId: "v2/en_speaker_3" } },
            { stepType: "FOOTAGE_PREP", orderIndex: 3, isEnabled: true },
            { stepType: "CAPTION_OVERLAY", orderIndex: 4, isEnabled: true },
            { stepType: "REVIEW", orderIndex: 5, isEnabled: true }
          ]
        }
      }
    });

    // 3. Podcast Clipper (Opus Style) - NO TTS STEP
    await client.pipelineConfig.create({
      data: {
        orgId,
        name: "Podcast Clipper (Opus Style)",
        templateId: "podcast-clipper",
        description: "2hr+ Podcast Audio/Video ➔ AI Transcript & Viral Segmentation ➔ Auto 9:16 Crop ➔ Captions (No Voice Synth)",
        isActive: true,
        steps: {
          create: [
            { stepType: "FOOTAGE_PREP", orderIndex: 0, isEnabled: true, config: { inputType: "long-form" } },
            { stepType: "SCRIPT", orderIndex: 1, isEnabled: true, config: { task: "transcribe-and-find-viral-clips" } },
            { stepType: "VIDEO_EDIT", orderIndex: 2, isEnabled: true, config: { cropRatio: "9:16" } },
            { stepType: "CAPTION_OVERLAY", orderIndex: 3, isEnabled: true, config: { wordByWord: true } },
            { stepType: "REVIEW", orderIndex: 4, isEnabled: true }
          ]
        }
      }
    });

    // 4. Raw Footage Edit - NO TTS STEP
    await client.pipelineConfig.create({
      data: {
        orgId,
        name: "Raw Footage Edit",
        templateId: "raw-footage-edit",
        description: "User Uploaded Video + Audio ➔ Trim ➔ Captions ➔ Render (No Voice Synth)",
        isActive: true,
        steps: {
          create: [
            { stepType: "FOOTAGE_PREP", orderIndex: 0, isEnabled: true },
            { stepType: "VIDEO_EDIT", orderIndex: 1, isEnabled: true },
            { stepType: "CAPTION_OVERLAY", orderIndex: 2, isEnabled: true },
            { stepType: "REVIEW", orderIndex: 3, isEnabled: true }
          ]
        }
      }
    });
  } catch (e: any) {
    console.error("Failed to seed default pipelines:", e.message);
  }
}

/**
 * Get all pipeline configs for an organization
 */
export async function getPipelines(orgId: string) {
  try {
    await seedDefaultPipelines(orgId);
    const pipelines = await client.pipelineConfig.findMany({
      where: { orgId },
      include: {
        steps: {
          include: { skill: true },
          orderBy: { orderIndex: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return { status: 200, data: pipelines };
  } catch (err: any) {
    return { status: 500, error: err.message };
  }
}

/**
 * Get a single pipeline with all steps and skills
 */
export async function getPipelineById(pipelineId: string) {
  try {
    const pipeline = await client.pipelineConfig.findUnique({
      where: { id: pipelineId },
      include: {
        steps: {
          include: { skill: { include: { styleReference: true } } },
          orderBy: { orderIndex: "asc" },
        },
        org: true,
      },
    });
    if (!pipeline) return { status: 404, data: null };
    return { status: 200, data: pipeline };
  } catch (err: any) {
    return { status: 500, error: err.message };
  }
}

/**
 * Update a pipeline step's config, skill assignment, or enabled status
 */
export async function updatePipelineStep(stepId: string, data: {
  isEnabled?: boolean;
  skillId?: string | null;
  config?: any;
}) {
  try {
    const step = await client.pipelineStep.update({
      where: { id: stepId },
      data: {
        ...(data.isEnabled !== undefined && { isEnabled: data.isEnabled }),
        ...(data.skillId !== undefined && { skillId: data.skillId }),
        ...(data.config !== undefined && { config: data.config }),
      },
    });
    return { status: 200, data: step };
  } catch (err: any) {
    return { status: 500, error: err.message };
  }
}

/**
 * Toggle pipeline active status
 */
export async function togglePipelineActive(pipelineId: string, isActive: boolean) {
  try {
    const pipeline = await client.pipelineConfig.update({
      where: { id: pipelineId },
      data: { isActive },
    });
    return { status: 200, data: pipeline };
  } catch (err: any) {
    return { status: 500, error: err.message };
  }
}

/**
 * Duplicate a pipeline template
 */
export async function duplicatePipeline(pipelineId: string) {
  try {
    const original = await client.pipelineConfig.findUnique({
      where: { id: pipelineId },
      include: { steps: true },
    });
    if (!original) return { status: 404, error: "Pipeline not found" };

    const copy = await client.pipelineConfig.create({
      data: {
        orgId: original.orgId,
        name: `${original.name} (Copy)`,
        templateId: original.templateId,
        description: original.description,
        isActive: false,
        steps: {
          create: original.steps.map((s) => ({
            stepType: s.stepType,
            orderIndex: s.orderIndex,
            isEnabled: s.isEnabled,
            skillId: s.skillId,
            config: s.config ? JSON.parse(JSON.stringify(s.config)) : undefined,
          })),
        },
      },
      include: { steps: true },
    });
    return { status: 200, data: copy };
  } catch (err: any) {
    return { status: 500, error: err.message };
  }
}
