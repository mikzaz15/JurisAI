"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PlanCardProps {
  plan: "FREE" | "PRO" | "EMPRESA";
  name: string;
  features: string[];
  billingCycle: "MONTHLY" | "ANNUAL";
  isCurrent: boolean;
  onSelect: (plan: "PRO", cycle: "MONTHLY" | "ANNUAL") => void;
  loading?: boolean;
}

const PLAN_MXN: Record<string, { monthly: number; annual: number }> = {
  FREE: { monthly: 0, annual: 0 },
  PRO: { monthly: 899, annual: 8990 },
  EMPRESA: { monthly: 0, annual: 0 },
};

export function PlanCard({
  plan,
  name,
  features,
  billingCycle,
  isCurrent,
  onSelect,
  loading,
}: PlanCardProps) {
  const prices = PLAN_MXN[plan];
  const monthly = billingCycle === "ANNUAL" ? Math.round(prices.annual / 12) : prices.monthly;
  const isFree = plan === "FREE";
  const isEnterprise = plan === "EMPRESA";

  return (
    <div
      className={cn(
        "relative rounded-xl border p-6 flex flex-col gap-4 transition-all",
        plan === "PRO"
          ? "border-[#C9A84C] bg-[#C9A84C]/5"
          : "border-white/10 bg-white/3",
        isCurrent && "ring-2 ring-[#C9A84C]"
      )}
    >
      {plan === "PRO" && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="rounded-full bg-[#C9A84C] px-3 py-1 text-xs font-semibold text-[#0C1B2A]">
            Popular
          </span>
        </div>
      )}

      <div>
        <h3 className="text-lg font-semibold text-white">{name}</h3>
        {!isFree && !isEnterprise ? (
          <div className="mt-2">
            <span className="text-3xl font-bold text-white">
              ${monthly.toLocaleString()}
            </span>
            <span className="text-slate-400 text-sm ml-1">MXN/mes</span>
            {billingCycle === "ANNUAL" && (
              <div className="text-xs text-[#C9A84C] mt-0.5">
                ${prices.annual.toLocaleString()} MXN/año
              </div>
            )}
          </div>
        ) : isFree ? (
          <div className="mt-2">
            <span className="text-3xl font-bold text-white">$0</span>
            <span className="text-slate-400 text-sm ml-1">MXN/mes</span>
          </div>
        ) : (
          <div className="mt-2 text-slate-400 text-sm">Precio a negociar</div>
        )}
      </div>

      <ul className="space-y-2 flex-1">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
            <Check className="h-4 w-4 text-[#C9A84C] shrink-0 mt-0.5" />
            {f}
          </li>
        ))}
      </ul>

      {isCurrent ? (
        <Button variant="outline" disabled className="w-full border-white/20 text-white/50">
          Plan actual
        </Button>
      ) : isEnterprise ? (
        <Button
          variant="outline"
          className="w-full border-white/20 text-white hover:bg-white/5"
          onClick={() => window.open("mailto:ventas@jurisai.com.mx", "_blank")}
        >
          Contactar ventas
        </Button>
      ) : isFree ? (
        <Button variant="outline" disabled className="w-full border-white/20 text-white/50">
          Plan actual
        </Button>
      ) : (
        <Button
          className="w-full bg-[#C9A84C] hover:bg-[#b8943c] text-[#0C1B2A] font-semibold"
          onClick={() => onSelect("PRO", billingCycle)}
          disabled={loading}
        >
          {loading ? "Procesando..." : "Seleccionar plan"}
        </Button>
      )}
    </div>
  );
}
