import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createAlertSchema = z.object({
  title: z.string().min(1).max(300),
  summary: z.string().min(1),
  sourceUrl: z.string().url().optional(),
  authority: z.string().min(1),
  areaOfLaw: z.enum([
    "CIVIL", "PENAL", "MERCANTIL", "LABORAL", "FISCAL", "ADMINISTRATIVO",
    "CONSTITUCIONAL", "FAMILIAR", "AGRARIO", "AMBIENTAL", "PROPIEDAD_INTELECTUAL",
    "COMERCIO_EXTERIOR", "CORPORATIVO", "INMOBILIARIO", "MIGRATORIO", "NOTARIAL", "OTHER",
  ]),
  jurisdiction: z.string().min(1),
  impactLevel: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  dofDate: z.string().optional(),
  dofReference: z.string().optional(),
  publishedAt: z.string(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "No autenticado" } },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const authority = searchParams.get("authority");
  const areaOfLaw = searchParams.get("areaOfLaw");
  const impactLevel = searchParams.get("impactLevel");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (authority) where.authority = authority;
  if (areaOfLaw) where.areaOfLaw = areaOfLaw;
  if (impactLevel) where.impactLevel = impactLevel;
  if (from || to) {
    where.publishedAt = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    };
  }

  const [alerts, total] = await Promise.all([
    prisma.regulatoryAlert.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.regulatoryAlert.count({ where }),
  ]);

  // Get unique authorities for filter options
  const authorities = await prisma.regulatoryAlert.findMany({
    distinct: ["authority"],
    select: { authority: true },
    orderBy: { authority: "asc" },
  });

  return NextResponse.json({
    success: true,
    data: {
      alerts,
      total,
      page,
      pages: Math.ceil(total / limit),
      filters: {
        authorities: authorities.map((a) => a.authority),
      },
    },
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "No autenticado" } },
      { status: 401 }
    );
  }

  // Only OWNER/ADMIN can create alerts
  if (!["OWNER", "ADMIN"].includes(session.user.role || "")) {
    return NextResponse.json(
      { success: false, error: { code: "FORBIDDEN", message: "Sin permiso para crear alertas" } },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = createAlertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: parsed.error.message } },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const alert = await prisma.regulatoryAlert.create({
    data: {
      title: data.title,
      summary: data.summary,
      sourceUrl: data.sourceUrl,
      authority: data.authority,
      areaOfLaw: data.areaOfLaw,
      jurisdiction: data.jurisdiction,
      impactLevel: data.impactLevel,
      dofDate: data.dofDate ? new Date(data.dofDate) : null,
      dofReference: data.dofReference,
      publishedAt: new Date(data.publishedAt),
    },
  });

  return NextResponse.json({ success: true, data: { alert } }, { status: 201 });
}
