import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.orgId) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "No autenticado" } },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") || "30d";

  const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
  const since = new Date();
  since.setDate(since.getDate() - days);

  const orgId = session.user.orgId;

  // Daily query volume
  const dailyMetrics = await prisma.usageMetric.groupBy({
    by: ["date"],
    where: {
      orgId,
      metricType: "ai_query",
      date: { gte: since },
    },
    _sum: { count: true },
    orderBy: { date: "asc" },
  });

  // Queries by area of law (from research sessions → matters)
  const sessionsByArea = await prisma.$queryRaw<Array<{ areaOfLaw: string; count: bigint }>>`
    SELECT m."areaOfLaw", COUNT(rs.id)::bigint as count
    FROM "ResearchSession" rs
    JOIN "Matter" m ON rs."matterId" = m.id
    WHERE m."orgId" = ${orgId}
      AND rs."createdAt" >= ${since}
    GROUP BY m."areaOfLaw"
    ORDER BY count DESC
    LIMIT 10
  `;

  // Document types generated
  const docsByType = await prisma.document.groupBy({
    by: ["type"],
    where: { userId: session.user.id, createdAt: { gte: since } },
    _count: { id: true },
  });

  // Sessions without matter (no area of law)
  const sessionsWithoutMatter = await prisma.researchSession.count({
    where: {
      userId: session.user.id,
      matterId: null,
      createdAt: { gte: since },
    },
  });

  return NextResponse.json({
    success: true,
    data: {
      dailyVolume: dailyMetrics.map((d) => ({
        date: d.date,
        queries: Number(d._sum.count ?? 0),
      })),
      byAreaOfLaw: sessionsByArea.map((s) => ({
        area: s.areaOfLaw,
        count: Number(s.count),
      })),
      docsByType: docsByType.map((d) => ({
        type: d.type,
        count: d._count.id,
      })),
      sessionsWithoutMatter,
    },
  });
}
