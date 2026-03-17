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

  const [members, subscription, pendingInvites] = await Promise.all([
    prisma.orgMember.findMany({
      where: { orgId: session.user.orgId },
      include: { user: { select: { id: true, name: true, email: true, image: true, createdAt: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.subscription.findUnique({
      where: { orgId: session.user.orgId },
      select: { seatsUsed: true, seatsLimit: true, plan: true },
    }),
    prisma.teamInvite.findMany({
      where: {
        orgId: session.user.orgId,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      members: members.map((m) => ({
        id: m.id,
        role: m.role,
        createdAt: m.createdAt,
        user: m.user,
      })),
      pendingInvites: pendingInvites.map((inv) => ({
        id: inv.id,
        email: inv.email,
        role: inv.role,
        createdAt: inv.createdAt,
        expiresAt: inv.expiresAt,
      })),
      seats: {
        used: members.length,
        limit: subscription?.seatsLimit ?? 1,
      },
    },
  });
}
