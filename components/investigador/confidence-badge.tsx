import { cn } from "@/lib/utils";

type Confidence = "ALTA" | "MEDIA" | "BAJA";

const CONFIG: Record<Confidence, { label: string; className: string }> = {
  ALTA: {
    label: "Confianza Alta",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  MEDIA: {
    label: "Confianza Media",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  BAJA: {
    label: "Confianza Baja",
    className: "bg-red-50 text-red-700 border-red-200",
  },
};

export function ConfidenceBadge({
  confidence,
  className,
}: {
  confidence: Confidence;
  className?: string;
}) {
  const { label, className: colorClass } = CONFIG[confidence] ?? CONFIG["MEDIA"];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        colorClass,
        className
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          confidence === "ALTA"
            ? "bg-emerald-500"
            : confidence === "MEDIA"
            ? "bg-amber-500"
            : "bg-red-500"
        )}
      />
      {label}
    </span>
  );
}
