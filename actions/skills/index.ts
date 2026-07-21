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
