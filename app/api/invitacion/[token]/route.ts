import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET — validate token and show invite info
export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  const invite = await prisma.teamInvite.findUnique({
    where: { token: params.token },
    include: { organization: { select: { name: true, type: true } } },
  });

  if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
    return NextResponse.json(
      { success: false, error: { code: "INVALID_INVITE", message: "Invitación inválida o expirada" } },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      invite: {
        email: invite.email,
        role: invite.role,
        orgName: invite.organization.name,
        orgType: invite.organization.type,
        expiresAt: invite.expiresAt,
      },
    },
  });
}

// POST — accept invite
export async function POST(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Debes iniciar sesión para aceptar la invitación" } },
      { status: 401 }
    );
  }

  const invite = await prisma.teamInvite.findUnique({
    where: { token: params.token },
    include: { organization: true },
  });

  if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
    return NextResponse.json(
      { success: false, error: { code: "INVALID_INVITE", message: "Invitación inválida o expirada" } },
      { status: 404 }
    );
  }

  if (invite.email !== session.user.email) {
    return NextResponse.json(
      { success: false, error: { code: "EMAIL_MISMATCH", message: "Esta invitación es para otro correo electrónico" } },
      { status: 403 }
    );
  }

  // Check if already a member
  const existing = await prisma.orgMember.findFirst({
    where: { userId: session.user.id, orgId: invite.orgId },
  });

  if (existing) {
    return NextResponse.json(
      { success: false, error: { code: "ALREADY_MEMBER", message: "Ya eres miembro de esta organización" } },
      { status: 409 }
    );
  }

  await prisma.$transaction([
    prisma.orgMember.create({
      data: {
        userId: session.user.id,
        orgId: invite.orgId,
        role: invite.role,
      },
    }),
    prisma.teamInvite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    }),
    prisma.subscription.updateMany({
      where: { orgId: invite.orgId },
      data: { seatsUsed: { increment: 1 } },
    }),
  ]);

  return NextResponse.json({
    success: true,
    data: { orgId: invite.orgId, orgName: invite.organization.name },
  });
}
