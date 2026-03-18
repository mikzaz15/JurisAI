"use client";

import { Search } from "lucide-react";

const EXAMPLE_QUERIES = [
  "¿Cuál es el plazo de prescripción para una acción por daño moral?",
  "¿Cuáles son los requisitos para constituir una SA de CV?",
  "¿En qué casos procede el amparo indirecto?",
  "¿Cómo se calcula la liquidación por despido injustificado?",
  "¿Qué obligaciones fiscales tiene un representante legal?",
];

interface EmptyStateProps {
  onQuerySelect: (query: string) => void;
}

export function EmptyState({ onQuerySelect }: EmptyStateProps) {
  return (
    <div className="flex min-h-full px-6 py-10 md:px-10 md:py-14">
      <div className="m-auto w-full max-w-4xl">
        <div className="rounded-[28px] border border-slate-200/80 bg-white/88 px-8 py-10 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-sm md:px-12 md:py-12">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-[#0C1B2A] shadow-lg shadow-[#0C1B2A]/20">
              <Search className="h-10 w-10 text-[#C9A84C]" />
            </div>

            <h2 className="font-serif text-3xl text-slate-900 md:text-4xl">
              Investigador JurisAI
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-600 md:text-base">
              Haz cualquier consulta legal en lenguaje natural. JurisAI busca en códigos, leyes y
              jurisprudencia mexicana y devuelve una respuesta citada que puedes seguir refinando.
            </p>
          </div>

          <div className="mx-auto mt-10 w-full max-w-2xl">
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.24em] text-slate-400">
          Consultas de ejemplo
            </p>
            <div className="space-y-3">
              {EXAMPLE_QUERIES.map((q) => (
                <button
                  key={q}
                  onClick={() => onQuerySelect(q)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-left text-sm text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#C9A84C]/40 hover:bg-[#C9A84C]/5 hover:text-slate-900"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
