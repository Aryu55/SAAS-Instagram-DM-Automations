"use server";

import { client } from "@/lib/prisma";
import { onCurrentUser } from "@/actions/user";
import { MemberRole } from "@prisma/client";

/**
 * Generate a clean 6-digit random code
 */
function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send an Email Invitation to join Master Org or Individual Org
 */
export async function sendEmailInvite(data: {
  email: string;
  orgId?: string | null;
  role?: MemberRole;
}) {
  try {
    const user = await onCurrentUser();
    if (!user) return { status: 401, error: "Unauthorized" };

    const email = data.email.toLowerCase().trim();
    const role = data.role || MemberRole.MEMBER;
    const code = generateCode();

    const invite = await client.orgInvite.create({
      data: {
        email,
        orgId: data.orgId || null,
        role,
        code,
        invitedByUserId: user.id,
        status: "PENDING"
      }
    });

    return {
      status: 200,
      data: invite,
      message: `Invitation created for ${email}. Shareable Code: ${code}`
    };
  } catch (err: any) {
    return { status: 500, error: err.message };
  }
}

/**
 * Request Access to Master Org or Individual Org (Discord-Style)
 */
export async function requestOrgAccess(data: {
  orgId?: string | null;
  targetType: "MASTER_ORG" | "INDIVIDUAL_ORG";
  requestedRole?: MemberRole;
}) {
  try {
    const user = await onCurrentUser();
    if (!user) return { status: 401, error: "Unauthorized" };

    const dbUser = await client.user.findUnique({
      where: { clerkId: user.id },
    });
    if (!dbUser) return { status: 404, error: "User not found" };

    // Check if user is already a member of this org
    if (data.orgId) {
      const existingMember = await client.orgMember.findUnique({
        where: {
          userId_orgId: {
            userId: dbUser.id,
            orgId: data.orgId,
          },
        },
      });
      if (existingMember) {
        return { status: 400, error: "You are already a member of this organization!" };
      }
    }

    // Check if request already exists
    const existing = await client.orgJoinRequest.findFirst({
      where: {
        userId: dbUser.id,
        orgId: data.orgId || null,
        status: "PENDING",
      },
    });

    if (existing) {
      return { status: 400, error: "You already have a pending join request for this target." };
    }

    const joinReq = await client.orgJoinRequest.create({
      data: {
        userId: dbUser.id,
        orgId: data.orgId || null,
        targetType: data.targetType,
        requestedRole: data.requestedRole || MemberRole.MEMBER,
        status: "PENDING",
      },
    });

    return { status: 200, data: joinReq, message: "Access request submitted to Admin Approval Queue!" };
  } catch (err: any) {
    return { status: 500, error: err.message };
  }
}

/**
 * Get Pending Join Requests for Admin Approval Queue
 */
export async function getPendingRequests(orgId?: string | null) {
  try {
    const user = await onCurrentUser();
    if (!user) return { status: 401, error: "Unauthorized" };

    const requests = await client.orgJoinRequest.findMany({
      where: {
        status: "PENDING"
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstname: true,
            lastname: true
          }
        },
        org: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return { status: 200, data: requests };
  } catch (err: any) {
    return { status: 500, error: err.message };
  }
}

/**
 * Approve a Pending Join Request & Assign Role
 */
export async function approveJoinRequest(requestId: string, assignedRole?: MemberRole) {
  try {
    const user = await onCurrentUser();
    if (!user) return { status: 401, error: "Unauthorized" };

    const req = await client.orgJoinRequest.findUnique({
      where: { id: requestId }
    });

    if (!req) return { status: 404, error: "Request not found" };

    const roleToAssign = assignedRole || req.requestedRole || MemberRole.MEMBER;

    // Update Request Status
    await client.orgJoinRequest.update({
      where: { id: requestId },
      data: { status: "APPROVED" }
    });

    // If request has specific orgId, add member to that org
    if (req.orgId) {
      await client.orgMember.upsert({
        where: {
          userId_orgId: {
            userId: req.userId,
            orgId: req.orgId
          }
        },
        create: {
          userId: req.userId,
          orgId: req.orgId,
          role: roleToAssign
        },
        update: {
          role: roleToAssign
        }
      });
    } else {
      // Master Org Access: Add to all active organizations
      const allOrgs = await client.organization.findMany({ select: { id: true } });
      for (const o of allOrgs) {
        await client.orgMember.upsert({
          where: {
            userId_orgId: {
              userId: req.userId,
              orgId: o.id
            }
          },
          create: {
            userId: req.userId,
            orgId: o.id,
            role: roleToAssign === MemberRole.MEMBER ? MemberRole.MASTER_ADMIN : roleToAssign
          },
          update: {
            role: roleToAssign
          }
        });
      }
    }

    return { status: 200, message: "Member approved and access granted!" };
  } catch (err: any) {
    return { status: 500, error: err.message };
  }
}

/**
 * Decline a Pending Join Request
 */
export async function declineJoinRequest(requestId: string) {
  try {
    const user = await onCurrentUser();
    if (!user) return { status: 401, error: "Unauthorized" };

    await client.orgJoinRequest.update({
      where: { id: requestId },
      data: { status: "DECLINED" }
    });

    return { status: 200, message: "Request declined." };
  } catch (err: any) {
    return { status: 500, error: err.message };
  }
}

/**
 * Get Members for an Organization
 */
export async function getOrgMembers(orgId: string) {
  try {
    const members = await client.orgMember.findMany({
      where: { orgId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstname: true,
            lastname: true
          }
        }
      },
      orderBy: {
        role: "asc"
      }
    });

    return { status: 200, data: members };
  } catch (err: any) {
    return { status: 500, error: err.message };
  }
}

