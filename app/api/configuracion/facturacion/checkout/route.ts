import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe, STRIPE_PRICES, PLAN_LIMITS } from "@/lib/stripe";
import { z } from "zod";

const checkoutSchema = z.object({
  plan: z.enum(["PRO"]),
  billingCycle: z.enum(["MONTHLY", "ANNUAL"]),
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.orgId) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "No autenticado" } },
      { status: 401 }
    );
  }

  // Only OWNER/ADMIN can manage billing
  if (!["OWNER", "ADMIN"].includes(session.user.role || "")) {
    return NextResponse.json(
      { success: false, error: { code: "FORBIDDEN", message: "Sin permiso para gestionar facturación" } },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: parsed.error.message } },
      { status: 400 }
    );
  }

  const { plan, billingCycle } = parsed.data;
  const priceId = STRIPE_PRICES[plan][billingCycle === "MONTHLY" ? "monthly" : "annual"];

  if (!priceId) {
    return NextResponse.json(
      { success: false, error: { code: "PRICE_NOT_CONFIGURED", message: "Precio no configurado. Contacta a soporte." } },
      { status: 503 }
    );
  }

  const org = await prisma.organization.findUnique({
    where: { id: session.user.orgId },
    include: { settings: true },
  });

  if (!org) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "Organización no encontrada" } },
      { status: 404 }
    );
  }

  // Get or create Stripe customer
  let customerId = org.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: session.user.email || "",
      name: org.name,
      metadata: { orgId: org.id },
    });
    customerId = customer.id;
    await prisma.organization.update({
      where: { id: org.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${APP_URL}/app/configuracion/facturacion?success=true`,
    cancel_url: `${APP_URL}/app/configuracion/facturacion?canceled=true`,
    subscription_data: {
      metadata: {
        orgId: org.id,
        plan,
        billingCycle,
      },
    },
    allow_promotion_codes: true,
    locale: "es",
  });

  return NextResponse.json({
    success: true,
    data: { url: checkoutSession.url },
  });
}
