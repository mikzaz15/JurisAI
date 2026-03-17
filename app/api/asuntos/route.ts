import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createMatterSchema = z.object({
  title: z.string().min(1).max(200),
  clientName: z.string().max(200).optional(),
  clientRfc: z.string().max(20).optional(),
  areaOfLaw: z.enum([
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
  ]),
  jurisdiction: z.string().max(100).optional(),
  description: z.string().max(2000).optional(),
  status: z.enum(["ACTIVE", "CLOSED", "ARCHIVED", "ON_HOLD"]).default("ACTIVE"),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "No autenticado" } },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || undefined;
  const areaOfLaw = searchParams.get("areaOfLaw") || undefined;
  const search = searchParams.get("search") || undefined;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(50, parseInt(searchParams.get("limit") || "20"));
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { orgId: session.user.orgId };
  if (status) where.status = status;
  if (areaOfLaw) where.areaOfLaw = areaOfLaw;
  if (search) where.title = { contains: search, mode: "insensitive" };

  const [matters, total] = await Promise.all([
    prisma.matter.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip,
      take: limit,
      include: {
        _count: { select: { documents: true, researchSessions: true } },
      },
    }),
    prisma.matter.count({ where }),
  ]);

  return NextResponse.json({ success: true, data: { matters, total, page, limit } });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "No autenticado" } },
      { status: 401 }
    );
  }
  if (!session.user.orgId) {
    return NextResponse.json(
      { success: false, error: { code: "NO_ORG", message: "Sin organización" } },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json(
      { success: false, error: { code: "INVALID_BODY", message: "Cuerpo inválido" } },
      { status: 400 }
    );
  }

  const parsed = createMatterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: parsed.error.message } },
      { status: 400 }
    );
  }

  const matter = await prisma.matter.create({
    data: {
      ...parsed.data,
      orgId: session.user.orgId,
    },
  });

  return NextResponse.json({ success: true, data: { matter } }, { status: 201 });
}
