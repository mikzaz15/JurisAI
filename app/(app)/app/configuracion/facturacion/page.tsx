"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  CreditCard,
  Zap,
  FileText,
  Users,
  ExternalLink,
  CheckCircle,
  XCircle,
  ChevronRight,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UsageGauge } from "@/components/facturacion/usage-gauge";
import { PlanCard } from "@/components/facturacion/plan-card";
import { cn } from "@/lib/utils";

interface Subscription {
  plan: string;
  planDisplay: { name: string; price: { monthly: number; annual: number } };
  status: string;
  billingCycle: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  stripeSubId: string | null;
  usage: {
    queriesUsed: number;
    queriesLimit: number;
    documentsUsed: number;
    documentsLimit: number;
    seatsUsed: number;
    seatsLimit: number;
  };
}

interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: string;
  date: string;
  pdfUrl: string | null;
  hostedUrl: string | null;
}

const PLAN_FEATURES: Record<string, string[]> = {
  FREE: ["10 consultas IA/mes", "3 documentos/mes", "1 usuario"],
  PRO: ["Consultas IA ilimitadas", "Documentos ilimitados", "Hasta 5 usuarios", "Soporte prioritario"],
  EMPRESA: ["Todo lo de Pro", "Usuarios ilimitados", "SLA dedicado", "API empresarial", "Onboarding personalizado"],
};

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  TRIALING: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  PAST_DUE: "bg-red-500/15 text-red-400 border-red-500/30",
  CANCELED: "bg-slate-500/15 text-slate-400 border-slate-500/30",
  PAUSED: "bg-amber-500/15 text-amber-400 border-amber-500/30",
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Activo",
  TRIALING: "Prueba gratuita",
  PAST_DUE: "Pago vencido",
  CANCELED: "Cancelado",
  PAUSED: "Pausado",
};

