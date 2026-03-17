import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function POST() {
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

  const org = await prisma.organization.findUnique({
    where: { id: session.user.orgId },
    select: { stripeCustomerId: true },
  });

  if (!org?.stripeCustomerId) {
    return NextResponse.json(
      { success: false, error: { code: "NO_CUSTOMER", message: "No hay suscripción de Stripe activa" } },
      { status: 400 }
    );
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: org.stripeCustomerId,
    return_url: `${APP_URL}/app/configuracion/facturacion`,
  });

  return NextResponse.json({
    success: true,
    data: { url: portalSession.url },
  });
}
