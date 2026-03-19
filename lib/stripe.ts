import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
      apiVersion: "2025-01-27.acacia" as Stripe.LatestApiVersion,
    });
  }
  return _stripe;
}

// Convenience alias used in webhook (needs fresh instance for constructEvent)
export const stripe = {
  get customers() { return getStripe().customers; },
  get checkout() { return getStripe().checkout; },
  get billingPortal() { return getStripe().billingPortal; },
  get invoices() { return getStripe().invoices; },
  get webhooks() { return getStripe().webhooks; },
  get subscriptions() { return getStripe().subscriptions; },
} as unknown as Stripe;

export const PLAN_LIMITS = {
  FREE: { queries: 10, documents: 3, seats: 1 },
  FREE_TRIAL: { queries: 10, documents: 3, seats: 1 },
  PRO: { queries: 999999, documents: 999999, seats: 5 },
  // Legacy aliases — map to PRO limits
  PYME: { queries: 999999, documents: 999999, seats: 5 },
  BASICO: { queries: 999999, documents: 999999, seats: 5 },
  PROFESIONAL: { queries: 999999, documents: 999999, seats: 5 },
  EMPRESA: { queries: 999999, documents: 999999, seats: 999999 },
} as const;

export type PlanKey = keyof typeof PLAN_LIMITS;

/** Returns the canonical limits for any plan string, normalising legacy names. */
export function getPlanLimits(plan: string): { queries: number; documents: number; seats: number } {
  const key = plan as PlanKey;
  return PLAN_LIMITS[key] ?? PLAN_LIMITS.FREE;
}

// Stripe price IDs from environment variables
export const STRIPE_PRICES: Record<"PRO", { monthly: string; annual: string }> = {
  PRO: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || "",
    annual: process.env.STRIPE_PRICE_PRO_ANNUAL || "",
  },
};

export const PLAN_DISPLAY: Record<string, { name: string; price: { monthly: number; annual: number }; currency: string; color: string }> = {
  FREE: {
    name: "Gratis",
    price: { monthly: 0, annual: 0 },
    currency: "MXN",
    color: "slate",
  },
  FREE_TRIAL: {
    name: "Gratis",
    price: { monthly: 0, annual: 0 },
    currency: "MXN",
    color: "slate",
  },
  PRO: {
    name: "Pro",
    price: { monthly: 899, annual: 8990 },
    currency: "MXN",
    color: "gold",
  },
  // Legacy aliases shown with Pro branding
  PYME: { name: "Pro", price: { monthly: 899, annual: 8990 }, currency: "MXN", color: "gold" },
  BASICO: { name: "Pro", price: { monthly: 899, annual: 8990 }, currency: "MXN", color: "gold" },
  PROFESIONAL: { name: "Pro", price: { monthly: 899, annual: 8990 }, currency: "MXN", color: "gold" },
  EMPRESA: {
    name: "Empresa",
    price: { monthly: 0, annual: 0 },
    currency: "MXN",
    color: "purple",
  },
};
