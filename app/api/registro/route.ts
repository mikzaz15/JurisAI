import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { sendWelcomeEmail } from "@/lib/email";

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  orgName: z.string().min(2).max(200),
  orgType: z.enum(["LAW_FIRM", "CORPORATE", "NOTARIA", "SME", "INDIVIDUAL"]),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: parsed.error.message } },
        { status: 400 }
      );
    }

    const { name, email, password, orgName, orgType } = parsed.data;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "EMAIL_EXISTS", message: "Este correo ya está registrado" },
        },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Generate unique slug for organization
    let slug = slugify(orgName);
    const existingSlug = await prisma.organization.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${Date.now()}`;
    }

    // Create user, organization, membership, and trial subscription in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
          locale: "es-MX",
        },
      });

      const org = await tx.organization.create({
        data: {
          name: orgName,
          slug,
          type: orgType,
        },
      });

      await tx.orgMember.create({
        data: {
          userId: user.id,
          orgId: org.id,
          role: "OWNER",
        },
      });

      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 14);

      await tx.subscription.create({
        data: {
          orgId: org.id,
          plan: "FREE_TRIAL",
          status: "TRIALING",
          billingCycle: "MONTHLY",
          queriesLimit: 50,
          documentsLimit: 10,
          seatsLimit: 3,
          currentPeriodStart: new Date(),
          currentPeriodEnd: trialEnd,
        },
      });

      await tx.orgSettings.create({
        data: {
          orgId: org.id,
        },
      });

      return { user, org };
    });

    // Send welcome email (non-blocking)
    sendWelcomeEmail({ to: email, name, orgName }).catch((err) => {
      console.error("[registro] Welcome email failed:", err);
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          userId: result.user.id,
          orgId: result.org.id,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[registro] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Error al crear la cuenta" },
      },
      { status: 500 }
    );
  }
}
