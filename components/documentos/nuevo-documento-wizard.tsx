"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TemplatePicker } from "@/components/plantillas/template-picker";
import { TemplateVariablesForm } from "@/components/plantillas/template-variables-form";

interface Template {
  id: string;
  name: string;
  description: string | null;
  category: string;
  areaOfLaw: string | null;
  isSystem: boolean;
  variables?: { fields: VariableField[] } | null;
}

interface VariableField {
  key: string;
  label: string;
  type: "text" | "number" | "date";
  required: boolean;
}

interface Matter {
  id: string;
  title: string;
}

interface NuevoDocumentoWizardProps {
  templates: Template[];
  matters: Matter[];
}

const DOC_TYPES = [
  "CONTRACT", "AMPARO_PETITION", "CORPORATE_DEED", "POWER_OF_ATTORNEY",
  "LEGAL_OPINION", "MEMO", "COMPLAINT", "MOTION", "REGULATORY_FILING",
  "NDA", "EMPLOYMENT", "LEASE", "GENERAL",
] as const;

export function NuevoDocumentoWizard({ templates, matters }: NuevoDocumentoWizardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultMatterId = searchParams.get("matterId") ?? "NONE";
  const t = useTranslations("documentos.wizard");
  const td = useTranslations("documentos");

  const [step, setStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null | undefined>(undefined); // undefined = not yet chosen
  const [docTitle, setDocTitle] = useState("");
  const [docType, setDocType] = useState("CONTRACT");
  const [matterId, setMatterId] = useState(defaultMatterId);
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTemplateSelect = (tpl: Template | null) => {
    setSelectedTemplate(tpl);
    if (tpl) {
      setDocType(tpl.category);
      setDocTitle(tpl.name);
    }
  };

  const handleVariableChange = (key: string, value: string) => {
    setVariables((prev) => ({ ...prev, [key]: value }));
  };

  const handleCreate = async () => {
    setCreating(true);
    setError(null);

    if (selectedTemplate) {
      // Use AI to generate from template
      const res = await fetch("/api/redactor/completar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          variables,
          matterId: matterId !== "NONE" ? matterId : null,
          title: docTitle || selectedTemplate.name,
        }),
      });
      const json = await res.json();
      if (json.success) {
        router.push(`/app/documentos/${json.data.documentId}`);
      } else {
        setError(json.error?.message ?? "Error al generar el documento");
        setCreating(false);
      }
    } else {
      // Blank document
      const res = await fetch("/api/documentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: docTitle || "Nuevo documento",
          type: docType,
          matterId: matterId !== "NONE" ? matterId : null,
        }),
      });
      const json = await res.json();
      if (json.success) {
        router.push(`/app/documentos/${json.data.document.id}`);
      } else {
        setError(json.error?.message ?? "Error al crear el documento");
        setCreating(false);
      }
    }
  };

  const isStep1Valid = selectedTemplate !== undefined;
  const fields: VariableField[] = selectedTemplate?.variables?.fields ?? [];

  return (
    <div className="mx-auto max-w-3xl">
      {/* Step indicator */}
      <div className="mb-8 flex items-center gap-2">
        <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${step >= 1 ? "bg-[#C9A84C] text-[#0C1B2A]" : "bg-gray-200 text-gray-500"}`}>1</div>
        <div className={`h-0.5 flex-1 ${step >= 2 ? "bg-[#C9A84C]" : "bg-gray-200"}`} />
        <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${step >= 2 ? "bg-[#C9A84C] text-[#0C1B2A]" : "bg-gray-200 text-gray-500"}`}>2</div>
      </div>

      {step === 1 && (
        <div>
          <h2 className="mb-1 font-serif text-xl text-gray-900">{t("step1Title")}</h2>
          <p className="mb-6 text-sm text-gray-500">{t("step1Desc")}</p>
          <TemplatePicker
            templates={templates}
            selected={selectedTemplate === null ? null : selectedTemplate?.id ?? null}
            onSelect={handleTemplateSelect}
          />
          <div className="mt-6 flex justify-end">
            <Button
              disabled={!isStep1Valid}
              onClick={() => setStep(2)}
            >
              {t("next")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <h2 className="mb-1 font-serif text-xl text-gray-900">{t("step2Title")}</h2>
          <p className="mb-6 text-sm text-gray-500">{t("step2Desc")}</p>

          <div className="space-y-5">
            {/* Title */}
            <div className="space-y-1.5">
              <Label>{t("titleLabel")}</Label>
              <Input
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                placeholder={t("titlePlaceholder")}
              />
            </div>

            {/* Type (only for blank) */}
            {selectedTemplate === null && (
              <div className="space-y-1.5">
                <Label>{t("typeLabel")}</Label>
                <Select value={docType} onValueChange={setDocType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DOC_TYPES.map((dt) => (
                      <SelectItem key={dt} value={dt}>
                        {td(`types.${dt}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Matter */}
            <div className="space-y-1.5">
              <Label>{t("matterLabel")}</Label>
              <Select value={matterId} onValueChange={setMatterId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">{t("noMatter")}</SelectItem>
                  {matters.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Template variables */}
            {selectedTemplate && fields.length > 0 && (
              <div className="rounded-xl border border-[#C9A84C]/30 bg-[#C9A84C]/5 p-4">
                <h3 className="mb-3 text-sm font-semibold text-gray-900">
                  {t("variables")}
                </h3>
                <TemplateVariablesForm
                  fields={fields}
                  values={variables}
                  onChange={handleVariableChange}
                />
              </div>
            )}
          </div>

          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

          <div className="mt-6 flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setStep(1)}
              disabled={creating}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("back")}
            </Button>
            <Button
              onClick={handleCreate}
              disabled={creating || !docTitle.trim()}
            >
              {creating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("creating")}
                </>
              ) : selectedTemplate ? (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  {t("generateWithAI")}
                </>
              ) : (
                t("create")
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
