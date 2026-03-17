"use client";

interface UsageGaugeProps {
  label: string;
  used: number;
  limit: number;
  unit?: string;
}

export function UsageGauge({ label, used, limit, unit }: UsageGaugeProps) {
  const isUnlimited = limit >= 9999999;
  const pct = isUnlimited ? 0 : Math.min((used / limit) * 100, 100);

  const barColor =
    pct >= 90
      ? "bg-red-500"
      : pct >= 70
      ? "bg-amber-500"
      : "bg-[#C9A84C]";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-400">{label}</span>
        <span className="font-medium text-white">
          {isUnlimited ? (
            <span className="text-[#C9A84C]">∞</span>
          ) : (
            <>
              {used.toLocaleString()}
              <span className="text-slate-500">/{limit.toLocaleString()}</span>
              {unit && <span className="text-slate-500 ml-1">{unit}</span>}
            </>
          )}
        </span>
      </div>
      {!isUnlimited && (
        <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}
