import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendTeamInviteEmail } from "@/lib/email";
import { z } from "zod";

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["ADMIN", "LAWYER", "PARALEGAL", "VIEWER"]),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.orgId) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "No autenticado" } },
      { status: 401 }
    );
  }

  if (!["OWNER", "ADMIN"].includes(session.user.role || "")) {
    return NextResponse.json(
      { success: false, error: { code: "FORBIDDEN", message: "Sin permiso para invitar miembros" } },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: parsed.error.message } },
      { status: 400 }
    );
  }

  const { email, role } = parsed.data;

  // Check seat limit
  const [sub, memberCount] = await Promise.all([
    prisma.subscription.findUnique({
      where: { orgId: session.user.orgId },
      select: { seatsLimit: true },
    }),
    prisma.orgMember.count({ where: { orgId: session.user.orgId } }),
  ]);

  if (sub && memberCount >= sub.seatsLimit) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SEAT_LIMIT_REACHED",
          message: "Has alcanzado el límite de asientos de tu plan. Actualiza para agregar más miembros.",
        },
      },
      { status: 429 }
    );
  }

  // Check if already a member
  const existingUser = await prisma.user.findUnique({
    where: { email },
    include: { memberships: { where: { orgId: session.user.orgId } } },
  });

  if (existingUser?.memberships.length) {
    return NextResponse.json(
      { success: false, error: { code: "ALREADY_MEMBER", message: "Este usuario ya es miembro de la organización" } },
      { status: 409 }
    );
  }

  // Delete any existing pending invite for this email
  await prisma.teamInvite.deleteMany({
    where: { email, orgId: session.user.orgId, acceptedAt: null },
  });

  const org = await prisma.organization.findUnique({
    where: { id: session.user.orgId },
    select: { name: true },
  });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const invite = await prisma.teamInvite.create({
    data: {
      email,
      role,
      orgId: session.user.orgId,
      invitedById: session.user.id,
      expiresAt,
    },
  });

  // Send invite email (don't block on failure)
  try {
    await sendTeamInviteEmail({
      to: email,
      inviterName: session.user.name || "Un miembro del equipo",
      orgName: org?.name || "la organización",
      role,
      token: invite.token,
    });
  } catch (err) {
    console.error("[invitar] Email send failed:", err);
  }

  return NextResponse.json({
    success: true,
    data: {
      invite: {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        expiresAt: invite.expiresAt,
      },
    },
  });
}
