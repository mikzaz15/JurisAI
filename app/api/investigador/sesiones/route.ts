import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// GET /api/investigador/sesiones — list all sessions for the user
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "No autenticado" } },
      { status: 401 }
    );
  }

  const sessions = await prisma.researchSession.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    take: 100,
    include: {
      messages: {
        where: { role: "USER" },
        take: 1,
        orderBy: { createdAt: "asc" },
        select: { content: true },
      },
      _count: { select: { messages: true } },
    },
  });

  return NextResponse.json({ success: true, data: sessions });
}

const createSessionSchema = z.object({
  matterId: z.string().cuid().optional(),
  title: z.string().max(200).optional(),
});

// POST /api/investigador/sesiones — create new session
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "No autenticado" } },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const parsed = createSessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: parsed.error.message } },
      { status: 400 }
    );
  }

  const newSession = await prisma.researchSession.create({
    data: {
      userId: session.user.id,
      matterId: parsed.data.matterId,
      title: parsed.data.title,
    },
  });

  return NextResponse.json({ success: true, data: newSession }, { status: 201 });
}
