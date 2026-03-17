"use client";

import { AlertTriangle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface UpgradeBannerProps {
  type: "queries" | "documents" | "seats";
  message?: string;
}

const MESSAGES = {
  queries: "Has alcanzado el límite de consultas IA de tu plan.",
  documents: "Has alcanzado el límite de documentos de tu plan.",
  seats: "Has alcanzado el límite de asientos de tu plan.",
};

export function UpgradeBanner({ type, message }: UpgradeBannerProps) {
  const router = useRouter();
  const text = message || MESSAGES[type];

  return (
    <div className="flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
      <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
      <p className="flex-1 text-sm text-amber-200">{text}</p>
      <Button
        size="sm"
        className="shrink-0 bg-[#C9A84C] hover:bg-[#b8943c] text-[#0C1B2A] font-semibold gap-1.5"
        onClick={() => router.push("/app/configuracion/facturacion")}
      >
        <Zap className="h-3.5 w-3.5" />
        Actualizar
      </Button>
    </div>
  );
}
