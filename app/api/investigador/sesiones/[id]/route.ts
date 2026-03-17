import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/investigador/sesiones/[id] — get session with all messages
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

  const researchSession = await prisma.researchSession.findFirst({
    where: { id: params.id, userId: session.user.id },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!researchSession) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "Sesión no encontrada" } },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: researchSession });
}

// DELETE /api/investigador/sesiones/[id] — delete session
export async function DELETE(
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

  const existing = await prisma.researchSession.findFirst({
    where: { id: params.id, userId: session.user.id },
  });

  if (!existing) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "Sesión no encontrada" } },
      { status: 404 }
    );
  }

  await prisma.researchSession.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}

// PATCH /api/investigador/sesiones/[id] — update session title
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "No autenticado" } },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const { title } = body as { title?: string };

  const updated = await prisma.researchSession.updateMany({
    where: { id: params.id, userId: session.user.id },
    data: { title: title ?? undefined },
  });

  if (updated.count === 0) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "Sesión no encontrada" } },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}
