import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { client as prisma } from "@/lib/prisma";
import Link from "next/link";
import { Crown, Building2, Compass, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MasterDashboardPage() {
  const session = await getSession();

  if (!session || !session.id) {
    console.log("[AUTH TRACE] MasterDashboardPage: No valid session cookie found. Redirecting to /sign-in");
    return redirect("/sign-in");
  }

  const clerkId = session.id;
  const email = session.emailAddresses?.[0]?.emailAddress || `${clerkId}@mindmaxing.com`;

  // Find or create user record in DB
  let dbUser = await prisma.user.findUnique({
    where: { clerkId },
  });

  if (!dbUser) {
    console.log("[AUTH TRACE] MasterDashboardPage: User record missing in DB. Auto-creating user:", clerkId);
    dbUser = await prisma.user.create({
      data: {
        clerkId,
        email,
        firstname: session.firstName || "Creator",
        lastname: session.lastName || "User",
      },
    });
  }

  // Fetch all org memberships for this user
  const rawMemberships = await prisma.orgMember.findMany({
    where: { userId: dbUser.id },
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

  let memberships = rawMemberships.filter((m) => Boolean(m && m.org));

  // If user has NO org memberships, auto-assign them to default orgs
  if (memberships.length === 0) {
    console.log("[AUTH TRACE] MasterDashboardPage: User has 0 memberships. Seeding default orgs...");
    let allOrgs = await prisma.organization.findMany();

    if (allOrgs.length === 0) {
      const coursesOrg = await prisma.organization.create({
        data: {
          name: "Courses Business",
          slug: "courses",
          tagline: "Course creation & student lead capture",
          description: "Automates DMs and student onboarding for digital courses.",
        },
      });
      const hisaabOrg = await prisma.organization.create({
        data: {
          name: "Hisaab Finance",
          slug: "hisaab",
          tagline: "Automatic expense tracking for freelancers",
          description: "Auto-imports bank statements and tracks tax write-offs.",
        },
      });
      allOrgs = [coursesOrg, hisaabOrg];
    }

    for (const org of allOrgs) {
      await prisma.orgMember.upsert({
        where: {
          userId_orgId: {
            userId: dbUser.id,
            orgId: org.id,
          },
        },
        create: {
          userId: dbUser.id,
          orgId: org.id,
          role: "OWNER",
        },
        update: {},
      });
    }

    const refetched = await prisma.orgMember.findMany({
      where: { userId: dbUser.id },
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

  return (
    <div className="min-h-screen bg-[var(--page-bg)] text-[var(--text-primary)] p-6 lg:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-y-4 border-b border-[var(--border-color)] pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-5 h-5 text-amber-400" />
              <span className="text-xs font-mono uppercase tracking-[0.25em] text-amber-300 font-bold">
                Master Platform Control Tower
              </span>
            </div>
            <h1
              className="text-3xl lg:text-4xl font-bold text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
            >
              Master Organization Overview
            </h1>
            <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-[65ch] leading-relaxed">
              Select an organization workspace to manage automations, content pipelines, and AI intelligence, or discover public workspaces.
            </p>
          </div>

          <Link
            href="/dashboard/courses/discover"
            className="flex items-center gap-x-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl px-5 py-2.5 text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-all shadow-md shrink-0 w-fit"
            style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
          >
            <Compass className="w-4 h-4" />
            Discover & Join Orgs
          </Link>
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
                className="group rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6 hover:border-[var(--accent-magenta)]/60 transition-all duration-300 hover:shadow-xl shadow-sm flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-bold flex items-center justify-center text-sm shadow-md">
                        {org.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h2
                          className="text-lg font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-magenta)] transition-colors leading-tight"
                          style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
                        >
                          {org.name}
                        </h2>
                        <span className="text-[10px] text-[var(--text-tertiary)] font-mono">
                          /{org.slug}
                        </span>
                      </div>
                    </div>

                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-md font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Role: {m.role}
                    </span>
                  </div>

                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-2">
                    {org.tagline || org.description || "Active organization workspace."}
                  </p>
                </div>

                {/* Footer Stats & Access Action */}
                <div className="pt-4 mt-6 border-t border-[var(--border-color)] space-y-3">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-[var(--text-tertiary)] text-[10px] font-bold uppercase">Automations: <strong>{org._count?.automations || 0}</strong></span>
                    <span className="text-[var(--text-tertiary)] text-[10px] font-bold uppercase">Contacts: <strong>{org._count?.contacts || 0}</strong></span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-bold text-[var(--accent-magenta)] group-hover:translate-x-0.5 transition-transform pt-1">
                    <span>Enter Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </a>
            );
          })}

          {/* Discover / Request Join Card */}
          <a
            href="/dashboard/courses/discover"
            className="rounded-2xl border-2 border-dashed border-[var(--border-color)] p-6 flex flex-col items-center justify-center min-h-[220px] hover:border-[var(--accent-magenta)]/60 transition-all duration-300 cursor-pointer group bg-[var(--card-bg)]/40 text-center"
          >
            <div className="w-12 h-12 rounded-2xl border border-[var(--border-color)] group-hover:border-[var(--accent-magenta)] flex items-center justify-center mb-3 transition-colors bg-[var(--card-bg)] shadow-sm">
              <Compass className="w-6 h-6 text-[var(--text-secondary)] group-hover:text-[var(--accent-magenta)] transition-colors" />
            </div>
            <span className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-magenta)] transition-colors" style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>
              Join or Request New Org
            </span>
            <p className="text-[11px] text-[var(--text-secondary)] mt-1 max-w-[25ch]">
              Enter a join code or search public workspaces
            </p>
          </a>
        </div>
      </div>
    </div>
  );
}
