import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TEMPLATES = [
  {
    templateId: "talking-head-reel",
    name: "Talking Head Reel",
    description: "Face-to-camera reel with TTS narration, B-roll, and captions.",
    steps: [
      { stepType: "IDEATION", orderIndex: 0, isEnabled: true },
      { stepType: "SCRIPT", orderIndex: 1, isEnabled: true },
      { stepType: "AUDIO_TTS", orderIndex: 2, isEnabled: true },
      { stepType: "VIDEO_EDIT", orderIndex: 3, isEnabled: true },
      { stepType: "BROLL_INJECTION", orderIndex: 4, isEnabled: true },
      { stepType: "CAPTION_OVERLAY", orderIndex: 5, isEnabled: true },
      { stepType: "THUMBNAIL", orderIndex: 6, isEnabled: false },
      { stepType: "REVIEW", orderIndex: 7, isEnabled: true },
    ],
  },
  {
    templateId: "faceless-explainer",
    name: "Faceless Explainer",
    description: "No face on camera. AI-generated visuals with voiceover.",
    steps: [
      { stepType: "IDEATION", orderIndex: 0, isEnabled: true },
      { stepType: "SCRIPT", orderIndex: 1, isEnabled: true },
      { stepType: "AUDIO_TTS", orderIndex: 2, isEnabled: true },
      { stepType: "BROLL_INJECTION", orderIndex: 3, isEnabled: true },
      { stepType: "CAPTION_OVERLAY", orderIndex: 4, isEnabled: true },
      { stepType: "THUMBNAIL", orderIndex: 5, isEnabled: false },
      { stepType: "REVIEW", orderIndex: 6, isEnabled: true },
    ],
  },
  {
    templateId: "podcast-clip",
    name: "Podcast Clip",
    description: "Extract and edit highlights from a recorded conversation.",
    steps: [
      { stepType: "FOOTAGE_PREP", orderIndex: 0, isEnabled: true },
      { stepType: "VIDEO_EDIT", orderIndex: 1, isEnabled: true },
      { stepType: "CAPTION_OVERLAY", orderIndex: 2, isEnabled: true },
      { stepType: "REVIEW", orderIndex: 3, isEnabled: true },
    ],
  },
  {
    templateId: "raw-footage-edit",
    name: "Raw Footage Edit",
    description: "Take raw footage and apply an editing style with B-roll and captions.",
    steps: [
      { stepType: "FOOTAGE_PREP", orderIndex: 0, isEnabled: true },
      { stepType: "VIDEO_EDIT", orderIndex: 1, isEnabled: true },
      { stepType: "BROLL_INJECTION", orderIndex: 2, isEnabled: true },
      { stepType: "CAPTION_OVERLAY", orderIndex: 3, isEnabled: true },
      { stepType: "REVIEW", orderIndex: 4, isEnabled: true },
    ],
  },
];

async function main() {
  const orgs = await prisma.organization.findMany();
  console.log(`Found ${orgs.length} organizations. Seeding pipeline templates...`);

  for (const org of orgs) {
    for (const template of TEMPLATES) {
      // Check if already exists
      const existing = await prisma.pipelineConfig.findFirst({
        where: { orgId: org.id, templateId: template.templateId },
      });
      if (existing) {
        console.log(`  [SKIP] ${org.name} already has "${template.name}"`);
        continue;
      }

      await prisma.pipelineConfig.create({
        data: {
          orgId: org.id,
          name: template.name,
          templateId: template.templateId,
          description: template.description,
          isActive: true,
          steps: {
            create: template.steps as any,
          },
        },
      });
      console.log(`  [CREATED] ${org.name} → ${template.name}`);
    }
  }
  console.log("Pipeline seed complete!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
