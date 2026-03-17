import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateMatterSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  clientName: z.string().max(200).optional().nullable(),
  clientRfc: z.string().max(20).optional().nullable(),
  areaOfLaw: z
    .enum([
      "CIVIL",
      "PENAL",
      "LABORAL",
      "FISCAL",
      "MERCANTIL",
      "CONSTITUCIONAL",
      "ADMINISTRATIVO",
      "FAMILIAR",
      "AGRARIO",
      "AMBIENTAL",
      "PROPIEDAD_INTELECTUAL",
      "COMERCIO_EXTERIOR",
      "CORPORATIVO",
      "INMOBILIARIO",
      "MIGRATORIO",
      "NOTARIAL",
      "OTHER",
    ])
    .optional(),
  jurisdiction: z.string().max(100).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  status: z.enum(["ACTIVE", "CLOSED", "ARCHIVED", "ON_HOLD"]).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "No autenticado" } },
      { status: 401 }
    );
  }

  const matter = await prisma.matter.findFirst({
    where: { id: params.id, orgId: session.user.orgId },
    include: {
      documents: {
        orderBy: { updatedAt: "desc" },
        include: { _count: { select: { versions: true } } },
      },
      researchSessions: {
        orderBy: { updatedAt: "desc" },
        include: {
          _count: { select: { messages: true } },
          messages: {
            where: { role: "USER" },
            take: 1,
            orderBy: { createdAt: "asc" },
            select: { content: true },
          },
        },
      },
      notes: { orderBy: { createdAt: "desc" } },
      _count: { select: { documents: true, researchSessions: true, notes: true } },
    },
  });

  if (!matter) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "Asunto no encontrado" } },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: { matter } });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "No autenticado" } },
      { status: 401 }
    );
  }

  const existing = await prisma.matter.findFirst({
    where: { id: params.id, orgId: session.user.orgId },
  });
  if (!existing) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND" } },
      { status: 404 }
    );
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json(
      { success: false, error: { code: "INVALID_BODY" } },
      { status: 400 }
    );
  }

  const parsed = updateMatterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: parsed.error.message } },
      { status: 400 }
    );
  }

  const matter = await prisma.matter.update({
    where: { id: params.id },
    data: parsed.data,
  });

  return NextResponse.json({ success: true, data: { matter } });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "No autenticado" } },
      { status: 401 }
    );
  }

  const existing = await prisma.matter.findFirst({
    where: { id: params.id, orgId: session.user.orgId },
  });
  if (!existing) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND" } },
      { status: 404 }
    );
  }

  // Soft delete via ARCHIVED status
  const matter = await prisma.matter.update({
    where: { id: params.id },
    data: { status: "ARCHIVED" },
  });

  return NextResponse.json({ success: true, data: { matter } });
}
