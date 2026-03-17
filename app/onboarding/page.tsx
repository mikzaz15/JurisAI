"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Building2,
  Scale,
  Users,
  Search,
  Check,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

// ─── Step definitions ──────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: "Tu organización", icon: Building2 },
  { id: 2, label: "Áreas de práctica", icon: Scale },
  { id: 3, label: "Tu equipo", icon: Users },
  { id: 4, label: "Primera consulta", icon: Search },
];

// ─── Practice areas ────────────────────────────────────────────────────────────

const PRACTICE_AREAS = [
  { key: "CIVIL", label: "Derecho Civil", desc: "Contratos, obligaciones, responsabilidad civil" },
  { key: "MERCANTIL", label: "Mercantil", desc: "Sociedades, comercio, contratos comerciales" },
  { key: "LABORAL", label: "Laboral", desc: "Contratos, despidos, IMSS, INFONAVIT" },
  { key: "FISCAL", label: "Fiscal / Tributario", desc: "SAT, ISR, IVA, CFF" },
  { key: "CORPORATIVO", label: "Corporativo", desc: "M&A, actas, poderes, gobierno corporativo" },
  { key: "CONSTITUCIONAL", label: "Amparo / Constitucional", desc: "Amparo directo, indirecto, derechos fundamentales" },
  { key: "INMOBILIARIO", label: "Inmobiliario / Notarial", desc: "Compraventas, arrendamientos, notaría" },
  { key: "PENAL", label: "Penal", desc: "Defensa, víctimas, CNPP" },
  { key: "ADMINISTRATIVO", label: "Administrativo", desc: "Contratos públicos, regulación, CFDI" },
  { key: "FAMILIAR", label: "Familiar", desc: "Divorcio, custodia, alimentos" },
  { key: "AMBIENTAL", label: "Ambiental", desc: "NOM, SEMARNAT, responsabilidad ambiental" },
  { key: "MIGRATORIO", label: "Migratorio", desc: "Visas, residencia, naturalización" },
];

// ─── Suggested first queries ───────────────────────────────────────────────────

const SUGGESTED_QUERIES = [
  "¿Cuáles son los requisitos para interponer un amparo indirecto?",
  "¿Cuál es el plazo de prescripción para una acción civil por daño moral?",
  "¿Qué elementos debe contener un contrato de arrendamiento válido?",
  "¿Cuáles son las causas de rescisión en un contrato laboral?",
  "¿Cómo se constituye una Sociedad por Acciones Simplificada (SAS)?",
  "¿Cuáles son las obligaciones fiscales de una persona moral en México?",
];

// ─── Step components ───────────────────────────────────────────────────────────

