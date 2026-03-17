import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.orgId) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "No autenticado" } },
      { status: 401 }
    );
  }

  const orgId = session.user.orgId;

  const [sub, matterCount, memberCount] = await Promise.all([
    prisma.subscription.findUnique({
      where: { orgId },
      select: {
        queriesUsed: true,
        queriesLimit: true,
        documentsUsed: true,
        documentsLimit: true,
        seatsUsed: true,
        seatsLimit: true,
        plan: true,
        currentPeriodStart: true,
        currentPeriodEnd: true,
      },
    }),
    prisma.matter.count({ where: { orgId, status: "ACTIVE" } }),
    prisma.orgMember.count({ where: { orgId } }),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      subscription: sub,
      activeMatters: matterCount,
      teamMembers: memberCount,
    },
  });
}
