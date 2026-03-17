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
  FREE_TRIAL: { queries: 20, documents: 5, seats: 1 },
  PYME: { queries: 100, documents: 20, seats: 2 },
  BASICO: { queries: 300, documents: 50, seats: 3 },
  PROFESIONAL: { queries: 1000, documents: 200, seats: 10 },
  EMPRESA: { queries: 9999999, documents: 9999999, seats: 9999999 },
} as const;

export type PlanKey = keyof typeof PLAN_LIMITS;

// Stripe price IDs from environment variables
export const STRIPE_PRICES: Record<
  "PYME" | "BASICO" | "PROFESIONAL",
  { monthly: string; annual: string }
> = {
  PYME: {
    monthly: process.env.STRIPE_PRICE_PYME_MONTHLY || "",
    annual: process.env.STRIPE_PRICE_PYME_ANNUAL || "",
  },
  BASICO: {
    monthly: process.env.STRIPE_PRICE_BASICO_MONTHLY || "",
    annual: process.env.STRIPE_PRICE_BASICO_ANNUAL || "",
  },
  PROFESIONAL: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || "",
    annual: process.env.STRIPE_PRICE_PRO_ANNUAL || "",
  },
};

export const PLAN_DISPLAY = {
  FREE_TRIAL: {
    name: "Prueba Gratuita",
    price: { monthly: 0, annual: 0 },
    currency: "MXN",
    color: "slate",
  },
  PYME: {
    name: "PyME",
    price: { monthly: 499, annual: 4990 },
    currency: "MXN",
    color: "blue",
  },
  BASICO: {
    name: "Básico",
    price: { monthly: 1499, annual: 14990 },
    currency: "MXN",
    color: "gold",
  },
  PROFESIONAL: {
    name: "Profesional",
    price: { monthly: 2999, annual: 29990 },
    currency: "MXN",
    color: "navy",
  },
  EMPRESA: {
    name: "Empresa",
    price: { monthly: 0, annual: 0 },
    currency: "MXN",
    color: "purple",
  },
} as const;
