import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateNoteSchema = z.object({
  content: z.string().min(1).max(10000),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; noteId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED" } },
      { status: 401 }
    );
  }

  // Verify matter belongs to org
  const matter = await prisma.matter.findFirst({
    where: { id: params.id, orgId: session.user.orgId },
    select: { id: true },
  });
  if (!matter) {
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

  const parsed = updateNoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: parsed.error.message } },
      { status: 400 }
    );
  }

  const note = await prisma.note.update({
    where: { id: params.noteId, matterId: params.id },
    data: { content: parsed.data.content },
  });

  return NextResponse.json({ success: true, data: { note } });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; noteId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED" } },
      { status: 401 }
    );
  }

  const matter = await prisma.matter.findFirst({
    where: { id: params.id, orgId: session.user.orgId },
    select: { id: true },
  });
  if (!matter) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND" } },
      { status: 404 }
    );
  }

  await prisma.note.delete({
    where: { id: params.noteId, matterId: params.id },
  });

  return NextResponse.json({ success: true });
}
