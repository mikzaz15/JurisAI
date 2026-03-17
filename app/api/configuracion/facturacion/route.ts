import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe, PLAN_DISPLAY, PLAN_LIMITS } from "@/lib/stripe";

export async function GET() {
  const session = await auth();
  if (!session?.user?.orgId) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "No autenticado" } },
      { status: 401 }
    );
  }

  const [org, sub] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: session.user.orgId },
      select: { stripeCustomerId: true, name: true },
    }),
    prisma.subscription.findUnique({
      where: { orgId: session.user.orgId },
    }),
  ]);

  if (!sub) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "Suscripción no encontrada" } },
      { status: 404 }
    );
  }

  // Fetch invoices from Stripe if customer exists
  let invoices: object[] = [];
  if (org?.stripeCustomerId) {
    try {
      const stripeInvoices = await stripe.invoices.list({
        customer: org.stripeCustomerId,
        limit: 10,
      });
      invoices = stripeInvoices.data.map((inv) => ({
        id: inv.id,
        amount: inv.amount_paid / 100,
        currency: inv.currency.toUpperCase(),
        status: inv.status,
        date: new Date(inv.created * 1000).toISOString(),
        pdfUrl: inv.invoice_pdf,
        hostedUrl: inv.hosted_invoice_url,
      }));
    } catch {
      // Stripe not configured, return empty
    }
  }

  const planKey = sub.plan as keyof typeof PLAN_DISPLAY;

  return NextResponse.json({
    success: true,
    data: {
      subscription: {
        id: sub.id,
        plan: sub.plan,
        planDisplay: PLAN_DISPLAY[planKey],
        status: sub.status,
        billingCycle: sub.billingCycle,
        currentPeriodStart: sub.currentPeriodStart,
        currentPeriodEnd: sub.currentPeriodEnd,
        cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
        stripeSubId: sub.stripeSubId,
        usage: {
          queriesUsed: sub.queriesUsed,
          queriesLimit: sub.queriesLimit,
          documentsUsed: sub.documentsUsed,
          documentsLimit: sub.documentsLimit,
          seatsUsed: sub.seatsUsed,
          seatsLimit: sub.seatsLimit,
        },
      },
      invoices,
    },
  });
}
