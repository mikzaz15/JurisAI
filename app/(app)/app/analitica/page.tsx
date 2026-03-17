"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Search,
  FileText,
  Briefcase,
  Users,
  Download,
  BarChart3,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Period = "7d" | "30d" | "90d";

interface UsageData {
  subscription: {
    queriesUsed: number;
    queriesLimit: number;
    documentsUsed: number;
    documentsLimit: number;
    seatsUsed: number;
    seatsLimit: number;
    plan: string;
  } | null;
  activeMatters: number;
  teamMembers: number;
}

interface ConsultasData {
  dailyVolume: Array<{ date: string; queries: number }>;
  byAreaOfLaw: Array<{ area: string; count: number }>;
  docsByType: Array<{ type: string; count: number }>;
  sessionsWithoutMatter: number;
}

interface EquipoData {
  members: Array<{
    memberId: string;
    userId: string;
    user: { name: string; email: string; image: string | null };
    role: string;
    queriesLast30d: number;
    documentsLast30d: number;
    lastActive: string | null;
  }>;
}

const AREA_LABELS: Record<string, string> = {
  CIVIL: "Civil",
  PENAL: "Penal",
  MERCANTIL: "Mercantil",
  LABORAL: "Laboral",
  FISCAL: "Fiscal",
  ADMINISTRATIVO: "Administrativo",
  CONSTITUCIONAL: "Constitucional",
  FAMILIAR: "Familiar",
  CORPORATIVO: "Corporativo",
  INMOBILIARIO: "Inmobiliario",
  OTHER: "Otro",
};

const DOC_LABELS: Record<string, string> = {
  CONTRACT: "Contrato",
  MOTION: "Escrito",
  LEGAL_OPINION: "Opinión",
  MEMO: "Memo",
  NDA: "NDA",
  CORPORATE_DEED: "Acta",
  POWER_OF_ATTORNEY: "Poder",
  COMPLAINT: "Demanda",
  AMPARO_PETITION: "Amparo",
  EMPLOYMENT: "Laboral",
  LEASE: "Arrendamiento",
  GENERAL: "General",
  REGULATORY_FILING: "Trámite",
};

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Propietario",
  ADMIN: "Administrador",
  LAWYER: "Abogado",
  PARALEGAL: "Paralegal",
  VIEWER: "Observador",
};

