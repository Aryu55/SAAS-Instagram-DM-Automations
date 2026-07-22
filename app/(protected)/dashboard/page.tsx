import { onboardUser } from "@/actions/user";
import { redirect } from "next/navigation";
import { client as prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function MasterDashboardPage() {
  console.log("[AUTH TRACE] MasterDashboardPage: checking auth...");
  const user = await onboardUser();

  if (user.status !== 200 && user.status !== 201) {
    return redirect("/api/auth/logout");
  }

  const userId = user.data?.id;
  if (!userId) return redirect("/api/auth/logout");

  // Fetch all organizations this user is a member of
  const rawMemberships = await prisma.orgMember.findMany({
    where: { userId },
    include: {
      org: {
        include: {
          _count: {
            select: {
              jobs: true,
              automations: true,
              contacts: true,
            },
          },
        },
      },
    },
  });

  // Safely filter memberships that have valid non-null org objects
  let memberships = rawMemberships.filter((m) => Boolean(m && m.org));

  // If user has NO valid org memberships, auto-link to all existing orgs or create default
  if (memberships.length === 0) {
    console.log("[AUTH TRACE] MasterDashboardPage: Auto-linking user to default orgs...");
    let allOrgs = await prisma.organization.findMany();

    if (allOrgs.length === 0) {
      const defaultOrg = await prisma.organization.create({
        data: {
          name: "Courses",
          slug: "courses",
          tagline: "Course creation & student lead capture",
          description: "Automates DMs and student onboarding for digital courses.",
        },
      });
      allOrgs = [defaultOrg];
    }

    // Assign user to all orgs as OWNER
    for (const org of allOrgs) {
      await prisma.orgMember.upsert({
        where: {
          userId_orgId: {
            userId,
            orgId: org.id,
          },
        },
        create: {
          userId,
          orgId: org.id,
          role: "OWNER",
        },
        update: {},
      });
    }

    // Re-fetch valid memberships
    const refetched = await prisma.orgMember.findMany({
      where: { userId },
      include: {
        org: {
          include: {
            _count: {
              select: {
                jobs: true,
                automations: true,
                contacts: true,
              },
            },
          },
        },
      },
    });
    memberships = refetched.filter((m) => Boolean(m && m.org));
  }

  // If user has 1 org (or defaults to courses), redirect to it cleanly
  if (memberships.length === 1 && memberships[0]?.org?.slug) {
    const slug = memberships[0].org.slug;
    console.log(`[AUTH TRACE] MasterDashboardPage: redirecting to single org /dashboard/${slug}`);
    return redirect(`/dashboard/${slug}`);
  }

  // If user has multiple orgs, render Organization Switcher Grid
  return (
    <div className="min-h-screen bg-[var(--page-bg)] text-[var(--text-primary)] p-6 lg:p-10">
      {/* Header */}
      <div className="mb-10 border-b border-[var(--border-color)] pb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-mono uppercase tracking-[0.25em] text-[var(--text-tertiary)] font-bold">
            Mindmaxing Command Center
          </span>
        </div>
        <h1
          className="text-3xl lg:text-4xl font-bold text-[var(--text-primary)]"
          style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
        >
          Master Organization Overview
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Select an organization workspace to enter, or request access to public orgs.
        </p>
      </div>

      {/* Organization Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {memberships.map((m) => {
          const org = m.org;
          if (!org) return null;

          return (
            <a
              key={org.id}
              href={`/dashboard/${org.slug}`}
              className="group rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6 hover:border-[var(--accent-magenta)] transition-all duration-300 hover:shadow-lg shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2
                      className="text-xl font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-magenta)] transition-colors"
                      style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
                    >
                      {org.name}
                    </h2>
                    <span className="text-[10px] text-[var(--text-tertiary)] font-mono">
                      /{org.slug}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold uppercase ${
                      org.active
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                    }`}
                  >
                    {org.active ? "ACTIVE" : "ONLINE"}
                  </span>
                </div>

                {org.tagline && (
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-4">
                    {org.tagline}
                  </p>
                )}
              </div>

              {/* Stats Row */}
              <div className="flex gap-6 pt-4 border-t border-[var(--border-color)] font-mono">
                <div>
                  <p className="text-xl font-bold text-[var(--text-primary)]">
                    {org._count?.jobs || 0}
                  </p>
                  <p className="text-[10px] text-[var(--text-tertiary)] uppercase font-bold">Jobs</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-[var(--text-primary)]">
                    {org._count?.automations || 0}
                  </p>
                  <p className="text-[10px] text-[var(--text-tertiary)] uppercase font-bold">Automations</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-[var(--text-primary)]">
                    {org._count?.contacts || 0}
                  </p>
                  <p className="text-[10px] text-[var(--text-tertiary)] uppercase font-bold">Contacts</p>
                </div>
              </div>
            </a>
          );
        })}

        {/* Discover / Join Orgs Card */}
        <a
          href="/dashboard/courses/discover"
          className="rounded-2xl border-2 border-dashed border-[var(--border-color)] p-6 flex flex-col items-center justify-center min-h-[200px] hover:border-[var(--accent-magenta)] transition-colors duration-300 cursor-pointer group bg-[var(--card-bg)]/40"
        >
          <div className="w-12 h-12 rounded-full border-2 border-[var(--border-color)] group-hover:border-[var(--accent-magenta)] flex items-center justify-center mb-3 transition-colors">
            <span className="text-2xl text-[var(--text-secondary)] group-hover:text-[var(--accent-magenta)]">+</span>
          </div>
          <span className="text-sm font-semibold text-[var(--text-secondary)] group-hover:text-[var(--accent-magenta)]">
            Discover & Request Orgs
          </span>
        </a>
      </div>
    </div>
  );
}
