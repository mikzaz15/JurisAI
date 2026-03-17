export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { exportToDocx } from "@/lib/docx-exporter";

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

  const doc = await prisma.document.findFirst({
    where: { id: params.id, userId: session.user.id },
  });

  if (!doc) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND" } },
      { status: 404 }
    );
  }

  // Export even if content is empty — produce a document with just the title
  const buffer = await exportToDocx(doc.title, doc.content || '{"type":"doc","content":[]}');

  const filename = `${doc.title.replace(/[^a-z0-9]/gi, "_")}.docx`;
  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