const CHART_COLORS = ["#C9A84C", "#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4"];

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = "gold",
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color?: "gold" | "blue" | "emerald" | "purple";
}) {
  const colorMap = {
    gold: "bg-[#C9A84C]/15 text-[#C9A84C]",
    blue: "bg-blue-500/15 text-blue-400",
    emerald: "bg-emerald-500/15 text-emerald-400",
    purple: "bg-purple-500/15 text-purple-400",
  };
  return (
    <div className="rounded-xl border border-white/10 bg-white/3 p-5 flex items-start gap-4">
      <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", colorMap[color])}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-slate-400 text-sm">{label}</p>
        <p className="text-2xl font-bold text-white mt-0.5">{value}</p>
        {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function AnaliticaPage() {
  const [period, setPeriod] = useState<Period>("30d");
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [consultasData, setConsultasData] = useState<ConsultasData | null>(null);
  const [equipoData, setEquipoData] = useState<EquipoData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/analitica/uso").then((r) => r.json()),
      fetch(`/api/analitica/consultas?period=${period}`).then((r) => r.json()),
      fetch("/api/analitica/equipo").then((r) => r.json()),
    ]).then(([uso, consultas, equipo]) => {
      if (uso.success) setUsageData(uso.data);
      if (consultas.success) setConsultasData(consultas.data);
      if (equipo.success) setEquipoData(equipo.data);
      setLoading(false);
    });
  }, [period]);

  function exportCsv() {
    if (!equipoData) return;
    const rows = [
      ["Miembro", "Rol", "Consultas (30d)", "Documentos (30d)", "Última actividad"],
      ...equipoData.members.map((m) => [
        m.user.name,
        ROLE_LABELS[m.role] || m.role,
        m.queriesLast30d.toString(),
        m.documentsLast30d.toString(),
        m.lastActive ? new Date(m.lastActive).toLocaleDateString("es-MX") : "—",
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `jurisai-equipo-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const PERIOD_LABELS: Record<Period, string> = {
    "7d": "Últimos 7 días",
    "30d": "Últimos 30 días",
    "90d": "Últimos 90 días",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#C9A84C] border-t-transparent" />
      </div>
    );
  }

  const sub = usageData?.subscription;
  const totalQueries = sub?.queriesUsed ?? 0;
  const totalDocs = sub?.documentsUsed ?? 0;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Analítica</h1>
          <p className="text-slate-400 mt-1 text-sm">Uso y actividad de tu organización</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-white/10 p-0.5">
            {(["7d", "30d", "90d"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                  period === p
                    ? "bg-[#C9A84C] text-[#0C1B2A]"
                    : "text-slate-400 hover:text-white"
                )}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={exportCsv}
            className="border-white/10 text-white hover:bg-white/5 gap-1.5"
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Overview cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Search}
          label="Consultas IA"
          value={totalQueries.toLocaleString()}
          sub={sub ? `de ${sub.queriesLimit.toLocaleString()} del plan` : undefined}
          color="gold"
        />
        <StatCard
          icon={FileText}
          label="Documentos"
          value={totalDocs.toLocaleString()}
          sub={sub ? `de ${sub.documentsLimit.toLocaleString()} del plan` : undefined}
          color="blue"
        />
        <StatCard
          icon={Briefcase}
          label="Asuntos activos"
          value={usageData?.activeMatters ?? 0}
          color="emerald"
        />
        <StatCard
          icon={Users}
          label="Miembros del equipo"
          value={usageData?.teamMembers ?? 0}
          sub={sub ? `de ${sub.seatsLimit} asientos` : undefined}
          color="purple"
        />
      </div>

      {/* Usage gauges */}
      {sub && (
        <div className="rounded-xl border border-white/10 bg-white/3 p-6">
          <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Zap className="h-4 w-4 text-[#C9A84C]" />
            Uso del plan
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "Consultas IA", used: sub.queriesUsed, limit: sub.queriesLimit },
              { label: "Documentos", used: sub.documentsUsed, limit: sub.documentsLimit },
              { label: "Asientos", used: sub.seatsUsed, limit: sub.seatsLimit },
            ].map(({ label, used, limit }) => {
              const pct = limit >= 9999999 ? 0 : Math.min((used / limit) * 100, 100);
              return (
                <div key={label} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">{label}</span>
                    <span className="font-medium text-white">
                      {limit >= 9999999 ? "∞" : `${used.toLocaleString()}/${limit.toLocaleString()}`}
                    </span>
                  </div>
                  {limit < 9999999 && (
                    <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber-500" : "bg-[#C9A84C]"
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Query volume line chart */}
        <div className="rounded-xl border border-white/10 bg-white/3 p-6">
          <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[#C9A84C]" />
            Volumen de consultas
          </h2>
          {consultasData?.dailyVolume && consultasData.dailyVolume.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={consultasData.dailyVolume}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  tickFormatter={(v) =>
                    new Date(v).toLocaleDateString("es-MX", { month: "short", day: "numeric" })
                  }
                />
                <YAxis tick={{ fill: "#64748b", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: "#0C1B2A",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                  labelFormatter={(v) =>
                    new Date(v).toLocaleDateString("es-MX", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })
                  }
                />
                <Line
                  type="monotone"
                  dataKey="queries"
                  stroke="#C9A84C"
                  strokeWidth={2}
                  dot={false}
                  name="Consultas"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-slate-500 text-sm">
              Sin datos para este período
            </div>
          )}
        </div>

        {/* Area of law bar chart */}
        <div className="rounded-xl border border-white/10 bg-white/3 p-6">
          <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-[#C9A84C]" />
            Consultas por área del derecho
          </h2>
          {consultasData?.byAreaOfLaw && consultasData.byAreaOfLaw.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={consultasData.byAreaOfLaw.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="area"
                  tick={{ fill: "#64748b", fontSize: 10 }}
                  tickFormatter={(v) => AREA_LABELS[v] || v}
                />
                <YAxis tick={{ fill: "#64748b", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: "#0C1B2A",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                  formatter={(v) => [v, "Consultas"]}
                  labelFormatter={(v) => AREA_LABELS[v] || v}
                />
                <Bar dataKey="count" fill="#C9A84C" radius={[4, 4, 0, 0]} name="Consultas" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-slate-500 text-sm">
              Sin datos para este período
            </div>
          )}
        </div>
      </div>

      {/* Document types donut */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/3 p-6">
          <h2 className="text-base font-semibold text-white mb-4">Tipos de documentos</h2>
          {consultasData?.docsByType && consultasData.docsByType.length > 0 ? (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie
                    data={consultasData.docsByType.slice(0, 7)}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    dataKey="count"
                    stroke="none"
                  >
                    {consultasData.docsByType.slice(0, 7).map((_, idx) => (
                      <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#0C1B2A",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                    formatter={(v, _n, props) => [v, DOC_LABELS[props.payload.type] || props.payload.type]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <ul className="space-y-2 flex-1">
                {consultasData.docsByType.slice(0, 7).map((d, idx) => (
                  <li key={d.type} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                      />
                      <span className="text-slate-300">{DOC_LABELS[d.type] || d.type}</span>
                    </span>
                    <span className="font-medium text-white">{d.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="h-[160px] flex items-center justify-center text-slate-500 text-sm">
              Sin documentos en este período
            </div>
          )}
        </div>

        {/* Team activity table */}
        <div className="rounded-xl border border-white/10 bg-white/3 p-6">
          <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-[#C9A84C]" />
            Actividad del equipo
          </h2>
          {equipoData?.members && equipoData.members.length > 0 ? (
            <div className="space-y-2">
              {equipoData.members.map((m) => (
                <div
                  key={m.memberId}
                  className="flex items-center gap-3 rounded-lg hover:bg-white/3 px-2 py-1.5 transition-colors"
                >
                  <div className="h-7 w-7 rounded-full bg-[#C9A84C]/20 flex items-center justify-center text-[#C9A84C] text-xs font-bold shrink-0">
                    {m.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white truncate">{m.user.name}</div>
                    <div className="text-xs text-slate-500">{ROLE_LABELS[m.role] || m.role}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-medium text-white">{m.queriesLast30d}</div>
                    <div className="text-xs text-slate-500">consultas</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-medium text-white">{m.documentsLast30d}</div>
                    <div className="text-xs text-slate-500">docs</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-slate-500 text-sm">
              Sin datos
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
