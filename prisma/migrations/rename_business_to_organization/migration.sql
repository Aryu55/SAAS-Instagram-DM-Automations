-- Rename Business table to Organization
ALTER TABLE "Business" RENAME TO "Organization";

-- Rename foreign key columns from businessId to orgId
ALTER TABLE "ContentIdea" RENAME COLUMN "businessId" TO "orgId";
ALTER TABLE "ContentJob" RENAME COLUMN "businessId" TO "orgId";
ALTER TABLE "ScrapedPost" RENAME COLUMN "businessId" TO "orgId";
ALTER TABLE "DocumentaryLog" RENAME COLUMN "businessId" TO "orgId";

-- Add new nullable orgId columns to existing tables
ALTER TABLE "Integrations" ADD COLUMN "orgId" UUID;
ALTER TABLE "Automation" ADD COLUMN "orgId" UUID;
ALTER TABLE "Contact" ADD COLUMN "orgId" UUID;

-- Add new columns to Organization
ALTER TABLE "Organization" ADD COLUMN "logoUrl" TEXT;
ALTER TABLE "Organization" ADD COLUMN "brandColors" JSONB;

-- Make description nullable (was required before)
ALTER TABLE "Organization" ALTER COLUMN "description" DROP NOT NULL;
ALTER TABLE "Organization" ALTER COLUMN "targetAudience" DROP NOT NULL;
ALTER TABLE "Organization" ALTER COLUMN "voiceTone" DROP NOT NULL;
ALTER TABLE "Organization" ALTER COLUMN "cta" DROP NOT NULL;

-- Create OrgMember table
CREATE TABLE "OrgMember" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "orgId" UUID NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'OWNER',
  CONSTRAINT "OrgMember_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "OrgMember_userId_orgId_key" UNIQUE ("userId", "orgId"),
  CONSTRAINT "OrgMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "OrgMember_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE
);

-- Create MemberRole enum
DO $$ BEGIN
  CREATE TYPE "MemberRole" AS ENUM ('OWNER', 'EDITOR');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create Skill table
CREATE TABLE "Skill" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "orgId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "description" TEXT,
  "skillFilePath" TEXT,
  "config" JSONB,
  "isVisual" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Skill_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Skill_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE
);

-- Create SkillType enum
DO $$ BEGIN
  CREATE TYPE "SkillType" AS ENUM ('EDITING_STYLE', 'CAPTION_STYLE', 'BROLL_GENERATION', 'CLIP_GENERATION', 'SCRAPER', 'ANALYTICS', 'VOICE', 'CUSTOM');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create StyleReference table (for /watch feature)
CREATE TABLE "StyleReference" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "skillId" UUID NOT NULL,
  "referenceVideoUrl" TEXT,
  "thumbnailUrl" TEXT,
  "analysisJson" JSONB,
  "frameExtracts" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StyleReference_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "StyleReference_skillId_key" UNIQUE ("skillId"),
  CONSTRAINT "StyleReference_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE
);

-- Create PipelineConfig table
CREATE TABLE "PipelineConfig" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "orgId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "templateId" TEXT NOT NULL,
  "description" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PipelineConfig_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PipelineConfig_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE
);

-- Create StepType enum
DO $$ BEGIN
  CREATE TYPE "StepType" AS ENUM ('IDEATION', 'SCRIPT', 'AUDIO_TTS', 'FOOTAGE_PREP', 'VIDEO_EDIT', 'BROLL_INJECTION', 'CAPTION_OVERLAY', 'THUMBNAIL', 'REVIEW');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create PipelineStep table
CREATE TABLE "PipelineStep" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "pipelineId" UUID NOT NULL,
  "stepType" TEXT NOT NULL,
  "orderIndex" INTEGER NOT NULL,
  "isEnabled" BOOLEAN NOT NULL DEFAULT true,
  "skillId" UUID,
  "config" JSONB,
  CONSTRAINT "PipelineStep_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PipelineStep_pipelineId_orderIndex_key" UNIQUE ("pipelineId", "orderIndex"),
  CONSTRAINT "PipelineStep_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES "PipelineConfig"("id") ON DELETE CASCADE,
  CONSTRAINT "PipelineStep_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id")
);

-- Add orgId FK constraints to existing tables
ALTER TABLE "Integrations" ADD CONSTRAINT "Integrations_orgId_fkey" 
  FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE;
ALTER TABLE "Automation" ADD CONSTRAINT "Automation_orgId_fkey" 
  FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE;
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_orgId_fkey" 
  FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE;

-- Add pipelineId to ContentJob
ALTER TABLE "ContentJob" ADD COLUMN "pipelineId" UUID;
