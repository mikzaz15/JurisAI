"use client";

import { useTranslations } from "next-intl";
import { FileText, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface VariableField {
  key: string;
  label: string;
  type: "text" | "number" | "date";
  required: boolean;
}

interface Template {
  id: string;
  name: string;
  description: string | null;
  category: string;
  areaOfLaw: string | null;
  isSystem: boolean;
  variables?: { fields: VariableField[] } | null;
}

interface TemplatePickerProps {
  templates: Template[];
  selected: string | null;
  onSelect: (template: Template | null) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  CONTRACT: "Contratos",
  AMPARO_PETITION: "Amparo",
  CORPORATE_DEED: "Actas constitutivas",
  POWER_OF_ATTORNEY: "Poderes notariales",
  LEGAL_OPINION: "Opiniones jurídicas",
  MEMO: "Memorandos",
  COMPLAINT: "Demandas",
  MOTION: "Escritos judiciales",
  REGULATORY_FILING: "Trámites regulatorios",
  NDA: "Convenios de confidencialidad",
  EMPLOYMENT: "Contratos laborales",
  LEASE: "Arrendamiento",
  GENERAL: "General",
};

export function TemplatePicker({ templates, selected, onSelect }: TemplatePickerProps) {
  const t = useTranslations("documentos.wizard");
  const tp = useTranslations("plantillas");

  const grouped = templates.reduce<Record<string, Template[]>>((acc, tpl) => {
    const key = tpl.category;
    if (!acc[key]) acc[key] = [];
    acc[key].push(tpl);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Blank option */}
      <button
        onClick={() => onSelect(null)}
        className={cn(
          "w-full flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all",
          selected === null
            ? "border-[#C9A84C] bg-[#C9A84C]/5"
            : "border-gray-200 hover:border-gray-300"
        )}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">
          <FileText className="h-5 w-5 text-gray-500" />
        </div>
        <div>
          <p className="font-medium text-gray-900">{t("blank")}</p>
          <p className="text-sm text-gray-500">{t("blankDesc")}</p>
        </div>
      </button>

      {/* Grouped templates */}
      {Object.entries(grouped).map(([category, items]) => (
        <div key={category}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
            {CATEGORY_LABELS[category] ?? category.replace(/_/g, " ")}
          </h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {items.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => onSelect(tpl)}
                className={cn(
                  "flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all",
                  selected === tpl.id
                    ? "border-[#C9A84C] bg-[#C9A84C]/5"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0C1B2A]/10">
                  <Sparkles className="h-4 w-4 text-[#C9A84C]" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 leading-snug">{tpl.name}</p>
                  {tpl.description && (
                    <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">{tpl.description}</p>
                  )}
                  {tpl.isSystem && (
                    <span className="mt-1 inline-block text-[10px] text-[#C9A84C]">
                      {tp("systemTemplate")}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
