import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; versionId: string } }
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
    select: { id: true },
  });
  if (!document) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND" } },
      { status: 404 }
    );
  }

  const version = await prisma.documentVersion.findFirst({
    where: { id: params.versionId, documentId: params.id },
  });
  if (!version) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND" } },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: { version } });
}

// POST /api/documentos/[id]/versiones/[versionId] — restore version
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; versionId: string } }
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
  });
  if (!document) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND" } },
      { status: 404 }
    );
  }

  const targetVersion = await prisma.documentVersion.findFirst({
    where: { id: params.versionId, documentId: params.id },
  });
  if (!targetVersion) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND" } },
      { status: 404 }
    );
  }

  // Save current content as a new version before restoring
  if (document.content) {
    const versionCount = await prisma.documentVersion.count({
      where: { documentId: params.id },
    });
    await prisma.documentVersion.create({
      data: {
        documentId: params.id,
        version: versionCount + 1,
        content: document.content,
        changeNote: "Antes de restaurar versión",
      },
    });
  }

  // Update document with restored content
  const updated = await prisma.document.update({
    where: { id: params.id },
    data: { content: targetVersion.content },
  });

  return NextResponse.json({ success: true, data: { document: updated } });
}
