import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createVersionSchema = z.object({
  changeNote: z.string().max(200).optional(),
});

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
    select: { id: true },
  });
  if (!document) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND" } },
      { status: 404 }
    );
  }

  const versions = await prisma.documentVersion.findMany({
    where: { documentId: params.id },
    orderBy: { version: "desc" },
    select: {
      id: true,
      version: true,
      changeNote: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ success: true, data: { versions } });
}

export async function POST(
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
  });
  if (!document) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND" } },
      { status: 404 }
    );
  }

  if (!document.content) {
    return NextResponse.json(
      { success: false, error: { code: "NO_CONTENT", message: "El documento no tiene contenido" } },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const parsed = createVersionSchema.safeParse(body);

  const versionCount = await prisma.documentVersion.count({
    where: { documentId: params.id },
  });

  const version = await prisma.documentVersion.create({
    data: {
      documentId: params.id,
      version: versionCount + 1,
      content: document.content,
      changeNote: parsed.success ? parsed.data.changeNote : undefined,
    },
  });

  return NextResponse.json({ success: true, data: { version } }, { status: 201 });
}
