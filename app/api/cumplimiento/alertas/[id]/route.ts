import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) {
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

  return NextResponse.json({ success: true, data: { alert } });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // POST to /alertas/[id]/impacto — handled by sub-route, this catches generic POSTs
  const url = new URL(req.url);
  if (!url.pathname.endsWith("/impacto")) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "Ruta no encontrada" } },
      { status: 404 }
    );
  }

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

  // Find org's active matters that might be affected
  const matters = await prisma.matter.findMany({
    where: {
      orgId: session.user.orgId,
      status: "ACTIVE",
      areaOfLaw: alert.areaOfLaw,
    },
    select: { id: true, title: true, clientName: true, areaOfLaw: true, jurisdiction: true },
    take: 10,
  });

  // Simple analysis without AI (AI integration requires paid plan)
  const impactedMatters = matters.map((m) => ({
    matter: m,
    impactSummary: `Este asunto podría verse afectado por "${alert.title}" emitido por ${alert.authority}. Se recomienda revisar las obligaciones derivadas de esta regulación.`,
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
