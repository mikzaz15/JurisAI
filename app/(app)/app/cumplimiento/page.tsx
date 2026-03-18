"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  ShieldCheck,
  Calendar,
  Filter,
  ExternalLink,
  Loader2,
  AlertTriangle,
  ChevronRight,
  Clock,
  X,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImpactBadge } from "@/components/cumplimiento/impact-badge";
import { cn } from "@/lib/utils";

interface RegulatoryAlert {
  id: string;
  title: string;
  summary: string;
  sourceUrl: string | null;
  authority: string;
  areaOfLaw: string;
  jurisdiction: string;
  impactLevel: string;
  dofDate: string | null;
  dofReference: string | null;
  publishedAt: string;
}

interface AlertsData {
  alerts: RegulatoryAlert[];
  total: number;
  page: number;
  pages: number;
  filters: { authorities: string[] };
}

interface Deadline {
  id: string;
  title: string;
  date: string;
  authority: string;
  areaOfLaw: string;
  description: string;
  recurrence: string;
  dofReference?: string;
}

interface ImpactResult {
  alert: RegulatoryAlert;
  impactedMatters: Array<{
    matter: { id: string; title: string; clientName?: string; areaOfLaw: string };
    impactSummary: string;
  }>;
  totalAffected: number;
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
  PROPIEDAD_INTELECTUAL: "Prop. Intelectual",
  COMERCIO_EXTERIOR: "Comercio Exterior",
  MIGRATORIO: "Migratorio",
  NOTARIAL: "Notarial",
  AMBIENTAL: "Ambiental",
  AGRARIO: "Agrario",
  OTHER: "Otro",
};

const AUTHORITY_COLORS: Record<string, string> = {
  SAT: "bg-red-500/15 text-red-400 border-red-500/30",
  IMSS: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  COFEPRIS: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  CNBV: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  STPS: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  SE: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  DOF: "bg-slate-500/15 text-slate-400 border-slate-500/30",
  INFONAVIT: "bg-orange-500/15 text-orange-400 border-orange-500/30",
};

function AuthorityBadge({ authority }: { authority: string }) {
  const style = AUTHORITY_COLORS[authority] || "bg-white/5 text-slate-400 border-white/10";
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold", style)}>
      {authority}
    </span>
  );
}