/**
 * Update Member Role
 */
export async function updateMemberRole(memberId: string, newRole: MemberRole) {
  try {
    const member = await client.orgMember.update({
      where: { id: memberId },
      data: { role: newRole }
    });

    return { status: 200, data: member, message: "Role updated successfully." };
  } catch (err: any) {
    return { status: 500, error: err.message };
  }
}

/**
 * Remove Member from Organization
 */
export async function removeOrgMember(memberId: string) {
  try {
    await client.orgMember.delete({
      where: { id: memberId }
    });

    return { status: 200, message: "Member removed." };
  } catch (err: any) {
    return { status: 500, error: err.message };
  }
}

/**
 * Get Public / Discoverable Organizations (Discord-Style Directory)
 */
export async function getPublicOrganizations() {
  try {
    const user = await onCurrentUser();
    let dbUser = null;
    if (user) {
      dbUser = await client.user.findUnique({
        where: { clerkId: user.id },
        include: { memberships: true },
      });
    }

    const orgs = await client.organization.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        tagline: true,
        description: true,
        logoUrl: true,
        _count: {
          select: { members: true },
        },
      },
    });

    const userMembershipsMap = new Map(
      dbUser?.memberships?.map((m) => [m.orgId, m.role]) || []
    );

    const isMasterAdmin = dbUser?.memberships?.some(
      (m) => m.role === "MASTER_ADMIN" || m.role === "OWNER"
    ) || false;

    const data = orgs.map((o) => ({
      ...o,
      userRole: userMembershipsMap.get(o.id) || null,
      isJoined: userMembershipsMap.has(o.id),
    }));

    return {
      status: 200,
      data,
      isMasterAdmin,
    };
  } catch (err: any) {
    return { status: 500, error: err.message };
  }
}

/**
 * Auto-claim Pending Invites for a User upon Login
 */
export async function processPendingUserInvites(userId: string, email: string) {
  try {
    const invites = await client.orgInvite.findMany({
      where: {
        email: email.toLowerCase().trim(),
        status: "PENDING"
      }
    });

    for (const inv of invites) {
      if (inv.orgId) {
        await client.orgMember.upsert({
          where: { userId_orgId: { userId, orgId: inv.orgId } },
          create: { userId, orgId: inv.orgId, role: inv.role },
          update: { role: inv.role }
        });
      } else {
        const allOrgs = await client.organization.findMany({ select: { id: true } });
        for (const o of allOrgs) {
          await client.orgMember.upsert({
            where: { userId_orgId: { userId, orgId: o.id } },
            create: { userId, orgId: o.id, role: inv.role },
            update: { role: inv.role }
          });
        }
      }

      await client.orgInvite.update({
        where: { id: inv.id },
        data: { status: "ACCEPTED" }
      });
    }

    return { status: 200, claimed: invites.length };
  } catch (err: any) {
    return { status: 500, error: err.message };
  }
}
