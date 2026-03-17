import { NextRequest, NextResponse } from "next/server";
import { stripe, PLAN_LIMITS } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("[stripe-webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpsert(sub);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(sub);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoiceFailed(invoice);
        break;
      }

      default:
        // Unhandled event — ignore
        break;
    }
  } catch (err) {
    console.error(`[stripe-webhook] Error handling ${event.type}:`, err);
    return NextResponse.json({ error: "Webhook handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleSubscriptionUpsert(stripeSub: Stripe.Subscription) {
  const orgId = stripeSub.metadata?.orgId;
  const plan = (stripeSub.metadata?.plan || "BASICO") as keyof typeof PLAN_LIMITS;
  const billingCycle = stripeSub.metadata?.billingCycle || "MONTHLY";

  if (!orgId) return;

  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.BASICO;

  const stripeStatus = stripeSub.status;
  const subStatus =
    stripeStatus === "active"
      ? "ACTIVE"
      : stripeStatus === "past_due"
      ? "PAST_DUE"
      : stripeStatus === "canceled"
      ? "CANCELED"
      : stripeStatus === "trialing"
      ? "TRIALING"
      : stripeStatus === "paused"
      ? "PAUSED"
      : "ACTIVE";

  // Handle period dates — Stripe API version differences
  const sub = stripeSub as Stripe.Subscription & {
    current_period_start?: number;
    current_period_end?: number;
  };
  const periodStart = sub.current_period_start
    ? new Date(sub.current_period_start * 1000)
    : new Date();
  const periodEnd = sub.current_period_end
    ? new Date(sub.current_period_end * 1000)
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await prisma.subscription.upsert({
    where: { orgId },
    create: {
      orgId,
      plan,
      status: subStatus as "ACTIVE" | "PAST_DUE" | "CANCELED" | "TRIALING" | "PAUSED",
      billingCycle: billingCycle as "MONTHLY" | "ANNUAL",
      stripeSubId: stripeSub.id,
      queriesLimit: limits.queries,
      documentsLimit: limits.documents,
      seatsLimit: limits.seats,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
    },
    update: {
      plan,
      status: subStatus as "ACTIVE" | "PAST_DUE" | "CANCELED" | "TRIALING" | "PAUSED",
      billingCycle: billingCycle as "MONTHLY" | "ANNUAL",
      stripeSubId: stripeSub.id,
      queriesLimit: limits.queries,
      documentsLimit: limits.documents,
      seatsLimit: limits.seats,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
    },
  });
}

async function handleSubscriptionDeleted(stripeSub: Stripe.Subscription) {
  const orgId = stripeSub.metadata?.orgId;
  if (!orgId) return;

  await prisma.subscription.updateMany({
    where: { orgId, stripeSubId: stripeSub.id },
    data: { status: "CANCELED", cancelAtPeriodEnd: false },
  });
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  // Reset usage counters at the start of a new billing period
  if (invoice.billing_reason === "subscription_cycle") {
    const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
    if (!customerId) return;

    const org = await prisma.organization.findFirst({
      where: { stripeCustomerId: customerId },
    });
    if (!org) return;

    await prisma.subscription.updateMany({
      where: { orgId: org.id },
      data: {
        queriesUsed: 0,
        documentsUsed: 0,
        status: "ACTIVE",
      },
    });
  }
}

async function handleInvoiceFailed(invoice: Stripe.Invoice) {
  const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
  if (!customerId) return;

  const org = await prisma.organization.findFirst({
    where: { stripeCustomerId: customerId },
  });
  if (!org) return;

  await prisma.subscription.updateMany({
    where: { orgId: org.id },
    data: { status: "PAST_DUE" },
  });
}
