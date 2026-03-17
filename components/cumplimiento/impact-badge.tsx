import { cn } from "@/lib/utils";

const IMPACT_STYLES: Record<string, string> = {
  CRITICAL: "bg-red-500/15 text-red-400 border-red-500/30",
  HIGH: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  MEDIUM: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  LOW: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
};

const IMPACT_LABELS: Record<string, string> = {
  CRITICAL: "Crítico",
  HIGH: "Alto",
  MEDIUM: "Medio",
  LOW: "Bajo",
};

interface ImpactBadgeProps {
  level: string;
  className?: string;
}

export function ImpactBadge({ level, className }: ImpactBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        IMPACT_STYLES[level] || IMPACT_STYLES.LOW,
        className
      )}
    >
      {IMPACT_LABELS[level] || level}
    </span>
  );
}
