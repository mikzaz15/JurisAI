import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendTeamInviteEmail } from "@/lib/email";

const onboardingSchema = z.object({
  orgName: z.string().min(2).max(200),
  orgType: z.enum(["LAW_FIRM", "CORPORATE", "NOTARIA", "SME", "INDIVIDUAL"]),
  rfc: z.string().max(13).optional(),
  practiceAreas: z.array(z.string()).min(1),
  inviteEmails: z.array(z.string().email()).optional().default([]),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session?.user?.orgId) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "No autorizado" } },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parsed = onboardingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: parsed.error.message } },
        { status: 400 }
      );
    }

    const { orgName, orgType, rfc, inviteEmails } = parsed.data;
    const { id: userId, orgId, name: userName } = session.user as {
      id: string;
      orgId: string;
      name?: string | null;
    };

    // Update org details
    await prisma.organization.update({
      where: { id: orgId },
      data: {
        name: orgName,
        type: orgType,
        ...(rfc ? { taxId: rfc } : {}),
      },
    });

    // Create team invites
    if (inviteEmails && inviteEmails.length > 0) {
      const org = await prisma.organization.findUnique({
        where: { id: orgId },
        select: { name: true },
      });

      for (const email of inviteEmails) {
        // Skip if already a member
        const existingMember = await prisma.user.findFirst({
          where: { email, memberships: { some: { orgId } } },
        });
        if (existingMember) continue;

        // Skip if invite already pending
        const existingInvite = await prisma.teamInvite.findFirst({
          where: { email, orgId, acceptedAt: null },
        });
        if (existingInvite) continue;

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        const invite = await prisma.teamInvite.create({
          data: {
            email,
            role: "LAWYER",
            orgId,
            invitedById: userId,
            expiresAt,
          },
        });

        // Send invite email (non-blocking)
        sendTeamInviteEmail({
          to: email,
          inviterName: userName || "Un colega",
          orgName: org?.name || orgName,
          role: "LAWYER",
          token: invite.token,
        }).catch((err) => {
          console.error("[onboarding] Invite email failed:", err);
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[onboarding] Error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Error al guardar" } },
      { status: 500 }
    );
  }
}