function AlertDetailPanel({
  alert,
  onClose,
}: {
  alert: RegulatoryAlert;
  onClose: () => void;
}) {
  const [impact, setImpact] = useState<ImpactResult | null>(null);
  const [loadingImpact, setLoadingImpact] = useState(false);

  async function analyzeImpact() {
    setLoadingImpact(true);
    try {
      const res = await fetch(`/api/cumplimiento/alertas/${alert.id}/impacto`, {
        method: "POST",
      });
      const d = await res.json();
      if (d.success) setImpact(d.data);
    } catch {
      // ignore
    } finally {
      setLoadingImpact(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-lg bg-[#0C1B2A] border-l border-white/10 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-white/10 gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <AuthorityBadge authority={alert.authority} />
              <ImpactBadge level={alert.impactLevel} />
            </div>
            <h2 className="text-lg font-bold text-white leading-snug">{alert.title}</h2>
            <p className="text-xs text-slate-500 mt-1">
              {new Date(alert.publishedAt).toLocaleDateString("es-MX", {
                year: "numeric", month: "long", day: "numeric"
              })}
              {alert.jurisdiction && ` · ${alert.jurisdiction}`}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white shrink-0">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Summary */}
          <div>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Resumen</h3>
            <p className="text-slate-300 text-sm leading-relaxed">{alert.summary}</p>
          </div>

          {/* DOF reference */}
          {(alert.dofDate || alert.dofReference) && (
            <div>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Referencia DOF
              </h3>
              <div className="rounded-lg bg-white/3 border border-white/10 p-3 text-sm text-slate-300 space-y-1">
                {alert.dofDate && (
                  <div>Fecha: {new Date(alert.dofDate).toLocaleDateString("es-MX")}</div>
                )}
                {alert.dofReference && <div>Referencia: {alert.dofReference}</div>}
              </div>
            </div>
          )}

          {/* Area */}
          <div>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Área del derecho</h3>
            <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-sm text-slate-300">
              {AREA_LABELS[alert.areaOfLaw] || alert.areaOfLaw}
            </span>
          </div>

          {/* Source link */}
          {alert.sourceUrl && (
            <a
              href={alert.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-[#C9A84C] hover:text-[#b8943c] transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              Ver fuente original
            </a>
          )}

          {/* Impact analysis */}
          <div>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Análisis de impacto
            </h3>
            {!impact ? (
              <Button
                onClick={analyzeImpact}
                disabled={loadingImpact}
                className="w-full bg-[#C9A84C] hover:bg-[#b8943c] text-[#0C1B2A] font-semibold gap-2"
              >
                {loadingImpact ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analizando...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4" />
                    Analizar impacto en mis asuntos
                  </>
                )}
              </Button>
            ) : impact.totalAffected === 0 ? (
              <p className="text-sm text-slate-400 bg-white/3 border border-white/10 rounded-lg p-3">
                Ningún asunto activo parece verse afectado por esta alerta.
              </p>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-amber-400">
                  {impact.totalAffected} asunto{impact.totalAffected !== 1 ? "s" : ""} podría{impact.totalAffected !== 1 ? "n" : ""} verse afectado{impact.totalAffected !== 1 ? "s" : ""}
                </p>
                {impact.impactedMatters.map(({ matter, impactSummary }) => (
                  <div key={matter.id} className="rounded-lg border border-white/10 bg-white/3 p-4">
                    <div className="font-medium text-white text-sm">{matter.title}</div>
                    {matter.clientName && (
                      <div className="text-xs text-slate-500 mt-0.5">{matter.clientName}</div>
                    )}
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">{impactSummary}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DeadlineDetailPanel({
  deadline,
  onClose,
}: {
  deadline: Deadline;
  onClose: () => void;
}) {
  const dueDate = new Date(deadline.date);

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="flex w-full max-w-lg flex-col overflow-hidden border-l border-white/10 bg-[#0C1B2A]">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 p-6">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center gap-2 flex-wrap">
              <AuthorityBadge authority={deadline.authority} />
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs font-semibold text-slate-300">
                {AREA_LABELS[deadline.areaOfLaw] || deadline.areaOfLaw}
              </span>
            </div>
            <h2 className="text-lg font-bold leading-snug text-white">{deadline.title}</h2>
            <p className="mt-1 text-xs text-slate-500">
              {dueDate.toLocaleDateString("es-MX", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <button onClick={onClose} className="shrink-0 text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          <div>
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-400">
              Descripción
            </h3>
            <p className="text-sm leading-relaxed text-slate-300">{deadline.description}</p>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-400">
              Recurrencia
            </h3>
            <div className="rounded-lg border border-white/10 bg-white/3 p-3 text-sm text-slate-300">
              {deadline.recurrence === "monthly"
                ? "Mensual"
                : deadline.recurrence === "annual"
                ? "Anual"
                : deadline.recurrence === "quarterly"
                ? "Trimestral"
                : "Única vez"}
            </div>
          </div>

          {deadline.dofReference ? (
            <div>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-400">
                Referencia legal
              </h3>
              <div className="rounded-lg border border-white/10 bg-white/3 p-3 text-sm text-slate-300">
                {deadline.dofReference}
              </div>
            </div>
          ) : null}

          <div className="rounded-xl border border-white/10 bg-white/3 p-4">
            <div className="flex items-start gap-3">
              <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-[#C9A84C]" />
              <div>
                <p className="text-sm font-medium text-white">Acción recomendada</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-400">
                  Revisa este vencimiento con anticipación y confirma si tu organización o tus
                  asuntos activos tienen obligaciones relacionadas con {deadline.authority}.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CalendarView({
  deadlines,
  onSelectDeadline,
}: {
  deadlines: Deadline[];
  onSelectDeadline: (deadline: Deadline) => void;
}) {
  const now = new Date();

  function getDaysLeft(dateStr: string): number {
    const diff = new Date(dateStr).getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  if (deadlines.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-slate-500 text-sm">
        Sin vencimientos en los próximos 90 días
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {deadlines.map((d) => {
        const daysLeft = getDaysLeft(d.date);
        const isUrgent = daysLeft <= 7;
        const isPast = daysLeft < 0;

        return (
          <button
            type="button"
            key={d.id}
            onClick={() => onSelectDeadline(d)}
            className={cn(
              "flex w-full items-start gap-4 rounded-xl border p-4 text-left transition-colors hover:bg-white/5",
              isPast
                ? "border-red-500/20 bg-red-500/5"
                : isUrgent
                ? "border-amber-500/20 bg-amber-500/5"
                : "border-white/10 bg-white/3"
            )}
          >
            <div
              className={cn(
                "flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg text-center",
                isPast ? "bg-red-500/15" : isUrgent ? "bg-amber-500/15" : "bg-white/5"
              )}
            >
              <span className={cn(
                "text-xs font-medium",
                isPast ? "text-red-400" : isUrgent ? "text-amber-400" : "text-slate-400"
              )}>
                {new Date(d.date).toLocaleDateString("es-MX", { month: "short" }).toUpperCase()}
              </span>
              <span className={cn(
                "text-lg font-bold leading-none",
                isPast ? "text-red-400" : isUrgent ? "text-amber-400" : "text-white"
              )}>
                {new Date(d.date).getDate()}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <h3 className="font-medium text-white text-sm">{d.title}</h3>
                <div className="flex items-center gap-2 shrink-0">
                  <AuthorityBadge authority={d.authority} />
                  {isPast ? (
                    <span className="text-xs text-red-400 font-medium">Vencido</span>
                  ) : daysLeft === 0 ? (
                    <span className="text-xs text-amber-400 font-medium">Hoy</span>
                  ) : (
                    <span className={cn(
                      "text-xs font-medium",
                      isUrgent ? "text-amber-400" : "text-slate-400"
                    )}>
                      {daysLeft} días
                    </span>
                  )}
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">{d.description}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {d.recurrence === "monthly"
                    ? "Mensual"
                    : d.recurrence === "annual"
                    ? "Anual"
                    : d.recurrence === "quarterly"
                    ? "Trimestral"
                    : "Única vez"}
                </span>
                {d.dofReference && (
                  <span className="text-xs text-slate-500">{d.dofReference}</span>
                )}
              </div>
            </div>
            <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-600" />
          </button>
        );
      })}
    </div>
  );
}

export default function CumplimientoPage() {
  const [tab, setTab] = useState<"alertas" | "calendario">("alertas");
  const [alertsData, setAlertsData] = useState<AlertsData | null>(null);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<RegulatoryAlert | null>(null);
  const [selectedDeadline, setSelectedDeadline] = useState<Deadline | null>(null);

  // Filters
  const [authority, setAuthority] = useState("");
  const [areaOfLaw, setAreaOfLaw] = useState("");
  const [impactLevel, setImpactLevel] = useState("");
  const [page, setPage] = useState(1);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: page.toString() });
    if (authority) params.set("authority", authority);
    if (areaOfLaw) params.set("areaOfLaw", areaOfLaw);
    if (impactLevel) params.set("impactLevel", impactLevel);

    const res = await fetch(`/api/cumplimiento/alertas?${params}`);
    const d = await res.json();
    if (d.success) setAlertsData(d.data);
    setLoading(false);
  }, [authority, areaOfLaw, impactLevel, page]);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  useEffect(() => {
    fetch("/api/cumplimiento/calendario")
      .then((r) => r.json())
      .then((d) => { if (d.success) setDeadlines(d.data.deadlines); });
  }, []);

  const authorities = useMemo(
    () =>
      Array.from(
        new Set([...(alertsData?.filters.authorities || []), ...deadlines.map((d) => d.authority)])
      ).sort((a, b) => a.localeCompare(b, "es")),
    [alertsData?.filters.authorities, deadlines]
  );

  return (
    <div className="h-full overflow-y-auto bg-[#0C1B2A]">
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {selectedAlert && (
        <AlertDetailPanel alert={selectedAlert} onClose={() => setSelectedAlert(null)} />
      )}
      {selectedDeadline && (
        <DeadlineDetailPanel
          deadline={selectedDeadline}
          onClose={() => setSelectedDeadline(null)}
        />
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Cumplimiento</h1>
        <p className="text-slate-400 mt-1 text-sm">Alertas regulatorias y vencimientos</p>
      </div>

      {/* Tabs */}
      <div className="flex rounded-lg border border-white/10 p-0.5 w-fit">
        {(["alertas", "calendario"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
              tab === t
                ? "bg-[#C9A84C] text-[#0C1B2A]"
                : "text-slate-400 hover:text-white"
            )}
          >
            {t === "alertas" ? (
              <><ShieldCheck className="h-4 w-4" />Alertas</>
            ) : (
              <><Calendar className="h-4 w-4" />Calendario</>
            )}
          </button>
        ))}
      </div>

      {tab === "alertas" && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <Filter className="h-4 w-4 text-slate-500 self-center" />
            <select
              value={authority}
              onChange={(e) => { setAuthority(e.target.value); setPage(1); }}
              className="rounded-lg border border-white/10 bg-white/5 text-white text-sm px-3 py-1.5 focus:outline-none focus:border-[#C9A84C]"
            >
              <option value="">Todas las autoridades</option>
              {authorities.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
            <select
              value={areaOfLaw}
              onChange={(e) => { setAreaOfLaw(e.target.value); setPage(1); }}
              className="rounded-lg border border-white/10 bg-white/5 text-white text-sm px-3 py-1.5 focus:outline-none focus:border-[#C9A84C]"
            >
              <option value="">Todas las áreas</option>
              {Object.entries(AREA_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <select
              value={impactLevel}
              onChange={(e) => { setImpactLevel(e.target.value); setPage(1); }}
              className="rounded-lg border border-white/10 bg-white/5 text-white text-sm px-3 py-1.5 focus:outline-none focus:border-[#C9A84C]"
            >
              <option value="">Todos los impactos</option>
              <option value="CRITICAL">Crítico</option>
              <option value="HIGH">Alto</option>
              <option value="MEDIUM">Medio</option>
              <option value="LOW">Bajo</option>
            </select>
            {(authority || areaOfLaw || impactLevel) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setAuthority(""); setAreaOfLaw(""); setImpactLevel(""); setPage(1); }}
                className="text-slate-400 hover:text-white h-8"
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Limpiar
              </Button>
            )}
          </div>

          {/* Alerts list */}
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-6 w-6 animate-spin text-[#C9A84C]" />
            </div>
          ) : !alertsData?.alerts.length ? (
            <div className="rounded-xl border border-white/10 bg-white/3 p-12 text-center">
              <ShieldCheck className="h-10 w-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">Sin alertas regulatorias</p>
              <p className="text-slate-500 text-sm mt-1">
                No hay alertas para los filtros seleccionados
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {alertsData.alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="rounded-xl border border-white/10 bg-white/3 hover:bg-white/5 transition-colors p-5 cursor-pointer"
                  onClick={() => setSelectedAlert(alert)}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <AuthorityBadge authority={alert.authority} />
                        <ImpactBadge level={alert.impactLevel} />
                        <span className="text-xs text-slate-500">
                          {AREA_LABELS[alert.areaOfLaw] || alert.areaOfLaw}
                        </span>
                      </div>
                      <h3 className="font-semibold text-white text-sm leading-snug mb-1">
                        {alert.title}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {alert.summary}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                        <span>
                          {new Date(alert.publishedAt).toLocaleDateString("es-MX", {
                            year: "numeric", month: "short", day: "numeric"
                          })}
                        </span>
                        {alert.jurisdiction && <span>· {alert.jurisdiction}</span>}
                        {alert.dofReference && <span>· DOF: {alert.dofReference}</span>}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-600 shrink-0 mt-1" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {alertsData && alertsData.pages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Mostrando {(page - 1) * 20 + 1}–{Math.min(page * 20, alertsData.total)} de {alertsData.total}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="border-white/10 text-white hover:bg-white/5"
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= alertsData.pages}
                  className="border-white/10 text-white hover:bg-white/5"
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {tab === "calendario" && (
        <CalendarView deadlines={deadlines} onSelectDeadline={setSelectedDeadline} />
      )}
    </div>
    </div>
  );
}
