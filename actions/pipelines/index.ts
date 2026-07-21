"use server";

import { client } from "@/lib/prisma";

/**
 * Get all pipeline configs for an organization
 */
export async function getPipelines(orgId: string) {
  try {
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
