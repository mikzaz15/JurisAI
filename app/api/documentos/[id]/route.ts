import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateDocumentSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  content: z.string().optional(),
  status: z.enum(["DRAFT", "IN_REVIEW", "APPROVED", "FINAL", "ARCHIVED"]).optional(),
  matterId: z.string().cuid().optional().nullable(),
});

const VERSION_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED" } },
      { status: 401 }
    );
  }

  const document = await prisma.document.findFirst({
    where: { id: params.id, userId: session.user.id },
    include: {
      matter: { select: { id: true, title: true } },
      template: { select: { id: true, name: true } },
      _count: { select: { versions: true } },
    },
  });

  if (!document) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND" } },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: { document } });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED" } },
      { status: 401 }
    );
  }

  const existing = await prisma.document.findFirst({
    where: { id: params.id, userId: session.user.id },
    include: {
      versions: { orderBy: { createdAt: "desc" }, take: 1 },
    },
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

  const parsed = updateDocumentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: parsed.error.message } },
      { status: 400 }
    );
  }

  const { content, ...rest } = parsed.data;

  // Auto-create version if content changed and 5+ minutes since last version
  if (content !== undefined && content !== existing.content) {
    const lastVersion = existing.versions[0];
    const shouldCreateVersion =
      !lastVersion ||
      Date.now() - new Date(lastVersion.createdAt).getTime() >= VERSION_INTERVAL_MS;

    if (shouldCreateVersion && existing.content) {
      const lastVersionNumber = await prisma.documentVersion.count({
        where: { documentId: params.id },
      });
      await prisma.documentVersion.create({
        data: {
          documentId: params.id,
          version: lastVersionNumber + 1,
          content: existing.content,
          changeNote: "Guardado automático",
        },
      });
    }
  }

  const document = await prisma.document.update({
    where: { id: params.id },
    data: {
      ...rest,
      ...(content !== undefined ? { content } : {}),
    },
  });

  return NextResponse.json({ success: true, data: { document } });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED" } },
      { status: 401 }
    );
  }

  const existing = await prisma.document.findFirst({
    where: { id: params.id, userId: session.user.id },
  });
  if (!existing) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND" } },
      { status: 404 }
    );
  }

  // Soft delete
  const document = await prisma.document.update({
    where: { id: params.id },
    data: { status: "ARCHIVED" },
  });

  return NextResponse.json({ success: true, data: { document } });
}
