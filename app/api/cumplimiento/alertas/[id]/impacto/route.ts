import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.orgId) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "No autenticado" } },
      { status: 401 }
    );
  }

  const alert = await prisma.regulatoryAlert.findUnique({
    where: { id: params.id },
  });

  if (!alert) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "Alerta no encontrada" } },
      { status: 404 }
    );
  }

  const matters = await prisma.matter.findMany({
    where: {
      orgId: session.user.orgId,
      status: "ACTIVE",
      areaOfLaw: alert.areaOfLaw,
    },
    select: { id: true, title: true, clientName: true, areaOfLaw: true, jurisdiction: true },
    take: 10,
  });

  const impactedMatters = matters.map((m) => ({
    matter: m,
    impactSummary: `El asunto "${m.title}" podría verse afectado por la alerta "${alert.title}" (${alert.authority}). Nivel de impacto: ${alert.impactLevel}. Se recomienda revisar las obligaciones y plazos derivados de esta regulación.`,
  }));

  return NextResponse.json({
    success: true,
    data: {
      alert,
      impactedMatters,
      totalAffected: impactedMatters.length,
    },
  });
}