function StepOrgDetails({
  data,
  onChange,
}: {
  data: { name: string; type: string; rfc: string };
  onChange: (d: Partial<typeof data>) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-white">Cuéntanos sobre tu organización</h2>
        <p className="text-slate-400 mt-1 text-sm">
          Usamos esta información para personalizar tu experiencia en JurisAI.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-slate-300">Nombre de la organización</Label>
          <Input
            value={data.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="Pérez & Asociados, S.C."
            className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-[#C9A84C]"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-slate-300">Tipo de organización</Label>
          <Select value={data.type} onValueChange={(v) => onChange({ type: v })}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white focus:border-[#C9A84C]">
              <SelectValue placeholder="Selecciona..." />
            </SelectTrigger>
            <SelectContent className="bg-[#0C1B2A] border-white/10">
              {[
                { v: "LAW_FIRM", l: "Despacho de abogados" },
                { v: "CORPORATE", l: "Empresa / Legal corporativo" },
                { v: "NOTARIA", l: "Notaría" },
                { v: "SME", l: "PyME" },
                { v: "INDIVIDUAL", l: "Abogado independiente" },
              ].map((o) => (
                <SelectItem key={o.v} value={o.v} className="text-white focus:bg-white/10">
                  {o.l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-slate-300">
            RFC <span className="text-slate-500 font-normal">(opcional)</span>
          </Label>
          <Input
            value={data.rfc}
            onChange={(e) => onChange({ rfc: e.target.value.toUpperCase() })}
            placeholder="XAXX010101000"
            maxLength={13}
            className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-[#C9A84C] font-mono uppercase"
          />
          <p className="text-xs text-slate-500">Se usa para generar documentos con el RFC correcto</p>
        </div>
      </div>
    </div>
  );
}

function StepPracticeAreas({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (areas: string[]) => void;
}) {
  function toggle(key: string) {
    onChange(
      selected.includes(key) ? selected.filter((k) => k !== key) : [...selected, key]
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-white">¿En qué áreas practicas?</h2>
        <p className="text-slate-400 mt-1 text-sm">
          Selecciona todas las que apliquen. Esto personaliza tus alertas de cumplimiento y sugerencias de consulta.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto pr-1">
        {PRACTICE_AREAS.map((area) => {
          const isSelected = selected.includes(area.key);
          return (
            <button
              key={area.key}
              onClick={() => toggle(area.key)}
              className={cn(
                "flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all",
                isSelected
                  ? "border-[#C9A84C] bg-[#C9A84C]/10"
                  : "border-white/10 bg-white/3 hover:border-white/20 hover:bg-white/5"
              )}
            >
              <div
                className={cn(
                  "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                  isSelected
                    ? "bg-[#C9A84C] border-[#C9A84C]"
                    : "border-white/30"
                )}
              >
                {isSelected && <Check className="h-3 w-3 text-[#0C1B2A]" />}
              </div>
              <div>
                <div className="text-sm font-medium text-white">{area.label}</div>
                <div className="text-xs text-slate-500 mt-0.5">{area.desc}</div>
              </div>
            </button>
          );
        })}
      </div>

      {selected.length > 0 && (
        <p className="text-xs text-[#C9A84C]">
          {selected.length} área{selected.length !== 1 ? "s" : ""} seleccionada{selected.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}

function StepInviteTeam({
  invites,
  onChange,
}: {
  invites: string[];
  onChange: (emails: string[]) => void;
}) {
  const [input, setInput] = useState("");

  function addEmail() {
    const email = input.trim().toLowerCase();
    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && !invites.includes(email)) {
      onChange([...invites, email]);
      setInput("");
    }
  }

  function remove(email: string) {
    onChange(invites.filter((e) => e !== email));
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-white">Invita a tu equipo</h2>
        <p className="text-slate-400 mt-1 text-sm">
          Puedes invitar colaboradores ahora o hacerlo más tarde desde Configuración → Equipo.
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="colaborador@despacho.com.mx"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addEmail()}
            className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-[#C9A84C]"
          />
          <Button
            type="button"
            onClick={addEmail}
            disabled={!input.trim()}
            className="bg-[#C9A84C] hover:bg-[#b8943c] text-[#0C1B2A] font-semibold px-4"
          >
            Agregar
          </Button>
        </div>

        {invites.length > 0 && (
          <div className="space-y-2">
            {invites.map((email) => (
              <div
                key={email}
                className="flex items-center justify-between rounded-lg bg-white/5 border border-white/10 px-3 py-2"
              >
                <span className="text-sm text-white">{email}</span>
                <button
                  onClick={() => remove(email)}
                  className="text-slate-500 hover:text-red-400 transition-colors text-lg leading-none"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {invites.length === 0 && (
          <div className="rounded-xl border border-dashed border-white/10 p-8 text-center">
            <Users className="h-8 w-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-500">
              Puedes invitar a tu equipo más tarde
            </p>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-500">
        Recibirán un correo con un enlace para unirse a tu organización. Sus cuentas tendrán rol de <strong className="text-slate-400">Abogado</strong> por defecto.
      </p>
    </div>
  );
}

function StepFirstQuery({
  query,
  onChange,
}: {
  query: string;
  onChange: (q: string) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-white">Haz tu primera consulta</h2>
        <p className="text-slate-400 mt-1 text-sm">
          JurisAI buscará en códigos, leyes y jurisprudencia mexicana para darte una respuesta verificada con citas.
        </p>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
          <textarea
            value={query}
            onChange={(e) => onChange(e.target.value)}
            placeholder="¿Cuáles son los requisitos para interponer un amparo indirecto?"
            rows={3}
            className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-[#C9A84C] focus:outline-none resize-none"
          />
        </div>

        <div className="space-y-1.5">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Sugerencias</p>
          <div className="space-y-2">
            {SUGGESTED_QUERIES.map((q) => (
              <button
                key={q}
                onClick={() => onChange(q)}
                className={cn(
                  "w-full text-left rounded-lg border px-3 py-2.5 text-sm transition-colors",
                  query === q
                    ? "border-[#C9A84C] bg-[#C9A84C]/10 text-white"
                    : "border-white/10 bg-white/3 text-slate-400 hover:border-white/20 hover:text-white"
                )}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main wizard ───────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step data
  const [orgData, setOrgData] = useState({ name: "", type: "", rfc: "" });
  const [practiceAreas, setPracticeAreas] = useState<string[]>([]);
  const [inviteEmails, setInviteEmails] = useState<string[]>([]);
  const [firstQuery, setFirstQuery] = useState("");

  const isLastStep = step === 4;

  function canProceed() {
    if (step === 1) return orgData.name.trim().length >= 2 && orgData.type !== "";
    if (step === 2) return practiceAreas.length > 0;
    return true; // steps 3 and 4 are optional
  }

  async function handleFinish() {
    setSaving(true);
    setError(null);

    try {
      // Save org details
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgName: orgData.name,
          orgType: orgData.type,
          rfc: orgData.rfc || undefined,
          practiceAreas,
          inviteEmails,
        }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error?.message || "Error al guardar. Intenta de nuevo.");
        setSaving(false);
        return;
      }

      // If they have a first query, start a research session
      if (firstQuery.trim()) {
        const sessionRes = await fetch("/api/investigador/sesiones", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: firstQuery }),
        });
        const sessionData = await sessionRes.json();
        if (sessionData.success) {
          router.push(`/app/investigador/${sessionData.data.id}?query=${encodeURIComponent(firstQuery)}`);
          return;
        }
      }

      router.push("/app");
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0C1B2A] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="font-serif text-3xl text-white">Juris</span>
          <span className="h-6 w-px bg-[#C9A84C] inline-block mx-1.5 align-middle" />
          <span className="text-3xl font-light tracking-tight text-[#C9A84C]">AI</span>
          <p className="text-slate-500 text-sm mt-2">Configuración inicial</p>
        </div>

        {/* Progress steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, idx) => {
            const isComplete = step > s.id;
            const isCurrent = step === s.id;
            const Icon = s.icon;

            return (
              <div key={s.id} className="flex items-center">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all",
                      isComplete
                        ? "bg-[#C9A84C] border-[#C9A84C]"
                        : isCurrent
                        ? "border-[#C9A84C] bg-[#C9A84C]/15"
                        : "border-white/20 bg-white/5"
                    )}
                  >
                    {isComplete ? (
                      <Check className="h-4 w-4 text-[#0C1B2A]" />
                    ) : (
                      <Icon
                        className={cn(
                          "h-4 w-4",
                          isCurrent ? "text-[#C9A84C]" : "text-slate-500"
                        )}
                      />
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-xs hidden sm:block",
                      isCurrent ? "text-[#C9A84C]" : isComplete ? "text-slate-400" : "text-slate-600"
                    )}
                  >
                    {s.label}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "h-0.5 w-8 sm:w-12 mx-1 mb-5 transition-colors",
                      step > s.id ? "bg-[#C9A84C]" : "bg-white/10"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Step card */}
        <div className="rounded-2xl border border-white/10 bg-white/3 p-6 sm:p-8 shadow-2xl">
          {step === 1 && (
            <StepOrgDetails
              data={orgData}
              onChange={(d) => setOrgData((prev) => ({ ...prev, ...d }))}
            />
          )}
          {step === 2 && (
            <StepPracticeAreas selected={practiceAreas} onChange={setPracticeAreas} />
          )}
          {step === 3 && (
            <StepInviteTeam invites={inviteEmails} onChange={setInviteEmails} />
          )}
          {step === 4 && (
            <StepFirstQuery query={firstQuery} onChange={setFirstQuery} />
          )}

          {error && (
            <div className="mt-4 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/10">
            <button
              onClick={() => setStep((s) => s - 1)}
              disabled={step === 1}
              className={cn(
                "flex items-center gap-1.5 text-sm transition-colors",
                step === 1
                  ? "text-slate-700 cursor-not-allowed"
                  : "text-slate-400 hover:text-white"
              )}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </button>

            <div className="flex items-center gap-3">
              {step < 4 && (
                <button
                  onClick={() => setStep((s) => s + 1)}
                  className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
                >
                  Omitir
                </button>
              )}
              {isLastStep ? (
                <Button
                  onClick={handleFinish}
                  disabled={saving}
                  className="bg-[#C9A84C] hover:bg-[#b8943c] text-[#0C1B2A] font-semibold gap-2"
                >
                  {saving ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#0C1B2A] border-t-transparent" />
                      Configurando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      {firstQuery.trim() ? "Iniciar investigación" : "Entrar a JurisAI"}
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={() => setStep((s) => s + 1)}
                  disabled={!canProceed()}
                  className="bg-[#C9A84C] hover:bg-[#b8943c] text-[#0C1B2A] font-semibold gap-2 disabled:opacity-40"
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Skip all */}
        <div className="text-center mt-4">
          <button
            onClick={() => router.push("/app")}
            className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
          >
            Omitir configuración inicial → ir al dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