export default function FacturacionPage() {
  const searchParams = useSearchParams();
  const [sub, setSub] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPlans, setShowPlans] = useState(false);
  const [billingCycle, setBillingCycle] = useState<"MONTHLY" | "ANNUAL">("MONTHLY");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const successParam = searchParams.get("success");
  const canceledParam = searchParams.get("canceled");

  useEffect(() => {
    if (successParam === "true") {
      setToast({ type: "success", message: "¡Plan actualizado con éxito! Tu nueva suscripción está activa." });
    } else if (canceledParam === "true") {
      setToast({ type: "error", message: "El pago fue cancelado. Tu plan no cambió." });
    }
  }, [successParam, canceledParam]);

  useEffect(() => {
    fetch("/api/configuracion/facturacion")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setSub(d.data.subscription);
          setInvoices(d.data.invoices || []);
          setBillingCycle(d.data.subscription.billingCycle || "MONTHLY");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleCheckout(
    plan: "PRO",
    cycle: "MONTHLY" | "ANNUAL"
  ) {
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/configuracion/facturacion/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, billingCycle: cycle }),
      });
      const data = await res.json();
      if (data.success && data.data.url) {
        window.location.href = data.data.url;
      } else {
        setToast({
          type: "error",
          message: data.error?.message || "Error al crear la sesión de pago",
        });
      }
    } catch {
      setToast({ type: "error", message: "Error de conexión. Intenta de nuevo." });
    } finally {
      setCheckoutLoading(false);
    }
  }

  async function handlePortal() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/configuracion/facturacion/portal", { method: "POST" });
      const data = await res.json();
      if (data.success && data.data.url) {
        window.location.href = data.data.url;
      } else {
        setToast({
          type: "error",
          message: data.error?.message || "Error al abrir el portal de pagos",
        });
      }
    } catch {
      setToast({ type: "error", message: "Error de conexión. Intenta de nuevo." });
    } finally {
      setPortalLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="h-full overflow-y-auto bg-[radial-gradient(circle_at_top,rgba(201,168,76,0.16),transparent_24%),linear-gradient(180deg,#102032_0%,#0B1520_55%,#09131D_100%)]">
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#C9A84C] border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-[radial-gradient(circle_at_top,rgba(201,168,76,0.16),transparent_24%),linear-gradient(180deg,#102032_0%,#0B1520_55%,#09131D_100%)]">
      <div className="mx-auto max-w-5xl space-y-8 px-6 py-8 md:px-8 md:py-10">
      {/* Toast */}
      {toast && (
        <div
          className={cn(
            "flex items-center gap-3 rounded-lg border p-4",
            toast.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-red-500/10 border-red-500/30 text-red-400"
          )}
        >
          {toast.type === "success" ? (
            <CheckCircle className="h-5 w-5 shrink-0" />
          ) : (
            <XCircle className="h-5 w-5 shrink-0" />
          )}
          <p className="flex-1 text-sm">{toast.message}</p>
          <button onClick={() => setToast(null)} className="text-current opacity-60 hover:opacity-100">
            ×
          </button>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Facturación</h1>
        <p className="text-slate-400 mt-1 text-sm">Gestiona tu plan, uso y facturas</p>
      </div>

      {sub && (
        <>
          {/* Current plan card */}
          <div className="rounded-xl border border-white/10 bg-white/3 p-6">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#C9A84C]/15">
                  <CreditCard className="h-6 w-6 text-[#C9A84C]" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-bold text-white">{sub.planDisplay.name}</h2>
                    <Badge
                      className={cn(
                        "border text-xs",
                        STATUS_STYLES[sub.status] || STATUS_STYLES.ACTIVE
                      )}
                    >
                      {STATUS_LABELS[sub.status] || sub.status}
                    </Badge>
                    {sub.billingCycle && (
                      <Badge className="border border-white/10 bg-white/5 text-slate-400 text-xs">
                        {sub.billingCycle === "MONTHLY" ? "Mensual" : "Anual"}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-400 mt-0.5">
                    {sub.cancelAtPeriodEnd ? (
                      <span className="text-amber-400">
                        Se cancela el {new Date(sub.currentPeriodEnd).toLocaleDateString("es-MX")}
                      </span>
                    ) : (
                      <>
                        Se renueva el {new Date(sub.currentPeriodEnd).toLocaleDateString("es-MX")}
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                {sub.stripeSubId ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/20 text-white hover:bg-white/5 gap-1.5"
                    onClick={handlePortal}
                    disabled={portalLoading}
                  >
                    <ExternalLink className="h-4 w-4" />
                    {portalLoading ? "Abriendo..." : "Portal de pagos"}
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  className="bg-[#C9A84C] hover:bg-[#b8943c] text-[#0C1B2A] font-semibold gap-1.5"
                  onClick={() => setShowPlans(!showPlans)}
                >
                  <Zap className="h-4 w-4" />
                  {showPlans ? "Ocultar planes" : "Actualizar plan"}
                </Button>
              </div>
            </div>

            {/* Usage gauges */}
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <UsageGauge
                label="Consultas IA"
                used={sub.usage.queriesUsed}
                limit={sub.usage.queriesLimit}
              />
              <UsageGauge
                label="Documentos"
                used={sub.usage.documentsUsed}
                limit={sub.usage.documentsLimit}
              />
              <UsageGauge
                label="Asientos"
                used={sub.usage.seatsUsed}
                limit={sub.usage.seatsLimit}
              />
            </div>
          </div>

          {/* Plan selector */}
          {showPlans && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Elige tu plan</h2>
                <div className="flex rounded-lg border border-white/10 p-0.5">
                  {(["MONTHLY", "ANNUAL"] as const).map((cycle) => (
                    <button
                      key={cycle}
                      onClick={() => setBillingCycle(cycle)}
                      className={cn(
                        "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                        billingCycle === cycle
                          ? "bg-[#C9A84C] text-[#0C1B2A]"
                          : "text-slate-400 hover:text-white"
                      )}
                    >
                      {cycle === "MONTHLY" ? "Mensual" : "Anual"}
                      {cycle === "ANNUAL" && (
                        <span className="ml-1.5 text-xs opacity-80">−17%</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {(["FREE", "PRO", "EMPRESA"] as const).map((plan) => (
                  <PlanCard
                    key={plan}
                    plan={plan}
                    name={plan === "FREE" ? "Gratis" : plan === "PRO" ? "Pro" : "Empresa"}
                    features={PLAN_FEATURES[plan] || []}
                    billingCycle={billingCycle}
                    isCurrent={
                      sub.plan === plan ||
                      (plan === "PRO" && ["PYME", "BASICO", "PROFESIONAL"].includes(sub.plan))
                    }
                    onSelect={handleCheckout}
                    loading={checkoutLoading}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Invoices */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-slate-400" />
                Historial de facturas
              </h2>
            </div>

            {invoices.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-white/3 p-8 text-center">
                <FileText className="h-8 w-8 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">Sin facturas todavía</p>
              </div>
            ) : (
              <div className="rounded-xl border border-white/10 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/3">
                      <th className="px-4 py-3 text-left text-slate-400 font-medium">Fecha</th>
                      <th className="px-4 py-3 text-left text-slate-400 font-medium">Monto</th>
                      <th className="px-4 py-3 text-left text-slate-400 font-medium">Estado</th>
                      <th className="px-4 py-3 text-right text-slate-400 font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-white/3 transition-colors">
                        <td className="px-4 py-3 text-white">
                          {new Date(inv.date).toLocaleDateString("es-MX", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </td>
                        <td className="px-4 py-3 text-white font-medium">
                          ${inv.amount.toLocaleString()} {inv.currency}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            className={cn(
                              "border text-xs",
                              inv.status === "paid"
                                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                : inv.status === "open"
                                ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                                : "bg-slate-500/15 text-slate-400 border-slate-500/30"
                            )}
                          >
                            {inv.status === "paid"
                              ? "Pagado"
                              : inv.status === "open"
                              ? "Pendiente"
                              : inv.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {inv.pdfUrl && (
                              <a
                                href={inv.pdfUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-slate-400 hover:text-white transition-colors"
                              >
                                <Download className="h-4 w-4" />
                              </a>
                            )}
                            {inv.hostedUrl && (
                              <a
                                href={inv.hostedUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-slate-400 hover:text-white transition-colors"
                              >
                                <ChevronRight className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
      </div>
    </div>
  );
}
