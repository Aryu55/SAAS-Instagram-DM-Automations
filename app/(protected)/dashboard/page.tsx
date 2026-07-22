import { onboardUser } from "@/actions/user";
import { redirect } from "next/navigation";
import { client as prisma } from "@/lib/prisma";

export default async function MasterDashboardPage() {
  console.log("[AUTH TRACE] MasterDashboardPage: checking auth...");
  const user = await onboardUser();
  console.log("[AUTH TRACE] MasterDashboardPage: onboardUser status:", user.status);

  if (user.status !== 200 && user.status !== 201) {
    return redirect("/api/auth/logout");
  }

  const userId = user.data?.id;
  if (!userId) return redirect("/api/auth/logout");

  // Fetch all organizations this user is a member of
  let memberships = await prisma.orgMember.findMany({
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

  console.log(`[AUTH TRACE] MasterDashboardPage: user belongs to ${memberships.length} orgs`);

  // If user has NO org memberships yet, auto-assign them as OWNER of all organizations
  if (memberships.length === 0) {
    console.log("[AUTH TRACE] MasterDashboardPage: No org memberships found. Auto-linking user to default orgs...");
    let allOrgs = await prisma.organization.findMany();
    
    if (allOrgs.length === 0) {
      console.log("[AUTH TRACE] MasterDashboardPage: Creating default 'Hisaab' organization...");
      const defaultOrg = await prisma.organization.create({
        data: {
          name: "Hisaab",
          slug: "hisaab",
          tagline: "Automatic expense tracking for freelancers and creators",
          description: "Auto-imports bank statements, categorizes write-offs, and calculates quarterly taxes.",
        },
      });
      allOrgs = [defaultOrg];
    }

    // Assign user to all orgs as OWNER
    for (const org of allOrgs) {
      const existingMember = await prisma.orgMember.findFirst({
        where: { userId, orgId: org.id },
      });
      if (!existingMember) {
        await prisma.orgMember.create({
          data: {
            userId,
            orgId: org.id,
            role: "OWNER",
          },
        });
      }
    }

    // Re-fetch memberships
    memberships = await prisma.orgMember.findMany({
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
  }

  // If user has 1 org, auto-redirect straight into it
  if (memberships.length === 1) {
    const destination = `/dashboard/${memberships[0].org.slug}`;
    console.log("[AUTH TRACE] MasterDashboardPage: auto-redirecting to slug:", destination);
    return redirect(destination);
  }

  return (
    <div className="min-h-screen bg-background p-8">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-mono uppercase tracking-[0.25em] text-zinc-500">
            Mindmaxing Command Center
          </span>
        </div>
        <h1
          className="text-3xl font-bold text-[var(--text-primary)]"
          style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
        >
          Your Organizations
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Select an organization to manage, or create a new one.
        </p>
      </div>

      {/* Organization Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {memberships.map((m) => (
          <a
            key={m.org.id}
            href={`/dashboard/${m.org.slug}`}
            className="group rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6 hover:border-[var(--accent-magenta)] transition-all duration-300 hover:shadow-lg hover:shadow-[var(--accent-magenta)]/5"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2
                  className="text-xl font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-magenta)] transition-colors"
                  style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
                >
                  {m.org.name}
                </h2>
                {m.org.tagline && (
                  <p className="text-sm text-[var(--text-secondary)] mt-1">{m.org.tagline}</p>
                )}
              </div>
              <span
                className={`text-xs font-mono px-2 py-1 rounded-full ${
                  m.org.active
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20"
                }`}
              >
                {m.org.active ? "ACTIVE" : "INACTIVE"}
              </span>
            </div>

            {/* Stats Row */}
            <div className="flex gap-6 mt-4 pt-4 border-t border-[var(--border-color)]">
              <div>
                <p className="text-2xl font-bold text-[var(--text-primary)]">
                  {m.org._count.jobs}
                </p>
                <p className="text-xs text-[var(--text-secondary)]">Content Jobs</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--text-primary)]">
                  {m.org._count.automations}
                </p>
                <p className="text-xs text-[var(--text-secondary)]">Automations</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--text-primary)]">
                  {m.org._count.contacts}
                </p>
                <p className="text-xs text-[var(--text-secondary)]">Contacts</p>
              </div>
            </div>
          </a>
        ))}

        {/* Create New Org Card */}
        <button className="rounded-2xl border-2 border-dashed border-[var(--border-color)] p-6 flex flex-col items-center justify-center min-h-[200px] hover:border-[var(--accent-magenta)] transition-colors duration-300 cursor-pointer group">
          <div className="w-12 h-12 rounded-full border-2 border-[var(--border-color)] group-hover:border-[var(--accent-magenta)] flex items-center justify-center mb-3 transition-colors">
            <span className="text-2xl text-[var(--text-secondary)] group-hover:text-[var(--accent-magenta)]">+</span>
          </div>
          <span className="text-sm font-semibold text-[var(--text-secondary)] group-hover:text-[var(--accent-magenta)]">
            Add Organization
          </span>
        </button>
      </div>
    </div>
  );
}
