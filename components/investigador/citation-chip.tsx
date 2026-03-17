"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ExternalLink, X } from "lucide-react";

interface CitationChipProps {
  citation: string;
}

export function CitationChip({ citation }: CitationChipProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <span className="relative inline-block">
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs font-mono font-medium transition-all",
          "border-[#C9A84C]/40 bg-[#C9A84C]/10 text-[#8a6e2a] hover:bg-[#C9A84C]/20 hover:border-[#C9A84C]/60",
          expanded && "bg-[#C9A84C]/20 border-[#C9A84C]/60"
        )}
        title={`Ver fuente: ${citation}`}
      >
        {citation}
      </button>

      {expanded && (
        <CitationPopover citation={citation} onClose={() => setExpanded(false)} />
      )}
    </span>
  );
}

function CitationPopover({
  citation,
  onClose,
}: {
  citation: string;
  onClose: () => void;
}) {
  const searchUrl = buildSearchUrl(citation);

  return (
    <div
      className={cn(
        "absolute bottom-full left-0 z-50 mb-2 w-72 rounded-lg border border-[#C9A84C]/30",
        "bg-white p-3 shadow-lg"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="mb-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Fuente Legal
          </p>
          <p className="font-mono text-sm font-medium text-gray-900">{citation}</p>
          <p className="mt-1.5 text-xs text-gray-500">
            {describeCitation(citation)}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 mt-0.5"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {searchUrl && (
        <a
          href={searchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 flex items-center gap-1 text-xs text-[#C9A84C] hover:underline"
        >
          <ExternalLink className="h-3 w-3" />
          Buscar en fuente oficial
        </a>
      )}
    </div>
  );
}

function describeCitation(citation: string): string {
  if (citation.includes("CPEUM") || citation.includes("Constitución"))
    return "Constitución Política de los Estados Unidos Mexicanos";
  if (citation.includes("CCF")) return "Código Civil Federal";
  if (citation.includes("LFT")) return "Ley Federal del Trabajo";
  if (citation.includes("CFF")) return "Código Fiscal de la Federación";
  if (citation.includes("LISR")) return "Ley del Impuesto Sobre la Renta";
  if (citation.includes("LIVA")) return "Ley del Impuesto al Valor Agregado";
  if (citation.includes("LGSM")) return "Ley General de Sociedades Mercantiles";
  if (citation.includes("LA")) return "Ley de Amparo";
  if (citation.includes("CNPP")) return "Código Nacional de Procedimientos Penales";
  if (citation.includes("CCo")) return "Código de Comercio";
  if (citation.includes("CPF")) return "Código Penal Federal";
  if (citation.includes("CFPC")) return "Código Federal de Procedimientos Civiles";
  if (citation.includes("SCJN") || citation.includes("Jurisprudencia") || citation.includes("Tesis"))
    return "Suprema Corte de Justicia de la Nación";
  if (citation.includes("DOF")) return "Diario Oficial de la Federación";
  if (citation.includes("T-MEC") || citation.includes("USMCA"))
    return "Tratado entre México, Estados Unidos y Canadá";
  return "Fuente del derecho mexicano";
}

function buildSearchUrl(citation: string): string | null {
  if (citation.includes("SCJN") || citation.includes("Jurisprudencia") || citation.includes("Tesis")) {
    return "https://sjf2.scjn.gob.mx/busqueda-principal-tesis";
  }
  if (citation.includes("DOF")) {
    return "https://www.dof.gob.mx/";
  }
  if (
    citation.includes("CCF") || citation.includes("LFT") || citation.includes("CFF") ||
    citation.includes("CPEUM") || citation.includes("LGSM") || citation.includes("LA")
  ) {
    const lawMap: Record<string, string> = {
      CPEUM: "https://www.diputados.gob.mx/LeyesBiblio/pdf/CPEUM.pdf",
      CCF: "https://www.diputados.gob.mx/LeyesBiblio/pdf/CCF.pdf",
      LFT: "https://www.diputados.gob.mx/LeyesBiblio/pdf/LFT.pdf",
      CFF: "https://www.diputados.gob.mx/LeyesBiblio/pdf/CFF.pdf",
      LISR: "https://www.diputados.gob.mx/LeyesBiblio/pdf/LISR.pdf",
      LIVA: "https://www.diputados.gob.mx/LeyesBiblio/pdf/LIVA.pdf",
      LGSM: "https://www.diputados.gob.mx/LeyesBiblio/pdf/LGSM.pdf",
      LA: "https://www.diputados.gob.mx/LeyesBiblio/pdf/LA.pdf",
      CNPP: "https://www.diputados.gob.mx/LeyesBiblio/pdf/CNPP.pdf",
    };
    for (const [abbrev, url] of Object.entries(lawMap)) {
      if (citation.includes(abbrev)) return url;
    }
  }
  return "https://www.diputados.gob.mx/LeyesBiblio/index.htm";
}
