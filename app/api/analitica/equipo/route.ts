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
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const members = await prisma.orgMember.findMany({
    where: { orgId },
    include: { user: { select: { id: true, name: true, email: true, image: true } } },
    orderBy: { createdAt: "asc" },
  });

  // Usage metrics per member
  const memberStats = await Promise.all(
    members.map(async (member) => {
      const [queries, docs, lastActivity] = await Promise.all([
        prisma.usageMetric.aggregate({
          where: {
            orgId,
            userId: member.userId,
            metricType: "ai_query",
            date: { gte: since },
          },
          _sum: { count: true },
        }),
        prisma.document.count({
          where: { userId: member.userId, createdAt: { gte: since } },
        }),
        prisma.auditLog.findFirst({
          where: { userId: member.userId, orgId },
          orderBy: { createdAt: "desc" },
          select: { createdAt: true },
        }),
      ]);

      return {
        memberId: member.id,
        userId: member.userId,
        user: member.user,
        role: member.role,
        queriesLast30d: Number(queries._sum.count ?? 0),
        documentsLast30d: docs,
        lastActive: lastActivity?.createdAt ?? null,
      };
    })
  );

  return NextResponse.json({
    success: true,
    data: { members: memberStats },
  });
}
