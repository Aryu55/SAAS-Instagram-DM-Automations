import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Find the first user (the owner)
  const user = await prisma.user.findFirst();
  if (!user) {
    console.log("No users found. Please sign in first, then re-run the seed.");
    return;
  }

  console.log(`Found user: ${user.firstname} ${user.lastname} (${user.id})`);

  // Get all existing organizations (migrated from Business)
  const existingOrgs = await prisma.organization.findMany();
  console.log(`Found ${existingOrgs.length} existing organizations.`);

  // Create OrgMember records for the existing user on all existing orgs
  for (const org of existingOrgs) {
    await prisma.orgMember.upsert({
      where: {
        userId_orgId: { userId: user.id, orgId: org.id },
      },
      update: {},
      create: {
        userId: user.id,
        orgId: org.id,
        role: "OWNER",
      },
    });
    console.log(`Linked user to org: ${org.name} (${org.slug})`);
  }

  // Create "Courses" org if it doesn't exist
  const coursesOrg = await prisma.organization.upsert({
    where: { slug: "courses" },
    update: {},
    create: {
      slug: "courses",
      name: "Courses",
      description: "The course creation business",
      targetAudience: "Aspiring developers and tech learners",
      painPoints: [],
      contentPillars: ["Education", "Tech Tutorials", "Business Building"],
      voiceTone: "Educational, motivating, practical",
      active: true,
    },
  });
  await prisma.orgMember.upsert({
    where: { userId_orgId: { userId: user.id, orgId: coursesOrg.id } },
    update: {},
    create: { userId: user.id, orgId: coursesOrg.id, role: "OWNER" },
  });
  console.log("Created/ensured: Courses org");

  // Create "Safespot" org if it doesn't exist
  const safespotOrg = await prisma.organization.upsert({
    where: { slug: "safespot" },
    update: {},
    create: {
      slug: "safespot",
      name: "Safespot",
      description: "Security and compliance assistant",
      targetAudience: "Businesses needing compliance",
      painPoints: [],
      contentPillars: ["Security", "Compliance", "Privacy"],
      voiceTone: "Professional, trustworthy, clear",
      active: true,
    },
  });
  await prisma.orgMember.upsert({
    where: { userId_orgId: { userId: user.id, orgId: safespotOrg.id } },
    update: {},
    create: { userId: user.id, orgId: safespotOrg.id, role: "OWNER" },
  });
  console.log("Created/ensured: Safespot org");

  // Create "Hisaab" org if it doesn't exist
  const hisaabOrg = await prisma.organization.upsert({
    where: { slug: "hisaab" },
    update: {},
    create: {
      slug: "hisaab",
      name: "Hisaab",
      description: "Finance and accounting engine",
      targetAudience: "SMEs and freelancers",
      painPoints: [],
      contentPillars: ["Finance", "Accounting", "Invoicing"],
      voiceTone: "Analytical, helpful, precise",
      active: true,
    },
  });
  await prisma.orgMember.upsert({
    where: { userId_orgId: { userId: user.id, orgId: hisaabOrg.id } },
    update: {},
    create: { userId: user.id, orgId: hisaabOrg.id, role: "OWNER" },
  });
  console.log("Created/ensured: Hisaab org");

  console.log("Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
