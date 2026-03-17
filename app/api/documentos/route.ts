import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createDocumentSchema = z.object({
  title: z.string().min(1).max(300),
  type: z.enum([
    "CONTRACT",
    "AMPARO_PETITION",
    "CORPORATE_DEED",
    "POWER_OF_ATTORNEY",
    "LEGAL_OPINION",
    "MEMO",
    "COMPLAINT",
    "MOTION",
    "REGULATORY_FILING",
    "NDA",
    "EMPLOYMENT",
    "LEASE",
    "GENERAL",
  ]),
  matterId: z.string().cuid().optional().nullable(),
  content: z.string().optional(),
  templateId: z.string().optional().nullable(),
  variables: z.record(z.string(), z.string()).optional(),
});

function replaceVariables(content: string, variables: Record<string, string>): string {
  return content.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] ?? `{{${key}}}`);
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED" } },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || undefined;
  const status = searchParams.get("status") || undefined;
  const matterId = searchParams.get("matterId") || undefined;
  const search = searchParams.get("search") || undefined;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(50, parseInt(searchParams.get("limit") || "20"));
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { userId: session.user.id };
  if (type) where.type = type;
  if (status) where.status = status;
  if (matterId) where.matterId = matterId;
  if (search) where.title = { contains: search, mode: "insensitive" };

  const [documents, total] = await Promise.all([
    prisma.document.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip,
      take: limit,
      include: {
        matter: { select: { id: true, title: true } },
        _count: { select: { versions: true } },
      },
    }),
    prisma.document.count({ where }),
  ]);

  return NextResponse.json({ success: true, data: { documents, total, page, limit } });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED" } },
      { status: 401 }
    );
  }

  // Check document limit
  if (session.user.orgId) {
    const sub = await prisma.subscription.findUnique({
      where: { orgId: session.user.orgId },
      select: { documentsUsed: true, documentsLimit: true },
    });
    if (sub && sub.documentsUsed >= sub.documentsLimit) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "DOCUMENT_LIMIT_REACHED",
            message: "Has alcanzado el límite de documentos de tu plan. Actualiza para continuar.",
          },
        },
        { status: 429 }
      );
    }
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json(
      { success: false, error: { code: "INVALID_BODY" } },
      { status: 400 }
    );
  }

  const parsed = createDocumentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: parsed.error.message } },
      { status: 400 }
    );
  }

  const { title, type, matterId, content, templateId, variables } = parsed.data;

  let finalContent = content ?? "";
  let resolvedTemplateId = templateId ?? undefined;

  // If template provided, fetch and replace variables
  if (templateId) {
    const template = await prisma.template.findFirst({
      where: {
        id: templateId,
        OR: [{ isSystem: true }, { orgId: session.user.orgId }],
      },
    });

    if (template) {
      finalContent = variables
        ? replaceVariables(template.content, variables)
        : template.content;
    } else {
      resolvedTemplateId = undefined;
    }
  }

  const document = await prisma.document.create({
    data: {
      title,
      type,
      status: "DRAFT",
      content: finalContent,
      matterId: matterId ?? null,
      userId: session.user.id,
      templateId: resolvedTemplateId ?? null,
    },
  });

  // Create initial version
  if (finalContent) {
    await prisma.documentVersion.create({
      data: {
        documentId: document.id,
        version: 1,
        content: finalContent,
        changeNote: "Versión inicial",
      },
    });
  }

  // Increment document usage counter
  if (session.user.orgId) {
    await prisma.subscription.updateMany({
      where: { orgId: session.user.orgId },
      data: { documentsUsed: { increment: 1 } },
    });
    await prisma.usageMetric.create({
      data: {
        orgId: session.user.orgId,
        userId: session.user.id,
        metricType: "document_generated",
      },
    });
  }

  return NextResponse.json({ success: true, data: { document } }, { status: 201 });
}
