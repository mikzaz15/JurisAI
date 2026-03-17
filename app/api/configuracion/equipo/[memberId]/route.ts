import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  role: z.enum(["ADMIN", "LAWYER", "PARALEGAL", "VIEWER"]),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: { memberId: string } }
) {
  const session = await auth();
  if (!session?.user?.orgId) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "No autenticado" } },
      { status: 401 }
    );
  }

  if (!["OWNER", "ADMIN"].includes(session.user.role || "")) {
    return NextResponse.json(
      { success: false, error: { code: "FORBIDDEN", message: "Sin permiso" } },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: parsed.error.message } },
      { status: 400 }
    );
  }

  const member = await prisma.orgMember.findFirst({
    where: { id: params.memberId, orgId: session.user.orgId },
  });

  if (!member) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "Miembro no encontrado" } },
      { status: 404 }
    );
  }

  // Can't change OWNER role
  if (member.role === "OWNER") {
    return NextResponse.json(
      { success: false, error: { code: "FORBIDDEN", message: "No se puede cambiar el rol del propietario" } },
      { status: 403 }
    );
  }

  const updated = await prisma.orgMember.update({
    where: { id: params.memberId },
    data: { role: parsed.data.role },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json({ success: true, data: { member: updated } });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { memberId: string } }
) {
  const session = await auth();
  if (!session?.user?.orgId) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "No autenticado" } },
      { status: 401 }
    );
  }

  if (!["OWNER", "ADMIN"].includes(session.user.role || "")) {
    return NextResponse.json(
      { success: false, error: { code: "FORBIDDEN", message: "Sin permiso" } },
      { status: 403 }
    );
  }

  const member = await prisma.orgMember.findFirst({
    where: { id: params.memberId, orgId: session.user.orgId },
  });

  if (!member) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "Miembro no encontrado" } },
      { status: 404 }
    );
  }

  // Can't remove OWNER
  if (member.role === "OWNER") {
    return NextResponse.json(
      { success: false, error: { code: "FORBIDDEN", message: "No se puede eliminar al propietario" } },
      { status: 403 }
    );
  }

  // Can't remove yourself
  if (member.userId === session.user.id) {
    return NextResponse.json(
      { success: false, error: { code: "FORBIDDEN", message: "No puedes eliminarte a ti mismo" } },
      { status: 403 }
    );
  }

  await prisma.orgMember.delete({ where: { id: params.memberId } });

  // Update seat count
  await prisma.subscription.updateMany({
    where: { orgId: session.user.orgId },
    data: { seatsUsed: { decrement: 1 } },
  });

  return NextResponse.json({ success: true, data: {} });
}
