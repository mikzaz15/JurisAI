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
    <div className="flex h-full flex-col items-center justify-center px-6 py-12">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-[#0C1B2A]">
        <Search className="h-10 w-10 text-[#C9A84C]" />
      </div>

      <h2 className="font-serif text-2xl text-gray-900">Investigador JurisAI</h2>
      <p className="mt-2 max-w-md text-center text-sm text-gray-500">
        Haz cualquier consulta legal en lenguaje natural. Busco en códigos,
        leyes y jurisprudencia mexicana y cito cada afirmación.
      </p>

      <div className="mt-8 w-full max-w-lg">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-400">
          Consultas de ejemplo
        </p>
        <div className="space-y-2">
          {EXAMPLE_QUERIES.map((q) => (
            <button
              key={q}
              onClick={() => onQuerySelect(q)}
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-left text-sm text-gray-700 transition-all hover:border-[#C9A84C]/40 hover:bg-[#C9A84C]/5 hover:text-gray-900"
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
